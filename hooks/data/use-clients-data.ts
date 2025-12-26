/**
 * Hook de Clientes basado en tRPC
 * Piano Emotion Manager
 * 
 * Este hook maneja la sincronización de clientes con el servidor,
 * incluyendo manejo de errores y estados de carga.
 */

import { useCallback, useState } from 'react';
import { trpc } from '@/utils/trpc';
import type { Client } from '@/types';

// Tipo del cliente del servidor
type ServerClient = {
  id: number;
  odId: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  clientType: string;
  notes: string | null;
  taxId?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// Convertir cliente del servidor al formato local
function serverToLocalClient(server: ServerClient): Client {
  // Parsear el nombre en firstName, lastName1, lastName2
  const nameParts = server.name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName1 = nameParts[1] || undefined;
  const lastName2 = nameParts.slice(2).join(' ') || undefined;

  return {
    id: String(server.id),
    firstName,
    lastName1,
    lastName2,
    type: (server.clientType as Client['type']) || 'individual',
    phone: server.phone || '',
    email: server.email || undefined,
    taxId: server.taxId || undefined,
    addressText: server.address || undefined,
    address: server.address ? {
      street: server.address,
      city: server.city || undefined,
      province: server.region || undefined,
      postalCode: server.postalCode || undefined,
    } : undefined,
    notes: server.notes || undefined,
    createdAt: server.createdAt instanceof Date 
      ? server.createdAt.toISOString() 
      : String(server.createdAt),
    updatedAt: server.updatedAt instanceof Date 
      ? server.updatedAt.toISOString() 
      : String(server.updatedAt),
  };
}

export function useClientsData() {
  const utils = trpc.useUtils();
  const [error, setError] = useState<string | null>(null);

  // Query para obtener todos los clientes (usando listAll para evitar paginación)
  const { 
    data: serverClients, 
    isLoading: loading, 
    refetch,
    error: queryError 
  } = trpc.clients.listAll.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
    onError: (err) => {
      console.error('Error al cargar clientes:', err);
      setError('Error al cargar los clientes');
    },
  });

  // Mutations con manejo de errores
  const createMutation = trpc.clients.create.useMutation({
    onSuccess: () => {
      utils.clients.listAll.invalidate();
      utils.clients.list.invalidate();
      setError(null);
    },
    onError: (err) => {
      console.error('Error al crear cliente:', err);
      setError(err.message || 'Error al crear el cliente');
      throw err; // Re-lanzar para que el componente pueda manejarlo
    },
  });

  const updateMutation = trpc.clients.update.useMutation({
    onSuccess: () => {
      utils.clients.listAll.invalidate();
      utils.clients.list.invalidate();
      setError(null);
    },
    onError: (err) => {
      console.error('Error al actualizar cliente:', err);
      setError(err.message || 'Error al actualizar el cliente');
      throw err;
    },
  });

  const deleteMutation = trpc.clients.delete.useMutation({
    onSuccess: () => {
      utils.clients.listAll.invalidate();
      utils.clients.list.invalidate();
      setError(null);
    },
    onError: (err) => {
      console.error('Error al eliminar cliente:', err);
      setError(err.message || 'Error al eliminar el cliente');
      throw err;
    },
  });

  // Convertir clientes del servidor al formato local
  const clients: Client[] = (serverClients || []).map(serverToLocalClient);

  // Añadir cliente con manejo de errores mejorado
  const addClient = useCallback(
    async (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> => {
      const fullName = [client.firstName, client.lastName1, client.lastName2]
        .filter(Boolean)
        .join(' ');

      // Validación del lado del cliente
      if (!fullName.trim()) {
        throw new Error('El nombre es obligatorio');
      }
      if (!client.phone?.trim()) {
        throw new Error('El teléfono es obligatorio');
      }

      // Mapear tipo de cliente del frontend al backend
      const clientTypeMap: Record<string, string> = {
        'individual': 'particular',
        'particular': 'particular',
        'student': 'student',
        'professional': 'professional',
        'music_school': 'music_school',
        'conservatory': 'conservatory',
        'concert_hall': 'concert_hall',
        'school': 'music_school',
        'company': 'professional',
      };
      const mappedClientType = clientTypeMap[client.type || 'individual'] || 'particular';

      try {
        const result = await createMutation.mutateAsync({
          name: fullName,
          email: client.email || null,
          phone: client.phone || null,
          address: client.addressText || (client.address?.street ? 
            [
              client.address.street,
              client.address.number,
              client.address.floor,
              client.address.postalCode,
              client.address.city,
              client.address.province
            ].filter(Boolean).join(', ') : null),
          clientType: mappedClientType as "particular" | "student" | "professional" | "music_school" | "conservatory" | "concert_hall",
          notes: client.notes || null,
          taxId: client.taxId || null,
          city: client.address?.city || null,
          postalCode: client.address?.postalCode || null,
          region: client.address?.province || null,
        });

        return serverToLocalClient(result as ServerClient);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido al crear cliente';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [createMutation]
  );

  // Actualizar cliente
  const updateClient = useCallback(
    async (id: string, updates: Partial<Client>): Promise<void> => {
      const updateData: Record<string, unknown> = {};

      if (updates.firstName !== undefined || updates.lastName1 !== undefined || updates.lastName2 !== undefined) {
        const existingClient = clients.find(c => c.id === id);
        const firstName = updates.firstName ?? existingClient?.firstName ?? '';
        const lastName1 = updates.lastName1 ?? existingClient?.lastName1 ?? '';
        const lastName2 = updates.lastName2 ?? existingClient?.lastName2 ?? '';
        updateData.name = [firstName, lastName1, lastName2].filter(Boolean).join(' ');
      }

      if (updates.email !== undefined) updateData.email = updates.email || null;
      if (updates.phone !== undefined) updateData.phone = updates.phone || null;
      if (updates.addressText !== undefined) updateData.address = updates.addressText || null;
      if (updates.type !== undefined) updateData.clientType = updates.type;
      if (updates.notes !== undefined) updateData.notes = updates.notes || null;
      if (updates.taxId !== undefined) updateData.taxId = updates.taxId || null;

      // Dirección estructurada
      if (updates.address) {
        updateData.addressStructured = {
          street: updates.address.street || null,
          number: updates.address.number || null,
          floor: updates.address.floor || null,
          postalCode: updates.address.postalCode || null,
          city: updates.address.city || null,
          province: updates.address.province || null,
        };
        updateData.city = updates.address.city || null;
        updateData.postalCode = updates.address.postalCode || null;
        updateData.region = updates.address.province || null;
      }

      try {
        await updateMutation.mutateAsync({
          id: parseInt(id, 10),
          ...updateData,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido al actualizar cliente';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [updateMutation, clients]
  );

  // Eliminar cliente
  const deleteClient = useCallback(
    async (id: string): Promise<void> => {
      try {
        await deleteMutation.mutateAsync({ id: parseInt(id, 10) });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido al eliminar cliente';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [deleteMutation]
  );

  // Obtener cliente por ID
  const getClient = useCallback(
    (id: string) => clients.find((c) => c.id === id),
    [clients]
  );

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    clients,
    loading,
    error: error || (queryError?.message ?? null),
    addClient,
    updateClient,
    deleteClient,
    getClient,
    refresh: refetch,
    clearError,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error?.message ?? null,
    updateError: updateMutation.error?.message ?? null,
    deleteError: deleteMutation.error?.message ?? null,
  };
}
