import { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, Modal, ScrollView, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';

interface MenuItem {
  key: string;
  label: string;
  icon: string;
  route: string;
  color: string;
}

const MENU_ITEMS: MenuItem[] = [
  { key: 'home', label: 'Inicio', icon: 'house.fill', route: '/', color: '#6366F1' },
  { key: 'clients', label: 'Clientes', icon: 'person.2.fill', route: '/clients', color: '#6366F1' },
  { key: 'pianos', label: 'Pianos', icon: 'pianokeys', route: '/pianos', color: '#10B981' },
  { key: 'services', label: 'Servicios', icon: 'wrench.fill', route: '/services', color: '#F59E0B' },
  { key: 'agenda', label: 'Agenda', icon: 'calendar', route: '/agenda', color: '#EC4899' },
  { key: 'divider1', label: '', icon: '', route: '', color: '' },
  { key: 'inventory', label: 'Inventario', icon: 'shippingbox.fill', route: '/inventory', color: '#8B5CF6' },
  { key: 'invoices', label: 'Facturas', icon: 'doc.text.fill', route: '/invoices', color: '#3B82F6' },
  { key: 'rates', label: 'Tarifas', icon: 'list.bullet', route: '/rates', color: '#EC4899' },
  { key: 'suppliers', label: 'Proveedores', icon: 'building.2.fill', route: '/suppliers', color: '#F97316' },
  { key: 'stats', label: 'Estadísticas', icon: 'chart.bar.fill', route: '/stats', color: '#10B981' },
  { key: 'divider2', label: '', icon: '', route: '', color: '' },
  { key: 'business', label: 'Datos Fiscales', icon: 'person.text.rectangle.fill', route: '/business-info', color: '#6B7280' },
  { key: 'settings', label: 'Configuración', icon: 'gearshape.fill', route: '/settings', color: '#64748B' },
  { key: 'help', label: 'Ayuda', icon: 'questionmark.circle.fill', route: '/help', color: '#0EA5E9' },
];

export function HamburgerMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  
  const cardBg = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const accent = useThemeColor({}, 'accent');

  const handleMenuPress = useCallback((item: MenuItem) => {
    setIsOpen(false);
    // Pequeño delay para que se cierre el menú antes de navegar
    setTimeout(() => {
      router.push(item.route as any);
    }, 100);
  }, [router]);

  const isActiveRoute = useCallback((route: string) => {
    if (route === '/') return pathname === '/' || pathname === '/index';
    return pathname.startsWith(route);
  }, [pathname]);

  return (
    <>
      {/* Botón hamburguesa */}
      <Pressable
        style={[styles.hamburgerButton, { backgroundColor: cardBg, borderColor }]}
        onPress={() => setIsOpen(true)}
      >
        <IconSymbol name="line.3.horizontal" size={24} color={textColor} />
      </Pressable>

      {/* Modal del menú */}
      <Modal
        visible={isOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setIsOpen(false)}>
          <Pressable 
            style={[styles.menuContainer, { backgroundColor: cardBg }]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header del menú */}
            <View style={[styles.menuHeader, { borderBottomColor: borderColor }]}>
              <ThemedText style={styles.menuTitle}>Menú</ThemedText>
              <Pressable onPress={() => setIsOpen(false)} style={styles.closeButton}>
                <IconSymbol name="xmark" size={24} color={textColor} />
              </Pressable>
            </View>

            {/* Items del menú */}
            <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
              {MENU_ITEMS.map((item) => {
                if (item.key.startsWith('divider')) {
                  return <View key={item.key} style={[styles.divider, { backgroundColor: borderColor }]} />;
                }

                const isActive = isActiveRoute(item.route);

                return (
                  <Pressable
                    key={item.key}
                    style={[
                      styles.menuItem,
                      isActive && { backgroundColor: accent + '15' },
                    ]}
                    onPress={() => handleMenuPress(item)}
                  >
                    <View style={[styles.menuItemIcon, { backgroundColor: item.color + '20' }]}>
                      <IconSymbol name={item.icon as any} size={20} color={item.color} />
                    </View>
                    <ThemedText 
                      style={[
                        styles.menuItemLabel,
                        isActive && { color: accent, fontWeight: '700' }
                      ]}
                    >
                      {item.label}
                    </ThemedText>
                    {isActive && (
                      <View style={[styles.activeIndicator, { backgroundColor: accent }]} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  hamburgerButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuContainer: {
    width: 280,
    maxWidth: '85%',
    height: '100%',
    borderTopLeftRadius: BorderRadius.xl,
    borderBottomLeftRadius: BorderRadius.xl,
    ...Platform.select({
      web: {
        boxShadow: '-4px 0 20px rgba(0,0,0,0.2)',
      },
      default: {
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: -4, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
    }),
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: Spacing.xs,
  },
  menuScroll: {
    flex: 1,
    padding: Spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
    gap: Spacing.md,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  activeIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.sm,
    marginHorizontal: Spacing.md,
  },
});
