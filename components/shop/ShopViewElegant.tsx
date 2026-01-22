/**
 * Vista Elegante de Tienda
 * Diseño moderno y profesional para tienda de componentes de piano premium
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { useShops, useShopProducts } from '@/hooks/shop';
import { BlogSection } from './BlogSection';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';

const { width } = Dimensions.get('window');
const isDesktop = width >= 1024;

type TabType = 'products' | 'blog';

export function ShopViewElegant() {
  const { shops, isLoading: shopsLoading } = useShops();
  const shop = shops?.[0];
  
  const [activeTab, setActiveTab] = useState<TabType>('products');
  
  const { products, isLoading: productsLoading, category: selectedCategory, setCategory: setSelectedCategory } = useShopProducts(shop?.id || null);

  const categories = [
    { id: 'macillos', name: 'Macillos', description: 'Macillos de precisión para mecanismos de piano' },
    { id: 'cuerdas', name: 'Cuerdas', description: 'Cuerdas de acero y entorchadas de alta calidad' },
    { id: 'fieltros', name: 'Fieltros', description: 'Fieltros premium para apagadores y mecanismos' },
    { id: 'llaves', name: 'Llaves', description: 'Llaves de afinación profesionales' },
    { id: 'herramientas', name: 'Herramientas', description: 'Herramientas especializadas para técnicos' },
    { id: 'adhesivos', name: 'Adhesivos', description: 'Adhesivos y pegamentos especializados' },
    { id: 'mantenimiento', name: 'Mantenimiento', description: 'Productos de limpieza y mantenimiento' },
    { id: 'clavijas', name: 'Clavijas', description: 'Clavijas de afinación y repuestos' },
  ];

  if (shopsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando tienda...</Text>
      </View>
    );
  }

  if (!shop) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No hay tiendas disponibles</Text>
      </View>
    );
  }

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'products' && styles.tabActive]}
        onPress={() => setActiveTab('products')}
      >
        <Text style={[styles.tabText, activeTab === 'products' && styles.tabTextActive]}>
          Productos
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'blog' && styles.tabActive]}
        onPress={() => setActiveTab('blog')}
      >
        <Text style={[styles.tabText, activeTab === 'blog' && styles.tabTextActive]}>
          Blog
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCategories = () => (
    <View style={styles.categoriesSection}>
      <Text style={styles.sectionTitle}>Categorías</Text>
      <View style={styles.categoriesGrid}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryCard,
              selectedCategory === category.id && styles.categoryCardActive,
            ]}
            onPress={() => setSelectedCategory(
              selectedCategory === category.id ? undefined : category.id
            )}
          >
            <Text style={[
              styles.categoryName,
              selectedCategory === category.id && styles.categoryNameActive,
            ]}>
              {category.name}
            </Text>
            <Text style={[
              styles.categoryDescription,
              selectedCategory === category.id && styles.categoryDescriptionActive,
            ]}>
              {category.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderProducts = () => {
    if (productsLoading) {
      return (
        <View style={styles.productsLoadingContainer}>
          <Text style={styles.productsLoadingText}>Cargando productos...</Text>
        </View>
      );
    }

    if (!products || products.length === 0) {
      return (
        <View style={styles.emptyProductsContainer}>
          <Text style={styles.emptyProductsTitle}>Próximamente</Text>
          <Text style={styles.emptyProductsText}>
            Estamos preparando nuestro catálogo de productos premium.
            {selectedCategory && '\n\nSelecciona otra categoría o explora nuestro blog.'}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.productsSection}>
        <Text style={styles.sectionTitle}>Productos</Text>
        <View style={styles.productsGrid}>
          {products.map((product) => (
            <TouchableOpacity key={product.id} style={styles.productCard}>
              {product.imageUrl && (
                <Image
                  source={{ uri: product.imageUrl }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              )}
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productDescription} numberOfLines={2}>
                  {product.description}
                </Text>
                <Text style={styles.productPrice}>€{product.price}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Tabs */}
      {renderTabs()}

      {/* Content */}
      {activeTab === 'products' ? (
        <>
          {renderCategories()}
          {renderProducts()}
        </>
      ) : (
        <BlogSection shopId={shop.id} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  contentContainer: {
    paddingBottom: Spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    fontWeight: '400',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    padding: Spacing.xxl,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.light.textDisabled,
    textAlign: 'center',
    fontWeight: '300',
  },
  
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingHorizontal: isDesktop ? 60 : Spacing.lg,
  },
  tab: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.light.tint,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '400',
    color: Colors.light.textSecondary,
    letterSpacing: 0.3,
  },
  tabTextActive: {
    color: Colors.light.tint,
    fontWeight: '600',
  },

  // Categories
  categoriesSection: {
    paddingHorizontal: isDesktop ? 60 : Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: Spacing.lg,
    letterSpacing: -0.3,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.sm,
  },
  categoryCard: {
    width: isDesktop ? 'calc(25% - 16px)' : 'calc(50% - 16px)',
    minWidth: isDesktop ? 240 : 150,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    padding: Spacing.lg,
    margin: Spacing.sm,
    minHeight: 120,
  },
  categoryCardActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: Spacing.sm,
    letterSpacing: 0.2,
  },
  categoryNameActive: {
    color: '#FFFFFF',
  },
  categoryDescription: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    fontWeight: '400',
  },
  categoryDescriptionActive: {
    color: 'rgba(255,255,255,0.9)',
  },

  // Products
  productsSection: {
    paddingHorizontal: isDesktop ? 60 : Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  productsLoadingContainer: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  productsLoadingText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    fontWeight: '400',
  },
  emptyProductsContainer: {
    paddingVertical: 80,
    paddingHorizontal: isDesktop ? 120 : Spacing.xxl,
    alignItems: 'center',
  },
  emptyProductsTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: Spacing.md,
    letterSpacing: -0.3,
  },
  emptyProductsText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.md,
  },
  productCard: {
    width: isDesktop ? 'calc(33.333% - 24px)' : 'calc(50% - 24px)',
    minWidth: isDesktop ? 280 : 150,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    margin: Spacing.md,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: isDesktop ? 320 : 200,
    backgroundColor: Colors.light.separator,
  },
  productInfo: {
    padding: Spacing.lg,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: Spacing.sm,
    letterSpacing: 0.2,
  },
  productDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
    fontWeight: '400',
  },
  productPrice: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.accent,
    letterSpacing: 0.2,
  },
});
