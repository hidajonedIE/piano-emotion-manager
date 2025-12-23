/**
 * Componentes de UI para el Sistema Premium
 * 
 * Incluye:
 * - PremiumFeature: Wrapper para funcionalidades Premium
 * - UpgradePrompt: Modal de upgrade
 * - AccountStatusCard: Tarjeta de estado de cuenta
 * - PremiumBadge: Badge indicador de Premium
 * - TrialBanner: Banner de periodo de prueba
 */

import React, { useState } from 'react';
import { useAccountTier, usePremiumFeature, useAccountStatus, PremiumFeature as PremiumFeatureType } from '../../contexts/account-tier-context';

// ============================================
// PREMIUM FEATURE WRAPPER
// ============================================

interface PremiumFeatureProps {
  feature: PremiumFeatureType;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showBadge?: boolean;
  onBlocked?: () => void;
}

/**
 * Wrapper que envuelve funcionalidades Premium.
 * Si el usuario no tiene acceso, muestra el UpgradePrompt al hacer clic.
 */
export function PremiumFeature({ 
  feature, 
  children, 
  fallback,
  showBadge = true,
  onBlocked 
}: PremiumFeatureProps) {
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const { canUse, blockedReason } = usePremiumFeature(feature);

  const handleClick = (e: React.MouseEvent) => {
    if (!canUse) {
      e.preventDefault();
      e.stopPropagation();
      setShowUpgradePrompt(true);
      onBlocked?.();
    }
  };

  if (!canUse && fallback) {
    return <>{fallback}</>;
  }

  return (
    <>
      <div 
        onClick={handleClick}
        className={!canUse ? 'cursor-not-allowed opacity-75' : ''}
        style={{ position: 'relative' }}
      >
        {children}
        {showBadge && !canUse && <PremiumBadge />}
      </div>
      
      {showUpgradePrompt && (
        <UpgradePrompt 
          feature={feature}
          onClose={() => setShowUpgradePrompt(false)} 
        />
      )}
    </>
  );
}

// ============================================
// UPGRADE PROMPT MODAL
// ============================================

interface UpgradePromptProps {
  feature?: PremiumFeatureType;
  onClose: () => void;
}

/**
 * Modal que se muestra al intentar usar una función Premium sin permiso.
 */
