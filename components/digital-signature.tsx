import React, { useRef, useState, useEffect } from 'react';
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
import { BorderRadius, Spacing } from '@/constants/theme';

interface DigitalSignatureProps {
  visible: boolean;
  onClose: () => void;
  onSave: (signatureData: string) => void;
  title?: string;
  signerName?: string;
}

export function DigitalSignature({ 
  visible, 
  onClose, 
  onSave, 
  title,
  signerName 
}: DigitalSignatureProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  const backgroundColor = useThemeColor({}, 'background');
  const cardBg = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const primary = useThemeColor({}, 'primary');
  const border = useThemeColor({}, 'border');

  useEffect(() => {
    if (visible && Platform.OS === 'web' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        setContext(ctx);
        clearCanvas();
      }
    }
  }, [visible]);

  const clearCanvas = () => {
    if (canvasRef.current && context) {
      const canvas = canvasRef.current;
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Dibujar línea base
      context.strokeStyle = '#e0e0e0';
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(20, canvas.height - 40);
      context.lineTo(canvas.width - 20, canvas.height - 40);
      context.stroke();
      
      // Resetear estilo para firma
      context.strokeStyle = '#000';
      context.lineWidth = 2;
      
      setHasSignature(false);
    }
  };

  const getCoordinates = (e: any): { x: number; y: number } | null => {
    if (!canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Manejar tanto mouse como touch
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDrawing = (e: any) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords || !context) return;
    
    setIsDrawing(true);
    context.beginPath();
    context.moveTo(coords.x, coords.y);
  };

  const draw = (e: any) => {
    e.preventDefault();
    if (!isDrawing || !context) return;
    
    const coords = getCoordinates(e);
    if (!coords) return;
    
    context.lineTo(coords.x, coords.y);
    context.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleSave = () => {
    if (!canvasRef.current || !hasSignature) return;
    
    const signatureData = canvasRef.current.toDataURL('image/png');
    onSave(signatureData);
    onClose();
  };

  // Solo funciona en web
  if (Platform.OS !== 'web') {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <View style={styles.notSupported}>
              <IconSymbol name="signature" size={48} color={textSecondary} />
              <ThemedText style={[styles.notSupportedText, { color: textSecondary }]}>
                La firma digital solo está disponible en la versión web
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
              {title || 'Firma del Cliente'}
            </ThemedText>
            <Pressable onPress={onClose}>
              <IconSymbol name="xmark.circle.fill" size={28} color={textSecondary} />
            </Pressable>
          </View>

          {/* Información del firmante */}
          {signerName && (
            <View style={[styles.signerInfo, { borderBottomColor: border }]}>
              <IconSymbol name="person" size={16} color={primary} />
              <ThemedText style={[styles.signerName, { color: textSecondary }]}>
                Firmante: <ThemedText style={{ color: textColor }}>{signerName}</ThemedText>
              </ThemedText>
            </View>
          )}

          {/* Área de firma */}
          <View style={[styles.canvasContainer, { borderColor: border }]}>
            <canvas
              ref={canvasRef}
              width={400}
              height={200}
              style={{
                width: '100%',
                height: '100%',
                touchAction: 'none',
                cursor: 'crosshair',
              }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            
            {!hasSignature && (
              <View style={styles.placeholder}>
                <ThemedText style={[styles.placeholderText, { color: textSecondary }]}>
                  Firme aquí
                </ThemedText>
              </View>
            )}
          </View>

          {/* Instrucciones */}
          <ThemedText style={[styles.instructions, { color: textSecondary }]}>
            Dibuje su firma con el dedo o el ratón en el recuadro superior
          </ThemedText>

          {/* Botones */}
          <View style={styles.footer}>
            <Pressable
              style={[styles.clearButton, { borderColor: border }]}
              onPress={clearCanvas}
            >
              <IconSymbol name="arrow.counterclockwise" size={16} color={textSecondary} />
              <ThemedText style={[styles.clearButtonText, { color: textSecondary }]}>
                Borrar
              </ThemedText>
            </Pressable>
            
            <Pressable
              style={[
                styles.saveButton, 
                { backgroundColor: primary },
                !hasSignature && styles.buttonDisabled,
              ]}
              onPress={handleSave}
              disabled={!hasSignature}
            >
              <IconSymbol name="checkmark" size={16} color="#fff" />
              <ThemedText style={styles.saveButtonText}>Guardar Firma</ThemedText>
            </Pressable>
          </View>

          {/* Aviso legal */}
          <ThemedText style={[styles.legalText, { color: textSecondary }]}>
            Al firmar, confirmo que he recibido el servicio descrito y acepto las condiciones.
          </ThemedText>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  signerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: 1,
  },
  signerName: {
    fontSize: 14,
  },
  canvasContainer: {
    margin: Spacing.md,
    borderWidth: 2,
    borderRadius: BorderRadius.md,
    borderStyle: 'dashed',
    overflow: 'hidden',
    position: 'relative',
    height: 200,
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  placeholderText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  instructions: {
    textAlign: 'center',
    fontSize: 12,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  clearButtonText: {
    fontSize: 14,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  legalText: {
    fontSize: 10,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
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

export default DigitalSignature;
