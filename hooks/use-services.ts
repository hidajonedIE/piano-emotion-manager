/**
 * Hook para gestión de servicios de piano
 */
import { useState, useCallback } from 'react';
import { trpc } from '@/lib/trpc';

export interface Service {
  id: number;
  pianoId: number;
  type: string;
  date: Date;
  duration?: number;
  notes?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  price?: number;
  technicianId?: string;
}

export function useServices() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const utils = trpc.useUtils();

  // Obtener todos los servicios
  const servicesQuery = trpc.services?.list?.useQuery(undefined, {
    enabled: true,
  });

  // Crear servicio
  const createMutation = trpc.services?.create?.useMutation({
    onSuccess: () => {
      utils.services?.list?.invalidate();
    },
  });

  // Actualizar servicio
  const updateMutation = trpc.services?.update?.useMutation({
    onSuccess: () => {
      utils.services?.list?.invalidate();
    },
  });

  // Eliminar servicio
  const deleteMutation = trpc.services?.delete?.useMutation({
    onSuccess: () => {
      utils.services?.list?.invalidate();
    },
  });

  const createService = useCallback(async (data: Omit<Service, 'id'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await createMutation.mutateAsync(data as any);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear servicio');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [createMutation]);

  const updateService = useCallback(async (id: number, data: Partial<Service>) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await updateMutation.mutateAsync({ id, ...data } as any);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar servicio');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [updateMutation]);

  const deleteService = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await deleteMutation.mutateAsync({ id } as any);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar servicio');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [deleteMutation]);

  return {
    services: servicesQuery?.data || [],
    isLoading: isLoading || servicesQuery?.isLoading,
    error: error || (servicesQuery?.error?.message ?? null),
    createService,
    updateService,
    deleteService,
    refetch: servicesQuery?.refetch,
  };
}

export default useServices;
