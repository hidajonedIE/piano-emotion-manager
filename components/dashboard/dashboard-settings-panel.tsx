/**
 * Panel de configuración del dashboard
 * Permite configurar el orden de secciones, visibilidad y posición del icono IA
 */
import { memo } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Switch, Modal } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';
import { 
  DashboardSection, 
  AIIconPosition,
  useDashboardPreferences 
} from '@/hooks/use-dashboard-preferences';

interface DashboardSettingsPanelProps {
  visible: boolean;
  onClose: () => void;
  preferences: ReturnType<typeof useDashboardPreferences>;
}

const AI_POSITIONS: { id: AIIconPosition; label: string; icon: string }[] = [
  { id: 'bottom-right', label: 'Abajo derecha', icon: 'arrow.down.right' },
  { id: 'bottom-left', label: 'Abajo izquierda', icon: 'arrow.down.left' },
  { id: 'bottom-center', label: 'Abajo centro', icon: 'arrow.down' },
  { id: 'top-right', label: 'Arriba derecha', icon: 'arrow.up.right' },
  { id: 'top-left', label: 'Arriba izquierda', icon: 'arrow.up.left' },
];

export const DashboardSettingsPanel = memo(function DashboardSettingsPanel({
  visible,
  onClose,
  preferences,
}: DashboardSettingsPanelProps) {
  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const accent = useThemeColor({}, 'accent');
  const textColor = useThemeColor({}, 'text');

  const {
    allSections,
    reorderSections,
    toggleSectionVisibility,
    setAIIconPosition,
    toggleAIIconVisibility,
    resetToDefaults,
  } = preferences;

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    reorderSections(index, newIndex);
  };

  const handleToggleVisibility = (sectionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleSectionVisibility(sectionId as any);
  };

  const handleSelectPosition = (position: AIIconPosition) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAIIconPosition(position);
  };

  const handleReset = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    resetToDefaults();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: cardBg }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <ThemedText style={styles.title}>Personalizar Dashboard</ThemedText>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <IconSymbol name="xmark" size={24} color={textColor} />
          </Pressable>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Sección: Orden de secciones */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Orden de Secciones</ThemedText>
            <ThemedText style={styles.sectionDescription}>
              Usa las flechas para reordenar o desactiva las que no necesites
            </ThemedText>

            {allSections.map((section, index) => (
              <View 
                key={section.id} 
                style={[styles.sectionItem, { borderColor }]}
              >
                <View style={styles.sectionItemLeft}>
                  <View style={styles.orderButtons}>
                    <Pressable
                      onPress={() => handleMoveSection(index, 'up')}
                      disabled={index === 0}
                      style={[styles.orderButton, index === 0 && styles.orderButtonDisabled]}
                    >
                      <IconSymbol 
                        name="chevron.up" 
                        size={16} 
                        color={index === 0 ? '#D1D5DB' : accent} 
                      />
                    </Pressable>
                    <Pressable
                      onPress={() => handleMoveSection(index, 'down')}
                      disabled={index === allSections.length - 1}
                      style={[styles.orderButton, index === allSections.length - 1 && styles.orderButtonDisabled]}
                    >
                      <IconSymbol 
                        name="chevron.down" 
                        size={16} 
                        color={index === allSections.length - 1 ? '#D1D5DB' : accent} 
                      />
                    </Pressable>
                  </View>
                  <ThemedText style={[styles.sectionItemTitle, !section.visible && styles.sectionItemTitleDisabled]}>
                    {section.title}
                  </ThemedText>
                </View>
                <Switch
                  value={section.visible}
                  onValueChange={() => handleToggleVisibility(section.id)}
                  trackColor={{ false: '#D1D5DB', true: accent }}
                  thumbColor="#FFFFFF"
                />
              </View>
            ))}
          </View>

          {/* Sección: Posición del icono IA */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Posición del Asistente IA</ThemedText>
            <ThemedText style={styles.sectionDescription}>
              Elige dónde mostrar el botón del asistente
            </ThemedText>

            <View style={styles.positionGrid}>
              {AI_POSITIONS.map((pos) => (
                <Pressable
                  key={pos.id}
                  onPress={() => handleSelectPosition(pos.id)}
                  style={[
                    styles.positionButton,
                    { borderColor },
                    preferences.preferences.aiIconPosition === pos.id && { 
                      borderColor: accent, 
                      backgroundColor: `${accent}15` 
                    },
                  ]}
                >
                  <IconSymbol 
                    name={pos.icon as any} 
                    size={20} 
                    color={preferences.preferences.aiIconPosition === pos.id ? accent : '#6B7280'} 
                  />
                  <ThemedText style={[
                    styles.positionLabel,
                    preferences.preferences.aiIconPosition === pos.id && { color: accent },
                  ]}>
                    {pos.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <View style={[styles.aiVisibilityRow, { borderColor }]}>
              <ThemedText>Mostrar asistente IA</ThemedText>
              <Switch
                value={preferences.preferences.aiIconVisible}
                onValueChange={toggleAIIconVisibility}
                trackColor={{ false: '#D1D5DB', true: accent }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Botón de reset */}
          <Pressable 
            onPress={handleReset} 
            style={[styles.resetButton, { borderColor }]}
          >
            <IconSymbol name="arrow.counterclockwise" size={18} color="#EF4444" />
            <ThemedText style={styles.resetButtonText}>
              Restaurar valores por defecto
            </ThemedText>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: Spacing.xs,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: Spacing.sm,
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  sectionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  orderButtons: {
    flexDirection: 'column',
    gap: 2,
  },
  orderButton: {
    padding: 2,
  },
  orderButtonDisabled: {
    opacity: 0.3,
  },
  sectionItemTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionItemTitleDisabled: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  positionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  positionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    minWidth: '48%',
  },
  positionLabel: {
    fontSize: 12,
  },
  aiVisibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  resetButtonText: {
    color: '#EF4444',
    fontWeight: '500',
  },
});
