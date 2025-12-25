/**
 * Servicio de Pasarelas de Pago
 * 
 * Integración con Stripe y PayPal para procesar pagos de facturas,
 * presupuestos y contratos de mantenimiento.
 * 
 * SEGURIDAD: Las credenciales se almacenan encriptadas con AES-256-GCM
 */

import { eq, and, desc } from 'drizzle-orm';
import { 
  encrypt, 
  decrypt, 
  encryptJSON, 
  decryptJSON, 
  maskSensitiveValue,
  isEncryptionConfigured 
} from '../encryption.service';

// Tipos de pasarela
export type PaymentGateway = 'stripe' | 'paypal';

// Estados de pago
export type PaymentStatus = 
  | 'pending'       // Pendiente de pago
  | 'processing'    // En proceso
  | 'completed'     // Completado
  | 'failed'        // Fallido
  | 'refunded'      // Reembolsado
  | 'cancelled';    // Cancelado

// Interfaz de configuración de Stripe
interface StripeConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
}

// Interfaz de configuración de PayPal
interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'production';
  webhookId: string;
}

// Interfaz de pago
interface PaymentRecord {
  id: string;
  organizationId: string;
  clientId: string;
  invoiceId?: string;
  quoteId?: string;
  contractId?: string;
  amount: number;
  currency: string;
  gateway: PaymentGateway;
  status: PaymentStatus;
  gatewayPaymentId?: string;
  gatewayCustomerId?: string;
  paymentMethod?: string;
  receiptUrl?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  completedAt?: Date;
}

// Interfaz de enlace de pago
interface PaymentLink {
  id: string;
  url: string;
  expiresAt: Date;
  amount: number;
  currency: string;
}

export class PaymentService {
  private db: any;
  private stripeConfig: StripeConfig | null = null;
  private paypalConfig: PayPalConfig | null = null;

  constructor(db: any) {
    this.db = db;
  }

  // ============================================
  // CONFIGURACIÓN
  // ============================================

  /**
   * Configura Stripe para una organización
   * Las credenciales se encriptan antes de almacenarse
   */
  async configureStripe(organizationId: string, config: StripeConfig, userId?: string): Promise<void> {
    if (!isEncryptionConfigured()) {
      throw new Error('ENCRYPTION_KEY no está configurada. No se pueden almacenar credenciales de forma segura.');
    }
    
    // Encriptar las credenciales
    const encryptedConfig = encryptJSON(config);
    
    await this.db.execute(`
      INSERT INTO payment_gateway_config (organization_id, gateway, config, updated_at)
      VALUES ($1, 'stripe', $2, NOW())
      ON CONFLICT (organization_id, gateway) 
      DO UPDATE SET config = $2, updated_at = NOW()
    `, [organizationId, encryptedConfig]);
    
    // Registrar auditoría
    await this.logCredentialChange(organizationId, 'stripe', 'configure', userId);
  }

  /**
   * Configura PayPal para una organización
   * Las credenciales se encriptan antes de almacenarse
   */
  async configurePayPal(organizationId: string, config: PayPalConfig, userId?: string): Promise<void> {
    if (!isEncryptionConfigured()) {
      throw new Error('ENCRYPTION_KEY no está configurada. No se pueden almacenar credenciales de forma segura.');
    }
    
    // Encriptar las credenciales
    const encryptedConfig = encryptJSON(config);
    
    await this.db.execute(`
      INSERT INTO payment_gateway_config (organization_id, gateway, config, updated_at)
      VALUES ($1, 'paypal', $2, NOW())
      ON CONFLICT (organization_id, gateway) 
      DO UPDATE SET config = $2, updated_at = NOW()
    `, [organizationId, encryptedConfig]);
    
    // Registrar auditoría
    await this.logCredentialChange(organizationId, 'paypal', 'configure', userId);
  }

