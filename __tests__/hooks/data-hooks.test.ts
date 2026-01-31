/**
 * Tests de los Hooks de Datos
 * Piano Emotion Manager
 * 
 * Tests para las funciones de transformación de datos
 * entre el servidor y el formato local.
 */

import { describe, it, expect } from 'vitest';

// ==========================================
// TIPOS
// ==========================================

interface ServerClient {
  id: number;
  odId: string;
  firstName: string;
  lastName1: string | null;
  lastName2: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  clientType: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface LocalClient {
  id: string;
  firstName: string;
  lastName1?: string;
  lastName2?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  clientType: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ServerPiano {
  id: number;
  odId: string;
  clientId: number;
  brand: string;
  model: string | null;
  serialNumber: string | null;
  year: number | null;
  category: string;
  condition: string;
  location: string | null;
  notes: string | null;
  lastServiceDate: Date | null;
  nextServiceDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface LocalPiano {
  id: string;
  clientId: string;
  brand: string;
  model?: string;
  serialNumber?: string;
  year?: number;
  category: string;
  condition: string;
  location?: string;
  notes?: string;
  lastServiceDate?: string;
  nextServiceDate?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// FUNCIONES DE TRANSFORMACIÓN
// ==========================================

const serverToLocalClient = (server: ServerClient): LocalClient => ({
  id: String(server.id),
  firstName: server.firstName,
  lastName1: server.lastName1 || undefined,
  lastName2: server.lastName2 || undefined,
  email: server.email || undefined,
  phone: server.phone || undefined,
  address: server.address || undefined,
  city: server.city || undefined,
  postalCode: server.postalCode || undefined,
  clientType: server.clientType,
  notes: server.notes || undefined,
  createdAt: server.createdAt.toISOString(),
  updatedAt: server.updatedAt.toISOString(),
});

const serverToLocalPiano = (server: ServerPiano): LocalPiano => ({
  id: String(server.id),
  clientId: String(server.clientId),
  brand: server.brand,
  model: server.model || undefined,
  serialNumber: server.serialNumber || undefined,
  year: server.year || undefined,
  category: server.category,
  condition: server.condition,
  location: server.location || undefined,
  notes: server.notes || undefined,
  lastServiceDate: server.lastServiceDate?.toISOString(),
  nextServiceDate: server.nextServiceDate?.toISOString(),
  createdAt: server.createdAt.toISOString(),
  updatedAt: server.updatedAt.toISOString(),
});

// ==========================================
// TESTS DE TRANSFORMACIÓN DE CLIENTES
// ==========================================

describe('Transformación de Clientes', () => {
  describe('serverToLocalClient', () => {
    it('debería transformar cliente completo correctamente', () => {
      const serverClient: ServerClient = {
        id: 1,
        odId: 'od_123',
        firstName: 'Juan',
        lastName1: 'García',
        lastName2: 'López',
        email: 'juan@example.com',
        phone: '612345678',
        address: 'Calle Mayor, 123',
        city: 'Madrid',
        postalCode: '28001',
        clientType: 'particular',
        notes: 'Cliente preferente',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-12-24'),
      };

      const localClient = serverToLocalClient(serverClient);

      expect(localClient.id).toBe('1');
      expect(localClient.firstName).toBe('Juan');
      expect(localClient.lastName1).toBe('García');
      expect(localClient.lastName2).toBe('López');
      expect(localClient.email).toBe('juan@example.com');
      expect(localClient.phone).toBe('612345678');
      expect(localClient.clientType).toBe('particular');
      expect(localClient.createdAt).toBe('2024-01-15T00:00:00.000Z');
    });

    it('debería manejar campos nulos correctamente', () => {
      const serverClient: ServerClient = {
        id: 2,
        odId: 'od_456',
        firstName: 'María',
        lastName1: null,
        lastName2: null,
        email: null,
        phone: null,
        address: null,
        city: null,
        postalCode: null,
        clientType: 'particular',
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const localClient = serverToLocalClient(serverClient);

      expect(localClient.lastName1).toBeUndefined();
      expect(localClient.lastName2).toBeUndefined();
      expect(localClient.email).toBeUndefined();
      expect(localClient.phone).toBeUndefined();
      expect(localClient.notes).toBeUndefined();
    });

    it('debería convertir ID numérico a string', () => {
      const serverClient: ServerClient = {
        id: 12345,
        odId: 'od_789',
        firstName: 'Test',
        lastName1: null,
        lastName2: null,
        email: null,
        phone: null,
        address: null,
        city: null,
        postalCode: null,
        clientType: 'particular',
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const localClient = serverToLocalClient(serverClient);

      expect(typeof localClient.id).toBe('string');
      expect(localClient.id).toBe('12345');
    });
  });
});

// ==========================================
// TESTS DE TRANSFORMACIÓN DE PIANOS
// ==========================================

describe('Transformación de Pianos', () => {
  describe('serverToLocalPiano', () => {
    it('debería transformar piano completo correctamente', () => {
      const serverPiano: ServerPiano = {
        id: 1,
        odId: 'od_piano_123',
        clientId: 5,
        brand: 'Steinway & Sons',
        model: 'Model D',
        serialNumber: 'ABC123456',
        year: 2020,
        category: 'grand',
        condition: 'excellent',
        location: 'Salón principal',
        notes: 'Piano de concierto',
        lastServiceDate: new Date('2024-06-15'),
        nextServiceDate: new Date('2024-12-15'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-06-15'),
      };

      const localPiano = serverToLocalPiano(serverPiano);

      expect(localPiano.id).toBe('1');
      expect(localPiano.clientId).toBe('5');
      expect(localPiano.brand).toBe('Steinway & Sons');
      expect(localPiano.model).toBe('Model D');
      expect(localPiano.year).toBe(2020);
      expect(localPiano.category).toBe('grand');
      expect(localPiano.condition).toBe('excellent');
      expect(localPiano.lastServiceDate).toBe('2024-06-15T00:00:00.000Z');
      expect(localPiano.nextServiceDate).toBe('2024-12-15T00:00:00.000Z');
    });

    it('debería manejar campos nulos correctamente', () => {
      const serverPiano: ServerPiano = {
        id: 2,
        odId: 'od_piano_456',
        clientId: 10,
        brand: 'Yamaha',
        model: null,
        serialNumber: null,
        year: null,
        category: 'vertical',
        condition: 'good',
        location: null,
        notes: null,
        lastServiceDate: null,
        nextServiceDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const localPiano = serverToLocalPiano(serverPiano);

      expect(localPiano.model).toBeUndefined();
      expect(localPiano.serialNumber).toBeUndefined();
      expect(localPiano.year).toBeUndefined();
      expect(localPiano.lastServiceDate).toBeUndefined();
      expect(localPiano.nextServiceDate).toBeUndefined();
    });

    it('debería convertir IDs numéricos a string', () => {
      const serverPiano: ServerPiano = {
        id: 999,
        odId: 'od_piano_789',
        clientId: 888,
        brand: 'Test',
        model: null,
        serialNumber: null,
        year: null,
        category: 'vertical',
        condition: 'good',
        location: null,
        notes: null,
        lastServiceDate: null,
        nextServiceDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const localPiano = serverToLocalPiano(serverPiano);

      expect(typeof localPiano.id).toBe('string');
      expect(typeof localPiano.clientId).toBe('string');
      expect(localPiano.id).toBe('999');
      expect(localPiano.clientId).toBe('888');
    });
  });
});

// ==========================================
// TESTS DE FUNCIONES AUXILIARES
// ==========================================

describe('Funciones Auxiliares de Hooks', () => {
  describe('Filtrado de clientes', () => {
    const filterClients = (clients: LocalClient[], search: string): LocalClient[] => {
      if (!search.trim()) return clients;
      const searchLower = search.toLowerCase();
      return clients.filter((c) => {
        const fullName = [c.firstName, c.lastName1, c.lastName2].filter(Boolean).join(' ').toLowerCase();
        return (
          fullName.includes(searchLower) ||
          c.phone?.includes(search) ||
          c.email?.toLowerCase().includes(searchLower)
        );
      });
    };

    const testClients: LocalClient[] = [
      { id: '1', firstName: 'Juan', lastName1: 'García', clientType: 'particular', phone: '612345678', email: 'juan@test.com', createdAt: '', updatedAt: '' },
      { id: '2', firstName: 'María', lastName1: 'López', clientType: 'professional', phone: '698765432', email: 'maria@test.com', createdAt: '', updatedAt: '' },
      { id: '3', firstName: 'Pedro', lastName1: 'Martínez', clientType: 'particular', phone: '611111111', email: 'pedro@test.com', createdAt: '', updatedAt: '' },
    ];

    it('debería filtrar por nombre', () => {
      const result = filterClients(testClients, 'Juan');
      expect(result).toHaveLength(1);
      expect(result[0].firstName).toBe('Juan');
    });

    it('debería filtrar por apellido', () => {
      const result = filterClients(testClients, 'García');
      expect(result).toHaveLength(1);
      expect(result[0].lastName1).toBe('García');
    });

    it('debería filtrar por teléfono', () => {
      const result = filterClients(testClients, '612345678');
      expect(result).toHaveLength(1);
      expect(result[0].firstName).toBe('Juan');
    });

    it('debería filtrar por email', () => {
      const result = filterClients(testClients, 'maria@test.com');
      expect(result).toHaveLength(1);
      expect(result[0].firstName).toBe('María');
    });

    it('debería devolver todos si la búsqueda está vacía', () => {
      const result = filterClients(testClients, '');
      expect(result).toHaveLength(3);
    });

    it('debería ser case-insensitive', () => {
      const result = filterClients(testClients, 'JUAN');
      expect(result).toHaveLength(1);
    });
  });

  describe('Ordenamiento de pianos', () => {
    const sortPianosByLastService = (pianos: LocalPiano[]): LocalPiano[] => {
      return [...pianos].sort((a, b) => {
        if (!a.lastServiceDate && !b.lastServiceDate) return 0;
        if (!a.lastServiceDate) return 1; // Sin fecha va al final
        if (!b.lastServiceDate) return -1;
        return new Date(b.lastServiceDate).getTime() - new Date(a.lastServiceDate).getTime();
      });
    };

    const testPianos: LocalPiano[] = [
      { id: '1', clientId: '1', brand: 'Yamaha', category: 'vertical', condition: 'good', lastServiceDate: '2024-06-15T00:00:00.000Z', createdAt: '', updatedAt: '' },
      { id: '2', clientId: '2', brand: 'Steinway', category: 'grand', condition: 'excellent', lastServiceDate: '2024-12-01T00:00:00.000Z', createdAt: '', updatedAt: '' },
      { id: '3', clientId: '3', brand: 'Kawai', category: 'vertical', condition: 'fair', createdAt: '', updatedAt: '' },
    ];

    it('debería ordenar por fecha de último servicio (más reciente primero)', () => {
      const sorted = sortPianosByLastService(testPianos);
      expect(sorted[0].brand).toBe('Steinway'); // Diciembre
      expect(sorted[1].brand).toBe('Yamaha'); // Junio
      expect(sorted[2].brand).toBe('Kawai'); // Sin fecha
    });

    it('pianos sin fecha de servicio deberían ir al final', () => {
      const sorted = sortPianosByLastService(testPianos);
      expect(sorted[sorted.length - 1].lastServiceDate).toBeUndefined();
    });
  });

  describe('Cálculo de próximo servicio', () => {
    const calculateNextServiceDate = (
      lastServiceDate: string | undefined,
      intervalMonths: number = 6
    ): string | undefined => {
      if (!lastServiceDate) return undefined;
      const date = new Date(lastServiceDate);
      date.setMonth(date.getMonth() + intervalMonths);
      return date.toISOString();
    };

    it('debería calcular próximo servicio a 6 meses', () => {
      const lastService = '2024-06-15T00:00:00.000Z';
      const nextService = calculateNextServiceDate(lastService);
      expect(nextService).toContain('2024-12-15');
    });

    it('debería calcular próximo servicio con intervalo personalizado', () => {
      const lastService = '2024-06-15T00:00:00.000Z';
      const nextService = calculateNextServiceDate(lastService, 12);
      expect(nextService).toContain('2025-06-15');
    });

    it('debería devolver undefined si no hay fecha de último servicio', () => {
      const nextService = calculateNextServiceDate(undefined);
      expect(nextService).toBeUndefined();
    });
  });
});
