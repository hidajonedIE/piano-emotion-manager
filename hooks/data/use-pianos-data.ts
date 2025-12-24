/**
 * Hook de Pianos basado en tRPC
 * Piano Emotion Manager
 * 
 * Este hook reemplaza la versión de AsyncStorage por una que usa tRPC
 * para sincronización con el servidor.
 */

import { useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import type { Piano } from '@/types';

// Tipo del piano del servidor
type ServerPiano = {
  id: number;
  odId: string;
  clientId: number;
  brand: string;
  model: string | null;
  serialNumber: string | null;
  year: number | null;
  category: string;
  pianoType: string;
  condition: string | null;
  location: string | null;
  notes: string | null;
  photos: string[] | null;
  createdAt: Date;
  updatedAt: Date;
};

// Convertir piano del servidor al formato local
function serverToLocalPiano(server: ServerPiano): Piano {
  return {
    id: String(server.id),
    clientId: String(server.clientId),
    brand: server.brand,
    model: server.model || undefined,
    serialNumber: server.serialNumber || undefined,
    year: server.year || undefined,
    category: server.category as Piano['category'],
    pianoType: server.pianoType,
    condition: (server.condition as Piano['condition']) || 'good',
    location: server.location || undefined,
    notes: server.notes || undefined,
    photos: server.photos || [],
    createdAt: server.createdAt.toISOString(),
    updatedAt: server.updatedAt.toISOString(),
  };
}

export function usePianosData() {
  const utils = trpc.useUtils();

  // Query para obtener todos los pianos
  const { data: serverPianos, isLoading: loading, refetch } = trpc.pianos.list.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutations
  const createMutation = trpc.pianos.create.useMutation({
    onSuccess: () => {
      utils.pianos.list.invalidate();
    },
  });

  const updateMutation = trpc.pianos.update.useMutation({
    onSuccess: () => {
      utils.pianos.list.invalidate();
    },
  });

  const deleteMutation = trpc.pianos.delete.useMutation({
    onSuccess: () => {
      utils.pianos.list.invalidate();
    },
  });

  // Convertir pianos del servidor al formato local
  const pianos: Piano[] = (serverPianos || []).map(serverToLocalPiano);

  // Añadir piano
  const addPiano = useCallback(
    async (piano: Omit<Piano, 'id' | 'createdAt' | 'updatedAt'>) => {
      const result = await createMutation.mutateAsync({
        clientId: parseInt(piano.clientId, 10),
        brand: piano.brand,
        model: piano.model || null,
        serialNumber: piano.serialNumber || null,
        year: piano.year || null,
        category: piano.category,
        pianoType: piano.pianoType,
        condition: piano.condition,
        location: piano.location || null,
        notes: piano.notes || null,
        photos: piano.photos || [],
      });

      return serverToLocalPiano(result as ServerPiano);
    },
    [createMutation]
  );

  // Actualizar piano
  const updatePiano = useCallback(
    async (id: string, updates: Partial<Piano>) => {
      const updateData: Record<string, unknown> = {};

      if (updates.clientId !== undefined) updateData.clientId = parseInt(updates.clientId, 10);
      if (updates.brand !== undefined) updateData.brand = updates.brand;
      if (updates.model !== undefined) updateData.model = updates.model || null;
      if (updates.serialNumber !== undefined) updateData.serialNumber = updates.serialNumber || null;
      if (updates.year !== undefined) updateData.year = updates.year || null;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.pianoType !== undefined) updateData.pianoType = updates.pianoType;
      if (updates.condition !== undefined) updateData.condition = updates.condition;
      if (updates.location !== undefined) updateData.location = updates.location || null;
      if (updates.notes !== undefined) updateData.notes = updates.notes || null;
      if (updates.photos !== undefined) updateData.photos = updates.photos;

      await updateMutation.mutateAsync({
        id: parseInt(id, 10),
        ...updateData,
      });
    },
    [updateMutation]
  );

  // Eliminar piano
  const deletePiano = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync({ id: parseInt(id, 10) });
    },
    [deleteMutation]
  );

  // Obtener piano por ID
  const getPiano = useCallback(
    (id: string) => pianos.find((p) => p.id === id),
    [pianos]
  );

  // Obtener pianos por cliente
  const getPianosByClient = useCallback(
    (clientId: string) => pianos.filter((p) => p.clientId === clientId),
    [pianos]
  );

  return {
    pianos,
    loading,
    addPiano,
    updatePiano,
    deletePiano,
    getPiano,
    getPianosByClient,
    refresh: refetch,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
