import { useState, useCallback } from 'react';

/**
 * Material incluido en una factura
 */
export interface InvoiceMaterial {
  id: string;
  inventoryItemId?: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount?: number; // Porcentaje de descuento
  taxRate: number; // Porcentaje de IVA
  total: number;
}

/**
 * Concepto de factura (servicio o material)
 */
export interface InvoiceConcept {
  id: string;
  type: 'service' | 'material';
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxRate: number;
  subtotal: number;
  tax: number;
  total: number;
}

/**
 * Resumen de factura
 */
export interface InvoiceSummary {
  subtotal: number;
  totalDiscount: number;
  taxBase: number;
  taxes: { rate: number; amount: number }[];
  total: number;
}

/**
 * Hook para gestionar materiales y conceptos en facturas
 */
export function useInvoiceMaterials(initialConcepts: InvoiceConcept[] = []) {
  const [concepts, setConcepts] = useState<InvoiceConcept[]>(initialConcepts);

  /**
   * Generar ID único
   */
  const generateId = () => `concept_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  /**
   * Calcular totales de un concepto
   */
  const calculateConceptTotals = (concept: Partial<InvoiceConcept>): Partial<InvoiceConcept> => {
    const quantity = concept.quantity || 0;
    const unitPrice = concept.unitPrice || 0;
    const discount = concept.discount || 0;
    const taxRate = concept.taxRate || 21;

    const grossAmount = quantity * unitPrice;
    const discountAmount = grossAmount * (discount / 100);
    const subtotal = grossAmount - discountAmount;
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    return {
      ...concept,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  };

  /**
   * Añadir concepto de servicio
   */
  const addService = useCallback((service: {
    name: string;
    description?: string;
    quantity?: number;
    unitPrice: number;
    discount?: number;
    taxRate?: number;
  }): InvoiceConcept => {
    const newConcept: InvoiceConcept = {
      id: generateId(),
      type: 'service',
      name: service.name,
      description: service.description,
      quantity: service.quantity || 1,
      unitPrice: service.unitPrice,
      discount: service.discount || 0,
      taxRate: service.taxRate || 21,
      subtotal: 0,
      tax: 0,
      total: 0,
    };

    const calculated = calculateConceptTotals(newConcept) as InvoiceConcept;
    setConcepts(prev => [...prev, calculated]);
    return calculated;
  }, []);

  /**
   * Añadir material desde inventario
   */
  const addMaterial = useCallback((material: {
    inventoryItemId?: string;
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    taxRate?: number;
  }): InvoiceConcept => {
    const newConcept: InvoiceConcept = {
      id: generateId(),
      type: 'material',
      name: material.name,
      description: material.description,
      quantity: material.quantity,
      unitPrice: material.unitPrice,
      discount: material.discount || 0,
      taxRate: material.taxRate || 21,
      subtotal: 0,
      tax: 0,
      total: 0,
    };

    const calculated = calculateConceptTotals(newConcept) as InvoiceConcept;
    setConcepts(prev => [...prev, calculated]);
    return calculated;
  }, []);

  /**
   * Actualizar concepto
   */
  const updateConcept = useCallback((id: string, updates: Partial<InvoiceConcept>): void => {
    setConcepts(prev => prev.map(concept => {
      if (concept.id !== id) return concept;
      
      const updated = { ...concept, ...updates };
      return calculateConceptTotals(updated) as InvoiceConcept;
    }));
  }, []);

  /**
   * Eliminar concepto
   */
  const removeConcept = useCallback((id: string): void => {
    setConcepts(prev => prev.filter(c => c.id !== id));
  }, []);

  /**
   * Mover concepto arriba/abajo
   */
  const moveConcept = useCallback((id: string, direction: 'up' | 'down'): void => {
    setConcepts(prev => {
      const index = prev.findIndex(c => c.id === id);
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newConcepts = [...prev];
      [newConcepts[index], newConcepts[newIndex]] = [newConcepts[newIndex], newConcepts[index]];
      return newConcepts;
    });
  }, []);

  /**
   * Duplicar concepto
   */
  const duplicateConcept = useCallback((id: string): InvoiceConcept | null => {
    const concept = concepts.find(c => c.id === id);
    if (!concept) return null;

    const duplicated: InvoiceConcept = {
      ...concept,
      id: generateId(),
    };

    setConcepts(prev => [...prev, duplicated]);
    return duplicated;
  }, [concepts]);

  /**
   * Calcular resumen de factura
   */
  const calculateSummary = useCallback((): InvoiceSummary => {
    let subtotal = 0;
    let totalDiscount = 0;
    const taxMap: Record<number, number> = {};

    concepts.forEach(concept => {
      const grossAmount = concept.quantity * concept.unitPrice;
      const discountAmount = grossAmount * ((concept.discount || 0) / 100);
      
      subtotal += grossAmount;
      totalDiscount += discountAmount;
      
      const taxRate = concept.taxRate;
      if (!taxMap[taxRate]) {
        taxMap[taxRate] = 0;
      }
      taxMap[taxRate] += concept.tax;
    });

    const taxBase = subtotal - totalDiscount;
    const taxes = Object.entries(taxMap).map(([rate, amount]) => ({
      rate: parseFloat(rate),
      amount: Math.round(amount * 100) / 100,
    }));
    const totalTax = taxes.reduce((sum, t) => sum + t.amount, 0);
    const total = taxBase + totalTax;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      taxBase: Math.round(taxBase * 100) / 100,
      taxes,
      total: Math.round(total * 100) / 100,
    };
  }, [concepts]);

  /**
   * Obtener conceptos por tipo
   */
  const getServices = useCallback(() => concepts.filter(c => c.type === 'service'), [concepts]);
  const getMaterials = useCallback(() => concepts.filter(c => c.type === 'material'), [concepts]);

  /**
   * Limpiar todos los conceptos
   */
  const clearConcepts = useCallback(() => {
    setConcepts([]);
  }, []);

  /**
   * Establecer conceptos (para cargar factura existente)
   */
  const setConcepts_ = useCallback((newConcepts: InvoiceConcept[]) => {
    setConcepts(newConcepts);
  }, []);

  /**
   * Aplicar descuento global a todos los conceptos
   */
  const applyGlobalDiscount = useCallback((discountPercent: number): void => {
    setConcepts(prev => prev.map(concept => {
      const updated = { ...concept, discount: discountPercent };
      return calculateConceptTotals(updated) as InvoiceConcept;
    }));
  }, []);

  /**
   * Cambiar tipo de IVA a todos los conceptos
   */
  const applyGlobalTaxRate = useCallback((taxRate: number): void => {
    setConcepts(prev => prev.map(concept => {
      const updated = { ...concept, taxRate };
      return calculateConceptTotals(updated) as InvoiceConcept;
    }));
  }, []);

  return {
    concepts,
    addService,
    addMaterial,
    updateConcept,
    removeConcept,
    moveConcept,
    duplicateConcept,
    calculateSummary,
    getServices,
    getMaterials,
    clearConcepts,
    setConcepts: setConcepts_,
    applyGlobalDiscount,
    applyGlobalTaxRate,
  };
}

export default useInvoiceMaterials;
