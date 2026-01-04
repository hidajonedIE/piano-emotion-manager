import React from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

export function DashboardHelp() {
  const router = useRouter();
  const accent = useThemeColor({}, 'accent');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const helpTopics = [
    {
      title: '¿Cómo empiezo?',
      description: 'Primeros pasos para usar la aplicación',
      icon: '🚀',
    },
    {
      title: 'Gestión de Clientes',
      description: 'Aprende a gestionar tus clientes',
      icon: '👥',
    },
    {
      title: 'Gestión de Pianos',
      description: 'Registra y gestiona tus pianos',
      icon: '🎹',
    },
    {
      title: 'Servicios',
      description: 'Cómo registrar y facturar servicios',
      icon: '🔧',
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="subtitle" style={styles.title}>
          ❓ Ayuda
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: textSecondary }]}>
          Encuentra respuestas a tus preguntas
        </ThemedText>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.topicsContainer}
        contentContainerStyle={styles.topicsContent}
      >
        {helpTopics.map((topic, index) => (
          <Pressable
            key={index}
            style={[styles.topicCard, { borderLeftColor: accent }]}
            onPress={() => router.push('/help')}
          >
            <ThemedText style={styles.topicIcon}>{topic.icon}</ThemedText>
            <ThemedText style={styles.topicTitle}>{topic.title}</ThemedText>
            <ThemedText style={[styles.topicDescription, { color: textSecondary }]}>
              {topic.description}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>

      <Pressable 
        style={[styles.viewAllButton, { backgroundColor: accent }]}
        onPress={() => router.push('/help')}
      >
        <ThemedText style={styles.viewAllButtonText}>
          Ver toda la ayuda →
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  topicsContainer: {
    marginBottom: 16,
  },
  topicsContent: {
    gap: 12,
    paddingRight: 16,
  },
  topicCard: {
    minWidth: 140,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    borderLeftWidth: 4,
    borderLeftColor: '#2D5A27',
  },
  topicIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  topicTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  topicDescription: {
    fontSize: 11,
    lineHeight: 16,
  },
  viewAllButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewAllButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
