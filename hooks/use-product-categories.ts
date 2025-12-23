import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProductCategory, DEFAULT_PRODUCT_CATEGORIES } from '@/types/inventory';
import { generateId } from '@/types';

const STORAGE_KEY = 'piano_tech_product_categories';

export function useProductCategories() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar categorías
  const loadCategories = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCategories(JSON.parse(stored));
      } else {
        // Inicializar con categorías predeterminadas
        const now = new Date().toISOString();
        const defaultCats = DEFAULT_PRODUCT_CATEGORIES.map((cat, index) => ({
          ...cat,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        }));
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultCats));
        setCategories(defaultCats);
      }
    } catch (error) {
      console.error('Error loading product categories:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Guardar categorías
  const saveCategories = async (newCategories: ProductCategory[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newCategories));
      setCategories(newCategories);
    } catch (error) {
      console.error('Error saving product categories:', error);
    }
  };

  // Añadir categoría
  const addCategory = async (category: Omit<ProductCategory, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newCategory: ProductCategory = {
      ...category,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    const newCategories = [...categories, newCategory];
    await saveCategories(newCategories);
    return newCategory;
  };

  // Actualizar categoría
  const updateCategory = async (id: string, updates: Partial<ProductCategory>) => {
    const newCategories = categories.map((cat) =>
      cat.id === id
        ? { ...cat, ...updates, updatedAt: new Date().toISOString() }
        : cat
    );
    await saveCategories(newCategories);
  };

  // Eliminar categoría
  const deleteCategory = async (id: string) => {
    const newCategories = categories.filter((cat) => cat.id !== id);
    await saveCategories(newCategories);
  };

  // Obtener categoría por ID
  const getCategory = (id: string) => {
    return categories.find((cat) => cat.id === id);
  };

  // Obtener categoría por nombre
  const getCategoryByName = (name: string) => {
    return categories.find((cat) => cat.name.toLowerCase() === name.toLowerCase());
  };

  // Refrescar
  const refresh = () => {
    setLoading(true);
    loadCategories();
  };

  return {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategory,
    getCategoryByName,
    refresh,
  };
}
