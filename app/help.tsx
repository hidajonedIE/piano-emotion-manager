import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { Accordion } from '@/components/accordion';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';

interface HelpSection {
  id: string;
  title: string;
  icon: string;
  iconColor: string;
  content: HelpItem[];
}

interface HelpItem {
  question: string;
  answer: string;
}

const helpSections: HelpSection[] = [
  {
    id: 'getting-started',
    title: 'Primeros Pasos',
    icon: 'star.fill',
    iconColor: '#F59E0B',
    content: [
      {
        question: '¿Cómo empiezo a usar la aplicación?',
        answer: 'Te recomendamos seguir estos pasos:\n\n1. Configura tus datos fiscales en Módulos → Datos Fiscales\n2. Define tus tarifas en Módulos → Tarifas\n3. Añade tu primer cliente desde Acciones Rápidas\n4. Registra los pianos de ese cliente\n5. Comienza a registrar servicios',
      },
      {
        question: '¿Qué significan las secciones del Dashboard?',
        answer: '• Acciones Rápidas: Botones para crear clientes, pianos, servicios y citas rápidamente\n• Este Mes: Resumen de servicios e ingresos del mes actual\n• Módulos: Acceso a todas las funciones de la app\n• Últimos Servicios: Historial de tus servicios más recientes',
      },
    ],
  },
  {
    id: 'clients',
    title: 'Gestión de Clientes',
    icon: 'person.2.fill',
    iconColor: '#3B82F6',
    content: [
      {
        question: '¿Cómo añado un nuevo cliente?',
        answer: 'Puedes añadir un cliente de dos formas:\n\n1. Desde el Dashboard: Toca "Nuevo Cliente" en Acciones Rápidas\n2. Desde la pestaña Clientes: Toca el botón + en la esquina\n\nRellena el nombre (obligatorio) y los datos de contacto que tengas disponibles.',
      },
      {
        question: '¿Puedo eliminar un cliente?',
        answer: 'Sí, pero ten en cuenta que al eliminar un cliente también se eliminarán todos sus pianos y servicios asociados. Esta acción no se puede deshacer.\n\nPara eliminar: Abre la ficha del cliente → Toca Eliminar → Confirma la acción.',
      },
      {
        question: '¿Cómo busco un cliente específico?',
        answer: 'En la pestaña Clientes, utiliza la barra de búsqueda en la parte superior. Puedes buscar por nombre, teléfono o email.',
      },
      {
        question: '¿Cómo funciona la validación de NIF/CIF?',
        answer: 'El campo NIF/CIF valida automáticamente el formato español:\n\n• NIF: 8 dígitos + letra (ej: 12345678Z)\n• NIE: X/Y/Z + 7 dígitos + letra (ej: X1234567L)\n• CIF: Letra + 7 dígitos + dígito/letra (ej: B12345678)\n\n✅ Icono verde: Formato válido\n❌ Icono rojo: Formato inválido con mensaje de error',
      },
      {
        question: '¿Cómo gestiono la dirección de envío?',
        answer: 'En la ficha del cliente hay dos secciones de dirección:\n\n• Dirección Fiscal: Para facturas\n• Dirección de Envío: Para entregas\n\nUsa el botón "Copiar fiscal" para copiar automáticamente la dirección fiscal a la de envío si son iguales.',
      },
      {
        question: '¿Qué tipos de cliente existen?',
        answer: '• Particular: Clientes individuales\n• Estudiante: Alumnos de música\n• Profesional: Pianistas profesionales\n• Escuela: Academias de música\n• Conservatorio: Instituciones oficiales\n• Sala de Conciertos: Auditorios y teatros',
      },
    ],
  },
  {
    id: 'pianos',
    title: 'Gestión de Pianos',
    icon: 'pianokeys',
    iconColor: '#8B5CF6',
    content: [
      {
        question: '¿Cómo registro un piano?',
        answer: 'Primero debes tener al menos un cliente registrado. Luego:\n\n1. Toca "Nuevo Piano" en Acciones Rápidas o en la pestaña Pianos\n2. Selecciona el cliente propietario\n3. Introduce la marca, modelo y tipo de piano\n4. Añade el número de serie si lo conoces\n5. Guarda el piano',
      },
      {
        question: '¿Qué significan los indicadores de color?',
        answer: '🔴 Rojo: Piano que requiere atención urgente\n🟡 Amarillo: Piano con mantenimiento próximo recomendado\n🟢 Verde: Piano en buen estado\n\nEstos indicadores se calculan automáticamente según el historial de servicios.',
      },
      {
        question: '¿Cómo veo el historial de un piano?',
        answer: 'Abre la ficha del piano tocando sobre él en la lista. En la parte inferior verás el historial completo de todos los servicios realizados en ese instrumento.',
      },
    ],
  },
  {
    id: 'services',
    title: 'Registro de Servicios',
    icon: 'wrench.and.screwdriver.fill',
    iconColor: '#10B981',
    content: [
      {
        question: '¿Cómo registro un servicio?',
        answer: '1. Toca "Nuevo Servicio" en Acciones Rápidas o en la pestaña Servicios\n2. Selecciona el piano atendido\n3. Elige el tipo de servicio (afinación, reparación, etc.)\n4. Introduce la fecha y el precio\n5. Añade observaciones técnicas\n6. Guarda el servicio',
      },
      {
        question: '¿Qué tipos de servicio puedo registrar?',
        answer: '• Afinación: Ajuste de la tensión de las cuerdas\n• Regulación: Ajuste del mecanismo del teclado\n• Entonación: Ajuste del timbre de los martillos\n• Reparación: Arreglo de componentes dañados\n• Mantenimiento: Revisión general y limpieza\n• Otro: Cualquier otro tipo de servicio',
      },
      {
        question: '¿Qué debo incluir en las observaciones?',
        answer: 'Te recomendamos incluir:\n\n• Estado general del piano al llegar\n• Problemas detectados durante el servicio\n• Trabajos realizados\n• Recomendaciones para el cliente\n• Próximo mantenimiento sugerido\n\nEstas notas son muy valiosas para el seguimiento a largo plazo.',
      },
    ],
  },
  {
    id: 'agenda',
    title: 'Agenda y Citas',
    icon: 'calendar',
    iconColor: '#EC4899',
    content: [
      {
        question: '¿Cómo programo una cita?',
        answer: '1. Ve a la pestaña Agenda o toca "Nueva Cita" en Acciones Rápidas\n2. Selecciona el cliente\n3. Opcionalmente, selecciona el piano a atender\n4. Elige la fecha y hora\n5. Indica el tipo de servicio previsto\n6. Guarda la cita',
      },
      {
        question: '¿Puedo convertir una cita en servicio?',
        answer: 'Sí. Una vez realizada la cita:\n\n1. Abre la cita en la agenda\n2. Toca "Registrar Servicio"\n3. Los datos se rellenarán automáticamente\n4. Añade el precio y las observaciones\n5. Guarda el servicio',
      },
      {
        question: '¿Cómo uso el calendario mensual/semanal?',
        answer: 'En la pestaña Agenda, toca el botón de calendario en la esquina superior derecha para alternar entre:\n\n• Vista Mensual: Visión general del mes con puntos indicando días con citas\n• Vista Semanal: Detalle de la semana con horarios de cada cita\n\nUsa las flechas < > para navegar entre meses/semanas y el botón "Hoy" para volver a la fecha actual.',
      },
      {
        question: '¿Cómo veo estadísticas de meses anteriores?',
        answer: 'En el Dashboard, la sección "Este Mes" te permite navegar entre meses:\n\n• Usa las flechas < > para ver meses anteriores o futuros\n• Toca "Hoy" para volver al mes actual\n• Toca el icono de calendario para ir directamente a la Agenda\n\nLas estadísticas (servicios, ingresos) se actualizan según el mes seleccionado.',
      },
    ],
  },
  {
    id: 'notifications',
    title: 'Notificaciones',
    icon: 'bell.fill',
    iconColor: '#EF4444',
    content: [
      {
        question: '¿Cómo activo las notificaciones?',
        answer: 'Ve a Configuración → Notificaciones y activa las opciones que desees:\n\n• Recordatorios de citas: Te avisa antes de cada servicio programado\n• Alertas de stock bajo: Te notifica cuando un material está por debajo del mínimo\n\nLa app te pedirá permiso para enviar notificaciones la primera vez.',
      },
      {
        question: '¿Cuánto tiempo antes me avisa de una cita?',
        answer: 'Puedes configurar el tiempo de antelación en Configuración → Notificaciones:\n\n• 15 minutos antes\n• 30 minutos antes\n• 1 hora antes\n• 2 horas antes\n\nElige el que mejor se adapte a tu rutina de trabajo.',
      },
      {
        question: '¿Qué son los recordatorios de mantenimiento?',
        answer: 'Puedes configurar un intervalo de mantenimiento para cada piano (ej: cada 6 meses). La app te recordará automáticamente cuando se acerque la fecha del próximo servicio recomendado.\n\nConfigura el intervalo en la ficha de cada piano.',
      },
    ],
  },
  {
    id: 'inventory',
    title: 'Inventario',
    icon: 'shippingbox.fill',
    iconColor: '#F97316',
    content: [
      {
        question: '¿Cómo gestiono mi inventario?',
        answer: 'Accede a Módulos → Inventario desde el Dashboard. Aquí puedes:\n\n• Ver todos tus materiales\n• Añadir nuevos materiales\n• Actualizar cantidades\n• Configurar alertas de stock mínimo\n• Asignar proveedores a cada material',
      },
      {
        question: '¿Qué son las alertas de stock bajo?',
        answer: 'Cuando configuras un stock mínimo para un material y la cantidad actual está por debajo de ese nivel, aparecerá una alerta en el Dashboard para recordarte que debes reponerlo.\n\n🟡 Amarillo: Stock bajo (cerca del mínimo)\n🔴 Rojo: Sin stock (agotado)',
      },
      {
        question: '¿Cómo contacto rápidamente con un proveedor?',
        answer: 'Cuando visualizas un material que tiene proveedor asignado, aparecerán botones de contacto rápido:\n\n• Botón "Llamar": Abre la app de teléfono con el número del proveedor\n• Botón "Email": Abre el correo con el asunto ya rellenado con el nombre del material\n\nEstos botones solo aparecen si el proveedor tiene teléfono o email registrado.',
      },
      {
        question: '¿Cómo organizo los materiales por categorías?',
        answer: 'Ve a Módulos → Categorías de Productos para crear y gestionar categorías personalizadas (cuerdas, macillos, fieltros, herramientas, etc.).\n\nAl crear un material, puedes asignarle una categoría. También puedes crear categorías directamente desde el formulario de material con el botón "+".',
      },
    ],
  },
  {
    id: 'suppliers',
    title: 'Proveedores',
    icon: 'building.2.fill',
    iconColor: '#6366F1',
    content: [
      {
        question: '¿Cómo añado un proveedor?',
        answer: 'Ve a Módulos → Proveedores → "+"\n\nRellena los datos:\n• Nombre del proveedor\n• Tipo (Fabricante, Distribuidor, Repuestos, Herramientas, Cuerdas, Otro)\n• Teléfono y email de contacto\n• Dirección\n• Notas adicionales',
      },
      {
        question: '¿Qué tipos de proveedor existen?',
        answer: '• Fabricante: Marcas originales de pianos o componentes\n• Distribuidor: Mayoristas y distribuidores\n• Repuestos: Especialistas en piezas de recambio\n• Herramientas: Proveedores de utillaje profesional\n• Cuerdas: Especialistas en cuerdas de piano\n• Otro: Cualquier otro tipo de proveedor',
      },
      {
        question: '¿Cómo vinculo un proveedor a un material?',
        answer: 'Al crear o editar un material en el inventario, selecciona el proveedor en el campo "Proveedor". También puedes añadir el código de referencia del proveedor para facilitar los pedidos.',
      },
    ],
  },
  {
    id: 'quotes',
    title: 'Presupuestos',
    icon: 'doc.plaintext',
    iconColor: '#9333EA',
    content: [
      {
        question: '¿Cómo creo un presupuesto?',
        answer: 'Ve a Módulos → Presupuestos → "+"\n\n1. Selecciona el cliente\n2. Opcionalmente selecciona el piano\n3. Usa una plantilla predefinida o añade conceptos manualmente\n4. Revisa los totales y condiciones\n5. Guarda el presupuesto\n\nEl presupuesto se genera con número correlativo y fecha de validez.',
      },
      {
        question: '¿Qué plantillas de presupuesto hay disponibles?',
        answer: 'Incluimos plantillas predefinidas para:\n\n• Afinación Estándar\n• Afinación + Regulación\n• Reparación Menor\n• Mantenimiento Completo\n• Evaluación / Peritaje\n• Transporte de Piano\n\nPuedes crear tus propias plantillas personalizadas.',
      },
      {
        question: '¿Cómo envío un presupuesto al cliente?',
        answer: 'Desde la ficha del presupuesto:\n\n1. Pulsa "Marcar como enviado"\n2. El estado cambiará a "Enviado"\n3. Puedes generar PDF para enviar por email o WhatsApp\n\nEl cliente podrá revisar el presupuesto con todos los detalles.',
      },
      {
        question: '¿Qué estados puede tener un presupuesto?',
        answer: '• Borrador: En preparación\n• Enviado: Pendiente de respuesta del cliente\n• Aceptado: Cliente ha aceptado\n• Rechazado: Cliente ha declinado\n• Expirado: Ha pasado la fecha de validez\n• Convertido: Se ha generado factura\n\nPuedes cambiar el estado desde la ficha del presupuesto.',
      },
      {
        question: '¿Cómo convierto un presupuesto en factura?',
        answer: 'Cuando el cliente acepta el presupuesto:\n\n1. Marca el presupuesto como "Aceptado"\n2. Pulsa "Convertir a Factura"\n3. Se creará automáticamente una factura con todos los conceptos\n4. El presupuesto quedará marcado como "Convertido"\n\nLa factura mantendrá la referencia al presupuesto original.',
      },
    ],
  },
  {
    id: 'invoices',
    title: 'Facturación',
    icon: 'doc.text.fill',
    iconColor: '#EC4899',
    content: [
      {
        question: '¿Cómo creo una factura?',
        answer: 'Ve a Módulos → Facturas → "+"\n\n1. Selecciona el cliente\n2. Añade conceptos manualmente o importa un servicio\n3. Revisa los totales (base, IVA, total)\n4. Guarda la factura\n\nLa factura se genera automáticamente con número correlativo.',
      },
      {
        question: '¿Cómo importo un servicio con sus materiales?',
        answer: 'En el formulario de factura, junto al botón "Añadir" verás el botón verde "Importar servicio".\n\nAl pulsarlo:\n1. Selecciona un servicio del cliente\n2. Se añadirá automáticamente el servicio como concepto\n3. Todos los materiales usados se añadirán como conceptos adicionales\n\nCada material incluye cantidad, precio unitario y total.',
      },
      {
        question: '¿Cómo configuro mis datos fiscales?',
        answer: 'Ve a Módulos → Datos Fiscales y rellena:\n\n• Nombre o razón social\n• NIF/CIF\n• Dirección completa\n• Teléfono y email\n• Logo (opcional)\n\nEstos datos aparecerán en todas tus facturas.',
      },
      {
        question: '¿Cómo envío una factura al cliente?',
        answer: 'Desde la ficha de la factura tienes varias opciones:\n\n• Imprimir/PDF: Genera un documento para imprimir\n• Descargar: Guarda el archivo PDF\n• Enviar por Email: Envía directamente al email del cliente\n\nEl cliente recibirá la factura en formato PDF profesional.',
      },
      {
        question: '¿Qué estados puede tener una factura?',
        answer: '• Borrador: En preparación, aún no enviada\n• Enviada: Pendiente de pago\n• Pagada: Cobrada correctamente\n• Cancelada: Anulada\n\nPuedes cambiar el estado con los botones de acción en la ficha de la factura.',
      },
    ],
  },
  {
    id: 'backup',
    title: 'Copias de Seguridad',
    icon: 'arrow.clockwise.icloud.fill',
    iconColor: '#6366F1',
    content: [
      {
        question: '¿Cómo creo una copia de seguridad?',
        answer: '1. Ve a Configuración → Copia de Seguridad\n2. Toca "Exportar Datos"\n3. Se generará un archivo con todos tus datos\n4. Guarda el archivo en un lugar seguro (nube, ordenador, etc.)',
      },
      {
        question: '¿Cómo restauro una copia de seguridad?',
        answer: '1. Ve a Configuración → Copia de Seguridad\n2. Toca "Importar Datos"\n3. Selecciona el archivo de copia de seguridad\n4. Confirma la restauración\n\n⚠️ Los datos actuales serán reemplazados por los de la copia.',
      },
      {
        question: '¿Con qué frecuencia debo hacer copias?',
        answer: 'Te recomendamos:\n\n• Al menos una vez por semana\n• Antes de actualizar la app\n• Antes de cambiar de dispositivo\n• Después de registrar muchos datos nuevos\n\nGuarda las copias en un lugar diferente a tu dispositivo (nube, email, ordenador).',
      },
    ],
  },
  {
    id: 'tips',
    title: 'Consejos y Trucos',
    icon: 'lightbulb.fill',
    iconColor: '#FBBF24',
    content: [
      {
        question: '¿Cómo actualizo las listas?',
        answer: 'Desliza hacia abajo en cualquier lista para actualizarla (gesto pull-to-refresh). Esto es útil si has hecho cambios en otro dispositivo.',
      },
      {
        question: '¿Puedo usar la app sin internet?',
        answer: 'Sí, Piano Emotion Manager funciona completamente sin conexión. Todos tus datos se guardan localmente en tu dispositivo.',
      },
      {
        question: '¿Cómo transfiero datos a un nuevo dispositivo?',
        answer: '1. En tu dispositivo antiguo: Crea una copia de seguridad\n2. Transfiere el archivo al nuevo dispositivo\n3. Instala la app en el nuevo dispositivo\n4. Restaura la copia de seguridad',
      },
    ],
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [expandedSection, setExpandedSection] = useState<string | null>('getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  
  const cardBg = useThemeColor({}, 'background');
  const inputBg = useThemeColor({ light: '#FFFFFF', dark: '#1F2937' }, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({ light: '#6B7280', dark: '#9CA3AF' }, 'text');
  const borderColor = useThemeColor({ light: '#E5E7EB', dark: '#374151' }, 'background');

  // Filtrar resultados de búsqueda
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    
    const query = searchQuery.toLowerCase().trim();
    const results: { section: string; sectionColor: string; question: string; answer: string }[] = [];
    
    helpSections.forEach((section) => {
      section.content.forEach((item) => {
        if (
          item.question.toLowerCase().includes(query) ||
          item.answer.toLowerCase().includes(query)
        ) {
          results.push({
            section: section.title,
            sectionColor: section.iconColor,
            question: item.question,
            answer: item.answer,
          });
        }
      });
    });
    
    return results;
  }, [searchQuery]);

  const containerStyle = Platform.OS === 'web' 
    ? [styles.container, { background: 'linear-gradient(135deg, #F8F9FA 0%, #EEF2F7 50%, #E8EDF5 100%)' } as any]
    : styles.container;

  const GradientWrapper = Platform.OS === 'web' 
    ? ({ children, style }: { children: React.ReactNode; style: ViewStyle }) => <View style={style}>{children}</View>
    : ({ children, style }: { children: React.ReactNode; style: ViewStyle }) => (
        <LinearGradient
          colors={['#F8F9FA', '#EEF2F7', '#E8EDF5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={style}
        >
          {children}
        </LinearGradient>
      );

  return (
    <GradientWrapper style={containerStyle}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 20),
            paddingBottom: insets.bottom + 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={textColor} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Ayuda</ThemedText>
          <View style={styles.backButton} />
        </View>

        {/* Intro */}
        <View style={[styles.introCard, { backgroundColor: cardBg, borderColor }]}>
          <IconSymbol name="questionmark.circle.fill" size={40} color="#3B82F6" />
          <ThemedText style={[styles.introTitle, { color: textColor }]}>
            ¿Cómo podemos ayudarte?
          </ThemedText>
          <ThemedText style={[styles.introText, { color: textSecondary }]}>
            Explora las secciones de ayuda para aprender a usar todas las funciones de Piano Emotion Manager.
          </ThemedText>
        </View>

        {/* Buscador */}
        <View style={[styles.searchContainer, { backgroundColor: inputBg, borderColor }]}>
          <IconSymbol name="magnifyingglass" size={20} color={textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Buscar en la ayuda..."
            placeholderTextColor={textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <IconSymbol name="xmark.circle.fill" size={20} color={textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Resultados de búsqueda */}
        {searchResults !== null ? (
          <View style={styles.searchResultsContainer}>
            <ThemedText style={[styles.searchResultsTitle, { color: textSecondary }]}>
              {searchResults.length} {searchResults.length === 1 ? 'resultado' : 'resultados'} encontrados
            </ThemedText>
            {searchResults.length === 0 ? (
              <View style={[styles.noResultsCard, { backgroundColor: cardBg, borderColor }]}>
                <IconSymbol name="magnifyingglass" size={40} color={textSecondary} />
                <ThemedText style={[styles.noResultsText, { color: textSecondary }]}>
                  No se encontraron resultados para "{searchQuery}"
                </ThemedText>
              </View>
            ) : (
              searchResults.map((result, index) => (
                <View 
                  key={index} 
                  style={[styles.searchResultCard, { backgroundColor: cardBg, borderColor }]}
                >
                  <View style={[styles.searchResultBadge, { backgroundColor: result.sectionColor + '20' }]}>
                    <ThemedText style={[styles.searchResultBadgeText, { color: result.sectionColor }]}>
                      {result.section}
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.question, { color: textColor }]}>
                    {result.question}
                  </ThemedText>
                  <ThemedText style={[styles.answer, { color: textSecondary }]}>
                    {result.answer}
                  </ThemedText>
                </View>
              ))
            )}
          </View>
        ) : (
          <>
        {/* Help Sections */}
        {helpSections.map((section) => (
          <Accordion
            key={section.id}
            title={section.title}
            icon={section.icon as any}
            iconColor={section.iconColor}
            defaultOpen={section.id === 'getting-started'}
          >
            <View style={styles.questionsContainer}>
              {section.content.map((item, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.questionCard, 
                    { backgroundColor: cardBg, borderColor },
                    index === section.content.length - 1 && { marginBottom: 0 }
                  ]}
                >
                  <ThemedText style={[styles.question, { color: textColor }]}>
                    {item.question}
                  </ThemedText>
                  <ThemedText style={[styles.answer, { color: textSecondary }]}>
                    {item.answer}
                  </ThemedText>
                </View>
              ))}
            </View>
          </Accordion>        ))}
          </>
        )}

        {/* Novedades */}
        <Pressable 
          style={[styles.whatsNewCard, { backgroundColor: cardBg, borderColor }]}
          onPress={() => router.push('/whats-new' as any)}
        >
          <View style={[styles.whatsNewIcon, { backgroundColor: '#8B5CF620' }]}>
            <IconSymbol name="bell.fill" size={28} color="#8B5CF6" />
          </View>
          <View style={styles.whatsNewContent}>
            <ThemedText style={[styles.whatsNewTitle, { color: textColor }]}>
              Novedades
            </ThemedText>
            <ThemedText style={[styles.whatsNewSubtitle, { color: textSecondary }]}>
              Ver últimas funcionalidades añadidas
            </ThemedText>
          </View>
          <IconSymbol name="chevron.right" size={20} color={textSecondary} />
        </Pressable>

        {/* Contact */}
        <View style={[styles.contactCard, { backgroundColor: cardBg, borderColor }]}>
          <IconSymbol name="envelope.fill" size={32} color="#10B981" />
          <ThemedText style={[styles.contactTitle, { color: textColor }]}>
            ¿Necesitas más ayuda?
          </ThemedText>
          <ThemedText style={[styles.contactText, { color: textSecondary }]}>
            Si tienes alguna pregunta que no está respondida aquí, contacta con nosotros:
          </ThemedText>
          <ThemedText style={[styles.contactEmail, { color: '#3B82F6' }]}>
            soporte@pianoemotion.es
          </ThemedText>
        </View>
      </ScrollView>
    </GradientWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
  },
  introCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  introTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  introText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  questionsContainer: {
    gap: Spacing.md,
  },
  questionCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  question: {
    fontSize: 15,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  answer: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    lineHeight: 22,
  },
  contactCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  contactTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  contactText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  contactEmail: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    paddingVertical: Spacing.xs,
  },
  searchResultsContainer: {
    gap: Spacing.md,
  },
  searchResultsTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    marginBottom: Spacing.sm,
  },
  searchResultCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  searchResultBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  searchResultBadgeText: {
    fontSize: 12,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
  },
  noResultsCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: Spacing.md,
  },
  noResultsText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
  },
  whatsNewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  whatsNewIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  whatsNewContent: {
    flex: 1,
    gap: 2,
  },
  whatsNewTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
  },
  whatsNewSubtitle: {
    fontSize: 13,
    fontFamily: 'Montserrat-Regular',
  },
});
