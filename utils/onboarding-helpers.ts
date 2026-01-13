/**
 * Onboarding Helper Functions
 * Funciones para gestionar el estado de onboarding, pasos omitidos y completados
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { OnboardingData, ONBOARDING_STORAGE_KEY } from '@/types/onboarding';

const STORAGE_KEY = '@onboarding_data';

/**
 * Obtener datos de onboarding guardados
 */
export async function getOnboardingData(): Promise<OnboardingData> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    return {};
  } catch (error) {
    console.error('Error loading onboarding data:', error);
    return {};
  }
}

/**
 * Guardar datos de onboarding
 */
export async function saveOnboardingData(data: OnboardingData): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving onboarding data:', error);
  }
}

/**
 * Marcar un paso como omitido
 */
export async function markStepAsSkipped(stepNumber: number): Promise<void> {
  try {
    const data = await getOnboardingData();
    const skippedSteps = data.skippedSteps || [];
    
    // Agregar el paso si no está ya omitido
    if (!skippedSteps.includes(stepNumber)) {
      skippedSteps.push(stepNumber);
    }
    
    // Remover de completados si estaba ahí
    const completedSteps = (data.completedSteps || []).filter(s => s !== stepNumber);
    
    await saveOnboardingData({
      ...data,
      skippedSteps,
      completedSteps,
    });
  } catch (error) {
    console.error('Error marking step as skipped:', error);
  }
}

/**
 * Marcar un paso como completado
 */
export async function markStepAsCompleted(stepNumber: number): Promise<void> {
  try {
    const data = await getOnboardingData();
    const completedSteps = data.completedSteps || [];
    
    // Agregar el paso si no está ya completado
    if (!completedSteps.includes(stepNumber)) {
      completedSteps.push(stepNumber);
    }
    
    // Remover de omitidos si estaba ahí
    const skippedSteps = (data.skippedSteps || []).filter(s => s !== stepNumber);
    
    await saveOnboardingData({
      ...data,
      skippedSteps,
      completedSteps,
    });
  } catch (error) {
    console.error('Error marking step as completed:', error);
  }
}

/**
 * Obtener pasos omitidos
 */
export async function getSkippedSteps(): Promise<number[]> {
  try {
    const data = await getOnboardingData();
    return data.skippedSteps || [];
  } catch (error) {
    console.error('Error getting skipped steps:', error);
    return [];
  }
}

/**
 * Obtener pasos completados
 */
export async function getCompletedSteps(): Promise<number[]> {
  try {
    const data = await getOnboardingData();
    return data.completedSteps || [];
  } catch (error) {
    console.error('Error getting completed steps:', error);
    return [];
  }
}

/**
 * Verificar si hay pasos pendientes (omitidos)
 */
export async function hasPendingSteps(): Promise<boolean> {
  try {
    const skippedSteps = await getSkippedSteps();
    return skippedSteps.length > 0;
  } catch (error) {
    console.error('Error checking pending steps:', error);
    return false;
  }
}

/**
 * Obtener información de un paso
 */
export function getStepInfo(stepNumber: number): { title: string; description: string; route: string } {
  const steps: Record<number, { title: string; description: string; route: string }> = {
    1: {
      title: 'Información Básica',
      description: 'Nombre, email y datos de contacto de tu empresa',
      route: '/onboarding/step1',
    },
    2: {
      title: 'Información Legal',
      description: 'Datos fiscales y bancarios',
      route: '/onboarding/step2',
    },
    3: {
      title: 'Modo de Negocio',
      description: 'Individual o equipo',
      route: '/onboarding/step3',
    },
    4: {
      title: 'Cliente de Email',
      description: 'Gmail, Outlook o predeterminado',
      route: '/onboarding/step4',
    },
    5: {
      title: 'Tipos de Servicio',
      description: 'Servicios que ofreces y precios',
      route: '/onboarding/step5',
    },
    6: {
      title: 'Alertas',
      description: 'Configuración de alertas y notificaciones',
      route: '/onboarding/step6',
    },
    7: {
      title: 'Integraciones',
      description: 'Notificaciones y sincronización de calendarios',
      route: '/onboarding/step7',
    },
    8: {
      title: 'Personalización',
      description: 'Logo y colores de marca',
      route: '/onboarding/step8',
    },
  };

  return steps[stepNumber] || {
    title: `Paso ${stepNumber}`,
    description: 'Configuración',
    route: `/onboarding/step${stepNumber}`,
  };
}

/**
 * Limpiar datos de onboarding (útil para testing)
 */
export async function clearOnboardingData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing onboarding data:', error);
  }
}
