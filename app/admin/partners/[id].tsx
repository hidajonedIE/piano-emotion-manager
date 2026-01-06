/**
 * Pantalla de Detalles y Edición de Partner
 * 
 * Permite ver y editar la información de un partner,
 * incluyendo configuración, branding y estadísticas.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { useSnackbar } from '@/components/snackbar';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';
import { trpc } from '@/utils/trpc';
import { useLanguage } from '@/contexts/language-context';

interface PartnerForm {
  name: string;
  slug: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended';
  defaultLanguage: string;
  customDomain?: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  brandName?: string;
}

const SUPPORTED_LANGUAGES = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
  { code: 'pt', name: 'Português' },
  { code: 'it', name: 'Italiano' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'da', name: 'Dansk' },
];

export default function PartnerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { success: showSuccess, error: showError } = useSnackbar();

  const isNew = id === 'new';
  const [isEditing, setIsEditing] = useState(isNew);
  const [form, setForm] = useState<PartnerForm>({
    name: '',
    slug: '',
    email: '',
    status: 'active',
    defaultLanguage: 'es',
    customDomain: '',
    logo: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#10b981',
    brandName: '',
  });

  // Colores del tema
  const backgroundColor = useThemeColor({}, 'background');
  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const accent = useThemeColor({}, 'accent');
  const textColor = useThemeColor({}, 'text');
  const error = useThemeColor({}, 'error');

  // Queries
  const { data: partner, isLoading } = trpc.partners.getById.useQuery(
    { id: parseInt(id) },
    { enabled: !isNew && !!id }
  );

  const { data: stats } = trpc.partners.getStats.useQuery(
    { partnerId: parseInt(id) },
    { enabled: !isNew && !!id }
  );

  // Mutations
  const createMutation = trpc.partners.create.useMutation();
  const updateMutation = trpc.partners.update.useMutation();
  const updateStatusMutation = trpc.partners.updateStatus.useMutation();

  // Cargar datos del partner
  useEffect(() => {
    if (partner && !isNew) {
      setForm({
        name: partner.name,
        slug: partner.slug,
        email: partner.email,
        status: partner.status as 'active' | 'inactive' | 'suspended',
        defaultLanguage: partner.defaultLanguage || 'es',
        customDomain: partner.customDomain || '',
        logo: partner.logo || '',
        primaryColor: partner.primaryColor || '#3b82f6',
        secondaryColor: partner.secondaryColor || '#10b981',
        brandName: partner.brandName || '',
      });
    }
  }, [partner, isNew]);

  // Validar formulario
  const validateForm = (): boolean => {
    if (!form.name.trim()) {
      showError(t('partners.form.errors.nameRequired'));
      return false;
    }
    if (!form.slug.trim()) {
      showError(t('partners.form.errors.slugRequired'));
      return false;
    }
    if (!form.email.trim()) {
      showError(t('partners.form.errors.emailRequired'));
      return false;
    }
    if (!/^[a-z0-9-]+$/.test(form.slug)) {
      showError(t('partners.form.errors.slugInvalid'));
      return false;
    }
    return true;
  };

  // Guardar partner
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (isNew) {
        await createMutation.mutateAsync(form);
        showSuccess(t('partners.created'));
        router.back();
      } else {
        await updateMutation.mutateAsync({
          id: parseInt(id),
          ...form,
        });
        showSuccess(t('partners.updated'));
        setIsEditing(false);
      }
    } catch (err: any) {
      showError(err.message || t('partners.form.errors.saveFailed'));
    }
  };

  // Cambiar estado del partner
  const handleStatusChange = async (newStatus: 'active' | 'inactive' | 'suspended') => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await updateStatusMutation.mutateAsync({
        id: parseInt(id),
        status: newStatus,
      });
      setForm({ ...form, status: newStatus });
      showSuccess(t('partners.statusUpdated'));
    } catch (err: any) {
      showError(err.message || t('partners.form.errors.statusFailed'));
    }
  };

  // Confirmar cambio de estado
  const confirmStatusChange = (newStatus: 'active' | 'inactive' | 'suspended') => {
    Alert.alert(
      t('partners.confirmStatusChange.title'),
      t('partners.confirmStatusChange.message', { status: newStatus }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.confirm'), onPress: () => handleStatusChange(newStatus) },
      ]
    );
  };

  if (isLoading && !isNew) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={accent} />
          <ThemedText style={[styles.loadingText, { color: textSecondary }]}>
            {t('partners.loading')}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Breadcrumbs
          items={[
            { label: t('partners.title'), onPress: () => router.back() },
            { label: isNew ? t('partners.new') : form.name, onPress: () => {} },
          ]}
        />
        <View style={styles.headerActions}>
          <Pressable
            style={[styles.headerButton, { borderColor }]}
            onPress={() => router.back()}
          >
            <IconSymbol name="xmark" size={20} color={textColor} />
          </Pressable>
          {!isNew && !isEditing && (
            <Pressable
              style={[styles.headerButton, { borderColor }]}
              onPress={() => setIsEditing(true)}
            >
              <IconSymbol name="pencil" size={20} color={accent} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Información básica */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>{t('partners.sections.basic')}</ThemedText>

          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: textSecondary }]}>
              {t('partners.form.name')}
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                { backgroundColor, borderColor, color: textColor },
                !isEditing && styles.inputDisabled,
              ]}
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
              editable={isEditing}
              placeholder={t('partners.form.namePlaceholder')}
              placeholderTextColor={textSecondary}
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: textSecondary }]}>
              {t('partners.form.slug')}
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                { backgroundColor, borderColor, color: textColor },
                !isEditing && styles.inputDisabled,
              ]}
              value={form.slug}
              onChangeText={(text) => setForm({ ...form, slug: text.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
              editable={isEditing}
              placeholder={t('partners.form.slugPlaceholder')}
              placeholderTextColor={textSecondary}
              autoCapitalize="none"
            />
            <ThemedText style={[styles.hint, { color: textSecondary }]}>
              {t('partners.form.slugHint')}
            </ThemedText>
          </View>

          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: textSecondary }]}>
              {t('partners.form.email')}
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                { backgroundColor, borderColor, color: textColor },
                !isEditing && styles.inputDisabled,
              ]}
              value={form.email}
              onChangeText={(text) => setForm({ ...form, email: text })}
              editable={isEditing}
              placeholder={t('partners.form.emailPlaceholder')}
              placeholderTextColor={textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: textSecondary }]}>
              {t('partners.form.defaultLanguage')}
            </ThemedText>
            <View style={styles.languageButtons}>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <Pressable
                  key={lang.code}
                  style={[
                    styles.languageButton,
                    {
                      backgroundColor: form.defaultLanguage === lang.code ? accent : 'transparent',
                      borderColor: form.defaultLanguage === lang.code ? accent : borderColor,
                    },
                  ]}
                  onPress={() => isEditing && setForm({ ...form, defaultLanguage: lang.code })}
                  disabled={!isEditing}
                >
                  <ThemedText
                    style={[
                      styles.languageButtonText,
                      { color: form.defaultLanguage === lang.code ? '#fff' : textColor },
                    ]}
                  >
                    {lang.name}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Branding */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>{t('partners.sections.branding')}</ThemedText>

          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: textSecondary }]}>
              {t('partners.form.brandName')}
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                { backgroundColor, borderColor, color: textColor },
                !isEditing && styles.inputDisabled,
              ]}
              value={form.brandName}
              onChangeText={(text) => setForm({ ...form, brandName: text })}
              editable={isEditing}
              placeholder={t('partners.form.brandNamePlaceholder')}
              placeholderTextColor={textSecondary}
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: textSecondary }]}>
              {t('partners.form.customDomain')}
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                { backgroundColor, borderColor, color: textColor },
                !isEditing && styles.inputDisabled,
              ]}
              value={form.customDomain}
              onChangeText={(text) => setForm({ ...form, customDomain: text })}
              editable={isEditing}
              placeholder={t('partners.form.customDomainPlaceholder')}
              placeholderTextColor={textSecondary}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.colorRow}>
            <View style={[styles.field, { flex: 1 }]}>
              <ThemedText style={[styles.label, { color: textSecondary }]}>
                {t('partners.form.primaryColor')}
              </ThemedText>
              <View style={styles.colorInputContainer}>
                <View style={[styles.colorPreview, { backgroundColor: form.primaryColor }]} />
                <TextInput
                  style={[
                    styles.colorInput,
                    { backgroundColor, borderColor, color: textColor },
                    !isEditing && styles.inputDisabled,
                  ]}
                  value={form.primaryColor}
                  onChangeText={(text) => setForm({ ...form, primaryColor: text })}
                  editable={isEditing}
                  placeholder="#3b82f6"
                  placeholderTextColor={textSecondary}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={[styles.field, { flex: 1 }]}>
              <ThemedText style={[styles.label, { color: textSecondary }]}>
                {t('partners.form.secondaryColor')}
              </ThemedText>
              <View style={styles.colorInputContainer}>
                <View style={[styles.colorPreview, { backgroundColor: form.secondaryColor }]} />
                <TextInput
                  style={[
                    styles.colorInput,
                    { backgroundColor, borderColor, color: textColor },
                    !isEditing && styles.inputDisabled,
                  ]}
                  value={form.secondaryColor}
                  onChangeText={(text) => setForm({ ...form, secondaryColor: text })}
                  editable={isEditing}
                  placeholder="#10b981"
                  placeholderTextColor={textSecondary}
                  autoCapitalize="none"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Estado */}
        {!isNew && (
          <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
            <ThemedText style={styles.sectionTitle}>{t('partners.sections.status')}</ThemedText>

            <View style={styles.statusButtons}>
              {['active', 'inactive', 'suspended'].map((status) => (
                <Pressable
                  key={status}
                  style={[
                    styles.statusButton,
                    {
                      backgroundColor: form.status === status ? accent : 'transparent',
                      borderColor: form.status === status ? accent : borderColor,
                    },
                  ]}
                  onPress={() => confirmStatusChange(status as typeof form.status)}
                >
                  <ThemedText
                    style={[
                      styles.statusButtonText,
                      { color: form.status === status ? '#fff' : textColor },
                    ]}
                  >
                    {t(`partners.status.${status}`)}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Estadísticas */}
        {!isNew && stats && (
          <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
            <ThemedText style={styles.sectionTitle}>{t('partners.sections.stats')}</ThemedText>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <IconSymbol name="person.2" size={24} color={accent} />
                <ThemedText style={[styles.statValue, { color: accent }]}>
                  {stats.totalUsers || 0}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: textSecondary }]}>
                  {t('partners.stats.users')}
                </ThemedText>
              </View>

              <View style={styles.statCard}>
                <IconSymbol name="person.3" size={24} color={accent} />
                <ThemedText style={[styles.statValue, { color: accent }]}>
                  {stats.totalClients || 0}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: textSecondary }]}>
                  {t('partners.stats.clients')}
                </ThemedText>
              </View>

              <View style={styles.statCard}>
                <IconSymbol name="pianokeys" size={24} color={accent} />
                <ThemedText style={[styles.statValue, { color: accent }]}>
                  {stats.totalPianos || 0}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: textSecondary }]}>
                  {t('partners.stats.pianos')}
                </ThemedText>
              </View>

              <View style={styles.statCard}>
                <IconSymbol name="wrench.and.screwdriver" size={24} color={accent} />
                <ThemedText style={[styles.statValue, { color: accent }]}>
                  {stats.totalServices || 0}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: textSecondary }]}>
                  {t('partners.stats.services')}
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Botones de acción */}
        {isEditing && (
          <View style={styles.actions}>
            {!isNew && (
              <Pressable
                style={[styles.button, styles.buttonSecondary, { borderColor }]}
                onPress={() => {
                  setIsEditing(false);
                  if (partner) {
                    setForm({
                      name: partner.name,
                      slug: partner.slug,
                      email: partner.email,
                      status: partner.status as typeof form.status,
                      defaultLanguage: partner.defaultLanguage || 'es',
                      customDomain: partner.customDomain || '',
                      logo: partner.logo || '',
                      primaryColor: partner.primaryColor || '#3b82f6',
                      secondaryColor: partner.secondaryColor || '#10b981',
                      brandName: partner.brandName || '',
                    });
                  }
                }}
              >
                <ThemedText style={[styles.buttonText, { color: textColor }]}>
                  {t('common.cancel')}
                </ThemedText>
              </Pressable>
            )}
            <Pressable
              style={[styles.button, styles.buttonPrimary, { backgroundColor: accent }]}
              onPress={handleSave}
              disabled={createMutation.isLoading || updateMutation.isLoading}
            >
              {(createMutation.isLoading || updateMutation.isLoading) ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={[styles.buttonText, { color: '#fff' }]}>
                  {t('common.save')}
                </ThemedText>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 14,
  },
  section: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  field: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
  },
  languageButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  languageButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  languageButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  colorRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  colorInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  colorPreview: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
  },
  colorInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 14,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statusButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {},
  buttonSecondary: {
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
