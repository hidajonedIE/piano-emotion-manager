/**
 * Making Tax Digital (MTD) Service for United Kingdom
 * 
 * This service implements the HMRC MTD VAT API for digital record keeping
 * and VAT return submission in compliance with UK tax regulations.
 * 
 * Key Features:
 * - VAT obligations retrieval
 * - VAT return submission
 * - VAT liabilities and payments tracking
 * - Fraud prevention headers
 * - OAuth 2.0 authentication with HMRC
 * 
 * API Documentation: https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/vat-api/1.0
 * 
 * @author Piano Emotion Manager
 * @version 1.0.0
 */

import { BaseEInvoicingService, EInvoice, EInvoiceResult, CountryConfig } from '../base.service.js';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * UK-specific configuration for MTD
 */
export interface UKMTDConfig {
  /** VAT Registration Number (9 digits) */
  vrn: string;
  /** Companies House registration number */
  companyNumber?: string;
  /** OAuth client ID from HMRC Developer Hub */
  clientId: string;
  /** OAuth client secret from HMRC Developer Hub */
  clientSecret: string;
  /** Software ID assigned by HMRC */
  softwareId: string;
  /** Software version */
  softwareVersion: string;
  /** Whether to use sandbox environment */
  sandbox: boolean;
  /** Access token for API calls */
  accessToken?: string;
  /** Refresh token for token renewal */
  refreshToken?: string;
  /** Token expiry timestamp */
  tokenExpiry?: number;
}

/**
 * VAT obligation period
 */
export interface VATObligation {
  /** Start date of the period (YYYY-MM-DD) */
  start: string;
  /** End date of the period (YYYY-MM-DD) */
  end: string;
  /** Due date for submission (YYYY-MM-DD) */
  due: string;
  /** Status: O = Open, F = Fulfilled */
  status: 'O' | 'F';
  /** Period key for submission */
  periodKey: string;
  /** Date received (if fulfilled) */
  received?: string;
}

/**
 * VAT return data structure
 */
export interface VATReturn {
  /** Period key (4 alphanumeric characters) */
  periodKey: string;
  /** VAT due on sales and other outputs */
  vatDueSales: number;
  /** VAT due on acquisitions from other EC Member States */
  vatDueAcquisitions: number;
  /** Total VAT due (sum of above) */
  totalVatDue: number;
  /** VAT reclaimed in the period on purchases and other inputs */
  vatReclaimedCurrPeriod: number;
  /** Net VAT to be paid or reclaimed (absolute difference) */
  netVatDue: number;
  /** Total value of sales and all other outputs excluding VAT */
  totalValueSalesExVAT: number;
  /** Total value of purchases and all other inputs excluding VAT */
  totalValuePurchasesExVAT: number;
  /** Total value of all supplies of goods and related costs to EC Member States */
  totalValueGoodsSuppliedExVAT: number;
  /** Total value of acquisitions of goods and related costs from EC Member States */
  totalAcquisitionsExVAT: number;
  /** Declaration that information is true and complete */
  finalised: boolean;
}

/**
 * VAT liability record
 */
export interface VATLiability {
  /** Tax period from date */
  taxPeriod: {
    from: string;
    to: string;
  };
  /** Type of charge */
  type: string;
  /** Original amount due */
  originalAmount: number;
  /** Outstanding amount */
  outstandingAmount: number;
  /** Due date */
  due: string;
}

/**
 * VAT payment record
 */
export interface VATPayment {
  /** Amount paid */
  amount: number;
  /** Date received */
  received: string;
}

/**
 * Fraud prevention headers required by HMRC
 */
export interface FraudPreventionHeaders {
  /** Connection method (e.g., DESKTOP_APP_DIRECT) */
  'Gov-Client-Connection-Method': string;
  /** Device ID */
  'Gov-Client-Device-ID': string;
  /** User IDs */
  'Gov-Client-User-IDs': string;
  /** Timezone */
  'Gov-Client-Timezone': string;
  /** Local IPs */
  'Gov-Client-Local-IPs': string;
  /** MAC addresses */
  'Gov-Client-MAC-Addresses'?: string;
  /** User agent */
  'Gov-Client-User-Agent': string;
  /** Multi-factor authentication */
  'Gov-Client-Multi-Factor'?: string;
  /** Screen resolution */
  'Gov-Client-Screens': string;
  /** Window size */
  'Gov-Client-Window-Size': string;
  /** Browser plugins */
  'Gov-Client-Browser-Plugins'?: string;
  /** Browser JavaScript user agent */
  'Gov-Client-Browser-JS-User-Agent'?: string;
  /** Browser do not track */
  'Gov-Client-Browser-Do-Not-Track'?: string;
  /** Vendor version */
  'Gov-Vendor-Version': string;
  /** Vendor license IDs */
  'Gov-Vendor-License-IDs'?: string;
  /** Vendor public IP */
  'Gov-Vendor-Public-IP'?: string;
  /** Vendor forwarded */
  'Gov-Vendor-Forwarded'?: string;
  /** Vendor product name */
  'Gov-Vendor-Product-Name': string;
}

