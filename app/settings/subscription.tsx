/**
 * Página de Suscripción
 * Piano Emotion Manager
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trpc } from '@/lib/trpc';

type SubscriptionPlan = 'free' | 'professional' | 'enterprise';
type BillingCycle = 'monthly' | 'yearly';

interface PlanInfo {
  code: SubscriptionPlan;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  isPopular: boolean;
  note?: string;
}

const PLANS: PlanInfo[] = [
  {
    code: 'free',
    name: 'Gratuito',
    description: 'Para todos los técnicos',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      'Gestión de clientes ilimitada',
      'Gestión de pianos ilimitada',
      'Agenda y servicios',
      'Facturación básica',
      'Acceso a Piano Emotion Store',
    ],
    isPopular: false,
  },
  {
    code: 'professional',
    name: 'Profesional',
    description: 'Para técnicos independientes',
    monthlyPrice: 9.99,
    yearlyPrice: 99,
    features: [
      'Todo lo del plan Gratuito',
      'WhatsApp integrado',
      'Email integrado',
      'Recordatorios automáticos',
      'Soporte prioritario',
    ],
    isPopular: true,
    note: 'Gratis con mínimo de compra en distribuidor',
  },
  {
    code: 'enterprise',
    name: 'Empresa',
    description: 'Para equipos de técnicos',
    monthlyPrice: 9.99,
    yearlyPrice: 99,
    features: [
      'Todo lo del plan Profesional',
      'Multi-técnico (gestión de equipos)',
      'Panel de administración',
      'Reportes de equipo',
      '+5€/mes por técnico adicional',
    ],
    isPopular: false,
    note: 'Gratis con mínimo de compra en distribuidor',
  },
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly');
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>('free');
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanInfo | null>(null);

  // tRPC mutation for changing plan
  const changePlanMutation = trpc.subscription.changePlan.useMutation({
    onSuccess: () => {
      // Success handled after mutation
    },
    onError: (error) => {
      console.error('Error changing plan:', error);
    },
  });

  const handleSelectPlan = (plan: PlanInfo) => {
    if (plan.code === currentPlan) return;
    
    setSelectedPlan(plan);
    setShowConfirmModal(true);
  };
  
  const handleConfirmPlanChange = () => {
    if (!selectedPlan) return;
    
    const newPlan = selectedPlan.code;
    
    // Update UI immediately
    setCurrentPlan(newPlan);
    setShowConfirmModal(false);
    setSelectedPlan(null);
    
    // Try to sync with backend (non-blocking)
    changePlanMutation.mutate({
      planCode: newPlan,
      billingCycle: billingCycle,
    });
  };
  
  const handleCancelPlanChange = () => {
    setShowConfirmModal(false);
    setSelectedPlan(null);
  };

  const getPrice = (plan: PlanInfo) => {
    if (plan.monthlyPrice === 0) return 'Gratis';
    const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
    return `${price.toFixed(2)}€/${billingCycle === 'yearly' ? 'año' : 'mes'}`;
  };
  
  const getConfirmMessage = () => {
    if (!selectedPlan) return '';
    const price = billingCycle === 'yearly' ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice;
    const priceText = price === 0 ? 'Gratis' : `${price.toFixed(2)}€/${billingCycle === 'yearly' ? 'año' : 'mes'}`;
    return `¿Deseas cambiar tu plan a ${selectedPlan.name}?\n\nPrecio: ${priceText}`;
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Suscripción' }} />
      
      <View style={styles.wrapper}>
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
          {/* Current Plan Banner */}
          <View style={styles.currentPlanBanner}>
            <View style={styles.currentPlanInfo}>
              <Text style={styles.currentPlanLabel}>Tu plan actual</Text>
              <Text style={styles.currentPlanName}>
                {PLANS.find(p => p.code === currentPlan)?.name || 'Gratuito'}
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={28} color="#10b981" />
          </View>

          <View style={styles.billingToggle}>
            <TouchableOpacity
              style={[styles.toggleButton, billingCycle === 'monthly' && styles.toggleButtonActive]}
              onPress={() => setBillingCycle('monthly')}
            >
              <Text style={[styles.toggleText, billingCycle === 'monthly' && styles.toggleTextActive]}>Mensual</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, billingCycle === 'yearly' && styles.toggleButtonActive]}
              onPress={() => setBillingCycle('yearly')}
            >
              <Text style={[styles.toggleText, billingCycle === 'yearly' && styles.toggleTextActive]}>Anual -17%</Text>
            </TouchableOpacity>
          </View>

          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Actualizando plan...</Text>
            </View>
          )}

          {PLANS.map((plan) => (
            <View 
              key={plan.code} 
              style={[
                styles.planCard, 
                plan.isPopular && styles.planCardPopular, 
                plan.code === currentPlan && styles.planCardCurrent
              ]}
            >
              {plan.isPopular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Popular</Text>
                </View>
              )}
              {plan.code === currentPlan && (
                <View style={styles.currentBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                  <Text style={styles.currentBadgeText}>Actual</Text>
                </View>
              )}
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planDescription}>{plan.description}</Text>
              <Text style={styles.price}>{getPrice(plan)}</Text>
              {plan.note && (
                <Text style={styles.planNote}>{plan.note}</Text>
              )}
              {plan.features.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
              <TouchableOpacity
                style={[
                  styles.selectButton, 
                  plan.code === currentPlan && styles.selectButtonCurrent
                ]}
                onPress={() => handleSelectPlan(plan)}
                disabled={plan.code === currentPlan || isLoading}
              >
                <Text style={[
                  styles.selectButtonText,
                  plan.code === currentPlan && styles.selectButtonTextCurrent
                ]}>
                  {plan.code === currentPlan ? 'Plan actual' : 'Seleccionar'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
        
        {/* Inline Modal Overlay */}
        {showConfirmModal && (
          <View style={styles.modalOverlay}>
            <Pressable style={styles.modalBackdrop} onPress={handleCancelPlanChange} />
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>
                {selectedPlan ? `Cambiar a ${selectedPlan.name}` : ''}
              </Text>
              <Text style={styles.modalMessage}>{getConfirmMessage()}</Text>
              <View style={styles.modalButtons}>
                <Pressable style={styles.cancelButton} onPress={handleCancelPlanChange}>
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </Pressable>
                <Pressable style={styles.confirmButton} onPress={handleConfirmPlanChange}>
                  <Text style={styles.confirmButtonText}>Confirmar</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    position: 'relative',
  },
  container: { 
    flex: 1, 
    backgroundColor: '#f9fafb', 
    padding: 16 
  },
  currentPlanBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  currentPlanInfo: {
    flex: 1,
  },
  currentPlanLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  currentPlanName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
  },
  billingToggle: { 
    flexDirection: 'row', 
    backgroundColor: '#e5e7eb', 
    borderRadius: 12, 
    padding: 4, 
    marginBottom: 24 
  },
  toggleButton: { 
    flex: 1, 
    alignItems: 'center', 
    paddingVertical: 12, 
    borderRadius: 10 
  },
  toggleButtonActive: { 
    backgroundColor: '#fff' 
  },
  toggleText: { 
    fontSize: 14, 
    fontWeight: '500', 
    color: '#6b7280' 
  },
  toggleTextActive: { 
    color: '#1f2937', 
    fontWeight: '600' 
  },
  loadingOverlay: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  planCard: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 16, 
    borderWidth: 2, 
    borderColor: '#e5e7eb' 
  },
  planCardPopular: { 
    borderColor: '#3b82f6' 
  },
  planCardCurrent: { 
    borderColor: '#10b981', 
    backgroundColor: '#f0fdf4' 
  },
  popularBadge: { 
    position: 'absolute', 
    top: -10, 
    right: 16, 
    backgroundColor: '#3b82f6', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 12 
  },
  popularBadgeText: { 
    fontSize: 11, 
    fontWeight: '600', 
    color: '#fff' 
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  currentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  planName: { 
    fontSize: 22, 
    fontWeight: '700', 
    color: '#1f2937' 
  },
  planDescription: { 
    fontSize: 13, 
    color: '#6b7280', 
    marginTop: 4, 
    marginBottom: 12 
  },
  price: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#1f2937', 
    marginBottom: 8 
  },
  planNote: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  featureRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginBottom: 8 
  },
  featureText: { 
    fontSize: 14, 
    color: '#374151' 
  },
  selectButton: { 
    backgroundColor: '#1f2937', 
    paddingVertical: 14, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginTop: 12 
  },
  selectButtonCurrent: { 
    backgroundColor: '#d1fae5' 
  },
  selectButtonText: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: '#fff' 
  },
  selectButtonTextCurrent: {
    color: '#10b981',
  },
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1001,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#10b981',
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
