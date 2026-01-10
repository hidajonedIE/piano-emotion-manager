'use client';

import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View, ViewStyle, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { Accordion } from '@/components/accordion';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';

interface HelpSection {
  id: string;
  title: string;
  icon: string;
  icon_color: string;
  display_order: number;
  content?: HelpItem[];
}

interface HelpItem {
  id?: number;
  question: string;
  answer: string;
  display_order?: number;
}

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const textSecondary = useThemeColor({}, 'textSecondary');
  const textTertiary = useThemeColor({}, 'textTertiary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'cardBackground');

  const [sections, setSections] = useState<HelpSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Cargar secciones y items desde la BD
  useEffect(() => {
    const loadHelpData = async () => {
      try {
        setLoading(true);

        // Obtener secciones
        const sectionsResponse = await fetch('/api/help/sections');
        const sectionsData = await sectionsResponse.json();

        if (!sectionsData.success) {
          throw new Error('Error loading sections');
        }

        // Obtener items para cada sección
        const itemsResponse = await fetch('/api/help/items');
        const itemsData = await itemsResponse.json();

        if (!itemsData.success) {
          throw new Error('Error loading items');
        }

        // Agrupar items por sección
        const itemsBySection = new Map<string, HelpItem[]>();
        itemsData.data.forEach((item: any) => {
          if (!itemsBySection.has(item.section_id)) {
            itemsBySection.set(item.section_id, []);
          }
          itemsBySection.get(item.section_id)!.push({
            id: item.id,
            question: item.question,
            answer: item.answer,
            display_order: item.display_order,
          });
        });

        // Combinar secciones con sus items
        const sectionsWithContent = sectionsData.data.map((section: any) => ({
          ...section,
          content: itemsBySection.get(section.id) || [],
        }));

        setSections(sectionsWithContent);
      } catch (error) {
        console.error('Error loading help data:', error);
        // Fallback a datos vacíos si hay error
        setSections([]);
      } finally {
        setLoading(false);
      }
    };

    loadHelpData();
  }, []);

  // Filtrar secciones y items según búsqueda
  const filteredSections = useMemo(() => {
    if (!searchText.trim()) {
      return sections;
    }

    const searchLower = searchText.toLowerCase();
    return sections
      .map((section) => ({
        ...section,
        content: section.content?.filter(
          (item) =>
            item.question.toLowerCase().includes(searchLower) ||
            item.answer.toLowerCase().includes(searchLower)
        ),
      }))
      .filter((section) => section.content && section.content.length > 0);
  }, [sections, searchText]);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor, paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor, paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
    >
      {/* Header */}
      <LinearGradient colors={['#3B82F6', '#1E40AF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <ThemedText style={styles.headerTitle}>¿Cómo podemos ayudarte?</ThemedText>
        <ThemedText style={styles.headerSubtitle}>Encuentra respuestas a tus preguntas</ThemedText>
      </LinearGradient>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { marginHorizontal: Spacing.md }]}>
        <IconSymbol name="magnifyingglass" size={20} color={textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: textSecondary }]}
          placeholder="Buscar en ayuda..."
          placeholderTextColor={textTertiary}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Help Sections */}
      <View style={{ marginHorizontal: Spacing.md, marginTop: Spacing.lg }}>
        {filteredSections.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="questionmark.circle.fill" size={48} color={textTertiary} />
            <ThemedText style={[styles.emptyStateText, { color: textSecondary }]}>
              No se encontraron resultados
            </ThemedText>
          </View>
        ) : (
          filteredSections.map((section) => (
            <View key={section.id} style={[styles.sectionContainer, { backgroundColor: cardBackground }]}>
              <Pressable
                style={styles.sectionHeader}
                onPress={() => toggleSection(section.id)}
              >
                <View style={styles.sectionTitleContainer}>
                  <View
                    style={[
                      styles.sectionIconContainer,
                      { backgroundColor: section.icon_color + '20' },
                    ]}
                  >
                    <IconSymbol
                      name={section.icon}
                      size={24}
                      color={section.icon_color}
                    />
                  </View>
                  <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
                </View>
                <IconSymbol
                  name={expandedSections.has(section.id) ? 'chevron.up' : 'chevron.down'}
                  size={20}
                  color={textTertiary}
                />
              </Pressable>

              {expandedSections.has(section.id) && section.content && (
                <View style={styles.sectionContent}>
                  {section.content.map((item, index) => (
                    <Accordion
                      key={item.id || index}
                      title={item.question}
                    >
                      <ThemedText>{item.answer}</ThemedText>
                    </Accordion>
                  ))
                </View>
              )}
            </View>
          ))
        )}
      </View>

      {/* Footer */}
      <View style={[styles.footer, { marginHorizontal: Spacing.md, marginTop: Spacing.xl }]}>
        <ThemedText style={[styles.footerTitle, { color: textSecondary }]}>
          ¿Aún necesitas ayuda?
        </ThemedText>
        <ThemedText style={[styles.footerText, { color: textTertiary }]}>
          Contacta con nuestro equipo de soporte para más información
        </ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E0E7FF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.md,
    fontSize: 16,
    padding: 0,
  },
  sectionContainer: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  sectionContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyStateText: {
    marginTop: Spacing.md,
    fontSize: 16,
  },
  footer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  footerText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