/**
 * API response wrapper
 */
interface MTDApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    errors?: Array<{
      code: string;
      message: string;
      path?: string;
    }>;
  };
}

// ============================================================================
// UK MTD Service Implementation
// ============================================================================

export class UKMTDService extends BaseEInvoicingService {
  private config: UKMTDConfig;
  private readonly sandboxBaseUrl = 'https://test-api.service.hmrc.gov.uk';
  private readonly productionBaseUrl = 'https://api.service.hmrc.gov.uk';

  constructor(countryConfig: CountryConfig) {
    super(countryConfig);
    this.config = this.parseConfig(countryConfig);
  }

  /**
   * Parse and validate UK-specific configuration
   */
  private parseConfig(countryConfig: CountryConfig): UKMTDConfig {
    const config = countryConfig.specificConfig as UKMTDConfig;
    
    if (!config.vrn || !this.validateVRN(config.vrn)) {
      throw new Error('Invalid VAT Registration Number (VRN). Must be 9 digits.');
    }

    if (!config.clientId || !config.clientSecret) {
      throw new Error('HMRC OAuth credentials (clientId and clientSecret) are required.');
    }

    if (!config.softwareId) {
      throw new Error('HMRC Software ID is required.');
    }

    return {
      ...config,
      sandbox: countryConfig.environment === 'sandbox',
      softwareVersion: config.softwareVersion || '1.0.0',
    };
  }

  /**
   * Get the base URL based on environment
   */
  private get baseUrl(): string {
    return this.config.sandbox ? this.sandboxBaseUrl : this.productionBaseUrl;
  }

  // ==========================================================================
  // Validation Methods
  // ==========================================================================

  /**
   * Validate UK VAT Registration Number (VRN)
   * Format: 9 digits with modulus 97 check
   */
  validateVRN(vrn: string): boolean {
    // Remove any spaces or GB prefix
    const cleanVRN = vrn.replace(/\s/g, '').replace(/^GB/i, '');
    
    // Must be exactly 9 digits
    if (!/^\d{9}$/.test(cleanVRN)) {
      return false;
    }

    // Modulus 97 validation
    const digits = cleanVRN.split('').map(Number);
    const weights = [8, 7, 6, 5, 4, 3, 2];
    
    let sum = 0;
    for (let i = 0; i < 7; i++) {
      sum += digits[i] * weights[i];
    }

    // Calculate check digits
    const checkDigits = parseInt(cleanVRN.substring(7, 9));
    const remainder = sum % 97;
    
    // Valid if check digits match expected value
    return (97 - remainder === checkDigits) || 
           (97 - remainder + 55 === checkDigits);
  }

  /**
   * Validate Companies House registration number
   */
  validateCompanyNumber(companyNumber: string): boolean {
    // 8 characters: can be all digits or start with 2 letters (SC, NI, etc.)
    const patterns = [
      /^\d{8}$/,                    // Standard: 12345678
      /^[A-Z]{2}\d{6}$/,            // Scotland/NI: SC123456, NI123456
      /^[A-Z]\d{7}$/,               // Other: R1234567
      /^[A-Z]{2}\d{5}[A-Z]$/,       // LLP: OC123456A
    ];

    return patterns.some(pattern => pattern.test(companyNumber.toUpperCase()));
  }

  /**
   * Validate invoice data for UK requirements
   */
  async validate(invoice: EInvoice): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate seller VRN
    if (!invoice.seller.taxId || !this.validateVRN(invoice.seller.taxId)) {
      errors.push('Invalid seller VAT Registration Number');
    }

    // Validate buyer VRN if provided (B2B)
    if (invoice.buyer.taxId && !this.validateVRN(invoice.buyer.taxId)) {
      errors.push('Invalid buyer VAT Registration Number');
    }

    // Validate invoice number format
    if (!invoice.invoiceNumber || invoice.invoiceNumber.length > 20) {
      errors.push('Invoice number is required and must be max 20 characters');
    }

