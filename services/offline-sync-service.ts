/**
 * Servicio de sincronización offline para webapp
 * - Usa localStorage para persistencia
 * - Usa navigator.onLine para detectar conexión
 * - Cola de operaciones pendientes
 * - Sincronización automática al recuperar conexión
 */

const OFFLINE_QUEUE_KEY = 'piano_emotion_offline_queue';
const LAST_SYNC_KEY = 'piano_emotion_last_sync';

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
 * Servicio de sincronización offline para webapp
 */
class OfflineSyncService {
  private listeners: Set<SyncListener> = new Set();
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private syncInterval: number | null = null;
  private initialized = false;

  /**
   * Inicializar el servicio de sincronización
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Verificar estado de conexión inicial
    this.isOnline = navigator.onLine;

    // Suscribirse a cambios de conexión
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Intentar sincronizar operaciones pendientes
    if (this.isOnline) {
      await this.syncPendingOperations();
    }

    // Configurar sincronización periódica (cada 5 minutos cuando hay conexión)
    this.syncInterval = window.setInterval(async () => {
      if (this.isOnline && !this.isSyncing) {
        await this.syncPendingOperations();
      }
    }, 5 * 60 * 1000);

    this.initialized = true;
  }

  /**
   * Limpiar recursos al destruir el servicio
   */
  destroy(): void {
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.listeners.clear();
  }

  /**
   * Manejar evento online
   */
  private async handleOnline(): Promise<void> {
    this.isOnline = true;
    this.notifyListeners();
    await this.syncPendingOperations();
  }

  /**
   * Manejar evento offline
   */
  private handleOffline(): void {
    this.isOnline = false;
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

    const queue = this.getQueue();
    queue.push(operation);
    this.saveQueue(queue);

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
  getQueue(): QueuedOperation[] {
    try {
      const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Guardar la cola de operaciones
   */
  private saveQueue(queue: QueuedOperation[]): void {
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
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
      const queue = this.getQueue();
      
      if (queue.length === 0) {
        this.isSyncing = false;
        this.notifyListeners();
        return { success: 0, failed: 0 };
      }


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
          }
        }
      }

      this.saveQueue(remainingQueue);
      this.updateLastSync();

    } catch (error) {
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

    // Simular latencia de red
    await new Promise(resolve => setTimeout(resolve, 100));

    // En una implementación real, aquí se haría la llamada al API
    // Por ejemplo:
    // const endpoint = `/api/${operation.entityType}s`;
    // const method = operation.type === 'create' ? 'POST' : operation.type === 'update' ? 'PUT' : 'DELETE';
    // const response = await fetch(endpoint, { method, body: JSON.stringify(operation.data) });
    // if (!response.ok) throw new Error(`HTTP ${response.status}`);
  }

  /**
   * Actualizar timestamp de última sincronización
   */
  private updateLastSync(): void {
    try {
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    } catch (error) {
    }
  }

  /**
   * Obtener timestamp de última sincronización
   */
  getLastSync(): string | null {
    try {
      return localStorage.getItem(LAST_SYNC_KEY);
    } catch (error) {
      return null;
    }
  }

  /**
   * Obtener estado actual de sincronización
   */
  getStatus(): SyncStatus {
    const queue = this.getQueue();
    const lastSync = this.getLastSync();
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
    listener(this.getStatus());

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notificar a todos los listeners
   */
  private notifyListeners(): void {
    const status = this.getStatus();
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
  clearQueue(): void {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    this.notifyListeners();
  }

  /**
   * Eliminar una operación específica de la cola
   */
  removeOperation(operationId: string): void {
    const queue = this.getQueue();
    const filtered = queue.filter(op => op.id !== operationId);
    this.saveQueue(filtered);
    this.notifyListeners();
  }

  /**
   * Verificar si hay operaciones pendientes
   */
  hasPendingOperations(): boolean {
    const queue = this.getQueue();
    return queue.length > 0;
  }

  /**
   * Obtener operaciones pendientes por tipo de entidad
   */
  getPendingByEntityType(entityType: EntityType): QueuedOperation[] {
    const queue = this.getQueue();
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
