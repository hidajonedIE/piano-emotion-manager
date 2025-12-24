import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { usePriceHistory, PriceRecord, PriceStats } from '@/hooks/use-price-history';
import { useSuppliers } from '@/hooks/use-suppliers';
import { BorderRadius, Spacing } from '@/constants/theme';

interface PriceHistoryProps {
  itemId: string;
  itemName: string;
  currentPrice?: number;
  onPriceUpdate?: (newPrice: number) => void;
}

export function PriceHistory({ itemId, itemName, currentPrice, onPriceUpdate }: PriceHistoryProps) {
  const { 
    history, 
    addPriceRecord, 
    deletePriceRecord, 
    getStats,
    getPriceTrend 
  } = usePriceHistory(itemId);
  const { suppliers } = useSuppliers();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  const [newQuantity, setNewQuantity] = useState('1');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const backgroundColor = useThemeColor({}, 'background');
  const cardBg = useThemeColor({}, 'cardBackground');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primary = useThemeColor({}, 'tint');
  const success = useThemeColor({}, 'success');
  const warning = useThemeColor({}, 'warning');
  const error = useThemeColor({}, 'error');
  const border = useThemeColor({}, 'border');

  const stats: PriceStats = getStats(itemId);
  const trend = getPriceTrend(itemId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return 'arrow.up.right';
      case 'down': return 'arrow.down.right';
      default: return 'arrow.right';
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return error;
      case 'down': return success;
      default: return textSecondary;
    }
  };

  const handleAddRecord = () => {
    const price = parseFloat(newPrice);
    const quantity = parseInt(newQuantity) || 1;

    if (isNaN(price) || price <= 0) return;

    const supplier = suppliers.find(s => s.id === selectedSupplierId);

    addPriceRecord({
      itemId,
      price,
      quantity,
      supplierId: selectedSupplierId || undefined,
      supplierName: supplier?.name,
      date: new Date().toISOString(),
      invoiceNumber: invoiceNumber || undefined,
      notes: notes || undefined,
    });

    // Actualizar precio actual si hay callback
    if (onPriceUpdate) {
      onPriceUpdate(price);
    }

    // Resetear formulario
    setShowAddModal(false);
    setNewPrice('');
    setNewQuantity('1');
    setSelectedSupplierId('');
    setInvoiceNumber('');
    setNotes('');
  };

  return (
    <View style={styles.container}>
      {/* Cabecera */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconSymbol name="chart.line.uptrend.xyaxis" size={20} color={primary} />
          <ThemedText style={styles.headerTitle}>Historial de Precios</ThemedText>
        </View>
        <Pressable
          style={[styles.addButton, { backgroundColor: primary }]}
          onPress={() => setShowAddModal(true)}
        >
          <IconSymbol name="plus" size={14} color="#fff" />
          <ThemedText style={styles.addButtonText}>Añadir</ThemedText>
        </Pressable>
      </View>

      {/* Estadísticas */}
      {history.length > 0 && (
        <View style={[styles.statsContainer, { backgroundColor: cardBg }]}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statLabel, { color: textSecondary }]}>
                Precio actual
              </ThemedText>
              <View style={styles.statValueRow}>
                <ThemedText style={[styles.statValue, { color: primary }]}>
                  {formatCurrency(stats.currentPrice)}
                </ThemedText>
                {stats.priceChange !== 0 && (
                  <View style={[styles.trendBadge, { backgroundColor: getTrendColor() + '20' }]}>
                    <IconSymbol name={getTrendIcon() as any} size={12} color={getTrendColor()} />
                    <ThemedText style={[styles.trendText, { color: getTrendColor() }]}>
                      {Math.abs(stats.priceChange).toFixed(1)}%
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statLabel, { color: textSecondary }]}>
                Precio medio
              </ThemedText>
              <ThemedText style={styles.statValue}>
                {formatCurrency(stats.averagePrice)}
              </ThemedText>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statLabel, { color: textSecondary }]}>
                Mínimo
              </ThemedText>
              <ThemedText style={[styles.statValue, { color: success }]}>
                {formatCurrency(stats.minPrice)}
              </ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statLabel, { color: textSecondary }]}>
                Máximo
              </ThemedText>
              <ThemedText style={[styles.statValue, { color: error }]}>
                {formatCurrency(stats.maxPrice)}
              </ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statLabel, { color: textSecondary }]}>
                Total gastado
              </ThemedText>
              <ThemedText style={styles.statValue}>
                {formatCurrency(stats.totalSpent)}
              </ThemedText>
            </View>
          </View>
        </View>
      )}

      {/* Lista de historial */}
      {history.length > 0 ? (
        <View style={styles.historyList}>
          {history.slice(0, 10).map((record) => (
            <View 
              key={record.id} 
              style={[styles.historyItem, { backgroundColor: cardBg, borderColor: border }]}
            >
              <View style={styles.historyItemLeft}>
                <View style={styles.historyItemMain}>
                  <ThemedText style={styles.historyPrice}>
                    {formatCurrency(record.price)}
                  </ThemedText>
                  <ThemedText style={[styles.historyQuantity, { color: textSecondary }]}>
                    x{record.quantity}
                  </ThemedText>
                </View>
                <ThemedText style={[styles.historyDate, { color: textSecondary }]}>
                  {formatDate(record.date)}
                </ThemedText>
                {record.supplierName && (
                  <ThemedText style={[styles.historySupplier, { color: primary }]}>
                    {record.supplierName}
                  </ThemedText>
                )}
                {record.invoiceNumber && (
                  <ThemedText style={[styles.historyInvoice, { color: textSecondary }]}>
                    Factura: {record.invoiceNumber}
                  </ThemedText>
                )}
              </View>
              <Pressable
                style={styles.deleteButton}
                onPress={() => deletePriceRecord(record.id)}
              >
                <IconSymbol name="trash" size={16} color={textSecondary} />
              </Pressable>
            </View>
          ))}
          {history.length > 10 && (
            <ThemedText style={[styles.moreText, { color: textSecondary }]}>
              +{history.length - 10} registros más
            </ThemedText>
          )}
        </View>
      ) : (
        <View style={[styles.emptyState, { backgroundColor: cardBg }]}>
          <IconSymbol name="chart.bar" size={32} color={textSecondary} />
          <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
            No hay historial de precios registrado
          </ThemedText>
          <ThemedText style={[styles.emptyHint, { color: textSecondary }]}>
            Añade compras para hacer seguimiento de precios
          </ThemedText>
        </View>
      )}

      {/* Modal de añadir */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Registrar Compra</ThemedText>
              <Pressable onPress={() => setShowAddModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <ThemedText style={[styles.itemName, { color: primary }]}>{itemName}</ThemedText>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 2 }]}>
                  <ThemedText style={styles.formLabel}>Precio unitario (€)</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor, color: textColor, borderColor: border }]}
                    value={newPrice}
                    onChangeText={setNewPrice}
                    placeholder="0.00"
                    placeholderTextColor={textSecondary}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <ThemedText style={styles.formLabel}>Cantidad</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor, color: textColor, borderColor: border }]}
                    value={newQuantity}
                    onChangeText={setNewQuantity}
                    placeholder="1"
                    placeholderTextColor={textSecondary}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={styles.formLabel}>Proveedor (opcional)</ThemedText>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.supplierList}
                >
                  {suppliers.map(supplier => (
                    <Pressable
                      key={supplier.id}
                      style={[
                        styles.supplierOption,
                        { borderColor: border },
                        selectedSupplierId === supplier.id && { 
                          borderColor: primary, 
                          backgroundColor: primary + '10' 
                        },
                      ]}
                      onPress={() => setSelectedSupplierId(
                        selectedSupplierId === supplier.id ? '' : supplier.id
                      )}
                    >
                      <ThemedText style={[
                        styles.supplierOptionText,
                        selectedSupplierId === supplier.id && { color: primary },
                      ]}>
                        {supplier.name}
                      </ThemedText>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={styles.formLabel}>Nº Factura (opcional)</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor, color: textColor, borderColor: border }]}
                  value={invoiceNumber}
                  onChangeText={setInvoiceNumber}
                  placeholder="F-2025-001"
                  placeholderTextColor={textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={styles.formLabel}>Notas (opcional)</ThemedText>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor, color: textColor, borderColor: border }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Añadir notas..."
                  placeholderTextColor={textSecondary}
                  multiline
                  numberOfLines={2}
                />
              </View>

              {newPrice && newQuantity && (
                <View style={[styles.totalPreview, { backgroundColor: primary + '10' }]}>
                  <ThemedText style={[styles.totalLabel, { color: textSecondary }]}>
                    Total de la compra:
                  </ThemedText>
                  <ThemedText style={[styles.totalValue, { color: primary }]}>
                    {formatCurrency(parseFloat(newPrice || '0') * parseInt(newQuantity || '1'))}
                  </ThemedText>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={[styles.cancelButton, { borderColor: border }]}
                onPress={() => setShowAddModal(false)}
              >
                <ThemedText>Cancelar</ThemedText>
              </Pressable>
              <Pressable
                style={[
                  styles.confirmButton, 
                  { backgroundColor: primary },
                  (!newPrice || parseFloat(newPrice) <= 0) && styles.buttonDisabled,
                ]}
                onPress={handleAddRecord}
                disabled={!newPrice || parseFloat(newPrice) <= 0}
              >
                <ThemedText style={styles.confirmButtonText}>Guardar</ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  statsContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: BorderRadius.sm,
    gap: 2,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '500',
  },
  historyList: {
    gap: Spacing.sm,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  historyItemLeft: {
    flex: 1,
  },
  historyItemMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
  },
  historyPrice: {
    fontSize: 16,
    fontWeight: '600',
  },
  historyQuantity: {
    fontSize: 13,
  },
  historyDate: {
    fontSize: 12,
    marginTop: 2,
  },
  historySupplier: {
    fontSize: 12,
    marginTop: 2,
  },
  historyInvoice: {
    fontSize: 11,
    marginTop: 2,
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  moreText: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: Spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  emptyText: {
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalBody: {
    padding: Spacing.lg,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: Spacing.lg,
  },
  formRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  input: {
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    fontSize: 15,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  supplierList: {
    flexDirection: 'row',
  },
  supplierOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.sm,
  },
  supplierOptionText: {
    fontSize: 13,
  },
  totalPreview: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default PriceHistory;