    // Validate dates
    const invoiceDate = new Date(invoice.issueDate);
    const now = new Date();
    if (invoiceDate > now) {
      errors.push('Invoice date cannot be in the future');
    }

    // Validate amounts
    if (invoice.totalAmount < 0) {
      errors.push('Total amount cannot be negative');
    }

    // Validate VAT rates (UK: 20%, 5%, 0%)
    const validRates = [0, 5, 20];
    for (const line of invoice.lines) {
      if (!validRates.includes(line.vatRate)) {
        errors.push(`Invalid VAT rate ${line.vatRate}%. Valid rates are: 0%, 5%, 20%`);
      }
    }

    // Validate currency (must be GBP for UK VAT returns)
    if (invoice.currency !== 'GBP') {
      errors.push('Currency must be GBP for UK VAT reporting');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // ==========================================================================
  // OAuth Authentication
  // ==========================================================================

  /**
   * Get OAuth authorization URL for user consent
   */
  getAuthorizationUrl(redirectUri: string, state: string): string {
    const authUrl = this.config.sandbox
      ? 'https://test-api.service.hmrc.gov.uk/oauth/authorize'
      : 'https://api.service.hmrc.gov.uk/oauth/authorize';

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      scope: 'read:vat write:vat',
      redirect_uri: redirectUri,
      state: state,
    });

