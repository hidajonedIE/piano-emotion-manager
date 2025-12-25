import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const QUOTES_KEY = '@piano_tech_quotes';
const QUOTE_TEMPLATES_KEY = '@piano_tech_quote_templates';

export type QuoteItemType = 'service' | 'part' | 'labor' | 'travel' | 'other';

export interface QuoteItem {
  id: string;
  type: QuoteItemType;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  subtotal: number;
  total: number;
}

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';

export interface Quote {
  id: string;
  quoteNumber: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  pianoId?: string;
  pianoDescription?: string;
  title: string;
  description?: string;
  date: string;
  validUntil: string;
  status: QuoteStatus;
  items: QuoteItem[];
  subtotal: number;
  totalDiscount: number;
  taxAmount: number;
  total: number;
  currency: string;
  notes?: string;
  termsAndConditions?: string;
  sentAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  convertedToInvoiceId?: string;
  businessInfo?: {
    name: string;
    taxId: string;
    address: string;
    city: string;
    postalCode: string;
    phone: string;
    email: string;
    bankAccount: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type QuoteTemplateCategory = 'tuning' | 'repair' | 'restoration' | 'maintenance' | 'moving' | 'evaluation' | 'custom';

export interface QuoteTemplate {
  id: string;
  name: string;
  description?: string;
  category: QuoteTemplateCategory;
  items: Omit<QuoteItem, 'id' | 'subtotal' | 'total'>[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// Default templates
const DEFAULT_TEMPLATES: Omit<QuoteTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Afinación Estándar',
    description: 'Presupuesto para afinación básica de piano',
    category: 'tuning',
    isDefault: true,
    items: [
      { type: 'service', name: 'Afinación de piano', description: 'Afinación completa a 440Hz', quantity: 1, unitPrice: 80, discount: 0, taxRate: 21 },
      { type: 'travel', name: 'Desplazamiento', description: 'Gastos de desplazamiento', quantity: 1, unitPrice: 15, discount: 0, taxRate: 21 },
    ],
  },
  {
    name: 'Afinación + Regulación',
    description: 'Presupuesto para afinación con regulación básica',
    category: 'tuning',
    isDefault: false,
    items: [
      { type: 'service', name: 'Afinación de piano', description: 'Afinación completa a 440Hz', quantity: 1, unitPrice: 80, discount: 0, taxRate: 21 },
      { type: 'service', name: 'Regulación básica', description: 'Ajuste de mecanismo y pedales', quantity: 1, unitPrice: 60, discount: 0, taxRate: 21 },
      { type: 'travel', name: 'Desplazamiento', quantity: 1, unitPrice: 15, discount: 0, taxRate: 21 },
    ],
  },
  {
    name: 'Reparación Menor',
    description: 'Presupuesto para reparaciones menores',
    category: 'repair',
    isDefault: true,
    items: [
      { type: 'labor', name: 'Mano de obra', description: 'Trabajo de reparación', quantity: 2, unitPrice: 45, discount: 0, taxRate: 21 },
      { type: 'part', name: 'Piezas y materiales', description: 'A determinar según necesidad', quantity: 1, unitPrice: 0, discount: 0, taxRate: 21 },
      { type: 'travel', name: 'Desplazamiento', quantity: 1, unitPrice: 15, discount: 0, taxRate: 21 },
    ],
  },
  {
    name: 'Mantenimiento Completo',
    description: 'Presupuesto para mantenimiento integral',
    category: 'maintenance',
    isDefault: true,
    items: [
      { type: 'service', name: 'Afinación de piano', quantity: 1, unitPrice: 80, discount: 0, taxRate: 21 },
      { type: 'service', name: 'Regulación completa', description: 'Ajuste de mecanismo, teclado y pedales', quantity: 1, unitPrice: 120, discount: 0, taxRate: 21 },
      { type: 'service', name: 'Armonización', description: 'Ajuste del timbre de los martillos', quantity: 1, unitPrice: 80, discount: 0, taxRate: 21 },
      { type: 'service', name: 'Limpieza interior', description: 'Limpieza de cuerdas, tabla armónica y mecanismo', quantity: 1, unitPrice: 40, discount: 0, taxRate: 21 },
      { type: 'travel', name: 'Desplazamiento', quantity: 1, unitPrice: 15, discount: 0, taxRate: 21 },
    ],
  },
  {
    name: 'Evaluación / Peritaje',
    description: 'Presupuesto para evaluación del estado del piano',
    category: 'evaluation',
    isDefault: true,
    items: [
      { type: 'service', name: 'Evaluación técnica', description: 'Inspección completa del piano con informe detallado', quantity: 1, unitPrice: 60, discount: 0, taxRate: 21 },
      { type: 'travel', name: 'Desplazamiento', quantity: 1, unitPrice: 15, discount: 0, taxRate: 21 },
    ],
  },
  {
    name: 'Transporte de Piano',
    description: 'Presupuesto para traslado de piano',
    category: 'moving',
    isDefault: true,
    items: [
      { type: 'service', name: 'Transporte de piano vertical', description: 'Incluye embalaje, carga, transporte y descarga', quantity: 1, unitPrice: 250, discount: 0, taxRate: 21 },
      { type: 'other', name: 'Seguro de transporte', description: 'Cobertura durante el traslado', quantity: 1, unitPrice: 50, discount: 0, taxRate: 21 },
    ],
  },
];

// Helper functions
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function generateQuoteNumber(quotes: Quote[]): string {
  const year = new Date().getFullYear();
  const count = quotes.filter(q => q.quoteNumber.includes(year.toString())).length + 1;
  return `PRES-${year}-${count.toString().padStart(4, '0')}`;
}

export function calculateItemTotals(item: Omit<QuoteItem, 'id' | 'subtotal' | 'total'>): Pick<QuoteItem, 'subtotal' | 'total'> {
  const subtotal = item.quantity * item.unitPrice;
  const discountAmount = subtotal * (item.discount / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (item.taxRate / 100);
  const total = afterDiscount + taxAmount;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

export function calculateQuoteTotals(items: QuoteItem[]): { subtotal: number; totalDiscount: number; taxAmount: number; total: number } {
  let subtotal = 0;
  let totalDiscount = 0;
  let taxAmount = 0;

  items.forEach(item => {
    const itemSubtotal = item.quantity * item.unitPrice;
    const discountAmount = itemSubtotal * (item.discount / 100);
    const afterDiscount = itemSubtotal - discountAmount;
    const itemTax = afterDiscount * (item.taxRate / 100);

    subtotal += itemSubtotal;
    totalDiscount += discountAmount;
    taxAmount += itemTax;
  });

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round((subtotal - totalDiscount + taxAmount) * 100) / 100,
  };
}

export function useQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      const data = await AsyncStorage.getItem(QUOTES_KEY);
      if (data) {
        setQuotes(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error loading quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveQuotes = async (newQuotes: Quote[]) => {
    try {
      await AsyncStorage.setItem(QUOTES_KEY, JSON.stringify(newQuotes));
      setQuotes(newQuotes);
    } catch (error) {
      console.error('Error saving quotes:', error);
    }
  };

  const addQuote = useCallback(async (quoteData: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'updatedAt'>) => {
    const newQuote: Quote = {
      ...quoteData,
      id: generateId(),
      quoteNumber: generateQuoteNumber(quotes),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const newQuotes = [...quotes, newQuote];
    await saveQuotes(newQuotes);
    return newQuote;
  }, [quotes]);

  const updateQuote = useCallback(async (id: string, updates: Partial<Quote>) => {
    const newQuotes = quotes.map(q =>
      q.id === id ? { ...q, ...updates, updatedAt: new Date().toISOString() } : q
    );
    await saveQuotes(newQuotes);
  }, [quotes]);

  const deleteQuote = useCallback(async (id: string) => {
    const newQuotes = quotes.filter(q => q.id !== id);
    await saveQuotes(newQuotes);
  }, [quotes]);

  const getQuote = useCallback((id: string) => {
    return quotes.find(q => q.id === id);
  }, [quotes]);

  const getQuotesByClient = useCallback((clientId: string) => {
    return quotes.filter(q => q.clientId === clientId);
  }, [quotes]);

  const markAsSent = useCallback(async (id: string) => {
    await updateQuote(id, { status: 'sent', sentAt: new Date().toISOString() });
  }, [updateQuote]);

  const markAsAccepted = useCallback(async (id: string) => {
    await updateQuote(id, { status: 'accepted', acceptedAt: new Date().toISOString() });
  }, [updateQuote]);

  const markAsRejected = useCallback(async (id: string) => {
    await updateQuote(id, { status: 'rejected', rejectedAt: new Date().toISOString() });
  }, [updateQuote]);

  const convertToInvoice = useCallback(async (id: string, invoiceId: string) => {
    await updateQuote(id, { status: 'converted', convertedToInvoiceId: invoiceId });
  }, [updateQuote]);

  return {
    quotes,
    loading,
    addQuote,
    updateQuote,
    deleteQuote,
    getQuote,
    getQuotesByClient,
    markAsSent,
    markAsAccepted,
    markAsRejected,
    convertToInvoice,
  };
}

export function useQuoteTemplates() {
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await AsyncStorage.getItem(QUOTE_TEMPLATES_KEY);
      if (data) {
        setTemplates(JSON.parse(data));
      } else {
        // Initialize with default templates
        const defaultTemplates: QuoteTemplate[] = DEFAULT_TEMPLATES.map((t, i) => ({
          ...t,
          id: generateId() + i,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        await AsyncStorage.setItem(QUOTE_TEMPLATES_KEY, JSON.stringify(defaultTemplates));
        setTemplates(defaultTemplates);
      }
    } catch (error) {
      console.error('Error loading quote templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTemplates = async (newTemplates: QuoteTemplate[]) => {
    try {
      await AsyncStorage.setItem(QUOTE_TEMPLATES_KEY, JSON.stringify(newTemplates));
      setTemplates(newTemplates);
    } catch (error) {
      console.error('Error saving quote templates:', error);
    }
  };

  const addTemplate = useCallback(async (templateData: Omit<QuoteTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTemplate: QuoteTemplate = {
      ...templateData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const newTemplates = [...templates, newTemplate];
    await saveTemplates(newTemplates);
    return newTemplate;
  }, [templates]);

  const updateTemplate = useCallback(async (id: string, updates: Partial<QuoteTemplate>) => {
    const newTemplates = templates.map(t =>
      t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
    );
    await saveTemplates(newTemplates);
  }, [templates]);

  const deleteTemplate = useCallback(async (id: string) => {
    const newTemplates = templates.filter(t => t.id !== id);
    await saveTemplates(newTemplates);
  }, [templates]);

  const getTemplate = useCallback((id: string) => {
    return templates.find(t => t.id === id);
  }, [templates]);

  const getTemplatesByCategory = useCallback((category: QuoteTemplateCategory) => {
    return templates.filter(t => t.category === category);
  }, [templates]);

  return {
    templates,
    loading,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplate,
    getTemplatesByCategory,
  };
}
