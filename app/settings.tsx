import { useRouter, Stack } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { resetTutorial } from '@/components/onboarding-tutorial';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useClients, usePianos, useServices } from '@/hooks/use-storage';
import { useInventory } from '@/hooks/use-inventory';
import { useNotifications } from '@/hooks/use-notifications';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';
import { getClientFullName, getClientFormattedAddress } from '@/types';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [importing, setImporting] = useState(false);

  const { clients, addClient } = useClients();
  const { pianos, addPiano } = usePianos();
  const { services } = useServices();
  const { materials } = useInventory();
  const { settings: notificationSettings, saveSettings: saveNotificationSettings, permissionStatus, requestPermissions } = useNotifications();

  const accent = useThemeColor({}, 'accent');
  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const warning = useThemeColor({}, 'warning');

  // Parsear CSV
  const parseCSV = (content: string): Record<string, string>[] => {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/"/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }

    return rows;
  };

  // Descargar archivo CSV
  const downloadCSV = (csv: string, filename: string) => {
    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      Alert.alert('Info', 'La exportación está disponible en la versión web');
    }
  };

  // Importar clientes desde CSV
  const importClients = () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Info', 'La importación está disponible en la versión web');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.txt';

    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setImporting(true);
      try {
        const content = await file.text();
        const rows = parseCSV(content);

        let imported = 0;
        let skipped = 0;

        for (const row of rows) {
          const name = row['nombre'] || row['name'] || row['cliente'];
          if (!name) {
            skipped++;
            continue;
          }

          const exists = clients.some((c) => getClientFullName(c).toLowerCase() === name.toLowerCase());
          if (exists) {
            skipped++;
            continue;
          }

          // Separar nombre en partes si es posible
          const nameParts = name.split(' ');
          const firstName = nameParts[0] || name;
          const lastName1 = nameParts[1] || '';
          const lastName2 = nameParts.slice(2).join(' ') || '';
          
          await addClient({
            firstName,
            lastName1,
            lastName2,
            email: row['email'] || row['correo'] || '',
            phone: row['telefono'] || row['phone'] || row['tel'] || '',
            addressText: row['direccion'] || row['address'] || '',
            type: (row['tipo'] || row['type'] || 'individual') as any,
            notes: row['notas'] || row['notes'] || '',
          });
          imported++;
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Importación completada',
          `Se importaron ${imported} clientes.\n${skipped > 0 ? `${skipped} registros omitidos.` : ''}`
        );
      } catch (error) {
        console.error('Error importing clients:', error);
        Alert.alert('Error', 'No se pudo importar el archivo.');
      } finally {
        setImporting(false);
      }
    };

    input.click();
  };

  // Importar pianos desde CSV
  const importPianos = () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Info', 'La importación está disponible en la versión web');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.txt';

    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setImporting(true);
      try {
        const content = await file.text();
        const rows = parseCSV(content);

        let imported = 0;
        let skipped = 0;

        for (const row of rows) {
          const brand = row['marca'] || row['brand'];
          const model = row['modelo'] || row['model'];
          const clientName = row['cliente'] || row['client'];

          if (!brand || !model) {
            skipped++;
            continue;
          }

          const client = clients.find((c) => getClientFullName(c).toLowerCase() === clientName?.toLowerCase());
          if (!client) {
            skipped++;
            continue;
          }

          await addPiano({
            clientId: client.id,
            brand,
            model,
            serialNumber: row['numero_serie'] || row['serial'] || '',
            year: row['año'] || row['year'] ? parseInt(row['año'] || row['year']) : undefined,
            category: (row['categoria'] || row['category'] || 'vertical') as any,
            type: (row['tipo'] || row['type'] || 'studio') as any,
            condition: 'unknown',
            notes: row['notas'] || row['notes'] || '',
          });
          imported++;
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Importación completada',
          `Se importaron ${imported} pianos.\n${skipped > 0 ? `${skipped} registros omitidos.` : ''}`
        );
      } catch (error) {
        console.error('Error importing pianos:', error);
        Alert.alert('Error', 'No se pudo importar el archivo.');
      } finally {
        setImporting(false);
      }
    };

    input.click();
  };

  // Exportar datos a CSV
  const exportData = (type: 'clients' | 'pianos' | 'services') => {
    let csv = '';
    let filename = '';

    if (type === 'clients') {
      csv = 'nombre,email,telefono,direccion,tipo,notas\n';
      clients.forEach((c) => {
        csv += `"${getClientFullName(c)}","${c.email || ''}","${c.phone || ''}","${getClientFormattedAddress(c)}","${c.type}","${c.notes || ''}"\n`;
      });
      filename = 'clientes.csv';
    } else if (type === 'pianos') {
      csv = 'cliente,marca,modelo,numero_serie,año,categoria,tipo,notas\n';
      pianos.forEach((p) => {
        const client = clients.find((c) => c.id === p.clientId);
        csv += `"${client ? getClientFullName(client) : ''}","${p.brand}","${p.model}","${p.serialNumber || ''}","${p.year || ''}","${p.category}","${p.type}","${p.notes || ''}"\n`;
      });
      filename = 'pianos.csv';
    } else if (type === 'services') {
      csv = 'fecha,cliente,piano,tipo,coste,notas\n';
      services.forEach((s) => {
        const client = clients.find((c) => c.id === s.clientId);
        const piano = pianos.find((p) => p.id === s.pianoId);
        csv += `"${s.date}","${client ? getClientFullName(client) : ''}","${piano ? `${piano.brand} ${piano.model}` : ''}","${s.type}","${s.cost || ''}","${s.notes || ''}"\n`;
      });
      filename = 'servicios.csv';
    }

    downloadCSV(csv, filename);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Descargar plantilla de ejemplo
  const downloadTemplate = (type: 'clients' | 'pianos') => {
    let csv = '';
    let filename = '';

    if (type === 'clients') {
      csv = 'nombre,email,telefono,direccion,tipo,notas\n';
      csv += '"Juan García","juan@email.com","612345678","Calle Mayor 1, Madrid","individual","Cliente habitual"\n';
      csv += '"Conservatorio Municipal","info@conservatorio.es","912345678","Av. de la Música 10","conservatory",""\n';
      filename = 'plantilla_clientes.csv';
    } else if (type === 'pianos') {
      csv = 'cliente,marca,modelo,numero_serie,año,categoria,tipo,notas\n';
      csv += '"Juan García","Yamaha","U3","H1234567","2015","vertical","professional","Piano en buen estado"\n';
      csv += '"Conservatorio Municipal","Steinway","D-274","S987654","2010","grand","concert_grand","Piano de concierto"\n';
      filename = 'plantilla_pianos.csv';
    }

    downloadCSV(csv, filename);
  };

  const menuItems = [
    {
      title: 'Importar Datos',
      items: [
        {
          icon: 'person.2.fill',
          label: 'Importar Clientes (CSV)',
          sublabel: 'Desde archivo CSV',
          onPress: importClients,
        },
        {
          icon: 'pianokeys',
          label: 'Importar Pianos (CSV)',
          sublabel: 'Requiere clientes existentes',
          onPress: importPianos,
        },
      ],
    },
    {
      title: 'Exportar Datos',
      items: [
        {
          icon: 'square.and.arrow.up',
          label: 'Exportar Clientes',
          sublabel: `${clients.length} clientes`,
          onPress: () => exportData('clients'),
        },
        {
          icon: 'square.and.arrow.up',
          label: 'Exportar Pianos',
          sublabel: `${pianos.length} pianos`,
          onPress: () => exportData('pianos'),
        },
        {
          icon: 'square.and.arrow.up',
          label: 'Exportar Servicios',
          sublabel: `${services.length} servicios`,
          onPress: () => exportData('services'),
        },
      ],
    },
    {
      title: 'Plantillas',
      items: [
        {
          icon: 'doc.text',
          label: 'Plantilla de Clientes',
          sublabel: 'Descargar CSV de ejemplo',
          onPress: () => downloadTemplate('clients'),
        },
        {
          icon: 'doc.text',
          label: 'Plantilla de Pianos',
          sublabel: 'Descargar CSV de ejemplo',
          onPress: () => downloadTemplate('pianos'),
        },
      ],
    },
    {
      title: 'Accesos Rápidos',
      items: [
        {
          icon: 'shippingbox.fill',
          label: 'Inventario',
          sublabel: `${materials.length} materiales`,
          onPress: () => router.push('/(tabs)/inventory' as any),
        },
        {
          icon: 'doc.text.fill',
          label: 'Catálogo de Servicios',
          sublabel: 'Gestionar servicios y precios',
          onPress: () => router.push('/service-catalog' as any),
        },
        {
          icon: 'folder.fill',
          label: 'Categorías de Productos',
          sublabel: 'Organizar tipos de materiales',
          onPress: () => router.push('/product-categories' as any),
        },
      ],
    },
    {
      title: 'Copia de Seguridad',
      items: [
        {
          icon: 'arrow.clockwise.icloud.fill',
          label: 'Copia de Seguridad',
          sublabel: 'Exportar e importar todos los datos',
          onPress: () => router.push('/backup' as any),
        },
      ],
    },
    {
      title: 'Notificaciones',
      items: [
        {
          icon: 'bell.fill',
          label: 'Notificaciones',
          sublabel: notificationSettings.enabled ? 'Activadas' : 'Desactivadas',
          onPress: async () => {
            if (!notificationSettings.enabled && permissionStatus !== 'granted') {
              const granted = await requestPermissions();
              if (!granted) {
                Alert.alert(
                  'Permisos necesarios',
                  'Para recibir notificaciones, debes permitir el acceso en la configuración del dispositivo.'
                );
                return;
              }
            }
            saveNotificationSettings({
              ...notificationSettings,
              enabled: !notificationSettings.enabled,
            });
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
          toggle: true,
          toggleValue: notificationSettings.enabled,
        },
        {
          icon: 'calendar.badge.clock',
          label: 'Recordatorio de citas',
          sublabel: `${notificationSettings.appointmentReminderTime} min antes`,
          onPress: () => {
            const options = [15, 30, 60, 120];
            const labels = ['15 minutos', '30 minutos', '1 hora', '2 horas'];
            Alert.alert(
              'Tiempo de aviso',
              'Selecciona cuánto tiempo antes quieres recibir el recordatorio',
              options.map((time, index) => ({
                text: labels[index],
                onPress: () => {
                  saveNotificationSettings({
                    ...notificationSettings,
                    appointmentReminderTime: time,
                  });
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                },
              })),
              { cancelable: true }
            );
          },
          disabled: !notificationSettings.enabled,
        },
        {
          icon: 'wrench.and.screwdriver.fill',
          label: 'Recordatorio de mantenimiento',
          sublabel: notificationSettings.maintenanceReminder ? 'Activado' : 'Desactivado',
          onPress: () => {
            saveNotificationSettings({
              ...notificationSettings,
              maintenanceReminder: !notificationSettings.maintenanceReminder,
            });
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
          toggle: true,
          toggleValue: notificationSettings.maintenanceReminder,
          disabled: !notificationSettings.enabled,
        },
        {
          icon: 'exclamationmark.triangle.fill',
          label: 'Alerta de stock bajo',
          sublabel: notificationSettings.stockAlert ? 'Activada' : 'Desactivada',
          onPress: () => {
            saveNotificationSettings({
              ...notificationSettings,
              stockAlert: !notificationSettings.stockAlert,
            });
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
          toggle: true,
          toggleValue: notificationSettings.stockAlert,
          disabled: !notificationSettings.enabled,
        },
      ],
    },
    {
      title: 'Ayuda',
      items: [
        {
          icon: 'questionmark.circle.fill',
          label: 'Centro de Ayuda',
          sublabel: 'Guía de uso y preguntas frecuentes',
          onPress: () => router.push('/help' as any),
        },
        {
          icon: 'arrow.counterclockwise',
          label: 'Reiniciar Tutorial',
          sublabel: 'Volver a ver la guía de bienvenida',
          onPress: async () => {
            const success = await resetTutorial();
            if (success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert(
                'Tutorial Reiniciado',
                'El tutorial de bienvenida se mostrará la próxima vez que abras la aplicación.',
                [{ text: 'OK' }]
              );
            }
          },
        },
        {
          icon: 'bell.fill',
          label: 'Novedades',
          sublabel: 'Ver últimas funcionalidades añadidas',
          onPress: () => router.push('/whats-new' as any),
        },
      ],
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Configuración' }} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Resumen de datos */}
        <View style={[styles.summaryCard, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText type="subtitle">Resumen de Datos</ThemedText>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryValue}>{clients.length}</ThemedText>
              <ThemedText style={[styles.summaryLabel, { color: textSecondary }]}>Clientes</ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryValue}>{pianos.length}</ThemedText>
              <ThemedText style={[styles.summaryLabel, { color: textSecondary }]}>Pianos</ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryValue}>{services.length}</ThemedText>
              <ThemedText style={[styles.summaryLabel, { color: textSecondary }]}>Servicios</ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <ThemedText style={styles.summaryValue}>{materials.length}</ThemedText>
              <ThemedText style={[styles.summaryLabel, { color: textSecondary }]}>Materiales</ThemedText>
            </View>
          </View>
        </View>

        {/* Menú de opciones */}
        {menuItems.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: textSecondary }]}>
              {section.title}
            </ThemedText>
            <View style={[styles.menuCard, { backgroundColor: cardBg, borderColor }]}>
              {section.items.map((item, itemIndex) => (
                <Pressable
                  key={itemIndex}
                  style={[
                    styles.menuItem,
                    itemIndex < section.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: borderColor },
                  ]}
                  onPress={item.onPress}
                  disabled={importing}
                >
                  <View style={[styles.menuIcon, { backgroundColor: `${accent}15` }]}>
                    <IconSymbol name={item.icon as any} size={20} color={accent} />
                  </View>
                  <View style={styles.menuContent}>
                    <ThemedText style={styles.menuLabel}>{item.label}</ThemedText>
                    <ThemedText style={[styles.menuSublabel, { color: textSecondary }]}>
                      {item.sublabel}
                    </ThemedText>
                  </View>
                  <IconSymbol name="chevron.right" size={20} color={textSecondary} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        {/* Información de formato */}
        <View style={[styles.infoCard, { backgroundColor: `${warning}10`, borderColor: warning }]}>
          <IconSymbol name="info.circle.fill" size={20} color={warning} />
          <View style={styles.infoContent}>
            <ThemedText style={styles.infoTitle}>Formato de importación</ThemedText>
            <ThemedText style={[styles.infoText, { color: textSecondary }]}>
              Los archivos CSV deben tener la primera fila con los nombres de las columnas. 
              Descarga las plantillas de ejemplo para ver el formato correcto.
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.lg,
  },
  summaryCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 12,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginLeft: Spacing.sm,
  },
  menuCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuSublabel: {
    fontSize: 13,
  },
  infoCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
