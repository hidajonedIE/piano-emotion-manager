/**
 * Hooks de React para Gestión de Stock
 * Piano Emotion Manager
 */

import { useState, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import type { StockMovementType } from '../../drizzle/inventory-schema.js';

// ============================================================================
// Types
// ============================================================================

export interface MovementFilters {
  productId?: number;
  warehouseId?: number;
  type?: StockMovementType;
  dateFrom?: Date;
  dateTo?: Date;
}

// ============================================================================
// useStock Hook
// ============================================================================

export function useStock(productId: number | null) {
  const {
    data: stockLevels,
    isLoading,
    error,
    refetch,
  } = trpc.inventory.stock.getStockLevels.useQuery(
    { productId: productId! },
    { enabled: productId !== null }
  );

  const {
    data: totalStock,
  } = trpc.inventory.stock.getTotalStock.useQuery(
    { productId: productId! },
    { enabled: productId !== null }
  );

  return {
    stockLevels: stockLevels || [],
    totalStock: totalStock || 0,
    isLoading,
    error,
    refetch,
  };
}

// ============================================================================
// useStockMovements Hook
// ============================================================================

export function useStockMovements(options: { pageSize?: number } = {}) {
  const { pageSize = 50 } = options;
  
  const [filters, setFilters] = useState<MovementFilters>({});
  const [page, setPage] = useState(1);

  const {
    data,
    isLoading,
    error,
    refetch,
  } = trpc.inventory.stock.getMovementHistory.useQuery({
    filters,
    page,
    pageSize,
  });

  const updateFilters = useCallback((newFilters: Partial<MovementFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  return {
    movements: data?.movements || [],
    total: data?.total || 0,
    page: data?.page || 1,
    pageSize: data?.pageSize || pageSize,
    filters,
    isLoading,
    error,
    updateFilters,
    clearFilters,
    setPage,
    refetch,
  };
}

// ============================================================================
// useStockOperations Hook
// ============================================================================

export function useStockOperations() {
  const utils = trpc.useUtils();

  const recordMovementMutation = trpc.inventory.stock.recordMovement.useMutation();
  const transferMutation = trpc.inventory.stock.transfer.useMutation();
  const adjustMutation = trpc.inventory.stock.adjust.useMutation();
  const recordServiceUsageMutation = trpc.inventory.stock.recordServiceUsage.useMutation();
  const reserveStockMutation = trpc.inventory.stock.reserveStock.useMutation();
  const releaseStockMutation = trpc.inventory.stock.releaseReservedStock.useMutation();

  const invalidateStock = useCallback(() => {
    utils.inventory.stock.invalidate();
    utils.inventory.product.invalidate();
  }, [utils]);

  // Record movement
  const recordMovement = useCallback(async (input: {
    productId: number;
    warehouseId: number;
    type: StockMovementType;
    quantity: number;
    unitCost?: number;
    notes?: string;
    batchNumber?: string;
    serialNumber?: string;
  }) => {
    const result = await recordMovementMutation.mutateAsync(input);
    invalidateStock();
    return result;
  }, [recordMovementMutation, invalidateStock]);

  // Transfer between warehouses
  const transfer = useCallback(async (input: {
    productId: number;
    fromWarehouseId: number;
    toWarehouseId: number;
    quantity: number;
    notes?: string;
  }) => {
    const result = await transferMutation.mutateAsync(input);
    invalidateStock();
    return result;
  }, [transferMutation, invalidateStock]);

  // Adjust stock (inventory count)
  const adjust = useCallback(async (input: {
    productId: number;
    warehouseId: number;
    newQuantity: number;
    reason: string;
    notes?: string;
  }) => {
    const result = await adjustMutation.mutateAsync(input);
    invalidateStock();
    return result;
  }, [adjustMutation, invalidateStock]);

  // Record usage in service
  const recordServiceUsage = useCallback(async (input: {
    serviceId: number;
    productId: number;
    warehouseId: number;
    quantity: number;
  }) => {
    const result = await recordServiceUsageMutation.mutateAsync(input);
    invalidateStock();
    return result;
  }, [recordServiceUsageMutation, invalidateStock]);

  // Reserve stock
  const reserveStock = useCallback(async (input: {
    productId: number;
    warehouseId: number;
    quantity: number;
  }) => {
    const result = await reserveStockMutation.mutateAsync(input);
    invalidateStock();
    return result.success;
  }, [reserveStockMutation, invalidateStock]);

  // Release reserved stock
  const releaseStock = useCallback(async (input: {
    productId: number;
    warehouseId: number;
    quantity: number;
  }) => {
    await releaseStockMutation.mutateAsync(input);
    invalidateStock();
  }, [releaseStockMutation, invalidateStock]);

  return {
    recordMovement,
    transfer,
    adjust,
    recordServiceUsage,
    reserveStock,
    releaseStock,
    
    isRecording: recordMovementMutation.isPending,
    isTransferring: transferMutation.isPending,
    isAdjusting: adjustMutation.isPending,
    isReserving: reserveStockMutation.isPending,
    
    error: recordMovementMutation.error || 
           transferMutation.error || 
           adjustMutation.error,
  };
}

// ============================================================================
// useStockAlerts Hook
// ============================================================================

export function useStockAlerts() {
  const {
    data: alerts,
    isLoading,
    error,
    refetch,
  } = trpc.inventory.stock.getActiveAlerts.useQuery();

  const markAsReadMutation = trpc.inventory.stock.markAlertAsRead.useMutation();
  const resolveMutation = trpc.inventory.stock.resolveAlert.useMutation();

  const markAsRead = useCallback(async (alertId: number) => {
    await markAsReadMutation.mutateAsync({ alertId });
    refetch();
  }, [markAsReadMutation, refetch]);

  const resolveAlert = useCallback(async (alertId: number) => {
    await resolveMutation.mutateAsync({ alertId });
    refetch();
  }, [resolveMutation, refetch]);

  const unreadCount = alerts?.filter(a => !a.isRead).length || 0;
  const criticalCount = alerts?.filter(a => a.alertType === 'out_of_stock').length || 0;

  return {
    alerts: alerts || [],
    unreadCount,
    criticalCount,
    isLoading,
    error,
    markAsRead,
    resolveAlert,
    refetch,
  };
}

// ============================================================================
// useInventoryValuation Hook
// ============================================================================

export function useInventoryValuation(warehouseId?: number) {
  const {
    data: valuation,
    isLoading,
    error,
    refetch,
  } = trpc.inventory.stock.getInventoryValuation.useQuery(
    warehouseId ? { warehouseId } : undefined
  );

  return {
    totalValue: valuation?.totalValue || 0,
    byCategory: valuation?.byCategory || {},
    byWarehouse: valuation?.byWarehouse || [],
    isLoading,
    error,
    refetch,
  };
}

// ============================================================================
// useAvailableStock Hook
// ============================================================================

export function useAvailableStock(productId: number | null, warehouseId: number | null) {
  const {
    data: availableStock,
    isLoading,
    error,
    refetch,
  } = trpc.inventory.stock.getAvailableStock.useQuery(
    { productId: productId!, warehouseId: warehouseId! },
    { enabled: productId !== null && warehouseId !== null }
  );

  return {
    availableStock: availableStock || 0,
    isLoading,
    error,
    refetch,
  };
}
