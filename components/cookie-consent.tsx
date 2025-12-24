import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  View, 
  StyleSheet, 
  Pressable, 
  Modal, 
  ScrollView,
  Switch,
  Platform,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';

// Tipos de cookies
export interface CookiePreferences {
  necessary: boolean; // Siempre true, no se puede desactivar
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  consentDate: string | null;
  consentVersion: string;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
  consentDate: null,
  consentVersion: '1.0',
};

const STORAGE_KEY = '@cookie_preferences';
const CONSENT_VERSION = '1.0';

// Contexto para las preferencias de cookies
interface CookieContextType {
  preferences: CookiePreferences;
  hasConsented: boolean;
  updatePreferences: (prefs: Partial<CookiePreferences>) => Promise<void>;
  acceptAll: () => Promise<void>;
  rejectAll: () => Promise<void>;
  showSettings: () => void;
}

const CookieContext = createContext<CookieContextType | null>(null);

export const useCookieConsent = () => {
  const context = useContext(CookieContext);
  if (!context) {
    throw new Error('useCookieConsent must be used within CookieConsentProvider');
  }
  return context;
};

// Provider de cookies
export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);
  const [hasConsented, setHasConsented] = useState(true); // Asumimos consentido hasta verificar
  const [showBanner, setShowBanner] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar preferencias al iniciar
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CookiePreferences;
        // Verificar si la versión del consentimiento es actual
        if (parsed.consentVersion === CONSENT_VERSION && parsed.consentDate) {
          setPreferences(parsed);
          setHasConsented(true);
          setShowBanner(false);
        } else {
          // Nueva versión, necesita reconsentir
          setHasConsented(false);
          setShowBanner(true);
        }
      } else {
        // Primera vez, mostrar banner
        setHasConsented(false);
        setShowBanner(true);
      }
    } catch (error) {
      console.error('Error loading cookie preferences:', error);
      setShowBanner(true);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async (prefs: CookiePreferences) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      setPreferences(prefs);
      setHasConsented(true);
      setShowBanner(false);
      setShowSettingsModal(false);
    } catch (error) {
      console.error('Error saving cookie preferences:', error);
    }
  };

  const updatePreferences = async (newPrefs: Partial<CookiePreferences>) => {
    const updated: CookiePreferences = {
      ...preferences,
      ...newPrefs,
      necessary: true, // Siempre true
      consentDate: new Date().toISOString(),
      consentVersion: CONSENT_VERSION,
    };
    await savePreferences(updated);
  };

  const acceptAll = async () => {
    await updatePreferences({
      functional: true,
      analytics: true,
      marketing: true,
    });
  };

  const rejectAll = async () => {
    await updatePreferences({
      functional: false,
      analytics: false,
      marketing: false,
    });
  };

  const showSettings = () => {
    setShowSettingsModal(true);
  };

  if (isLoading) {
    return <>{children}</>;
  }

  return (
    <CookieContext.Provider
      value={{
        preferences,
        hasConsented,
        updatePreferences,
        acceptAll,
        rejectAll,
        showSettings,
      }}
    >
      {children}
      {showBanner && (
        <CookieBanner
          onAcceptAll={acceptAll}
          onRejectAll={rejectAll}
          onSettings={() => setShowSettingsModal(true)}
        />
      )}
      <CookieSettingsModal
        visible={showSettingsModal}
        preferences={preferences}
        onSave={updatePreferences}
        onClose={() => setShowSettingsModal(false)}
      />
    </CookieContext.Provider>
  );
}

// Banner de cookies
interface CookieBannerProps {
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onSettings: () => void;
}

