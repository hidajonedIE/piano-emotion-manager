import { useRouter } from 'expo-router';
import { useState, useMemo, useCallback } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Share,
  Platform,
  Modal,
  FlatList,
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
import {
  CountryCode,
  CountryFiscalConfig,
  FiscalModel,
  getFiscalConfig,
  getAvailableCountries,
  formatCurrencyForCountry,
  formatDateForCountry,
} from '@/services/fiscal-config-service';
import { PremiumPaywall, usePremiumAccess } from '@/components/premium-paywall';

type TabType = 'export' | 'vat-book' | 'fiscal-model-1' | 'fiscal-model-2';

export default function AccountingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Verificar acceso premium
  const { hasAccountingAccess } = usePremiumAccess();
  
  const { invoices = [] } = useInvoicesData?.() || { invoices: [] };
  
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>('ES');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
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

  // Obtener configuración fiscal del país seleccionado
  const fiscalConfig = useMemo(() => getFiscalConfig(selectedCountry), [selectedCountry]);
  const availableCountries = useMemo(() => getAvailableCountries(), []);

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

  // Calcular datos fiscales según el país
  const fiscalData = useMemo(() => {
    const ingresos = filteredInvoices.reduce((sum, inv) => sum + (inv.subtotal || 0), 0);
    const ivaTotal = filteredInvoices.reduce((sum, inv) => sum + (inv.vatAmount || 0), 0);
    
    // Agrupar por tipo de IVA
    const byVatRate: Record<number, { base: number; vat: number }> = {};
    filteredInvoices.forEach(inv => {
      const rate = inv.vatRate || fiscalConfig.taxRates[0].rate;
      if (!byVatRate[rate]) {
        byVatRate[rate] = { base: 0, vat: 0 };
      }
      byVatRate[rate].base += inv.subtotal || 0;
      byVatRate[rate].vat += inv.vatAmount || 0;
    });

    return {
      ingresos,
      ivaTotal,
      byVatRate,
      gastos: 0, // TODO: Implementar gastos
      ivaDeducible: 0,
      resultado: ivaTotal, // Simplificado
    };
  }, [filteredInvoices, fiscalConfig]);

  function getCurrentQuarter(): string {
    const month = new Date().getMonth();
    if (month < 3) return '1T';
    if (month < 6) return '2T';
    if (month < 9) return '3T';
    return '4T';
  }

  const formatAmount = useCallback((amount: number) => {
    return formatCurrencyForCountry(amount, selectedCountry);
  }, [selectedCountry]);

  const handleExportCSV = async () => {
    setIsExporting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const csv = generateInvoicesCSV(filteredInvoices);
      const filename = `facturas_${selectedCountry}_${selectedYear}_${selectedQuarter}.csv`;
      
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
      Alert.alert('Error', 'No se pudo exportar el archivo');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportVATBook = async (type: 'issued' | 'received') => {
    setIsExporting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const entries: VATBookEntry[] = filteredInvoices.map(inv => ({
        invoiceNumber: inv.number || '',
        date: inv.date || '',
        clientName: inv.clientName || '',
        clientTaxId: inv.clientTaxId || '',
        baseAmount: inv.subtotal || 0,
        vatRate: inv.vatRate || fiscalConfig.taxRates[0].rate,
        vatAmount: inv.vatAmount || 0,
        totalAmount: inv.total || 0,
        type: 'issued' as const,
      }));

      const csv = generateVATBookCSV(entries, type);
      const taxName = fiscalConfig.taxName.split(' ')[0]; // IVA, VAT, MwSt, etc.
      const filename = `libro_${taxName.toLowerCase()}_${type === 'issued' ? 'emitidas' : 'recibidas'}_${selectedCountry}_${selectedYear}_${selectedQuarter}.csv`;
      
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
      Alert.alert('Error', `No se pudo exportar el libro de ${fiscalConfig.taxName}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportFiscalModel = async (model: FiscalModel) => {
    setIsExporting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Generar resumen del modelo fiscal
      let summary = `${fiscalConfig.flag} ${fiscalConfig.name} - ${model.name}\n`;
      summary += `${'='.repeat(50)}\n\n`;
      summary += `Período: ${selectedQuarter} ${selectedYear}\n`;
      summary += `Fecha de generación: ${formatDateForCountry(new Date(), selectedCountry)}\n\n`;
      summary += `${model.description}\n`;
      summary += `Plazo: ${model.deadline}\n\n`;
      summary += `${'─'.repeat(50)}\n\n`;

      // Añadir campos del modelo
      model.fields.forEach(field => {
        let value = 0;
        
        // Calcular valores según el campo
        if (field.id.includes('base') || field.id.includes('ingresos') || field.id.includes('umsaetze') || field.id.includes('ca_')) {
          value = fiscalData.ingresos;
        } else if (field.id.includes('cuota') || field.id.includes('steuer') || field.id.includes('tva') || field.id.includes('iva') || field.id.includes('vat')) {
          value = fiscalData.ivaTotal;
        } else if (field.id.includes('deducible') || field.id.includes('vorsteuer') || field.id.includes('deductible') || field.id.includes('credito')) {
          value = fiscalData.ivaDeducible;
        } else if (field.id.includes('resultado') || field.id.includes('zahllast') || field.id.includes('nette') || field.id.includes('apurado') || field.id.includes('saldo')) {
          value = fiscalData.resultado;
        }

        if (field.type === 'currency') {
          summary += `${field.label}: ${formatAmount(value)}\n`;
        } else {
          summary += `${field.label}: ${value}\n`;
        }
      });

      summary += `\n${'─'.repeat(50)}\n`;
      summary += `\nRequisitos de facturación en ${fiscalConfig.name}:\n`;
      fiscalConfig.invoiceRequirements.forEach((req, i) => {
        summary += `${i + 1}. ${req}\n`;
      });

      const filename = `${model.code}_${selectedCountry}_${selectedYear}_${selectedQuarter}.txt`;
      
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
      Alert.alert('Error', `No se pudo exportar el ${model.name}`);
    } finally {
      setIsExporting(false);
    }
  };

  const renderCountryPicker = () => (
    <Modal
      visible={showCountryPicker}
      transparent
      animationType="fade"
      onRequestClose={() => setShowCountryPicker(false)}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => setShowCountryPicker(false)}
      >
        <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
          <ThemedText style={styles.modalTitle}>Seleccionar País</ThemedText>
          <FlatList
            data={availableCountries}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.countryItem,
                  { borderBottomColor: borderColor },
                  item.code === selectedCountry && { backgroundColor: accent + '20' },
                ]}
                onPress={() => {
                  setSelectedCountry(item.code);
                  setShowCountryPicker(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <ThemedText style={styles.countryFlag}>{item.flag}</ThemedText>
                <ThemedText style={styles.countryName}>{item.name}</ThemedText>
                {item.code === selectedCountry && (
                  <IconSymbol name="checkmark" size={20} color={accent} />
                )}
              </Pressable>
            )}
          />
        </View>
      </Pressable>
    </Modal>
  );

  const renderTabs = () => {
    const tabs = [
      { key: 'export', label: 'Exportar', icon: 'square.and.arrow.up' },
      { key: 'vat-book', label: `Libro ${fiscalConfig.taxName.split(' ')[0]}`, icon: 'book.fill' },
    ];

    // Añadir tabs para los modelos fiscales del país
    fiscalConfig.fiscalModels.slice(0, 2).forEach((model, index) => {
      tabs.push({
        key: `fiscal-model-${index + 1}` as TabType,
        label: model.code,
        icon: 'doc.text.fill',
      });
    });

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            style={[
              styles.tab,
              { borderColor: borderColor },
              activeTab === tab.key && { backgroundColor: accent, borderColor: accent },
            ]}
            onPress={() => {
              setActiveTab(tab.key as TabType);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <IconSymbol
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.key ? '#fff' : textSecondary}
            />
            <ThemedText
              style={[
                styles.tabText,
                { color: activeTab === tab.key ? '#fff' : textSecondary },
              ]}
            >
              {tab.label}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>
    );
  };

  const renderExportTab = () => (
    <View style={styles.tabContent}>
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <ThemedText style={styles.cardTitle}>Exportar Facturas</ThemedText>
        <ThemedText style={[styles.cardDescription, { color: textSecondary }]}>
          Exporta tus facturas en formato CSV compatible con Excel y software de contabilidad.
        </ThemedText>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <ThemedText style={[styles.statLabel, { color: textSecondary }]}>Total</ThemedText>
            <ThemedText style={styles.statValue}>{formatAmount(totals.totalAmount)}</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={[styles.statLabel, { color: textSecondary }]}>Base</ThemedText>
            <ThemedText style={styles.statValue}>{formatAmount(totals.totalBase)}</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={[styles.statLabel, { color: textSecondary }]}>{fiscalConfig.taxName.split(' ')[0]}</ThemedText>
            <ThemedText style={styles.statValue}>{formatAmount(totals.totalVAT)}</ThemedText>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <ThemedText style={[styles.statLabel, { color: success }]}>Cobrado</ThemedText>
            <ThemedText style={[styles.statValue, { color: success }]}>{formatAmount(totals.paidAmount)}</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={[styles.statLabel, { color: warning }]}>Pendiente</ThemedText>
            <ThemedText style={[styles.statValue, { color: warning }]}>{formatAmount(totals.pendingAmount)}</ThemedText>
          </View>
        </View>

        <Pressable
          style={[styles.exportButton, { backgroundColor: accent }]}
          onPress={handleExportCSV}
          disabled={isExporting}
        >
          <IconSymbol name="square.and.arrow.up" size={20} color="#fff" />
          <ThemedText style={styles.exportButtonText}>
            {isExporting ? 'Exportando...' : 'Exportar CSV'}
          </ThemedText>
        </Pressable>
      </View>

      {/* Información del país */}
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <ThemedText style={styles.cardTitle}>Información Fiscal</ThemedText>
        
        <View style={styles.infoRow}>
          <ThemedText style={[styles.infoLabel, { color: textSecondary }]}>País:</ThemedText>
          <ThemedText style={styles.infoValue}>{fiscalConfig.flag} {fiscalConfig.name}</ThemedText>
        </View>
        
        <View style={styles.infoRow}>
          <ThemedText style={[styles.infoLabel, { color: textSecondary }]}>Impuesto:</ThemedText>
          <ThemedText style={styles.infoValue}>{fiscalConfig.taxName}</ThemedText>
        </View>
        
        <View style={styles.infoRow}>
          <ThemedText style={[styles.infoLabel, { color: textSecondary }]}>ID Fiscal:</ThemedText>
          <ThemedText style={styles.infoValue}>{fiscalConfig.fiscalIdName}</ThemedText>
        </View>

        <ThemedText style={[styles.sectionTitle, { marginTop: Spacing.md }]}>Tipos de {fiscalConfig.taxName.split(' ')[0]}</ThemedText>
        {fiscalConfig.taxRates.map((rate, index) => (
          <View key={index} style={styles.taxRateRow}>
            <ThemedText style={styles.taxRateName}>{rate.name}</ThemedText>
            <ThemedText style={[styles.taxRateValue, { color: accent }]}>{rate.rate}%</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );

  const renderVATBookTab = () => (
    <View style={styles.tabContent}>
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <ThemedText style={styles.cardTitle}>Libro de {fiscalConfig.taxName.split(' ')[0]}</ThemedText>
        <ThemedText style={[styles.cardDescription, { color: textSecondary }]}>
          Registro oficial de facturas emitidas y recibidas según la normativa de {fiscalConfig.name}.
        </ThemedText>

        <Pressable
          style={[styles.exportButton, { backgroundColor: success }]}
          onPress={() => handleExportVATBook('issued')}
          disabled={isExporting}
        >
          <IconSymbol name="arrow.up.doc" size={20} color="#fff" />
          <ThemedText style={styles.exportButtonText}>
            Facturas Emitidas ({filteredInvoices.length})
          </ThemedText>
        </Pressable>

        <Pressable
          style={[styles.exportButton, { backgroundColor: accent, marginTop: Spacing.sm }]}
          onPress={() => handleExportVATBook('received')}
          disabled={isExporting}
        >
          <IconSymbol name="arrow.down.doc" size={20} color="#fff" />
          <ThemedText style={styles.exportButtonText}>
            Facturas Recibidas (0)
          </ThemedText>
        </Pressable>
      </View>

      {/* Desglose por tipo de IVA */}
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <ThemedText style={styles.cardTitle}>Desglose por Tipo</ThemedText>
        
        {Object.entries(fiscalData.byVatRate).map(([rate, data]) => (
          <View key={rate} style={styles.vatBreakdownRow}>
            <View style={styles.vatBreakdownLeft}>
              <ThemedText style={styles.vatBreakdownRate}>{rate}%</ThemedText>
              <ThemedText style={[styles.vatBreakdownLabel, { color: textSecondary }]}>
                Base: {formatAmount(data.base)}
              </ThemedText>
            </View>
            <ThemedText style={[styles.vatBreakdownAmount, { color: accent }]}>
              {formatAmount(data.vat)}
            </ThemedText>
          </View>
        ))}

        <View style={[styles.totalRow, { borderTopColor: borderColor }]}>
          <ThemedText style={styles.totalLabel}>Total {fiscalConfig.taxName.split(' ')[0]}</ThemedText>
          <ThemedText style={[styles.totalValue, { color: accent }]}>
            {formatAmount(fiscalData.ivaTotal)}
          </ThemedText>
        </View>
      </View>
    </View>
  );

  const renderFiscalModelTab = (modelIndex: number) => {
    const model = fiscalConfig.fiscalModels[modelIndex];
    if (!model) return null;

    return (
      <View style={styles.tabContent}>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.modelHeader}>
            <ThemedText style={styles.modelCode}>{model.code}</ThemedText>
            <View style={[styles.frequencyBadge, { backgroundColor: accent + '20' }]}>
              <ThemedText style={[styles.frequencyText, { color: accent }]}>
                {model.frequency === 'monthly' ? 'Mensual' : 
                 model.frequency === 'quarterly' ? 'Trimestral' : 'Anual'}
              </ThemedText>
            </View>
          </View>
          
          <ThemedText style={styles.modelName}>{model.name}</ThemedText>
          <ThemedText style={[styles.cardDescription, { color: textSecondary }]}>
            {model.description}
          </ThemedText>

          <View style={[styles.deadlineBox, { backgroundColor: warning + '15', borderColor: warning }]}>
            <IconSymbol name="clock" size={16} color={warning} />
            <ThemedText style={[styles.deadlineText, { color: warning }]}>
              {model.deadline}
            </ThemedText>
          </View>
        </View>

        {/* Campos del modelo */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.cardTitle}>Datos del Período</ThemedText>
          
          {model.fields.map((field, index) => {
            let value = 0;
            
            if (field.id.includes('base') || field.id.includes('ingresos') || field.id.includes('umsaetze') || field.id.includes('ca_') || field.id.includes('einnahmen')) {
              value = fiscalData.ingresos;
            } else if (field.id.includes('cuota') || field.id.includes('steuer') || field.id.includes('tva') || field.id.includes('iva_') || field.id.includes('vat') || field.id.includes('debito')) {
              value = fiscalData.ivaTotal;
            } else if (field.id.includes('deducible') || field.id.includes('vorsteuer') || field.id.includes('deductible') || field.id.includes('credito') || field.id.includes('dedut')) {
              value = fiscalData.ivaDeducible;
            } else if (field.id.includes('resultado') || field.id.includes('zahllast') || field.id.includes('nette') || field.id.includes('apurado') || field.id.includes('saldo') || field.id.includes('gewinn') || field.id.includes('dovuta')) {
              value = fiscalData.resultado;
            } else if (field.id.includes('gastos') || field.id.includes('ausgaben') || field.id.includes('deducciones')) {
              value = fiscalData.gastos;
            }

            const isResult = field.id.includes('resultado') || field.id.includes('zahllast') || 
                            field.id.includes('nette') || field.id.includes('saldo') || 
                            field.id.includes('total') || field.id.includes('gewinn') ||
                            field.id.includes('pagar') || field.id.includes('dovuta');

            return (
              <View 
                key={field.id} 
                style={[
                  styles.fieldRow,
                  isResult && { backgroundColor: accent + '10', marginHorizontal: -Spacing.md, paddingHorizontal: Spacing.md },
                ]}
              >
                <ThemedText style={[styles.fieldLabel, isResult && { fontWeight: '600' }]}>
                  {field.label}
                </ThemedText>
                <ThemedText style={[
                  styles.fieldValue,
                  isResult && { color: value >= 0 ? error : success, fontWeight: '700' },
                ]}>
                  {field.type === 'currency' ? formatAmount(value) : value}
                </ThemedText>
              </View>
            );
          })}

          <Pressable
            style={[styles.exportButton, { backgroundColor: accent, marginTop: Spacing.md }]}
            onPress={() => handleExportFiscalModel(model)}
            disabled={isExporting}
          >
            <IconSymbol name="square.and.arrow.up" size={20} color="#fff" />
            <ThemedText style={styles.exportButtonText}>
              {isExporting ? 'Exportando...' : `Exportar ${model.code}`}
            </ThemedText>
          </Pressable>
        </View>

        {/* Requisitos de facturación */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.cardTitle}>Requisitos de Facturación</ThemedText>
          {fiscalConfig.invoiceRequirements.map((req, index) => (
            <View key={index} style={styles.requirementRow}>
              <IconSymbol name="checkmark.circle.fill" size={16} color={success} />
              <ThemedText style={[styles.requirementText, { color: textSecondary }]}>
                {req}
              </ThemedText>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Si no tiene acceso premium, mostrar paywall
  if (!hasAccountingAccess) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader title="Contabilidad" showBack />
        <PremiumPaywall
          feature="Contabilidad y Exportación Fiscal"
          description="Accede a exportación contable, libro de IVA, modelos fiscales (303, 130) y soporte multi-país."
          icon="calculator"
          minPlan="professional"
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Contabilidad" showBack />

      {/* Selector de país */}
      <Pressable
        style={[styles.countrySelector, { backgroundColor: cardBg, borderColor }]}
        onPress={() => setShowCountryPicker(true)}
      >
        <ThemedText style={styles.countrySelectorFlag}>{fiscalConfig.flag}</ThemedText>
        <ThemedText style={styles.countrySelectorName}>{fiscalConfig.name}</ThemedText>
        <IconSymbol name="chevron.down" size={16} color={textSecondary} />
      </Pressable>

      {/* Selector de período */}
      <View style={styles.periodSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[2023, 2024, 2025, 2026].map((year) => (
            <Pressable
              key={year}
              style={[
                styles.periodButton,
                { borderColor },
                selectedYear === year && { backgroundColor: accent, borderColor: accent },
              ]}
              onPress={() => setSelectedYear(year)}
            >
              <ThemedText
                style={[
                  styles.periodButtonText,
                  { color: selectedYear === year ? '#fff' : textSecondary },
                ]}
              >
                {year}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: Spacing.xs }}>
          {['1T', '2T', '3T', '4T'].map((quarter) => (
            <Pressable
              key={quarter}
              style={[
                styles.periodButton,
                { borderColor },
                selectedQuarter === quarter && { backgroundColor: accent, borderColor: accent },
              ]}
              onPress={() => setSelectedQuarter(quarter)}
            >
              <ThemedText
                style={[
                  styles.periodButtonText,
                  { color: selectedQuarter === quarter ? '#fff' : textSecondary },
                ]}
              >
                {quarter}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {renderTabs()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'export' && renderExportTab()}
        {activeTab === 'vat-book' && renderVATBookTab()}
        {activeTab === 'fiscal-model-1' && renderFiscalModelTab(0)}
        {activeTab === 'fiscal-model-2' && renderFiscalModelTab(1)}
      </ScrollView>

      {renderCountryPicker()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  countrySelectorFlag: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  countrySelectorName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  periodSelector: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
  },
  periodButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginRight: Spacing.xs,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabsContainer: {
    marginTop: Spacing.sm,
  },
  tabsContent: {
    paddingHorizontal: Spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginRight: Spacing.xs,
    gap: Spacing.xs,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    marginTop: Spacing.sm,
  },
  tabContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  taxRateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  taxRateName: {
    fontSize: 14,
  },
  taxRateValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  vatBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  vatBreakdownLeft: {
    flex: 1,
  },
  vatBreakdownRate: {
    fontSize: 16,
    fontWeight: '600',
  },
  vatBreakdownLabel: {
    fontSize: 12,
  },
  vatBreakdownAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  modelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  modelCode: {
    fontSize: 24,
    fontWeight: '700',
  },
  modelName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  frequencyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  frequencyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deadlineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  deadlineText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  fieldLabel: {
    fontSize: 14,
    flex: 1,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  requirementText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxHeight: '70%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
  },
  countryFlag: {
    fontSize: 28,
    marginRight: Spacing.md,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
  },
});
