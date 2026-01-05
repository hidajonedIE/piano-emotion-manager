import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet, useColorScheme, Platform } from 'react-native';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { Colors } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

type TabType = 'revenue' | 'churn' | 'maintenance' | 'workload' | 'inventory';

const tabs = [
  { id: 'revenue', label: 'Ingresos', icon: 'cash-outline' },
  { id: 'churn', label: 'Clientes', icon: 'people-outline' },
  { id: 'maintenance', label: 'Mantenimiento', icon: 'build-outline' },
  { id: 'workload', label: 'Carga', icon: 'bar-chart-outline' },
  { id: 'inventory', label: 'Inventario', icon: 'cube-outline' },
];

export default function PredictionsScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  
  // Mapeo de colores para compatibilidad con el código existente
  const colors = {
    ...themeColors,
    primary: themeColors.tint,
    card: themeColors.cardBackground,
  };

  const [activeTab, setActiveTab] = useState<TabType>('revenue');
  const contentScrollRef = useRef<ScrollView>(null);

  const textPrimary = colors.text;
  const textSecondary = colors.textSecondary;
  const border = colors.border;
  const cardBg = colors.card;

  const renderContent = () => {
    switch (activeTab) {
      case 'revenue': return renderRevenueTab();
      case 'churn': return renderChurnTab();
      case 'maintenance': return renderMaintenanceTab();
      case 'workload': return renderWorkloadTab();
      case 'inventory': return renderInventoryTab();
      default: return null;
    }
  };

  const renderRevenueTab = () => (
    <View style={styles.tabContent}>
      <View style={[styles.summaryCard, { backgroundColor: cardBg, borderColor: border }]}>
        <View style={styles.summaryHeader}>
          <Ionicons name="analytics" size={24} color={colors.primary} />
          <ThemedText style={[styles.summaryTitle, { color: textPrimary }]}>
            Predicción de Ingresos
          </ThemedText>
        </View>
        <ThemedText style={[styles.summaryDescription, { color: textSecondary }]}>
          Basado en tu historial de los últimos 12 meses
        </ThemedText>
      </View>
    </View>
  );

  const renderChurnTab = () => (
    <View style={styles.tabContent}>
      <ThemedText>Contenido de Clientes</ThemedText>
    </View>
  );

  const renderMaintenanceTab = () => (
    <View style={styles.tabContent}>
      <ThemedText>Contenido de Mantenimiento</ThemedText>
    </View>
  );

  const renderWorkloadTab = () => (
    <View style={styles.tabContent}>
      <ThemedText>Contenido de Carga de Trabajo</ThemedText>
    </View>
  );

  const renderInventoryTab = () => (
    <View style={styles.tabContent}>
      <ThemedText>Contenido de Inventario</ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={textPrimary} />
        </TouchableOpacity>
        <ThemedText style={[styles.title, { color: textPrimary }]}>Predicciones IA</ThemedText>
      </View>

      <View style={[styles.tabsContainer, { borderBottomColor: border }]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabButton,
              activeTab === tab.id && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
            ]}
            onPress={() => setActiveTab(tab.id as TabType)}
          >
            <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <Ionicons 
                name={tab.icon as any} 
                size={24} 
                color={activeTab === tab.id ? colors.primary : textSecondary} 
              />
              <ThemedText 
                style={[
                  styles.tabLabel, 
                  { color: activeTab === tab.id ? colors.primary : textSecondary }
                ]}
              >
                {tab.label}
              </ThemedText>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        ref={contentScrollRef}
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {renderContent()}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 80,
    borderBottomWidth: 1,
  },
  backButton: {
    position: 'absolute',
    left: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  tabsContainer: {
    height: 160,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    width: '100%',
    display: 'flex',
  },
  tabButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    minWidth: 120,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  tabLabel: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    width: '100%',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  tabContent: {
    flex: 1,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  summaryDescription: {
    fontSize: 14,
  },
});
