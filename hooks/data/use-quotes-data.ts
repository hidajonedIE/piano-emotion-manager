/**
 * Hook de Presupuestos basado en tRPC
 * Piano Emotion Manager
 */

import { useCallback, useMemo, useState } from 'react';
import { trpc } from '@/utils/trpc';

type ServerQuote = {
  id: number;
  quoteNumber: string;
  clientId: number;
  clientName: string | null;
  date: Date;
  validUntil: Date | null;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  subtotal: string;
  tax: string;
  total: string;
  notes: string | null;
  items: any;
  partnerId: number;
  createdAt: Date;
  updatedAt: Date;
};

export type LocalQuote = {
  id: string;
  quoteNumber: string;
  clientId: string;
  clientName?: string;
  date: string;
  validUntil?: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  items: any[];
  createdAt: string;
  updatedAt: string;
};

function serverToLocalQuote(server: ServerQuote): LocalQuote {
  return {
    id: String(server.id),
    quoteNumber: server.quoteNumber,
    clientId: String(server.clientId),
    clientName: server.clientName || undefined,
    date: server.date instanceof Date ? server.date.toISOString() : String(server.date),
    validUntil: server.validUntil 
      ? (server.validUntil instanceof Date ? server.validUntil.toISOString() : String(server.validUntil))
      : undefined,
    status: server.status,
    subtotal: parseFloat(server.subtotal),
    tax: parseFloat(server.tax),
    total: parseFloat(server.total),
    notes: server.notes || undefined,
    items: Array.isArray(server.items) ? server.items : [],
    createdAt: server.createdAt instanceof Date ? server.createdAt.toISOString() : String(server.createdAt),
    updatedAt: server.updatedAt instanceof Date ? server.updatedAt.toISOString() : String(server.updatedAt),
  };
}

interface UseQuotesDataOptions {
  search?: string;
  status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  clientId?: number;
  dateFrom?: string;
  dateTo?: string;
  pageSize?: number;
}

export function useQuotesData(options: UseQuotesDataOptions = {}) {
  const { search, status, clientId, dateFrom, dateTo, pageSize = 30 } = options;
  const utils = trpc.useUtils();
  const [error, setError] = useState<string | null>(null);

  const { 
    data,
    isLoading: loading, 
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    error: queryError 
  } = trpc.quotes.list.useInfiniteQuery(
    {
      limit: pageSize,
      search: search || undefined,
      status: status || undefined,
      clientId: clientId || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      staleTime: 5 * 60 * 1000,
      retry: 2,
      onError: (err) => {
        console.error('Error al cargar presupuestos:', err);
        setError('Error al cargar los presupuestos');
      },
    }
  );

  const createMutation = trpc.quotes.create.useMutation({
    onSuccess: () => {
      utils.quotes.list.invalidate();
      setError(null);
    },
    onError: (err) => {
      console.error('Error al crear presupuesto:', err);
      setError(err.message || 'Error al crear el presupuesto');
      throw err;
    },
  });

  const updateMutation = trpc.quotes.update.useMutation({
    onSuccess: () => {
      utils.quotes.list.invalidate();
      setError(null);
    },
    onError: (err) => {
      console.error('Error al actualizar presupuesto:', err);
      setError(err.message || 'Error al actualizar el presupuesto');
      throw err;
    },
  });

  const deleteMutation = trpc.quotes.delete.useMutation({
    onSuccess: () => {
      utils.quotes.list.invalidate();
      setError(null);
    },
    onError: (err) => {
      console.error('Error al eliminar presupuesto:', err);
      setError(err.message || 'Error al eliminar el presupuesto');
      throw err;
    },
  });

  const quotes: LocalQuote[] = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => (page.items || []).map(serverToLocalQuote));
  }, [data]);

  const totalQuotes = data?.pages[0]?.total || 0;
  const stats = data?.pages[0]?.stats || null;

  const addQuote = useCallback(
    async (quote: Omit<LocalQuote, 'id' | 'quoteNumber' | 'createdAt' | 'updatedAt'>): Promise<LocalQuote> => {
      try {
        const result = await createMutation.mutateAsync({
          clientId: parseInt(quote.clientId),
          date: new Date(quote.date),
          validUntil: quote.validUntil ? new Date(quote.validUntil) : null,
          status: quote.status,
          subtotal: quote.subtotal.toString(),
          tax: quote.tax.toString(),
          total: quote.total.toString(),
          notes: quote.notes || null,
          items: quote.items,
        });
        return serverToLocalQuote(result as ServerQuote);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [createMutation]
  );

  const updateQuote = useCallback(
    async (id: string, updates: Partial<LocalQuote>): Promise<void> => {
      const updateData: Record<string, unknown> = { id: parseInt(id) };
      if (updates.clientId !== undefined) updateData.clientId = parseInt(updates.clientId);
      if (updates.date !== undefined) updateData.date = new Date(updates.date);
      if (updates.validUntil !== undefined) updateData.validUntil = updates.validUntil ? new Date(updates.validUntil) : null;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.subtotal !== undefined) updateData.subtotal = updates.subtotal.toString();
      if (updates.tax !== undefined) updateData.tax = updates.tax.toString();
      if (updates.total !== undefined) updateData.total = updates.total.toString();
      if (updates.notes !== undefined) updateData.notes = updates.notes || null;
      if (updates.items !== undefined) updateData.items = updates.items;

      try {
        await updateMutation.mutateAsync(updateData as any);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [updateMutation]
  );

  const deleteQuote = useCallback(
    async (id: string): Promise<void> => {
      try {
        await deleteMutation.mutateAsync({ id: parseInt(id) });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [deleteMutation]
  );

  const getQuote = useCallback((id: string) => quotes.find(q => q.id === id), [quotes]);
  const getQuotesByClient = useCallback((clientId: string) => quotes.filter(q => q.clientId === clientId), [quotes]);
  const markAsSent = useCallback(async (id: string) => await updateQuote(id, { status: 'sent' }), [updateQuote]);
  const markAsAccepted = useCallback(async (id: string) => await updateQuote(id, { status: 'accepted' }), [updateQuote]);
  const markAsRejected = useCallback(async (id: string) => await updateQuote(id, { status: 'rejected' }), [updateQuote]);

  return {
    quotes,
    loading,
    error,
    totalQuotes,
    stats,
    addQuote,
    updateQuote,
    deleteQuote,
    getQuote,
    getQuotesByClient,
    markAsSent,
    markAsAccepted,
    markAsRejected,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  };
}
