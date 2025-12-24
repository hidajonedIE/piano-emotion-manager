import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Linking, ScrollView } from 'react-native';
import { IconSymbol } from './ui/icon-symbol';

// Categorías de productos que estarán disponibles en la tienda
const PRODUCT_CATEGORIES = [
  {
    id: 'hammers',
    name: 'Macillos',
    icon: '🎹',
    brands: ['Renner'],
    description: 'Macillos de fieltro premium para pianos de cola y verticales',
    comingSoon: true,
  },
  {
    id: 'strings',
    name: 'Cuerdas',
    icon: '🎵',
    brands: ['Röslau'],
    description: 'Cuerdas de acero y entorchadas de máxima calidad',
    comingSoon: true,
  },
  {
    id: 'felts',
    name: 'Fieltros y Paños',
    icon: '🧵',
    brands: ['Hainsworth'],
    description: 'Fieltros técnicos para mecánica y apagadores',
    comingSoon: true,
  },
  {
    id: 'tuning-levers',
    name: 'Llaves de Afinación',
    icon: '🔑',
    brands: [],
    description: 'Llaves de afinación profesionales para técnicos',
    comingSoon: true,
  },
  {
    id: 'tools',
    name: 'Herramientas',
    icon: '🔧',
    brands: ['Jahn', 'Pianotek'],
    description: 'Herramientas profesionales para técnicos de piano',
    comingSoon: true,
  },
  {
    id: 'adhesives',
    name: 'Adhesivos y Colas',
    icon: '💧',
    brands: ['Titebond'],
    description: 'Colas profesionales para madera y reparaciones',
    comingSoon: true,
  },
  {
    id: 'maintenance',
    name: 'Mantenimiento',
    icon: '✨',
    brands: ['Cory', 'Dampp-Chaser'],
    description: 'Productos de limpieza y control de humedad',
    comingSoon: true,
  },
  {
    id: 'pins',
    name: 'Clavijas y Agrafes',
    icon: '🔩',
    brands: ['Klinke'],
    description: 'Clavijas de afinación y agrafes de precisión alemana',
    comingSoon: true,
  },
  {
    id: 'parts',
    name: 'Repuestos',
    icon: '⚙️',
    brands: ['Renner', 'Klinke'],
    description: 'Piezas de recambio originales y compatibles',
    comingSoon: true,
  },
];

// Artículos recientes del blog (se podrían cargar dinámicamente en el futuro)
const RECENT_ARTICLES = [
  {
    id: 1,
    title: 'Endurecimiento de Macillos con Lacas',
    category: 'Macillos',
    date: '12 Dic 2025',
    url: 'https://pianoemotion.es/macillos-endurecimiento-de-macillos-con-lacas-tecnica-avanzada-de-alto-riesgo/',
  },
  {
    id: 2,
    title: 'El Núcleo de Madera del Macillo',
    category: 'Macillos',
    date: '12 Dic 2025',
    url: 'https://pianoemotion.es/macillos-el-nucleo-de-madera-del-macillo-seleccion-preparacion-y-funcion-estructural/',
  },
  {
    id: 3,
    title: 'El Fieltro del Macillo de Piano',
    category: 'Macillos',
    date: '12 Dic 2025',
    url: 'https://pianoemotion.es/macillos-el-fieltro-del-macillo-de-piano-ciencia-de-materiales-acustica-y-propiedades-viscoelasticas/',
  },
];

