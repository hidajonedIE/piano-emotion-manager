# Sistema de Notificaciones de Alertas

## Descripción

El sistema de notificaciones envía emails automáticos para alertar sobre pianos que requieren mantenimiento. Los emails se envían **desde tu propia cuenta de Gmail o Outlook**, sin necesidad de configuración adicional.

## Cómo Funciona

### 1. Detección Automática
El sistema detecta automáticamente si tienes conectado:
- **Gmail** (personal o Google Workspace)
- **Outlook** (personal o Microsoft 365)

### 2. Envío Transparente
Los emails se envían directamente desde tu cuenta, como si los enviaras tú manualmente. Esto garantiza:
- ✅ Máxima confiabilidad de entrega
- ✅ Los destinatarios ven tu email real
- ✅ Sin costos adicionales
- ✅ Sin límites artificiales

## Tipos de Notificaciones

### Notificaciones Inmediatas
Se envían cuando se detecta una alerta urgente:
- Piano requiere afinación urgente (más de 9 meses)
- Piano requiere regulación urgente (más de 3 años)

**Contenido del email:**
- Información del piano (marca, modelo, número de serie)
- Información del cliente
- Tipo de servicio requerido
- Enlace directo a la aplicación

### Resumen Semanal
Consolida todas las alertas activas en un solo email:
- Se envía el día de la semana que elijas
- Incluye estadísticas (urgentes vs pendientes)
- Lista detallada de todos los pianos que requieren atención

## Configuración

### Activar/Desactivar Notificaciones

**Para usuarios regulares:**
1. Ve a **Configuración** → **Alertas**
2. Activa/desactiva las opciones:
   - Notificaciones por email
   - Resumen semanal
3. Selecciona el día de la semana para el resumen

**Para administradores:**
1. Ve a **Administración** → **Configuración Global de Alertas**
2. Configura los umbrales por defecto
3. Activa/desactiva notificaciones globales

### Configurar Umbrales por Piano

Puedes personalizar los intervalos de mantenimiento para cada piano:

1. Abre el piano que deseas configurar
2. Desplázate a la sección **Configuración de Alertas**
3. Activa **Alertas de mantenimiento**
4. Activa **Usar umbrales personalizados**
5. Configura los intervalos:
   - **Afinación**: Cada cuántos días debe afinarse
   - **Regulación**: Cada cuántos días debe regularse

**Ejemplos de intervalos:**
- Piano de concierto: 90 días (3 meses) para afinación
- Piano doméstico: 180 días (6 meses) para afinación
- Piano escolar: 120 días (4 meses) para afinación

## Permisos Necesarios

### Gmail
La primera vez que se envíe un email, se te pedirá autorizar a la aplicación para:
- Enviar emails en tu nombre
- Acceder a tu perfil de Gmail

**Estos permisos son seguros y estándar** para aplicaciones que envían emails.

### Outlook
Si usas Outlook, los permisos son similares:
- Enviar emails en tu nombre
- Acceder a tu perfil de Outlook

## Solución de Problemas

### No recibo notificaciones

**Verifica:**
1. ¿Tienes Gmail u Outlook conectado?
   - Ve a Configuración → Cuenta
   - Verifica que tu email esté conectado
2. ¿Están activadas las notificaciones?
   - Ve a Configuración → Alertas
   - Verifica que "Notificaciones por email" esté activado
3. ¿Hay alertas activas?
   - Ve al Dashboard
   - Verifica la sección de Alertas
4. ¿Revisa tu carpeta de spam?
   - Los emails se envían desde tu cuenta, pero algunos filtros pueden bloquearlos

### Los emails van a spam

**Soluciones:**
1. Marca el email como "No es spam"
2. Agrega tu propio email a tus contactos
3. Crea una regla de filtro para que los emails de alertas vayan a una carpeta específica

### El resumen semanal no llega

**Verifica:**
1. ¿Está activado el resumen semanal?
   - Ve a Configuración → Alertas
   - Verifica que "Resumen semanal" esté activado
2. ¿Es el día correcto?
   - Verifica qué día de la semana configuraste
   - El resumen se envía a las 9:00 AM
3. ¿Hay alertas para enviar?
   - Si no tienes alertas activas, no se envía el resumen

## Preguntas Frecuentes

### ¿Puedo usar otro servicio de email?
Actualmente solo soportamos Gmail y Outlook. Si usas otro servicio, contáctanos para evaluar agregarlo.

### ¿Los emails cuentan contra mi límite de Gmail/Outlook?
Sí, pero los límites son muy generosos:
- **Gmail personal**: 500 emails/día
- **Google Workspace**: 2000 emails/día
- **Outlook personal**: 300 emails/día
- **Microsoft 365**: 10,000 emails/día

Para un uso normal de la aplicación, nunca llegarás a estos límites.

### ¿Puedo personalizar las plantillas de email?
Actualmente las plantillas son fijas, pero estamos trabajando en permitir personalizarlas. Contáctanos si necesitas algo específico.

### ¿Los destinatarios pueden responder los emails?
Sí, los emails se envían desde tu cuenta real, así que cualquier respuesta llegará directamente a tu bandeja de entrada.

### ¿Puedo desactivar las notificaciones temporalmente?
Sí, ve a Configuración → Alertas y desactiva "Notificaciones por email". Puedes reactivarlas cuando quieras.

### ¿Qué pasa si cambio de cuenta de email?
Si cambias de Gmail a Outlook (o viceversa), el sistema detectará automáticamente el cambio y usará la nueva cuenta.

## Privacidad y Seguridad

- **Tus credenciales nunca se almacenan** en nuestros servidores
- **Los emails se envían directamente** desde tu cuenta
- **No tenemos acceso** a tu bandeja de entrada
- **Solo podemos enviar emails**, no leer ni eliminar
- **Puedes revocar los permisos** en cualquier momento desde tu cuenta de Google/Microsoft

## Soporte

Si tienes problemas con las notificaciones:
1. Revisa esta documentación
2. Verifica tu configuración
3. Contacta al soporte en https://help.manus.im
