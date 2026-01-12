/**
 * Gestión de Tipos de Servicio
 * Piano Emotion Manager
 * 
 * Permite a los usuarios crear, editar y eliminar tipos de servicio personalizados
 */

import { useRouter, Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  TextInput,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';
import { trpc } from '@/utils/trpc';

interface ServiceType {
  id: number;
  code: string;
  label: string;
  description?: string;
  icon?: string;
  color?: string;
  defaultTasks?: string;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
}

export default function ServiceTypesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const accent = useThemeColor({}, 'accent');
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');

  // Estado
  const [modalVisible, setModalVisible] = useState(false);
  const [editingType, setEditingType] = useState<ServiceType | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    label: '',
    description: '',
    icon: 'wrench.fill',
    color: '#3B82F6',
    defaultTasks: [] as string[],
  });

  // Queries
  const { data: serviceTypes = [], refetch } = trpc.serviceTypes.list.useQuery();
  const createMutation = trpc.serviceTypes.create.useMutation();
  const updateMutation = trpc.serviceTypes.update.useMutation();
  const deleteMutation = trpc.serviceTypes.delete.useMutation();

  const handleOpenModal = (type?: ServiceType) => {
    if (type) {
      setEditingType(type);
      setFormData({
        code: type.code,
        label: type.label,
        description: type.description || '',
        icon: type.icon || 'wrench.fill',
        color: type.color || '#3B82F6',
        defaultTasks: type.defaultTasks ? JSON.parse(type.defaultTasks) : [],
      });
    } else {
      setEditingType(null);
      setFormData({
        code: '',
        label: '',
        description: '',
        icon: 'wrench.fill',
        color: '#3B82F6',
        defaultTasks: [],
      });
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.label.trim()) {
      Alert.alert('Error', 'El nombre del tipo de servicio es obligatorio');
      return;
    }

    if (!formData.code.trim() && !editingType) {
      Alert.alert('Error', 'El código es obligatorio');
      return;
    }

    try {
      if (editingType) {
        // Actualizar
        await updateMutation.mutateAsync({
          id: editingType.id,
          data: {
            label: formData.label,
            description: formData.description,
            icon: formData.icon,
            color: formData.color,
            defaultTasks: formData.defaultTasks,
          },
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Éxito', 'Tipo de servicio actualizado');
      } else {
        // Crear
        const code = formData.code.trim().toLowerCase().replace(/\s+/g, '_');
        await createMutation.mutateAsync({
          code,
          label: formData.label,
          description: formData.description,
          icon: formData.icon,
          color: formData.color,
          defaultTasks: formData.defaultTasks,
          isActive: true,
          sortOrder: 50,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Éxito', 'Tipo de servicio creado');
      }
      
      refetch();
      setModalVisible(false);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al guardar');
    }
  };

  const handleDelete = (type: ServiceType) => {
    if (type.isDefault) {
      Alert.alert('Error', 'No se pueden eliminar los tipos de servicio por defecto');
      return;
    }

    Alert.alert(
      'Eliminar tipo de servicio',
      `¿Estás seguro de que quieres eliminar "${type.label}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync({ id: type.id });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              refetch();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el tipo de servicio');
            }
          },
        },
      ]
    );
  };

  const renderServiceType = (type: ServiceType) => (
    <View
      key={type.id}
      style={[
        styles.serviceTypeCard,
        { backgroundColor: cardBg, borderColor },
      ]}
    >
      <View style={styles.serviceTypeHeader}>
        <View style={[styles.iconContainer, { backgroundColor: `${type.color || accent}20` }]}>
          <IconSymbol
            name={type.icon as any || 'wrench.fill'}
            size={24}
            color={type.color || accent}
          />
        </View>
        <View style={styles.serviceTypeInfo}>
          <ThemedText style={styles.serviceTypeLabel}>{type.label}</ThemedText>
          {type.description && (
            <ThemedText style={[styles.serviceTypeDescription, { color: textSecondary }]}>
              {type.description}
            </ThemedText>
          )}
          {type.isDefault && (
            <View style={[styles.badge, { backgroundColor: `${accent}15` }]}>
              <ThemedText style={[styles.badgeText, { color: accent }]}>
                Por defecto
              </ThemedText>
            </View>
          )}
        </View>
      </View>

      {!type.isDefault && (
        <View style={styles.actions}>
          <Pressable
            style={[styles.actionButton, { borderColor }]}
            onPress={() => handleOpenModal(type)}
          >
            <IconSymbol name="pencil" size={18} color={accent} />
          </Pressable>
          <Pressable
            style={[styles.actionButton, { borderColor }]}
            onPress={() => handleDelete(type)}
          >
            <IconSymbol name="trash" size={18} color="#EF4444" />
          </Pressable>
        </View>
      )}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Tipos de Servicio',
          headerRight: () => (
            <Pressable onPress={() => handleOpenModal()} style={styles.addButton}>
              <IconSymbol name="plus.circle.fill" size={28} color={accent} />
            </Pressable>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Descripción */}
        <View style={[styles.infoCard, { backgroundColor: `${accent}10`, borderColor: accent }]}>
          <IconSymbol name="info.circle.fill" size={24} color={accent} />
          <ThemedText style={[styles.infoText, { color: textColor }]}>
            Aquí puedes gestionar los tipos de servicio disponibles. Los tipos por defecto no se pueden
            eliminar, pero puedes crear los tuyos propios.
          </ThemedText>
        </View>

        {/* Tipos por defecto */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Tipos por Defecto</ThemedText>
          {serviceTypes
            .filter((t) => t.isDefault)
            .map((type) => renderServiceType(type))}
        </View>

        {/* Tipos personalizados */}
        {serviceTypes.filter((t) => !t.isDefault).length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Tipos Personalizados</ThemedText>
            {serviceTypes
              .filter((t) => !t.isDefault)
              .map((type) => renderServiceType(type))}
          </View>
        )}

        {/* Mensaje si no hay tipos personalizados */}
        {serviceTypes.filter((t) => !t.isDefault).length === 0 && (
          <View style={[styles.emptyState, { borderColor }]}>
            <IconSymbol name="plus.circle" size={48} color={textSecondary} />
            <ThemedText style={[styles.emptyStateText, { color: textSecondary }]}>
              No has creado tipos de servicio personalizados
            </ThemedText>
            <Pressable
              style={[styles.createButton, { backgroundColor: accent }]}
              onPress={() => handleOpenModal()}
            >
              <ThemedText style={styles.createButtonText}>Crear Tipo de Servicio</ThemedText>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Modal de creación/edición */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <ThemedView style={[styles.modalContent, { backgroundColor: cardBg }]}>
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
              <ThemedText style={styles.modalTitle}>
                {editingType ? 'Editar Tipo de Servicio' : 'Nuevo Tipo de Servicio'}
              </ThemedText>
              <Pressable onPress={() => setModalVisible(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={textSecondary} />
              </Pressable>
            </View>

            {/* Form */}
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Código (solo para nuevos) */}
              {!editingType && (
                <View style={styles.formGroup}>
                  <ThemedText style={[styles.label, { color: textSecondary }]}>
                    Código *
                  </ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: cardBg, borderColor, color: textColor }]}
                    value={formData.code}
                    onChangeText={(text) => setFormData({ ...formData, code: text })}
                    placeholder="ej: entonacion"
                    placeholderTextColor={textSecondary}
                  />
                  <ThemedText style={[styles.hint, { color: textSecondary }]}>
                    Identificador único (sin espacios)
                  </ThemedText>
                </View>
              )}

              {/* Nombre */}
              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textSecondary }]}>
                  Nombre *
                </ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: cardBg, borderColor, color: textColor }]}
                  value={formData.label}
                  onChangeText={(text) => setFormData({ ...formData, label: text })}
                  placeholder="ej: Entonación"
                  placeholderTextColor={textSecondary}
                />
              </View>

              {/* Descripción */}
              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textSecondary }]}>
                  Descripción
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    { backgroundColor: cardBg, borderColor, color: textColor },
                  ]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Descripción opcional del tipo de servicio"
                  placeholderTextColor={textSecondary}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Color */}
              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: textSecondary }]}>
                  Color
                </ThemedText>
                <View style={styles.colorPicker}>
                  {['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#6B7280'].map((color) => (
                    <Pressable
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        formData.color === color && styles.colorOptionSelected,
                      ]}
                      onPress={() => setFormData({ ...formData, color })}
                    >
                      {formData.color === color && (
                        <IconSymbol name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={[styles.modalFooter, { borderTopColor: borderColor }]}>
              <Pressable
                style={[styles.button, styles.buttonSecondary, { borderColor }]}
                onPress={() => setModalVisible(false)}
              >
                <ThemedText style={[styles.buttonText, { color: textColor }]}>
                  Cancelar
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.button, styles.buttonPrimary, { backgroundColor: accent }]}
                onPress={handleSave}
              >
                <ThemedText style={[styles.buttonText, { color: '#FFFFFF' }]}>
                  {editingType ? 'Guardar' : 'Crear'}
                </ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        </View>
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
  },
  addButton: {
    marginRight: Spacing.sm,
  },

  // Info card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },

  // Sections
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },

  // Service type card
  serviceTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  serviceTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTypeInfo: {
    flex: 1,
    gap: 4,
  },
  serviceTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  serviceTypeDescription: {
    fontSize: 13,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginTop: Spacing.lg,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  createButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalBody: {
    padding: Spacing.md,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
    borderTopWidth: 1,
  },

  // Form
  formGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },

  // Color picker
  colorPicker: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },

  // Buttons
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: {
    borderWidth: 1,
  },
  buttonPrimary: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
