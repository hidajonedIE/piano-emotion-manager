import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type WidgetType = 
  | 'stats_card' | 'chart_line' | 'chart_bar' | 'chart_pie' | 'chart_area'
  | 'calendar' | 'tasks' | 'recent_clients' | 'recent_services' | 'recent_invoices'
  | 'upcoming_appointments' | 'revenue_summary' | 'map' | 'weather' | 'notes'
  | 'shortcuts' | 'team_activity' | 'inventory_alerts' | 'payment_status';

type WidgetSize = 'small' | 'medium' | 'large' | 'wide' | 'tall' | 'full';

interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  size: WidgetSize;
  positionX: number;
  positionY: number;
  config: Record<string, any>;
}

interface Layout {
  id: string;
  name: string;
  widgets: Widget[];
  columns: number;
}

// Catálogo de widgets
const WIDGET_CATALOG = [
  { type: 'stats_card', name: 'Estadísticas', icon: 'stats-chart', color: '#3B82F6' },
  { type: 'chart_line', name: 'Gráfico líneas', icon: 'trending-up', color: '#10B981' },
  { type: 'chart_bar', name: 'Gráfico barras', icon: 'bar-chart', color: '#8B5CF6' },
  { type: 'chart_pie', name: 'Gráfico circular', icon: 'pie-chart', color: '#F59E0B' },
  { type: 'calendar', name: 'Calendario', icon: 'calendar', color: '#EF4444' },
  { type: 'tasks', name: 'Tareas', icon: 'checkbox', color: '#06B6D4' },
  { type: 'recent_clients', name: 'Clientes recientes', icon: 'people', color: '#EC4899' },
  { type: 'recent_services', name: 'Servicios recientes', icon: 'construct', color: '#14B8A6' },
  { type: 'recent_invoices', name: 'Facturas recientes', icon: 'document-text', color: '#6366F1' },
  { type: 'upcoming_appointments', name: 'Próximas citas', icon: 'time', color: '#F97316' },
  { type: 'revenue_summary', name: 'Resumen ingresos', icon: 'cash', color: '#22C55E' },
  { type: 'map', name: 'Mapa clientes', icon: 'map', color: '#0EA5E9' },
  { type: 'shortcuts', name: 'Accesos rápidos', icon: 'apps', color: '#A855F7' },
  { type: 'inventory_alerts', name: 'Alertas inventario', icon: 'alert-circle', color: '#EF4444' },
  { type: 'payment_status', name: 'Estado pagos', icon: 'wallet', color: '#10B981' },
];

// Plantillas predefinidas
const TEMPLATES = [
  { id: 'basic', name: 'Básico', description: 'Dashboard simple con métricas esenciales', icon: 'grid-outline' },
  { id: 'financial', name: 'Financiero', description: 'Enfocado en ingresos y facturación', icon: 'cash-outline' },
  { id: 'operations', name: 'Operaciones', description: 'Gestión diaria de servicios', icon: 'construct-outline' },
  { id: 'team', name: 'Equipo', description: 'Para gestores con equipo', icon: 'people-outline', premium: true },
];

