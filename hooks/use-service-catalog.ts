import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ServiceRate, DEFAULT_SERVICE_RATES, generateId } from '@/types/service-catalog';

const SERVICE_CATALOG_KEY = '@piano_tech_service_catalog';

export function useServiceCatalog() {
  const [rates, setRates] = useState<ServiceRate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    try {
      const data = await AsyncStorage.getItem(SERVICE_CATALOG_KEY);
      if (data) {
        setRates(JSON.parse(data));
      } else {
        // Inicializar con tarifas por defecto
        const defaultRates: ServiceRate[] = DEFAULT_SERVICE_RATES.map(rate => ({
          ...rate,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        await AsyncStorage.setItem(SERVICE_CATALOG_KEY, JSON.stringify(defaultRates));
        setRates(defaultRates);
      }
    } catch (error) {
      console.error('Error loading service catalog:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveRates = async (newRates: ServiceRate[]) => {
    try {
      await AsyncStorage.setItem(SERVICE_CATALOG_KEY, JSON.stringify(newRates));
      setRates(newRates);
    } catch (error) {
      console.error('Error saving service catalog:', error);
    }
  };

  const addRate = useCallback(async (rateData: Omit<ServiceRate, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newRate: ServiceRate = {
      ...rateData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const newRates = [...rates, newRate];
    await saveRates(newRates);
    return newRate;
  }, [rates]);

  const updateRate = useCallback(async (id: string, updates: Partial<ServiceRate>) => {
    const newRates = rates.map(rate =>
      rate.id === id ? { ...rate, ...updates, updatedAt: new Date().toISOString() } : rate
    );
    await saveRates(newRates);
  }, [rates]);

  const deleteRate = useCallback(async (id: string) => {
    const newRates = rates.filter(rate => rate.id !== id);
    await saveRates(newRates);
  }, [rates]);

  const getRate = useCallback((id: string) => {
    return rates.find(rate => rate.id === id);
  }, [rates]);

  const getActiveRates = useCallback(() => {
    return rates.filter(rate => rate.isActive);
  }, [rates]);

  const getRatesByCategory = useCallback((category: string) => {
    return rates.filter(rate => rate.category === category && rate.isActive);
  }, [rates]);

  const toggleRateActive = useCallback(async (id: string) => {
    const rate = rates.find(r => r.id === id);
    if (rate) {
      await updateRate(id, { isActive: !rate.isActive });
    }
  }, [rates, updateRate]);

  const resetToDefaults = useCallback(async () => {
    const defaultRates: ServiceRate[] = DEFAULT_SERVICE_RATES.map(rate => ({
      ...rate,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    await saveRates(defaultRates);
  }, []);

  return {
    rates,
    loading,
    addRate,
    updateRate,
    deleteRate,
    getRate,
    getActiveRates,
    getRatesByCategory,
    toggleRateActive,
    resetToDefaults,
  };
}
