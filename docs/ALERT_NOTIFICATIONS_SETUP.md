# Configuración de Notificaciones de Alertas por Email

Este documento describe cómo configurar el sistema de notificaciones por email para alertas de mantenimiento.

## Características Implementadas

### 1. Notificaciones Inmediatas
- Se envían cuando se detecta una alerta urgente
- Incluyen detalles completos del piano, cliente y tipo de servicio
- Diseño profesional con HTML responsive

### 2. Resumen Semanal
- Consolida todas las alertas activas del usuario
- Configurable por día de la semana
- Incluye estadísticas de alertas urgentes vs pendientes
- Lista detallada de todos los pianos que requieren atención

### 3. Configuración por Usuario
- Activar/desactivar notificaciones por email
- Activar/desactivar notificaciones push
- Activar/desactivar resumen semanal
- Seleccionar día de la semana para el resumen

## Servicios de Email Recomendados

### Opción 1: Resend (Recomendado)
**Ventajas:**
- Fácil de integrar
- 100 emails/día gratis
- Excelente deliverability
- API simple y moderna

**Instalación:**
```bash
pnpm add resend
```

**Configuración:**
```typescript
// server/services/email.service.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  const { data, error } = await resend.emails.send({
    from: 'Piano Emotion <alerts@pianoemotion.com>',
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}
```

**Variables de entorno:**
```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxx
```

### Opción 2: SendGrid
**Ventajas:**
- 100 emails/día gratis
- Muy popular y confiable
- Analytics detallados

**Instalación:**
```bash
pnpm add @sendgrid/mail
```

**Configuración:**
```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  await sgMail.send({
    from: 'alerts@pianoemotion.com',
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
}
```

**Variables de entorno:**
```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxx
```

### Opción 3: AWS SES
**Ventajas:**
- Muy económico para alto volumen
- Integración con AWS
- 62,000 emails/mes gratis (desde EC2)

**Instalación:**
```bash
pnpm add @aws-sdk/client-ses
```

**Configuración:**
```typescript
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const ses = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  const command = new SendEmailCommand({
    Source: 'alerts@pianoemotion.com',
    Destination: {
      ToAddresses: [params.to],
    },
    Message: {
      Subject: {
        Data: params.subject,
      },
      Body: {
        Html: {
          Data: params.html,
        },
      },
    },
  });

  await ses.send(command);
}
```

**Variables de entorno:**
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

## Integración en el Código

### 1. Actualizar alert-notification.service.ts

Reemplazar el método `sendEmail` con la implementación real:

```typescript
// En server/services/alert-notification.service.ts

// Importar el servicio de email elegido
import { sendEmail as sendEmailService } from './email.service';

// Actualizar el método sendEmail
private static async sendEmail(data: {...}): Promise<void> {
  // ... preparar datos ...

  // Enviar email con el servicio real
  await sendEmailService({
    to,
    subject,
    html,
  });
}
```

### 2. Configurar Cron Job en Vercel

El archivo `vercel.json` ya está configurado para ejecutar el cron job todos los lunes a las 9:00 AM:

```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-digest",
      "schedule": "0 9 * * 1"
    }
  ]
}
```

**Formato del schedule (cron expression):**
```
┌───────────── minuto (0 - 59)
│ ┌───────────── hora (0 - 23)
│ │ ┌───────────── día del mes (1 - 31)
│ │ │ ┌───────────── mes (1 - 12)
│ │ │ │ ┌───────────── día de la semana (0 - 6) (0 = Domingo)
│ │ │ │ │
│ │ │ │ │
* * * * *
```

**Ejemplos:**
- `0 9 * * 1` - Lunes a las 9:00 AM
- `0 9 * * 2` - Martes a las 9:00 AM
- `0 18 * * 5` - Viernes a las 6:00 PM
- `0 9 * * 1,3,5` - Lunes, Miércoles y Viernes a las 9:00 AM

### 3. Configurar CRON_SECRET

Para proteger el endpoint del cron job:

```env
CRON_SECRET=tu_secreto_aleatorio_muy_largo_y_seguro
```

Generar un secreto seguro:
```bash
openssl rand -base64 32
```