    return `${authUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeAuthorizationCode(
    code: string,
    redirectUri: string
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const tokenUrl = this.config.sandbox
      ? 'https://test-api.service.hmrc.gov.uk/oauth/token'
      : 'https://api.service.hmrc.gov.uk/oauth/token';

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OAuth token exchange failed: ${error.error_description || error.error}`);
    }

    const data = await response.json();
    
    this.config.accessToken = data.access_token;
    this.config.refreshToken = data.refresh_token;
    this.config.tokenExpiry = Date.now() + (data.expires_in * 1000);

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<void> {
    if (!this.config.refreshToken) {
      throw new Error('No refresh token available. User must re-authorize.');
    }

    const tokenUrl = this.config.sandbox
      ? 'https://test-api.service.hmrc.gov.uk/oauth/token'
      : 'https://api.service.hmrc.gov.uk/oauth/token';

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.config.refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token refresh failed: ${error.error_description || error.error}`);
    }

    const data = await response.json();
    
    this.config.accessToken = data.access_token;
    this.config.refreshToken = data.refresh_token;
    this.config.tokenExpiry = Date.now() + (data.expires_in * 1000);
  }

  /**
   * Ensure we have a valid access token
   */
  private async ensureValidToken(): Promise<void> {
    if (!this.config.accessToken) {
      throw new Error('Not authenticated. Please complete OAuth authorization first.');
    }

    // Refresh if token expires in less than 5 minutes
    if (this.config.tokenExpiry && Date.now() > this.config.tokenExpiry - 300000) {
      await this.refreshAccessToken();
    }
  }

  // ==========================================================================
  // Fraud Prevention Headers
  // ==========================================================================

  /**
   * Generate fraud prevention headers required by HMRC
   * These headers are mandatory by law for all MTD API calls
   */
  generateFraudPreventionHeaders(deviceInfo?: {
    deviceId?: string;
    localIPs?: string[];
    macAddresses?: string[];
    screenWidth?: number;
    screenHeight?: number;
    windowWidth?: number;
    windowHeight?: number;
    timezone?: string;
    userAgent?: string;
  }): FraudPreventionHeaders {
    const info = deviceInfo || {};
    
    return {
      'Gov-Client-Connection-Method': 'DESKTOP_APP_DIRECT',
      'Gov-Client-Device-ID': info.deviceId || this.generateDeviceId(),
      'Gov-Client-User-IDs': `os=${process.platform}`,
      'Gov-Client-Timezone': info.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      'Gov-Client-Local-IPs': info.localIPs?.join(',') || '127.0.0.1',
      'Gov-Client-MAC-Addresses': info.macAddresses?.join(','),
      'Gov-Client-User-Agent': info.userAgent || `PianoEmotionManager/${this.config.softwareVersion}`,
      'Gov-Client-Screens': `width=${info.screenWidth || 1920}&height=${info.screenHeight || 1080}&colour-depth=24`,
      'Gov-Client-Window-Size': `width=${info.windowWidth || 1200}&height=${info.windowHeight || 800}`,
      'Gov-Vendor-Version': `PianoEmotionManager=${this.config.softwareVersion}`,
      'Gov-Vendor-Product-Name': 'Piano Emotion Manager',
    };
  }

  /**
   * Generate a unique device ID
   */
  private generateDeviceId(): string {
    // In production, this should be a persistent device identifier
    return `PEM-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
  }

  // ==========================================================================
  // API Methods
  // ==========================================================================

  /**
   * Make an authenticated API request to HMRC
   */
  private async apiRequest<T>(
    method: string,
    endpoint: string,
    body?: object,
    testScenario?: string
  ): Promise<MTDApiResponse<T>> {
    await this.ensureValidToken();

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.accessToken}`,
      'Accept': 'application/vnd.hmrc.1.0+json',
      'Content-Type': 'application/json',
      ...this.generateFraudPreventionHeaders(),
    };

    // Add test scenario header for sandbox testing
    if (this.config.sandbox && testScenario) {
      headers['Gov-Test-Scenario'] = testScenario;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.code || `HTTP_${response.status}`,
            message: data.message || response.statusText,
            errors: data.errors,
          },
        };
      }

      return {
        success: true,
        data: data as T,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network request failed',
        },
      };
    }
  }

  /**
   * Retrieve VAT obligations for the business
   */
  async getVATObligations(
    from?: string,
    to?: string,
    status?: 'O' | 'F'
  ): Promise<MTDApiResponse<{ obligations: VATObligation[] }>> {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (status) params.append('status', status);

    const queryString = params.toString();
    const endpoint = `/organisations/vat/${this.config.vrn}/obligations${queryString ? '?' + queryString : ''}`;

    return this.apiRequest<{ obligations: VATObligation[] }>('GET', endpoint);
  }

  /**
   * Submit a VAT return
   */
  async submitVATReturn(vatReturn: VATReturn): Promise<MTDApiResponse<{
    processingDate: string;
    paymentIndicator: string;
    formBundleNumber: string;
    chargeRefNumber?: string;
  }>> {
    // Validate the VAT return data
    this.validateVATReturn(vatReturn);

    const endpoint = `/organisations/vat/${this.config.vrn}/returns`;
    
    return this.apiRequest('POST', endpoint, vatReturn);
  }

  /**
   * Validate VAT return data before submission
   */
  private validateVATReturn(vatReturn: VATReturn): void {
    // Period key must be 4 characters
    if (!/^[A-Za-z0-9#]{4}$/.test(vatReturn.periodKey)) {
      throw new Error('Period key must be exactly 4 alphanumeric characters');
    }

    // Validate monetary values
    const monetaryFields = [
      'vatDueSales', 'vatDueAcquisitions', 'totalVatDue',
      'vatReclaimedCurrPeriod', 'netVatDue'
    ];

    for (const field of monetaryFields) {
      const value = vatReturn[field as keyof VATReturn] as number;
      if (typeof value !== 'number' || isNaN(value)) {
        throw new Error(`${field} must be a valid number`);
      }
    }

    // Validate totalVatDue calculation
    const expectedTotal = vatReturn.vatDueSales + vatReturn.vatDueAcquisitions;
    if (Math.abs(vatReturn.totalVatDue - expectedTotal) > 0.01) {
      throw new Error('totalVatDue must equal vatDueSales + vatDueAcquisitions');
    }

    // Validate netVatDue is absolute difference
    const expectedNet = Math.abs(vatReturn.totalVatDue - vatReturn.vatReclaimedCurrPeriod);
    if (Math.abs(vatReturn.netVatDue - expectedNet) > 0.01) {
      throw new Error('netVatDue must be the absolute difference between totalVatDue and vatReclaimedCurrPeriod');
    }

    // netVatDue must be positive
    if (vatReturn.netVatDue < 0) {
      throw new Error('netVatDue must be a positive number');
    }

    // finalised must be true for submission
    if (!vatReturn.finalised) {
      throw new Error('finalised must be true to submit the VAT return');
    }
  }

  /**
   * View a submitted VAT return
   */
  async getVATReturn(periodKey: string): Promise<MTDApiResponse<VATReturn & {
    processingDate: string;
  }>> {
    const endpoint = `/organisations/vat/${this.config.vrn}/returns/${periodKey}`;
    return this.apiRequest('GET', endpoint);
  }

  /**
   * Retrieve VAT liabilities
   */
  async getVATLiabilities(
    from: string,
    to: string
  ): Promise<MTDApiResponse<{ liabilities: VATLiability[] }>> {
    const endpoint = `/organisations/vat/${this.config.vrn}/liabilities?from=${from}&to=${to}`;
    return this.apiRequest('GET', endpoint);
  }

  /**
   * Retrieve VAT payments
   */
  async getVATPayments(
    from: string,
    to: string
  ): Promise<MTDApiResponse<{ payments: VATPayment[] }>> {
    const endpoint = `/organisations/vat/${this.config.vrn}/payments?from=${from}&to=${to}`;
    return this.apiRequest('GET', endpoint);
  }

  // ==========================================================================
  // Invoice Processing (for VAT record keeping)
  // ==========================================================================

  /**
   * Generate XML representation of invoice for record keeping
   * Note: UK MTD doesn't require XML submission, but this is useful for records
   */
  async generateXML(invoice: EInvoice): Promise<string> {
    // UK doesn't have a mandated XML format like other EU countries
    // We generate a simple XML for internal record keeping
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:piano-emotion:uk-invoice:1.0">
  <InvoiceNumber>${this.escapeXml(invoice.invoiceNumber)}</InvoiceNumber>
  <IssueDate>${invoice.issueDate}</IssueDate>
  <DueDate>${invoice.dueDate || ''}</DueDate>
  <Currency>GBP</Currency>
  
  <Seller>
    <Name>${this.escapeXml(invoice.seller.name)}</Name>
    <VATNumber>${this.escapeXml(invoice.seller.taxId)}</VATNumber>
    <Address>
      <Street>${this.escapeXml(invoice.seller.address.street)}</Street>
      <City>${this.escapeXml(invoice.seller.address.city)}</City>
      <PostCode>${this.escapeXml(invoice.seller.address.postalCode)}</PostCode>
      <Country>GB</Country>
    </Address>
  </Seller>
  
  <Buyer>
    <Name>${this.escapeXml(invoice.buyer.name)}</Name>
    ${invoice.buyer.taxId ? `<VATNumber>${this.escapeXml(invoice.buyer.taxId)}</VATNumber>` : ''}
    <Address>
      <Street>${this.escapeXml(invoice.buyer.address.street)}</Street>
      <City>${this.escapeXml(invoice.buyer.address.city)}</City>
      <PostCode>${this.escapeXml(invoice.buyer.address.postalCode)}</PostCode>
      <Country>${this.escapeXml(invoice.buyer.address.country)}</Country>
    </Address>
  </Buyer>
  
  <Lines>
    ${invoice.lines.map((line, index) => `
    <Line>
      <Number>${index + 1}</Number>
      <Description>${this.escapeXml(line.description)}</Description>
      <Quantity>${line.quantity}</Quantity>
      <UnitPrice>${line.unitPrice.toFixed(2)}</UnitPrice>
      <VATRate>${line.vatRate}</VATRate>
      <VATAmount>${((line.quantity * line.unitPrice) * (line.vatRate / 100)).toFixed(2)}</VATAmount>
      <LineTotal>${(line.quantity * line.unitPrice).toFixed(2)}</LineTotal>
    </Line>`).join('')}
  </Lines>
  
  <Totals>
    <SubTotal>${invoice.subtotal.toFixed(2)}</SubTotal>
    <VATAmount>${invoice.vatAmount.toFixed(2)}</VATAmount>
    <Total>${invoice.totalAmount.toFixed(2)}</Total>
  </Totals>
  
  ${invoice.notes ? `<Notes>${this.escapeXml(invoice.notes)}</Notes>` : ''}
</Invoice>`;

    return xml;
  }

  /**
   * Escape special XML characters
   */
  private escapeXml(str: string): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Send invoice - for UK this means recording for VAT purposes
   * Note: UK MTD doesn't require real-time invoice submission
   */
  async send(invoice: EInvoice): Promise<EInvoiceResult> {
    // Validate the invoice
    const validation = await this.validate(invoice);
    if (!validation.valid) {
      return {
        success: false,
        invoiceId: invoice.invoiceNumber,
        status: 'rejected',
        errors: validation.errors,
      };
    }

    // Generate XML for record keeping
    const xml = await this.generateXML(invoice);

    // In UK, invoices are not submitted to HMRC in real-time
    // They are aggregated into VAT returns
    // This method records the invoice for later VAT return submission

    return {
      success: true,
      invoiceId: invoice.invoiceNumber,
      status: 'recorded',
      timestamp: new Date().toISOString(),
      message: 'Invoice recorded for VAT return. Remember to include in your next VAT submission.',
      rawResponse: xml,
    };
  }

  /**
   * Check status of a VAT return
   */
  async checkStatus(periodKey: string): Promise<EInvoiceResult> {
    const result = await this.getVATReturn(periodKey);

    if (!result.success) {
      return {
        success: false,
        invoiceId: periodKey,
        status: 'error',
        errors: [result.error?.message || 'Failed to retrieve VAT return status'],
      };
    }

    return {
      success: true,
      invoiceId: periodKey,
      status: 'accepted',
      timestamp: result.data?.processingDate,
      rawResponse: JSON.stringify(result.data),
    };
  }

  /**
   * Test connection to HMRC API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // In sandbox, we can test without full authentication
      if (this.config.sandbox) {
        const response = await fetch(`${this.sandboxBaseUrl}/hello/world`, {
          headers: {
            'Accept': 'application/vnd.hmrc.1.0+json',
          },
        });

        if (response.ok) {
          return {
            success: true,
            message: 'Successfully connected to HMRC sandbox API',
          };
        }
      }

      // For production, verify we have valid credentials
      if (!this.config.accessToken) {
        return {
          success: false,
          message: 'Not authenticated. Please complete OAuth authorization.',
        };
      }

      // Try to get obligations as a connection test
      const result = await this.getVATObligations();
      
      return {
        success: result.success,
        message: result.success 
          ? 'Successfully connected to HMRC MTD API'
          : `Connection failed: ${result.error?.message}`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // ==========================================================================
  // Helper Methods for VAT Calculations
  // ==========================================================================

  /**
   * Calculate VAT return data from a list of invoices
   */
  calculateVATReturnFromInvoices(
    invoices: EInvoice[],
    purchases: EInvoice[],
    periodKey: string
  ): VATReturn {
    // Calculate VAT on sales
    let vatDueSales = 0;
    let totalValueSalesExVAT = 0;
    let totalValueGoodsSuppliedExVAT = 0;

    for (const invoice of invoices) {
      vatDueSales += invoice.vatAmount;
      totalValueSalesExVAT += invoice.subtotal;
      
      // Check if goods supplied to EU (post-Brexit this is exports)
      if (invoice.buyer.address.country !== 'GB') {
        totalValueGoodsSuppliedExVAT += invoice.subtotal;
      }
    }

    // Calculate VAT on purchases
    let vatReclaimedCurrPeriod = 0;
    let totalValuePurchasesExVAT = 0;
    let totalAcquisitionsExVAT = 0;

    for (const purchase of purchases) {
      vatReclaimedCurrPeriod += purchase.vatAmount;
      totalValuePurchasesExVAT += purchase.subtotal;
      
      // Check if acquisitions from EU
      if (purchase.seller.address.country !== 'GB') {
        totalAcquisitionsExVAT += purchase.subtotal;
      }
    }

    // Calculate totals
    const vatDueAcquisitions = 0; // Simplified - would need reverse charge calculation
    const totalVatDue = vatDueSales + vatDueAcquisitions;
    const netVatDue = Math.abs(totalVatDue - vatReclaimedCurrPeriod);

    return {
      periodKey,
      vatDueSales: this.roundToTwoDecimals(vatDueSales),
      vatDueAcquisitions: this.roundToTwoDecimals(vatDueAcquisitions),
      totalVatDue: this.roundToTwoDecimals(totalVatDue),
      vatReclaimedCurrPeriod: this.roundToTwoDecimals(vatReclaimedCurrPeriod),
      netVatDue: this.roundToTwoDecimals(netVatDue),
      totalValueSalesExVAT: Math.round(totalValueSalesExVAT),
      totalValuePurchasesExVAT: Math.round(totalValuePurchasesExVAT),
      totalValueGoodsSuppliedExVAT: Math.round(totalValueGoodsSuppliedExVAT),
      totalAcquisitionsExVAT: Math.round(totalAcquisitionsExVAT),
      finalised: false, // Set to true when ready to submit
    };
  }

  /**
   * Round to two decimal places
   */
  private roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }

  /**
   * Format VRN with GB prefix for international use
   */
  formatVRNInternational(vrn: string): string {
    const cleanVRN = vrn.replace(/\s/g, '').replace(/^GB/i, '');
    return `GB${cleanVRN}`;
  }

  /**
   * Get UK VAT rate for a given category
   */
  getVATRate(category: 'standard' | 'reduced' | 'zero'): number {
    const rates = {
      standard: 20,
      reduced: 5,
      zero: 0,
    };
    return rates[category];
  }
}

// ============================================================================
// Export
// ============================================================================

export default UKMTDService;
