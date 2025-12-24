/**
 * Configuración de Módulos
 * Piano Emotion Manager
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useModules, useSubscription } from '@/hooks/modules';
import { useTranslation } from '@/hooks/use-translation';
import { useRouter } from 'expo-router';

// ============================================================================
// Types
// ============================================================================

interface ModuleCardProps {
  module: {
    code: string;
    name: string;
    description: string | null;
    icon: string | null;
    color: string | null;
    type: string;
    isEnabled: boolean;
    isAvailable: boolean;
    requiresUpgrade: boolean;
  };
  onToggle: (enabled: boolean) => void;
  isToggling: boolean;
  onUpgrade: () => void;
}

// ============================================================================
// Module Card Component
// ============================================================================

const ModuleCard: React.FC<ModuleCardProps> = ({ module, onToggle, isToggling, onUpgrade }) => {
  const { t } = useTranslation();

  const handleToggle = (value: boolean) => {
    if (module.requiresUpgrade) {
      onUpgrade();
      return;
    }
    onToggle(value);
  };

  return (
    <View style={[styles.moduleCard, !module.isAvailable && styles.moduleCardDisabled]}>
      <View style={styles.moduleHeader}>
        <View style={[styles.moduleIcon, { backgroundColor: module.color || '#6b7280' }]}>
          <Ionicons name={(module.icon as any) || 'cube'} size={24} color="#fff" />
        </View>
        <View style={styles.moduleInfo}>
          <View style={styles.moduleTitleRow}>
            <Text style={styles.moduleName}>{module.name}</Text>
            {module.type === 'premium' && (
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={10} color="#fff" />
                <Text style={styles.premiumBadgeText}>Premium</Text>
              </View>
            )}
            {module.type === 'addon' && (
              <View style={styles.addonBadge}>
                <Text style={styles.addonBadgeText}>Add-on</Text>
              </View>
            )}
          </View>
          <Text style={styles.moduleDescription} numberOfLines={2}>
            {module.description}
          </Text>
        </View>
      </View>
      <View style={styles.moduleActions}>
        {module.type === 'core' ? (
          <View style={styles.coreIndicator}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.coreText}>{t('modules.alwaysActive')}</Text>
          </View>
        ) : module.requiresUpgrade ? (
          <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
            <Ionicons name="arrow-up-circle" size={16} color="#fff" />
            <Text style={styles.upgradeButtonText}>{t('modules.upgrade')}</Text>
          </TouchableOpacity>
        ) : (
          <Switch
            value={module.isEnabled}
            onValueChange={handleToggle}
            disabled={isToggling || !module.isAvailable}
            trackColor={{ false: '#d1d5db', true: '#86efac' }}
            thumbColor={module.isEnabled ? '#10b981' : '#f4f4f5'}
          />
        )}
      </View>
    </View>
  );
};

// ============================================================================
// Usage Bar Component
// ============================================================================

interface UsageBarProps {
  label: string;
  current: number;
  limit: number | null;
  percentage: number;
}

const UsageBar: React.FC<UsageBarProps> = ({ label, current, limit, percentage }) => {
  const getBarColor = () => {
    if (percentage >= 90) return '#ef4444';
    if (percentage >= 70) return '#f59e0b';
    return '#10b981';
  };

  return (
    <View style={styles.usageItem}>
      <View style={styles.usageHeader}>
        <Text style={styles.usageLabel}>{label}</Text>
        <Text style={styles.usageValue}>
          {current} / {limit || '∞'}
        </Text>
      </View>
      <View style={styles.usageBarBg}>
        <View
          style={[
            styles.usageBarFill,
            { width: `${Math.min(100, percentage)}%`, backgroundColor: getBarColor() },
          ]}
        />
      </View>
    </View>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const ModulesSettings: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    coreModules,
    freeModules,
    premiumModules,
    addonModules,
    isLoading: modulesLoading,
    toggleModule,
    isToggling,
  } = useModules();
  const { currentPlan, currentPlanInfo, usage, isLoading: subscriptionLoading } = useSubscription();

  const handleToggle = async (moduleCode: string, enabled: boolean) => {
    try {
      await toggleModule(moduleCode, enabled);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    }
  };

  const handleUpgrade = () => {
    router.push('/settings/subscription');
  };

  if (modulesLoading || subscriptionLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Plan actual */}
      <View style={styles.section}>
        <View style={styles.planCard}>
          <View style={styles.planHeader}>
            <View>
              <Text style={styles.planLabel}>{t('modules.currentPlan')}</Text>
              <Text style={styles.planName}>{currentPlanInfo?.name || 'Gratuito'}</Text>
            </View>
            <TouchableOpacity style={styles.changePlanButton} onPress={handleUpgrade}>
              <Text style={styles.changePlanText}>{t('modules.changePlan')}</Text>
              <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
            </TouchableOpacity>
          </View>
          {currentPlanInfo?.features && (
            <View style={styles.planFeatures}>
              {(currentPlanInfo.features as string[]).slice(0, 3).map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark" size={14} color="#10b981" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Uso de recursos */}
      {usage && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('modules.resourceUsage')}</Text>
          <View style={styles.usageCard}>
            <UsageBar
              label={t('modules.users')}
              current={usage.users.current}
              limit={usage.users.limit}
              percentage={usage.users.percentage}
            />
            <UsageBar
              label={t('modules.clients')}
              current={usage.clients.current}
              limit={usage.clients.limit}
              percentage={usage.clients.percentage}
            />
            <UsageBar
              label={t('modules.pianos')}
              current={usage.pianos.current}
              limit={usage.pianos.limit}
              percentage={usage.pianos.percentage}
            />
            <UsageBar
              label={t('modules.invoicesMonth')}
              current={usage.invoices.current}
              limit={usage.invoices.limit}
              percentage={usage.invoices.percentage}
            />
            <UsageBar
              label={t('modules.storage')}
              current={usage.storage.current}
              limit={usage.storage.limit}
              percentage={usage.storage.percentage}
            />
          </View>
        </View>
      )}

      {/* Módulos principales */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('modules.coreModules')}</Text>
        <Text style={styles.sectionSubtitle}>{t('modules.coreModulesDesc')}</Text>
        {coreModules.map((module) => (
          <ModuleCard
            key={module.code}
            module={module}
            onToggle={(enabled) => handleToggle(module.code, enabled)}
            isToggling={isToggling}
            onUpgrade={handleUpgrade}
          />
        ))}
      </View>

      {/* Módulos gratuitos */}
      {freeModules.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('modules.freeModules')}</Text>
          <Text style={styles.sectionSubtitle}>{t('modules.freeModulesDesc')}</Text>
          {freeModules.map((module) => (
            <ModuleCard
              key={module.code}
              module={module}
              onToggle={(enabled) => handleToggle(module.code, enabled)}
              isToggling={isToggling}
              onUpgrade={handleUpgrade}
            />
          ))}
        </View>
      )}

      {/* Módulos premium */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('modules.premiumModules')}</Text>
          <View style={styles.premiumIndicator}>
            <Ionicons name="star" size={14} color="#f59e0b" />
          </View>
        </View>
        <Text style={styles.sectionSubtitle}>{t('modules.premiumModulesDesc')}</Text>
        {premiumModules.map((module) => (
          <ModuleCard
            key={module.code}
            module={module}
            onToggle={(enabled) => handleToggle(module.code, enabled)}
            isToggling={isToggling}
            onUpgrade={handleUpgrade}
          />
        ))}
      </View>

      {/* Add-ons */}
      {addonModules.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('modules.addons')}</Text>
          <Text style={styles.sectionSubtitle}>{t('modules.addonsDesc')}</Text>
          {addonModules.map((module) => (
            <ModuleCard
              key={module.code}
              module={module}
              onToggle={(enabled) => handleToggle(module.code, enabled)}
              isToggling={isToggling}
              onUpgrade={handleUpgrade}
            />
          ))}
        </View>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
  },
  premiumIndicator: {
    marginBottom: 4,
  },
  // Plan Card
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  planName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  changePlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changePlanText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  planFeatures: {
    marginTop: 16,
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    color: '#374151',
  },
  // Usage Card
  usageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  usageItem: {
    gap: 4,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  usageLabel: {
    fontSize: 13,
    color: '#374151',
  },
  usageValue: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  usageBarBg: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  usageBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  // Module Card
  moduleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  moduleCardDisabled: {
    opacity: 0.6,
  },
  moduleHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  moduleIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moduleName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  addonBadge: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  addonBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  moduleDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  moduleActions: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  coreIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coreText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  upgradeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  bottomSpacer: {
    height: 32,
  },
});

export default ModulesSettings;
