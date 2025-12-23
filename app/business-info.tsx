import { useRouter, Stack } from 'expo-router';
import { useState, useEffect } from 'react';
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
import { useBusinessInfo } from '@/hooks/use-invoices';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';
import { BusinessInfo } from '@/types/invoice';

export default function BusinessInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { businessInfo, saveBusinessInfo, loading } = useBusinessInfo();

  const [form, setForm] = useState<BusinessInfo>({
    name: '',
    taxId: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    email: '',
    bankAccount: '',
  });

  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const accent = useThemeColor({}, 'accent');
  const textColor = useThemeColor({}, 'text');
  const success = useThemeColor({}, 'success');

  useEffect(() => {
    if (businessInfo) {
      setForm(businessInfo);
    }
  }, [businessInfo]);

  const handleSave = async () => {
    if (!form.name?.trim()) {
      Alert.alert('Error', 'El nombre de la empresa/autónomo es obligatorio');
      return;
    }

    await saveBusinessInfo(form);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Guardado', 'Los datos fiscales se han guardado correctamente');
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Datos Fiscales' }} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.infoBox, { backgroundColor: `${accent}10`, borderColor: accent }]}>
          <IconSymbol name="info.circle.fill" size={20} color={accent} />
          <ThemedText style={[styles.infoText, { color: textSecondary }]}>
            Estos datos aparecerán en las facturas que generes. Asegúrate de que sean correctos para cumplir con las obligaciones fiscales.
          </ThemedText>
        </View>

        {/* Datos de la empresa */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>Datos de la empresa/autónomo</ThemedText>

          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: textSecondary }]}>Nombre o razón social *</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: cardBg, borderColor, color: textColor }]}
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
              placeholder="Ej: Juan García - Técnico de Pianos"
              placeholderTextColor={textSecondary}
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: textSecondary }]}>NIF/CIF</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: cardBg, borderColor, color: textColor }]}
              value={form.taxId}
              onChangeText={(text) => setForm({ ...form, taxId: text.toUpperCase() })}
              placeholder="12345678A"
              placeholderTextColor={textSecondary}
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* Dirección */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>Dirección fiscal</ThemedText>

          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: textSecondary }]}>Dirección</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: cardBg, borderColor, color: textColor }]}
              value={form.address}
              onChangeText={(text) => setForm({ ...form, address: text })}
              placeholder="Calle, número, piso..."
              placeholderTextColor={textSecondary}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <ThemedText style={[styles.label, { color: textSecondary }]}>Código postal</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: cardBg, borderColor, color: textColor }]}
                value={form.postalCode}
                onChangeText={(text) => setForm({ ...form, postalCode: text })}
                placeholder="28001"
                placeholderTextColor={textSecondary}
                keyboardType="number-pad"
              />
            </View>
            <View style={[styles.field, { flex: 2 }]}>
              <ThemedText style={[styles.label, { color: textSecondary }]}>Ciudad</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: cardBg, borderColor, color: textColor }]}
                value={form.city}
                onChangeText={(text) => setForm({ ...form, city: text })}
                placeholder="Madrid"
                placeholderTextColor={textSecondary}
              />
            </View>
          </View>
        </View>

        {/* Contacto */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>Datos de contacto</ThemedText>

          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: textSecondary }]}>Teléfono</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: cardBg, borderColor, color: textColor }]}
              value={form.phone}
              onChangeText={(text) => setForm({ ...form, phone: text })}
              placeholder="+34 600 000 000"
              placeholderTextColor={textSecondary}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: textSecondary }]}>Email</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: cardBg, borderColor, color: textColor }]}
              value={form.email}
              onChangeText={(text) => setForm({ ...form, email: text.toLowerCase() })}
              placeholder="correo@ejemplo.com"
              placeholderTextColor={textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Datos bancarios */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>Datos bancarios</ThemedText>

          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: textSecondary }]}>IBAN</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: cardBg, borderColor, color: textColor }]}
              value={form.bankAccount}
              onChangeText={(text) => setForm({ ...form, bankAccount: text.toUpperCase().replace(/\s/g, '') })}
              placeholder="ES00 0000 0000 0000 0000 0000"
              placeholderTextColor={textSecondary}
              autoCapitalize="characters"
            />
            <ThemedText style={[styles.hint, { color: textSecondary }]}>
              Se mostrará en las facturas para facilitar el pago por transferencia
            </ThemedText>
          </View>
        </View>

        {/* Botón guardar */}
        <Pressable style={[styles.saveButton, { backgroundColor: accent }]} onPress={handleSave}>
          <IconSymbol name="checkmark" size={20} color="#FFFFFF" />
          <ThemedText style={styles.saveButtonText}>Guardar datos fiscales</ThemedText>
        </Pressable>
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
  infoBox: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  field: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
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
  hint: {
    fontSize: 12,
    marginTop: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
