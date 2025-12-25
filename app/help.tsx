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
    id: 'analytics',
    title: 'Analíticas',
    icon: 'chart.xyaxis.line',
    iconColor: '#0EA5E9',
    content: [
      {
        question: '¿Qué puedo ver en el Dashboard de Analíticas?',
        answer: 'El Dashboard de Analíticas te ofrece:\n\n• Gráficos de ingresos mensuales\n• Evolución de servicios realizados\n• Análisis de clientes activos\n• Comparativas entre períodos\n• Tendencias y proyecciones\n\nPuedes filtrar por mes, trimestre o año.',
      },
      {
        question: '¿Cómo accedo a las analíticas detalladas?',
        answer: 'Desde el Dashboard principal, pulsa en "Analíticas". Encontrarás secciones para:\n\n• Analíticas de Clientes\n• Analíticas de Servicios\n• Analíticas de Ingresos\n• Generador de Reportes\n\nCada sección ofrece métricas específicas y visualizaciones.',
      },
    ],
  },
  {
    id: 'clients_map',
    title: 'Mapa de Clientes',
    icon: 'map.fill',
    iconColor: '#DC2626',
    content: [
      {
        question: '¿Qué es el Mapa de Clientes?',
        answer: 'El Mapa de Clientes muestra la ubicación geográfica de todos tus clientes en un mapa interactivo.\n\nPuedes:\n• Ver la distribución de tu cartera\n• Planificar rutas de visita\n• Identificar zonas con más clientes\n• Acceder a la ficha del cliente tocando su marcador',
      },
      {
        question: '¿Cómo aparecen mis clientes en el mapa?',
        answer: 'Los clientes aparecen automáticamente si tienen dirección registrada.\n\nPara añadir ubicación:\n1. Ve a la ficha del cliente\n2. Completa los campos de dirección\n3. El sistema geocodifica la dirección\n\nAsegúrate de incluir ciudad y código postal para mayor precisión.',
      },
    ],
  },
  {
    id: 'billing_summary',
    title: 'Resumen de Facturación',
    icon: 'dollarsign.circle.fill',
    iconColor: '#059669',
    content: [
      {
        question: '¿Qué información muestra el Resumen de Facturación?',
        answer: 'El Resumen de Facturación ofrece una vista consolidada de:\n\n• Total facturado por mes/año\n• Facturas pendientes de cobro\n• Facturas cobradas\n• Comparativa con períodos anteriores\n• Desglose por tipo de servicio\n\nIdeal para controlar la salud financiera de tu negocio.',
      },
      {
        question: '¿Cómo cambio entre vista mensual y anual?',
        answer: 'En la parte superior del Resumen encontrarás los botones para alternar entre:\n\n• Vista Mensual: Detalle día a día\n• Vista Anual: Resumen mes a mes\n\nTambién puedes navegar entre meses y años con las flechas.',
      },
    ],
  },
  {
    id: 'service_catalog',
    title: 'Catálogo de Servicios',
    icon: 'list.clipboard.fill',
    iconColor: '#7C3AED',
    content: [
      {
        question: '¿Para qué sirve el Catálogo de Servicios?',
        answer: 'El Catálogo de Servicios te permite definir todos los servicios que ofreces con:\n\n• Nombre y descripción\n• Precio base\n• Duración estimada\n• Categoría\n\nAl crear presupuestos o facturas, puedes seleccionar servicios del catálogo para agilizar el proceso.',
      },
      {
        question: '¿Cómo organizo mis servicios en categorías?',
        answer: 'Ve a Categorías de Servicios para crear y gestionar categorías como:\n\n• Afinación\n• Reparación\n• Mantenimiento\n• Restauración\n\nLuego asigna cada servicio a su categoría correspondiente.',
      },
    ],
  },
  {
    id: 'client_portal',
    title: 'Portal de Clientes',
    icon: 'globe',
    iconColor: '#0891B2',
    content: [
      {
        question: '¿Qué es el Portal de Clientes?',
        answer: 'El Portal de Clientes es una página web donde tus clientes pueden:\n\n• Ver sus pianos registrados\n• Consultar historial de servicios\n• Ver próximas citas programadas\n• Solicitar nuevos servicios\n\nCada cliente accede con un enlace único y seguro.',
      },
      {
        question: '¿Cómo comparto el portal con un cliente?',
        answer: 'Desde la ficha del cliente:\n\n1. Pulsa "Compartir Portal"\n2. Se genera un enlace único\n3. Envíalo por WhatsApp o email\n\nEl cliente podrá acceder sin necesidad de registrarse.',
      },
    ],
  },
  {
    id: 'distributor',
    title: 'Panel de Distribuidor',
    icon: 'building.columns.fill',
    iconColor: '#BE185D',
    content: [
      {
        question: '¿Qué es el Panel de Distribuidor?',
        answer: 'El Panel de Distribuidor es una herramienta para gestionar:\n\n• Conexión con WooCommerce\n• Configuración de planes Premium\n• Gestión de técnicos asociados\n• Estadísticas de compras\n\nEsta función está disponible para distribuidores autorizados.',
      },
      {
        question: '¿Cómo conecto mi tienda WooCommerce?',
        answer: 'En el Panel de Distribuidor:\n\n1. Introduce la URL de tu tienda\n2. Añade las claves API de WooCommerce\n3. Pulsa "Probar Conexión"\n\nUna vez conectado, podrás gestionar los planes de los técnicos automáticamente.',
      },
    ],
  },
  {
    id: 'contracts',
    title: 'Contratos de Mantenimiento',
    icon: 'doc.badge.clock.fill',
    iconColor: '#059669',
    content: [
      {
        question: '¿Qué son los contratos de mantenimiento?',
        answer: 'Los contratos de mantenimiento son acuerdos con tus clientes para realizar servicios periódicos a sus pianos.\n\nBeneficios:\n• Ingresos recurrentes garantizados\n• Fidelización de clientes\n• Planificación de trabajo a largo plazo\n• Recordatorios automáticos de vencimiento',
      },
      {
        question: '¿Cómo creo un contrato?',
        answer: 'Ve a Módulos → Contratos → Nuevo:\n\n1. Selecciona el cliente\n2. Selecciona el/los piano(s) incluidos\n3. Define la duración (6 meses, 1 año, etc.)\n4. Establece la frecuencia de servicios\n5. Indica el precio del contrato\n6. Añade condiciones especiales si las hay\n7. Guarda el contrato',
      },
      {
        question: '¿Cómo gestiono las renovaciones?',
        answer: 'El sistema te avisa automáticamente cuando un contrato está próximo a vencer.\n\nOpciones de renovación:\n• Renovar con las mismas condiciones\n• Renovar con nuevas condiciones\n• No renovar (el contrato pasa a "Finalizado")\n\nPuedes configurar cuántos días antes quieres recibir el aviso.',
      },
      {
        question: '¿Qué estados puede tener un contrato?',
        answer: '• Borrador: En preparación\n• Activo: Vigente y en curso\n• Próximo a vencer: A punto de finalizar\n• Vencido: Pendiente de renovación\n• Finalizado: Terminado sin renovación\n• Cancelado: Anulado antes de tiempo',
      },
    ],
  },
  {
    id: 'predictions',
    title: 'Predicciones con IA',
    icon: 'brain.head.profile',
    iconColor: '#8B5CF6',
    content: [
      {
        question: '¿Qué son las predicciones con IA?',
        answer: 'El módulo de Predicciones usa inteligencia artificial para analizar tus datos históricos y predecir:\n\n• Ingresos futuros estimados\n• Clientes con riesgo de abandono\n• Pianos que necesitarán servicio pronto\n• Mejores momentos para campañas\n• Tendencias de tu negocio',
      },
      {
        question: '¿Cómo funcionan las predicciones?',
        answer: 'El sistema analiza:\n\n• Historial de servicios realizados\n• Frecuencia de mantenimiento por cliente\n• Patrones estacionales de tu negocio\n• Comportamiento de pago de clientes\n\nCuantos más datos tengas registrados, más precisas serán las predicciones.',
      },
      {
        question: '¿Qué es el "riesgo de abandono"?',
        answer: 'Es una puntuación que indica la probabilidad de que un cliente deje de usar tus servicios.\n\nSe calcula basándose en:\n• Tiempo desde el último servicio\n• Frecuencia histórica de servicios\n• Cambios en el patrón de contratación\n\nTe ayuda a identificar clientes que necesitan atención especial.',
      },
      {
        question: '¿Necesito configurar algo?',
        answer: 'No. Las predicciones se generan automáticamente con los datos que ya tienes en la app.\n\nPara mejores resultados:\n• Registra todos los servicios realizados\n• Mantén actualizados los datos de clientes\n• Usa la app durante al menos 3-6 meses\n\nLas predicciones mejoran con el tiempo.',
      },
    ],
  },
  {
    id: 'rates',
    title: 'Tarifas y Precios',
    icon: 'list.bullet',
    iconColor: '#EC4899',
    content: [
      {
        question: '¿Para qué sirve el módulo de Tarifas?',
        answer: 'El módulo de Tarifas te permite definir tus precios estándar para cada tipo de servicio.\n\nVentajas:\n• Precios consistentes en presupuestos y facturas\n• Cálculo automático de importes\n• Diferentes tarifas por tipo de cliente\n• Historial de cambios de precios',
      },
      {
        question: '¿Cómo configuro mis tarifas?',
        answer: 'Ve a Módulos → Tarifas:\n\n1. Toca "Nueva Tarifa" o edita una existente\n2. Selecciona el tipo de servicio\n3. Indica el precio base\n4. Opcionalmente, define precios especiales para:\n   • Estudiantes\n   • Escuelas\n   • Conservatorios\n5. Guarda la tarifa',
      },
      {
        question: '¿Puedo tener diferentes precios por zona?',
        answer: 'Sí. Puedes crear tarifas específicas por:\n\n• Código postal\n• Ciudad\n• Distancia desde tu ubicación\n\nEl sistema aplicará automáticamente la tarifa correcta según la dirección del cliente.',
      },
      {
        question: '¿Cómo aplico descuentos?',
        answer: 'Hay varias formas de aplicar descuentos:\n\n• En la tarifa: Define un % de descuento para ciertos tipos de cliente\n• En el presupuesto: Aplica descuento manual al crear\n• En el contrato: Incluye descuento por fidelidad\n\nLos descuentos se reflejan automáticamente en facturas.',
      },
    ],
  },
  {
    id: 'business_data',
    title: 'Datos Fiscales',
    icon: 'person.fill',
    iconColor: '#6B7280',
    content: [
      {
        question: '¿Por qué debo configurar mis datos fiscales?',
        answer: 'Tus datos fiscales aparecen en:\n\n• Facturas emitidas\n• Presupuestos\n• Contratos\n• Emails enviados a clientes\n\nEs obligatorio para emitir facturas legales en España.',
      },
      {
        question: '¿Qué datos debo introducir?',
        answer: 'Ve a Módulos → Datos Fiscales y completa:\n\n• Nombre o razón social\n• NIF/CIF\n• Dirección fiscal completa\n• Código postal y ciudad\n• Teléfono de contacto\n• Email profesional\n• Logo (opcional pero recomendado)',
      },
      {
        question: '¿Cómo añado mi logo?',
        answer: 'En Datos Fiscales, toca el área del logo:\n\n1. Selecciona una imagen de tu galería\n2. Ajusta el recorte si es necesario\n3. Guarda los cambios\n\nFormatos recomendados: PNG o JPG\nTamaño recomendado: 500x500 píxeles mínimo',
      },
      {
        question: '¿Puedo tener varios perfiles fiscales?',
        answer: 'Actualmente solo se soporta un perfil fiscal por cuenta.\n\nSi trabajas con varias razones sociales, te recomendamos crear cuentas separadas para cada una.',
      },
    ],
  },
  {
    id: 'reminders',
    title: 'Recordatorios',
    icon: 'bell.badge.fill',
    iconColor: '#F59E0B',
    content: [
      {
        question: '¿Qué tipos de recordatorios hay?',
        answer: 'Piano Emotion Manager genera recordatorios automáticos para:\n\n• Citas programadas (antes del servicio)\n• Mantenimiento de pianos (según frecuencia configurada)\n• Vencimiento de contratos\n• Stock bajo de materiales\n• Facturas pendientes de cobro\n• Cumpleaños de clientes',
      },
      {
        question: '¿Cómo configuro los recordatorios?',
        answer: 'Ve a Módulos → Recordatorios o Configuración → Notificaciones:\n\n• Activa/desactiva cada tipo de recordatorio\n• Configura cuánto tiempo antes quieres el aviso\n• Elige el canal (notificación push, email, ambos)\n\nLos recordatorios de mantenimiento se configuran en cada piano.',
      },
      {
        question: '¿Cómo funciona el recordatorio de mantenimiento?',
        answer: 'Para cada piano puedes definir un intervalo de mantenimiento (ej: cada 6 meses).\n\nEl sistema:\n1. Registra la fecha del último servicio\n2. Calcula cuándo toca el próximo\n3. Te avisa cuando se acerca la fecha\n4. Opcionalmente, avisa también al cliente\n\nConfigúralo en la ficha de cada piano.',
      },
      {
        question: '¿Puedo crear recordatorios personalizados?',
        answer: 'Sí. Ve a Módulos → Recordatorios → Nuevo:\n\n1. Escribe el título del recordatorio\n2. Selecciona la fecha y hora\n3. Opcionalmente, vincúlalo a un cliente o piano\n4. Configura si se repite\n5. Guarda\n\nRecibirás una notificación en el momento indicado.',
      },
    ],
  },
  {
    id: 'settings',
    title: 'Configuración General',
    icon: 'gearshape.fill',
    iconColor: '#64748B',
    content: [
      {
        question: '¿Qué puedo configurar en la app?',
        answer: 'En Configuración encontrarás:\n\n• Perfil: Tu nombre y datos de usuario\n• Notificaciones: Qué avisos recibir\n• Apariencia: Tema claro/oscuro\n• Idioma: Español, inglés, etc.\n• Privacidad: Permisos y datos\n• Copia de seguridad: Exportar/importar datos\n• Cuenta: Gestión de suscripción',
      },
      {
        question: '¿Cómo cambio el tema de la app?',
        answer: 'Ve a Configuración → Apariencia:\n\n• Claro: Fondo blanco, ideal para exteriores\n• Oscuro: Fondo negro, ahorra batería en OLED\n• Automático: Sigue la configuración del sistema\n\nEl cambio se aplica inmediatamente.',
      },
      {
        question: '¿Cómo gestiono mi suscripción?',
        answer: 'Ve a Configuración → Cuenta o Gestionar Plan:\n\n• Ver tu plan actual\n• Fecha de renovación\n• Cambiar de plan\n• Cancelar suscripción\n• Ver historial de pagos\n\nLos cambios de plan se aplican en el siguiente ciclo de facturación.',
      },
      {
        question: '¿Cómo elimino mi cuenta?',
        answer: 'Ve a Configuración → Cuenta → Eliminar cuenta:\n\n⚠️ Esta acción es irreversible y eliminará:\n• Todos tus clientes\n• Todos los pianos\n• Todo el historial de servicios\n• Todas las facturas\n\nTe recomendamos hacer una copia de seguridad antes.',
      },
    ],
  },
  {
    id: 'marketing',
    title: 'Marketing y Comunicación',
    icon: 'megaphone.fill',
    iconColor: '#E91E63',
    content: [
      {
        question: '¿Qué es el módulo de Marketing?',
        answer: 'El módulo de Marketing te permite enviar mensajes a tus clientes de forma organizada por WhatsApp y Email, usando tu teléfono y correo personal.\n\nIncluye:\n• Plantillas de mensajes editables\n• Campañas de envío por lotes\n• Historial de comunicaciones\n\nAccede desde Herramientas Avanzadas → Marketing.',
      },
      {
        question: '¿Cómo funciona el envío por WhatsApp?',
        answer: 'El sistema usa tu WhatsApp personal (no requiere WhatsApp Business API):\n\n1. Selecciona los destinatarios de tu campaña\n2. Elige una plantilla de mensaje\n3. Pulsa "Enviar por WhatsApp"\n4. Se abre WhatsApp con el mensaje prellenado\n5. Pulsa enviar en WhatsApp\n6. Marca como enviado y pasa al siguiente\n\nEs semi-automático: tú controlas cada envío.',
      },
      {
        question: '¿Cómo funciona el envío por Email?',
        answer: 'El sistema usa tu aplicación de correo personal (Gmail, Outlook, etc.):\n\n1. Selecciona los destinatarios\n2. Elige una plantilla de email\n3. Pulsa "Enviar Email"\n4. Se abre tu app de correo con el mensaje y asunto prellenados\n5. Pulsa enviar en tu app de correo\n6. Marca como enviado y pasa al siguiente\n\nNo requiere configuración de servidor SMTP.',
      },
      {
        question: '¿Cómo edito las plantillas de mensajes?',
        answer: 'Ve a Marketing → Plantillas de Mensajes:\n\n1. Selecciona la pestaña WhatsApp o Email\n2. Toca el tipo de plantilla que quieres editar\n3. Modifica el nombre, asunto (solo email) y contenido\n4. Usa las variables disponibles (ej: {{cliente_nombre}})\n5. Previsualiza el resultado\n6. Guarda la plantilla\n\nLas variables se reemplazan automáticamente con los datos del cliente.',
      },
      {
        question: '¿Qué variables puedo usar en las plantillas?',
        answer: 'Las variables disponibles dependen del tipo de mensaje:\n\n• {{cliente_nombre}} - Nombre del cliente\n• {{piano_marca}} - Marca del piano\n• {{piano_modelo}} - Modelo del piano\n• {{ultimo_servicio}} - Fecha del último servicio\n• {{fecha_cita}} - Fecha de la cita\n• {{hora_cita}} - Hora de la cita\n• {{nombre_negocio}} - Tu nombre comercial\n• {{telefono_negocio}} - Tu teléfono\n\nAl editar una plantilla, verás todas las variables disponibles.',
      },
      {
        question: '¿Qué tipos de plantillas hay disponibles?',
        answer: 'Hay 12 tipos de plantillas para WhatsApp y Email:\n\n• Recordatorio de Cita\n• Servicio Completado\n• Recordatorio de Mantenimiento\n• Factura Enviada\n• Bienvenida\n• Cumpleaños\n• Promoción\n• Seguimiento Post-Servicio\n• Reactivación de Clientes\n• Presupuesto\n• Agradecimiento\n• Mensaje Personalizado',
      },
      {
        question: '¿Cómo creo una campaña de marketing?',
        answer: 'Ve a Marketing → Campañas → Nueva:\n\n1. Nombre: Ponle un nombre descriptivo\n2. Canal: Elige WhatsApp, Email o Ambos\n3. Tipo de mensaje: Selecciona la plantilla\n4. Destinatarios: Filtra por criterio:\n   • Necesitan mantenimiento (sin servicio en 6+ meses)\n   • Clientes inactivos (12+ meses sin actividad)\n   • Servicio reciente (seguimiento)\n   • Todos los clientes\n5. Inicia el envío por lotes',
      },
      {
        question: '¿Cómo funciona el envío por lotes?',
        answer: 'El envío por lotes te permite contactar muchos clientes rápidamente:\n\n1. Verás el cliente actual con su mensaje prellenado\n2. Pulsa "Enviar por WhatsApp" o "Enviar Email"\n3. Se abre la app correspondiente\n4. Envía el mensaje\n5. Vuelve a Piano Emotion\n6. Pulsa "Ya enviado" o "Saltar"\n7. Automáticamente pasa al siguiente\n\nPuedes pausar y continuar en cualquier momento.',
      },
      {
        question: '¿Puedo enviar a clientes sin email o teléfono?',
        answer: 'No. El sistema filtra automáticamente:\n\n• Para WhatsApp: Solo clientes con teléfono\n• Para Email: Solo clientes con email\n• Para Ambos: Clientes con ambos datos\n\nSi un cliente no tiene el dato necesario, puedes usar el botón "Saltar" para pasar al siguiente.',
      },
      {
        question: '¿Hay límite de envíos?',
        answer: 'No hay límite en Piano Emotion Manager.\n\nSin embargo, ten en cuenta las políticas de WhatsApp y tu proveedor de email:\n\n• WhatsApp puede bloquear cuentas que envían muchos mensajes a contactos que no te tienen guardado\n• Algunos proveedores de email limitan envíos diarios\n\nRecomendación: Envía a clientes que ya te conocen y espacia los envíos masivos.',
      },
    ],
  },
  {
    id: 'crm',
    title: 'CRM (Gestión de Relaciones)',
    icon: 'heart.fill',
    iconColor: '#EF4444',
    content: [
      {
        question: '¿Qué es el CRM?',
        answer: 'El CRM (Customer Relationship Management) te ayuda a gestionar las relaciones con tus clientes de forma avanzada.\n\nIncluye:\n• Historial de interacciones\n• Notas y seguimientos\n• Etiquetas personalizadas\n• Puntuación de clientes\n• Oportunidades de venta\n\nFunción Premium.',
      },
      {
        question: '¿Cómo registro una interacción?',
        answer: 'Desde la ficha del cliente, toca "Nueva Interacción":\n\n• Llamada: Registro de llamadas telefónicas\n• Email: Correos enviados/recibidos\n• Visita: Visitas presenciales\n• WhatsApp: Conversaciones\n• Nota: Observaciones generales\n\nCada interacción queda registrada con fecha y hora.',
      },
      {
        question: '¿Qué son las etiquetas de cliente?',
        answer: 'Las etiquetas te permiten clasificar clientes:\n\n• VIP: Clientes prioritarios\n• Potencial: Interesados sin cerrar\n• Inactivo: Sin actividad reciente\n• Moroso: Con pagos pendientes\n\nPuedes crear etiquetas personalizadas y filtrar por ellas.',
      },
      {
        question: '¿Cómo creo una oportunidad de venta?',
        answer: 'Las oportunidades representan posibles ventas futuras:\n\n1. Ve a CRM → Oportunidades → Nueva\n2. Selecciona el cliente\n3. Describe el servicio potencial\n4. Estima el valor\n5. Asigna una probabilidad de cierre\n6. Programa seguimientos\n\nEl embudo de ventas te muestra el estado de todas las oportunidades.',
      },
    ],
  },
  {
    id: 'calendar_plus',
    title: 'Calendario+ (Avanzado)',
    icon: 'calendar.badge.clock',
    iconColor: '#A855F7',
    content: [
      {
        question: '¿Qué ofrece Calendario+?',
        answer: 'Calendario+ es la versión avanzada del calendario con:\n\n• Sincronización con Google Calendar\n• Sincronización con Outlook\n• Vista de múltiples técnicos\n• Planificación de rutas\n• Disponibilidad online\n• Reservas automáticas\n\nFunción Premium.',
      },
      {
        question: '¿Cómo sincronizo con Google Calendar?',
        answer: 'Ve a Calendario+ → Configuración → Google Calendar:\n\n1. Pulsa "Conectar con Google"\n2. Inicia sesión en tu cuenta de Google\n3. Autoriza el acceso\n4. Selecciona qué calendarios sincronizar\n\nLas citas se sincronizarán en ambas direcciones.',
      },
      {
        question: '¿Qué es la disponibilidad online?',
        answer: 'Puedes compartir un enlace donde los clientes ven tu disponibilidad y reservan citas:\n\n1. Configura tus horarios de trabajo\n2. Define la duración de cada tipo de servicio\n3. Comparte el enlace con clientes\n4. Recibe notificaciones de nuevas reservas\n\nEvita llamadas y mensajes para coordinar citas.',
      },
      {
        question: '¿Cómo funciona la planificación de rutas?',
        answer: 'El sistema optimiza el orden de tus visitas del día:\n\n1. Ve a Calendario+ → Ruta del día\n2. El sistema calcula la ruta óptima\n3. Muestra tiempos de desplazamiento\n4. Puedes ajustar manualmente\n5. Exporta a Google Maps o Waze\n\nAhorra tiempo y combustible.',
      },
    ],
  },
  {
    id: 'reports',
    title: 'Reportes Avanzados',
    icon: 'chart.pie.fill',
    iconColor: '#06B6D4',
    content: [
      {
        question: '¿Qué reportes puedo generar?',
        answer: 'El módulo de Reportes incluye:\n\n• Informe de actividad mensual/anual\n• Análisis de rentabilidad por cliente\n• Comparativa de períodos\n• Reporte de impuestos (IVA)\n• Informe de productividad\n• Análisis de cartera de clientes\n\nFunción Premium.',
      },
      {
        question: '¿Cómo exporto un reporte?',
        answer: 'Cada reporte puede exportarse en varios formatos:\n\n• PDF: Para imprimir o enviar\n• Excel: Para análisis adicional\n• CSV: Para importar en otros sistemas\n\nToca el botón de exportar y selecciona el formato deseado.',
      },
      {
        question: '¿Puedo programar reportes automáticos?',
        answer: 'Sí. Ve a Reportes → Programados:\n\n1. Selecciona el tipo de reporte\n2. Configura la frecuencia (semanal, mensual)\n3. Indica el email de destino\n4. Activa la programación\n\nRecibirás el reporte automáticamente en tu correo.',
      },
      {
        question: '¿Qué es el reporte de IVA?',
        answer: 'El reporte de IVA resume:\n\n• IVA repercutido (en tus facturas)\n• IVA soportado (en tus gastos)\n• Resultado a declarar\n• Desglose por trimestre\n\nÚtil para preparar las declaraciones trimestrales de IVA.',
      },
    ],
  },
  {
    id: 'accounting',
    title: 'Contabilidad',
    icon: 'calculator',
    iconColor: '#F97316',
    content: [
      {
        question: '¿Qué incluye el módulo de Contabilidad?',
        answer: 'El módulo de Contabilidad ofrece:\n\n• Registro de gastos\n• Categorización automática\n• Balance de ingresos y gastos\n• Libro de facturas emitidas\n• Libro de facturas recibidas\n• Exportación para gestoría\n\nFunción Premium.',
      },
      {
        question: '¿Cómo registro un gasto?',
        answer: 'Ve a Contabilidad → Gastos → Nuevo:\n\n1. Introduce el importe\n2. Selecciona la categoría (combustible, materiales, etc.)\n3. Añade el proveedor\n4. Adjunta foto del ticket/factura\n5. Indica si tiene IVA deducible\n6. Guarda\n\nPuedes escanear tickets con la cámara.',
      },
      {
        question: '¿Qué categorías de gasto hay?',
        answer: 'Categorías predefinidas:\n\n• Combustible y desplazamientos\n• Materiales y repuestos\n• Herramientas\n• Formación\n• Seguros\n• Teléfono e internet\n• Software y suscripciones\n• Otros gastos\n\nPuedes crear categorías personalizadas.',
      },
      {
        question: '¿Cómo exporto para mi gestor?',
        answer: 'Ve a Contabilidad → Exportar:\n\n1. Selecciona el período (mes, trimestre, año)\n2. Elige el formato (Excel, CSV, PDF)\n3. Incluye o excluye adjuntos\n4. Descarga o envía por email\n\nEl formato es compatible con la mayoría de programas de contabilidad.',
      },
    ],
  },
  {
    id: 'shop',
    title: 'Tienda Online',
    icon: 'cart.fill',
    iconColor: '#84CC16',
    content: [
      {
        question: '¿Qué es la Tienda Online?',
        answer: 'La Tienda te permite vender productos y servicios online:\n\n• Catálogo de productos\n• Servicios con reserva\n• Pagos online\n• Gestión de pedidos\n• Integración con inventario\n\nFunción Premium.',
      },
      {
        question: '¿Cómo añado productos?',
        answer: 'Ve a Tienda → Productos → Nuevo:\n\n1. Nombre y descripción\n2. Precio\n3. Fotos del producto\n4. Stock disponible\n5. Categoría\n6. Opciones de envío\n\nLos productos se sincronizan con tu inventario.',
      },
      {
        question: '¿Cómo recibo pagos?',
        answer: 'Configura una pasarela de pago (ver sección Pasarelas de Pago):\n\n• Stripe: Tarjetas de crédito/débito\n• PayPal: Cuenta PayPal o tarjeta\n\nLos pagos se depositan en tu cuenta automáticamente.',
      },
      {
        question: '¿Cómo comparto mi tienda?',
        answer: 'Tu tienda tiene una URL única que puedes compartir:\n\n• En tu web o redes sociales\n• Por WhatsApp a clientes\n• En tu firma de email\n• Con código QR\n\nLos clientes pueden comprar sin necesidad de registrarse.',
      },
    ],
  },
  {
    id: 'workflows',
    title: 'Workflows (Automatizaciones)',
    icon: 'arrow.triangle.branch',
    iconColor: '#6366F1',
    content: [
      {
        question: '¿Qué son los Workflows?',
        answer: 'Los Workflows son automatizaciones que ejecutan acciones cuando ocurren eventos:\n\n• Nuevo cliente → Enviar bienvenida\n• Servicio completado → Pedir reseña\n• 6 meses sin servicio → Recordatorio\n• Factura vencida → Aviso de pago\n\nFunción Premium.',
      },
      {
        question: '¿Cómo creo un workflow?',
        answer: 'Ve a Workflows → Nuevo:\n\n1. Nombre del workflow\n2. Disparador: ¿Cuándo se activa?\n3. Condiciones: ¿Qué debe cumplirse?\n4. Acciones: ¿Qué hacer?\n5. Activa el workflow\n\nPuedes combinar múltiples condiciones y acciones.',
      },
      {
        question: '¿Qué acciones puedo automatizar?',
        answer: 'Acciones disponibles:\n\n• Enviar email\n• Enviar WhatsApp (abre la app)\n• Crear recordatorio\n• Crear tarea\n• Cambiar etiqueta de cliente\n• Actualizar campo\n• Notificación interna\n\nMás acciones se añaden regularmente.',
      },
      {
        question: '¿Puedo ver el historial de ejecuciones?',
        answer: 'Sí. En cada workflow verás:\n\n• Últimas ejecuciones\n• Estado (exitoso, fallido)\n• Detalles de cada paso\n• Errores si los hubo\n\nÚtil para depurar y optimizar tus automatizaciones.',
      },
    ],
  },
  {
    id: 'payments',
    title: 'Pasarelas de Pago',
    icon: 'creditcard.fill',
    iconColor: '#635BFF',
    content: [
      {
        question: '¿Qué son las pasarelas de pago?',
        answer: 'Las pasarelas de pago te permiten cobrar online:\n\n• Stripe: Líder mundial en pagos\n• PayPal: Muy conocido por clientes\n\nPuedes usar una o ambas según preferencia.\n\nFunción Premium.',
      },
      {
        question: '¿Cómo configuro Stripe?',
        answer: 'Ve a Herramientas Avanzadas → Pasarelas de Pago → Stripe:\n\n1. Crea una cuenta en stripe.com si no tienes\n2. Obtén tus claves API (Dashboard de Stripe)\n3. Introduce la clave pública\n4. Introduce la clave secreta\n5. Guarda y prueba la conexión\n\nLas credenciales se almacenan de forma segura y encriptada.',
      },
      {
        question: '¿Cómo configuro PayPal?',
        answer: 'Ve a Herramientas Avanzadas → Pasarelas de Pago → PayPal:\n\n1. Crea una cuenta Business en paypal.com\n2. Ve a Developer Dashboard\n3. Crea una aplicación\n4. Copia el Client ID y Secret\n5. Introdúcelos en Piano Emotion\n6. Guarda y prueba\n\nPuedes usar modo Sandbox para pruebas.',
      },
      {
        question: '¿Qué comisiones tienen?',
        answer: 'Las comisiones las cobra cada plataforma, no Piano Emotion:\n\n• Stripe: ~1.4% + 0.25€ (Europa)\n• PayPal: ~2.9% + 0.35€\n\nConsulta las tarifas actualizadas en sus webs oficiales. Piano Emotion no cobra comisión adicional.',
      },
    ],
  },
  {
    id: 'dashboard_plus',
    title: 'Dashboard+ (Personalizable)',
    icon: 'square.grid.2x2',
    iconColor: '#EC4899',
    content: [
      {
        question: '¿Qué es Dashboard+?',
        answer: 'Dashboard+ te permite personalizar completamente tu pantalla principal:\n\n• Añadir/quitar widgets\n• Reorganizar secciones\n• Elegir qué estadísticas ver\n• Crear accesos rápidos personalizados\n• Múltiples layouts\n\nFunción Premium.',
      },
      {
        question: '¿Cómo personalizo el dashboard?',
        answer: 'Ve a Herramientas Avanzadas → Dashboard+:\n\n1. Entra en modo edición\n2. Arrastra widgets para reorganizar\n3. Toca + para añadir nuevos widgets\n4. Toca X para eliminar widgets\n5. Guarda los cambios\n\nPuedes volver al layout por defecto en cualquier momento.',
      },
      {
        question: '¿Qué widgets hay disponibles?',
        answer: 'Widgets disponibles:\n\n• Resumen del mes\n• Próximas citas\n• Clientes recientes\n• Gráfico de ingresos\n• Tareas pendientes\n• Recordatorios\n• Stock bajo\n• Facturas pendientes\n• Calendario mini\n• Accesos rápidos\n\nMás widgets se añaden en actualizaciones.',
      },
      {
        question: '¿Puedo tener varios dashboards?',
        answer: 'Sí. Puedes crear múltiples layouts:\n\n• Vista diaria: Enfocada en citas del día\n• Vista financiera: Enfocada en facturación\n• Vista general: Balance de todo\n\nCambia entre ellos con un toque.',
      },
    ],
  },
  {
    id: 'teams',
    title: 'Equipos (Multi-usuario)',
    icon: 'person.3.sequence.fill',
    iconColor: '#14B8A6',
    content: [
      {
        question: '¿Qué es el módulo de Equipos?',
        answer: 'El módulo de Equipos permite trabajar con varios técnicos:\n\n• Cuentas de usuario separadas\n• Asignación de clientes\n• Calendario compartido\n• Permisos por rol\n• Estadísticas por técnico\n\nFunción Premium.',
      },
      {
        question: '¿Cómo añado un técnico?',
        answer: 'Ve a Equipos → Miembros → Invitar:\n\n1. Introduce el email del técnico\n2. Selecciona su rol (Técnico, Admin)\n3. Define sus permisos\n4. Envía la invitación\n\nEl técnico recibirá un email para crear su cuenta.',
      },
      {
        question: '¿Qué roles existen?',
        answer: '• Propietario: Control total, facturación\n• Administrador: Todo excepto facturación\n• Técnico: Solo sus clientes y servicios\n• Visualizador: Solo lectura\n\nPuedes personalizar permisos específicos para cada rol.',
      },
      {
        question: '¿Cómo asigno clientes a técnicos?',
        answer: 'Hay varias formas:\n\n• Al crear cliente: Selecciona el técnico asignado\n• Desde la ficha: Cambia el técnico asignado\n• Por zona: Asignación automática por código postal\n• Balanceo: Distribución equitativa automática\n\nCada técnico solo ve sus clientes asignados.',
      },
    ],
  },
  {
    id: 'subscription',
    title: 'Planes y Suscripción',
    icon: 'creditcard.fill',
    iconColor: '#8B5CF6',
    content: [
      {
        question: '¿Qué planes hay disponibles?',
        answer: 'Piano Emotion Manager ofrece:\n\n• Plan Gratuito: Funciones básicas sin límite de tiempo\n• Plan Premium: Todas las funciones avanzadas\n\nEl plan gratuito incluye gestión de clientes, pianos, servicios, facturas y marketing.',
      },
      {
        question: '¿Qué incluye el Plan Premium?',
        answer: 'El Plan Premium añade:\n\n• CRM avanzado\n• Calendario+ con sincronización\n• Reportes avanzados\n• Contabilidad\n• Tienda online\n• Workflows\n• Pasarelas de pago\n• Dashboard personalizable\n• Equipos multi-usuario\n• Soporte prioritario',
      },
      {
        question: '¿Cómo me suscribo a Premium?',
        answer: 'Ve a Gestionar Plan o Configuración → Cuenta:\n\n1. Selecciona Plan Premium\n2. Elige facturación mensual o anual\n3. Introduce método de pago\n4. Confirma la suscripción\n\nLas funciones Premium se activan inmediatamente.',
      },
      {
        question: '¿Puedo cancelar en cualquier momento?',
        answer: 'Sí. La suscripción se puede cancelar cuando quieras:\n\n• Mantienes acceso hasta fin del período pagado\n• Tus datos se conservan\n• Puedes reactivar en cualquier momento\n• Las funciones Premium se desactivan al vencer\n\nNo hay permanencia ni penalización.',
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
