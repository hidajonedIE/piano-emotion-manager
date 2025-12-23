import { useEffect, useState } from 'react';
import { 
  runMigrations, 
  getStoredDataVersion, 
  CURRENT_DATA_VERSION,
  verifyDataIntegrity,
  clearAllData,
  exportData,
  importData,
} from '@/lib/data-migration';

interface MigrationState {
  isChecking: boolean;
  isMigrating: boolean;
  isComplete: boolean;
  error: string | null;
  fromVersion: number;
  toVersion: number;
  migrationsRun: number[];
}

/**
 * Hook para gestionar migraciones de datos al iniciar la app
 * Debe usarse en el componente raíz (_layout.tsx)
 */
export function useDataMigration() {
  const [state, setState] = useState<MigrationState>({
    isChecking: true,
    isMigrating: false,
    isComplete: false,
    error: null,
    fromVersion: 0,
    toVersion: CURRENT_DATA_VERSION,
    migrationsRun: [],
  });

  useEffect(() => {
    async function checkAndMigrate() {
      try {
        // Obtener versión actual
        const currentVersion = await getStoredDataVersion();
        
        setState(prev => ({
          ...prev,
          fromVersion: currentVersion,
          isChecking: false,
        }));

        // Si necesita migración
        if (currentVersion < CURRENT_DATA_VERSION) {
          setState(prev => ({ ...prev, isMigrating: true }));
          
          const result = await runMigrations();
          
          setState(prev => ({
            ...prev,
            isMigrating: false,
            isComplete: true,
            migrationsRun: result.migrationsRun,
            error: result.success ? null : 'Error durante la migración',
          }));
        } else {
          setState(prev => ({
            ...prev,
            isComplete: true,
          }));
        }
      } catch (error) {
        console.error('[useDataMigration] Error:', error);
        setState(prev => ({
          ...prev,
          isChecking: false,
          isMigrating: false,
          error: 'Error al verificar migraciones',
        }));
      }
    }

    checkAndMigrate();
  }, []);

  return state;
}

/**
 * Hook para utilidades de gestión de datos
 */
export function useDataManagement() {
  const [isLoading, setIsLoading] = useState(false);

  const checkIntegrity = async () => {
    setIsLoading(true);
    try {
      const result = await verifyDataIntegrity();
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const resetAllData = async () => {
    setIsLoading(true);
    try {
      await clearAllData();
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al limpiar datos' };
    } finally {
      setIsLoading(false);
    }
  };

  const createBackup = async () => {
    setIsLoading(true);
    try {
      const backup = await exportData();
      return { success: true, backup };
    } catch (error) {
      return { success: false, error: 'Error al crear backup' };
    } finally {
      setIsLoading(false);
    }
  };

  const restoreBackup = async (backup: { version: number; data: Record<string, any> }) => {
    setIsLoading(true);
    try {
      const result = await importData(backup);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentVersion = async () => {
    return await getStoredDataVersion();
  };

  return {
    isLoading,
    checkIntegrity,
    resetAllData,
    createBackup,
    restoreBackup,
    getCurrentVersion,
    currentSchemaVersion: CURRENT_DATA_VERSION,
  };
}
