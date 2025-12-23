import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
  Platform,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { barcodeScannerService, BarcodeResult } from '@/services/barcode-scanner-service';
import { BorderRadius, Spacing } from '@/constants/theme';

interface BarcodeScannerProps {
  visible: boolean;
  onClose: () => void;
  onScan: (result: BarcodeResult) => void;
  title?: string;
}

export function BarcodeScanner({ visible, onClose, onScan, title }: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [cameraSupported, setCameraSupported] = useState(true);

  const backgroundColor = useThemeColor({}, 'background');
  const cardBg = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primary = useThemeColor({}, 'primary');
  const success = useThemeColor({}, 'success');

  useEffect(() => {
    if (visible && Platform.OS === 'web') {
      initScanner();
    }

    return () => {
      if (Platform.OS === 'web') {
        barcodeScannerService.stopScanner();
      }
    };
  }, [visible]);

  const initScanner = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Verificar soporte de cámara
      const supported = await barcodeScannerService.checkCameraSupport();
      setCameraSupported(supported);

      if (!supported) {
        setError('Tu navegador no soporta acceso a la cámara');
        setIsLoading(false);
        return;
      }

      // Esperar a que el elemento esté disponible
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!scannerRef.current) {
        setError('Error inicializando el escáner');
        setIsLoading(false);
        return;
      }

      await barcodeScannerService.startScanner(scannerRef.current, {
        onDetected: handleDetected,
        onError: (err) => {
          setError(err.message);
        },
      });

      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error iniciando el escáner');
      setIsLoading(false);
    }
  };

  const handleDetected = (result: BarcodeResult) => {
    // Evitar escaneos duplicados rápidos
    if (lastScanned === result.code) return;
    
    setLastScanned(result.code);
    onScan(result);
    
    // Resetear después de 2 segundos para permitir nuevo escaneo
    setTimeout(() => setLastScanned(null), 2000);
  };

  const handleClose = () => {
    barcodeScannerService.stopScanner();
    onClose();
  };

  // Solo funciona en web
  if (Platform.OS !== 'web') {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <View style={styles.notSupported}>
              <IconSymbol name="barcode.viewfinder" size={48} color={textSecondary} />
              <ThemedText style={[styles.notSupportedText, { color: textSecondary }]}>
                El escáner de código de barras solo está disponible en la versión web
              </ThemedText>
              <Pressable
                style={[styles.closeButton, { backgroundColor: primary }]}
                onPress={onClose}
              >
                <ThemedText style={styles.closeButtonText}>Cerrar</ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <ThemedView style={[styles.modalContent, { backgroundColor: cardBg }]}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={styles.headerTitle}>
              {title || 'Escanear Código de Barras'}
            </ThemedText>
            <Pressable onPress={handleClose}>
              <IconSymbol name="xmark.circle.fill" size={28} color={textSecondary} />
            </Pressable>
          </View>

          {/* Scanner area */}
          <View style={styles.scannerContainer}>
            {isLoading && (
              <View style={styles.loadingOverlay}>
                <IconSymbol name="camera" size={32} color={primary} />
                <ThemedText style={[styles.loadingText, { color: textSecondary }]}>
                  Iniciando cámara...
                </ThemedText>
              </View>
            )}

            {error && (
              <View style={styles.errorOverlay}>
                <IconSymbol name="exclamationmark.triangle" size={32} color="#ff6b6b" />
                <ThemedText style={styles.errorText}>{error}</ThemedText>
                <Pressable
                  style={[styles.retryButton, { borderColor: primary }]}
                  onPress={initScanner}
                >
                  <ThemedText style={[styles.retryButtonText, { color: primary }]}>
                    Reintentar
                  </ThemedText>
                </Pressable>
              </View>
            )}

            {lastScanned && (
              <View style={[styles.scannedOverlay, { backgroundColor: success }]}>
                <IconSymbol name="checkmark.circle.fill" size={24} color="#fff" />
                <ThemedText style={styles.scannedText}>
                  Escaneado: {lastScanned}
                </ThemedText>
              </View>
            )}

            <div
              ref={scannerRef as any}
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
              }}
            />

            {/* Overlay con marco de escaneo */}
            {!isLoading && !error && (
              <View style={styles.scanOverlay}>
                <View style={styles.scanFrame}>
                  <View style={[styles.scanCorner, styles.topLeft, { borderColor: primary }]} />
                  <View style={[styles.scanCorner, styles.topRight, { borderColor: primary }]} />
                  <View style={[styles.scanCorner, styles.bottomLeft, { borderColor: primary }]} />
                  <View style={[styles.scanCorner, styles.bottomRight, { borderColor: primary }]} />
                </View>
                <ThemedText style={styles.scanHint}>
                  Centra el código de barras en el recuadro
                </ThemedText>
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <ThemedText style={[styles.footerText, { color: textSecondary }]}>
              Soporta: EAN-13, EAN-8, Code 128, Code 39, UPC
            </ThemedText>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scannerContainer: {
    width: '100%',
    height: 350,
    position: 'relative',
    backgroundColor: '#000',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 10,
  },
  loadingText: {
    marginTop: Spacing.sm,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 10,
    padding: Spacing.lg,
  },
  errorText: {
    color: '#ff6b6b',
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  retryButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  retryButtonText: {
    fontWeight: '500',
  },
  scannedOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
    zIndex: 10,
  },
  scannedText: {
    color: '#fff',
    fontWeight: '500',
  },
  scanOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  scanFrame: {
    width: 250,
    height: 150,
    position: 'relative',
  },
  scanCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanHint: {
    color: '#fff',
    marginTop: Spacing.lg,
    fontSize: 13,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  footer: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
  },
  notSupported: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  notSupportedText: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  closeButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default BarcodeScanner;
