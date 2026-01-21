import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Modal, Platform } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';
import { Client } from '@/types';

interface ClientMapProps {
  clients: Client[];
  onClientSelect?: (client: Client) => void;
}

interface GeocodedClient extends Client {
  lat?: number;
  lng?: number;
}

/**
 * Componente de mapa de clientes para webapp
 * Usa Leaflet para mostrar ubicaciones de clientes
 */
export function ClientMap({ clients, onClientSelect }: ClientMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [geocodedClients, setGeocodedClients] = useState<GeocodedClient[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  const primary = useThemeColor({}, 'tint');
  const cardBg = useThemeColor({}, 'cardBackground');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  // Solo funciona en web
  if (Platform.OS !== 'web') {
    return (
      <View style={styles.notSupported}>
        <IconSymbol name="map" size={48} color={textSecondary} />
        <ThemedText style={[styles.notSupportedText, { color: textSecondary }]}>
          El mapa solo está disponible en la versión web
        </ThemedText>
      </View>
    );
  }

  useEffect(() => {
    // Cargar Leaflet dinámicamente
    const loadLeaflet = async () => {
      try {
        // Añadir CSS de Leaflet
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        // Cargar Leaflet JS
        if (!(window as any).L) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Error cargando Leaflet'));
            document.head.appendChild(script);
          });
        }

        initializeMap();
      } catch (error) {
        setMapError('Error al cargar el mapa');
        setIsLoading(false);
      }
    };

    loadLeaflet();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const initializeMap = () => {
    if (!mapContainerRef.current || mapRef.current) return;

    const L = (window as any).L;
    
    // Crear mapa centrado en España
    const map = L.map(mapContainerRef.current).setView([40.4168, -3.7038], 6);
    
    // Añadir capa de tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    mapRef.current = map;
    setIsLoading(false);

    // Geocodificar clientes
    geocodeClients();
  };

  const geocodeClients = async () => {
    const L = (window as any).L;
    if (!L || !mapRef.current) return;

    const geocoded: GeocodedClient[] = [];
    const bounds: [number, number][] = [];

    for (const client of clients) {
      // Construir dirección completa
      const address = buildAddress(client);
      if (!address) continue;

      try {
        // Usar Nominatim para geocodificación (gratis, pero con límite de uso)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
          { headers: { 'User-Agent': 'PianoEmotionManager/1.0' } }
        );
        
        const data = await response.json();
        
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          
          geocoded.push({ ...client, lat, lng });
          bounds.push([lat, lng]);

          // Añadir marcador
          const marker = L.marker([lat, lng])
            .addTo(mapRef.current)
            .bindPopup(`
              <strong>${client.name}</strong><br/>
              ${client.city || ''}<br/>
              <small>${client.phone || ''}</small>
            `);

          marker.on('click', () => {
            setSelectedClient(client);
          });
        }

        // Esperar un poco entre peticiones para no sobrecargar Nominatim
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
      }
    }

    setGeocodedClients(geocoded);

    // Ajustar vista para mostrar todos los marcadores
    if (bounds.length > 0) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  const buildAddress = (client: Client): string | null => {
    const parts: string[] = [];
    
    if (client.street) {
      parts.push(client.street);
      if (client.streetNumber) parts[0] += ` ${client.streetNumber}`;
    }
    if (client.city) parts.push(client.city);
    if (client.province) parts.push(client.province);
    if (client.postalCode) parts.push(client.postalCode);
    
    // Añadir país por defecto
    parts.push('España');
    
    return parts.length > 1 ? parts.join(', ') : null;
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(null);
    if (onClientSelect) {
      onClientSelect(client);
    }
  };

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ThemedText>Cargando mapa...</ThemedText>
        </View>
      )}
      
      {mapError && (
        <View style={styles.errorOverlay}>
          <IconSymbol name="exclamationmark.triangle" size={32} color="#ff6b6b" />
          <ThemedText style={styles.errorText}>{mapError}</ThemedText>
        </View>
      )}

      <div 
        ref={mapContainerRef as any} 
        style={{ width: '100%', height: '100%', minHeight: 400 }} 
      />

      {/* Leyenda */}
      <View style={[styles.legend, { backgroundColor: cardBg }]}>
        <ThemedText style={styles.legendTitle}>
          {geocodedClients.length} de {clients.length} clientes ubicados
        </ThemedText>
      </View>

      {/* Modal de cliente seleccionado */}
      <Modal
        visible={selectedClient !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedClient(null)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { backgroundColor: cardBg }]}>
            {selectedClient && (
              <>
                <View style={styles.modalHeader}>
                  <ThemedText style={styles.modalTitle}>{selectedClient.name}</ThemedText>
                  <Pressable onPress={() => setSelectedClient(null)}>
                    <IconSymbol name="xmark.circle.fill" size={28} color={textSecondary} />
                  </Pressable>
                </View>

                <View style={styles.clientInfo}>
                  {selectedClient.phone && (
                    <View style={styles.infoRow}>
                      <IconSymbol name="phone" size={16} color={primary} />
                      <ThemedText style={styles.infoText}>{selectedClient.phone}</ThemedText>
                    </View>
                  )}
                  {selectedClient.email && (
                    <View style={styles.infoRow}>
                      <IconSymbol name="envelope" size={16} color={primary} />
                      <ThemedText style={styles.infoText}>{selectedClient.email}</ThemedText>
                    </View>
                  )}
                  {selectedClient.city && (
                    <View style={styles.infoRow}>
                      <IconSymbol name="mappin" size={16} color={primary} />
                      <ThemedText style={styles.infoText}>
                        {[selectedClient.street, selectedClient.city, selectedClient.province]
                          .filter(Boolean)
                          .join(', ')}
                      </ThemedText>
                    </View>
                  )}
                </View>

                <Pressable
                  style={[styles.viewButton, { backgroundColor: primary }]}
                  onPress={() => handleClientSelect(selectedClient)}
                >
                  <ThemedText style={styles.viewButtonText}>Ver cliente</ThemedText>
                </Pressable>
              </>
            )}
          </ThemedView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    minHeight: 400,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1000,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000,
  },
  errorText: {
    marginTop: Spacing.sm,
    color: '#ff6b6b',
  },
  notSupported: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  notSupportedText: {
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  legend: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  clientInfo: {
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  infoText: {
    fontSize: 14,
  },
  viewButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ClientMap;
