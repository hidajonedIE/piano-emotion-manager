import AsyncStorage from '@react-native-async-storage/async-storage';


// Tipos para migración de datos
interface MigrationClient {
  id?: string;
  firstName?: string;
  lastName1?: string;
  email?: string;
  phone?: string;
}

interface MigrationPiano {
  id?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  clientId?: string;
}

interface MigrationService {
  id?: string;
  type?: string;
  date?: string;
  clientId?: string;
  pianoId?: string;
  price?: number;
}
// Versión actual del esquema de datos
export const CURRENT_DATA_VERSION = 1;

// Clave para almacenar la versión de datos
const DATA_VERSION_KEY = '@piano_tech_data_version';

// Claves de datos que se migran
export const DATA_KEYS = {
  clients: '@piano_tech_clients',
  pianos: '@piano_tech_pianos',
  services: '@piano_tech_services',
  appointments: '@piano_tech_appointments',
  inventory: '@piano_tech_inventory',
  suppliers: '@piano_tech_suppliers',
  invoices: '@piano_tech_invoices',
  rates: '@piano_tech_rates',
  businessInfo: '@piano_tech_business_info',
} as const;

// Tipo para las funciones de migración
type MigrationFunction = (data: Record<string, any>) => Promise<Record<string, any>>;

// Registro de migraciones por versión
// Cada migración transforma los datos de la versión anterior a la siguiente
const migrations: Record<number, MigrationFunction> = {
  // Migración de v0 (sin versión) a v1
  1: async (data) => {
    
    // Ejemplo: Añadir campos por defecto a clientes existentes
    if (data.clients) {
      data.clients = data.clients.map((client: Record<string, unknown>) => ({
        ...client,
        // Añadir campo preferredContact si no existe
        preferredContact: client.preferredContact || 'phone',
        // Añadir campo notes si no existe
        notes: client.notes || '',
      }));
    }

    // Ejemplo: Normalizar fechas en servicios
    if (data.services) {
      data.services = data.services.map((service: Record<string, unknown>) => ({
        ...service,
        // Asegurar que la fecha esté en formato ISO
        date: service.date ? new Date(service.date).toISOString().split('T')[0] : service.date,
      }));
    }

    // Ejemplo: Añadir campo category a pianos si no existe
    if (data.pianos) {
      data.pianos = data.pianos.map((piano: Record<string, unknown>) => ({
        ...piano,
        category: piano.category || 'vertical',
      }));
    }

    return data;
  },

  // Futuras migraciones se añaden aquí
  // 2: async (data) => { ... },
};

/**
 * Obtiene la versión actual de los datos almacenados
 */
export async function getStoredDataVersion(): Promise<number> {
  try {
    const version = await AsyncStorage.getItem(DATA_VERSION_KEY);
    return version ? parseInt(version, 10) : 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Guarda la versión actual de los datos
 */
export async function setStoredDataVersion(version: number): Promise<void> {
  try {
    await AsyncStorage.setItem(DATA_VERSION_KEY, version.toString());
  } catch (error) {
  }
}

/**
 * Carga todos los datos almacenados
 */
async function loadAllData(): Promise<Record<string, any>> {
  const data: Record<string, any> = {};
  
  for (const [key, storageKey] of Object.entries(DATA_KEYS)) {
    try {
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        data[key] = JSON.parse(stored);
      }
    } catch (error) {
    }
  }
  
  return data;
}

/**
 * Guarda todos los datos migrados
 */
async function saveAllData(data: Record<string, any>): Promise<void> {
  for (const [key, storageKey] of Object.entries(DATA_KEYS)) {
    if (data[key] !== undefined) {
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(data[key]));
      } catch (error) {
      }
    }
  }
}

/**
 * Ejecuta todas las migraciones pendientes
 */