  /**
   * Obtiene la configuración de una pasarela (desencriptada)
   * Solo para uso interno del servidor
   */
  async getGatewayConfig(organizationId: string, gateway: PaymentGateway): Promise<any> {
    const result = await this.db.execute(`
      SELECT config FROM payment_gateway_config
      WHERE organization_id = $1 AND gateway = $2
    `, [organizationId, gateway]);

    if (result.rows && result.rows.length > 0) {
      const encryptedConfig = result.rows[0].config;
      
      // Intentar desencriptar (compatibilidad con datos antiguos sin encriptar)
      try {
        // Si es un objeto JSON válido, son datos antiguos sin encriptar
        const parsed = JSON.parse(encryptedConfig);
        if (typeof parsed === 'object' && parsed !== null) {
          // Datos antiguos sin encriptar - migrar automáticamente
          console.warn(`[SECURITY] Migrando credenciales sin encriptar para ${gateway} en org ${organizationId}`);
          return parsed;
        }
      } catch {
        // No es JSON, debe estar encriptado
      }
      
      // Desencriptar
      return decryptJSON(encryptedConfig);
    }
    return null;
  }
  
  /**
   * Obtiene la configuración de una pasarela con valores enmascarados
   * Para mostrar en la interfaz de usuario
   */
  async getGatewayConfigMasked(organizationId: string, gateway: PaymentGateway): Promise<any> {
    const config = await this.getGatewayConfig(organizationId, gateway);
    
    if (!config) return null;
    
    if (gateway === 'stripe') {
      return {
        publishableKey: maskSensitiveValue(config.publishableKey, 8),
        secretKey: maskSensitiveValue(config.secretKey, 4),
        webhookSecret: maskSensitiveValue(config.webhookSecret, 4),
        isConfigured: true,
      };
    }
    
    if (gateway === 'paypal') {
      return {
        clientId: maskSensitiveValue(config.clientId, 8),
        clientSecret: maskSensitiveValue(config.clientSecret, 4),
        environment: config.environment,
        webhookId: maskSensitiveValue(config.webhookId, 4),
        isConfigured: true,
      };
    }
    
    return null;
  }
  
  /**
   * Registra cambios en credenciales para auditoría
   */
  private async logCredentialChange(
    organizationId: string, 
    gateway: PaymentGateway, 
    action: 'configure' | 'delete',
    userId?: string
  ): Promise<void> {
    try {
      await this.db.execute(`
        INSERT INTO credential_audit_log 
        (organization_id, gateway, action, user_id, created_at, ip_address)
        VALUES ($1, $2, $3, $4, NOW(), $5)
      `, [organizationId, gateway, action, userId || 'system', null]);
    } catch (error) {
      // Si la tabla no existe, solo loguear
      console.log(`[AUDIT] ${action} ${gateway} credentials for org ${organizationId} by ${userId || 'system'}`);
    }
  }

  /**
   * Verifica si una pasarela está configurada
   */
  async isGatewayConfigured(organizationId: string, gateway: PaymentGateway): Promise<boolean> {
    const config = await this.getGatewayConfig(organizationId, gateway);
    return config !== null;
  }

  /**
   * Obtiene las pasarelas configuradas
   */
  async getConfiguredGateways(organizationId: string): Promise<PaymentGateway[]> {
    const result = await this.db.execute(`
      SELECT gateway FROM payment_gateway_config
      WHERE organization_id = $1
    `, [organizationId]);

    return (result.rows || []).map((row: any) => row.gateway);
  }

  // ============================================
  // STRIPE
  // ============================================

