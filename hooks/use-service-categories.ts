import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ServiceCategory,
  CatalogService,
  DEFAULT_SERVICE_CATEGORIES,
  DEFAULT_CATALOG_SERVICES,
} from '@/types/service-categories';

const CATEGORIES_KEY = '@piano_tech_service_categories';
const SERVICES_KEY = '@piano_tech_catalog_services';

export function useServiceCategories() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<CatalogService[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar datos al iniciar
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar categorías
      const categoriesJson = await AsyncStorage.getItem(CATEGORIES_KEY);
      let loadedCategories: ServiceCategory[] = [];
      
      if (categoriesJson) {
        loadedCategories = JSON.parse(categoriesJson);
      } else {
        // Inicializar con categorías por defecto
        loadedCategories = DEFAULT_SERVICE_CATEGORIES.map((cat, index) => ({
          ...cat,
          id: `cat_${Date.now()}_${index}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(loadedCategories));
      }
      
      setCategories(loadedCategories.sort((a, b) => a.order - b.order));
      
      // Cargar servicios del catálogo
      const servicesJson = await AsyncStorage.getItem(SERVICES_KEY);
      let loadedServices: CatalogService[] = [];
      
      if (servicesJson) {
        loadedServices = JSON.parse(servicesJson);
      } else {
        // Inicializar con servicios por defecto, asignando categorías
        const categoryMap: { [key: string]: string } = {};
        loadedCategories.forEach(cat => {
          categoryMap[cat.name] = cat.id;
        });
        
        loadedServices = DEFAULT_CATALOG_SERVICES.map((service, index) => {
          // Asignar categoría basándose en el nombre del servicio
          let categoryId = categoryMap['Otros'] || '';
          let categoryName = 'Otros';
          
          if (service.name.toLowerCase().includes('afinación') || service.name.toLowerCase().includes('tono')) {
            categoryId = categoryMap['Afinación'] || '';
            categoryName = 'Afinación';
          } else if (service.name.toLowerCase().includes('regulación')) {
            categoryId = categoryMap['Regulación'] || '';
            categoryName = 'Regulación';
          } else if (service.name.toLowerCase().includes('armonización')) {
            categoryId = categoryMap['Armonización'] || '';
            categoryName = 'Armonización';
          } else if (service.name.toLowerCase().includes('reparación') || 
                     service.name.toLowerCase().includes('cambio') ||
                     service.name.toLowerCase().includes('tecla') ||
                     service.name.toLowerCase().includes('pedal') ||
                     service.name.toLowerCase().includes('cuerda')) {
            categoryId = categoryMap['Reparación'] || '';
            categoryName = 'Reparación';
          }
          
          return {
            ...service,
            id: `srv_${Date.now()}_${index}`,
            categoryId,
            categoryName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        });
        await AsyncStorage.setItem(SERVICES_KEY, JSON.stringify(loadedServices));
      }
      
      setServices(loadedServices);
    } catch (error) {
      console.error('Error loading service categories:', error);
    } finally {
      setLoading(false);
    }
  };

  // Categorías
  const addCategory = useCallback(async (category: Omit<ServiceCategory, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCategory: ServiceCategory = {
      ...category,
      id: `cat_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const updated = [...categories, newCategory].sort((a, b) => a.order - b.order);
    setCategories(updated);
    await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
    return newCategory;
  }, [categories]);

  const updateCategory = useCallback(async (id: string, updates: Partial<ServiceCategory>) => {
    const updated = categories.map(cat =>
      cat.id === id ? { ...cat, ...updates, updatedAt: new Date().toISOString() } : cat
    ).sort((a, b) => a.order - b.order);
    
    setCategories(updated);
    await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
    
    // Actualizar nombre de categoría en servicios si cambió
    if (updates.name) {
      const updatedServices = services.map(srv =>
        srv.categoryId === id ? { ...srv, categoryName: updates.name } : srv
      );
      setServices(updatedServices);
      await AsyncStorage.setItem(SERVICES_KEY, JSON.stringify(updatedServices));
    }
  }, [categories, services]);

  const deleteCategory = useCallback(async (id: string) => {
    // Mover servicios de esta categoría a "Otros"
    const otherCategory = categories.find(c => c.name === 'Otros');
    const updatedServices = services.map(srv =>
      srv.categoryId === id
        ? { ...srv, categoryId: otherCategory?.id || '', categoryName: 'Otros' }
        : srv
    );
    setServices(updatedServices);
    await AsyncStorage.setItem(SERVICES_KEY, JSON.stringify(updatedServices));
    
    const updated = categories.filter(cat => cat.id !== id);
    setCategories(updated);
    await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
  }, [categories, services]);

  const getCategory = useCallback((id: string) => {
    return categories.find(cat => cat.id === id);
  }, [categories]);

  // Servicios del catálogo
  const addService = useCallback(async (service: Omit<CatalogService, 'id' | 'createdAt' | 'updatedAt'>) => {
    const category = categories.find(c => c.id === service.categoryId);
    const newService: CatalogService = {
      ...service,
      id: `srv_${Date.now()}`,
      categoryName: category?.name || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const updated = [...services, newService];
    setServices(updated);
    await AsyncStorage.setItem(SERVICES_KEY, JSON.stringify(updated));
    return newService;
  }, [services, categories]);

  const updateService = useCallback(async (id: string, updates: Partial<CatalogService>) => {
    let categoryName = updates.categoryName;
    if (updates.categoryId && !categoryName) {
      const category = categories.find(c => c.id === updates.categoryId);
      categoryName = category?.name;
    }
    
    const updated = services.map(srv =>
      srv.id === id
        ? { ...srv, ...updates, categoryName: categoryName || srv.categoryName, updatedAt: new Date().toISOString() }
        : srv
    );
    
    setServices(updated);
    await AsyncStorage.setItem(SERVICES_KEY, JSON.stringify(updated));
  }, [services, categories]);

  const deleteService = useCallback(async (id: string) => {
    const updated = services.filter(srv => srv.id !== id);
    setServices(updated);
    await AsyncStorage.setItem(SERVICES_KEY, JSON.stringify(updated));
  }, [services]);

  const getService = useCallback((id: string) => {
    return services.find(srv => srv.id === id);
  }, [services]);

  const getServicesByCategory = useCallback((categoryId: string) => {
    return services.filter(srv => srv.categoryId === categoryId && srv.isActive);
  }, [services]);

  const getActiveServices = useCallback(() => {
    return services.filter(srv => srv.isActive);
  }, [services]);

  return {
    // Categorías
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategory,
    
    // Servicios
    services,
    addService,
    updateService,
    deleteService,
    getService,
    getServicesByCategory,
    getActiveServices,
    
    // Estado
    loading,
    reload: loadData,
  };
}
