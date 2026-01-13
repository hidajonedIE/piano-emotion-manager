# Diseño del Nuevo Flujo de Onboarding
## Piano Emotion Manager

---

## 📋 Resumen

Este documento describe el nuevo flujo de onboarding expandido que incluye todas las configuraciones personalizadas necesarias para que un nuevo usuario configure completamente su espacio de trabajo.

---

## 🎯 Objetivos

1. **Configuración completa desde el inicio**: El usuario configura todo lo necesario sin tener que buscar opciones después
2. **Experiencia guiada**: Flujo paso a paso claro y sencillo
3. **Extensible**: Fácil agregar nuevas configuraciones en el futuro
4. **No romper nada**: Mantener compatibilidad con el sistema actual

---

## 🔄 Flujo Actual vs Nuevo

### Flujo Actual (3 pasos)
```
Welcome → Step 1 (Info básica) → Step 2 (Personalización) → Step 3 (Config) → Success
```

### Nuevo Flujo Propuesto (8 pasos)
```
Welcome → 
  Step 1: Información Básica de la Empresa →
  Step 2: Datos Fiscales →
  Step 3: Modo de Negocio →
  Step 4: Cliente de Correo Preferido →
  Step 5: Tipos de Servicios y Tareas →
  Step 6: Configuración de Alertas →
  Step 7: Notificaciones y Calendario →
  Step 8: Personalización (Logo y Colores) →
Success
```

---

## 📱 Detalle de Cada Paso

### **Pantalla de Bienvenida** (sin cambios)
- Título: "¡Bienvenido a Piano Emotion!"
- Subtítulo: "Configura tu espacio de trabajo en 8 pasos"
- Botón: "Comenzar"
- Opción: "Omitir por ahora"

---

### **Step 1: Información Básica de la Empresa**
**Mantener campos actuales + agregar nuevos**

**Campos actuales (mantener):**
- Nombre de la empresa *
- Slug (identificador único) *
- Email principal *
- Email de soporte
- Teléfono de soporte

**Campos nuevos a agregar:**
- Teléfono principal *
- Sitio web

**Validaciones:**
- Slug único (ya existe)
- Email único (ya existe)
- Formato de teléfono válido

---

### **Step 2: Datos Fiscales**
**Nueva pantalla**

**Campos:**
- Razón social *
- Nombre comercial
- NIF/CIF *
- Dirección fiscal *
  - Calle y número *
  - Código postal *
  - Ciudad *
  - Provincia *
- IBAN (para facturas)
- Nombre del banco

**Validaciones:**
- NIF/CIF válido (formato español)
- IBAN válido (formato internacional)

---

### **Step 3: Modo de Negocio**
**Mantener del step3 actual**

**Opciones:**
- 🧑 Individual: "Trabajo solo"
- 👥 Equipo: "Trabajo con un equipo"

**Descripción:**
- Individual: Gestión personal, un solo técnico
- Equipo: Múltiples técnicos, asignación de tareas, colaboración

---

### **Step 4: Cliente de Correo Preferido**
**Nueva pantalla**

**Título:** "¿Qué cliente de correo usas?"
**Descripción:** "Selecciona tu cliente preferido para contactar a clientes"

**Opciones (radio buttons):**
- 📧 Gmail
- 📨 Outlook
- 💻 Cliente predeterminado del sistema

**Valor por defecto:** Gmail

---

### **Step 5: Tipos de Servicios y Tareas**
**Nueva pantalla - LA MÁS IMPORTANTE**

**Título:** "Configura tus servicios"
**Descripción:** "Define los tipos de servicios que ofreces y las tareas de cada uno"

**Servicios predefinidos (editables):**

1. **Afinación**
   - Precio sugerido: €80
   - Duración: 1.5 horas
   - Tareas predefinidas:
     - [ ] Revisar tensión de cuerdas
     - [ ] Afinar octavas
     - [ ] Verificar apagadores
     - [ ] Ajustar pedales
     - [ ] Limpieza general

2. **Regulación**
   - Precio sugerido: €150
   - Duración: 3 horas
   - Tareas predefinidas:
     - [ ] Ajustar escape
     - [ ] Nivelar teclas
     - [ ] Regular martillos
     - [ ] Ajustar profundidad de teclas
     - [ ] Verificar mecánica completa

3. **Reparación**
   - Precio sugerido: €100
   - Duración: 2 horas
   - Tareas predefinidas:
     - [ ] Diagnóstico del problema
     - [ ] Reparación de componentes
     - [ ] Verificación final
     - [ ] Prueba de funcionamiento

4. **Mantenimiento Completo**
   - Precio sugerido: €200
   - Duración: 4 horas
   - Tareas predefinidas:
     - [ ] Afinación completa
     - [ ] Regulación básica
     - [ ] Limpieza profunda
     - [ ] Verificación de componentes
     - [ ] Ajuste de pedales

