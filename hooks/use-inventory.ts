import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import { Material, MaterialUsage, StockEntry, needsRestock } from '@/types/inventory';
import { generateId } from '@/types';

const STORAGE_KEYS = {
  MATERIALS: 'piano_tech_materials',
  USAGE: 'piano_tech_material_usage',
  ENTRIES: 'piano_tech_stock_entries',
};

// Tipo alias para compatibilidad
export type InventoryItem = Material & {
  quantity: number;
  price?: number;
};

export function useInventory() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.MATERIALS);
      if (stored) {
        setMaterials(JSON.parse(stored));
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const saveMaterials = async (newMaterials: Material[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(newMaterials));
      setMaterials(newMaterials);
    } catch (error) {
    }
  };

  // Convertir Material a InventoryItem para compatibilidad
  const items: InventoryItem[] = materials.map((m) => ({
    ...m,
    quantity: m.currentStock,
    price: m.unitPrice,
  }));

  const addMaterial = useCallback(
    async (material: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newMaterial: Material = {
        ...material,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveMaterials([...materials, newMaterial]);
      return newMaterial;
    },
    [materials]
  );

  const updateMaterial = useCallback(
    async (id: string, updates: Partial<Material>) => {
      const updated = materials.map((m) =>
        m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
      );
      await saveMaterials(updated);
    },
    [materials]
  );

  const deleteMaterial = useCallback(
    async (id: string) => {
      await saveMaterials(materials.filter((m) => m.id !== id));
    },
    [materials]
  );

  const getMaterial = useCallback(
    (id: string) => materials.find((m) => m.id === id),
    [materials]
  );

  const getLowStockItems = useCallback(
    () => items.filter((i) => i.quantity <= i.minStock),
    [items]
  );

  const adjustStock = useCallback(
    async (id: string, quantityChange: number, notes?: string) => {
      const material = materials.find((m) => m.id === id);
      if (!material) return;

      const newStock = Math.max(0, material.currentStock + quantityChange);
      await updateMaterial(id, { currentStock: newStock });
    },
    [materials, updateMaterial]
  );

  return {
    materials,
    items,
    loading,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    getMaterial,
    getLowStockItems,
    adjustStock,
    refresh: loadMaterials,
  };
}
