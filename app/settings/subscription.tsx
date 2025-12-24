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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SubscriptionPlan = 'free' | 'starter' | 'professional' | 'enterprise';
type BillingCycle = 'monthly' | 'yearly';

interface PlanInfo {
  code: SubscriptionPlan;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  isPopular: boolean;
}

const PLANS: PlanInfo[] = [
  {
    code: 'free',
    name: 'Gratuito',
    description: 'Para técnicos independientes',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: ['Gestión básica', '50 clientes', '100 pianos', 'Facturación básica'],
    isPopular: false,
  },
  {
    code: 'starter',
    name: 'Inicial',
    description: 'Para técnicos que crecen',
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    features: ['Todo lo anterior', 'Facturación electrónica', 'Tienda online', '200 clientes'],
    isPopular: false,
  },
  {
    code: 'professional',
    name: 'Profesional',
    description: 'Para empresas con equipos',
    monthlyPrice: 29.99,
    yearlyPrice: 299.99,
    features: ['Todo lo anterior', 'Gestión de equipos', 'Inventario', 'Reportes', 'Ilimitado'],
    isPopular: true,
  },
  {
    code: 'enterprise',
    name: 'Empresarial',
    description: 'Para grandes empresas',
    monthlyPrice: 99.99,
    yearlyPrice: 999.99,
    features: ['Todo lo anterior', 'Usuarios ilimitados', 'Marca blanca', 'API', 'SLA'],
    isPopular: false,
  },
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly');
  const [currentPlan] = useState<SubscriptionPlan>('free');
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectPlan = (plan: PlanInfo) => {
    if (plan.code === currentPlan) return;
    const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
    Alert.alert(`Actualizar a ${plan.name}`, `Precio: ${price}€/${billingCycle === 'yearly' ? 'año' : 'mes'}`);
  };

  const getPrice = (plan: PlanInfo) => {
    if (plan.monthlyPrice === 0) return 'Gratis';
    const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
    return `${price.toFixed(2)}€/${billingCycle === 'yearly' ? 'año' : 'mes'}`;
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Suscripción' }} />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
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

        {PLANS.map((plan) => (
          <View key={plan.code} style={[styles.planCard, plan.isPopular && styles.planCardPopular, plan.code === currentPlan && styles.planCardCurrent]}>
            {plan.isPopular && <View style={styles.popularBadge}><Text style={styles.popularBadgeText}>Popular</Text></View>}
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planDescription}>{plan.description}</Text>
            <Text style={styles.price}>{getPrice(plan)}</Text>
            {plan.features.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
            <TouchableOpacity
              style={[styles.selectButton, plan.code === currentPlan && styles.selectButtonCurrent]}
              onPress={() => handleSelectPlan(plan)}
              disabled={plan.code === currentPlan}
            >
              <Text style={styles.selectButtonText}>{plan.code === currentPlan ? 'Plan actual' : 'Seleccionar'}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  billingToggle: { flexDirection: 'row', backgroundColor: '#e5e7eb', borderRadius: 12, padding: 4, marginBottom: 24 },
  toggleButton: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10 },
  toggleButtonActive: { backgroundColor: '#fff' },
  toggleText: { fontSize: 14, fontWeight: '500', color: '#6b7280' },
  toggleTextActive: { color: '#1f2937', fontWeight: '600' },
  planCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 2, borderColor: '#e5e7eb' },
  planCardPopular: { borderColor: '#3b82f6' },
  planCardCurrent: { borderColor: '#10b981', backgroundColor: '#f0fdf4' },
  popularBadge: { position: 'absolute', top: -10, right: 16, backgroundColor: '#3b82f6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  popularBadgeText: { fontSize: 11, fontWeight: '600', color: '#fff' },
  planName: { fontSize: 22, fontWeight: '700', color: '#1f2937' },
  planDescription: { fontSize: 13, color: '#6b7280', marginTop: 4, marginBottom: 12 },
  price: { fontSize: 28, fontWeight: '800', color: '#1f2937', marginBottom: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  featureText: { fontSize: 14, color: '#374151' },
  selectButton: { backgroundColor: '#1f2937', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  selectButtonCurrent: { backgroundColor: '#d1fae5' },
  selectButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