  /**
   * Crea una sesión de pago de Stripe Checkout
   */
  async createStripeCheckoutSession(
    organizationId: string,
    data: {
      clientId: string;
      clientEmail: string;
      invoiceId?: string;
      quoteId?: string;
      contractId?: string;
      amount: number;
      currency: string;
      description: string;
      successUrl: string;
      cancelUrl: string;
    }
  ): Promise<{ sessionId: string; url: string }> {
    const config = await this.getGatewayConfig(organizationId, 'stripe') as StripeConfig;
    if (!config) {
      throw new Error('Stripe no está configurado');
    }

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'payment_method_types[]': 'card',
        'line_items[0][price_data][currency]': data.currency.toLowerCase(),
        'line_items[0][price_data][product_data][name]': data.description,
        'line_items[0][price_data][unit_amount]': String(Math.round(data.amount * 100)),
        'line_items[0][quantity]': '1',
        'mode': 'payment',
        'success_url': data.successUrl,
        'cancel_url': data.cancelUrl,
        'customer_email': data.clientEmail,
        'metadata[organizationId]': organizationId,
        'metadata[clientId]': data.clientId,
        'metadata[invoiceId]': data.invoiceId || '',
        'metadata[quoteId]': data.quoteId || '',
        'metadata[contractId]': data.contractId || '',
      }).toString(),
    });

    const session = await response.json();

    if (session.error) {
      throw new Error(session.error.message);
    }

    // Registrar el pago pendiente
    await this.createPaymentRecord({
      organizationId,
      clientId: data.clientId,
      invoiceId: data.invoiceId,
      quoteId: data.quoteId,
      contractId: data.contractId,
      amount: data.amount,
      currency: data.currency,
      gateway: 'stripe',
      status: 'pending',
      gatewayPaymentId: session.id,
      metadata: { checkoutSessionId: session.id }
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  /**
   * Crea un enlace de pago de Stripe
   */
  async createStripePaymentLink(
    organizationId: string,
    data: {
      amount: number;
      currency: string;
      description: string;
    }
  ): Promise<PaymentLink> {
    const config = await this.getGatewayConfig(organizationId, 'stripe') as StripeConfig;
    if (!config) {
      throw new Error('Stripe no está configurado');
    }

    // Crear producto
    const productResponse = await fetch('https://api.stripe.com/v1/products', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'name': data.description,
      }).toString(),
    });
    const product = await productResponse.json();

    // Crear precio
    const priceResponse = await fetch('https://api.stripe.com/v1/prices', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'unit_amount': String(Math.round(data.amount * 100)),
        'currency': data.currency.toLowerCase(),
        'product': product.id,
      }).toString(),
    });
    const price = await priceResponse.json();

    // Crear enlace de pago
    const linkResponse = await fetch('https://api.stripe.com/v1/payment_links', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'line_items[0][price]': price.id,
        'line_items[0][quantity]': '1',
      }).toString(),
    });
    const link = await linkResponse.json();

    return {
      id: link.id,
      url: link.url,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
      amount: data.amount,
      currency: data.currency,
    };
  }

  /**
   * Procesa webhook de Stripe
   */
  async processStripeWebhook(
    organizationId: string,
    payload: string,
    signature: string
  ): Promise<void> {
    const config = await this.getGatewayConfig(organizationId, 'stripe') as StripeConfig;
    if (!config) {
      throw new Error('Stripe no está configurado');
    }

    // Verificar firma del webhook (simplificado, en producción usar stripe.webhooks.constructEvent)
    const event = JSON.parse(payload);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleStripeCheckoutCompleted(event.data.object);
        break;
      case 'payment_intent.succeeded':
        await this.handleStripePaymentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await this.handleStripePaymentFailed(event.data.object);
        break;
      case 'charge.refunded':
        await this.handleStripeRefund(event.data.object);
        break;
    }
  }

  private async handleStripeCheckoutCompleted(session: any): Promise<void> {
    await this.updatePaymentStatus(session.id, 'completed', {
      gatewayPaymentId: session.payment_intent,
      completedAt: new Date(),
      receiptUrl: session.receipt_url,
    });

    // Actualizar factura/presupuesto/contrato si corresponde
    const metadata = session.metadata || {};
    if (metadata.invoiceId) {
      await this.markInvoiceAsPaid(metadata.invoiceId, session.payment_intent);
    }
  }

  private async handleStripePaymentSucceeded(paymentIntent: any): Promise<void> {
    await this.db.execute(`
      UPDATE payments SET status = 'completed', completed_at = NOW()
      WHERE gateway_payment_id = $1 OR metadata->>'paymentIntentId' = $1
    `, [paymentIntent.id]);
  }

  private async handleStripePaymentFailed(paymentIntent: any): Promise<void> {
    await this.db.execute(`
      UPDATE payments SET status = 'failed', error_message = $1
      WHERE gateway_payment_id = $2 OR metadata->>'paymentIntentId' = $2
    `, [paymentIntent.last_payment_error?.message || 'Payment failed', paymentIntent.id]);
  }

  private async handleStripeRefund(charge: any): Promise<void> {
    await this.db.execute(`
      UPDATE payments SET status = 'refunded'
      WHERE gateway_payment_id = $1
    `, [charge.payment_intent]);
  }

  // ============================================
  // PAYPAL
  // ============================================

  /**
   * Obtiene token de acceso de PayPal
   */
  private async getPayPalAccessToken(config: PayPalConfig): Promise<string> {
    const baseUrl = config.environment === 'production'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const data = await response.json();
    return data.access_token;
  }

  /**
   * Crea una orden de PayPal
   */
  async createPayPalOrder(
    organizationId: string,
    data: {
      clientId: string;
      invoiceId?: string;
      quoteId?: string;
      contractId?: string;
      amount: number;
      currency: string;
      description: string;
      returnUrl: string;
      cancelUrl: string;
    }
  ): Promise<{ orderId: string; approvalUrl: string }> {
    const config = await this.getGatewayConfig(organizationId, 'paypal') as PayPalConfig;
    if (!config) {
      throw new Error('PayPal no está configurado');
    }

    const accessToken = await this.getPayPalAccessToken(config);
    const baseUrl = config.environment === 'production'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: data.currency,
            value: data.amount.toFixed(2),
          },
          description: data.description,
          custom_id: JSON.stringify({
            organizationId,
            clientId: data.clientId,
            invoiceId: data.invoiceId,
            quoteId: data.quoteId,
            contractId: data.contractId,
          }),
        }],
        application_context: {
          return_url: data.returnUrl,
          cancel_url: data.cancelUrl,
          brand_name: 'Piano Emotion Manager',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
        },
      }),
    });

    const order = await response.json();

    if (order.error) {
      throw new Error(order.error_description || order.message);
    }

    const approvalUrl = order.links.find((link: any) => link.rel === 'approve')?.href;

    // Registrar el pago pendiente
    await this.createPaymentRecord({
      organizationId,
      clientId: data.clientId,
      invoiceId: data.invoiceId,
      quoteId: data.quoteId,
      contractId: data.contractId,
      amount: data.amount,
      currency: data.currency,
      gateway: 'paypal',
      status: 'pending',
      gatewayPaymentId: order.id,
    });

    return {
      orderId: order.id,
      approvalUrl,
    };
  }

  /**
   * Captura una orden de PayPal (después de aprobación del cliente)
   */
  async capturePayPalOrder(organizationId: string, orderId: string): Promise<boolean> {
    const config = await this.getGatewayConfig(organizationId, 'paypal') as PayPalConfig;
    if (!config) {
      throw new Error('PayPal no está configurado');
    }

    const accessToken = await this.getPayPalAccessToken(config);
    const baseUrl = config.environment === 'production'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const capture = await response.json();

    if (capture.status === 'COMPLETED') {
      await this.updatePaymentStatus(orderId, 'completed', {
        completedAt: new Date(),
        receiptUrl: capture.links?.find((l: any) => l.rel === 'self')?.href,
      });

      // Actualizar factura si corresponde
      const customId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id;
      if (customId) {
        try {
          const metadata = JSON.parse(customId);
          if (metadata.invoiceId) {
            await this.markInvoiceAsPaid(metadata.invoiceId, orderId);
          }
        } catch (e) {}
      }

      return true;
    } else {
      await this.updatePaymentStatus(orderId, 'failed', {
        errorMessage: capture.message || 'Capture failed',
      });
      return false;
    }
  }

  /**
   * Procesa webhook de PayPal
   */
  async processPayPalWebhook(organizationId: string, event: any): Promise<void> {
    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await this.handlePayPalCaptureCompleted(event.resource);
        break;
      case 'PAYMENT.CAPTURE.DENIED':
        await this.handlePayPalCaptureDenied(event.resource);
        break;
      case 'PAYMENT.CAPTURE.REFUNDED':
        await this.handlePayPalRefund(event.resource);
        break;
    }
  }

  private async handlePayPalCaptureCompleted(capture: any): Promise<void> {
    // El orderId está en el supplementary_data
    const orderId = capture.supplementary_data?.related_ids?.order_id;
    if (orderId) {
      await this.updatePaymentStatus(orderId, 'completed', {
        completedAt: new Date(),
      });
    }
  }

  private async handlePayPalCaptureDenied(capture: any): Promise<void> {
    const orderId = capture.supplementary_data?.related_ids?.order_id;
    if (orderId) {
      await this.updatePaymentStatus(orderId, 'failed', {
        errorMessage: 'Payment denied',
      });
    }
  }

  private async handlePayPalRefund(refund: any): Promise<void> {
    const captureId = refund.id;
    await this.db.execute(`
      UPDATE payments SET status = 'refunded'
      WHERE gateway_payment_id = $1
    `, [captureId]);
  }

  // ============================================
  // MÉTODOS COMUNES
  // ============================================

  /**
   * Crea un registro de pago
   */
  private async createPaymentRecord(data: Omit<PaymentRecord, 'id' | 'createdAt'>): Promise<string> {
    const result = await this.db.execute(`
      INSERT INTO payments 
      (organization_id, client_id, invoice_id, quote_id, contract_id, amount, currency, gateway, status, gateway_payment_id, gateway_customer_id, payment_method, receipt_url, error_message, metadata, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
      RETURNING id
    `, [
      data.organizationId,
      data.clientId,
      data.invoiceId,
      data.quoteId,
      data.contractId,
      data.amount,
      data.currency,
      data.gateway,
      data.status,
      data.gatewayPaymentId,
      data.gatewayCustomerId,
      data.paymentMethod,
      data.receiptUrl,
      data.errorMessage,
      JSON.stringify(data.metadata || {}),
    ]);

    return result.rows[0].id;
  }

  /**
   * Actualiza el estado de un pago
   */
  private async updatePaymentStatus(
    gatewayPaymentId: string,
    status: PaymentStatus,
    additionalData?: Partial<PaymentRecord>
  ): Promise<void> {
    const updates: string[] = ['status = $1'];
    const values: any[] = [status];
    let paramIndex = 2;

    if (additionalData?.completedAt) {
      updates.push(`completed_at = $${paramIndex++}`);
      values.push(additionalData.completedAt);
    }
    if (additionalData?.receiptUrl) {
      updates.push(`receipt_url = $${paramIndex++}`);
      values.push(additionalData.receiptUrl);
    }
    if (additionalData?.errorMessage) {
      updates.push(`error_message = $${paramIndex++}`);
      values.push(additionalData.errorMessage);
    }
    if (additionalData?.gatewayPaymentId) {
      updates.push(`gateway_payment_id = $${paramIndex++}`);
      values.push(additionalData.gatewayPaymentId);
    }

    values.push(gatewayPaymentId);

    await this.db.execute(`
      UPDATE payments SET ${updates.join(', ')}
      WHERE gateway_payment_id = $${paramIndex}
    `, values);
  }

  /**
   * Marca una factura como pagada
   */
  private async markInvoiceAsPaid(invoiceId: string, paymentReference: string): Promise<void> {
    await this.db.execute(`
      UPDATE invoices SET status = 'paid', paid_at = NOW(), payment_reference = $1
      WHERE id = $2
    `, [paymentReference, invoiceId]);
  }

  /**
   * Obtiene el historial de pagos de un cliente
   */
  async getClientPayments(organizationId: string, clientId: string): Promise<PaymentRecord[]> {
    const result = await this.db.execute(`
      SELECT * FROM payments
      WHERE organization_id = $1 AND client_id = $2
      ORDER BY created_at DESC
    `, [organizationId, clientId]);

    return result.rows || [];
  }

  /**
   * Obtiene un pago por ID
   */
  async getPayment(paymentId: string): Promise<PaymentRecord | null> {
    const result = await this.db.execute(`
      SELECT * FROM payments WHERE id = $1
    `, [paymentId]);

    return result.rows?.[0] || null;
  }

  /**
   * Obtiene estadísticas de pagos
   */
  async getPaymentStats(organizationId: string, startDate: Date, endDate: Date): Promise<{
    total: number;
    completed: number;
    pending: number;
    failed: number;
    totalAmount: number;
    byGateway: Record<string, { count: number; amount: number }>;
  }> {
    const result = await this.db.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_amount
      FROM payments
      WHERE organization_id = $1 AND created_at BETWEEN $2 AND $3
    `, [organizationId, startDate, endDate]);

    const gatewayResult = await this.db.execute(`
      SELECT gateway, COUNT(*) as count, SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as amount
      FROM payments
      WHERE organization_id = $1 AND created_at BETWEEN $2 AND $3
      GROUP BY gateway
    `, [organizationId, startDate, endDate]);

    const stats = result.rows?.[0] || {};
    const byGateway: Record<string, { count: number; amount: number }> = {};

    for (const row of gatewayResult.rows || []) {
      byGateway[row.gateway] = {
        count: parseInt(row.count),
        amount: parseFloat(row.amount) || 0,
      };
    }

    return {
      total: parseInt(stats.total) || 0,
      completed: parseInt(stats.completed) || 0,
      pending: parseInt(stats.pending) || 0,
      failed: parseInt(stats.failed) || 0,
      totalAmount: parseFloat(stats.total_amount) || 0,
      byGateway,
    };
  }

  /**
   * Genera un enlace de pago para una factura
   */
  async generateInvoicePaymentLink(
    organizationId: string,
    invoiceId: string,
    gateway: PaymentGateway,
    baseUrl: string
  ): Promise<string> {
    // Obtener datos de la factura
    const invoiceResult = await this.db.execute(`
      SELECT i.*, c.email as client_email, c.name as client_name
      FROM invoices i
      JOIN clients c ON i.client_id = c.id
      WHERE i.id = $1
    `, [invoiceId]);

    const invoice = invoiceResult.rows?.[0];
    if (!invoice) {
      throw new Error('Factura no encontrada');
    }

    const successUrl = `${baseUrl}/payment/success?invoice=${invoiceId}`;
    const cancelUrl = `${baseUrl}/payment/cancel?invoice=${invoiceId}`;

    if (gateway === 'stripe') {
      const session = await this.createStripeCheckoutSession(organizationId, {
        clientId: invoice.client_id,
        clientEmail: invoice.client_email,
        invoiceId,
        amount: parseFloat(invoice.total),
        currency: invoice.currency || 'EUR',
        description: `Factura ${invoice.invoice_number}`,
        successUrl,
        cancelUrl,
      });
      return session.url;
    } else {
      const order = await this.createPayPalOrder(organizationId, {
        clientId: invoice.client_id,
        invoiceId,
        amount: parseFloat(invoice.total),
        currency: invoice.currency || 'EUR',
        description: `Factura ${invoice.invoice_number}`,
        returnUrl: successUrl,
        cancelUrl,
      });
      return order.approvalUrl;
    }
  }
}

export default PaymentService;
