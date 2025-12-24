import React from 'react';
import { ScrollView, StyleSheet, View, Pressable, Linking } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BorderRadius, Spacing } from '@/constants/theme';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const backgroundColor = useThemeColor({}, 'background');
  const cardBg = useThemeColor({}, 'cardBackground');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  const primary = useThemeColor({}, 'tint');

  const lastUpdated = '23 de diciembre de 2024';

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <Stack.Screen
        options={{
          title: 'Política de Privacidad',
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
          <IconSymbol name="lock.shield.fill" size={40} color={primary} />
          <ThemedText style={styles.title}>Política de Privacidad</ThemedText>
          <ThemedText style={[styles.subtitle, { color: textSecondary }]}>
            Última actualización: {lastUpdated}
          </ThemedText>
        </View>

        {/* Introducción */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>1. Introducción</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            En <ThemedText style={styles.bold}>Inbound Emotion S.L.</ThemedText> (en adelante, "nosotros", "nuestro" o "la Empresa"), 
            nos comprometemos a proteger y respetar tu privacidad. Esta Política de Privacidad describe cómo recopilamos, 
            utilizamos, almacenamos y protegemos tus datos personales cuando utilizas la aplicación 
            <ThemedText style={styles.bold}> Piano Emotion Manager</ThemedText> (en adelante, "la Aplicación").
          </ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary, marginTop: Spacing.sm }]}>
            Esta política cumple con el Reglamento General de Protección de Datos (RGPD) de la Unión Europea 
            (Reglamento UE 2016/679) y la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos 
            Personales y garantía de los derechos digitales (LOPDGDD) de España.
          </ThemedText>
        </View>

        {/* Responsable del tratamiento */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>2. Responsable del Tratamiento</ThemedText>
          <View style={styles.infoBox}>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              <ThemedText style={styles.bold}>Razón Social:</ThemedText> Inbound Emotion S.L.
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              <ThemedText style={styles.bold}>Domicilio:</ThemedText> [Dirección fiscal de la empresa]
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              <ThemedText style={styles.bold}>CIF:</ThemedText> B66351685
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              <ThemedText style={styles.bold}>Email de contacto:</ThemedText> privacidad@pianoemotion.es
            </ThemedText>
            <ThemedText style={[styles.text, { color: textSecondary }]}>
              <ThemedText style={styles.bold}>Delegado de Protección de Datos:</ThemedText> dpd@pianoemotion.es
            </ThemedText>
          </View>
        </View>

        {/* Datos que recopilamos */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>3. Datos que Recopilamos</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            Recopilamos los siguientes tipos de datos personales:
          </ThemedText>
          
          <ThemedText style={[styles.subTitle, { marginTop: Spacing.md }]}>3.1 Datos del Usuario (Técnico de Pianos)</ThemedText>
          <View style={styles.list}>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Nombre y apellidos</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Dirección de correo electrónico</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Número de teléfono</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Dirección postal y fiscal</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• NIF/CIF</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Datos bancarios (para facturación)</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Logotipo de empresa (opcional)</ThemedText>
          </View>

          <ThemedText style={[styles.subTitle, { marginTop: Spacing.md }]}>3.2 Datos de Clientes del Usuario</ThemedText>
          <View style={styles.list}>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Nombre y apellidos o razón social</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• NIF/CIF</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Dirección de contacto</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Teléfono y email</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Información sobre sus pianos</ThemedText>
          </View>

          <ThemedText style={[styles.subTitle, { marginTop: Spacing.md }]}>3.3 Datos de Uso de la Aplicación</ThemedText>
          <View style={styles.list}>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Registros de actividad (logs)</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Preferencias de configuración</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Datos de navegación dentro de la app</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Información del dispositivo</ThemedText>
          </View>
        </View>

        {/* Finalidad del tratamiento */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>4. Finalidad del Tratamiento</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            Utilizamos tus datos personales para las siguientes finalidades:
          </ThemedText>
          <View style={styles.list}>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>
              <ThemedText style={styles.bold}>a)</ThemedText> Prestación del servicio de la Aplicación
            </ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>
              <ThemedText style={styles.bold}>b)</ThemedText> Gestión de tu cuenta de usuario
            </ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>
              <ThemedText style={styles.bold}>c)</ThemedText> Generación de facturas y documentos fiscales
            </ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>
              <ThemedText style={styles.bold}>d)</ThemedText> Comunicaciones relacionadas con el servicio
            </ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>
              <ThemedText style={styles.bold}>e)</ThemedText> Envío de información comercial sobre productos de Piano Emotion (con tu consentimiento)
            </ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>
              <ThemedText style={styles.bold}>f)</ThemedText> Mejora de la Aplicación y desarrollo de nuevas funcionalidades
            </ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>
              <ThemedText style={styles.bold}>g)</ThemedText> Cumplimiento de obligaciones legales
            </ThemedText>
          </View>
        </View>

        {/* Base legal */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>5. Base Legal del Tratamiento</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            El tratamiento de tus datos se fundamenta en las siguientes bases legales:
          </ThemedText>
          <View style={styles.list}>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>
              <ThemedText style={styles.bold}>• Ejecución de contrato:</ThemedText> Para la prestación del servicio de la Aplicación (Art. 6.1.b RGPD)
            </ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>
              <ThemedText style={styles.bold}>• Consentimiento:</ThemedText> Para el envío de comunicaciones comerciales (Art. 6.1.a RGPD)
            </ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>
              <ThemedText style={styles.bold}>• Obligación legal:</ThemedText> Para el cumplimiento de obligaciones fiscales y contables (Art. 6.1.c RGPD)
            </ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>
              <ThemedText style={styles.bold}>• Interés legítimo:</ThemedText> Para la mejora de nuestros servicios y prevención de fraude (Art. 6.1.f RGPD)
            </ThemedText>
          </View>
        </View>

        {/* Conservación de datos */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>6. Conservación de Datos</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            Conservaremos tus datos personales durante los siguientes plazos:
          </ThemedText>
          <View style={styles.list}>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>
              <ThemedText style={styles.bold}>• Datos de cuenta:</ThemedText> Mientras mantengas tu cuenta activa y hasta 2 años después de su cancelación
            </ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>
              <ThemedText style={styles.bold}>• Datos fiscales:</ThemedText> 6 años (obligación legal según Código de Comercio)
            </ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>
              <ThemedText style={styles.bold}>• Facturas:</ThemedText> 10 años (obligación legal)
            </ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>
              <ThemedText style={styles.bold}>• Datos de uso:</ThemedText> 2 años desde su recopilación
            </ThemedText>
          </View>
        </View>

        {/* Destinatarios */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>7. Destinatarios de los Datos</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            Tus datos podrán ser comunicados a los siguientes destinatarios:
          </ThemedText>
          <View style={styles.list}>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>
              <ThemedText style={styles.bold}>• Proveedores de servicios tecnológicos:</ThemedText> Hosting, bases de datos, servicios cloud (con contratos de encargado de tratamiento)
            </ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>
              <ThemedText style={styles.bold}>• Agencia Tributaria:</ThemedText> Para el cumplimiento de obligaciones fiscales (Verifactu)
            </ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>
              <ThemedText style={styles.bold}>• Entidades bancarias:</ThemedText> Para la gestión de pagos
            </ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>
              <ThemedText style={styles.bold}>• Piano Emotion (tienda):</ThemedText> Para la gestión de pedidos de materiales (con tu consentimiento)
            </ThemedText>
          </View>
          <ThemedText style={[styles.text, { color: textSecondary, marginTop: Spacing.sm }]}>
            No vendemos ni cedemos tus datos a terceros con fines comerciales.
          </ThemedText>
        </View>

        {/* Transferencias internacionales */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>8. Transferencias Internacionales</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            Algunos de nuestros proveedores de servicios pueden estar ubicados fuera del Espacio Económico Europeo. 
            En estos casos, garantizamos que las transferencias se realizan con las garantías adecuadas:
          </ThemedText>
          <View style={styles.list}>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Decisiones de adecuación de la Comisión Europea</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Cláusulas contractuales tipo aprobadas por la UE</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Normas corporativas vinculantes</ThemedText>
          </View>
        </View>

        {/* Derechos del usuario */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>9. Tus Derechos</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            De acuerdo con el RGPD, tienes los siguientes derechos:
          </ThemedText>
          <View style={styles.list}>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>
              <ThemedText style={styles.bold}>• Derecho de acceso:</ThemedText> Conocer qué datos tenemos sobre ti
            </ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>
              <ThemedText style={styles.bold}>• Derecho de rectificación:</ThemedText> Corregir datos inexactos
            </ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>
              <ThemedText style={styles.bold}>• Derecho de supresión:</ThemedText> Solicitar la eliminación de tus datos ("derecho al olvido")
            </ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>
              <ThemedText style={styles.bold}>• Derecho de oposición:</ThemedText> Oponerte al tratamiento de tus datos
            </ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>
              <ThemedText style={styles.bold}>• Derecho a la limitación:</ThemedText> Solicitar la limitación del tratamiento
            </ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>
              <ThemedText style={styles.bold}>• Derecho a la portabilidad:</ThemedText> Recibir tus datos en formato estructurado
            </ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>
              <ThemedText style={styles.bold}>• Derecho a retirar el consentimiento:</ThemedText> En cualquier momento
            </ThemedText>
          </View>
          <ThemedText style={[styles.text, { color: textSecondary, marginTop: Spacing.sm }]}>
            Puedes ejercer estos derechos desde la sección "Configuración {'>'} Privacidad" de la Aplicación 
            o enviando un email a <ThemedText style={[styles.link, { color: primary }]}>privacidad@pianoemotion.es</ThemedText>
          </ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary, marginTop: Spacing.sm }]}>
            También tienes derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD): 
            <ThemedText style={[styles.link, { color: primary }]}> www.aepd.es</ThemedText>
          </ThemedText>
        </View>

        {/* Seguridad */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>10. Medidas de Seguridad</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            Implementamos medidas técnicas y organizativas apropiadas para proteger tus datos:
          </ThemedText>
          <View style={styles.list}>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Cifrado de datos en tránsito (HTTPS/TLS)</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Cifrado de datos en reposo</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Control de acceso basado en roles</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Copias de seguridad periódicas</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Monitorización de seguridad</ThemedText>
            <ThemedText style={[styles.listItem, { color: textSecondary }]}>• Formación del personal en protección de datos</ThemedText>
          </View>
        </View>

        {/* Cookies */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>11. Cookies y Tecnologías Similares</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            La Aplicación puede utilizar cookies y tecnologías similares para mejorar tu experiencia. 
            Consulta nuestra Política de Cookies para más información sobre qué cookies utilizamos y cómo gestionarlas.
          </ThemedText>
        </View>

        {/* Menores */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>12. Menores de Edad</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            La Aplicación está dirigida a profesionales del sector y no está destinada a menores de 18 años. 
            No recopilamos conscientemente datos de menores. Si detectamos que hemos recopilado datos de un menor, 
            los eliminaremos inmediatamente.
          </ThemedText>
        </View>

        {/* Cambios en la política */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>13. Cambios en esta Política</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            Podemos actualizar esta Política de Privacidad ocasionalmente. Te notificaremos cualquier cambio 
            significativo a través de la Aplicación o por correo electrónico. Te recomendamos revisar esta 
            política periódicamente.
          </ThemedText>
        </View>

        {/* Contacto */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>14. Contacto</ThemedText>
          <ThemedText style={[styles.text, { color: textSecondary }]}>
            Si tienes preguntas sobre esta Política de Privacidad o sobre el tratamiento de tus datos, 
            puedes contactarnos en:
          </ThemedText>
          <View style={styles.contactBox}>
            <Pressable 
              style={[styles.contactButton, { backgroundColor: `${primary}15` }]}
              onPress={() => Linking.openURL('mailto:privacidad@pianoemotion.es')}
            >
              <IconSymbol name="envelope.fill" size={20} color={primary} />
              <ThemedText style={[styles.contactText, { color: primary }]}>
                privacidad@pianoemotion.es
              </ThemedText>
            </Pressable>
          </View>
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
    marginLeft: -Spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  header: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  section: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
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
  list: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  listItem: {
    fontSize: 14,
    lineHeight: 22,
    paddingLeft: Spacing.sm,
  },
  infoBox: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  contactBox: {
    marginTop: Spacing.md,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  contactText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
