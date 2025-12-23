import { useState, useEffect, useCallback } from 'react';

/**
 * Registro de precio de compra de un material
 */
export interface PriceRecord {
  id: string;
  itemId: string;
  price: number;
  supplierId?: string;
  supplierName?: string;
  quantity: number;
  date: string;
  invoiceNumber?: string;
  notes?: string;
  createdAt: string;
}

/**
 * Estadísticas de precios de un material
 */
export interface PriceStats {
  currentPrice: number;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  priceChange: number; // Porcentaje de cambio respecto al anterior
  totalPurchases: number;
  totalQuantity: number;
  totalSpent: number;
  lastPurchaseDate: string | null;
}

const PRICE_HISTORY_KEY = 'piano_emotion_price_history';

/**
 * Hook para gestionar el historial de precios de compra
 */
export function usePriceHistory(itemId?: string) {
  const [history, setHistory] = useState<PriceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [itemId]);

  const loadHistory = () => {
    setIsLoading(true);
    try {
      const stored = localStorage.getItem(PRICE_HISTORY_KEY);
      const allHistory: PriceRecord[] = stored ? JSON.parse(stored) : [];
      
      if (itemId) {
        setHistory(
          allHistory
            .filter(h => h.itemId === itemId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        );
      } else {
        setHistory(allHistory);
      }
    } catch (error) {
      console.error('Error loading price history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveHistory = (records: PriceRecord[]) => {
    try {
      const stored = localStorage.getItem(PRICE_HISTORY_KEY);
      let allHistory: PriceRecord[] = stored ? JSON.parse(stored) : [];
      
      if (itemId) {
        allHistory = allHistory.filter(h => h.itemId !== itemId);
        allHistory = [...allHistory, ...records];
      } else {
        allHistory = records;
      }
      
      localStorage.setItem(PRICE_HISTORY_KEY, JSON.stringify(allHistory));
    } catch (error) {
      console.error('Error saving price history:', error);
    }
  };

  /**
   * Añadir registro de precio de compra
   */
  const addPriceRecord = useCallback((
    record: Omit<PriceRecord, 'id' | 'createdAt'>
  ): PriceRecord => {
    const newRecord: PriceRecord = {
      ...record,
      id: `price_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };

    const updatedHistory = [newRecord, ...history];
    setHistory(updatedHistory);
    saveHistory(updatedHistory);

    return newRecord;
  }, [history]);

  /**
   * Actualizar registro de precio
   */
  const updatePriceRecord = useCallback((
    id: string,
    updates: Partial<Omit<PriceRecord, 'id' | 'createdAt'>>
  ): void => {
    const updatedHistory = history.map(h =>
      h.id === id ? { ...h, ...updates } : h
    );
    setHistory(updatedHistory);
    saveHistory(updatedHistory);
  }, [history]);

  /**
   * Eliminar registro de precio
   */
  const deletePriceRecord = useCallback((id: string): void => {
    const updatedHistory = history.filter(h => h.id !== id);
    setHistory(updatedHistory);
    saveHistory(updatedHistory);
  }, [history]);

  /**
   * Obtener estadísticas de precios de un material
   */
  const getStats = useCallback((targetItemId?: string): PriceStats => {
    const records = targetItemId 
      ? history.filter(h => h.itemId === targetItemId)
      : history;

    if (records.length === 0) {
      return {
        currentPrice: 0,
        averagePrice: 0,
        minPrice: 0,
        maxPrice: 0,
        priceChange: 0,
        totalPurchases: 0,
        totalQuantity: 0,
        totalSpent: 0,
        lastPurchaseDate: null,
      };
    }

    const sortedRecords = [...records].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const currentPrice = sortedRecords[0].price;
    const previousPrice = sortedRecords.length > 1 ? sortedRecords[1].price : currentPrice;
    const priceChange = previousPrice > 0 
      ? ((currentPrice - previousPrice) / previousPrice) * 100 
      : 0;

    const prices = records.map(r => r.price);
    const totalQuantity = records.reduce((sum, r) => sum + r.quantity, 0);
    const totalSpent = records.reduce((sum, r) => sum + (r.price * r.quantity), 0);

    return {
      currentPrice,
      averagePrice: totalSpent / totalQuantity,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      priceChange,
      totalPurchases: records.length,
      totalQuantity,
      totalSpent,
      lastPurchaseDate: sortedRecords[0].date,
    };
  }, [history]);

  /**
   * Obtener historial de un material específico
   */
  const getHistoryByItem = useCallback((targetItemId: string): PriceRecord[] => {
    const stored = localStorage.getItem(PRICE_HISTORY_KEY);
    const allHistory: PriceRecord[] = stored ? JSON.parse(stored) : [];
    return allHistory
      .filter(h => h.itemId === targetItemId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, []);

  /**
   * Obtener historial de un proveedor específico
   */
  const getHistoryBySupplier = useCallback((supplierId: string): PriceRecord[] => {
    const stored = localStorage.getItem(PRICE_HISTORY_KEY);
    const allHistory: PriceRecord[] = stored ? JSON.parse(stored) : [];
    return allHistory
      .filter(h => h.supplierId === supplierId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, []);

  /**
   * Obtener el mejor precio histórico de un material
   */
  const getBestPrice = useCallback((targetItemId: string): PriceRecord | null => {
    const records = getHistoryByItem(targetItemId);
    if (records.length === 0) return null;
    return records.reduce((best, current) => 
      current.price < best.price ? current : best
    );
  }, [getHistoryByItem]);

  /**
   * Obtener precio promedio de los últimos N meses
   */
  const getAveragePrice = useCallback((targetItemId: string, months: number = 6): number => {
    const records = getHistoryByItem(targetItemId);
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);

    const recentRecords = records.filter(r => new Date(r.date) >= cutoffDate);
    if (recentRecords.length === 0) return 0;

    const totalQuantity = recentRecords.reduce((sum, r) => sum + r.quantity, 0);
    const totalSpent = recentRecords.reduce((sum, r) => sum + (r.price * r.quantity), 0);
    
    return totalSpent / totalQuantity;
  }, [getHistoryByItem]);

  /**
   * Detectar tendencia de precios
   */
  const getPriceTrend = useCallback((targetItemId: string): 'up' | 'down' | 'stable' => {
    const records = getHistoryByItem(targetItemId);
    if (records.length < 2) return 'stable';

    const recentRecords = records.slice(0, Math.min(5, records.length));
    const oldestPrice = recentRecords[recentRecords.length - 1].price;
    const newestPrice = recentRecords[0].price;

    const changePercent = ((newestPrice - oldestPrice) / oldestPrice) * 100;

    if (changePercent > 5) return 'up';
    if (changePercent < -5) return 'down';
    return 'stable';
  }, [getHistoryByItem]);

  return {
    history,
    isLoading,
    addPriceRecord,
    updatePriceRecord,
    deletePriceRecord,
    getStats,
    getHistoryByItem,
    getHistoryBySupplier,
    getBestPrice,
    getAveragePrice,
    getPriceTrend,
    refresh: loadHistory,
  };
}

export default usePriceHistory;
