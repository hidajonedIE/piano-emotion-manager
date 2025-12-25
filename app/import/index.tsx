import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useClientsData, usePianosData } from '@/hooks/data';

type ImportType = 'clients' | 'pianos';

interface ImportRow {
  [key: string]: string;
}

interface ImportResult {
  success: number;
  errors: number;
  errorDetails: string[];
}

const REQUIRED_COLUMNS = {
  clients: ['nombre', 'telefono'],
  pianos: ['marca', 'tipo', 'cliente'],
};

const OPTIONAL_COLUMNS = {
  clients: ['email', 'direccion', 'tipo_cliente', 'notas', 'region', 'ciudad', 'codigo_postal', 'grupo_ruta'],
  pianos: ['modelo', 'numero_serie', 'año', 'categoria', 'estado', 'ubicacion', 'notas'],
};

export default function ImportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const { addClient } = useClientsData();
  const { addPiano } = usePianosData();
  const { clients } = useClientsData();

  const [importType, setImportType] = useState<ImportType>('clients');
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<ImportRow[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [step, setStep] = useState<'select' | 'preview' | 'result'>('select');

  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const accent = useThemeColor({}, 'accent');
  const success = useThemeColor({}, 'success');
  const error = useThemeColor({}, 'error');
  const textColor = useThemeColor({}, 'text');

  const parseCSV = (content: string): ImportRow[] => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(/[,;]/).map(h => 
      h.trim().toLowerCase()
        .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
        .replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ñ/g, 'n')
        .replace(/ /g, '_')
    );

    return lines.slice(1).map(line => {
      const values = line.split(/[,;]/).map(v => v.trim().replace(/^"|"$/g, ''));
      const row: ImportRow = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });
  };

  const handleSelectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      setIsLoading(true);
      const file = result.assets[0];
      
      // Leer el archivo
      const content = await FileSystem.readAsStringAsync(file.uri);
      const data = parseCSV(content);

      if (data.length === 0) {
        Alert.alert('Error', 'El archivo está vacío o no tiene el formato correcto');
        setIsLoading(false);
        return;
      }

      // Validar columnas requeridas
      const firstRow = data[0];
      const missingColumns = REQUIRED_COLUMNS[importType].filter(
        col => !Object.keys(firstRow).includes(col)
      );

      if (missingColumns.length > 0) {
        Alert.alert(
          'Columnas faltantes',
          `El archivo debe contener las columnas: ${missingColumns.join(', ')}`
        );
        setIsLoading(false);
        return;
      }

      setPreviewData(data);
      setStep('preview');
      setIsLoading(false);
    } catch (err) {
      console.error('Error al leer archivo:', err);
      Alert.alert('Error', 'No se pudo leer el archivo');
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    setIsLoading(true);
    const result: ImportResult = { success: 0, errors: 0, errorDetails: [] };

    for (let i = 0; i < previewData.length; i++) {
      const row = previewData[i];
      try {
        if (importType === 'clients') {
          await addClient({
            name: row.nombre,
            phone: row.telefono,
            email: row.email || undefined,
            address: row.direccion || undefined,
            clientType: mapClientType(row.tipo_cliente),
            notes: row.notas || undefined,
            region: row.region || undefined,
            city: row.ciudad || undefined,
            postalCode: row.codigo_postal || undefined,
            routeGroup: row.grupo_ruta || undefined,
          });
          result.success++;
        } else if (importType === 'pianos') {
          // Buscar cliente por nombre
          const client = clients.find(c => 
            c.name.toLowerCase().includes(row.cliente.toLowerCase())
          );
          
          if (!client) {
            result.errors++;
            result.errorDetails.push(`Fila ${i + 2}: Cliente "${row.cliente}" no encontrado`);
            continue;
          }

          await addPiano({
            clientId: client.id,
            brand: row.marca,
            model: row.modelo || undefined,
            serialNumber: row.numero_serie || undefined,
            year: row.año ? parseInt(row.año) : undefined,
            category: mapCategory(row.categoria),
            pianoType: row.tipo,
            condition: mapCondition(row.estado),
            location: row.ubicacion || undefined,
            notes: row.notas || undefined,
          });
          result.success++;
        }
      } catch (err) {
        result.errors++;
        result.errorDetails.push(`Fila ${i + 2}: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      }
    }

    setImportResult(result);
    setStep('result');
    setIsLoading(false);
  };

  const mapClientType = (type?: string) => {
    const mapping: Record<string, string> = {
      'particular': 'particular',
      'estudiante': 'student',
      'profesional': 'professional',
      'escuela': 'music_school',
      'conservatorio': 'conservatory',
      'sala_conciertos': 'concert_hall',
    };
    return mapping[type?.toLowerCase() || ''] || 'particular';
  };

  const mapCategory = (category?: string) => {
    if (category?.toLowerCase().includes('cola') || category?.toLowerCase().includes('grand')) {
      return 'grand';
    }
    return 'vertical';
  };

  const mapCondition = (condition?: string) => {
    const mapping: Record<string, string> = {
      'excelente': 'excellent',
      'bueno': 'good',
      'regular': 'fair',
      'malo': 'poor',
      'necesita_reparacion': 'needs_repair',
    };
    return mapping[condition?.toLowerCase() || ''] || 'good';
  };

  const resetImport = () => {
    setPreviewData([]);
    setImportResult(null);
    setStep('select');
  };

  const downloadTemplate = () => {
    const headers = [...REQUIRED_COLUMNS[importType], ...OPTIONAL_COLUMNS[importType]];
    const csvContent = headers.join(';') + '\n';
    
    // En una app real, esto descargaría el archivo
    Alert.alert(
      'Plantilla de Importación',
      `Columnas requeridas: ${REQUIRED_COLUMNS[importType].join(', ')}\n\nColumnas opcionales: ${OPTIONAL_COLUMNS[importType].join(', ')}`,
      [{ text: 'Entendido' }]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Importar Datos',
          headerBackTitle: 'Atrás',
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
      >
        {step === 'select' && (
          <>
            {/* Selector de tipo */}
            <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                ¿Qué quieres importar?
              </ThemedText>
              <View style={styles.typeSelector}>
                <Pressable
                  style={[
                    styles.typeOption,
                    { borderColor },
                    importType === 'clients' && { backgroundColor: accent, borderColor: accent },
                  ]}
                  onPress={() => setImportType('clients')}
                >
                  <IconSymbol 
                    name="person.2.fill" 
                    size={24} 
                    color={importType === 'clients' ? '#FFFFFF' : textSecondary} 
                  />
                  <ThemedText style={{ color: importType === 'clients' ? '#FFFFFF' : textColor }}>
                    Clientes
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[
                    styles.typeOption,
                    { borderColor },
                    importType === 'pianos' && { backgroundColor: accent, borderColor: accent },
                  ]}
                  onPress={() => setImportType('pianos')}
                >
                  <IconSymbol 
                    name="pianokeys" 
                    size={24} 
                    color={importType === 'pianos' ? '#FFFFFF' : textSecondary} 
                  />
                  <ThemedText style={{ color: importType === 'pianos' ? '#FFFFFF' : textColor }}>
                    Pianos
                  </ThemedText>
                </Pressable>
              </View>
            </View>

            {/* Instrucciones */}
            <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                Formato del archivo
              </ThemedText>
              <ThemedText style={[styles.instructions, { color: textSecondary }]}>
                El archivo debe ser CSV o Excel con las siguientes columnas:
              </ThemedText>
              
              <View style={styles.columnList}>
                <ThemedText style={[styles.columnHeader, { color: accent }]}>
                  Columnas requeridas:
                </ThemedText>
                {REQUIRED_COLUMNS[importType].map(col => (
                  <ThemedText key={col} style={[styles.columnItem, { color: textColor }]}>
                    • {col}
                  </ThemedText>
                ))}
              </View>

              <View style={styles.columnList}>
                <ThemedText style={[styles.columnHeader, { color: textSecondary }]}>
                  Columnas opcionales:
                </ThemedText>
                {OPTIONAL_COLUMNS[importType].map(col => (
                  <ThemedText key={col} style={[styles.columnItem, { color: textSecondary }]}>
                    • {col}
                  </ThemedText>
                ))}
              </View>

              <Pressable
                style={[styles.templateButton, { borderColor: accent }]}
                onPress={downloadTemplate}
              >
                <IconSymbol name="arrow.down.doc" size={20} color={accent} />
                <ThemedText style={{ color: accent }}>Ver plantilla de ejemplo</ThemedText>
              </Pressable>
            </View>

            {/* Botón de selección */}
            <Pressable
              style={[styles.selectButton, { backgroundColor: accent }]}
              onPress={handleSelectFile}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <IconSymbol name="doc.badge.plus" size={24} color="#FFFFFF" />
                  <ThemedText style={styles.selectButtonText}>
                    Seleccionar archivo
                  </ThemedText>
                </>
              )}
            </Pressable>
          </>
        )}

        {step === 'preview' && (
          <>
            {/* Vista previa */}
            <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                Vista previa ({previewData.length} registros)
              </ThemedText>
              
              <ScrollView horizontal showsHorizontalScrollIndicator>
                <View>
                  {/* Cabecera */}
                  <View style={[styles.tableRow, styles.tableHeader, { backgroundColor: accent }]}>
                    {Object.keys(previewData[0] || {}).slice(0, 5).map(key => (
                      <ThemedText key={key} style={[styles.tableCell, { color: '#FFFFFF' }]}>
                        {key}
                      </ThemedText>
                    ))}
                  </View>
                  
                  {/* Filas de datos (máximo 5) */}
                  {previewData.slice(0, 5).map((row, index) => (
                    <View key={index} style={[styles.tableRow, { borderColor }]}>
                      {Object.values(row).slice(0, 5).map((value, i) => (
                        <ThemedText key={i} style={[styles.tableCell, { color: textColor }]} numberOfLines={1}>
                          {value || '-'}
                        </ThemedText>
                      ))}
                    </View>
                  ))}
                  
                  {previewData.length > 5 && (
                    <ThemedText style={[styles.moreRows, { color: textSecondary }]}>
                      ... y {previewData.length - 5} registros más
                    </ThemedText>
                  )}
                </View>
              </ScrollView>
            </View>

            {/* Botones de acción */}
            <View style={styles.actionButtons}>
              <Pressable
                style={[styles.cancelButton, { borderColor }]}
                onPress={resetImport}
              >
                <ThemedText style={{ color: textColor }}>Cancelar</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.importButton, { backgroundColor: accent }]}
                onPress={handleImport}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <ThemedText style={{ color: '#FFFFFF', fontWeight: '600' }}>
                    Importar {previewData.length} registros
                  </ThemedText>
                )}
              </Pressable>
            </View>
          </>
        )}

        {step === 'result' && importResult && (
          <>
            {/* Resultado */}
            <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
              <View style={styles.resultHeader}>
                <IconSymbol 
                  name={importResult.errors === 0 ? 'checkmark.circle.fill' : 'exclamationmark.triangle.fill'} 
                  size={48} 
                  color={importResult.errors === 0 ? success : '#FFC107'} 
                />
                <ThemedText style={[styles.resultTitle, { color: textColor }]}>
                  Importación completada
                </ThemedText>
              </View>

              <View style={styles.resultStats}>
                <View style={[styles.statBox, { backgroundColor: '#D4EDDA' }]}>
                  <ThemedText style={[styles.statNumber, { color: '#155724' }]}>
                    {importResult.success}
                  </ThemedText>
                  <ThemedText style={{ color: '#155724' }}>Importados</ThemedText>
                </View>
                <View style={[styles.statBox, { backgroundColor: '#F8D7DA' }]}>
                  <ThemedText style={[styles.statNumber, { color: '#721C24' }]}>
                    {importResult.errors}
                  </ThemedText>
                  <ThemedText style={{ color: '#721C24' }}>Errores</ThemedText>
                </View>
              </View>

              {importResult.errorDetails.length > 0 && (
                <View style={styles.errorList}>
                  <ThemedText style={[styles.errorTitle, { color: error }]}>
                    Detalles de errores:
                  </ThemedText>
                  {importResult.errorDetails.slice(0, 10).map((err, i) => (
                    <ThemedText key={i} style={[styles.errorItem, { color: textSecondary }]}>
                      • {err}
                    </ThemedText>
                  ))}
                  {importResult.errorDetails.length > 10 && (
                    <ThemedText style={[styles.errorItem, { color: textSecondary }]}>
                      ... y {importResult.errorDetails.length - 10} errores más
                    </ThemedText>
                  )}
                </View>
              )}
            </View>

            {/* Botones finales */}
            <View style={styles.actionButtons}>
              <Pressable
                style={[styles.cancelButton, { borderColor }]}
                onPress={resetImport}
              >
                <ThemedText style={{ color: textColor }}>Importar más</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.importButton, { backgroundColor: accent }]}
                onPress={() => router.back()}
              >
                <ThemedText style={{ color: '#FFFFFF', fontWeight: '600' }}>
                  Finalizar
                </ThemedText>
              </Pressable>
            </View>
          </>
        )}
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
    gap: Spacing.md,
  },
  section: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  typeOption: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  instructions: {
    fontSize: 14,
    lineHeight: 20,
  },
  columnList: {
    gap: 4,
  },
  columnHeader: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  columnItem: {
    fontSize: 13,
    marginLeft: Spacing.sm,
  },
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.sm,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tableHeader: {
    borderBottomWidth: 2,
  },
  tableCell: {
    width: 120,
    padding: Spacing.sm,
    fontSize: 13,
  },
  moreRows: {
    padding: Spacing.sm,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  importButton: {
    flex: 2,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  resultHeader: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  resultStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statBox: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
  },
  errorList: {
    gap: 4,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorItem: {
    fontSize: 12,
  },
});
