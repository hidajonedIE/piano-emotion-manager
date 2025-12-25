import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useClientsData, usePianosData, useServicesData } from '@/hooks/data';
import { useInventoryData } from '@/hooks/data';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';
import {
  Service,
  ServiceType,
  MaintenanceLevel,
  Task,
  MaterialUsed,
  PianoCondition,
  SERVICE_TYPE_LABELS,
  MAINTENANCE_LEVEL_LABELS,
  MAINTENANCE_LEVEL_DESCRIPTIONS,
  MAINTENANCE_LEVEL_COLORS,
  PIANO_CONDITION_LABELS,
  PIANO_CONDITION_COLORS,
  getTasksForService,
  generateId,
  formatDate,
  getClientFullName,
} from '@/types';

export default function ServiceDetailScreen() {
  const { id, pianoId: initialPianoId, clientId: initialClientId } = useLocalSearchParams<{
    id: string;
    pianoId?: string;
    clientId?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isNew = id === 'new';

  const { clients, getClient } = useClientsData();
  const { pianos, getPiano, getPianosByClient, updatePiano } = usePianosData();
  const { services, addService, updateService, deleteService, getService } = useServicesData();
  const { materials, getMaterial, updateMaterial } = useInventoryData();

  const [isEditing, setIsEditing] = useState(isNew);
  const [form, setForm] = useState<Partial<Service>>({
    pianoId: initialPianoId || '',
    clientId: initialClientId || '',
    date: new Date().toISOString().split('T')[0],
    type: 'tuning',
    maintenanceLevel: undefined,
    tasks: [],
    materialsUsed: [],
    notes: '',
    cost: undefined,
    pianoConditionAfter: undefined,
    humidity: undefined,
    temperature: undefined,
  });

  // Estado para modal de añadir material
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [materialQuantity, setMaterialQuantity] = useState('1');

  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const accent = useThemeColor({}, 'accent');
  const error = useThemeColor({}, 'error');
  const textColor = useThemeColor({}, 'text');

  // Cargar datos del servicio existente
  useEffect(() => {
    if (!isNew && id) {
      const service = getService(id);
      if (service) {
        setForm(service);
      }
    }
  }, [id, isNew, services]);

  // Actualizar tareas cuando cambia el tipo de servicio o nivel de mantenimiento
  useEffect(() => {
    if (isEditing && isNew) {
      const taskNames = getTasksForService(form.type as ServiceType, form.maintenanceLevel);
      const tasks: Task[] = taskNames.map((name) => ({
        id: generateId(),
        name,
        completed: false,
      }));
      setForm((prev) => ({ ...prev, tasks }));
    }
  }, [form.type, form.maintenanceLevel, isEditing, isNew]);

  const selectedClient = form.clientId ? getClient(form.clientId) : null;
  const selectedPiano = form.pianoId ? getPiano(form.pianoId) : null;
  const clientPianos = form.clientId ? getPianosByClient(form.clientId) : [];

  const handleSave = async () => {
    if (!form.clientId) {
      Alert.alert('Error', 'Debes seleccionar un cliente');
      return;
    }
    if (!form.pianoId) {
      Alert.alert('Error', 'Debes seleccionar un piano');
      return;
    }
    if (!form.date) {
      Alert.alert('Error', 'La fecha es obligatoria');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Actualizar estado del piano si se especificó
    if (form.pianoConditionAfter && selectedPiano) {
      await updatePiano(selectedPiano.id, { condition: form.pianoConditionAfter });
    }

    if (isNew) {
      await addService({
        pianoId: form.pianoId,
        clientId: form.clientId,
        date: form.date,
        type: form.type || 'tuning',
        maintenanceLevel: form.maintenanceLevel,
        tasks: form.tasks || [],
        materialsUsed: form.materialsUsed || [],
        notes: form.notes?.trim(),
        cost: form.cost,
        pianoConditionAfter: form.pianoConditionAfter,
      });

      // Descontar materiales del stock
      if (form.materialsUsed && form.materialsUsed.length > 0) {
        for (const mat of form.materialsUsed) {
          const material = getMaterial(mat.materialId);
          if (material) {
            const newStock = Math.max(0, material.currentStock - mat.quantity);
            await updateMaterial(mat.materialId, { currentStock: newStock });
          }
        }
      }

      router.back();
    } else if (id) {
      await updateService(id, form);
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar servicio',
      '¿Estás seguro de que quieres eliminar este servicio?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await deleteService(id!);
            router.back();
          },
        },
      ]
    );
  };

  const toggleTask = (taskId: string) => {
    const updatedTasks = form.tasks?.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    setForm({ ...form, tasks: updatedTasks });
  };

  const serviceTypes: ServiceType[] = ['tuning', 'repair', 'regulation', 'maintenance', 'inspection', 'other'];
  const maintenanceLevels: MaintenanceLevel[] = ['basic', 'complete', 'premium'];

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: isNew ? 'Nuevo Servicio' : SERVICE_TYPE_LABELS[form.type as ServiceType] || 'Servicio',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={{ marginRight: 16 }}>
              <IconSymbol name="chevron.left" size={24} color={accent} />
            </Pressable>
          ),
          headerRight: () =>
            !isNew && (
              <Pressable onPress={() => setIsEditing(!isEditing)}>
                <ThemedText style={{ color: accent }}>
                  {isEditing ? 'Cancelar' : 'Editar'}
                </ThemedText>
              </Pressable>
            ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Selección de cliente */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={[styles.label, { color: textSecondary }]}>Cliente *</ThemedText>
          {isEditing ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.horizontalList}>
                {clients.map((c) => (
                  <Pressable
                    key={c.id}
                    style={[
                      styles.selectOption,
                      { backgroundColor: cardBg, borderColor },
                      form.clientId === c.id && { backgroundColor: accent, borderColor: accent },
                    ]}
                    onPress={() => setForm({ ...form, clientId: c.id, pianoId: '' })}
                  >
                    <ThemedText
                      style={{ color: form.clientId === c.id ? '#FFFFFF' : textSecondary }}
                      numberOfLines={1}
                    >
                      {getClientFullName(c)}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          ) : (
            <ThemedText style={styles.value}>{selectedClient ? getClientFullName(selectedClient) : '-'}</ThemedText>
          )}
        </View>

        {/* Selección de piano */}
        {form.clientId && (
          <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
            <ThemedText style={[styles.label, { color: textSecondary }]}>Piano *</ThemedText>
            {isEditing ? (
              clientPianos.length > 0 ? (
                <View style={styles.pianoList}>
                  {clientPianos.map((p) => (
                    <Pressable
                      key={p.id}
                      style={[
                        styles.pianoOption,
                        { backgroundColor: cardBg, borderColor },
                        form.pianoId === p.id && { backgroundColor: accent, borderColor: accent },
                      ]}
                      onPress={() => setForm({ ...form, pianoId: p.id })}
                    >
                      <ThemedText
                        style={{ color: form.pianoId === p.id ? '#FFFFFF' : textColor }}
                      >
                        {p.brand} {p.model}
                      </ThemedText>
                      {p.serialNumber && (
                        <ThemedText
                          style={[
                            styles.pianoSerial,
                            { color: form.pianoId === p.id ? '#FFFFFF' : textSecondary },
                          ]}
                        >
                          S/N: {p.serialNumber}
                        </ThemedText>
                      )}
                    </Pressable>
                  ))}
                </View>
              ) : (
                <ThemedText style={{ color: textSecondary }}>
                  Este cliente no tiene pianos registrados.
                </ThemedText>
              )
            ) : (
              <ThemedText style={styles.value}>
                {selectedPiano ? `${selectedPiano.brand} ${selectedPiano.model}` : '-'}
              </ThemedText>
            )}
          </View>
        )}

        {/* Fecha y tipo de servicio */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: textSecondary }]}>Fecha *</ThemedText>
            {isEditing ? (
              <TextInput
                style={[styles.input, { backgroundColor: cardBg, borderColor, color: textColor }]}
                value={form.date}
                onChangeText={(text) => setForm({ ...form, date: text })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={textSecondary}
              />
            ) : (
              <ThemedText style={styles.value}>{form.date ? formatDate(form.date) : '-'}</ThemedText>
            )}
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: textSecondary }]}>Tipo de servicio</ThemedText>
            {isEditing ? (
              <View style={styles.typeGrid}>
                {serviceTypes.map((type) => (
                  <Pressable
                    key={type}
                    style={[
                      styles.typeOption,
                      { backgroundColor: cardBg, borderColor },
                      form.type === type && { backgroundColor: accent, borderColor: accent },
                    ]}
                    onPress={() => setForm({ ...form, type, maintenanceLevel: type === 'maintenance' ? 'basic' : undefined })}
                  >
                    <ThemedText
                      style={[
                        styles.typeText,
                        { color: form.type === type ? '#FFFFFF' : textSecondary },
                      ]}
                    >
                      {SERVICE_TYPE_LABELS[type]}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            ) : (
              <ThemedText style={styles.value}>
                {SERVICE_TYPE_LABELS[form.type as ServiceType]}
              </ThemedText>
            )}
          </View>

          {/* Nivel de mantenimiento (solo para tipo maintenance) */}
          {form.type === 'maintenance' && (
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: textSecondary }]}>
                Nivel de mantenimiento
              </ThemedText>
              {isEditing ? (
                <View style={styles.levelList}>
                  {maintenanceLevels.map((level) => {
                    const levelColor = MAINTENANCE_LEVEL_COLORS[level];
                    return (
                      <Pressable
                        key={level}
                        style={[
                          styles.levelOption,
                          { borderColor: levelColor },
                          form.maintenanceLevel === level && { backgroundColor: levelColor },
                        ]}
                        onPress={() => setForm({ ...form, maintenanceLevel: level })}
                      >
                        <ThemedText
                          style={[
                            styles.levelTitle,
                            { color: form.maintenanceLevel === level ? '#FFFFFF' : levelColor },
                          ]}
                        >
                          {MAINTENANCE_LEVEL_LABELS[level]}
                        </ThemedText>
                        <ThemedText
                          style={[
                            styles.levelDesc,
                            { color: form.maintenanceLevel === level ? '#FFFFFF' : textSecondary },
                          ]}
                          numberOfLines={2}
                        >
                          {MAINTENANCE_LEVEL_DESCRIPTIONS[level]}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <ThemedText style={styles.value}>
                  {form.maintenanceLevel ? MAINTENANCE_LEVEL_LABELS[form.maintenanceLevel] : '-'}
                </ThemedText>
              )}
            </View>
          )}

          {/* Coste */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: textSecondary }]}>Coste (€)</ThemedText>
            {isEditing ? (
              <TextInput
                style={[styles.input, { backgroundColor: cardBg, borderColor, color: textColor }]}
                value={form.cost?.toString() || ''}
                onChangeText={(text) => setForm({ ...form, cost: text ? parseFloat(text) : undefined })}
                placeholder="0.00"
                placeholderTextColor={textSecondary}
                keyboardType="decimal-pad"
              />
            ) : (
              <ThemedText style={styles.value}>
                {form.cost !== undefined ? `€${form.cost}` : '-'}
              </ThemedText>
            )}
          </View>
        </View>

        {/* Estado del piano después del servicio */}
        {isEditing && (
          <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
            <ThemedText style={[styles.label, { color: textSecondary }]}>
              Estado del piano tras el servicio
            </ThemedText>
            <View style={styles.conditionRow}>
              {(['tunable', 'needs_repair', 'unknown'] as PianoCondition[]).map((cond) => {
                const color = PIANO_CONDITION_COLORS[cond];
                return (
                  <Pressable
                    key={cond}
                    style={[
                      styles.conditionOption,
                      { borderColor: color },
                      form.pianoConditionAfter === cond && { backgroundColor: color },
                    ]}
                    onPress={() => setForm({ ...form, pianoConditionAfter: cond })}
                  >
                    <ThemedText
                      style={[
                        styles.conditionText,
                        { color: form.pianoConditionAfter === cond ? '#FFFFFF' : color },
                      ]}
                    >
                      {PIANO_CONDITION_LABELS[cond]}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Lista de tareas */}
        {form.tasks && form.tasks.length > 0 && (
          <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
            <ThemedText style={[styles.label, { color: textSecondary }]}>
              Tareas ({form.tasks.filter((t) => t.completed).length}/{form.tasks.length})
            </ThemedText>
            <View style={styles.taskList}>
              {form.tasks.map((task) => (
                <Pressable
                  key={task.id}
                  style={styles.taskItem}
                  onPress={() => isEditing && toggleTask(task.id)}
                  disabled={!isEditing}
                >
                  <View
                    style={[
                      styles.checkbox,
                      { borderColor: accent },
                      task.completed && { backgroundColor: accent },
                    ]}
                  >
                    {task.completed && (
                      <IconSymbol name="checkmark" size={14} color="#FFFFFF" />
                    )}
                  </View>
                  <ThemedText
                    style={[
                      styles.taskText,
                      task.completed && styles.taskCompleted,
                    ]}
                  >
                    {task.name}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Materiales Usados */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.label, { color: textSecondary }]}>
              Materiales Usados ({form.materialsUsed?.length || 0})
            </ThemedText>
            {isEditing && (
              <Pressable
                style={[styles.addMaterialBtn, { backgroundColor: accent }]}
                onPress={() => setShowMaterialModal(true)}
              >
                <IconSymbol name="plus" size={16} color="#FFFFFF" />
                <ThemedText style={{ color: '#FFFFFF', marginLeft: 4 }}>Añadir</ThemedText>
              </Pressable>
            )}
          </View>
          {form.materialsUsed && form.materialsUsed.length > 0 ? (
            <View style={styles.materialsList}>
              {form.materialsUsed.map((mat, index) => (
                <View key={index} style={[styles.materialItem, { borderColor }]}>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.materialName}>{mat.materialName}</ThemedText>
                    <ThemedText style={[styles.materialQty, { color: textSecondary }]}>
                      {mat.quantity} uds. {mat.unitPrice ? `x €${mat.unitPrice}` : ''}
                    </ThemedText>
                  </View>
                  {mat.totalPrice && (
                    <ThemedText style={[styles.materialPrice, { color: accent }]}>
                      €{mat.totalPrice.toFixed(2)}
                    </ThemedText>
                  )}
                  {isEditing && (
                    <Pressable
                      onPress={() => {
                        const updated = [...(form.materialsUsed || [])];
                        updated.splice(index, 1);
                        setForm({ ...form, materialsUsed: updated });
                      }}
                      style={{ padding: 8 }}
                    >
                      <IconSymbol name="xmark.circle.fill" size={20} color={error} />
                    </Pressable>
                  )}
                </View>
              ))}
              {form.materialsUsed.some(m => m.totalPrice) && (
                <View style={[styles.materialTotal, { borderColor }]}>
                  <ThemedText style={{ fontWeight: '600' }}>Total Materiales:</ThemedText>
                  <ThemedText style={[styles.materialPrice, { color: accent }]}>
                    €{form.materialsUsed.reduce((sum, m) => sum + (m.totalPrice || 0), 0).toFixed(2)}
                  </ThemedText>
                </View>
              )}
            </View>
          ) : (
            <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
              No se han registrado materiales
            </ThemedText>
          )}
        </View>

        {/* Modal para añadir material */}
        {showMaterialModal && (
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
              <ThemedText type="subtitle" style={{ marginBottom: 16 }}>Añadir Material</ThemedText>
              
              <ThemedText style={[styles.label, { color: textSecondary }]}>Material</ThemedText>
              <ScrollView style={{ maxHeight: 200, marginBottom: 16 }}>
                {materials.map((mat) => (
                  <Pressable
                    key={mat.id}
                    style={[
                      styles.materialOption,
                      { borderColor },
                      selectedMaterialId === mat.id && { backgroundColor: accent, borderColor: accent },
                    ]}
                    onPress={() => setSelectedMaterialId(mat.id)}
                  >
                    <ThemedText style={{ color: selectedMaterialId === mat.id ? '#FFFFFF' : textColor }}>
                      {mat.name}
                    </ThemedText>
                    <ThemedText style={{ color: selectedMaterialId === mat.id ? '#FFFFFF' : textSecondary, fontSize: 12 }}>
                      Stock: {mat.currentStock} | {mat.unitPrice ? `€${mat.unitPrice}` : 'Sin precio'}
                    </ThemedText>
                  </Pressable>
                ))}
              </ScrollView>

              <ThemedText style={[styles.label, { color: textSecondary }]}>Cantidad</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: cardBg, borderColor, color: textColor }]}
                value={materialQuantity}
                onChangeText={setMaterialQuantity}
                keyboardType="numeric"
                placeholder="1"
                placeholderTextColor={textSecondary}
              />

              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalBtn, { borderColor }]}
                  onPress={() => {
                    setShowMaterialModal(false);
                    setSelectedMaterialId('');
                    setMaterialQuantity('1');
                  }}
                >
                  <ThemedText>Cancelar</ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.modalBtn, { backgroundColor: accent }]}
                  onPress={() => {
                    if (selectedMaterialId && materialQuantity) {
                      const material = getMaterial(selectedMaterialId);
                      if (material) {
                        const qty = parseInt(materialQuantity) || 1;
                        const newMaterial: MaterialUsed = {
                          materialId: material.id,
                          materialName: material.name,
                          quantity: qty,
                          unitPrice: material.unitPrice,
                          totalPrice: material.unitPrice ? material.unitPrice * qty : undefined,
                        };
                        setForm({
                          ...form,
                          materialsUsed: [...(form.materialsUsed || []), newMaterial],
                        });
                      }
                    }
                    setShowMaterialModal(false);
                    setSelectedMaterialId('');
                    setMaterialQuantity('1');
                  }}
                >
                  <ThemedText style={{ color: '#FFFFFF' }}>Añadir</ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* Condiciones Ambientales */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Condiciones Ambientales</ThemedText>
          <View style={styles.environmentalRow}>
            <View style={styles.environmentalField}>
              <ThemedText style={[styles.label, { color: textSecondary }]}>Humedad (%)</ThemedText>
              {isEditing ? (
                <TextInput
                  style={[styles.input, { backgroundColor: cardBg, borderColor, color: textColor }]}
                  value={form.humidity?.toString() || ''}
                  onChangeText={(text) => setForm({ ...form, humidity: text ? parseFloat(text) : undefined })}
                  placeholder="45-70%"
                  placeholderTextColor={textSecondary}
                  keyboardType="numeric"
                />
              ) : (
                <ThemedText style={styles.value}>
                  {form.humidity ? `${form.humidity}%` : '-'}
                </ThemedText>
              )}
            </View>
            <View style={styles.environmentalField}>
              <ThemedText style={[styles.label, { color: textSecondary }]}>Temperatura (°C)</ThemedText>
              {isEditing ? (
                <TextInput
                  style={[styles.input, { backgroundColor: cardBg, borderColor, color: textColor }]}
                  value={form.temperature?.toString() || ''}
                  onChangeText={(text) => setForm({ ...form, temperature: text ? parseFloat(text) : undefined })}
                  placeholder="18-22°C"
                  placeholderTextColor={textSecondary}
                  keyboardType="numeric"
                />
              ) : (
                <ThemedText style={styles.value}>
                  {form.temperature ? `${form.temperature}°C` : '-'}
                </ThemedText>
              )}
            </View>
          </View>
          {(form.humidity || form.temperature) && !isEditing && (
            <View style={[styles.environmentalWarning, { backgroundColor: form.humidity && (form.humidity < 40 || form.humidity > 60) ? '#FFF3CD' : '#D4EDDA' }]}>
              <IconSymbol name={form.humidity && (form.humidity < 40 || form.humidity > 60) ? 'exclamationmark.triangle.fill' : 'checkmark.circle.fill'} size={16} color={form.humidity && (form.humidity < 40 || form.humidity > 60) ? '#856404' : '#155724'} />
              <ThemedText style={{ color: form.humidity && (form.humidity < 40 || form.humidity > 60) ? '#856404' : '#155724', marginLeft: 8, flex: 1 }}>
                {form.humidity && (form.humidity < 40 || form.humidity > 60) 
                  ? 'Humedad fuera del rango óptimo (40-60%). Recomendar humidificador/deshumidificador.'
                  : 'Condiciones ambientales óptimas para el piano.'}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Notas */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={[styles.label, { color: textSecondary }]}>Notas</ThemedText>
          {isEditing ? (
            <TextInput
              style={[
                styles.input,
                styles.inputMultiline,
                { backgroundColor: cardBg, borderColor, color: textColor },
              ]}
              value={form.notes}
              onChangeText={(text) => setForm({ ...form, notes: text })}
              placeholder="Observaciones, recomendaciones..."
              placeholderTextColor={textSecondary}
              multiline
              numberOfLines={4}
            />
          ) : (
            <ThemedText style={styles.value}>{form.notes || '-'}</ThemedText>
          )}
        </View>

        {/* Botones de acción */}
        {isEditing && (
          <Pressable style={[styles.saveButton, { backgroundColor: accent }]} onPress={handleSave}
            accessibilityRole="button"
            accessibilityLabel="Guardar cambios"
            accessibilityHint="Pulsa para guardar los datos">
            <ThemedText style={styles.saveButtonText}>
              {isNew ? 'Registrar Servicio' : 'Guardar Cambios'}
            </ThemedText>
          </Pressable>
        )}

        {!isNew && !isEditing && (
          <Pressable style={[styles.deleteButton, { borderColor: error }]} onPress={handleDelete}
            accessibilityRole="button"
            accessibilityLabel="Eliminar"
            accessibilityHint="Pulsa para eliminar este elemento">
            <IconSymbol name="trash.fill" size={20} color={error} />
            <ThemedText style={[styles.deleteButtonText, { color: error }]}>
              Eliminar Servicio
            </ThemedText>
          </Pressable>
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
  inputGroup: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  value: {
    fontSize: 16,
    paddingVertical: 4,
  },
  horizontalList: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingRight: Spacing.md,
  },
  selectOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  pianoList: {
    gap: Spacing.sm,
  },
  pianoOption: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  pianoSerial: {
    fontSize: 12,
    marginTop: 2,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  typeOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  typeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  levelList: {
    gap: Spacing.sm,
  },
  levelOption: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
  levelTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  levelDesc: {
    fontSize: 12,
    marginTop: 4,
  },
  conditionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  conditionOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  conditionText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  taskList: {
    gap: Spacing.sm,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskText: {
    flex: 1,
    fontSize: 14,
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  saveButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addMaterialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.sm,
  },
  materialsList: {
    gap: Spacing.sm,
  },
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  materialName: {
    fontSize: 15,
    fontWeight: '500',
  },
  materialQty: {
    fontSize: 12,
  },
  materialPrice: {
    fontSize: 15,
    fontWeight: '600',
    marginRight: 8,
  },
  materialTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    marginTop: Spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  materialOption: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  modalBtn: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  environmentalRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  environmentalField: {
    flex: 1,
    gap: 4,
  },
  environmentalWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
});
