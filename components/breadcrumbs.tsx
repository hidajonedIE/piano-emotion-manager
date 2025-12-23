/**
 * Componente Breadcrumbs para navegación
 * Muestra la ruta de navegación actual y permite volver a páginas anteriores
 */

import React from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from './themed-text';
import { IconSymbol } from './ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
}

export function Breadcrumbs({ items, showHome = true }: BreadcrumbsProps) {
  const router = useRouter();
  const textSecondary = useThemeColor({}, 'textSecondary');
  const accent = useThemeColor({}, 'accent');

  const allItems: BreadcrumbItem[] = showHome
    ? [{ label: 'Inicio', href: '/', icon: 'house.fill' }, ...items]
    : items;

  const handlePress = (href?: string) => {
    if (href) {
      router.push(href as any);
    }
  };

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {allItems.map((item, index) => {
        const isLast = index === allItems.length - 1;
        const isClickable = !isLast && item.href;

        return (
          <View key={index} style={styles.itemContainer}>
            {index > 0 && (
              <IconSymbol
                name="chevron.right"
                size={12}
                color={textSecondary}
                style={styles.separator}
              />
            )}
            <Pressable
              onPress={() => isClickable && handlePress(item.href)}
              disabled={!isClickable}
              style={({ pressed }) => [
                styles.item,
                isClickable && pressed && styles.itemPressed,
              ]}
            >
              {item.icon && (
                <IconSymbol
                  name={item.icon as any}
                  size={14}
                  color={isLast ? accent : textSecondary}
                  style={styles.icon}
                />
              )}
              <ThemedText
                style={[
                  styles.label,
                  { color: isLast ? accent : textSecondary },
                  isLast && styles.labelActive,
                ]}
                numberOfLines={1}
              >
                {item.label}
              </ThemedText>
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
    marginBottom: Spacing.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  separator: {
    marginHorizontal: Spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  itemPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontSize: 13,
  },
  labelActive: {
    fontWeight: '600',
  },
});
