import { useState, useEffect, useCallback } from 'react';
import { offlineSyncService, SyncStatus, EntityType, OperationType } from '@/services/offline-sync-service';

/**
 * Hook para gestionar la sincronización offline
 */
export function useOfflineSync() {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: true,
    isSyncing: false,
    lastSyncAt: null,
    pendingOperations: 0,
    lastError: null,
  });

  useEffect(() => {
    // Inicializar servicio
    offlineSyncService.initialize();

    // Suscribirse a cambios de estado
    const unsubscribe = offlineSyncService.subscribe(setStatus);

    return () => {
      unsubscribe();
    };
  }, []);

  /**
   * Encolar una operación para sincronización
   */
  const queueOperation = useCallback(async (
    type: OperationType,
    entityType: EntityType,
    entityId: string,
    data: Record<string, any>
  ) => {
    return offlineSyncService.queueOperation(type, entityType, entityId, data);
  }, []);

  /**
   * Forzar sincronización manual
   */
  const forceSync = useCallback(async () => {
    return offlineSyncService.forceSync();
  }, []);

  /**
   * Limpiar cola de operaciones pendientes
   */
  const clearQueue = useCallback(async () => {
    return offlineSyncService.clearQueue();
  }, []);

  /**
   * Obtener operaciones pendientes
   */
  const getPendingOperations = useCallback(async () => {
    return offlineSyncService.getQueue();
  }, []);

  /**
   * Eliminar una operación de la cola
   */
  const removeOperation = useCallback(async (operationId: string) => {
    return offlineSyncService.removeOperation(operationId);
  }, []);

  return {
    // Estado
    isOnline: status.isOnline,
    isSyncing: status.isSyncing,
    lastSyncAt: status.lastSyncAt,
    pendingOperations: status.pendingOperations,
    lastError: status.lastError,
    
    // Acciones
    queueOperation,
    forceSync,
    clearQueue,
    getPendingOperations,
    removeOperation,
  };
}

export default useOfflineSync;
