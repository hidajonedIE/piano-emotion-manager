import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { notificationService } from './notification-service';

const OFFLINE_QUEUE_KEY = '@piano_emotion_offline_queue';
const SYNC_STATUS_KEY = '@piano_emotion_sync_status';
const LAST_SYNC_KEY = '@piano_emotion_last_sync';

export type OperationType = 'create' | 'update' | 'delete';
export type EntityType = 'client' | 'piano' | 'service' | 'appointment' | 'invoice' | 'material';

export interface QueuedOperation {
  id: string;
  type: OperationType;
  entityType: EntityType;
  entityId: string;
  data: Record<string, any>;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
  error?: string;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: string | null;
  pendingOperations: number;
  lastError: string | null;
}

type SyncListener = (status: SyncStatus) => void;

/**
 * Servicio de sincronización offline
 * Permite trabajar sin conexión y sincronizar cuando hay internet
 */
class OfflineSyncService {
  private listeners: Set<SyncListener> = new Set();
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private unsubscribeNetInfo: (() => void) | null = null;
  private syncInterval: NodeJS.Timeout | null = null;

  /**
   * Inicializar el servicio de sincronización
   */
  async initialize(): Promise<void> {
    // Verificar estado de conexión inicial
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected ?? false;

    // Suscribirse a cambios de conexión
    this.unsubscribeNetInfo = NetInfo.addEventListener(this.handleConnectivityChange.bind(this));

    // Intentar sincronizar operaciones pendientes
    if (this.isOnline) {
      await this.syncPendingOperations();
    }

    // Configurar sincronización periódica (cada 5 minutos cuando hay conexión)
    this.syncInterval = setInterval(async () => {
      if (this.isOnline && !this.isSyncing) {
        await this.syncPendingOperations();
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Limpiar recursos al destruir el servicio
   */
  destroy(): void {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
    }
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.listeners.clear();
  }

  /**
   * Manejar cambios en la conectividad
   */
  private async handleConnectivityChange(state: NetInfoState): Promise<void> {
    const wasOffline = !this.isOnline;
    this.isOnline = state.isConnected ?? false;

    // Si volvemos a estar online, sincronizar
    if (wasOffline && this.isOnline) {
      console.log('[OfflineSync] Connection restored, syncing...');
      await this.syncPendingOperations();
    }

    this.notifyListeners();
  }

  /**
   * Añadir operación a la cola offline
   */
  async queueOperation(
    type: OperationType,
    entityType: EntityType,
    entityId: string,
    data: Record<string, any>,
    maxRetries: number = 3
  ): Promise<string> {
    const operation: QueuedOperation = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      entityType,
      entityId,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries,
    };

    const queue = await this.getQueue();
    queue.push(operation);
    await this.saveQueue(queue);

    this.notifyListeners();

    // Si estamos online, intentar sincronizar inmediatamente
    if (this.isOnline && !this.isSyncing) {
      this.syncPendingOperations();
    }

    return operation.id;
  }

  /**
   * Obtener la cola de operaciones pendientes
   */
  async getQueue(): Promise<QueuedOperation[]> {
    try {
      const stored = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[OfflineSync] Error getting queue:', error);
      return [];
    }
  }

  /**
   * Guardar la cola de operaciones
   */
  private async saveQueue(queue: QueuedOperation[]): Promise<void> {
    try {
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('[OfflineSync] Error saving queue:', error);
    }
  }

  /**
   * Sincronizar operaciones pendientes
   */
  async syncPendingOperations(): Promise<{ success: number; failed: number }> {
    if (this.isSyncing || !this.isOnline) {
      return { success: 0, failed: 0 };
    }

    this.isSyncing = true;
    this.notifyListeners();

    let success = 0;
    let failed = 0;

    try {
      const queue = await this.getQueue();
      
      if (queue.length === 0) {
        this.isSyncing = false;
        this.notifyListeners();
        return { success: 0, failed: 0 };
      }

      console.log(`[OfflineSync] Syncing ${queue.length} operations...`);

      const remainingQueue: QueuedOperation[] = [];

      for (const operation of queue) {
        try {
          await this.executeOperation(operation);
          success++;
        } catch (error) {
          operation.retryCount++;
          operation.error = error instanceof Error ? error.message : 'Unknown error';

          if (operation.retryCount < operation.maxRetries) {
            remainingQueue.push(operation);
          } else {
            failed++;
            console.error(`[OfflineSync] Operation failed after ${operation.maxRetries} retries:`, operation);
          }
        }
      }

      await this.saveQueue(remainingQueue);
      await this.updateLastSync();

      // Notificar resultado
      if (success > 0) {
        await notificationService.sendSyncCompletedNotification(success, 'operaciones');
      }
      if (failed > 0) {
        await notificationService.sendSyncErrorNotification(
          `${failed} operaciones no pudieron sincronizarse`
        );
      }

    } catch (error) {
      console.error('[OfflineSync] Sync error:', error);
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }

    return { success, failed };
  }

  /**
   * Ejecutar una operación individual
   */
  private async executeOperation(operation: QueuedOperation): Promise<void> {
    // Aquí se implementaría la lógica real de sincronización con el servidor
    // Por ahora, simulamos la operación
    console.log(`[OfflineSync] Executing operation:`, operation.type, operation.entityType, operation.entityId);

    // Simular latencia de red
    await new Promise(resolve => setTimeout(resolve, 100));

    // En una implementación real, aquí se haría la llamada al API
    // Por ejemplo:
    // switch (operation.type) {
    //   case 'create':
    //     await api.create(operation.entityType, operation.data);
    //     break;
    //   case 'update':
    //     await api.update(operation.entityType, operation.entityId, operation.data);
    //     break;
    //   case 'delete':
    //     await api.delete(operation.entityType, operation.entityId);
    //     break;
    // }
  }

  /**
   * Actualizar timestamp de última sincronización
   */
  private async updateLastSync(): Promise<void> {
    try {
      await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    } catch (error) {
      console.error('[OfflineSync] Error updating last sync:', error);
    }
  }

  /**
   * Obtener timestamp de última sincronización
   */
  async getLastSync(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(LAST_SYNC_KEY);
    } catch (error) {
      console.error('[OfflineSync] Error getting last sync:', error);
      return null;
    }
  }

  /**
   * Obtener estado actual de sincronización
   */
  async getStatus(): Promise<SyncStatus> {
    const queue = await this.getQueue();
    const lastSync = await this.getLastSync();
    const lastError = queue.find(op => op.error)?.error || null;

    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSyncAt: lastSync,
      pendingOperations: queue.length,
      lastError,
    };
  }