interface PianoEmotionStoreProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function PianoEmotionStore({ collapsed = false, onToggle }: PianoEmotionStoreProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const openPianoEmotion = () => {
    Linking.openURL('https://www.pianoemotion.es');
  };

  const openArticle = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Pressable style={styles.header} onPress={onToggle}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>🎹</Text>
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Piano Emotion</Text>
            <Text style={styles.headerSubtitle}>Tienda de productos premium</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>Premium</Text>
          </View>
          <IconSymbol name="chevron.right" size={20} color="#7A8B99" />
        </View>
      </Pressable>

      {!collapsed && (
        <View style={styles.content}>
          {/* Banner promocional */}
          <Pressable style={styles.banner} onPress={openPianoEmotion}>
            <View style={styles.bannerGradient}>
              <Text style={styles.bannerTitle}>Marcas Europeas de Prestigio</Text>
              <Text style={styles.bannerSubtitle}>
                Renner • Klinke • Röslau • Hainsworth
              </Text>
              <View style={styles.bannerButton}>
                <Text style={styles.bannerButtonText}>Visitar Tienda</Text>
                <IconSymbol name="arrow.right" size={14} color="#FFFFFF" />
              </View>
            </View>
          </Pressable>

          {/* Categorías de productos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categorías</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesScroll}
              contentContainerStyle={styles.categoriesScrollContent}
            >
              {PRODUCT_CATEGORIES.map((category) => (
                <Pressable
                  key={category.id}
                  style={[
                    styles.categoryCard,
                    selectedCategory === category.id && styles.categoryCardSelected,
                  ]}
                  onPress={() => setSelectedCategory(
                    selectedCategory === category.id ? null : category.id
                  )}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  {category.comingSoon && (
                    <View style={styles.comingSoonBadge}>
                      <Text style={styles.comingSoonText}>Próximamente</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Detalle de categoría seleccionada */}
          {selectedCategory && (
            <View style={styles.categoryDetail}>
              {(() => {
                const category = PRODUCT_CATEGORIES.find(c => c.id === selectedCategory);
                if (!category) return null;
                return (
                  <>
                    <Text style={styles.categoryDetailTitle}>{category.name}</Text>
                    <Text style={styles.categoryDetailDescription}>{category.description}</Text>
                    <View style={styles.brandsContainer}>
                      <Text style={styles.brandsLabel}>Marcas disponibles:</Text>
                      <View style={styles.brandsList}>
                        {category.brands.map((brand, index) => (
                          <View key={index} style={styles.brandTag}>
                            <Text style={styles.brandTagText}>{brand}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </>
                );
              })()}
            </View>
          )}

          {/* Artículos del blog */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Últimos Artículos</Text>
              <Pressable onPress={openPianoEmotion}>
                <Text style={styles.seeAllLink}>Ver todos</Text>
              </Pressable>
            </View>
            {RECENT_ARTICLES.map((article) => (
              <Pressable
                key={article.id}
                style={styles.articleCard}
                onPress={() => openArticle(article.url)}
              >
                <View style={styles.articleContent}>
                  <View style={styles.articleCategoryBadge}>
                    <Text style={styles.articleCategoryText}>{article.category}</Text>
                  </View>
                  <Text style={styles.articleTitle} numberOfLines={2}>
                    {article.title}
                  </Text>
                  <Text style={styles.articleDate}>{article.date}</Text>
                </View>
                <IconSymbol name="arrow.right" size={16} color="#7A8B99" />
              </Pressable>
            ))}
          </View>

          {/* Footer con enlace */}
          <Pressable style={styles.footer} onPress={openPianoEmotion}>
            <Text style={styles.footerText}>www.pianoemotion.es</Text>
            <IconSymbol name="arrow.up.right" size={14} color="#5B9A8B" />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    // Use negative margin to extend beyond Accordion's paddingHorizontal (16px)
    marginHorizontal: -16,
    marginVertical: 8,
    // Add internal padding to compensate
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: 24,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#7A8B99',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  premiumBadge: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  premiumBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    // Padding is now handled by container
  },
  banner: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  bannerGradient: {
    backgroundColor: '#1A1A1A',
    padding: 20,
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: '#D4AF37',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1,
  },
  bannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5B9A8B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  bannerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  seeAllLink: {
    fontSize: 14,
    color: '#5B9A8B',
    fontWeight: '500',
  },
  categoriesScroll: {
    // Removed negative margin that caused content clipping
  },
  categoriesScrollContent: {
    paddingRight: 16,
  },
  categoryCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryCardSelected: {
    borderColor: '#5B9A8B',
    backgroundColor: '#F0F9F7',
  },
  categoryIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  comingSoonBadge: {
    backgroundColor: '#E8EDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 8,
  },
  comingSoonText: {
    fontSize: 10,
    color: '#7A8B99',
    fontWeight: '500',
  },
  categoryDetail: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  categoryDetailTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  categoryDetailDescription: {
    fontSize: 14,
    color: '#5A6978',
    marginBottom: 12,
    lineHeight: 20,
  },
  brandsContainer: {
    marginTop: 8,
  },
  brandsLabel: {
    fontSize: 12,
    color: '#7A8B99',
    marginBottom: 8,
    fontWeight: '500',
  },
  brandsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  brandTag: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  brandTagText: {
    fontSize: 12,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  articleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  articleContent: {
    flex: 1,
  },
  articleCategoryBadge: {
    backgroundColor: '#5B9A8B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  articleCategoryText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  articleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  articleDate: {
    fontSize: 12,
    color: '#7A8B99',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 6,
  },
  footerText: {
    fontSize: 14,
    color: '#5B9A8B',
    fontWeight: '500',
  },
});

export default PianoEmotionStore;