**Funcionalidad:**
- Botón "+ Agregar servicio personalizado"
- Cada servicio es editable (nombre, precio, duración)
- Cada tarea es editable y se pueden agregar/eliminar
- Botón "Usar servicios predefinidos" (carga los 4 de arriba)
- Botón "Personalizar después" (salta este paso)

**Interfaz:**
```
┌─────────────────────────────────────┐
│ Afinación                      [✏️] │
│ €80 • 1.5h                          │
│                                     │
│ Tareas (5):                         │
│ ☐ Revisar tensión de cuerdas       │
│ ☐ Afinar octavas                   │
│ ☐ Verificar apagadores             │
│ ☐ Ajustar pedales                  │
│ ☐ Limpieza general                 │
│ [+ Agregar tarea]                  │
└─────────────────────────────────────┘

[+ Agregar servicio personalizado]
```

---

### **Step 6: Configuración de Alertas**
**Nueva pantalla**

**Título:** "Configura tus alertas"
**Descripción:** "Decide qué alertas quieres recibir y con qué frecuencia"

**Alertas disponibles (switches):**

**Pianos:**
- ✅ Afinación requerida (cada 6 meses)
- ✅ Regulación requerida (cada 12 meses)
- ✅ Mantenimiento general (cada 3 meses)

**Presupuestos:**
- ✅ Presupuestos pendientes de respuesta
- ✅ Presupuestos próximos a expirar (7 días antes)

**Facturas:**
- ✅ Facturas pendientes de pago
- ✅ Facturas vencidas

**Citas:**
- ✅ Citas próximas (24h antes)
- ✅ Citas sin confirmar

**Frecuencia de verificación:**
- Radio buttons:
  - ⚡ Tiempo real (recomendado)
  - 📅 Diaria (9:00 AM)
  - 📅 Semanal (Lunes 9:00 AM)

---

### **Step 7: Notificaciones y Calendario**
**Mantener del step3 actual + agregar nuevos**

**Notificaciones:**
- ✅ Notificaciones push
- ✅ Notificaciones por email
- ⬜ Notificaciones SMS

**Sincronización de Calendario:**
- ⬜ Sincronizar con Google Calendar
- ⬜ Sincronizar con Outlook Calendar

**Descripción:**
"Las citas se sincronizarán automáticamente con tu calendario"

---

### **Step 8: Personalización**
**Mantener del step2 actual**

**Campos:**
- Logo de la empresa (opcional)
- Color primario (picker)
- Color secundario (picker)
- Nombre de marca (opcional)

---

### **Pantalla de Éxito** (mantener actual)
- Título: "¡Todo listo!"
- Descripción: "Tu espacio de trabajo está configurado"
- Botón: "Ir al Dashboard"

---

## 💾 Almacenamiento de Datos

### AsyncStorage (temporal durante onboarding)
```typescript
interface OnboardingData {
  step1: {
    name: string;
    slug: string;
    email: string;
    supportEmail?: string;
    supportPhone?: string;
    phone: string;
    website?: string;
  };
  step2: {
    legalName: string;
    businessName?: string;
    taxId: string;
    address: {
      street: string;
      postalCode: string;
      city: string;
      province: string;
    };
    iban?: string;
    bankName?: string;
  };
  step3: {
    businessMode: 'individual' | 'team';
  };
  step4: {
    emailClientPreference: 'gmail' | 'outlook' | 'default';
  };
  step5: {
    serviceTypes: Array<{
      name: string;
      price: number;
      duration: number; // en horas
      tasks: Array<{
        description: string;
        completed: boolean;
      }>;
    }>;
  };
  step6: {
    alerts: {
      pianoTuning: boolean;
      pianoRegulation: boolean;
      pianoMaintenance: boolean;
      quotesPending: boolean;
      quotesExpiring: boolean;
      invoicesPending: boolean;
      invoicesOverdue: boolean;
      upcomingAppointments: boolean;
      unconfirmedAppointments: boolean;
    };
    alertFrequency: 'realtime' | 'daily' | 'weekly';
  };
  step7: {
    pushNotifications: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    googleCalendarSync: boolean;
    outlookCalendarSync: boolean;
  };
  step8: {
    logo?: string;
    brandName?: string;
    primaryColor: string;
    secondaryColor: string;
  };
}
```

### Base de Datos (al finalizar onboarding)
- Guardar en tabla `partners` (step1 + step2)
- Guardar en tabla `settings` (step3 + step4 + step6 + step7 + step8)
- Guardar en tabla `service_types` (step5)

---

## 🔧 Implementación Técnica

### Archivos a Crear/Modificar

**Crear nuevos:**
- `app/onboarding/step4.tsx` (Cliente de correo)
- `app/onboarding/step5.tsx` (Servicios y tareas)
- `app/onboarding/step6.tsx` (Alertas)
- `app/onboarding/step7.tsx` (Notificaciones y calendario)