  /**
   * Suscribirse a cambios de estado
   */
  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    
    // Notificar estado actual inmediatamente
    this.getStatus().then(status => listener(status));

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notificar a todos los listeners
   */
  private async notifyListeners(): Promise<void> {
    const status = await this.getStatus();
    this.listeners.forEach(listener => listener(status));
  }

  /**
   * Forzar sincronización manual
   */
  async forceSync(): Promise<{ success: number; failed: number }> {
    if (!this.isOnline) {
      throw new Error('No hay conexión a internet');
    }
    return this.syncPendingOperations();
  }

  /**
   * Limpiar cola de operaciones (usar con cuidado)
   */
  async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
    this.notifyListeners();
  }

  /**
   * Eliminar una operación específica de la cola
   */
  async removeOperation(operationId: string): Promise<void> {
    const queue = await this.getQueue();
    const filtered = queue.filter(op => op.id !== operationId);
    await this.saveQueue(filtered);
    this.notifyListeners();
  }

  /**
   * Verificar si hay operaciones pendientes
   */
  async hasPendingOperations(): Promise<boolean> {
    const queue = await this.getQueue();
    return queue.length > 0;
  }

  /**
   * Obtener operaciones pendientes por tipo de entidad
   */
  async getPendingByEntityType(entityType: EntityType): Promise<QueuedOperation[]> {
    const queue = await this.getQueue();
    return queue.filter(op => op.entityType === entityType);
  }

  /**
   * Verificar si estamos online
   */
  isConnected(): boolean {
    return this.isOnline;
  }

  /**
   * Verificar si estamos sincronizando
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }
}

// Exportar instancia singleton
export const offlineSyncService = new OfflineSyncService();

export default offlineSyncService;
