import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Invoice, BusinessInfo, DEFAULT_BUSINESS_INFO, generateId, generateInvoiceNumber } from '@/types/invoice';

const INVOICES_KEY = '@piano_tech_invoices';
const BUSINESS_INFO_KEY = '@piano_tech_business_info';

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window !== 'undefined') {
      loadInvoices();
    } else {
      setLoading(false);
    }
  }, []);

  const loadInvoices = async () => {
    try {
      if (Platform.OS === 'web' && typeof window === 'undefined') {
        // Skip loading on server side
        return;
      }
      const data = await AsyncStorage.getItem(INVOICES_KEY);
      if (data) {
        setInvoices(JSON.parse(data));
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const saveInvoices = async (newInvoices: Invoice[]) => {
    try {
      if (Platform.OS === 'web' && typeof window === 'undefined') {
        // Skip saving on server side
        return;
      }
      await AsyncStorage.setItem(INVOICES_KEY, JSON.stringify(newInvoices));
      setInvoices(newInvoices);
    } catch (error) {
    }
  };

  const addInvoice = useCallback(async (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>) => {
    const newInvoice: Invoice = {
      ...invoiceData,
      id: generateId(),
      invoiceNumber: generateInvoiceNumber(invoices),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const newInvoices = [...invoices, newInvoice];
    await saveInvoices(newInvoices);
    return newInvoice;
  }, [invoices]);

  const updateInvoice = useCallback(async (id: string, updates: Partial<Invoice>) => {
    const newInvoices = invoices.map(inv =>
      inv.id === id ? { ...inv, ...updates, updatedAt: new Date().toISOString() } : inv
    );
    await saveInvoices(newInvoices);
  }, [invoices]);

  const deleteInvoice = useCallback(async (id: string) => {
    const newInvoices = invoices.filter(inv => inv.id !== id);
    await saveInvoices(newInvoices);
  }, [invoices]);

  const getInvoice = useCallback((id: string) => {
    return invoices.find(inv => inv.id === id);
  }, [invoices]);

  const getInvoicesByClient = useCallback((clientId: string) => {
    return invoices.filter(inv => inv.clientId === clientId);
  }, [invoices]);

  const getInvoicesByService = useCallback((serviceId: string) => {
    return invoices.filter(inv => inv.serviceId === serviceId);
  }, [invoices]);

  const markAsSent = useCallback(async (id: string) => {
    await updateInvoice(id, { status: 'sent', sentAt: new Date().toISOString() });
  }, [updateInvoice]);

  const markAsPaid = useCallback(async (id: string) => {
    await updateInvoice(id, { status: 'paid', paidAt: new Date().toISOString() });
  }, [updateInvoice]);

  return {
    invoices,
    loading,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    getInvoice,
    getInvoicesByClient,
    getInvoicesByService,
    markAsSent,
    markAsPaid,
  };
}

export function useBusinessInfo() {
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(DEFAULT_BUSINESS_INFO);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window !== 'undefined') {
      loadBusinessInfo();
    } else {
      setLoading(false);
    }
  }, []);

  const loadBusinessInfo = async () => {
    try {
      if (Platform.OS === 'web' && typeof window === 'undefined') {
        // Skip loading on server side
        return;
      }
      const data = await AsyncStorage.getItem(BUSINESS_INFO_KEY);
      if (data) {
        setBusinessInfo(JSON.parse(data));
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const saveBusinessInfo = useCallback(async (info: BusinessInfo) => {
    try {
      if (Platform.OS === 'web' && typeof window === 'undefined') {
        // Skip saving on server side
        return;
      }
      await AsyncStorage.setItem(BUSINESS_INFO_KEY, JSON.stringify(info));
      setBusinessInfo(info);
    } catch (error) {
    }
  }, []);

  return {
    businessInfo,
    loading,
    saveBusinessInfo,
  };
}
