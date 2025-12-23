import { useState, useEffect, useCallback } from 'react';

/**
 * Registro de cambio de propietario de un piano
 */
export interface OwnershipRecord {
  id: string;
  pianoId: string;
  clientId: string;
  clientName: string;
  startDate: string;
  endDate: string | null;
  notes?: string;
  transferType: 'purchase' | 'sale' | 'gift' | 'inheritance' | 'rental' | 'other';
  createdAt: string;
}

const OWNERSHIP_HISTORY_KEY = 'piano_emotion_ownership_history';

/**
 * Hook para gestionar el historial de propietarios de pianos
 */
export function useOwnershipHistory(pianoId?: string) {
  const [history, setHistory] = useState<OwnershipRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [pianoId]);

  const loadHistory = () => {
    setIsLoading(true);
    try {
      const stored = localStorage.getItem(OWNERSHIP_HISTORY_KEY);
      const allHistory: OwnershipRecord[] = stored ? JSON.parse(stored) : [];
      
      if (pianoId) {
        setHistory(allHistory.filter(h => h.pianoId === pianoId).sort(
          (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        ));
      } else {
        setHistory(allHistory);
      }
    } catch (error) {
      console.error('Error loading ownership history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveHistory = (records: OwnershipRecord[]) => {
    try {
      // Obtener todos los registros
      const stored = localStorage.getItem(OWNERSHIP_HISTORY_KEY);
      let allHistory: OwnershipRecord[] = stored ? JSON.parse(stored) : [];
      
      // Si hay pianoId, reemplazar solo los de ese piano
      if (pianoId) {
        allHistory = allHistory.filter(h => h.pianoId !== pianoId);
        allHistory = [...allHistory, ...records];
      } else {
        allHistory = records;
      }
      
      localStorage.setItem(OWNERSHIP_HISTORY_KEY, JSON.stringify(allHistory));
    } catch (error) {
      console.error('Error saving ownership history:', error);
    }
  };

  /**
   * Añadir registro de cambio de propietario
   */
  const addOwnershipRecord = useCallback((
    record: Omit<OwnershipRecord, 'id' | 'createdAt'>
  ): OwnershipRecord => {
    const newRecord: OwnershipRecord = {
      ...record,
      id: `ownership_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };

    // Si hay un propietario actual, cerrar su período
    const currentOwner = history.find(h => h.endDate === null);
    let updatedHistory = [...history];
    
    if (currentOwner && currentOwner.clientId !== record.clientId) {
      updatedHistory = history.map(h => 
        h.id === currentOwner.id 
          ? { ...h, endDate: record.startDate }
          : h
      );
    }

    updatedHistory = [newRecord, ...updatedHistory];
    setHistory(updatedHistory);
    saveHistory(updatedHistory);

    return newRecord;
  }, [history]);

  /**
   * Actualizar registro de propietario
   */
  const updateOwnershipRecord = useCallback((
    id: string,
    updates: Partial<Omit<OwnershipRecord, 'id' | 'createdAt'>>
  ): void => {
    const updatedHistory = history.map(h =>
      h.id === id ? { ...h, ...updates } : h
    );
    setHistory(updatedHistory);
    saveHistory(updatedHistory);
  }, [history]);

  /**
   * Eliminar registro de propietario
   */
  const deleteOwnershipRecord = useCallback((id: string): void => {
    const updatedHistory = history.filter(h => h.id !== id);
    setHistory(updatedHistory);
    saveHistory(updatedHistory);
  }, [history]);

  /**
   * Obtener propietario actual
   */
  const getCurrentOwner = useCallback((): OwnershipRecord | null => {
    return history.find(h => h.endDate === null) || null;
  }, [history]);

  /**
   * Registrar transferencia de piano a nuevo propietario
   */
  const transferPiano = useCallback((
    newClientId: string,
    newClientName: string,
    transferType: OwnershipRecord['transferType'],
    transferDate: string,
    notes?: string
  ): OwnershipRecord | null => {
    if (!pianoId) return null;

    return addOwnershipRecord({
      pianoId,
      clientId: newClientId,
      clientName: newClientName,
      startDate: transferDate,
      endDate: null,
      transferType,
      notes,
    });
  }, [pianoId, addOwnershipRecord]);

  /**
   * Obtener historial completo de un piano específico
   */
  const getHistoryByPiano = useCallback((targetPianoId: string): OwnershipRecord[] => {
    const stored = localStorage.getItem(OWNERSHIP_HISTORY_KEY);
    const allHistory: OwnershipRecord[] = stored ? JSON.parse(stored) : [];
    return allHistory
      .filter(h => h.pianoId === targetPianoId)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, []);

  /**
   * Obtener todos los pianos que ha tenido un cliente
   */
  const getHistoryByClient = useCallback((clientId: string): OwnershipRecord[] => {
    const stored = localStorage.getItem(OWNERSHIP_HISTORY_KEY);
    const allHistory: OwnershipRecord[] = stored ? JSON.parse(stored) : [];
    return allHistory
      .filter(h => h.clientId === clientId)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, []);

  return {
    history,
    isLoading,
    addOwnershipRecord,
    updateOwnershipRecord,
    deleteOwnershipRecord,
    getCurrentOwner,
    transferPiano,
    getHistoryByPiano,
    getHistoryByClient,
    refresh: loadHistory,
  };
}

export default useOwnershipHistory;
