// Tipos para facturación

export interface BusinessInfo {
  name: string;
  taxId: string; // NIF/CIF
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
  bankAccount?: string;
  logo?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number; // IVA %
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  
  // Datos del técnico/empresa
  business: BusinessInfo;
  
  // Datos del cliente
  clientId: string;
  clientName: string;
  clientTaxId?: string;
  clientAddress?: string;
  clientEmail?: string;
  
  // Servicio relacionado
  serviceId?: string;
  pianoId?: string;
  pianoInfo?: string;
  
  // Líneas de factura
  items: InvoiceItem[];
  
  // Totales
  subtotal: number;
  taxAmount: number;
  total: number;
  
  // Estado
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  sentAt?: string;
  paidAt?: string;
  
  // Notas
  notes?: string;
  paymentTerms?: string;
  
  createdAt: string;
  updatedAt: string;
}

export const generateInvoiceNumber = (existingInvoices: Invoice[]): string => {
  const year = new Date().getFullYear();
  const prefix = `F${year}-`;
  
  const yearInvoices = existingInvoices.filter(inv => 
    inv.invoiceNumber.startsWith(prefix)
  );
  
  const maxNumber = yearInvoices.reduce((max, inv) => {
    const num = parseInt(inv.invoiceNumber.replace(prefix, '')) || 0;
    return Math.max(max, num);
  }, 0);
  
  return `${prefix}${String(maxNumber + 1).padStart(4, '0')}`;
};

export const calculateInvoiceTotals = (items: InvoiceItem[]): { subtotal: number; taxAmount: number; total: number } => {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const taxAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.taxRate / 100), 0);
  const total = subtotal + taxAmount;
  
  return { subtotal, taxAmount, total };
};

export const DEFAULT_BUSINESS_INFO: BusinessInfo = {
  name: '',
  taxId: '',
  address: '',
  city: '',
  postalCode: '',
  phone: '',
  email: '',
};

export const DEFAULT_TAX_RATE = 21; // IVA España

export const INVOICE_STATUS_LABELS: Record<Invoice['status'], string> = {
  draft: 'Borrador',
  sent: 'Enviada',
  paid: 'Pagada',
  cancelled: 'Anulada',
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
