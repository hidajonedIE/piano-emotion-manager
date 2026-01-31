import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import { Client, Piano, Service, generateId } from '@/types';

// Keys para AsyncStorage
const STORAGE_KEYS = {
  CLIENTS: 'piano_tech_clients',
  PIANOS: 'piano_tech_pianos',
  SERVICES: 'piano_tech_services',
};

// Hook genérico para almacenamiento local
export function useLocalStorage<T>(key: string, defaultValue: T[]) {
  const [data, setData] = useState<T[]>(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [key]);

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        setData(JSON.parse(stored));
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const saveData = async (newData: T[]) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(newData));
      setData(newData);
    } catch (error) {
    }
  };

  return { data, setData: saveData, loading, refresh: loadData };
}

// Hook para gestión de clientes
export function useClients() {
  const { data: clients, setData: setClients, loading, refresh } = useLocalStorage<Client>(
    STORAGE_KEYS.CLIENTS,
    []
  );

  const addClient = useCallback(
    async (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newClient: Client = {
        ...client,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setClients([...clients, newClient]);
      return newClient;
    },
    [clients, setClients]
  );

  const updateClient = useCallback(
    async (id: string, updates: Partial<Client>) => {
      const updated = clients.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
      );
      await setClients(updated);
    },
    [clients, setClients]
  );

  const deleteClient = useCallback(
    async (id: string) => {
      await setClients(clients.filter((c) => c.id !== id));
    },
    [clients, setClients]
  );

  const getClient = useCallback(
    (id: string) => clients.find((c) => c.id === id),
    [clients]
  );

  return { clients, loading, addClient, updateClient, deleteClient, getClient, refresh };
}

// Hook para gestión de pianos
export function usePianos() {
  const { data: pianos, setData: setPianos, loading, refresh } = useLocalStorage<Piano>(
    STORAGE_KEYS.PIANOS,
    []
  );

  const addPiano = useCallback(
    async (piano: Omit<Piano, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newPiano: Piano = {
        ...piano,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setPianos([...pianos, newPiano]);
      return newPiano;
    },
    [pianos, setPianos]
  );

  const updatePiano = useCallback(
    async (id: string, updates: Partial<Piano>) => {
      const updated = pianos.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      );
      await setPianos(updated);
    },
    [pianos, setPianos]
  );

  const deletePiano = useCallback(
    async (id: string) => {
      await setPianos(pianos.filter((p) => p.id !== id));
    },
    [pianos, setPianos]
  );

  const getPiano = useCallback((id: string) => pianos.find((p) => p.id === id), [pianos]);

  const getPianosByClient = useCallback(
    (clientId: string) => pianos.filter((p) => p.clientId === clientId),
    [pianos]
  );

  return { pianos, loading, addPiano, updatePiano, deletePiano, getPiano, getPianosByClient, refresh };
}

// Hook para gestión de servicios
export function useServices() {
  const { data: services, setData: setServices, loading, refresh } = useLocalStorage<Service>(
    STORAGE_KEYS.SERVICES,
    []
  );

  const addService = useCallback(
    async (service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newService: Service = {
        ...service,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setServices([...services, newService]);
      return newService;
    },
    [services, setServices]
  );

  const updateService = useCallback(
    async (id: string, updates: Partial<Service>) => {
      const updated = services.map((s) =>
        s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
      );
      await setServices(updated);
    },
    [services, setServices]
  );

  const deleteService = useCallback(
    async (id: string) => {
      await setServices(services.filter((s) => s.id !== id));
    },
    [services, setServices]
  );

  const getService = useCallback((id: string) => services.find((s) => s.id === id), [services]);

  const getServicesByPiano = useCallback(
    (pianoId: string) =>
      services
        .filter((s) => s.pianoId === pianoId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [services]
  );

  const getServicesByClient = useCallback(
    (clientId: string) =>
      services
        .filter((s) => s.clientId === clientId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [services]
  );

  const getLastServiceForPiano = useCallback(
    (pianoId: string) => {
      const pianoServices = getServicesByPiano(pianoId);
      return pianoServices.length > 0 ? pianoServices[0] : null;
    },
    [getServicesByPiano]
  );

  const getRecentServices = useCallback(
    (limit: number = 5) =>
      [...services]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit),
    [services]
  );

  return {
    services,
    loading,
    addService,
    updateService,
    deleteService,
    getService,
    getServicesByPiano,
    getServicesByClient,
    getLastServiceForPiano,
    getRecentServices,
    refresh,
  };
}
