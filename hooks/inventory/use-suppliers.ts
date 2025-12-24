/**
 * Hooks de React para Gestión de Proveedores
 * Piano Emotion Manager
 */

import { useState, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import type { PurchaseOrderStatus } from '@/drizzle/inventory-schema';

// ============================================================================
// Types
// ============================================================================

export interface SupplierFilters {
  search?: string;
  isActive?: boolean;
  country?: string;
}

export interface PurchaseOrderFilters {
  supplierId?: number;
  warehouseId?: number;
  status?: PurchaseOrderStatus;
  dateFrom?: Date;
  dateTo?: Date;
}

// ============================================================================
// useSuppliers Hook
// ============================================================================

export function useSuppliers(options: { pageSize?: number } = {}) {
  const { pageSize = 20 } = options;
  
  const [filters, setFilters] = useState<SupplierFilters>({});
  const [page, setPage] = useState(1);

  const {
    data,
    isLoading,
    error,
    refetch,
  } = trpc.inventory.supplier.search.useQuery({
    filters,
    page,
    pageSize,
  });

  const createMutation = trpc.inventory.supplier.create.useMutation();
  const updateMutation = trpc.inventory.supplier.update.useMutation();
  const deactivateMutation = trpc.inventory.supplier.deactivate.useMutation();

  const updateFilters = useCallback((newFilters: Partial<SupplierFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  const createSupplier = useCallback(async (input: Parameters<typeof createMutation.mutateAsync>[0]) => {
    const result = await createMutation.mutateAsync(input);
    refetch();
    return result;
  }, [createMutation, refetch]);

  const updateSupplier = useCallback(async (input: Parameters<typeof updateMutation.mutateAsync>[0]) => {
    const result = await updateMutation.mutateAsync(input);
    refetch();
    return result;
  }, [updateMutation, refetch]);

  const deactivateSupplier = useCallback(async (id: number) => {
    await deactivateMutation.mutateAsync({ id });
    refetch();
  }, [deactivateMutation, refetch]);

  return {
    suppliers: data?.suppliers || [],
    total: data?.total || 0,
    page: data?.page || 1,
    pageSize: data?.pageSize || pageSize,
    filters,
    isLoading,
    error,
    updateFilters,
    clearFilters,
    setPage,
    createSupplier,
    updateSupplier,
    deactivateSupplier,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    refetch,
  };
}

// ============================================================================
// useSupplier Hook (single supplier)
// ============================================================================

export function useSupplier(supplierId: number | null) {
  const {
    data: supplier,
    isLoading,
    error,
    refetch,
  } = trpc.inventory.supplier.getById.useQuery(
    { id: supplierId! },
    { enabled: supplierId !== null }
  );

  return {
    supplier,
    isLoading,
    error,
    refetch,
  };
}

// ============================================================================
// useAllSuppliers Hook (for dropdowns)
// ============================================================================

export function useAllSuppliers() {
  const {
    data: suppliers,
    isLoading,
    error,
  } = trpc.inventory.supplier.getAll.useQuery();

  const supplierOptions = (suppliers || []).map(s => ({
    value: s.id,
    label: s.name,
    code: s.code,
  }));

  return {
    suppliers: suppliers || [],
    supplierOptions,
    isLoading,
    error,
  };
}

// ============================================================================
// useSupplierProducts Hook
// ============================================================================

export function useSupplierProducts(supplierId: number | null) {
  const {
    data: products,
    isLoading,
    error,
    refetch,
  } = trpc.inventory.supplier.getProducts.useQuery(
    { supplierId: supplierId! },
    { enabled: supplierId !== null }
  );

  const addProductMutation = trpc.inventory.supplier.addProduct.useMutation();
  const updateProductMutation = trpc.inventory.supplier.updateProduct.useMutation();

  const addProduct = useCallback(async (input: {
    productId: number;
    supplierSku?: string;
    supplierProductName?: string;
    unitCost: number;
    currency?: string;
    minOrderQuantity?: number;
    packSize?: number;
    leadTimeDays?: number;
    isPreferred?: boolean;
  }) => {
    if (!supplierId) return;
    const result = await addProductMutation.mutateAsync({
      supplierId,
      ...input,
    });
    refetch();
    return result;
  }, [supplierId, addProductMutation, refetch]);

  const updateProduct = useCallback(async (
    id: number,
    data: Partial<Parameters<typeof addProductMutation.mutateAsync>[0]>
  ) => {
    const result = await updateProductMutation.mutateAsync({ id, data });
    refetch();
    return result;
  }, [updateProductMutation, refetch]);

  return {
    products: products || [],
    isLoading,
    error,
    addProduct,
    updateProduct,
    isAdding: addProductMutation.isPending,
    isUpdating: updateProductMutation.isPending,
    refetch,
  };
}

// ============================================================================
// useProductSuppliers Hook
// ============================================================================

export function useProductSuppliers(productId: number | null) {
  const {
    data: suppliers,
    isLoading,
    error,
    refetch,
  } = trpc.inventory.supplier.getProductSuppliers.useQuery(
    { productId: productId! },
    { enabled: productId !== null }
  );

  const {
    data: preferredSupplier,
  } = trpc.inventory.supplier.getPreferredSupplier.useQuery(
    { productId: productId! },
    { enabled: productId !== null }
  );

  return {
    suppliers: suppliers || [],
    preferredSupplier,
    isLoading,
    error,
    refetch,
  };
}

// ============================================================================
// usePurchaseOrders Hook
// ============================================================================

export function usePurchaseOrders(options: { pageSize?: number } = {}) {
  const { pageSize = 20 } = options;
  
  const [filters, setFilters] = useState<PurchaseOrderFilters>({});
  const [page, setPage] = useState(1);

  const {
    data,
    isLoading,
    error,
    refetch,
  } = trpc.inventory.supplier.searchPurchaseOrders.useQuery({
    filters,
    page,
    pageSize,
  });

  const createMutation = trpc.inventory.supplier.createPurchaseOrder.useMutation();
  const updateStatusMutation = trpc.inventory.supplier.updateOrderStatus.useMutation();
  const receiveMutation = trpc.inventory.supplier.receivePurchaseOrder.useMutation();
  const cancelMutation = trpc.inventory.supplier.cancelPurchaseOrder.useMutation();

  const updateFilters = useCallback((newFilters: Partial<PurchaseOrderFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  const createOrder = useCallback(async (input: Parameters<typeof createMutation.mutateAsync>[0]) => {
    const result = await createMutation.mutateAsync(input);
    refetch();
    return result;
  }, [createMutation, refetch]);

  const updateOrderStatus = useCallback(async (orderId: number, status: PurchaseOrderStatus) => {
    const result = await updateStatusMutation.mutateAsync({ orderId, status });
    refetch();
    return result;
  }, [updateStatusMutation, refetch]);

  const receiveOrder = useCallback(async (input: Parameters<typeof receiveMutation.mutateAsync>[0]) => {
    await receiveMutation.mutateAsync(input);
    refetch();
  }, [receiveMutation, refetch]);

  const cancelOrder = useCallback(async (orderId: number) => {
    await cancelMutation.mutateAsync({ orderId });
    refetch();
  }, [cancelMutation, refetch]);

  return {
    orders: data?.orders || [],
    total: data?.total || 0,
    page: data?.page || 1,
    pageSize: data?.pageSize || pageSize,
    filters,
    isLoading,
    error,
    updateFilters,
    clearFilters,
    setPage,
    createOrder,
    updateOrderStatus,
    receiveOrder,
    cancelOrder,
    isCreating: createMutation.isPending,
    isUpdating: updateStatusMutation.isPending,
    isReceiving: receiveMutation.isPending,
    refetch,
  };
}

// ============================================================================
// usePurchaseOrder Hook (single order)
// ============================================================================

export function usePurchaseOrder(orderId: number | null) {
  const {
    data: order,
    isLoading,
    error,
    refetch,
  } = trpc.inventory.supplier.getPurchaseOrder.useQuery(
    { id: orderId! },
    { enabled: orderId !== null }
  );

  return {
    order,
    isLoading,
    error,
    refetch,
  };
}

// ============================================================================
// useReorderSuggestions Hook
// ============================================================================

export function useReorderSuggestions() {
  const {
    data: suggestions,
    isLoading,
    error,
    refetch,
  } = trpc.inventory.supplier.getReorderSuggestions.useQuery();

  const totalEstimatedCost = (suggestions || []).reduce(
    (sum, s) => sum + s.estimatedCost,
    0
  );

  return {
    suggestions: suggestions || [],
    count: suggestions?.length || 0,
    totalEstimatedCost,
    isLoading,
    error,
    refetch,
  };
}

// ============================================================================
// useCreatePurchaseOrderFromSuggestions Hook
// ============================================================================

export function useCreatePurchaseOrderFromSuggestions() {
  const createMutation = trpc.inventory.supplier.createPurchaseOrder.useMutation();
  const utils = trpc.useUtils();

  const createFromSuggestions = useCallback(async (
    supplierId: number,
    warehouseId: number,
    suggestions: Array<{
      productId: number;
      quantity: number;
      unitCost: number;
    }>,
    options?: {
      expectedDeliveryDate?: Date;
      notes?: string;
    }
  ) => {
    const result = await createMutation.mutateAsync({
      supplierId,
      warehouseId,
      expectedDeliveryDate: options?.expectedDeliveryDate,
      notes: options?.notes,
      lines: suggestions.map(s => ({
        productId: s.productId,
        quantity: s.quantity,
        unitCost: s.unitCost,
      })),
    });

    utils.inventory.supplier.getReorderSuggestions.invalidate();
    utils.inventory.supplier.searchPurchaseOrders.invalidate();

    return result;
  }, [createMutation, utils]);

  return {
    createFromSuggestions,
    isCreating: createMutation.isPending,
    error: createMutation.error,
  };
}