export function UpgradePrompt({ feature, onClose }: UpgradePromptProps) {
  const { 
    purchasesLast30Days, 
    minimumPurchase, 
    purchasesNeeded, 
    progressPercent,
    distributor,
    openShop 
  } = useAccountTier();

  const featureNames: Record<string, { name: string; description: string; icon: string }> = {
    'whatsapp': {
      name: 'WhatsApp Business',
      description: 'Envía recordatorios y mensajes a tus clientes por WhatsApp.',
      icon: '💬',
    },
    'portal': {
      name: 'Portal del Cliente',
      description: 'Tus clientes pueden ver sus pianos, servicios y facturas online.',
      icon: '🌐',
    },
    'reminders': {
      name: 'Recordatorios Automáticos',
      description: 'Envía recordatorios de citas y mantenimientos automáticamente.',
      icon: '⏰',
    },
    'notifications': {
      name: 'Notificaciones Push',
      description: 'Envía notificaciones push a tus clientes.',
      icon: '🔔',
    },
  };

  const featureKey = feature?.split(':')[0] || 'whatsapp';
  const featureInfo = featureNames[featureKey] || featureNames['whatsapp'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 rounded-t-2xl text-white">
          <div className="text-4xl mb-2">{featureInfo.icon}</div>
          <h2 className="text-xl font-bold">{featureInfo.name}</h2>
          <p className="text-white/90 text-sm mt-1">{featureInfo.description}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-4">
              Esta funcionalidad requiere una <span className="font-semibold text-amber-600">cuenta Premium</span>.
            </p>
            
            {/* Progress */}
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Tu progreso este mes</span>
                <span>{progressPercent.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-orange-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, progressPercent)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{purchasesLast30Days.toFixed(2)}€</span>
                <span>{minimumPurchase.toFixed(2)}€</span>
              </div>
            </div>
          </div>

          {/* Call to action */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-amber-800 text-sm">
              <span className="font-semibold">¡Te faltan solo {purchasesNeeded.toFixed(2)}€!</span>
              <br />
              Compra en la tienda de {distributor.name} para desbloquear todas las funciones Premium.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Ahora no
            </button>
            <button
              onClick={() => {
                openShop();
                onClose();
              }}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-colors font-semibold"
            >
              Ir a la tienda
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ACCOUNT STATUS CARD
// ============================================

/**
 * Tarjeta que muestra el estado de la cuenta en el Dashboard.
 */
export function AccountStatusCard() {
  const {
    tier,
    isPremium,
    isBasic,
    isTrial,
    purchasesLast30Days,
    minimumPurchase,
    purchasesNeeded,
    progressPercent,
    daysLeftInTrial,
    distributorName,
    openShop,
  } = useAccountStatus();

  const tierConfig = {
    trial: {
      label: 'Periodo de Prueba',
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      icon: '🎁',
    },
    basic: {
      label: 'Cuenta Básica',
      color: 'bg-gray-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-800',
      icon: '📦',
    },
    premium: {
      label: 'Cuenta Premium',
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-800',
      icon: '⭐',
    },
  };

  const config = tierConfig[tier];

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-xl p-4`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <span className={`text-sm font-semibold ${config.textColor}`}>
              {config.label}
            </span>
            {isTrial && daysLeftInTrial !== null && (
              <p className="text-xs text-gray-500">
                {daysLeftInTrial} días restantes
              </p>
            )}
          </div>
        </div>
        {isPremium && (
          <span className="text-green-600 text-sm font-medium">✓ Activa</span>
        )}
      </div>

      {/* Progress (solo si no es Premium) */}
      {!isPremium && (
        <>
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Compras este mes</span>
              <span>{purchasesLast30Days.toFixed(2)}€ / {minimumPurchase.toFixed(2)}€</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`${config.color} h-2 rounded-full transition-all duration-500`}
                style={{ width: `${Math.min(100, progressPercent)}%` }}
              />
            </div>
          </div>

          {isBasic && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Faltan {purchasesNeeded.toFixed(2)}€ para Premium
              </span>
              <button
                onClick={openShop}
                className="text-xs text-amber-600 hover:text-amber-700 font-medium"
              >
                Ir a la tienda →
              </button>
            </div>
          )}
        </>
      )}

      {/* Premium benefits */}
      {isPremium && (
        <div className="text-xs text-gray-600">
          <p>Gracias por confiar en {distributorName}</p>
        </div>
      )}
    </div>
  );
}

// ============================================
// PREMIUM BADGE
// ============================================

interface PremiumBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

/**
 * Badge que indica que una funcionalidad es Premium.
 */
export function PremiumBadge({ size = 'sm', showTooltip = true }: PremiumBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span 
      className={`absolute -top-1 -right-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-semibold ${sizeClasses[size]}`}
      title={showTooltip ? 'Funcionalidad Premium' : undefined}
    >
      ⭐
    </span>
  );
}

// ============================================
// TRIAL BANNER
// ============================================

/**
 * Banner que se muestra durante el periodo de prueba.
 */
export function TrialBanner() {
  const { isTrial, daysLeftInTrial, minimumPurchase, distributorName, openShop } = useAccountStatus();
  const [dismissed, setDismissed] = useState(false);

  if (!isTrial || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">🎁</span>
          <div>
            <p className="font-medium">
              Periodo de prueba: {daysLeftInTrial} días restantes
            </p>
            <p className="text-sm text-white/80">
              Disfruta de todas las funciones Premium. Compra {minimumPurchase}€/mes en {distributorName} para mantenerlas.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openShop}
            className="px-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
          >
            Ir a la tienda
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// BASIC ACCOUNT BANNER
// ============================================

/**
 * Banner que se muestra cuando la cuenta está en modo Básico.
 */
export function BasicAccountBanner() {
  const { isBasic, purchasesNeeded, distributorName, openShop } = useAccountStatus();
  const [dismissed, setDismissed] = useState(false);

  if (!isBasic || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">📦</span>
          <div>
            <p className="font-medium">
              Cuenta Básica
            </p>
            <p className="text-sm text-white/80">
              Compra {purchasesNeeded.toFixed(2)}€ más en {distributorName} para desbloquear WhatsApp, Portal y Recordatorios.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openShop}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
          >
            Desbloquear Premium
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// EXPORTS
// ============================================

export {
  PremiumFeature,
  UpgradePrompt,
  AccountStatusCard,
  PremiumBadge,
  TrialBanner,
  BasicAccountBanner,
};
