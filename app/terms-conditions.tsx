import React from 'react';
import { ScrollView, StyleSheet, View, Pressable, Linking } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';

export default function TermsConditionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const backgroundColor = useThemeColor({}, 'background');
  const cardBg = useThemeColor({}, 'cardBackground');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  const primary = useThemeColor({}, 'tint');
  const warning = useThemeColor({}, 'warning');

  const lastUpdated = '23 de diciembre de 2024';

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <Stack.Screen
        options={{
          title: 'Términos y Condiciones',
          headerShown: true,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <IconSymbol name="chevron.left" size={24} color={primary} />
            </Pressable>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Encabezado */}
        <View style={[styles.header, { backgroundColor: cardBg, borderColor }]}>
          <IconSymbol name="doc.text.fill" size={40} color={primary} />
          <ThemedText style={styles.title}>Términos y Condiciones</ThemedText>
          <ThemedText style={[styles.subtitle, { color: textSecondary }]}>
            Condiciones de uso de Piano Emotion Manager
          </ThemedText>
          <ThemedText style={[styles.lastUpdated, { color: textSecondary }]}>
            Última actualización: {lastUpdated}
          </ThemedText>
        </View>

        {/* Aviso importante */}
        <View style={[styles.warningBox, { backgroundColor: `${warning}15`, borderColor: warning }]}>
          <IconSymbol name="exclamationmark.triangle.fill" size={24} color={warning} />
          <ThemedText style={[styles.warningText, { color: textSecondary }]}>
            Al utilizar Piano Emotion Manager, aceptas estos Términos y Condiciones en su totalidad. 
            Si no estás de acuerdo con alguna parte, no debes utilizar la aplicación.
          </ThemedText>
        </View>

        {/* 1. Identificación */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>1. Identificación del Prestador</ThemedText>
          <View style={styles.infoBox}>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              <ThemedText style={styles.bold}>Razón Social:</ThemedText> Inbound Emotion S.L.
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              <ThemedText style={styles.bold}>CIF:</ThemedText> B66351685
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              <ThemedText style={styles.bold}>Domicilio:</ThemedText> [Dirección fiscal de la empresa]
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              <ThemedText style={styles.bold}>Email:</ThemedText> info@pianoemotion.es
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              <ThemedText style={styles.bold}>Inscripción:</ThemedText> Registro Mercantil de Barcelona
            </ThemedText>
          </View>
        </View>

        {/* 2. Objeto */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>2. Objeto y Ámbito de Aplicación</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            Los presentes Términos y Condiciones regulan el acceso y uso de la aplicación 
            <ThemedText style={styles.bold}> Piano Emotion Manager</ThemedText> (en adelante, "la Aplicación"), 
            una herramienta de gestión profesional diseñada para técnicos de pianos que permite:
          </ThemedText>
          <View style={styles.list}>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Gestión de clientes y sus datos de contacto</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Registro y seguimiento de pianos</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Planificación de citas y servicios</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Generación de facturas y presupuestos</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Control de inventario de piezas y materiales</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Acceso a productos de Piano Emotion Store</ThemedText>
          </View>
        </View>

        {/* 3. Registro y cuenta */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>3. Registro y Cuenta de Usuario</ThemedText>
          
          <ThemedText style={[styles.subTitle, { marginTop: 0 }]}>3.1 Requisitos de registro</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            Para utilizar la Aplicación, debes:
          </ThemedText>
          <View style={styles.list}>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Ser mayor de 18 años</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Ser profesional del sector de técnicos de pianos o actividad relacionada</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Proporcionar información veraz y actualizada</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Aceptar estos Términos y Condiciones y la Política de Privacidad</ThemedText>
          </View>

          <ThemedText style={[styles.subTitle]}>3.2 Responsabilidad de la cuenta</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            Eres responsable de:
          </ThemedText>
          <View style={styles.list}>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Mantener la confidencialidad de tus credenciales de acceso</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Todas las actividades realizadas desde tu cuenta</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Notificar inmediatamente cualquier uso no autorizado</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Mantener actualizados tus datos de contacto</ThemedText>
          </View>
        </View>

        {/* 4. Licencia de uso */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>4. Licencia de Uso</ThemedText>
          
          <ThemedText style={[styles.subTitle, { marginTop: 0 }]}>4.1 Concesión de licencia</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            Inbound Emotion S.L. te concede una licencia limitada, no exclusiva, intransferible y revocable 
            para utilizar la Aplicación de acuerdo con estos Términos y Condiciones.
          </ThemedText>

          <ThemedText style={[styles.subTitle]}>4.2 Restricciones</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            No está permitido:
          </ThemedText>
          <View style={styles.list}>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Copiar, modificar o distribuir la Aplicación</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Realizar ingeniería inversa o descompilar el código</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Sublicenciar o transferir la licencia a terceros</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Utilizar la Aplicación para fines ilegales</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Intentar acceder a sistemas o datos no autorizados</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Introducir virus, malware o código malicioso</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Utilizar la Aplicación de forma que perjudique a otros usuarios</ThemedText>
          </View>
        </View>

        {/* 5. Precio y pago */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>5. Precio y Condiciones de Pago</ThemedText>
          
          <ThemedText style={[styles.subTitle, { marginTop: 0 }]}>5.1 Modelo de precios</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            Piano Emotion Manager ofrece un modelo de acceso gratuito o de bajo coste mensual. 
            Las condiciones específicas de precio se comunicarán en el momento del registro y 
            podrán variar según las funcionalidades contratadas.
          </ThemedText>

          <ThemedText style={[styles.subTitle]}>5.2 Funcionalidades premium</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            Algunas funcionalidades avanzadas pueden requerir una suscripción de pago. 
            En caso de contratación de servicios de pago:
          </ThemedText>
          <View style={styles.list}>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Los precios incluyen IVA salvo indicación contraria</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• El pago se realizará mediante los métodos habilitados</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Las suscripciones se renuevan automáticamente salvo cancelación</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Puedes cancelar en cualquier momento desde Configuración</ThemedText>
          </View>
        </View>

        {/* 6. Propiedad intelectual */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>6. Propiedad Intelectual</ThemedText>
          
          <ThemedText style={[styles.subTitle, { marginTop: 0 }]}>6.1 Derechos de Inbound Emotion S.L.</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            Todos los derechos de propiedad intelectual e industrial sobre la Aplicación, 
            incluyendo pero no limitado a:
          </ThemedText>
          <View style={styles.list}>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Código fuente y software</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Diseño gráfico e interfaz de usuario</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Logotipos, marcas y nombres comerciales</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Textos, imágenes y contenidos</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Bases de datos y estructura</ThemedText>
          </View>
          <ThemedText style={[styles.text, { color: textSecondary, marginTop: Spacing.sm }]}>
            Son propiedad exclusiva de Inbound Emotion S.L. o de sus licenciantes.
          </ThemedText>

          <ThemedText style={[styles.subTitle]}>6.2 Contenido del usuario</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            Los datos y contenidos que introduzcas en la Aplicación (información de clientes, 
            pianos, servicios, etc.) son de tu propiedad. Nos concedes una licencia limitada 
            para almacenar y procesar estos datos únicamente para la prestación del servicio.
          </ThemedText>
        </View>

        {/* 7. Protección de datos */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>7. Protección de Datos</ThemedText>
          
          <ThemedText style={[styles.subTitle, { marginTop: 0 }]}>7.1 Cumplimiento normativo</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            El tratamiento de datos personales se realiza conforme al Reglamento General de 
            Protección de Datos (RGPD) y la LOPDGDD. Para más información, consulta nuestra{' '}
            <ThemedText 
              style={[styles.link, { color: primary }]}
              onPress={() => router.push('/privacy-policy')}
            >
              Política de Privacidad
            </ThemedText>.
          </ThemedText>

          <ThemedText style={[styles.subTitle]}>7.2 Responsabilidad del usuario</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            Como usuario profesional que introduce datos de tus clientes en la Aplicación, 
            eres responsable de:
          </ThemedText>
          <View style={styles.list}>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Obtener el consentimiento de tus clientes para el tratamiento de sus datos</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Informar a tus clientes sobre el uso de sus datos</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Cumplir con la normativa de protección de datos aplicable</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Atender los derechos de tus clientes sobre sus datos</ThemedText>
          </View>

          <ThemedText style={[styles.subTitle]}>7.3 Encargado del tratamiento</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            Inbound Emotion S.L. actúa como encargado del tratamiento respecto a los datos 
            de tus clientes. Nos comprometemos a:
          </ThemedText>
          <View style={styles.list}>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Tratar los datos únicamente según tus instrucciones</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Garantizar la confidencialidad</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Implementar medidas de seguridad adecuadas</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Asistirte en el cumplimiento de tus obligaciones</ThemedText>
          </View>
        </View>

        {/* 8. Facturación electrónica */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>8. Facturación Electrónica (Verifactu)</ThemedText>
          
          <ThemedText style={[styles.subTitle, { marginTop: 0 }]}>8.1 Cumplimiento fiscal</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            La Aplicación incluye funcionalidades de facturación electrónica conforme al 
            sistema Verifactu de la Agencia Tributaria española. Las facturas generadas 
            cumplen con los requisitos del Reglamento de facturación (RD 1619/2012) y la 
            normativa de facturación electrónica.
          </ThemedText>

          <ThemedText style={[styles.subTitle]}>8.2 Responsabilidad fiscal</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            Como usuario, eres el único responsable de:
          </ThemedText>
          <View style={styles.list}>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• La veracidad de los datos fiscales introducidos</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• El cumplimiento de tus obligaciones tributarias</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• La correcta emisión y conservación de facturas</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Las comunicaciones con la Agencia Tributaria</ThemedText>
          </View>
        </View>

        {/* 9. Disponibilidad */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>9. Disponibilidad del Servicio</ThemedText>
          
          <ThemedText style={[styles.subTitle, { marginTop: 0 }]}>9.1 Nivel de servicio</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            Nos esforzamos por mantener la Aplicación disponible las 24 horas del día, 
            los 7 días de la semana. Sin embargo, no garantizamos la disponibilidad 
            ininterrumpida del servicio.
          </ThemedText>

          <ThemedText style={[styles.subTitle]}>9.2 Interrupciones</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            El servicio puede verse interrumpido por:
          </ThemedText>
          <View style={styles.list}>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Mantenimiento programado (notificado con antelación)</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Actualizaciones de seguridad urgentes</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Fallos técnicos o de terceros proveedores</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Causas de fuerza mayor</ThemedText>
          </View>
        </View>

        {/* 10. Limitación de responsabilidad */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>10. Limitación de Responsabilidad</ThemedText>
          
          <ThemedText style={[styles.subTitle, { marginTop: 0 }]}>10.1 Exclusiones</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            En la máxima medida permitida por la ley, Inbound Emotion S.L. no será responsable de:
          </ThemedText>
          <View style={styles.list}>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Daños indirectos, incidentales o consecuentes</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Pérdida de beneficios, datos o negocio</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Errores en los datos introducidos por el usuario</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Uso indebido de la Aplicación</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Interrupciones del servicio por causas ajenas</ThemedText>
          </View>

          <ThemedText style={[styles.subTitle]}>10.2 Límite máximo</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            En cualquier caso, la responsabilidad total de Inbound Emotion S.L. no excederá 
            el importe pagado por el usuario en los 12 meses anteriores al evento que 
            origine la reclamación.
          </ThemedText>
        </View>

        {/* 11. Modificaciones */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>11. Modificaciones</ThemedText>
          
          <ThemedText style={[styles.subTitle, { marginTop: 0 }]}>11.1 Cambios en los Términos</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            Nos reservamos el derecho de modificar estos Términos y Condiciones en cualquier 
            momento. Los cambios serán notificados a través de:
          </ThemedText>
          <View style={styles.list}>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Notificación dentro de la Aplicación</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Correo electrónico a la dirección registrada</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Publicación en la Aplicación con fecha de entrada en vigor</ThemedText>
          </View>

          <ThemedText style={[styles.subTitle]}>11.2 Aceptación de cambios</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            El uso continuado de la Aplicación tras la notificación de cambios implica 
            la aceptación de los nuevos Términos. Si no estás de acuerdo, debes dejar 
            de utilizar la Aplicación.
          </ThemedText>
        </View>

        {/* 12. Resolución */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>12. Resolución y Cancelación</ThemedText>
          
          <ThemedText style={[styles.subTitle, { marginTop: 0 }]}>12.1 Por el usuario</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            Puedes cancelar tu cuenta en cualquier momento desde Configuración {'>'} Cuenta {'>'} 
            Eliminar cuenta. Antes de la eliminación, podrás exportar tus datos.
          </ThemedText>

          <ThemedText style={[styles.subTitle]}>12.2 Por Inbound Emotion S.L.</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            Podemos suspender o cancelar tu cuenta si:
          </ThemedText>
          <View style={styles.list}>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Incumples estos Términos y Condiciones</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Realizas actividades fraudulentas o ilegales</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• No pagas las cuotas correspondientes (si aplica)</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Tu cuenta permanece inactiva durante más de 24 meses</ThemedText>
          </View>

          <ThemedText style={[styles.subTitle]}>12.3 Efectos de la resolución</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            Tras la cancelación:
          </ThemedText>
          <View style={styles.list}>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Perderás acceso a la Aplicación</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Tus datos serán eliminados según nuestra Política de Privacidad</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Los datos fiscales se conservarán el tiempo legalmente requerido</ThemedText>
          </View>
        </View>

        {/* 13. Legislación aplicable */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>13. Legislación Aplicable y Jurisdicción</ThemedText>
          
          <ThemedText style={[styles.subTitle, { marginTop: 0 }]}>13.1 Ley aplicable</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            Estos Términos y Condiciones se rigen por la legislación española, en particular:
          </ThemedText>
          <View style={styles.list}>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Ley 34/2002, de servicios de la sociedad de la información (LSSI)</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Real Decreto Legislativo 1/2007, de defensa de consumidores</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Reglamento General de Protección de Datos (RGPD)</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Código Civil y Código de Comercio</ThemedText>
          </View>

          <ThemedText style={[styles.subTitle]}>13.2 Jurisdicción</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            Para la resolución de cualquier controversia, las partes se someten a los 
            Juzgados y Tribunales de Barcelona (España), con renuncia expresa a cualquier 
            otro fuero que pudiera corresponderles.
          </ThemedText>

          <ThemedText style={[styles.subTitle]}>13.3 Resolución alternativa de conflictos</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            Como consumidor en la UE, también puedes acceder a la plataforma de resolución 
            de litigios en línea de la Comisión Europea:{' '}
            <ThemedText 
              style={[styles.link, { color: primary }]}
              onPress={() => Linking.openURL('https://ec.europa.eu/consumers/odr')}
            >
              https://ec.europa.eu/consumers/odr
            </ThemedText>
          </ThemedText>
        </View>

        {/* 14. Contacto */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>14. Contacto</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            Para cualquier consulta relacionada con estos Términos y Condiciones, 
            puedes contactarnos a través de:
          </ThemedText>
          <View style={styles.contactBox}>
            <View style={styles.contactItem}>
              <IconSymbol name="envelope.fill" size={20} color={primary} />
              <ThemedText style={[styles.contactText, { color: textSecondary }]}>
                info@pianoemotion.es
              </ThemedText>
            </View>
            <View style={styles.contactItem}>
              <IconSymbol name="globe" size={20} color={primary} />
              <ThemedText style={[styles.contactText, { color: textSecondary }]}>
                www.pianoemotion.es
              </ThemedText>
            </View>
          </View>
        </View>

        {/* 15. Disposiciones finales */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>15. Disposiciones Finales</ThemedText>
          
          <ThemedText style={[styles.subTitle, { marginTop: 0 }]}>15.1 Nulidad parcial</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            Si alguna cláusula de estos Términos fuera declarada nula o inaplicable, 
            las restantes cláusulas permanecerán en vigor.
          </ThemedText>

          <ThemedText style={[styles.subTitle]}>15.2 Renuncia</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            El hecho de que Inbound Emotion S.L. no ejerza algún derecho o acción 
            previsto en estos Términos no constituirá una renuncia al mismo.
          </ThemedText>

          <ThemedText style={[styles.subTitle]}>15.3 Acuerdo completo</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            Estos Términos y Condiciones, junto con la Política de Privacidad y la 
            Política de Cookies, constituyen el acuerdo completo entre las partes 
            respecto al uso de la Aplicación.
          </ThemedText>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <ThemedText style={[styles.footerText, { color: textSecondary }]}>
            © 2024 Inbound Emotion S.L. Todos los derechos reservados.
          </ThemedText>
          <ThemedText style={[styles.footerText, { color: textSecondary }]}>
            CIF: B66351685
          </ThemedText>
          <Pressable onPress={() => router.push('/privacy-policy')}>
            <ThemedText style={[styles.footerLink, { color: primary }]}>
              Ver Política de Privacidad
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    padding: Spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  header: {
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  lastUpdated: {
    fontSize: 12,
    marginTop: Spacing.sm,
  },
  warningBox: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  section: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  subTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
  },
  bold: {
    fontWeight: '600',
  },
  link: {
    textDecorationLine: 'underline',
  },
  infoBox: {
    gap: Spacing.xs,
  },
  list: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  listItem: {
    fontSize: 14,
    lineHeight: 22,
    paddingLeft: Spacing.sm,
  },
  contactBox: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  contactText: {
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.xs,
  },
  footerText: {
    fontSize: 12,
  },
  footerLink: {
    fontSize: 14,
    marginTop: Spacing.sm,
  },
});
