/**
 * Hooks de React para Gestión de Almacenes
 * Piano Emotion Manager
 */

import { useState, useCallback, useMemo } from 'react';
import { trpc } from '@/utils/trpc';
import type { WarehouseType } from '../../drizzle/inventory-schema.js';

// ============================================================================
// useWarehouses Hook
// ============================================================================

export function useWarehouses(options: { includeInactive?: boolean } = {}) {
  const { includeInactive = false } = options;

  const {
    data: warehouses,
    isLoading,
    error,
    refetch,
  } = trpc.inventory.warehouse.getAll.useQuery({ includeInactive });

  const createMutation = trpc.inventory.warehouse.create.useMutation();
  const updateMutation = trpc.inventory.warehouse.update.useMutation();
  const deactivateMutation = trpc.inventory.warehouse.deactivate.useMutation();
  const activateMutation = trpc.inventory.warehouse.activate.useMutation();

  const createWarehouse = useCallback(async (input: Parameters<typeof createMutation.mutateAsync>[0]) => {
    const result = await createMutation.mutateAsync(input);
    refetch();
    return result;
  }, [createMutation, refetch]);

  const updateWarehouse = useCallback(async (input: Parameters<typeof updateMutation.mutateAsync>[0]) => {
    const result = await updateMutation.mutateAsync(input);
    refetch();
    return result;
  }, [updateMutation, refetch]);

  const deactivateWarehouse = useCallback(async (id: number) => {
    await deactivateMutation.mutateAsync({ id });
    refetch();
  }, [deactivateMutation, refetch]);

  const activateWarehouse = useCallback(async (id: number) => {
    await activateMutation.mutateAsync({ id });
    refetch();
  }, [activateMutation, refetch]);

  // Group warehouses by type
  const warehousesByType = useMemo(() => {
    const grouped: Record<WarehouseType, typeof warehouses> = {
      central: [],
      workshop: [],
      vehicle: [],
      consignment: [],
      virtual: [],
    };

    for (const warehouse of warehouses || []) {
      grouped[warehouse.type].push(warehouse);
    }

    return grouped;
  }, [warehouses]);

  return {
    warehouses: warehouses || [],
    warehousesByType,
    isLoading,
    error,
    createWarehouse,
    updateWarehouse,
    deactivateWarehouse,
    activateWarehouse,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    refetch,
  };
}

// ============================================================================
// useWarehouse Hook (single warehouse)
// ============================================================================

export function useWarehouse(warehouseId: number | null) {
  const {
    data: warehouse,
    isLoading,
    error,
    refetch,
  } = trpc.inventory.warehouse.getWithStats.useQuery(
    { id: warehouseId! },
    { enabled: warehouseId !== null }
  );

  return {
    warehouse: warehouse?.warehouse,
    stats: warehouse ? {
      totalProducts: warehouse.totalProducts,
      totalValue: warehouse.totalValue,
      lowStockProducts: warehouse.lowStockProducts,
      outOfStockProducts: warehouse.outOfStockProducts,
    } : null,
    isLoading,
    error,
    refetch,
  };
}

// ============================================================================
// useWarehouseStock Hook
// ============================================================================

export function useWarehouseStock(warehouseId: number | null, options: { pageSize?: number } = {}) {
  const { pageSize = 50 } = options;
  const [page, setPage] = useState(1);

  const {
    data,
    isLoading,
    error,
    refetch,
  } = trpc.inventory.warehouse.getStockSummary.useQuery(
    { warehouseId: warehouseId!, page, pageSize },
    { enabled: warehouseId !== null }
  );

  const updateLocationMutation = trpc.inventory.warehouse.updateProductLocation.useMutation();

  const updateProductLocation = useCallback(async (productId: number, location: string) => {
    if (!warehouseId) return;
    await updateLocationMutation.mutateAsync({
      warehouseId,
      productId,
      location,
    });
    refetch();
  }, [warehouseId, updateLocationMutation, refetch]);

  return {
    warehouseName: data?.warehouseName || '',
    products: data?.products || [],
    totalProducts: data?.totalProducts || 0,
    totalValue: data?.totalValue || 0,
    page,
    setPage,
    isLoading,
    error,
    updateProductLocation,
    refetch,
  };
}

