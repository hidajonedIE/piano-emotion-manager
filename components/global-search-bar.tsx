import { useState, useCallback, useMemo } from 'react';
import { View, TextInput, StyleSheet, Pressable, Modal, FlatList, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useClients, usePianos, useServices } from '@/hooks/use-storage';
import { BorderRadius, Spacing } from '@/constants/theme';
import { getClientFullName, SERVICE_TYPE_LABELS } from '@/types';

interface SearchResult {
  id: string;
  type: 'client' | 'piano' | 'service';
  title: string;
  subtitle: string;
  extraInfo?: string;
  badge?: string;
  icon: string;
  color: string;
}

export function GlobalSearchBar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const accent = useThemeColor({}, 'accent');

  const { clients } = useClients();
  const { pianos } = usePianos();
  const { services } = useServices();

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase().trim();
    const results: SearchResult[] = [];

    // Buscar en clientes
    clients.forEach((client) => {
      const fullName = getClientFullName(client).toLowerCase();
      const email = (client.email || '').toLowerCase();
      const phone = (client.phone || '').toLowerCase();
      const taxId = (client.taxId || '').toLowerCase();
      
      if (fullName.includes(query) || email.includes(query) || phone.includes(query) || taxId.includes(query)) {
        const clientPianos = pianos.filter(p => p.clientId === client.id);
        const clientServices = services.filter(s => s.clientId === client.id);
        results.push({
          id: client.id,
          type: 'client',
          title: getClientFullName(client),
          subtitle: client.phone ? `Tel: ${client.phone}` : (client.email || 'Sin contacto'),
          extraInfo: `${clientPianos.length} piano${clientPianos.length !== 1 ? 's' : ''} · ${clientServices.length} servicio${clientServices.length !== 1 ? 's' : ''}`,
          badge: client.clientType === 'particular' ? 'Particular' : 
                 client.clientType === 'school' ? 'Escuela' :
                 client.clientType === 'conservatory' ? 'Conservatorio' :
                 client.clientType === 'store' ? 'Tienda' : 'Empresa',
          icon: 'person.fill',
          color: '#6366F1',
        });
      }
    });

    // Buscar en pianos
    pianos.forEach((piano) => {
      const brand = (piano.brand || '').toLowerCase();
      const model = (piano.model || '').toLowerCase();
      const serialNumber = (piano.serialNumber || '').toLowerCase();
      
      if (brand.includes(query) || model.includes(query) || serialNumber.includes(query)) {
        const client = clients.find(c => c.id === piano.clientId);
        const pianoServices = services.filter(s => s.pianoId === piano.id);
        const lastService = pianoServices.length > 0 
          ? pianoServices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
          : null;
        results.push({
          id: piano.id,
          type: 'piano',
          title: `${piano.brand} ${piano.model}`,
          subtitle: client ? `Cliente: ${getClientFullName(client)}` : 'Sin cliente asignado',
          extraInfo: lastService 
            ? `Último servicio: ${new Date(lastService.date).toLocaleDateString('es-ES')}`
            : 'Sin servicios registrados',
          badge: piano.category === 'vertical' ? 'Vertical' : 'Cola',
          icon: 'pianokeys',
          color: '#10B981',
        });
      }
    });

    // Buscar en servicios
    services.forEach((service) => {
      const type = SERVICE_TYPE_LABELS[service.type]?.toLowerCase() || '';
      const notes = (service.notes || '').toLowerCase();
      
      if (type.includes(query) || notes.includes(query)) {
        const client = clients.find(c => c.id === service.clientId);
        const piano = pianos.find(p => p.id === service.pianoId);
        results.push({
          id: service.id,
          type: 'service',
          title: SERVICE_TYPE_LABELS[service.type] || 'Servicio',
          subtitle: client ? `Cliente: ${getClientFullName(client)}` : 'Sin cliente',
          extraInfo: piano 
            ? `${piano.brand} ${piano.model} · ${new Date(service.date).toLocaleDateString('es-ES')}`
            : new Date(service.date).toLocaleDateString('es-ES'),
          badge: service.cost ? `€${service.cost}` : undefined,
          icon: 'wrench.fill',
          color: '#F59E0B',
        });
      }
    });

    return results.slice(0, 10); // Limitar a 10 resultados
  }, [searchQuery, clients, pianos, services]);

  const handleResultPress = useCallback((result: SearchResult) => {
    setSearchQuery('');
    setIsSearchFocused(false);
    
    switch (result.type) {
      case 'client':
        router.push(`/client/${result.id}`);
        break;
      case 'piano':
        router.push(`/piano/${result.id}`);
        break;
      case 'service':
        router.push(`/service/${result.id}`);
        break;
    }
  }, [router]);

  const renderSearchResult = useCallback(({ item }: { item: SearchResult }) => (
    <Pressable
      style={[styles.resultItem, { borderBottomColor: borderColor }]}
      onPress={() => handleResultPress(item)}
    >
      <View style={[styles.resultIcon, { backgroundColor: item.color + '20' }]}>
        <IconSymbol name={item.icon as any} size={20} color={item.color} />
      </View>
      <View style={styles.resultText}>
        <View style={styles.resultHeader}>
          <ThemedText style={styles.resultTitle}>{item.title}</ThemedText>
          {item.badge && (
            <View style={[styles.resultBadge, { backgroundColor: item.color + '20' }]}>
              <ThemedText style={[styles.resultBadgeText, { color: item.color }]}>{item.badge}</ThemedText>
            </View>
          )}
        </View>
        <ThemedText style={[styles.resultSubtitle, { color: textSecondary }]}>{item.subtitle}</ThemedText>
        {item.extraInfo && (
          <ThemedText style={[styles.resultExtraInfo, { color: textSecondary }]}>{item.extraInfo}</ThemedText>
        )}
      </View>
      <IconSymbol name="chevron.right" size={16} color={textSecondary} />
    </Pressable>
  ), [borderColor, textSecondary, handleResultPress]);

  return (
    <View style={styles.container}>
      <View style={[styles.searchContainer, { backgroundColor: cardBg, borderColor }]}>
        <IconSymbol name="magnifyingglass" size={20} color={textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
          placeholder="Buscar..."
          placeholderTextColor={textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <IconSymbol name="xmark.circle.fill" size={20} color={textSecondary} />
          </Pressable>
        )}
      </View>

      {/* Resultados de búsqueda */}
      {isSearchFocused && searchQuery.length > 0 && (
        <View style={[styles.resultsContainer, { backgroundColor: cardBg, borderColor }]}>
          {searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => `${item.type}-${item.id}`}
              style={styles.resultsList}
              keyboardShouldPersistTaps="handled"
            />
          ) : (
            <View style={styles.noResults}>
              <ThemedText style={[styles.noResultsText, { color: textSecondary }]}>
                No se encontraron resultados
              </ThemedText>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 100,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: Platform.OS === 'web' ? Spacing.xs : 0,
  },
  resultsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: Spacing.xs,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    maxHeight: 300,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      },
      default: {
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
    }),
  },
  resultsList: {
    maxHeight: 300,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultText: {
    flex: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  resultBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  resultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  resultSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  resultExtraInfo: {
    fontSize: 11,
    marginTop: 2,
    fontStyle: 'italic',
  },
  noResults: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
  },
});