**Modificar existentes:**
- `app/onboarding/welcome.tsx` - Cambiar "3 pasos" → "8 pasos"
- `app/onboarding/step1.tsx` - Agregar campos de teléfono y website
- `app/onboarding/step2.tsx` - Renombrar a datos fiscales, cambiar campos
- `app/onboarding/step3.tsx` - Simplificar a solo modo de negocio
- `app/onboarding/success.tsx` - Sin cambios

**Backend:**
- `server/routers/onboarding.router.ts` - Agregar endpoints para guardar nuevos datos

---

## 🎨 Componentes Reutilizables

### ServiceTypeCard
```tsx
<ServiceTypeCard
  name="Afinación"
  price={80}
  duration={1.5}
  tasks={[...]}
  onEdit={() => {}}
  onDelete={() => {}}
/>
```

### TaskItem
```tsx
<TaskItem
  description="Revisar tensión de cuerdas"
  completed={false}
  onToggle={() => {}}
  onEdit={() => {}}
  onDelete={() => {}}
/>
```

### AlertToggle
```tsx
<AlertToggle
  title="Afinación requerida"
  description="Cada 6 meses"
  enabled={true}
  onToggle={() => {}}
/>
```

---

## ✅ Validaciones

### Step 1
- Nombre: requerido, min 2 caracteres
- Slug: requerido, único, solo letras minúsculas y guiones
- Email: requerido, único, formato válido
- Teléfono: requerido, formato válido

### Step 2
- Razón social: requerido
- NIF/CIF: requerido, formato válido
- Dirección completa: todos los campos requeridos
- IBAN: opcional, pero si se proporciona debe ser válido

### Step 5
- Al menos 1 servicio configurado
- Cada servicio debe tener nombre, precio > 0, duración > 0
- Al menos 1 tarea por servicio

---

## 🚀 Plan de Implementación

### Fase 1: Preparación
1. ✅ Revisar código actual
2. ✅ Diseñar flujo completo
3. ⏳ Crear componentes reutilizables
4. ⏳ Actualizar tipos TypeScript

### Fase 2: Implementación
1. ⏳ Modificar welcome.tsx
2. ⏳ Modificar step1.tsx
3. ⏳ Crear step2.tsx (datos fiscales)
4. ⏳ Simplificar step3.tsx (modo negocio)
5. ⏳ Crear step4.tsx (cliente correo)
6. ⏳ Crear step5.tsx (servicios y tareas)
7. ⏳ Crear step6.tsx (alertas)
8. ⏳ Crear step7.tsx (notificaciones)
9. ⏳ Renombrar step2 actual → step8.tsx (personalización)

### Fase 3: Backend
1. ⏳ Actualizar router de onboarding
2. ⏳ Crear endpoints para guardar datos
3. ⏳ Migración de BD si es necesario

### Fase 4: Testing
1. ⏳ Probar flujo completo
2. ⏳ Verificar que no rompe nada existente
3. ⏳ Probar con datos reales

### Fase 5: Despliegue
1. ⏳ Commit y push
2. ⏳ Verificar en producción

---

## ⚠️ Consideraciones de Seguridad

1. **No romper el flujo actual**: Mantener compatibilidad con usuarios que ya completaron onboarding
2. **Validación en backend**: Todas las validaciones deben replicarse en el servidor
3. **Datos sensibles**: NIF/CIF, IBAN deben encriptarse
4. **Opcionalidad**: Permitir "Omitir por ahora" en pasos no críticos

---

## 📊 Métricas de Éxito

- ✅ 100% de usuarios completan al menos los pasos 1-3 (críticos)
- ✅ 80%+ de usuarios completan el paso 5 (servicios)
- ✅ Tiempo promedio de onboarding: < 10 minutos
- ✅ 0 errores críticos durante el flujo

---

## 🔮 Futuras Extensiones

El sistema está diseñado para agregar fácilmente:
- Step 9: Integración con WhatsApp Business
- Step 10: Configuración de pasarela de pago
- Step 11: Importación de datos desde otro sistema
- Step 12: Configuración de equipos y permisos

Para agregar un nuevo paso:
1. Crear `app/onboarding/stepN.tsx`
2. Agregar campos a `OnboardingData` interface
3. Actualizar welcome.tsx con el nuevo paso
4. Agregar endpoint en backend si es necesario

---

## 📝 Notas Finales

- Este diseño mantiene la estructura actual y solo expande
- Todos los cambios son retrocompatibles
- El usuario puede omitir pasos no críticos
- Los datos se guardan paso a paso (no se pierden si cierra la app)
- Se puede volver atrás y editar pasos anteriores

---

**Documento creado:** 13 de enero de 2026  
**Versión:** 1.0  
**Estado:** Pendiente de aprobación
