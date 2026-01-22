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
import { useShops, useShopProducts, useShopBlog } from '@/hooks/shop';
import { BlogSection } from './BlogSection';

const { width } = Dimensions.get('window');
const isDesktop = width >= 1024;

type TabType = 'products' | 'blog';

export function ShopViewElegant() {
  const { data: shops, isLoading: shopsLoading } = useShops();
  const shop = shops?.[0];
  
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const { data: products, isLoading: productsLoading } = useShopProducts({
    shopId: shop?.id || 0,
    category: selectedCategory,
  });

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
              selectedCategory === category.id ? null : category.id
            )}
          >
            <Text style={[
              styles.categoryName,
              selectedCategory === category.id && styles.categoryNameActive,
            ]}>
              {category.name}
            </Text>
            <Text style={styles.categoryDescription}>{category.description}</Text>
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
    backgroundColor: '#FAFAFA',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '400',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    textAlign: 'center',
    fontWeight: '300',
  },
  
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingHorizontal: isDesktop ? 60 : 20,
  },
  tab: {
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#1A1A1A',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#666',
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: '#1A1A1A',
    fontWeight: '500',
  },

  // Categories
  categoriesSection: {
    paddingHorizontal: isDesktop ? 60 : 20,
    paddingTop: 48,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '300',
    color: '#1A1A1A',
    marginBottom: 32,
    letterSpacing: -0.5,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  categoryCard: {
    width: isDesktop ? 'calc(25% - 16px)' : 'calc(50% - 16px)',
    minWidth: isDesktop ? 240 : 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 24,
    margin: 8,
    minHeight: 120,
  },
  categoryCardActive: {
    backgroundColor: '#1A1A1A',
    borderColor: '#1A1A1A',
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  categoryNameActive: {
    color: '#FFFFFF',
  },
  categoryDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    fontWeight: '300',
  },

  // Products
  productsSection: {
    paddingHorizontal: isDesktop ? 60 : 20,
    paddingBottom: 32,
  },
  productsLoadingContainer: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  productsLoadingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '300',
  },
  emptyProductsContainer: {
    paddingVertical: 80,
    paddingHorizontal: isDesktop ? 120 : 40,
    alignItems: 'center',
  },
  emptyProductsTitle: {
    fontSize: 32,
    fontWeight: '300',
    color: '#1A1A1A',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  emptyProductsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '300',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -12,
  },
  productCard: {
    width: isDesktop ? 'calc(33.333% - 24px)' : 'calc(50% - 24px)',
    minWidth: isDesktop ? 280 : 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    margin: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: isDesktop ? 320 : 200,
    backgroundColor: '#F5F5F5',
  },
  productInfo: {
    padding: 24,
  },
  productName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
    fontWeight: '300',
  },
  productPrice: {
    fontSize: 20,
    fontWeight: '500',
    color: '#1A1A1A',
    letterSpacing: 0.3,
  },
});
