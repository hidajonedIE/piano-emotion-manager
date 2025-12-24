/**
 * Hook de Clientes basado en tRPC
 * Piano Emotion Manager
 * 
 * Este hook reemplaza la versión de AsyncStorage por una que usa tRPC
 * para sincronización con el servidor.
 */

import { useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import type { Client } from '@/types';

// Tipo del cliente del servidor (puede diferir ligeramente del tipo local)
type ServerClient = {
  id: number;
  odId: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  clientType: string;
  notes: string | null;
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
    addressText: server.address || undefined,
    notes: server.notes || undefined,
    createdAt: server.createdAt.toISOString(),
    updatedAt: server.updatedAt.toISOString(),
  };
}

export function useClientsData() {
  const utils = trpc.useUtils();

  // Query para obtener todos los clientes
  const { data: serverClients, isLoading: loading, refetch } = trpc.clients.list.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutations
  const createMutation = trpc.clients.create.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
    },
  });

  const updateMutation = trpc.clients.update.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
    },
  });

  const deleteMutation = trpc.clients.delete.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
    },
  });

  // Convertir clientes del servidor al formato local
  const clients: Client[] = (serverClients || []).map(serverToLocalClient);

  // Añadir cliente
  const addClient = useCallback(
    async (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
      const fullName = [client.firstName, client.lastName1, client.lastName2]
        .filter(Boolean)
        .join(' ');

      const result = await createMutation.mutateAsync({
        name: fullName,
        email: client.email || null,
        phone: client.phone || null,
        address: client.addressText || client.address?.street || null,
        clientType: client.type as "particular" | "student" | "professional" | "music_school" | "conservatory" | "concert_hall",
        notes: client.notes || null,
      });

      return serverToLocalClient(result as ServerClient);
    },
    [createMutation]
  );

  // Actualizar cliente
  const updateClient = useCallback(
    async (id: string, updates: Partial<Client>) => {
      const updateData: Record<string, unknown> = {};

      if (updates.firstName !== undefined || updates.lastName1 !== undefined || updates.lastName2 !== undefined) {
        // Si se actualiza algún campo del nombre, reconstruir el nombre completo
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

      await updateMutation.mutateAsync({
        id: parseInt(id, 10),
        ...updateData,
      });
    },
    [updateMutation, clients]
  );

  // Eliminar cliente
  const deleteClient = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync({ id: parseInt(id, 10) });
    },
    [deleteMutation]
  );

  // Obtener cliente por ID
  const getClient = useCallback(
    (id: string) => clients.find((c) => c.id === id),
    [clients]
  );

  return {
    clients,
    loading,
    addClient,
    updateClient,
    deleteClient,
    getClient,
    refresh: refetch,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
