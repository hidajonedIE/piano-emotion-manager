import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useQuotes, useQuoteTemplates, Quote, QuoteItem, QuoteStatus, calculateQuoteTotals, calculateItemTotals, generateId } from '@/hooks/use-quotes';
import { useBusinessInfo } from '@/hooks/use-invoices';
import { useServiceCatalog } from '@/hooks/use-service-catalog';
import { useClientsData, usePianosData } from '@/hooks/data';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';
import { getClientFullName, getClientFormattedAddress } from '@/types';

const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Borrador',
  sent: 'Enviado',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
  expired: 'Expirado',
  converted: 'Convertido a Factura',
};

const ITEM_TYPE_LABELS: Record<QuoteItem['type'], string> = {
  service: 'Servicio',
  part: 'Pieza/Material',
  labor: 'Mano de obra',
  travel: 'Desplazamiento',
  other: 'Otro',
};

const DEFAULT_TAX_RATE = 21;
const DEFAULT_VALIDITY_DAYS = 30;

const DEFAULT_TERMS = `1. Este presupuesto tiene una validez de 30 días desde su fecha de emisión.
2. Los precios incluyen IVA según la legislación vigente.
3. El trabajo se realizará según disponibilidad del técnico.
4. Se requiere un anticipo del 50% para confirmar el servicio.
5. El pago del saldo restante se realizará al finalizar el trabajo.
6. Cualquier trabajo adicional no contemplado en este presupuesto será presupuestado por separado.`;

