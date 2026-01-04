'use client';

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

interface HelpItem {
  id: string;
  section_id: string;
  question: string;
  answer: string;
  order: number;
}

interface HelpSection {
  id: string;
  title: string;
  icon: string;
  iconColor: string;
  order: number;
  content: HelpItem[];
}

export function DashboardHelp() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sections, setSections] = useState<HelpSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  
  const accent = useThemeColor({}, 'accent');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const textTertiary = useThemeColor({}, 'textTertiary');

  useEffect(() => {
    async function loadHelpData() {
      try {
        const response = await fetch('/api/help/sections-with-items');
        if (!response.ok) {
          throw new Error('Failed to fetch help data');
        }
        const data = await response.json();
        setSections(data);
      } catch (error) {
        console.error('Error loading help data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadHelpData();
  }, []);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header colapsable */}
      <Pressable
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View style={styles.headerContent}>
          <ThemedText type="subtitle" style={styles.title}>
            ❓ Ayuda
          </ThemedText>
        </View>
        <IconSymbol
          name={isExpanded ? 'chevron.up' : 'chevron.down'}
          size={20}
          color={textTertiary}
        />
      </Pressable>

      {/* Contenido expandible */}
      {isExpanded && (
        <View style={styles.contentContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={accent} />
              <ThemedText style={styles.loadingText}>Cargando ayuda...</ThemedText>
            </View>
          ) : sections.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
                No hay información de ayuda disponible
              </ThemedText>
            </View>
          ) : (
            <ScrollView style={styles.sectionsContainer}>
              {sections.map((section) => (
                <View key={section.id} style={styles.sectionCard}>
                  <Pressable
                    style={styles.sectionHeader}
                    onPress={() => toggleSection(section.id)}
                  >
                    <View style={styles.sectionHeaderContent}>
                      <ThemedText style={styles.sectionIcon}>{section.icon}</ThemedText>
                      <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
                    </View>
                    <IconSymbol
                      name={expandedSections.has(section.id) ? 'chevron.up' : 'chevron.down'}
                      size={16}
                      color={textTertiary}
                    />
                  </Pressable>

                  {expandedSections.has(section.id) && (
                    <View style={styles.sectionContent}>
                      {section.content.map((item) => (
                        <View key={item.id} style={styles.faqItem}>
                          <ThemedText style={styles.question}>{item.question}</ThemedText>
                          <ThemedText style={[styles.answer, { color: textSecondary }]}>
                            {item.answer}
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },

  contentContainer: {
    marginTop: 0,
    maxHeight: 400,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  loadingContainer: {
    paddingVertical: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  sectionsContainer: {
    maxHeight: 400,
  },
  sectionCard: {
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  sectionContent: {
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
  },
  faqItem: {
    marginBottom: 12,
  },
  question: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  answer: {
    fontSize: 12,
    lineHeight: 18,
  },
});