export async function runMigrations(): Promise<{
  success: boolean;
  fromVersion: number;
  toVersion: number;
  migrationsRun: number[];
}> {
  const storedVersion = await getStoredDataVersion();
  const result = {
    success: true,
    fromVersion: storedVersion,
    toVersion: CURRENT_DATA_VERSION,
    migrationsRun: [] as number[],
  };

  // Si ya está en la versión actual, no hacer nada
  if (storedVersion >= CURRENT_DATA_VERSION) {
    return result;
  }


  try {
    // Cargar todos los datos
    let data = await loadAllData();

    // Ejecutar migraciones secuencialmente
    for (let version = storedVersion + 1; version <= CURRENT_DATA_VERSION; version++) {
      const migration = migrations[version];
      if (migration) {
        data = await migration(data);
        result.migrationsRun.push(version);
      }
    }

    // Guardar datos migrados
    await saveAllData(data);

    // Actualizar versión
    await setStoredDataVersion(CURRENT_DATA_VERSION);

  } catch (error) {
    result.success = false;
  }

  return result;
}

/**
 * Limpia toda la caché y datos (útil para desarrollo o reset completo)
 */
export async function clearAllData(): Promise<void> {
  
  const keysToRemove = [DATA_VERSION_KEY, ...Object.values(DATA_KEYS)];
  
  try {
    await AsyncStorage.multiRemove(keysToRemove);
  } catch (error) {
  }
}

/**
 * Exporta todos los datos para backup
 */
export async function exportData(): Promise<{
  version: number;
  exportDate: string;
  data: Record<string, any>;
}> {
  const version = await getStoredDataVersion();
  const data = await loadAllData();
  
  return {
    version,
    exportDate: new Date().toISOString(),
    data,
  };
}

/**
 * Importa datos desde un backup
 */
export async function importData(backup: {
  version: number;
  data: Record<string, any>;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Validar estructura del backup
    if (!backup.version || !backup.data) {
      return { success: false, error: 'Formato de backup inválido' };
    }

    // Guardar datos
    await saveAllData(backup.data);

    // Si el backup es de una versión anterior, ejecutar migraciones
    if (backup.version < CURRENT_DATA_VERSION) {
      await setStoredDataVersion(backup.version);
      await runMigrations();
    } else {
      await setStoredDataVersion(backup.version);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Error al importar datos' };
  }
}

/**
 * Crea una copia de seguridad (alias de exportData)
 */
export const createBackup = exportData;

/**
 * Restaura una copia de seguridad (wrapper de importData)
 */
export async function restoreBackup(backup: {
  version: number;
  data: Record<string, any>;
}): Promise<void> {
  const result = await importData(backup);
  if (!result.success) {
    throw new Error(result.error || 'Error al restaurar backup');
  }
}

/**
 * Obtiene información del último backup (placeholder)
 */
export async function getBackupInfo(): Promise<string | null> {
  // Podría implementarse guardando la fecha del último backup
  return null;
}

/**
 * Verifica la integridad de los datos
 */
export async function verifyDataIntegrity(): Promise<{
  isValid: boolean;
  errors: string[];
  counts: {
    clients: number;
    pianos: number;
    services: number;
  };
}> {
  const errors: string[] = [];
  const data = await loadAllData();
  
  const counts = {
    clients: data.clients?.length || 0,
    pianos: data.pianos?.length || 0,
    services: data.services?.length || 0,
  };

  // Verificar que los clientes tengan campos requeridos
  if (data.clients) {
    data.clients.forEach((client: MigrationClient, index: number) => {
      if (!client.id) errors.push(`Cliente ${index}: falta ID`);
      if (!(client as any).name) errors.push(`Cliente ${index}: falta nombre`);
    });
  }

  // Verificar que los pianos referencien clientes válidos
  if (data.pianos && data.clients) {
    const clientIds = new Set(data.clients.map((c: { id: string }) => c.id));
    data.pianos.forEach((piano: MigrationPiano, index: number) => {
      if (!piano.id) errors.push(`Piano ${index}: falta ID`);
      if (piano.clientId && !clientIds.has(piano.clientId)) {
        errors.push(`Piano ${index}: referencia a cliente inexistente`);
      }
    });
  }

  // Verificar que los servicios referencien pianos válidos
  if (data.services && data.pianos) {
    const pianoIds = new Set(data.pianos.map((p: { id: string }) => p.id));
    data.services.forEach((service: MigrationService, index: number) => {
      if (!service.id) errors.push(`Servicio ${index}: falta ID`);
      if (service.pianoId && !pianoIds.has(service.pianoId)) {
        errors.push(`Servicio ${index}: referencia a piano inexistente`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    counts,
  };
}
