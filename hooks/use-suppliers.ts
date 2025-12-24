import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Supplier } from '@/types/supplier';

const STORAGE_KEY = 'piano_tech_suppliers';

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar proveedores
  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        setSuppliers(JSON.parse(data));
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const saveSuppliers = async (newSuppliers: Supplier[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSuppliers));
      setSuppliers(newSuppliers);
    } catch (error) {
    }
  };

  const addSupplier = useCallback(async (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newSupplier: Supplier = {
      ...supplier,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const newSuppliers = [...suppliers, newSupplier];
    await saveSuppliers(newSuppliers);
    return newSupplier;
  }, [suppliers]);

  const updateSupplier = useCallback(async (id: string, updates: Partial<Supplier>) => {
    const newSuppliers = suppliers.map(s =>
      s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
    );
    await saveSuppliers(newSuppliers);
  }, [suppliers]);

  const deleteSupplier = useCallback(async (id: string) => {
    const newSuppliers = suppliers.filter(s => s.id !== id);
    await saveSuppliers(newSuppliers);
  }, [suppliers]);

  const getSupplier = useCallback((id: string) => {
    return suppliers.find(s => s.id === id);
  }, [suppliers]);

  const getSuppliersByType = useCallback((type: Supplier['type']) => {
    return suppliers.filter(s => s.type === type && s.isActive);
  }, [suppliers]);

  const getActiveSuppliers = useCallback(() => {
    return suppliers.filter(s => s.isActive);
  }, [suppliers]);

  return {
    suppliers,
    loading,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    getSupplier,
    getSuppliersByType,
    getActiveSuppliers,
    refresh: loadSuppliers,
  };
}