export default function DashboardEditorScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [isEditing, setIsEditing] = useState(false);
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showLayoutSettings, setShowLayoutSettings] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);

  const [layout, setLayout] = useState<Layout>({
    id: '1',
    name: 'Mi Dashboard',
    columns: 3,
    widgets: [
      { id: '1', type: 'stats_card', title: 'Ingresos del mes', size: 'small', positionX: 0, positionY: 0, config: { metric: 'monthly_revenue' } },
      { id: '2', type: 'stats_card', title: 'Servicios', size: 'small', positionX: 1, positionY: 0, config: { metric: 'services_count' } },
      { id: '3', type: 'stats_card', title: 'Clientes', size: 'small', positionX: 2, positionY: 0, config: { metric: 'active_clients' } },
      { id: '4', type: 'upcoming_appointments', title: 'Próximas citas', size: 'medium', positionX: 0, positionY: 1, config: { limit: 5 } },
      { id: '5', type: 'shortcuts', title: 'Accesos rápidos', size: 'small', positionX: 2, positionY: 1, config: {} },
    ],
  });

  const textPrimary = colors.text;
  const textSecondary = colors.textSecondary;
  const background = colors.background;
  const cardBg = colors.card;
  const border = colors.border;

  const getWidgetWidth = (size: WidgetSize): number => {
    const colWidth = (SCREEN_WIDTH - 48) / layout.columns;
    switch (size) {
      case 'small': return colWidth - 8;
      case 'medium': return colWidth * 2 - 8;
      case 'large': return colWidth * 2 - 8;
      case 'wide': return colWidth * 3 - 8;
      case 'tall': return colWidth - 8;
      case 'full': return colWidth * 3 - 8;
      default: return colWidth - 8;
    }
  };

  const getWidgetHeight = (size: WidgetSize): number => {
    switch (size) {
      case 'small': return 100;
      case 'medium': return 100;
      case 'large': return 200;
      case 'wide': return 100;
      case 'tall': return 200;
      case 'full': return 200;
      default: return 100;
    }
  };

  const addWidget = (type: WidgetType) => {
    const catalogItem = WIDGET_CATALOG.find(w => w.type === type);
    const newWidget: Widget = {
      id: Date.now().toString(),
      type,
      title: catalogItem?.name || 'Nuevo widget',
      size: 'small',
      positionX: 0,
      positionY: layout.widgets.length,
      config: {},
    };
    setLayout(prev => ({
      ...prev,
      widgets: [...prev.widgets, newWidget],
    }));
    setShowWidgetPicker(false);
  };

  const removeWidget = (widgetId: string) => {
    Alert.alert(
      'Eliminar widget',
      '¿Estás seguro de que quieres eliminar este widget?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setLayout(prev => ({
              ...prev,
              widgets: prev.widgets.filter(w => w.id !== widgetId),
            }));
          },
        },
      ]
    );
  };

  const applyTemplate = (templateId: string) => {
    // Aplicar plantilla predefinida
    Alert.alert(
      'Aplicar plantilla',
      'Esto reemplazará tu configuración actual. ¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aplicar',
          onPress: () => {
            // Aquí se aplicaría la plantilla desde el backend
            setShowTemplatePicker(false);
            Alert.alert('Éxito', 'Plantilla aplicada correctamente');
          },
        },
      ]
    );
  };

  const renderWidget = (widget: Widget) => {
    const catalogItem = WIDGET_CATALOG.find(w => w.type === widget.type);
    const width = getWidgetWidth(widget.size);
    const height = getWidgetHeight(widget.size);

    return (
      <TouchableOpacity
        key={widget.id}
        style={[
          styles.widget,
          {
            width,
            height,
            backgroundColor: cardBg,
            borderColor: isEditing ? colors.primary : border,
            borderWidth: isEditing ? 2 : 1,
          },
        ]}
        onPress={() => isEditing && setSelectedWidget(widget)}
        onLongPress={() => setIsEditing(true)}
      >
        {isEditing && (
          <TouchableOpacity
            style={[styles.removeButton, { backgroundColor: '#EF4444' }]}
            onPress={() => removeWidget(widget.id)}
          >
            <Ionicons name="close" size={16} color="#fff" />
          </TouchableOpacity>
        )}

        <View style={[styles.widgetIcon, { backgroundColor: `${catalogItem?.color}20` }]}>
          <Ionicons name={catalogItem?.icon as any} size={24} color={catalogItem?.color} />
        </View>
        <ThemedText style={[styles.widgetTitle, { color: textPrimary }]} numberOfLines={1}>
          {widget.title}
        </ThemedText>
        <ThemedText style={[styles.widgetType, { color: textSecondary }]}>
          {catalogItem?.name}
        </ThemedText>

        {isEditing && (
          <View style={styles.resizeHandle}>
            <Ionicons name="resize" size={16} color={textSecondary} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderWidgetPicker = () => (
    <Modal visible={showWidgetPicker} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: border }]}>
            <ThemedText style={[styles.modalTitle, { color: textPrimary }]}>
              Añadir Widget
            </ThemedText>
            <TouchableOpacity onPress={() => setShowWidgetPicker(false)}>
              <Ionicons name="close" size={24} color={textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.widgetList}>
            <View style={styles.widgetGrid}>
              {WIDGET_CATALOG.map((item) => (
                <TouchableOpacity
                  key={item.type}
                  style={[styles.widgetOption, { backgroundColor: cardBg, borderColor: border }]}
                  onPress={() => addWidget(item.type as WidgetType)}
                >
                  <View style={[styles.widgetOptionIcon, { backgroundColor: `${item.color}20` }]}>
                    <Ionicons name={item.icon as any} size={28} color={item.color} />
                  </View>
                  <ThemedText style={[styles.widgetOptionName, { color: textPrimary }]}>
                    {item.name}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderTemplatePicker = () => (
    <Modal visible={showTemplatePicker} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: border }]}>
            <ThemedText style={[styles.modalTitle, { color: textPrimary }]}>
              Elegir Plantilla
            </ThemedText>
            <TouchableOpacity onPress={() => setShowTemplatePicker(false)}>
              <Ionicons name="close" size={24} color={textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.templateList}>
            {TEMPLATES.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={[styles.templateOption, { backgroundColor: cardBg, borderColor: border }]}
                onPress={() => applyTemplate(template.id)}
              >
                <View style={[styles.templateIcon, { backgroundColor: `${colors.primary}20` }]}>
                  <Ionicons name={template.icon as any} size={32} color={colors.primary} />
                </View>
                <View style={styles.templateInfo}>
                  <View style={styles.templateNameRow}>
                    <ThemedText style={[styles.templateName, { color: textPrimary }]}>
                      {template.name}
                    </ThemedText>
                    {template.premium && (
                      <View style={[styles.premiumBadge, { backgroundColor: '#F59E0B' }]}>
                        <ThemedText style={styles.premiumText}>PRO</ThemedText>
                      </View>
                    )}
                  </View>
                  <ThemedText style={[styles.templateDescription, { color: textSecondary }]}>
                    {template.description}
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={20} color={textSecondary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={textPrimary} />
        </TouchableOpacity>
        <ThemedText type="title" style={{ color: textPrimary }}>
          {isEditing ? 'Editar Dashboard' : 'Dashboard'}
        </ThemedText>
        <TouchableOpacity
          onPress={() => setIsEditing(!isEditing)}
          style={[styles.editButton, isEditing && { backgroundColor: colors.primary }]}
        >
          <Ionicons
            name={isEditing ? 'checkmark' : 'create-outline'}
            size={20}
            color={isEditing ? '#fff' : textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Toolbar de edición */}
      {isEditing && (
        <View style={[styles.toolbar, { backgroundColor: cardBg, borderBottomColor: border }]}>
          <TouchableOpacity
            style={[styles.toolbarButton, { backgroundColor: `${colors.primary}20` }]}
            onPress={() => setShowWidgetPicker(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <ThemedText style={{ color: colors.primary, marginLeft: 6 }}>Añadir</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolbarButton, { backgroundColor: `${colors.primary}20` }]}
            onPress={() => setShowTemplatePicker(true)}
          >
            <Ionicons name="layers-outline" size={20} color={colors.primary} />
            <ThemedText style={{ color: colors.primary, marginLeft: 6 }}>Plantillas</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolbarButton, { backgroundColor: `${colors.primary}20` }]}
            onPress={() => setShowLayoutSettings(true)}
          >
            <Ionicons name="settings-outline" size={20} color={colors.primary} />
            <ThemedText style={{ color: colors.primary, marginLeft: 6 }}>Ajustes</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* Grid de widgets */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.widgetsContainer}>
          {layout.widgets.map(renderWidget)}
        </View>

        {isEditing && (
          <TouchableOpacity
            style={[styles.addWidgetButton, { borderColor: colors.primary }]}
            onPress={() => setShowWidgetPicker(true)}
          >
            <Ionicons name="add" size={32} color={colors.primary} />
            <ThemedText style={{ color: colors.primary, marginTop: 8 }}>
              Añadir widget
            </ThemedText>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Modales */}
      {renderWidgetPicker()}
      {renderTemplatePicker()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
  },
  toolbar: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  toolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  widgetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  widget: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    position: 'relative',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  widgetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  widgetTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  widgetType: {
    fontSize: 12,
    marginTop: 2,
  },
  resizeHandle: {
    position: 'absolute',
    bottom: 4,
    right: 4,
  },
  addWidgetButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  widgetList: {
    padding: 16,
  },
  widgetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  widgetOption: {
    width: (SCREEN_WIDTH - 56) / 3,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  widgetOptionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  widgetOptionName: {
    fontSize: 12,
    textAlign: 'center',
  },
  templateList: {
    padding: 16,
  },
  templateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  templateIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateInfo: {
    flex: 1,
    marginLeft: 12,
  },
  templateNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
  },
  premiumBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  templateDescription: {
    fontSize: 13,
    marginTop: 4,
  },
});