export default function QuoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isNew = id === 'new';

  const { quotes, addQuote, updateQuote, deleteQuote, getQuote, markAsSent, markAsAccepted, markAsRejected } = useQuotes();
  const { templates } = useQuoteTemplates();
  const { businessInfo } = useBusinessInfo();
  const { rates } = useServiceCatalog();
  const { clients } = useClientsData();
  const { pianos } = usePianosData();

  const [isEditing, setIsEditing] = useState(isNew);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [showPianoPicker, setShowPianoPicker] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [showItemTypeMenu, setShowItemTypeMenu] = useState(false);

  const getValidUntilDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + DEFAULT_VALIDITY_DAYS);
    return date.toISOString().split('T')[0];
  };

  const [form, setForm] = useState<Partial<Quote>>({
    date: new Date().toISOString().split('T')[0],
    validUntil: getValidUntilDate(),
    status: 'draft',
    items: [],
    currency: 'EUR',
    termsAndConditions: DEFAULT_TERMS,
    businessInfo: businessInfo,
    clientId: '',
    clientName: '',
    title: 'Presupuesto de servicios',
  });

  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const accent = useThemeColor({}, 'accent');
  const error = useThemeColor({}, 'error');
  const success = useThemeColor({}, 'success');
  const warning = useThemeColor({}, 'warning');
  const textColor = useThemeColor({}, 'text');
  const background = useThemeColor({}, 'background');

  useEffect(() => {
    if (!isNew && id) {
      const quote = getQuote(id);
      if (quote) {
        setForm(quote);
      }
    } else {
      setForm(prev => ({ ...prev, businessInfo: businessInfo }));
    }
  }, [id, isNew, quotes, businessInfo]);

  const totals = useMemo(() => {
    return calculateQuoteTotals(form.items || []);
  }, [form.items]);

  const clientPianos = useMemo(() => {
    if (!form.clientId) return [];
    return pianos.filter((p: any) => p.clientId === form.clientId);
  }, [form.clientId, pianos]);

  const handleSelectClient = (client: any) => {
    setForm(prev => ({
      ...prev,
      clientId: client.id,
      clientName: getClientFullName(client),
      clientEmail: client.email,
      clientAddress: getClientFormattedAddress(client),
    }));
    setShowClientPicker(false);
  };

  const handleSelectPiano = (piano: any) => {
    setForm(prev => ({
      ...prev,
      pianoId: piano.id,
      pianoDescription: `${piano.brand} ${piano.model || ''} - ${piano.serialNumber || 'Sin número de serie'}`,
    }));
    setShowPianoPicker(false);
  };

  const handleSelectTemplate = (template: any) => {
    const newItems: QuoteItem[] = template.items.map((item: any, index: number) => {
      const itemTotals = calculateItemTotals(item);
      return {
        ...item,
        id: generateId() + index,
        ...itemTotals,
      };
    });

    setForm(prev => ({
      ...prev,
      title: template.name,
      description: template.description,
      items: newItems,
    }));
    setShowTemplatePicker(false);
  };

  const handleAddItemFromService = (rate: any) => {
    const newItem: QuoteItem = {
      id: generateId(),
      type: 'service',
      name: rate.name,
      description: rate.description,
      quantity: 1,
      unitPrice: rate.basePrice,
      discount: 0,
      taxRate: rate.taxRate || DEFAULT_TAX_RATE,
      subtotal: rate.basePrice,
      total: rate.basePrice * (1 + (rate.taxRate || DEFAULT_TAX_RATE) / 100),
    };

    setForm(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem],
    }));
    setShowServicePicker(false);
  };

  const handleAddEmptyItem = (type: QuoteItem['type']) => {
    const newItem: QuoteItem = {
      id: generateId(),
      type,
      name: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      taxRate: DEFAULT_TAX_RATE,
      subtotal: 0,
      total: 0,
    };

    setForm(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem],
    }));
    setShowItemTypeMenu(false);
  };

  const handleUpdateItem = (index: number, updates: Partial<QuoteItem>) => {
    const newItems = [...(form.items || [])];
    const item = { ...newItems[index], ...updates };
    
    // Recalculate totals
    const subtotal = item.quantity * item.unitPrice;
    const discountAmount = subtotal * (item.discount / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (item.taxRate / 100);
    
    item.subtotal = Math.round(subtotal * 100) / 100;
    item.total = Math.round((afterDiscount + taxAmount) * 100) / 100;
    
    newItems[index] = item;
    setForm(prev => ({ ...prev, items: newItems }));
  };

  const handleRemoveItem = (index: number) => {
    const newItems = (form.items || []).filter((_, i) => i !== index);
    setForm(prev => ({ ...prev, items: newItems }));
  };

  const handleSave = async () => {
    if (!form.clientId || !form.clientName) {
      Alert.alert('Error', 'Debes seleccionar un cliente');
      return;
    }

    if (!form.items || form.items.length === 0) {
      Alert.alert('Error', 'Debes añadir al menos un concepto');
      return;
    }

    try {
      const quoteData = {
        ...form,
        ...totals,
        businessInfo: businessInfo,
      } as Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'updatedAt'>;

      if (isNew) {
        await addQuote(quoteData);
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      } else {
        await updateQuote(id!, quoteData);
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsEditing(false);
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo guardar el presupuesto');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar presupuesto',
      '¿Estás seguro de que quieres eliminar este presupuesto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteQuote(id!);
            router.back();
          },
        },
      ]
    );
  };

  const handleStatusChange = (newStatus: QuoteStatus) => {
    Alert.alert(
      'Cambiar estado',
      `¿Cambiar el estado a "${QUOTE_STATUS_LABELS[newStatus]}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            switch (newStatus) {
              case 'sent':
                await markAsSent(id!);
                break;
              case 'accepted':
                await markAsAccepted(id!);
                break;
              case 'rejected':
                await markAsRejected(id!);
                break;
              default:
                await updateQuote(id!, { status: newStatus });
            }
            setForm(prev => ({ ...prev, status: newStatus }));
          },
        },
      ]
    );
  };

  const getStatusColor = (status: QuoteStatus) => {
    switch (status) {
      case 'accepted':
      case 'converted':
        return success;
      case 'sent':
        return accent;
      case 'rejected':
      case 'expired':
        return error;
      default:
        return warning;
    }
  };

  const renderItem = (item: QuoteItem, index: number) => (
    <View key={item.id} style={[styles.itemCard, { backgroundColor: cardBg, borderColor }]}>
      <View style={styles.itemHeader}>
        <View style={[styles.itemTypeBadge, { backgroundColor: `${accent}15` }]}>
          <ThemedText style={[styles.itemTypeText, { color: accent }]}>
            {ITEM_TYPE_LABELS[item.type]}
          </ThemedText>
        </View>
        {isEditing && (
          <Pressable onPress={() => handleRemoveItem(index)}>
            <IconSymbol name="trash" size={18} color={error} />
          </Pressable>
        )}
      </View>

      {isEditing ? (
        <>
          <TextInput
            style={[styles.input, { borderColor, color: textColor }]}
            placeholder="Nombre del concepto"
            placeholderTextColor={textSecondary}
            value={item.name}
            onChangeText={(text) => handleUpdateItem(index, { name: text })}
          />
          <TextInput
            style={[styles.input, { borderColor, color: textColor }]}
            placeholder="Descripción (opcional)"
            placeholderTextColor={textSecondary}
            value={item.description}
            onChangeText={(text) => handleUpdateItem(index, { description: text })}
          />
          <View style={styles.itemRow}>
            <View style={styles.itemField}>
              <ThemedText style={[styles.fieldLabel, { color: textSecondary }]}>Cantidad</ThemedText>
              <TextInput
                style={[styles.input, styles.smallInput, { borderColor, color: textColor }]}
                keyboardType="numeric"
                value={item.quantity.toString()}
                onChangeText={(text) => handleUpdateItem(index, { quantity: parseFloat(text) || 0 })}
              />
            </View>
            <View style={styles.itemField}>
              <ThemedText style={[styles.fieldLabel, { color: textSecondary }]}>Precio unit.</ThemedText>
              <TextInput
                style={[styles.input, styles.smallInput, { borderColor, color: textColor }]}
                keyboardType="numeric"
                value={item.unitPrice.toString()}
                onChangeText={(text) => handleUpdateItem(index, { unitPrice: parseFloat(text) || 0 })}
              />
            </View>
            <View style={styles.itemField}>
              <ThemedText style={[styles.fieldLabel, { color: textSecondary }]}>Dto. %</ThemedText>
              <TextInput
                style={[styles.input, styles.smallInput, { borderColor, color: textColor }]}
                keyboardType="numeric"
                value={item.discount.toString()}
                onChangeText={(text) => handleUpdateItem(index, { discount: parseFloat(text) || 0 })}
              />
            </View>
            <View style={styles.itemField}>
              <ThemedText style={[styles.fieldLabel, { color: textSecondary }]}>IVA %</ThemedText>
              <TextInput
                style={[styles.input, styles.smallInput, { borderColor, color: textColor }]}
                keyboardType="numeric"
                value={item.taxRate.toString()}
                onChangeText={(text) => handleUpdateItem(index, { taxRate: parseFloat(text) || 0 })}
              />
            </View>
          </View>
        </>
      ) : (
        <>
          <ThemedText style={styles.itemName}>{item.name}</ThemedText>
          {item.description && (
            <ThemedText style={[styles.itemDescription, { color: textSecondary }]}>
              {item.description}
            </ThemedText>
          )}
          <View style={styles.itemDetails}>
            <ThemedText style={[styles.itemQuantity, { color: textSecondary }]}>
              {item.quantity} x €{item.unitPrice.toFixed(2)}
              {item.discount > 0 && ` (-${item.discount}%)`}
            </ThemedText>
            <ThemedText style={[styles.itemTotal, { color: accent }]}>
              €{item.total.toFixed(2)}
            </ThemedText>
          </View>
        </>
      )}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: isNew ? 'Nuevo Presupuesto' : form.quoteNumber || 'Presupuesto',
          headerRight: () => (
            <View style={styles.headerButtons}>
              {!isNew && !isEditing && (
                <Pressable onPress={() => setIsEditing(true)} style={styles.headerButton}>
                  <IconSymbol name="pencil" size={22} color={accent} />
                </Pressable>
              )}
              {!isNew && (
                <Pressable onPress={handleDelete} style={styles.headerButton}>
                  <IconSymbol name="trash" size={22} color={error} />
                </Pressable>
              )}
            </View>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Badge */}
        {!isNew && (
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(form.status as QuoteStatus)}15` }]}>
              <ThemedText style={[styles.statusText, { color: getStatusColor(form.status as QuoteStatus) }]}>
                {QUOTE_STATUS_LABELS[form.status as QuoteStatus]}
              </ThemedText>
            </View>
            {form.status === 'draft' && !isEditing && (
              <Pressable
                style={[styles.actionButton, { backgroundColor: accent }]}
                onPress={() => handleStatusChange('sent')}
              >
                <IconSymbol name="paperplane" size={16} color="#FFF" />
                <ThemedText style={styles.actionButtonText}>Marcar como enviado</ThemedText>
              </Pressable>
            )}
            {form.status === 'sent' && !isEditing && (
              <View style={styles.statusActions}>
                <Pressable
                  style={[styles.actionButton, { backgroundColor: success }]}
                  onPress={() => handleStatusChange('accepted')}
                >
                  <IconSymbol name="checkmark" size={16} color="#FFF" />
                  <ThemedText style={styles.actionButtonText}>Aceptado</ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, { backgroundColor: error }]}
                  onPress={() => handleStatusChange('rejected')}
                >
                  <IconSymbol name="xmark" size={16} color="#FFF" />
                  <ThemedText style={styles.actionButtonText}>Rechazado</ThemedText>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {/* Client Selection */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>Cliente</ThemedText>
          {isEditing ? (
            <Pressable
              style={[styles.selectButton, { borderColor }]}
              onPress={() => setShowClientPicker(true)}
            >
              <ThemedText style={form.clientName ? styles.selectText : [styles.selectPlaceholder, { color: textSecondary }]}>
                {form.clientName || 'Seleccionar cliente'}
              </ThemedText>
              <IconSymbol name="chevron.right" size={16} color={textSecondary} />
            </Pressable>
          ) : (
            <View>
              <ThemedText style={styles.clientName}>{form.clientName}</ThemedText>
              {form.clientEmail && (
                <ThemedText style={[styles.clientDetail, { color: textSecondary }]}>{form.clientEmail}</ThemedText>
              )}
              {form.clientAddress && (
                <ThemedText style={[styles.clientDetail, { color: textSecondary }]}>{form.clientAddress}</ThemedText>
              )}
            </View>
          )}
        </View>

        {/* Piano Selection (optional) */}
        {(isEditing || form.pianoId) && (
          <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
            <ThemedText style={styles.sectionTitle}>Piano (opcional)</ThemedText>
            {isEditing ? (
              <Pressable
                style={[styles.selectButton, { borderColor }]}
                onPress={() => setShowPianoPicker(true)}
                disabled={!form.clientId}
              >
                <ThemedText style={form.pianoDescription ? styles.selectText : [styles.selectPlaceholder, { color: textSecondary }]}>
                  {form.pianoDescription || (form.clientId ? 'Seleccionar piano' : 'Primero selecciona un cliente')}
                </ThemedText>
                <IconSymbol name="chevron.right" size={16} color={textSecondary} />
              </Pressable>
            ) : (
              <ThemedText>🎹 {form.pianoDescription}</ThemedText>
            )}
          </View>
        )}

        {/* Quote Details */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>Detalles del presupuesto</ThemedText>
          
          {isEditing ? (
            <>
              <View style={styles.fieldGroup}>
                <ThemedText style={[styles.fieldLabel, { color: textSecondary }]}>Título</ThemedText>
                <TextInput
                  style={[styles.input, { borderColor, color: textColor }]}
                  value={form.title}
                  onChangeText={(text) => setForm(prev => ({ ...prev, title: text }))}
                  placeholder="Título del presupuesto"
                  placeholderTextColor={textSecondary}
                />
              </View>
              <View style={styles.fieldGroup}>
                <ThemedText style={[styles.fieldLabel, { color: textSecondary }]}>Descripción</ThemedText>
                <TextInput
                  style={[styles.input, styles.textArea, { borderColor, color: textColor }]}
                  value={form.description}
                  onChangeText={(text) => setForm(prev => ({ ...prev, description: text }))}
                  placeholder="Descripción (opcional)"
                  placeholderTextColor={textSecondary}
                  multiline
                  numberOfLines={3}
                />
              </View>
              <View style={styles.dateRow}>
                <View style={styles.dateField}>
                  <ThemedText style={[styles.fieldLabel, { color: textSecondary }]}>Fecha</ThemedText>
                  <TextInput
                    style={[styles.input, { borderColor, color: textColor }]}
                    value={form.date}
                    onChangeText={(text) => setForm(prev => ({ ...prev, date: text }))}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={textSecondary}
                  />
                </View>
                <View style={styles.dateField}>
                  <ThemedText style={[styles.fieldLabel, { color: textSecondary }]}>Válido hasta</ThemedText>
                  <TextInput
                    style={[styles.input, { borderColor, color: textColor }]}
                    value={form.validUntil}
                    onChangeText={(text) => setForm(prev => ({ ...prev, validUntil: text }))}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={textSecondary}
                  />
                </View>
              </View>
            </>
          ) : (
            <>
              <ThemedText style={styles.quoteTitle}>{form.title}</ThemedText>
              {form.description && (
                <ThemedText style={[styles.quoteDescription, { color: textSecondary }]}>
                  {form.description}
                </ThemedText>
              )}
              <View style={styles.dateInfo}>
                <ThemedText style={[styles.dateLabel, { color: textSecondary }]}>
                  Fecha: {new Date(form.date!).toLocaleDateString('es-ES')}
                </ThemedText>
                <ThemedText style={[styles.dateLabel, { color: textSecondary }]}>
                  Válido hasta: {new Date(form.validUntil!).toLocaleDateString('es-ES')}
                </ThemedText>
              </View>
            </>
          )}
        </View>

        {/* Items */}
        <View style={styles.itemsSection}>
          <View style={styles.itemsHeader}>
            <ThemedText style={styles.sectionTitle}>Conceptos</ThemedText>
            {isEditing && (
              <View style={styles.addItemButtons}>
                <Pressable
                  style={[styles.addItemButton, { backgroundColor: `${accent}15` }]}
                  onPress={() => setShowTemplatePicker(true)}
                >
                  <IconSymbol name="doc.on.doc" size={16} color={accent} />
                  <ThemedText style={[styles.addItemText, { color: accent }]}>Plantilla</ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.addItemButton, { backgroundColor: `${accent}15` }]}
                  onPress={() => setShowServicePicker(true)}
                >
                  <IconSymbol name="wrench" size={16} color={accent} />
                  <ThemedText style={[styles.addItemText, { color: accent }]}>Servicio</ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.addItemButton, { backgroundColor: `${accent}15` }]}
                  onPress={() => setShowItemTypeMenu(true)}
                >
                  <IconSymbol name="plus" size={16} color={accent} />
                  <ThemedText style={[styles.addItemText, { color: accent }]}>Manual</ThemedText>
                </Pressable>
              </View>
            )}
          </View>

          {(form.items || []).map((item, index) => renderItem(item, index))}

          {(!form.items || form.items.length === 0) && (
            <View style={[styles.emptyItems, { borderColor }]}>
              <IconSymbol name="doc.text" size={32} color={textSecondary} />
              <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
                No hay conceptos añadidos
              </ThemedText>
            </View>
          )}
        </View>

        {/* Totals */}
        <View style={[styles.totalsSection, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.totalRow}>
            <ThemedText style={[styles.totalLabel, { color: textSecondary }]}>Subtotal</ThemedText>
            <ThemedText style={styles.totalValue}>€{totals.subtotal.toFixed(2)}</ThemedText>
          </View>
          {totals.totalDiscount > 0 && (
            <View style={styles.totalRow}>
              <ThemedText style={[styles.totalLabel, { color: textSecondary }]}>Descuento</ThemedText>
              <ThemedText style={[styles.totalValue, { color: success }]}>-€{totals.totalDiscount.toFixed(2)}</ThemedText>
            </View>
          )}
          <View style={styles.totalRow}>
            <ThemedText style={[styles.totalLabel, { color: textSecondary }]}>IVA</ThemedText>
            <ThemedText style={styles.totalValue}>€{totals.taxAmount.toFixed(2)}</ThemedText>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <ThemedText style={styles.grandTotalLabel}>TOTAL</ThemedText>
            <ThemedText style={[styles.grandTotalValue, { color: accent }]}>€{totals.total.toFixed(2)}</ThemedText>
          </View>
        </View>

        {/* Terms and Conditions */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>Términos y condiciones</ThemedText>
          {isEditing ? (
            <TextInput
              style={[styles.input, styles.textArea, { borderColor, color: textColor }]}
              value={form.termsAndConditions}
              onChangeText={(text) => setForm(prev => ({ ...prev, termsAndConditions: text }))}
              placeholder="Términos y condiciones"
              placeholderTextColor={textSecondary}
              multiline
              numberOfLines={6}
            />
          ) : (
            <ThemedText style={[styles.terms, { color: textSecondary }]}>
              {form.termsAndConditions}
            </ThemedText>
          )}
        </View>

        {/* Notes */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>Notas</ThemedText>
          {isEditing ? (
            <TextInput
              style={[styles.input, styles.textArea, { borderColor, color: textColor }]}
              value={form.notes}
              onChangeText={(text) => setForm(prev => ({ ...prev, notes: text }))}
              placeholder="Notas adicionales (opcional)"
              placeholderTextColor={textSecondary}
              multiline
              numberOfLines={3}
            />
          ) : (
            <ThemedText style={[styles.notes, { color: textSecondary }]}>
              {form.notes || 'Sin notas'}
            </ThemedText>
          )}
        </View>
      </ScrollView>

      {/* Save Button */}
      {isEditing && (
        <View style={[styles.footer, { backgroundColor: background, borderColor }]}>
          <Pressable
            style={[styles.cancelButton, { borderColor }]}
            onPress={() => isNew ? router.back() : setIsEditing(false)}
          >
            <ThemedText style={styles.cancelButtonText}>Cancelar</ThemedText>
          </Pressable>
          <Pressable
            style={[styles.saveButton, { backgroundColor: accent }]}
            onPress={handleSave}
          >
            <ThemedText style={styles.saveButtonText}>
              {isNew ? 'Crear presupuesto' : 'Guardar cambios'}
            </ThemedText>
          </Pressable>
        </View>
      )}

      {/* Client Picker Modal */}
      <Modal visible={showClientPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: background }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Seleccionar cliente</ThemedText>
              <Pressable onPress={() => setShowClientPicker(false)}>
                <IconSymbol name="xmark" size={24} color={textColor} />
              </Pressable>
            </View>
            <FlatList
              data={clients}
              keyExtractor={(item: any) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.pickerItem, { borderColor }]}
                  onPress={() => handleSelectClient(item)}
                >
                  <ThemedText style={styles.pickerItemText}>{getClientFullName(item)}</ThemedText>
                  {item.email && (
                    <ThemedText style={[styles.pickerItemSubtext, { color: textSecondary }]}>
                      {item.email}
                    </ThemedText>
                  )}
                </Pressable>
              )}
              ListEmptyComponent={
                <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
                  No hay clientes
                </ThemedText>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Piano Picker Modal */}
      <Modal visible={showPianoPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: background }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Seleccionar piano</ThemedText>
              <Pressable onPress={() => setShowPianoPicker(false)}>
                <IconSymbol name="xmark" size={24} color={textColor} />
              </Pressable>
            </View>
            <FlatList
              data={clientPianos}
              keyExtractor={(item: any) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.pickerItem, { borderColor }]}
                  onPress={() => handleSelectPiano(item)}
                >
                  <ThemedText style={styles.pickerItemText}>
                    {item.brand} {item.model || ''}
                  </ThemedText>
                  <ThemedText style={[styles.pickerItemSubtext, { color: textSecondary }]}>
                    {item.serialNumber || 'Sin número de serie'}
                  </ThemedText>
                </Pressable>
              )}
              ListEmptyComponent={
                <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
                  Este cliente no tiene pianos registrados
                </ThemedText>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Template Picker Modal */}
      <Modal visible={showTemplatePicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: background }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Seleccionar plantilla</ThemedText>
              <Pressable onPress={() => setShowTemplatePicker(false)}>
                <IconSymbol name="xmark" size={24} color={textColor} />
              </Pressable>
            </View>
            <FlatList
              data={templates}
              keyExtractor={(item: any) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.pickerItem, { borderColor }]}
                  onPress={() => handleSelectTemplate(item)}
                >
                  <ThemedText style={styles.pickerItemText}>{item.name}</ThemedText>
                  {item.description && (
                    <ThemedText style={[styles.pickerItemSubtext, { color: textSecondary }]}>
                      {item.description}
                    </ThemedText>
                  )}
                  <ThemedText style={[styles.pickerItemSubtext, { color: accent }]}>
                    {item.items?.length || 0} conceptos
                  </ThemedText>
                </Pressable>
              )}
              ListEmptyComponent={
                <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
                  No hay plantillas disponibles
                </ThemedText>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Service Picker Modal */}
      <Modal visible={showServicePicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: background }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Añadir servicio</ThemedText>
              <Pressable onPress={() => setShowServicePicker(false)}>
                <IconSymbol name="xmark" size={24} color={textColor} />
              </Pressable>
            </View>
            <FlatList
              data={rates}
              keyExtractor={(item: any) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.pickerItem, { borderColor }]}
                  onPress={() => handleAddItemFromService(item)}
                >
                  <View style={styles.serviceItem}>
                    <View>
                      <ThemedText style={styles.pickerItemText}>{item.name}</ThemedText>
                      {item.description && (
                        <ThemedText style={[styles.pickerItemSubtext, { color: textSecondary }]}>
                          {item.description}
                        </ThemedText>
                      )}
                    </View>
                    <ThemedText style={[styles.servicePrice, { color: accent }]}>
                      €{item.basePrice?.toFixed(2)}
                    </ThemedText>
                  </View>
                </Pressable>
              )}
              ListEmptyComponent={
                <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
                  No hay servicios en el catálogo
                </ThemedText>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Item Type Menu Modal */}
      <Modal visible={showItemTypeMenu} animationType="fade" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setShowItemTypeMenu(false)}>
          <View style={[styles.menuContent, { backgroundColor: background }]}>
            <ThemedText style={styles.menuTitle}>Tipo de concepto</ThemedText>
            {(['service', 'part', 'labor', 'travel', 'other'] as QuoteItem['type'][]).map((type) => (
              <Pressable
                key={type}
                style={[styles.menuItem, { borderColor }]}
                onPress={() => handleAddEmptyItem(type)}
              >
                <ThemedText>{ITEM_TYPE_LABELS[type]}</ThemedText>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
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
  headerButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  headerButton: {
    padding: Spacing.xs,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  selectText: {
    fontSize: 15,
  },
  selectPlaceholder: {
    fontSize: 15,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '500',
  },
  clientDetail: {
    fontSize: 14,
    marginTop: 2,
  },
  fieldGroup: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: 15,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  dateField: {
    flex: 1,
  },
  quoteTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  quoteDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  dateInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  dateLabel: {
    fontSize: 13,
  },
  itemsSection: {
    gap: Spacing.sm,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  addItemButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  addItemText: {
    fontSize: 12,
    fontWeight: '500',
  },
  itemCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTypeBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.sm,
  },
  itemTypeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  itemField: {
    flex: 1,
  },
  smallInput: {
    paddingVertical: 6,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
  },
  itemDescription: {
    fontSize: 13,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: 13,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyItems: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  totalsSection: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  grandTotal: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  terms: {
    fontSize: 13,
    lineHeight: 20,
  },
  notes: {
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.md,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '70%',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  pickerItem: {
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  pickerItemText: {
    fontSize: 16,
  },
  pickerItemSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
  },
  menuContent: {
    position: 'absolute',
    bottom: '30%',
    left: Spacing.lg,
    right: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  menuItem: {
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
});