function CookieBanner({ onAcceptAll, onRejectAll, onSettings }: CookieBannerProps) {
  const backgroundColor = useThemeColor({}, 'cardBackground');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primary = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');

  const slideAnim = React.useRef(new Animated.Value(200)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.bannerContainer,
        {
          backgroundColor,
          borderTopColor: borderColor,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.bannerContent}>
        <View style={styles.bannerHeader}>
          <IconSymbol name="shield.lefthalf.filled" size={24} color={primary} />
          <ThemedText style={styles.bannerTitle}>Tu privacidad es importante</ThemedText>
        </View>
        
        <ThemedText style={[styles.bannerText, { color: textSecondary }]}>
          Utilizamos cookies para mejorar tu experiencia, analizar el uso de la aplicación y 
          mostrarte contenido personalizado. Puedes aceptar todas, rechazarlas o configurar 
          tus preferencias.
        </ThemedText>

        <View style={styles.bannerButtons}>
          <Pressable
            style={[styles.bannerButton, styles.settingsButton, { borderColor }]}
            onPress={onSettings}
          >
            <ThemedText style={[styles.buttonText, { color: textColor }]}>
              Configurar
            </ThemedText>
          </Pressable>

          <Pressable
            style={[styles.bannerButton, styles.rejectButton, { borderColor }]}
            onPress={onRejectAll}
          >
            <ThemedText style={[styles.buttonText, { color: textColor }]}>
              Rechazar
            </ThemedText>
          </Pressable>

          <Pressable
            style={[styles.bannerButton, styles.acceptButton, { backgroundColor: primary }]}
            onPress={onAcceptAll}
          >
            <ThemedText style={[styles.buttonText, { color: '#FFFFFF' }]}>
              Aceptar todas
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

// Modal de configuración de cookies
interface CookieSettingsModalProps {
  visible: boolean;
  preferences: CookiePreferences;
  onSave: (prefs: Partial<CookiePreferences>) => Promise<void>;
  onClose: () => void;
}

function CookieSettingsModal({ visible, preferences, onSave, onClose }: CookieSettingsModalProps) {
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'background');
  const cardBg = useThemeColor({}, 'cardBackground');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primary = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  const success = useThemeColor({}, 'success');

  const [localPrefs, setLocalPrefs] = useState(preferences);

  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  const handleSave = async () => {
    await onSave(localPrefs);
  };

  const cookieTypes = [
    {
      id: 'necessary',
      title: 'Cookies Necesarias',
      description: 'Esenciales para el funcionamiento de la aplicación. No se pueden desactivar.',
      required: true,
    },
    {
      id: 'functional',
      title: 'Cookies Funcionales',
      description: 'Permiten recordar tus preferencias y configuraciones para mejorar tu experiencia.',
      required: false,
    },
    {
      id: 'analytics',
      title: 'Cookies Analíticas',
      description: 'Nos ayudan a entender cómo usas la aplicación para mejorarla.',
      required: false,
    },
    {
      id: 'marketing',
      title: 'Cookies de Marketing',
      description: 'Utilizadas para mostrarte información relevante sobre productos de Piano Emotion.',
      required: false,
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor }]}>
        {/* Header */}
        <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <IconSymbol name="xmark" size={24} color={textColor} />
          </Pressable>
          <ThemedText style={styles.modalTitle}>Configuración de Cookies</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Introducción */}
          <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor }]}>
            <IconSymbol name="info.circle.fill" size={20} color={primary} />
            <ThemedText style={[styles.infoText, { color: textSecondary }]}>
              Aquí puedes gestionar tus preferencias de cookies. Las cookies necesarias no se 
              pueden desactivar ya que son esenciales para el funcionamiento de la aplicación.
            </ThemedText>
          </View>

          {/* Lista de tipos de cookies */}
          {cookieTypes.map((cookie) => (
            <View
              key={cookie.id}
              style={[styles.cookieItem, { backgroundColor: cardBg, borderColor }]}
            >
              <View style={styles.cookieHeader}>
                <ThemedText style={styles.cookieTitle}>{cookie.title}</ThemedText>
                <Switch
                  value={localPrefs[cookie.id as keyof CookiePreferences] as boolean}
                  onValueChange={(value) => {
                    if (!cookie.required) {
                      setLocalPrefs({ ...localPrefs, [cookie.id]: value });
                    }
                  }}
                  disabled={cookie.required}
                  trackColor={{ false: borderColor, true: `${primary}80` }}
                  thumbColor={
                    localPrefs[cookie.id as keyof CookiePreferences]
                      ? primary
                      : '#f4f3f4'
                  }
                />
              </View>
              <ThemedText style={[styles.cookieDescription, { color: textSecondary }]}>
                {cookie.description}
              </ThemedText>
              {cookie.required && (
                <View style={[styles.requiredBadge, { backgroundColor: `${success}20` }]}>
                  <ThemedText style={[styles.requiredText, { color: success }]}>
                    Siempre activas
                  </ThemedText>
                </View>
              )}
            </View>
          ))}

          {/* Enlace a política de privacidad */}
          <Pressable
            style={[styles.linkButton, { borderColor }]}
            onPress={() => {
              onClose();
              router.push('/privacy-policy');
            }}
          >
            <IconSymbol name="doc.text.fill" size={20} color={primary} />
            <ThemedText style={[styles.linkText, { color: primary }]}>
              Ver Política de Privacidad completa
            </ThemedText>
            <IconSymbol name="chevron.right" size={16} color={primary} />
          </Pressable>

          {/* Información adicional */}
          <View style={styles.additionalInfo}>
            <ThemedText style={[styles.additionalTitle, { color: textSecondary }]}>
              Más información
            </ThemedText>
            <ThemedText style={[styles.additionalText, { color: textSecondary }]}>
              Puedes cambiar tus preferencias en cualquier momento desde Configuración {'>'} Privacidad.
              Para más información sobre cómo tratamos tus datos, consulta nuestra Política de Privacidad.
            </ThemedText>
          </View>
        </ScrollView>

        {/* Footer con botones */}
        <View style={[styles.modalFooter, { borderTopColor: borderColor, backgroundColor }]}>
          <Pressable
            style={[styles.footerButton, styles.rejectAllButton, { borderColor }]}
            onPress={async () => {
              setLocalPrefs({
                ...localPrefs,
                functional: false,
                analytics: false,
                marketing: false,
              });
              await onSave({
                functional: false,
                analytics: false,
                marketing: false,
              });
            }}
          >
            <ThemedText style={[styles.footerButtonText, { color: textColor }]}>
              Rechazar opcionales
            </ThemedText>
          </Pressable>

          <Pressable
            style={[styles.footerButton, styles.saveButton, { backgroundColor: primary }]}
            onPress={handleSave}
          >
            <ThemedText style={[styles.footerButtonText, { color: '#FFFFFF' }]}>
              Guardar preferencias
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Banner styles
  bannerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  bannerContent: {
    padding: Spacing.md,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  bannerText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  bannerButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  bannerButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsButton: {
    borderWidth: 1,
  },
  rejectButton: {
    borderWidth: 1,
  },
  acceptButton: {},
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: Spacing.md,
  },
  infoCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  cookieItem: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  cookieHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  cookieTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cookieDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  requiredBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  requiredText: {
    fontSize: 12,
    fontWeight: '500',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  additionalInfo: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  additionalTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  additionalText: {
    fontSize: 13,
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectAllButton: {
    borderWidth: 1,
  },
  saveButton: {},
  footerButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
