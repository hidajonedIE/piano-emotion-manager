/**
 * Hooks de React para Gestión de Productos
 * Piano Emotion Manager
 */

import { useState, useCallback, useMemo } from 'react';
import { trpc } from '@/utils/trpc';
import type { ProductType, ProductCategory } from '@/drizzle/inventory-schema';

// ============================================================================
// Types
// ============================================================================

export interface ProductFilters {
  search?: string;
  type?: ProductType;
  category?: ProductCategory;
  brand?: string;
  isActive?: boolean;
  hasLowStock?: boolean;
  tags?: string[];
}

export interface UseProductsOptions {
  initialFilters?: ProductFilters;
  pageSize?: number;
  autoFetch?: boolean;
}

// ============================================================================
// useProducts Hook
// ============================================================================

export function useProducts(options: UseProductsOptions = {}) {
  const { initialFilters = {}, pageSize = 20, autoFetch = true } = options;
  
  const [filters, setFilters] = useState<ProductFilters>(initialFilters);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Query de búsqueda
  const {
    data,
    isLoading,
    error,
    refetch,
  } = trpc.inventory.product.search.useQuery(
    {
      filters,
      page,
      pageSize,
      sortBy,
      sortOrder,
    },
    { enabled: autoFetch }
  );

  // Mutations
  const createMutation = trpc.inventory.product.create.useMutation();
  const updateMutation = trpc.inventory.product.update.useMutation();
  const deleteMutation = trpc.inventory.product.delete.useMutation();
  const deactivateMutation = trpc.inventory.product.deactivate.useMutation();
  const restoreMutation = trpc.inventory.product.restore.useMutation();
  const duplicateMutation = trpc.inventory.product.duplicate.useMutation();

  // Handlers
  const updateFilters = useCallback((newFilters: Partial<ProductFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1); // Reset page when filters change
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const changeSort = useCallback((field: string, order?: 'asc' | 'desc') => {
    if (field === sortBy && !order) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(order || 'asc');
    }
  }, [sortBy]);

  // CRUD operations
  const createProduct = useCallback(async (input: Parameters<typeof createMutation.mutateAsync>[0]) => {
    const result = await createMutation.mutateAsync(input);
    refetch();
    return result;
  }, [createMutation, refetch]);

  const updateProduct = useCallback(async (input: Parameters<typeof updateMutation.mutateAsync>[0]) => {
    const result = await updateMutation.mutateAsync(input);
    refetch();
    return result;
  }, [updateMutation, refetch]);

  const deleteProduct = useCallback(async (id: number) => {
    await deleteMutation.mutateAsync({ id });
    refetch();
  }, [deleteMutation, refetch]);

  const deactivateProduct = useCallback(async (id: number) => {
    await deactivateMutation.mutateAsync({ id });
    refetch();
  }, [deactivateMutation, refetch]);

  const restoreProduct = useCallback(async (id: number) => {
    await restoreMutation.mutateAsync({ id });
    refetch();
  }, [restoreMutation, refetch]);

  const duplicateProduct = useCallback(async (id: number, newSku: string) => {
    const result = await duplicateMutation.mutateAsync({ id, newSku });
    refetch();
    return result;
  }, [duplicateMutation, refetch]);

  // Computed values
  const pagination = useMemo(() => ({
    page: data?.page || 1,
    pageSize: data?.pageSize || pageSize,
    total: data?.total || 0,
    totalPages: data?.totalPages || 1,
    hasNextPage: (data?.page || 1) < (data?.totalPages || 1),
    hasPrevPage: (data?.page || 1) > 1,
  }), [data, pageSize]);

  return {
    // Data
    products: data?.products || [],
    pagination,
    
    // State
    filters,
    sortBy,
    sortOrder,
    isLoading,
    error,
    
    // Filter actions
    updateFilters,
    clearFilters,
    setFilters,
    
    // Pagination actions
    goToPage,
    nextPage: () => goToPage(page + 1),
    prevPage: () => goToPage(page - 1),
    
    // Sort actions
    changeSort,
    
    // CRUD actions
    createProduct,
    updateProduct,
    deleteProduct,
    deactivateProduct,
    restoreProduct,
    duplicateProduct,
    
    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Refetch
    refetch,
  };
}

// ============================================================================
// useProduct Hook (single product)
// ============================================================================

export function useProduct(productId: number | null) {
  const {
    data: product,
    isLoading,
    error,
    refetch,
  } = trpc.inventory.product.getWithStock.useQuery(
    { id: productId! },
    { enabled: productId !== null }
  );

  return {
    product,
    isLoading,
    error,
    refetch,
  };
}

// ============================================================================
// useProductByBarcode Hook
// ============================================================================

export function useProductByBarcode() {
  const [barcode, setBarcode] = useState<string | null>(null);

  const {
    data: product,
    isLoading,
    error,
  } = trpc.inventory.product.getByBarcode.useQuery(
    { barcode: barcode! },
    { enabled: barcode !== null }
  );

  const scanBarcode = useCallback((code: string) => {
    setBarcode(code);
  }, []);

  const clearBarcode = useCallback(() => {
    setBarcode(null);
  }, []);

  return {
    product,
    barcode,
    isLoading,
    error,
    scanBarcode,
    clearBarcode,
  };
}

// ============================================================================
// useLowStockProducts Hook
// ============================================================================

export function useLowStockProducts() {
  const {
    data: products,
    isLoading,
    error,
    refetch,
  } = trpc.inventory.product.getLowStock.useQuery();

  return {
    products: products || [],
    count: products?.length || 0,
    isLoading,
    error,
    refetch,
  };
}

// ============================================================================
// useProductStatistics Hook
// ============================================================================

export function useProductStatistics() {
  const {
    data: statistics,
    isLoading,
    error,
    refetch,
  } = trpc.inventory.product.getStatistics.useQuery();

  return {
    statistics,
    isLoading,
    error,
    refetch,
  };
}

// ============================================================================
// useProductBrands Hook
// ============================================================================

export function useProductBrands() {
  const {
    data: brands,
    isLoading,
    error,
  } = trpc.inventory.product.getBrands.useQuery();

  return {
    brands: brands || [],
    isLoading,
    error,
  };
}

// ============================================================================
// useBulkProductOperations Hook
// ============================================================================

export function useBulkProductOperations() {
  const bulkCreateMutation = trpc.inventory.product.bulkCreate.useMutation();
  const bulkUpdatePricesMutation = trpc.inventory.product.bulkUpdatePrices.useMutation();

  const bulkCreate = useCallback(async (products: Parameters<typeof bulkCreateMutation.mutateAsync>[0]['products']) => {
    return bulkCreateMutation.mutateAsync({ products });
  }, [bulkCreateMutation]);

  const bulkUpdatePrices = useCallback(async (updates: Parameters<typeof bulkUpdatePricesMutation.mutateAsync>[0]['updates']) => {
    return bulkUpdatePricesMutation.mutateAsync({ updates });
  }, [bulkUpdatePricesMutation]);

  return {
    bulkCreate,
    bulkUpdatePrices,
    isCreating: bulkCreateMutation.isPending,
    isUpdatingPrices: bulkUpdatePricesMutation.isPending,
    createError: bulkCreateMutation.error,
    updateError: bulkUpdatePricesMutation.error,
  };
}