// ============================================================================
// useDefaultWarehouse Hook
// ============================================================================

export function useDefaultWarehouse() {
  const {
    data: warehouse,
    isLoading,
    error,
  } = trpc.inventory.warehouse.getDefault.useQuery();

  return {
    warehouse,
    isLoading,
    error,
  };
}

// ============================================================================
// useMyVehicle Hook (technician's vehicle warehouse)
// ============================================================================

export function useMyVehicle() {
  const {
    data: vehicle,
    isLoading,
    error,
    refetch,
  } = trpc.inventory.warehouse.getMyVehicle.useQuery();

  const createVehicleMutation = trpc.inventory.warehouse.createTechnicianVehicle.useMutation();

  const createMyVehicle = useCallback(async (technicianName: string) => {
    // Note: userId will be taken from context in the backend
    const result = await createVehicleMutation.mutateAsync({
      userId: 0, // Will be overridden by backend
      technicianName,
    });
    refetch();
    return result;
  }, [createVehicleMutation, refetch]);

  return {
    vehicle,
    hasVehicle: !!vehicle,
    isLoading,
    error,
    createMyVehicle,
    isCreating: createVehicleMutation.isPending,
    refetch,
  };
}

// ============================================================================
// useNearbyWarehouses Hook
// ============================================================================

export function useNearbyWarehouses(
  latitude: number | null,
  longitude: number | null,
  radiusKm: number = 50
) {
  const {
    data: warehouses,
    isLoading,
    error,
    refetch,
  } = trpc.inventory.warehouse.getNearby.useQuery(
    { latitude: latitude!, longitude: longitude!, radiusKm },
    { enabled: latitude !== null && longitude !== null }
  );

  return {
    warehouses: warehouses || [],
    isLoading,
    error,
    refetch,
  };
}

// ============================================================================
// useWarehousesByType Hook
// ============================================================================

export function useWarehousesByType(type: WarehouseType) {
  const {
    data: warehouses,
    isLoading,
    error,
    refetch,
  } = trpc.inventory.warehouse.getByType.useQuery({ type });

  return {
    warehouses: warehouses || [],
    isLoading,
    error,
    refetch,
  };
}

// ============================================================================
// useWarehouseStats Hook
// ============================================================================

export function useWarehouseStats() {
  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = trpc.inventory.warehouse.getAllStats.useQuery();

  return {
    totalWarehouses: stats?.totalWarehouses || 0,
    byType: stats?.byType || {},
    totalInventoryValue: stats?.totalInventoryValue || 0,
    totalProducts: stats?.totalProducts || 0,
    isLoading,
    error,
    refetch,
  };
}

// ============================================================================
// useWarehouseSelector Hook (for dropdowns)
// ============================================================================

export function useWarehouseSelector(options: {
  type?: WarehouseType;
  includeDefault?: boolean;
} = {}) {
  const { type, includeDefault = true } = options;

  const { warehouses, isLoading } = useWarehouses();
  const { warehouse: defaultWarehouse } = useDefaultWarehouse();

  const filteredWarehouses = useMemo(() => {
    let result = warehouses;
    
    if (type) {
      result = result.filter(w => w.type === type);
    }

    return result;
  }, [warehouses, type]);

  const warehouseOptions = useMemo(() => {
    return filteredWarehouses.map(w => ({
      value: w.id,
      label: w.name,
      type: w.type,
      isDefault: w.isDefault,
    }));
  }, [filteredWarehouses]);

  return {
    warehouses: filteredWarehouses,
    warehouseOptions,
    defaultWarehouseId: defaultWarehouse?.id,
    isLoading,
  };
}
