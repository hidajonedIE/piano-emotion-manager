import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Image,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

import { ServiceCard } from '@/components/cards';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useClients, usePianos, useServices } from '@/hooks/use-storage';
import { useRecommendations } from '@/hooks/use-recommendations';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';
import {
  Piano,
  PianoCategory,
  PianoType,
  PianoCondition,
  PIANO_CATEGORY_LABELS,
  PIANO_CONDITION_LABELS,
  PIANO_CONDITION_COLORS,
  getPianoTypesForCategory,
  getPianoTypeLabel,
  getClientFullName,
} from '@/types';

export default function PianoDetailScreen() {
  const { id, clientId: initialClientId } = useLocalSearchParams<{ id: string; clientId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isNew = id === 'new';

  const { clients, getClient } = useClients();
  const { pianos, addPiano, updatePiano, deletePiano, getPiano } = usePianos();
  const { services, getServicesByPiano } = useServices();
  const { getRecommendationsForPiano } = useRecommendations(pianos, services);

  const [isEditing, setIsEditing] = useState(isNew);
  const [form, setForm] = useState<Partial<Piano>>({
    clientId: initialClientId || '',
    brand: '',
    model: '',
    serialNumber: '',
    year: undefined,
    category: 'vertical',
    type: 'console',
    size: undefined,
    condition: 'unknown',
    photo: '',
    notes: '',
  });

  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const accent = useThemeColor({}, 'accent');
  const error = useThemeColor({}, 'error');
  const textColor = useThemeColor({}, 'text');

  // Cargar datos del piano existente
  useEffect(() => {
    if (!isNew && id) {
      const piano = getPiano(id);
      if (piano) {
        setForm(piano);
      }
    }
  }, [id, isNew, pianos]);

  // Actualizar tipo cuando cambia la categoría
  useEffect(() => {
    if (isEditing) {
      const types = getPianoTypesForCategory(form.category || 'vertical');
      if (types.length > 0 && !types.find(t => t.key === form.type)) {
        setForm(prev => ({ ...prev, type: types[0].key }));
      }
    }
  }, [form.category, isEditing]);

  const pianoServices = !isNew && id ? getServicesByPiano(id) : [];
  const recommendations = !isNew && id ? getRecommendationsForPiano(id) : [];
  const client = form.clientId ? getClient(form.clientId) : null;

  const handleSave = async () => {
    if (!form.clientId) {
      Alert.alert('Error', 'Debes seleccionar un cliente');
      return;
    }
    if (!form.brand?.trim()) {
      Alert.alert('Error', 'La marca es obligatoria');
      return;
    }
    if (!form.model?.trim()) {
      Alert.alert('Error', 'El modelo es obligatorio');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (isNew) {
      const newPiano = await addPiano({
        clientId: form.clientId,
        brand: form.brand.trim(),
        model: form.model.trim(),
        serialNumber: form.serialNumber?.trim(),
        year: form.year,
        category: form.category || 'vertical',
        type: form.type || 'console',
        size: form.size,
        condition: form.condition || 'unknown',
        photo: form.photo,
        notes: form.notes?.trim(),
      });
      router.replace({
        pathname: '/piano/[id]',
        params: { id: newPiano.id },
      });
    } else if (id) {
      await updatePiano(id, form);
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar piano',
      '¿Estás seguro de que quieres eliminar este piano? Se perderá todo el historial de servicios asociado.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await deletePiano(id!);
            router.back();
          },
        },
      ]
    );
  };

  const handleAddService = () => {
    router.push({
      pathname: '/service/[id]' as any,
      params: { id: 'new', pianoId: id, clientId: form.clientId },
    });
  };

  const pickImage = async (useCamera: boolean) => {
    try {
      let result;
      if (useCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permiso denegado', 'Necesitas permitir el acceso a la cámara');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permiso denegado', 'Necesitas permitir el acceso a la galería');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      }
      if (!result.canceled && result.assets[0]) {
        setForm({ ...form, photo: result.assets[0].uri });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const showImageOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancelar', 'Tomar foto', 'Elegir de galería', 'Eliminar foto'],
          destructiveButtonIndex: 3,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) pickImage(true);
          else if (buttonIndex === 2) pickImage(false);
          else if (buttonIndex === 3) setForm({ ...form, photo: '' });
        }
      );
    } else {
      Alert.alert(
        'Foto del piano',
        'Selecciona una opción',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Tomar foto', onPress: () => pickImage(true) },
          { text: 'Elegir de galería', onPress: () => pickImage(false) },
          ...(form.photo ? [{ text: 'Eliminar foto', style: 'destructive' as const, onPress: () => setForm({ ...form, photo: '' }) }] : []),
        ]
      );
    }
  };

  const handleServicePress = (serviceId: string) => {
    router.push({
      pathname: '/service/[id]' as any,
      params: { id: serviceId },
    });
  };

  const conditionColor = PIANO_CONDITION_COLORS[form.condition || 'unknown'];
  const pianoTypes = getPianoTypesForCategory(form.category || 'vertical');

  const renderInput = (
    label: string,
    key: keyof Piano,
    placeholder: string,
    options?: { keyboardType?: 'default' | 'numeric'; multiline?: boolean }
  ) => (
    <View style={styles.inputGroup}>
      <ThemedText style={[styles.label, { color: textSecondary }]}>{label}</ThemedText>
      {isEditing ? (
        <TextInput
          style={[
            styles.input,
            { backgroundColor: cardBg, borderColor, color: textColor },
            options?.multiline && styles.inputMultiline,
          ]}
          value={form[key]?.toString() || ''}
          onChangeText={(text) => {
            if (options?.keyboardType === 'numeric') {
              setForm({ ...form, [key]: text ? parseInt(text, 10) : undefined });
            } else {
              setForm({ ...form, [key]: text });
            }
          }}
          placeholder={placeholder}
          placeholderTextColor={textSecondary}
          keyboardType={options?.keyboardType}
          multiline={options?.multiline}
          numberOfLines={options?.multiline ? 3 : 1}
        />
      ) : (
        <ThemedText style={styles.value}>{form[key]?.toString() || '-'}</ThemedText>
      )}
    </View>
  );

  const renderClientSelector = () => (
    <View style={styles.inputGroup}>
      <ThemedText style={[styles.label, { color: textSecondary }]}>Cliente *</ThemedText>
      {isEditing ? (
        clients.length === 0 ? (
          <View style={[styles.emptyClientState, { backgroundColor: cardBg, borderColor }]}>
            <ThemedText style={[styles.emptyClientText, { color: textSecondary }]}>
              No hay clientes registrados
            </ThemedText>
            <Pressable
              style={[styles.createClientButton, { backgroundColor: accent }]}
              onPress={() => router.push('/client/new')}
            >
              <ThemedText style={styles.createClientButtonText}>+ Crear cliente</ThemedText>
            </Pressable>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            <View style={styles.clientSelector}>
              {clients.map((c) => (
                <Pressable
                  key={c.id}
                  style={[
                    styles.clientOption,
                    { backgroundColor: cardBg, borderColor },
                    form.clientId === c.id && { backgroundColor: accent, borderColor: accent },
                  ]}
                  onPress={() => setForm({ ...form, clientId: c.id })}
                >
                  <ThemedText
                    style={[
                      styles.clientText,
                      { color: form.clientId === c.id ? '#FFFFFF' : textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {getClientFullName(c)}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )
      ) : (
        <ThemedText style={styles.value}>{client ? getClientFullName(client) : '-'}</ThemedText>
      )}
    </View>
  );

  const renderCategorySelector = () => (
    <View style={styles.inputGroup}>
      <ThemedText style={[styles.label, { color: textSecondary }]}>Categoría</ThemedText>
      {isEditing ? (
        <View style={styles.selectorRow}>
          {(['vertical', 'grand'] as PianoCategory[]).map((cat) => (
            <Pressable
              key={cat}
              style={[
                styles.selectorOption,
                { backgroundColor: cardBg, borderColor },
                form.category === cat && { backgroundColor: accent, borderColor: accent },
              ]}
              onPress={() => setForm({ ...form, category: cat })}
            >
              <ThemedText
                style={[
                  styles.selectorText,
                  { color: form.category === cat ? '#FFFFFF' : textSecondary },
                ]}
              >
                {PIANO_CATEGORY_LABELS[cat]}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      ) : (
        <ThemedText style={styles.value}>
          {PIANO_CATEGORY_LABELS[form.category || 'vertical']}
        </ThemedText>
      )}
    </View>
  );

  const renderTypeSelector = () => (
    <View style={styles.inputGroup}>
      <ThemedText style={[styles.label, { color: textSecondary }]}>
        Tipo ({form.category === 'vertical' ? 'por altura' : 'por longitud'})
      </ThemedText>
      {isEditing ? (
        <View style={styles.typeGrid}>
          {pianoTypes.map((pt) => (
            <Pressable
              key={pt.key}
              style={[
                styles.typeOption,
                { backgroundColor: cardBg, borderColor },
                form.type === pt.key && { backgroundColor: accent, borderColor: accent },
              ]}
              onPress={() => setForm({ ...form, type: pt.key })}
            >
              <ThemedText
                style={[
                  styles.typeLabel,
                  { color: form.type === pt.key ? '#FFFFFF' : textColor },
                ]}
              >
                {pt.label}
              </ThemedText>
              <ThemedText
                style={[
                  styles.typeDesc,
                  { color: form.type === pt.key ? '#FFFFFF' : textSecondary },
                ]}
              >
                {pt.description}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      ) : (
        <ThemedText style={styles.value}>
          {getPianoTypeLabel(form.type || 'console')}
        </ThemedText>
      )}
    </View>
  );

  const renderConditionSelector = () => (
    <View style={styles.inputGroup}>
      <ThemedText style={[styles.label, { color: textSecondary }]}>Estado</ThemedText>
      {isEditing ? (
        <View style={styles.selectorRow}>
          {(['tunable', 'needs_repair', 'unknown'] as PianoCondition[]).map((cond) => {
            const color = PIANO_CONDITION_COLORS[cond];
            return (
              <Pressable
                key={cond}
                style={[
                  styles.conditionOption,
                  { backgroundColor: `${color}15`, borderColor: color },
                  form.condition === cond && { backgroundColor: color },
                ]}
                onPress={() => setForm({ ...form, condition: cond })}
              >
                <ThemedText
                  style={[
                    styles.conditionOptionText,
                    { color: form.condition === cond ? '#FFFFFF' : color },
                  ]}
                >
                  {PIANO_CONDITION_LABELS[cond]}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <ThemedText style={styles.value}>
          {PIANO_CONDITION_LABELS[form.condition || 'unknown']}
        </ThemedText>
      )}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: isNew ? 'Nuevo Piano' : `${form.brand} ${form.model}`,
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
        {/* Estado del piano */}
        {!isNew && (
          <View style={[styles.conditionBanner, { backgroundColor: `${conditionColor}15`, borderColor: conditionColor }]}>
            <View style={[styles.conditionDot, { backgroundColor: conditionColor }]} />
            <ThemedText style={[styles.conditionText, { color: conditionColor }]}>
              {PIANO_CONDITION_LABELS[form.condition || 'unknown']}
            </ThemedText>
          </View>
        )}

        {/* Información del piano */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          {renderClientSelector()}
          {renderInput('Marca *', 'brand', 'Ej: Yamaha, Steinway...')}
          {renderInput('Modelo *', 'model', 'Ej: U1, Model D...')}
          {renderInput('Número de serie', 'serialNumber', 'Número de serie')}
          {renderInput('Año de fabricación', 'year', 'Ej: 2015', { keyboardType: 'numeric' })}
          {renderCategorySelector()}
          {renderTypeSelector()}
          {renderInput(
            form.category === 'vertical' ? 'Altura (cm)' : 'Longitud (cm)',
            'size',
            form.category === 'vertical' ? 'Ej: 121' : 'Ej: 180',
            { keyboardType: 'numeric' }
          )}
          {isEditing && renderConditionSelector()}

          {/* Foto del piano */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: textSecondary }]}>Foto del piano</ThemedText>
            {form.photo ? (
              <Pressable onPress={isEditing ? showImageOptions : undefined} style={styles.photoContainer}>
                <Image source={{ uri: form.photo }} style={styles.pianoPhoto} resizeMode="cover" />
                {isEditing && (
                  <View style={styles.photoOverlay}>
                    <IconSymbol name="camera.fill" size={24} color="#FFFFFF" />
                    <ThemedText style={styles.photoOverlayText}>Cambiar foto</ThemedText>
                  </View>
                )}
              </Pressable>
            ) : isEditing ? (
              <Pressable
                onPress={showImageOptions}
                style={[styles.addPhotoButton, { borderColor, backgroundColor: cardBg }]}
              >
                <IconSymbol name="camera.fill" size={32} color={textSecondary} />
                <ThemedText style={[styles.addPhotoText, { color: textSecondary }]}>Añadir foto</ThemedText>
              </Pressable>
            ) : (
              <ThemedText style={{ color: textSecondary }}>Sin foto</ThemedText>
            )}
          </View>

          {renderInput('Notas', 'notes', 'Notas adicionales...', { multiline: true })}
        </View>

        {/* Recomendaciones */}
        {!isNew && recommendations.length > 0 && (
          <View style={styles.recommendationsSection}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Recomendaciones</ThemedText>
            {recommendations.map((rec, index) => (
              <View
                key={index}
                style={[
                  styles.recommendationCard,
                  {
                    backgroundColor: rec.priority === 'urgent' ? '#FEE2E2' : rec.priority === 'pending' ? '#FEF3C7' : '#D1FAE5',
                    borderColor: rec.priority === 'urgent' ? '#EF4444' : rec.priority === 'pending' ? '#F59E0B' : '#10B981',
                  },
                ]}
              >
                <IconSymbol
                  name={rec.priority === 'urgent' ? 'exclamationmark.triangle.fill' : 'info.circle.fill'}
                  size={20}
                  color={rec.priority === 'urgent' ? '#EF4444' : rec.priority === 'pending' ? '#F59E0B' : '#10B981'}
                />
                <ThemedText style={styles.recommendationText}>{rec.message}</ThemedText>
              </View>
            ))}
          </View>
        )}

        {/* Historial de servicios */}
        {!isNew && (
          <View style={styles.servicesSection}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle">Historial de Servicios</ThemedText>
              <Pressable onPress={handleAddService}>
                <IconSymbol name="plus.circle.fill" size={28} color={accent} />
              </Pressable>
            </View>

            {pianoServices.length === 0 ? (
              <View style={[styles.emptyServices, { backgroundColor: cardBg, borderColor }]}>
                <ThemedText style={{ color: textSecondary, textAlign: 'center' }}>
                  No hay servicios registrados para este piano.
                </ThemedText>
              </View>
            ) : (
              pianoServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onPress={() => handleServicePress(service.id)}
                />
              ))
            )}
          </View>
        )}

        {/* Botones de acción */}
        {isEditing && (
          <Pressable style={[styles.saveButton, { backgroundColor: accent }]} onPress={handleSave}>
            <ThemedText style={styles.saveButtonText}>
              {isNew ? 'Crear Piano' : 'Guardar Cambios'}
            </ThemedText>
          </Pressable>
        )}

        {!isNew && !isEditing && (
          <Pressable style={[styles.deleteButton, { borderColor: error }]} onPress={handleDelete}>
            <IconSymbol name="trash.fill" size={20} color={error} />
            <ThemedText style={[styles.deleteButtonText, { color: error }]}>
              Eliminar Piano
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
  },
  conditionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  conditionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  conditionText: {
    fontWeight: '600',
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  value: {
    fontSize: 16,
    paddingVertical: 4,
  },
  horizontalScroll: {
    marginHorizontal: -Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  clientSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingRight: Spacing.md,
  },
  clientOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  clientText: {
    fontSize: 14,
  },
  emptyClientState: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyClientText: {
    fontSize: 14,
    textAlign: 'center',
  },
  createClientButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  createClientButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  selectorRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  selectorOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  selectorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  typeGrid: {
    gap: Spacing.sm,
  },
  typeOption: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  typeLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  typeDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  conditionOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  conditionOptionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  recommendationsSection: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  recommendationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  servicesSection: {
    marginTop: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptyServices: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  saveButton: {
    marginTop: Spacing.lg,
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
    marginTop: Spacing.lg,
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
  photoContainer: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  pianoPhoto: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  photoOverlayText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  addPhotoButton: {
    width: '100%',
    height: 150,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  addPhotoText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
