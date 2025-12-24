import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Share,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ScreenHeader } from '@/components/screen-header';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useInvoicesData } from '@/hooks/data';
import { BorderRadius, Spacing } from '@/constants/theme';
import {
  generateInvoicesCSV,
  generateVATBookCSV,
  calculateModel303,
  calculateModel130,
  generateModel303Summary,
  generateModel130Summary,
  filterInvoicesByPeriod,
  formatCurrency,
  VATBookEntry,
  ExportPeriod,
} from '@/services/accounting-export-service';

type TabType = 'export' | 'vat-book' | 'model-303' | 'model-130';

export default function AccountingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const { invoices = [] } = useInvoicesData?.() || { invoices: [] };
  
  const [activeTab, setActiveTab] = useState<TabType>('export');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState(getCurrentQuarter());
  const [selectedPeriod, setSelectedPeriod] = useState<ExportPeriod>('quarter');
  const [isExporting, setIsExporting] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const accent = useThemeColor({}, 'accent');
  const success = useThemeColor({}, 'success');
  const warning = useThemeColor({}, 'warning');
  const error = useThemeColor({}, 'error');

  // Filtrar facturas por período seleccionado
  const filteredInvoices = useMemo(() => {
    return filterInvoicesByPeriod(
      invoices,
      selectedPeriod,
      selectedYear,
      selectedQuarter
    );
  }, [invoices, selectedPeriod, selectedYear, selectedQuarter]);

  // Calcular totales
  const totals = useMemo(() => {
    const totalBase = filteredInvoices.reduce((sum, inv) => sum + (inv.subtotal || 0), 0);
    const totalVAT = filteredInvoices.reduce((sum, inv) => sum + (inv.vatAmount || 0), 0);
    const totalAmount = filteredInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const paidAmount = filteredInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);
    const pendingAmount = filteredInvoices
      .filter(inv => inv.status === 'pending')
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    return { totalBase, totalVAT, totalAmount, paidAmount, pendingAmount };
  }, [filteredInvoices]);

  // Datos del Modelo 303
  const model303Data = useMemo(() => {
    return calculateModel303(
      filteredInvoices, // Facturas emitidas
      [], // Facturas recibidas (gastos) - TODO: implementar
      selectedQuarter,
      selectedYear,
      0 // Compensación anterior
    );
  }, [filteredInvoices, selectedQuarter, selectedYear]);

  // Datos del Modelo 130
  const model130Data = useMemo(() => {
    const ingresos = filteredInvoices.reduce((sum, inv) => sum + (inv.subtotal || 0), 0);
    // TODO: Implementar gastos reales
    const gastos = 0;
    
    return calculateModel130(
      ingresos,
      ingresos, // Acumulado (simplificado)
      gastos,
      gastos, // Acumulado (simplificado)
      0, // Retenciones
      0, // Pagos anteriores
      selectedQuarter,
      selectedYear
    );
  }, [filteredInvoices, selectedQuarter, selectedYear]);

  function getCurrentQuarter(): string {
    const month = new Date().getMonth();
    if (month < 3) return '1T';
    if (month < 6) return '2T';
    if (month < 9) return '3T';
    return '4T';
  }

  const handleExportCSV = async () => {
    setIsExporting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const csv = generateInvoicesCSV(filteredInvoices);
      const filename = `facturas_${selectedYear}_${selectedQuarter}.csv`;
      
      if (Platform.OS === 'web') {
        // En web, descargar directamente
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        Alert.alert('Exportación completada', `Archivo ${filename} descargado`);
      } else {
        // En móvil, guardar y compartir
        const fileUri = FileSystem.documentDirectory + filename;
        await FileSystem.writeAsStringAsync(fileUri, csv, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        await Sharing.shareAsync(fileUri);
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo exportar el archivo');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportVATBook = async (type: 'issued' | 'received') => {
    setIsExporting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Convertir facturas a entradas del libro de IVA
      const entries: VATBookEntry[] = filteredInvoices.map(inv => ({
        invoiceNumber: inv.number || '',
        date: inv.date || '',
        clientName: inv.clientName || '',
        clientTaxId: inv.clientTaxId || '',
        baseAmount: inv.subtotal || 0,
        vatRate: inv.vatRate || 21,
        vatAmount: inv.vatAmount || 0,
        totalAmount: inv.total || 0,
        type: 'issued' as const,
      }));

      const csv = generateVATBookCSV(entries, type);
      const filename = `libro_iva_${type === 'issued' ? 'emitidas' : 'recibidas'}_${selectedYear}_${selectedQuarter}.csv`;
      
      if (Platform.OS === 'web') {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        Alert.alert('Exportación completada', `Archivo ${filename} descargado`);
      } else {
        const fileUri = FileSystem.documentDirectory + filename;
        await FileSystem.writeAsStringAsync(fileUri, csv, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        await Sharing.shareAsync(fileUri);
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo exportar el libro de IVA');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportModel303 = async () => {
    setIsExporting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const summary = generateModel303Summary(model303Data);
      const filename = `modelo_303_${selectedYear}_${selectedQuarter}.txt`;
      
      if (Platform.OS === 'web') {
        const blob = new Blob([summary], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        Alert.alert('Exportación completada', `Archivo ${filename} descargado`);
      } else {
        const fileUri = FileSystem.documentDirectory + filename;
        await FileSystem.writeAsStringAsync(fileUri, summary, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        await Sharing.shareAsync(fileUri);
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo exportar el Modelo 303');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportModel130 = async () => {
    setIsExporting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const summary = generateModel130Summary(model130Data);
      const filename = `modelo_130_${selectedYear}_${selectedQuarter}.txt`;
      
      if (Platform.OS === 'web') {
        const blob = new Blob([summary], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        Alert.alert('Exportación completada', `Archivo ${filename} descargado`);
      } else {
        const fileUri = FileSystem.documentDirectory + filename;
        await FileSystem.writeAsStringAsync(fileUri, summary, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        await Sharing.shareAsync(fileUri);
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo exportar el Modelo 130');
    } finally {
      setIsExporting(false);
    }
  };

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'export', label: 'Exportar', icon: 'arrow.down.doc' },
    { key: 'vat-book', label: 'Libro IVA', icon: 'book' },
    { key: 'model-303', label: 'Mod. 303', icon: 'doc.text' },
    { key: 'model-130', label: 'Mod. 130', icon: 'doc.text.fill' },
  ];

  const years = [2023, 2024, 2025, 2026];
  const quarters = ['1T', '2T', '3T', '4T'];

  const renderPeriodSelector = () => (
    <View style={[styles.periodSelector, { backgroundColor: cardBg, borderColor }]}>
      <View style={styles.periodRow}>
        <ThemedText style={[styles.periodLabel, { color: textSecondary }]}>Año:</ThemedText>
        <View style={styles.periodOptions}>
          {years.map(year => (
            <Pressable
              key={year}
              style={[
                styles.periodOption,
                { borderColor },
                selectedYear === year && { backgroundColor: accent, borderColor: accent },
              ]}
              onPress={() => setSelectedYear(year)}
            >
              <ThemedText
                style={[
                  styles.periodOptionText,
                  selectedYear === year && { color: '#FFFFFF' },
                ]}
              >
                {year}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.periodRow}>
        <ThemedText style={[styles.periodLabel, { color: textSecondary }]}>Trimestre:</ThemedText>
        <View style={styles.periodOptions}>
          {quarters.map(q => (
            <Pressable
              key={q}
              style={[
                styles.periodOption,
                { borderColor },
                selectedQuarter === q && { backgroundColor: accent, borderColor: accent },
              ]}
              onPress={() => setSelectedQuarter(q)}
            >
              <ThemedText
                style={[
                  styles.periodOptionText,
                  selectedQuarter === q && { color: '#FFFFFF' },
                ]}
              >
                {q}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );

  const renderSummaryCard = () => (
    <View style={[styles.summaryCard, { backgroundColor: cardBg, borderColor }]}>
      <ThemedText type="subtitle" style={styles.summaryTitle}>
        Resumen {selectedQuarter} {selectedYear}
      </ThemedText>
      <View style={styles.summaryGrid}>
        <View style={styles.summaryItem}>
          <ThemedText style={[styles.summaryLabel, { color: textSecondary }]}>Facturas</ThemedText>
          <ThemedText style={styles.summaryValue}>{filteredInvoices.length}</ThemedText>
        </View>
        <View style={styles.summaryItem}>
          <ThemedText style={[styles.summaryLabel, { color: textSecondary }]}>Base Imponible</ThemedText>
          <ThemedText style={styles.summaryValue}>{formatCurrency(totals.totalBase)}</ThemedText>
        </View>
        <View style={styles.summaryItem}>
          <ThemedText style={[styles.summaryLabel, { color: textSecondary }]}>IVA</ThemedText>
          <ThemedText style={styles.summaryValue}>{formatCurrency(totals.totalVAT)}</ThemedText>
        </View>
        <View style={styles.summaryItem}>
          <ThemedText style={[styles.summaryLabel, { color: textSecondary }]}>Total</ThemedText>
          <ThemedText style={[styles.summaryValue, { color: accent }]}>
            {formatCurrency(totals.totalAmount)}
          </ThemedText>
        </View>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <ThemedText style={[styles.summaryLabel, { color: textSecondary }]}>Cobrado</ThemedText>
          <ThemedText style={[styles.summaryValue, { color: success }]}>
            {formatCurrency(totals.paidAmount)}
          </ThemedText>
        </View>
        <View style={styles.summaryItem}>
          <ThemedText style={[styles.summaryLabel, { color: textSecondary }]}>Pendiente</ThemedText>
          <ThemedText style={[styles.summaryValue, { color: warning }]}>
            {formatCurrency(totals.pendingAmount)}
          </ThemedText>
        </View>
      </View>
    </View>
  );

  const renderExportTab = () => (
    <View style={styles.tabContent}>
      {renderSummaryCard()}
      
      <ThemedText type="subtitle" style={styles.sectionTitle}>Exportar Facturas</ThemedText>
      
      <Pressable
        style={[styles.exportButton, { backgroundColor: cardBg, borderColor }]}
        onPress={handleExportCSV}
        disabled={isExporting}
      >
        <View style={[styles.exportIcon, { backgroundColor: '#10B981' }]}>
          <IconSymbol name="tablecells" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.exportInfo}>
          <ThemedText style={styles.exportTitle}>Exportar a CSV</ThemedText>
          <ThemedText style={[styles.exportDesc, { color: textSecondary }]}>
            Compatible con Excel, Google Sheets y software contable
          </ThemedText>
        </View>
        <IconSymbol name="chevron.right" size={20} color={textSecondary} />
      </Pressable>

      <Pressable
        style={[styles.exportButton, { backgroundColor: cardBg, borderColor }]}
        onPress={() => router.push('/analytics/report')}
      >
        <View style={[styles.exportIcon, { backgroundColor: '#EF4444' }]}>
          <IconSymbol name="doc.text.fill" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.exportInfo}>
          <ThemedText style={styles.exportTitle}>Generar PDF</ThemedText>
          <ThemedText style={[styles.exportDesc, { color: textSecondary }]}>
            Informe completo con gráficos y resumen
          </ThemedText>
        </View>
        <IconSymbol name="chevron.right" size={20} color={textSecondary} />
      </Pressable>
    </View>
  );

  const renderVATBookTab = () => (
    <View style={styles.tabContent}>
      <View style={[styles.infoCard, { backgroundColor: '#3B82F620', borderColor: '#3B82F6' }]}>
        <IconSymbol name="info.circle" size={20} color="#3B82F6" />
        <ThemedText style={[styles.infoText, { color: '#3B82F6' }]}>
          El Libro de IVA es obligatorio para autónomos y empresas. Debe conservarse durante 4 años.
        </ThemedText>
      </View>

      <ThemedText type="subtitle" style={styles.sectionTitle}>Libro Registro de Facturas</ThemedText>

      <Pressable
        style={[styles.exportButton, { backgroundColor: cardBg, borderColor }]}
        onPress={() => handleExportVATBook('issued')}
        disabled={isExporting}
      >
        <View style={[styles.exportIcon, { backgroundColor: '#8B5CF6' }]}>
          <IconSymbol name="arrow.up.doc" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.exportInfo}>
          <ThemedText style={styles.exportTitle}>Facturas Emitidas</ThemedText>
          <ThemedText style={[styles.exportDesc, { color: textSecondary }]}>
            {filteredInvoices.length} facturas · {formatCurrency(totals.totalAmount)}
          </ThemedText>
        </View>
        <IconSymbol name="chevron.right" size={20} color={textSecondary} />
      </Pressable>

      <Pressable
        style={[styles.exportButton, { backgroundColor: cardBg, borderColor }]}
        onPress={() => handleExportVATBook('received')}
        disabled={isExporting}
      >
        <View style={[styles.exportIcon, { backgroundColor: '#F59E0B' }]}>
          <IconSymbol name="arrow.down.doc" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.exportInfo}>
          <ThemedText style={styles.exportTitle}>Facturas Recibidas</ThemedText>
          <ThemedText style={[styles.exportDesc, { color: textSecondary }]}>
            Gastos deducibles del período
          </ThemedText>
        </View>
        <IconSymbol name="chevron.right" size={20} color={textSecondary} />
      </Pressable>
    </View>
  );

  const renderModel303Tab = () => (
    <View style={styles.tabContent}>
      <View style={[styles.infoCard, { backgroundColor: '#10B98120', borderColor: '#10B981' }]}>
        <IconSymbol name="info.circle" size={20} color="#10B981" />
        <ThemedText style={[styles.infoText, { color: '#10B981' }]}>
          El Modelo 303 es la autoliquidación trimestral del IVA. Plazo: hasta el día 20 del mes siguiente al trimestre.
        </ThemedText>
      </View>

      <View style={[styles.modelCard, { backgroundColor: cardBg, borderColor }]}>
        <ThemedText type="subtitle">IVA Devengado (Ventas)</ThemedText>
        
        <View style={styles.modelRow}>
          <ThemedText style={{ color: textSecondary }}>Base Imponible 21%</ThemedText>
          <ThemedText>{formatCurrency(model303Data.baseImponibleGeneral)}</ThemedText>
        </View>
        <View style={styles.modelRow}>
          <ThemedText style={{ color: textSecondary }}>Cuota IVA 21%</ThemedText>
          <ThemedText>{formatCurrency(model303Data.cuotaDevengadaGeneral)}</ThemedText>
        </View>
        
        <View style={[styles.modelDivider, { backgroundColor: borderColor }]} />
        
        <View style={styles.modelRow}>
          <ThemedText style={{ fontWeight: '600' }}>Total Cuota Devengada</ThemedText>
          <ThemedText style={{ fontWeight: '600', color: accent }}>
            {formatCurrency(model303Data.totalCuotaDevengada)}
          </ThemedText>
        </View>
      </View>

      <View style={[styles.modelCard, { backgroundColor: cardBg, borderColor }]}>
        <ThemedText type="subtitle">IVA Deducible (Compras)</ThemedText>
        
        <View style={styles.modelRow}>
          <ThemedText style={{ color: textSecondary }}>Cuota deducible bienes</ThemedText>
          <ThemedText>{formatCurrency(model303Data.cuotaDeducibleBienes)}</ThemedText>
        </View>
        <View style={styles.modelRow}>
          <ThemedText style={{ color: textSecondary }}>Cuota deducible servicios</ThemedText>
          <ThemedText>{formatCurrency(model303Data.cuotaDeducibleServicios)}</ThemedText>
        </View>
        
        <View style={[styles.modelDivider, { backgroundColor: borderColor }]} />
        
        <View style={styles.modelRow}>
          <ThemedText style={{ fontWeight: '600' }}>Total Cuota Deducible</ThemedText>
          <ThemedText style={{ fontWeight: '600', color: success }}>
            {formatCurrency(model303Data.totalCuotaDeducible)}
          </ThemedText>
        </View>
      </View>

      <View style={[styles.resultCard, { 
        backgroundColor: model303Data.resultadoLiquidacion >= 0 ? '#EF444420' : '#10B98120',
        borderColor: model303Data.resultadoLiquidacion >= 0 ? '#EF4444' : '#10B981',
      }]}>
        <ThemedText type="subtitle">Resultado Liquidación</ThemedText>
        <ThemedText style={[styles.resultAmount, { 
          color: model303Data.resultadoLiquidacion >= 0 ? error : success 
        }]}>
          {formatCurrency(model303Data.resultadoLiquidacion)}
        </ThemedText>
        <ThemedText style={{ color: textSecondary }}>
          {model303Data.resultadoLiquidacion > 0 ? 'A INGRESAR' : model303Data.resultadoLiquidacion < 0 ? 'A COMPENSAR' : 'SIN ACTIVIDAD'}
        </ThemedText>
      </View>

      <Pressable
        style={[styles.exportButton, { backgroundColor: accent }]}
        onPress={handleExportModel303}
        disabled={isExporting}
      >
        <IconSymbol name="arrow.down.doc" size={24} color="#FFFFFF" />
        <ThemedText style={[styles.exportTitle, { color: '#FFFFFF', marginLeft: Spacing.sm }]}>
          Exportar Modelo 303
        </ThemedText>
      </Pressable>
    </View>
  );

  const renderModel130Tab = () => (
    <View style={styles.tabContent}>
      <View style={[styles.infoCard, { backgroundColor: '#F59E0B20', borderColor: '#F59E0B' }]}>
        <IconSymbol name="info.circle" size={20} color="#F59E0B" />
        <ThemedText style={[styles.infoText, { color: '#F59E0B' }]}>
          El Modelo 130 es el pago fraccionado del IRPF para autónomos en estimación directa. Se aplica el 20% sobre el rendimiento neto.
        </ThemedText>
      </View>

      <View style={[styles.modelCard, { backgroundColor: cardBg, borderColor }]}>
        <ThemedText type="subtitle">Ingresos y Gastos</ThemedText>
        
        <View style={styles.modelRow}>
          <ThemedText style={{ color: textSecondary }}>Ingresos del trimestre</ThemedText>
          <ThemedText style={{ color: success }}>{formatCurrency(model130Data.ingresosTrimestre)}</ThemedText>
        </View>
        <View style={styles.modelRow}>
          <ThemedText style={{ color: textSecondary }}>Gastos del trimestre</ThemedText>
          <ThemedText style={{ color: error }}>{formatCurrency(model130Data.gastosTrimestre)}</ThemedText>
        </View>
        
        <View style={[styles.modelDivider, { backgroundColor: borderColor }]} />
        
        <View style={styles.modelRow}>
          <ThemedText style={{ fontWeight: '600' }}>Rendimiento Neto</ThemedText>
          <ThemedText style={{ fontWeight: '600', color: accent }}>
            {formatCurrency(model130Data.rendimientoNetoTrimestre)}
          </ThemedText>
        </View>
      </View>

      <View style={[styles.modelCard, { backgroundColor: cardBg, borderColor }]}>
        <ThemedText type="subtitle">Cálculo Pago Fraccionado</ThemedText>
        
        <View style={styles.modelRow}>
          <ThemedText style={{ color: textSecondary }}>Rendimiento neto acumulado</ThemedText>
          <ThemedText>{formatCurrency(model130Data.rendimientoNetoAcumulado)}</ThemedText>
        </View>
        <View style={styles.modelRow}>
          <ThemedText style={{ color: textSecondary }}>Porcentaje aplicable</ThemedText>
          <ThemedText>{model130Data.porcentajeAplicable}%</ThemedText>
        </View>
        <View style={styles.modelRow}>
          <ThemedText style={{ color: textSecondary }}>Pago fraccionado</ThemedText>
          <ThemedText>{formatCurrency(model130Data.pagoFraccionado)}</ThemedText>
        </View>
        
        <View style={[styles.modelDivider, { backgroundColor: borderColor }]} />
        
        <View style={styles.modelRow}>
          <ThemedText style={{ color: textSecondary }}>Retenciones ingresadas</ThemedText>
          <ThemedText>{formatCurrency(model130Data.retencionesIngresadas)}</ThemedText>
        </View>
        <View style={styles.modelRow}>
          <ThemedText style={{ color: textSecondary }}>Pagos anteriores</ThemedText>
          <ThemedText>{formatCurrency(model130Data.pagosAnteriores)}</ThemedText>
        </View>
      </View>

      <View style={[styles.resultCard, { 
        backgroundColor: model130Data.resultadoLiquidacion > 0 ? '#EF444420' : '#10B98120',
        borderColor: model130Data.resultadoLiquidacion > 0 ? '#EF4444' : '#10B981',
      }]}>
        <ThemedText type="subtitle">Resultado Liquidación</ThemedText>
        <ThemedText style={[styles.resultAmount, { 
          color: model130Data.resultadoLiquidacion > 0 ? error : success 
        }]}>
          {formatCurrency(model130Data.resultadoLiquidacion)}
        </ThemedText>
        <ThemedText style={{ color: textSecondary }}>
          {model130Data.resultadoLiquidacion > 0 ? 'A INGRESAR' : 'SIN INGRESO'}
        </ThemedText>
      </View>

      <Pressable
        style={[styles.exportButton, { backgroundColor: accent }]}
        onPress={handleExportModel130}
        disabled={isExporting}
      >
        <IconSymbol name="arrow.down.doc" size={24} color="#FFFFFF" />
        <ThemedText style={[styles.exportTitle, { color: '#FFFFFF', marginLeft: Spacing.sm }]}>
          Exportar Modelo 130
        </ThemedText>
      </Pressable>
    </View>
  );

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Contabilidad" showBack />

      {/* Tabs */}
      <View style={[styles.tabsContainer, { borderColor }]}>
        {tabs.map(tab => (
          <Pressable
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && { borderBottomColor: accent, borderBottomWidth: 2 },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab(tab.key);
            }}
          >
            <IconSymbol
              name={tab.icon as any}
              size={18}
              color={activeTab === tab.key ? accent : textSecondary}
            />
            <ThemedText
              style={[
                styles.tabText,
                { color: activeTab === tab.key ? accent : textSecondary },
              ]}
            >
              {tab.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        {renderPeriodSelector()}

        {activeTab === 'export' && renderExportTab()}
        {activeTab === 'vat-book' && renderVATBookTab()}
        {activeTab === 'model-303' && renderModel303Tab()}
        {activeTab === 'model-130' && renderModel130Tab()}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  periodSelector: {
    margin: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  periodLabel: {
    width: 80,
    fontSize: 14,
  },
  periodOptions: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  periodOption: {
    flex: 1,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  periodOptionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  summaryCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  summaryTitle: {
    marginBottom: Spacing.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  summaryItem: {
    flex: 1,
    minWidth: '40%',
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  sectionTitle: {
    marginTop: Spacing.sm,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  exportIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportInfo: {
    flex: 1,
  },
  exportTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  exportDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  infoCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  modelCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  modelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modelDivider: {
    height: 1,
    marginVertical: Spacing.xs,
  },
  resultCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  resultAmount: {
    fontSize: 32,
    fontWeight: '700',
  },
});
