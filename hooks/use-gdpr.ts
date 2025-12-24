import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

// Tipos para los datos exportables
export interface UserDataExport {
  exportDate: string;
  exportVersion: string;
  user: {
    businessInfo: any;
    preferences: any;
  };
  clients: any[];
  pianos: any[];
  services: any[];
  appointments: any[];
  invoices: any[];
  inventory: any[];
  reminders: any[];
}

export interface GDPRHook {
  // Estado
  isExporting: boolean;
  isDeleting: boolean;
  exportProgress: number;
  deleteProgress: number;
  error: string | null;
  
  // Acciones
  exportAllData: () => Promise<string | null>;
  deleteAllData: () => Promise<boolean>;
  deleteClientData: (clientId: string) => Promise<boolean>;
  anonymizeData: () => Promise<boolean>;
  getDataSummary: () => Promise<DataSummary>;
}

export interface DataSummary {
  totalClients: number;
  totalPianos: number;
  totalServices: number;
  totalAppointments: number;
  totalInvoices: number;
  totalInventoryItems: number;
  totalReminders: number;
  storageUsed: string;
  oldestRecord: string | null;
  newestRecord: string | null;
}

// Hook principal de GDPR
export function useGDPR(): GDPRHook {
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Exportar todos los datos del usuario (Derecho de portabilidad)
  const exportAllData = async (): Promise<string | null> => {
    setIsExporting(true);
    setExportProgress(0);
    setError(null);

    try {
      // Recopilar todos los datos
      const exportData: UserDataExport = {
        exportDate: new Date().toISOString(),
        exportVersion: '1.0',
        user: {
          businessInfo: null,
          preferences: null,
        },
        clients: [],
        pianos: [],
        services: [],
        appointments: [],
        invoices: [],
        inventory: [],
        reminders: [],
      };

      // Obtener datos del almacenamiento local
      setExportProgress(10);
      
      // Preferencias de usuario
      const preferences = await AsyncStorage.getItem('@user_preferences');
      if (preferences) {
        exportData.user.preferences = JSON.parse(preferences);
      }
      setExportProgress(20);

      // Información del negocio
      const businessInfo = await AsyncStorage.getItem('@business_info');
      if (businessInfo) {
        exportData.user.businessInfo = JSON.parse(businessInfo);
      }
      setExportProgress(30);

      // Clientes
      const clients = await AsyncStorage.getItem('@clients');
      if (clients) {
        exportData.clients = JSON.parse(clients);
      }
      setExportProgress(40);

      // Pianos
      const pianos = await AsyncStorage.getItem('@pianos');
      if (pianos) {
        exportData.pianos = JSON.parse(pianos);
      }
      setExportProgress(50);

      // Servicios
      const services = await AsyncStorage.getItem('@services');
      if (services) {
        exportData.services = JSON.parse(services);
      }
      setExportProgress(60);

      // Citas
      const appointments = await AsyncStorage.getItem('@appointments');
      if (appointments) {
        exportData.appointments = JSON.parse(appointments);
      }
      setExportProgress(70);

      // Facturas
      const invoices = await AsyncStorage.getItem('@invoices');
      if (invoices) {
        exportData.invoices = JSON.parse(invoices);
      }
      setExportProgress(80);

      // Inventario
      const inventory = await AsyncStorage.getItem('@inventory');
      if (inventory) {
        exportData.inventory = JSON.parse(inventory);
      }
      setExportProgress(85);

      // Recordatorios
      const reminders = await AsyncStorage.getItem('@reminders');
      if (reminders) {
        exportData.reminders = JSON.parse(reminders);
      }
      setExportProgress(90);

      // Crear archivo JSON
      const jsonContent = JSON.stringify(exportData, null, 2);
      const fileName = `piano_emotion_data_export_${new Date().toISOString().split('T')[0]}.json`;
      
      if (Platform.OS === 'web') {
        // En web, crear un blob y descargar
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setExportProgress(100);
        return fileName;
      } else {
        // En móvil, guardar archivo y compartir
        const filePath = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(filePath, jsonContent, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        setExportProgress(95);

        // Compartir archivo
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(filePath, {
            mimeType: 'application/json',
            dialogTitle: 'Exportar datos de Piano Emotion Manager',
          });
        }
        setExportProgress(100);
        return filePath;
      }
    } catch (err) {
      setError('Error al exportar los datos. Por favor, inténtalo de nuevo.');
      return null;
    } finally {
      setIsExporting(false);
    }
  };

  // Eliminar todos los datos del usuario (Derecho al olvido)
  const deleteAllData = async (): Promise<boolean> => {
    setIsDeleting(true);
    setDeleteProgress(0);
    setError(null);

    try {
      // Lista de claves a eliminar
      const keysToDelete = [
        '@user_preferences',
        '@business_info',
        '@clients',
        '@pianos',
        '@services',
        '@appointments',
        '@invoices',
        '@inventory',
        '@reminders',
        '@service_rates',
        '@suppliers',
        '@cookie_preferences',
      ];

      const totalKeys = keysToDelete.length;
      
      for (let i = 0; i < keysToDelete.length; i++) {
        await AsyncStorage.removeItem(keysToDelete[i]);
        setDeleteProgress(Math.round(((i + 1) / totalKeys) * 100));
      }

      // Limpiar caché de archivos (fotos, PDFs, etc.)
      if (Platform.OS !== 'web') {
        try {
          const cacheDir = FileSystem.cacheDirectory;
          if (cacheDir) {
            const files = await FileSystem.readDirectoryAsync(cacheDir);
            for (const file of files) {
              await FileSystem.deleteAsync(`${cacheDir}${file}`, { idempotent: true });
            }
          }
        } catch (e) {
          // Ignorar errores de limpieza de caché
        }
      }

      return true;
    } catch (err) {
      setError('Error al eliminar los datos. Por favor, inténtalo de nuevo.');
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  // Eliminar datos de un cliente específico (Derecho al olvido parcial)
  const deleteClientData = async (clientId: string): Promise<boolean> => {
    setIsDeleting(true);
    setError(null);

    try {
      // Eliminar cliente
      const clientsStr = await AsyncStorage.getItem('@clients');
      if (clientsStr) {
        const clients = JSON.parse(clientsStr);
        const filteredClients = clients.filter((c: any) => c.id !== clientId);
        await AsyncStorage.setItem('@clients', JSON.stringify(filteredClients));
      }

      // Eliminar pianos del cliente
      const pianosStr = await AsyncStorage.getItem('@pianos');
      if (pianosStr) {
        const pianos = JSON.parse(pianosStr);
        const filteredPianos = pianos.filter((p: any) => p.clientId !== clientId);
        await AsyncStorage.setItem('@pianos', JSON.stringify(filteredPianos));
      }

      // Eliminar servicios del cliente
      const servicesStr = await AsyncStorage.getItem('@services');
      if (servicesStr) {
        const services = JSON.parse(servicesStr);
        const filteredServices = services.filter((s: any) => s.clientId !== clientId);
        await AsyncStorage.setItem('@services', JSON.stringify(filteredServices));
      }

      // Eliminar citas del cliente
      const appointmentsStr = await AsyncStorage.getItem('@appointments');
      if (appointmentsStr) {
        const appointments = JSON.parse(appointmentsStr);
        const filteredAppointments = appointments.filter((a: any) => a.clientId !== clientId);
        await AsyncStorage.setItem('@appointments', JSON.stringify(filteredAppointments));
      }

      // Eliminar facturas del cliente
      const invoicesStr = await AsyncStorage.getItem('@invoices');
      if (invoicesStr) {
        const invoices = JSON.parse(invoicesStr);
        const filteredInvoices = invoices.filter((i: any) => i.clientId !== clientId);
        await AsyncStorage.setItem('@invoices', JSON.stringify(filteredInvoices));
      }

      // Eliminar recordatorios del cliente
      const remindersStr = await AsyncStorage.getItem('@reminders');
      if (remindersStr) {
        const reminders = JSON.parse(remindersStr);
        const filteredReminders = reminders.filter((r: any) => r.clientId !== clientId);
        await AsyncStorage.setItem('@reminders', JSON.stringify(filteredReminders));
      }

      return true;
    } catch (err) {
      setError('Error al eliminar los datos del cliente.');
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  // Anonimizar datos (alternativa a eliminación completa)
  const anonymizeData = async (): Promise<boolean> => {
    setIsDeleting(true);
    setError(null);

    try {
      // Anonimizar clientes
      const clientsStr = await AsyncStorage.getItem('@clients');
      if (clientsStr) {
        const clients = JSON.parse(clientsStr);
        const anonymizedClients = clients.map((c: any, index: number) => ({
          ...c,
          name: `Cliente ${index + 1}`,
          lastName: 'Anónimo',
          email: `cliente${index + 1}@anonimo.local`,
          phone: '000000000',
          taxId: 'XXXXXXXXX',
          address: 'Dirección anonimizada',
          fiscalAddress: 'Dirección fiscal anonimizada',
          notes: '',
        }));
        await AsyncStorage.setItem('@clients', JSON.stringify(anonymizedClients));
      }

      // Anonimizar información del negocio
      const businessInfoStr = await AsyncStorage.getItem('@business_info');
      if (businessInfoStr) {
        const businessInfo = JSON.parse(businessInfoStr);
        const anonymizedBusiness = {
          ...businessInfo,
          name: 'Empresa Anónima',
          taxId: 'XXXXXXXXX',
          email: 'anonimo@anonimo.local',
          phone: '000000000',
          address: 'Dirección anonimizada',
          bankAccount: 'XXXX XXXX XXXX XXXX',
        };
        await AsyncStorage.setItem('@business_info', JSON.stringify(anonymizedBusiness));
      }

      return true;
    } catch (err) {
      setError('Error al anonimizar los datos.');
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  // Obtener resumen de datos almacenados
  const getDataSummary = async (): Promise<DataSummary> => {
    try {
      const summary: DataSummary = {
        totalClients: 0,
        totalPianos: 0,
        totalServices: 0,
        totalAppointments: 0,
        totalInvoices: 0,
        totalInventoryItems: 0,
        totalReminders: 0,
        storageUsed: '0 KB',
        oldestRecord: null,
        newestRecord: null,
      };

      let totalSize = 0;
      const dates: Date[] = [];

      // Contar clientes
      const clientsStr = await AsyncStorage.getItem('@clients');
      if (clientsStr) {
        const clients = JSON.parse(clientsStr);
        summary.totalClients = clients.length;
        totalSize += clientsStr.length;
        clients.forEach((c: any) => {
          if (c.createdAt) dates.push(new Date(c.createdAt));
        });
      }

      // Contar pianos
      const pianosStr = await AsyncStorage.getItem('@pianos');
      if (pianosStr) {
        const pianos = JSON.parse(pianosStr);
        summary.totalPianos = pianos.length;
        totalSize += pianosStr.length;
        pianos.forEach((p: any) => {
          if (p.createdAt) dates.push(new Date(p.createdAt));
        });
      }

      // Contar servicios
      const servicesStr = await AsyncStorage.getItem('@services');
      if (servicesStr) {
        const services = JSON.parse(servicesStr);
        summary.totalServices = services.length;
        totalSize += servicesStr.length;
        services.forEach((s: any) => {
          if (s.createdAt) dates.push(new Date(s.createdAt));
        });
      }

      // Contar citas
      const appointmentsStr = await AsyncStorage.getItem('@appointments');
      if (appointmentsStr) {
        const appointments = JSON.parse(appointmentsStr);
        summary.totalAppointments = appointments.length;
        totalSize += appointmentsStr.length;
      }

      // Contar facturas
      const invoicesStr = await AsyncStorage.getItem('@invoices');
      if (invoicesStr) {
        const invoices = JSON.parse(invoicesStr);
        summary.totalInvoices = invoices.length;
        totalSize += invoicesStr.length;
      }

      // Contar inventario
      const inventoryStr = await AsyncStorage.getItem('@inventory');
      if (inventoryStr) {
        const inventory = JSON.parse(inventoryStr);
        summary.totalInventoryItems = inventory.length;
        totalSize += inventoryStr.length;
      }

      // Contar recordatorios
      const remindersStr = await AsyncStorage.getItem('@reminders');
      if (remindersStr) {
        const reminders = JSON.parse(remindersStr);
        summary.totalReminders = reminders.length;
        totalSize += remindersStr.length;
      }

      // Calcular tamaño
      if (totalSize < 1024) {
        summary.storageUsed = `${totalSize} B`;
      } else if (totalSize < 1024 * 1024) {
        summary.storageUsed = `${(totalSize / 1024).toFixed(2)} KB`;
      } else {
        summary.storageUsed = `${(totalSize / (1024 * 1024)).toFixed(2)} MB`;
      }

      // Encontrar fechas más antigua y más reciente
      if (dates.length > 0) {
        const validDates = dates.filter(d => !isNaN(d.getTime()));
        if (validDates.length > 0) {
          validDates.sort((a, b) => a.getTime() - b.getTime());
          summary.oldestRecord = validDates[0].toLocaleDateString('es-ES');
          summary.newestRecord = validDates[validDates.length - 1].toLocaleDateString('es-ES');
        }
      }

      return summary;
    } catch (err) {
      return {
        totalClients: 0,
        totalPianos: 0,
        totalServices: 0,
        totalAppointments: 0,
        totalInvoices: 0,
        totalInventoryItems: 0,
        totalReminders: 0,
        storageUsed: 'Error',
        oldestRecord: null,
        newestRecord: null,
      };
    }
  };

  return {
    isExporting,
    isDeleting,
    exportProgress,
    deleteProgress,
    error,
    exportAllData,
    deleteAllData,
    deleteClientData,
    anonymizeData,
    getDataSummary,
  };
}