### 4. Probar el Cron Job Localmente

```bash
curl -X GET http://localhost:8081/api/cron/weekly-digest \
  -H "Authorization: Bearer tu_secreto_aleatorio_muy_largo_y_seguro"
```

## Configuración del Dominio de Email

### Para Resend

1. Ir a [Resend Dashboard](https://resend.com/domains)
2. Agregar dominio `pianoemotion.com`
3. Configurar registros DNS:
   ```
   TXT @ "v=spf1 include:_spf.resend.com ~all"
   CNAME resend._domainkey resend._domainkey.resend.com
   MX @ feedback-smtp.resend.com (priority 10)
   ```
4. Verificar dominio
5. Usar `alerts@pianoemotion.com` como remitente

### Para SendGrid

1. Ir a [SendGrid Sender Authentication](https://app.sendgrid.com/settings/sender_auth)
2. Agregar dominio `pianoemotion.com`
3. Configurar registros DNS proporcionados
4. Verificar dominio
5. Usar `alerts@pianoemotion.com` como remitente

### Para AWS SES

1. Ir a [AWS SES Console](https://console.aws.amazon.com/ses/)
2. Verificar dominio `pianoemotion.com`
3. Configurar registros DNS (DKIM, SPF, DMARC)
4. Solicitar salida del sandbox (para producción)
5. Usar `alerts@pianoemotion.com` como remitente

## Testing

### Test de Notificación Inmediata

```typescript
import { AlertNotificationService } from '@/server/services/alert-notification.service';

// Enviar notificación de prueba
await AlertNotificationService.sendUrgentAlertEmail(
  'user_id',
  'piano_id',
  'tuning',
  'urgent'
);
```

### Test de Resumen Semanal

```typescript
import { AlertNotificationService } from '@/server/services/alert-notification.service';

// Enviar resumen semanal de prueba
await AlertNotificationService.sendWeeklyDigest('user_id');
```

### Test del Cron Job

```bash
# En producción (Vercel)
curl -X GET https://www.pianoemotion.com/api/cron/weekly-digest \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Monitoreo

### Logs en Vercel

1. Ir a [Vercel Dashboard](https://vercel.com/dashboard)
2. Seleccionar proyecto Piano Emotion
3. Ir a "Logs"
4. Filtrar por `/api/cron/weekly-digest`

### Verificar Ejecuciones del Cron

1. Ir a "Cron Jobs" en el dashboard de Vercel
2. Ver historial de ejecuciones
3. Verificar errores y tiempos de ejecución

## Troubleshooting

### Los emails no se envían

1. Verificar que `RESEND_API_KEY` (o equivalente) esté configurado en Vercel
2. Verificar que el dominio esté verificado
3. Revisar logs en Vercel
4. Verificar que el usuario tenga email configurado
5. Verificar que las notificaciones estén habilitadas en la configuración del usuario

### El cron job no se ejecuta

1. Verificar que `vercel.json` esté en la raíz del proyecto
2. Verificar que el schedule sea válido
3. Verificar que `CRON_SECRET` esté configurado
4. Revisar logs del cron job en Vercel
5. Verificar que el plan de Vercel soporte cron jobs (Pro o superior)

### Los emails van a spam

1. Configurar SPF, DKIM y DMARC correctamente
2. Usar un dominio verificado
3. Evitar palabras spam en el asunto
4. Incluir enlace de desuscripción
5. Mantener una buena reputación del dominio

## Mejoras Futuras

- [ ] Notificaciones push (Firebase Cloud Messaging)
- [ ] Notificaciones SMS (Twilio)
- [ ] Personalización de plantillas de email
- [ ] A/B testing de asuntos de email
- [ ] Analytics de apertura y clicks
- [ ] Reintento automático en caso de fallo
- [ ] Queue de emails con Bull/BullMQ
- [ ] Rate limiting por usuario
- [ ] Unsubscribe link en emails
- [ ] Preferencias granulares de notificaciones

## Referencias

- [Resend Documentation](https://resend.com/docs)
- [SendGrid Documentation](https://docs.sendgrid.com/)
- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Email Best Practices](https://www.emailonacid.com/blog/article/email-development/email-best-practices/)
