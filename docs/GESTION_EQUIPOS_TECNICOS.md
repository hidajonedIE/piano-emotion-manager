# Guía de Implementación: Gestión de Equipos de Técnicos

**Autor:** Manus AI  
**Fecha:** 24 de diciembre de 2025  
**Versión:** 2.0 (Implementación Completa)  
**Proyecto:** Piano Emotion Manager

> **✅ ESTADO: IMPLEMENTACIÓN 100% FUNCIONAL**  
> Todas las funcionalidades han sido implementadas y están listas para producción.

---

## Índice

1. [Introducción](#1-introducción)
2. [Arquitectura Multi-Tenant](#2-arquitectura-multi-tenant)
3. [Modelo de Datos](#3-modelo-de-datos)
4. [Sistema de Roles y Permisos](#4-sistema-de-roles-y-permisos)
5. [Servicios Backend](#5-servicios-backend)
6. [Componentes de Interfaz](#6-componentes-de-interfaz)
7. [Flujos de Usuario](#7-flujos-de-usuario)
8. [Migración de Datos](#8-migración-de-datos)
9. [Configuración y Despliegue](#9-configuración-y-despliegue)
10. [Próximos Pasos](#10-próximos-pasos)

---

## 1. Introducción

Este documento describe la implementación del módulo de **Gestión de Equipos de Técnicos** para Piano Emotion Manager. Esta funcionalidad permite a empresas de servicios de pianos con múltiples técnicos gestionar su equipo de forma centralizada, asignar trabajos, y monitorizar el rendimiento.

### 1.1 Objetivos

El módulo de gestión de equipos tiene como objetivos principales:

- Permitir que una **organización** agrupe múltiples usuarios bajo una misma entidad.
- Implementar un sistema de **roles y permisos** granular para controlar el acceso a funcionalidades.
- Facilitar la **asignación de trabajos** a técnicos específicos del equipo.
- Proporcionar un **calendario compartido** para visualizar la disponibilidad del equipo.
- Ofrecer un **dashboard de administración** con métricas de rendimiento.

### 1.2 Archivos Creados

| Archivo | Descripción |
|---------|-------------|
| `drizzle/team-schema.ts` | Esquema de base de datos para organizaciones y equipos |
| `server/services/team/organization.service.ts` | Servicio de gestión de organizaciones |
| `server/services/team/work-assignment.service.ts` | Servicio de asignación de trabajos |
| `server/services/team/permissions.service.ts` | Sistema de roles y permisos |
| `components/team/TeamMembersList.tsx` | Lista de miembros del equipo |
| `components/team/TeamCalendar.tsx` | Calendario compartido |
| `components/team/WorkAssignmentModal.tsx` | Modal de asignación de trabajos |
| `components/team/TeamDashboard.tsx` | Dashboard de administración |

---

## 2. Arquitectura Multi-Tenant

### 2.1 Modelo Conceptual

La arquitectura multi-tenant implementada sigue el patrón de **tenant por organización**, donde cada organización tiene sus propios datos aislados de otras organizaciones.

```
┌─────────────────────────────────────────────────────────────┐
│                        ORGANIZACIÓN                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   ADMIN     │  │   MANAGER   │  │  TÉCNICO    │          │
│  │  (Owner)    │  │             │  │             │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│         │                │                │                  │
│         └────────────────┼────────────────┘                  │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              DATOS DE LA ORGANIZACIÓN               │    │
│  │  • Clientes    • Pianos     • Servicios             │    │
│  │  • Citas       • Facturas   • Inventario            │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Aislamiento de Datos

Todas las tablas de datos principales incluyen un campo `organizationId` que garantiza el aislamiento de datos entre organizaciones. Las consultas a la base de datos siempre filtran por este campo.

```typescript
// Ejemplo de consulta con aislamiento
const clients = await db
  .select()
  .from(clients)
  .where(eq(clients.organizationId, currentOrganizationId));
```

---

## 3. Modelo de Datos

### 3.1 Tabla `organizations`

Almacena la información de cada empresa u organización.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `int` | Identificador único |
| `name` | `varchar(255)` | Nombre de la organización |
| `slug` | `varchar(100)` | Identificador URL-friendly único |
| `ownerId` | `int` | ID del usuario propietario |
| `subscriptionPlan` | `enum` | Plan de suscripción |
| `maxMembers` | `int` | Límite de miembros según plan |
| `taxId` | `varchar(50)` | NIF/CIF de la empresa |
| `address`, `city`, `postalCode` | `text/varchar` | Dirección fiscal |
| `invoicePrefix` | `varchar(10)` | Prefijo para facturas |
| `defaultTaxRate` | `decimal` | IVA por defecto |
| `workingHoursStart/End` | `varchar(5)` | Horario laboral |
| `workingDays` | `json` | Días laborables [1,2,3,4,5] |

### 3.2 Tabla `organization_members`

Relaciona usuarios con organizaciones y define su rol.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `int` | Identificador único |
| `organizationId` | `int` | FK a organizations |
| `userId` | `int` | FK a users |
| `role` | `enum` | Rol del miembro |
| `status` | `enum` | Estado (active, pending, suspended) |
| `displayName` | `varchar(100)` | Nombre a mostrar |
| `color` | `varchar(7)` | Color para calendario |
| `canBeAssigned` | `boolean` | Puede recibir asignaciones |
| `maxDailyAppointments` | `int` | Límite diario de citas |
| `assignedZones` | `json` | Zonas geográficas asignadas |
| `specialties` | `json` | Especialidades del técnico |

### 3.3 Tabla `work_assignments`

Registra las asignaciones de trabajos a técnicos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `int` | Identificador único |
| `organizationId` | `int` | FK a organizations |
| `appointmentId` | `int` | FK a appointments (opcional) |
| `serviceId` | `int` | FK a services (opcional) |
| `technicianId` | `int` | FK a users |
| `status` | `enum` | Estado de la asignación |
| `priority` | `enum` | Prioridad (low, normal, high, urgent) |
| `scheduledDate` | `timestamp` | Fecha programada |
| `scheduledStartTime` | `varchar(5)` | Hora de inicio |
| `estimatedDuration` | `int` | Duración estimada (minutos) |
| `actualStartTime` | `timestamp` | Hora real de inicio |
| `actualEndTime` | `timestamp` | Hora real de fin |

### 3.4 Tablas Adicionales

- **`organization_invitations`**: Invitaciones pendientes
- **`service_zones`**: Zonas geográficas de servicio
- **`technician_zones`**: Asignación técnico-zona
- **`member_absences`**: Vacaciones y ausencias
- **`organization_activity_log`**: Registro de actividad
- **`technician_metrics`**: Métricas de rendimiento

---

## 4. Sistema de Roles y Permisos

### 4.1 Roles Disponibles

| Rol | Descripción | Nivel |
|-----|-------------|-------|
| `owner` | Propietario de la organización | 1 |
| `admin` | Administrador con control total | 2 |
| `manager` | Gestor de técnicos y trabajos | 3 |
| `senior_tech` | Técnico senior con permisos ampliados | 4 |
| `technician` | Técnico estándar | 5 |
| `apprentice` | Aprendiz en formación | 6 |
| `receptionist` | Gestión de citas y clientes | 7 |
| `accountant` | Solo facturación y reportes | 8 |
| `viewer` | Solo lectura | 9 |

### 4.2 Matriz de Permisos

```
Recurso          | owner | admin | manager | senior | tech | apprentice | recept | account | viewer
-----------------|-------|-------|---------|--------|------|------------|--------|---------|-------
organization     | CRUD  | RU    | R       | R      | R    | R          | R      | R       | R
members          | CRUD  | CRUD  | RU(t)   | R(t)   | -    | -          | R      | -       | R
clients          | CRUD  | CRUD  | CRUD    | CRUD   | RU(o)| R(o)       | CRUD   | R       | R
appointments     | CRUD+A| CRUD+A| CRUD+A  | CRU+A(t)| RU(o)| R(o)      | CRUD+A | -       | R
services         | CRUD  | CRUD  | CRUD    | CRU    | CRU(o)| RU(o)     | R      | R       | R
invoices         | CRUD  | CRUD  | R       | R(o)   | R(o) | -          | -      | CRUD    | R
assignments      | CRUD+A| CRUD+A| CRUD+A  | RU+A(t)| RU(o)| R(o)       | CRA    | -       | R
reports          | R     | R     | R       | R(t)   | -    | -          | -      | R       | R

Leyenda: C=Create, R=Read, U=Update, D=Delete, A=Assign
         (o)=own, (t)=team, sin sufijo=all
```

### 4.3 Uso del Sistema de Permisos

```typescript
import { permissionsService, requirePermission } from './services/team';

// Verificar permiso en código
const canEdit = await permissionsService.hasPermission(
  userId,
  organizationId,
  'clients',
  'update'
);

// Middleware para rutas de API
router.post('/clients', requirePermission('clients', 'create'), createClient);
```

---

## 5. Servicios Backend

### 5.1 OrganizationService

Gestiona la creación y administración de organizaciones.

```typescript
import { organizationService } from './services/team';

// Crear organización
const org = await organizationService.create({
  name: 'Piano Services Madrid',
  ownerId: userId,
  taxId: 'B12345678',
  email: 'info@pianoservices.es',
});

// Invitar miembro
await organizationService.inviteMember({
  organizationId: org.id,
  email: 'tecnico@email.com',
  role: 'technician',
  invitedBy: userId,
});

// Cambiar rol
await organizationService.changeMemberRole(
  organizationId,
  memberId,
  'senior_tech',
  changedByUserId
);
```

### 5.2 WorkAssignmentService

Gestiona la asignación de trabajos a técnicos.

```typescript
import { workAssignmentService } from './services/team';

// Crear asignación
const assignment = await workAssignmentService.create({
  organizationId,
  appointmentId: 123,
  technicianId: techUserId,
  scheduledDate: new Date('2025-01-15'),
  scheduledStartTime: '10:00',
  estimatedDuration: 90,
  priority: 'normal',
  assignedBy: managerUserId,
});

// Verificar disponibilidad
const availability = await workAssignmentService.checkTechnicianAvailability(
  organizationId,
  technicianId,
  date
);

// Obtener calendario diario
const schedule = await workAssignmentService.getDailySchedule(
  organizationId,
  new Date()
);

// Reasignar trabajo
await workAssignmentService.reassign({
  assignmentId: assignment.id,
  newTechnicianId: otherTechId,
  reassignedBy: managerUserId,
  reason: 'Técnico original enfermo',
});
```

---

## 6. Componentes de Interfaz

### 6.1 TeamMembersList

Lista y gestión de miembros del equipo.

```tsx
import { TeamMembersList } from '@/components/team';

<TeamMembersList
  members={teamMembers}
  onInviteMember={handleInvite}
  onChangeMemberRole={handleRoleChange}
  onSuspendMember={handleSuspend}
  onRemoveMember={handleRemove}
  onRefresh={refetchMembers}
  isLoading={isLoading}
/>
```

### 6.2 TeamCalendar

Calendario compartido con vista de todos los técnicos.

```tsx
import { TeamCalendar } from '@/components/team';

<TeamCalendar
  schedule={dailySchedule}
  onDateChange={setSelectedDate}
  onAssignmentPress={handleAssignmentPress}
  onCreateAssignment={handleCreateAssignment}
  workingHoursStart="08:00"
  workingHoursEnd="20:00"
/>
```

### 6.3 WorkAssignmentModal

Modal para asignar o reasignar trabajos.

```tsx
import { WorkAssignmentModal } from '@/components/team';

<WorkAssignmentModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  appointment={selectedAppointment}
  technicians={availableTechnicians}
  selectedDate={selectedDate}
  onAssign={handleAssign}
  onReassign={handleReassign}
/>
```

### 6.4 TeamDashboard

Dashboard con métricas y estadísticas del equipo.

```tsx
import { TeamDashboard } from '@/components/team';

<TeamDashboard
  organizationName="Piano Services Madrid"
  stats={organizationStats}
  technicianMetrics={metrics}
  period={selectedPeriod}
  onPeriodChange={setPeriod}
  onTechnicianPress={handleTechnicianPress}
  onViewCalendar={navigateToCalendar}
  onManageTeam={navigateToTeam}
/>
```

---

## 7. Flujos de Usuario

### 7.1 Creación de Organización

1. Usuario se registra en la aplicación
2. Accede a "Crear Organización"
3. Completa datos de la empresa
4. Se crea la organización con el usuario como `owner`
5. Se redirige al dashboard de la organización

### 7.2 Invitación de Miembros

1. Admin/Owner accede a "Gestión de Equipo"
2. Pulsa "Invitar Miembro"
3. Introduce email y selecciona rol
4. Sistema envía email de invitación
5. Invitado acepta y se une a la organización

### 7.3 Asignación de Trabajo

1. Manager/Admin crea nueva cita
2. Sistema muestra técnicos disponibles
3. Selecciona técnico y confirma asignación
4. Técnico recibe notificación
5. Técnico acepta/rechaza asignación
6. Trabajo aparece en calendario del técnico

### 7.4 Ejecución de Trabajo

1. Técnico ve trabajo en su calendario
2. Pulsa "Iniciar Trabajo" al llegar
3. Completa el servicio
4. Registra materiales usados y notas
5. Pulsa "Completar Trabajo"
6. Sistema actualiza métricas

---

## 8. Migración de Datos

### 8.1 Estrategia de Migración

Para usuarios existentes que deseen crear una organización:

1. **Crear organización** con datos de `businessInfo` existente
2. **Migrar datos** actualizando `odId` a `organizationId`
3. **Asignar técnico** a todos los servicios existentes

### 8.2 Script de Migración

```typescript
async function migrateToOrganization(userId: number) {
  // 1. Obtener businessInfo existente
  const businessInfo = await getBusinessInfo(userId);
  
  // 2. Crear organización
  const org = await organizationService.create({
    name: businessInfo.name,
    ownerId: userId,
    taxId: businessInfo.taxId,
    address: businessInfo.address,
    // ...
  });
  
  // 3. Migrar datos
  await db.update(clients)
    .set({ organizationId: org.id })
    .where(eq(clients.odId, userId));
  
  await db.update(services)
    .set({ 
      organizationId: org.id,
      technicianId: userId 
    })
    .where(eq(services.odId, userId));
  
  // ... migrar otras tablas
  
  return org;
}
```

---

## 9. Configuración y Despliegue

### 9.1 Variables de Entorno

```env
# Email para invitaciones
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASS=secret

# URL de la aplicación (para enlaces de invitación)
APP_URL=https://app.pianoemotion.com
```

### 9.2 Migraciones de Base de Datos

```bash
# Generar migración
npx drizzle-kit generate:mysql

# Aplicar migración
npx drizzle-kit push:mysql
```

### 9.3 Planes de Suscripción

| Plan | Miembros | Precio Sugerido |
|------|----------|-----------------|
| Free | 1 | €0/mes |
| Starter | 3 | €19/mes |
| Team | 10 | €49/mes |
| Business | 25 | €99/mes |
| Enterprise | Ilimitado | Contactar |

---

## 10. Implementación Completa

### 10.1 Componentes Implementados

| Componente | Estado | Archivos |
|------------|--------|----------|
| **Rutas de API (tRPC)** | ✅ Completo | `server/routers/team.router.ts`, `team-extended.router.ts` |
| **Hooks de React** | ✅ Completo | `hooks/use-organization.ts`, `use-team-members.ts`, `use-work-assignments.ts` |
| **Páginas/Screens** | ✅ Completo | `app/(app)/team/index.tsx`, `members.tsx`, `calendar.tsx`, `settings.tsx` |
| **Sistema de Email** | ✅ Completo | `server/services/email/email.service.ts` |
| **Notificaciones Push** | ✅ Completo | `server/services/notifications/notification.service.ts`, `hooks/use-notifications.ts` |
| **Tests** | ✅ Completo | `__tests__/team/organization.service.test.ts`, `team.router.test.ts` |

### 10.2 Archivos Creados en Esta Versión

**Backend (API):**
- `server/routers/team.router.ts` - Router principal de equipos
- `server/routers/team-extended.router.ts` - Ausencias, métricas, zonas
- `server/routers/index.ts` - Exportaciones

**Frontend (Hooks):**
- `hooks/use-organization.ts` - Gestión de organizaciones
- `hooks/use-team-members.ts` - Gestión de miembros
- `hooks/use-work-assignments.ts` - Asignaciones de trabajo
- `hooks/team/index.ts` - Exportaciones

**Frontend (Páginas):**
- `app/(app)/team/_layout.tsx` - Layout de navegación
- `app/(app)/team/index.tsx` - Dashboard principal
- `app/(app)/team/members.tsx` - Gestión de miembros
- `app/(app)/team/calendar.tsx` - Calendario compartido
- `app/(app)/team/settings.tsx` - Configuración
- `app/(app)/team/create-organization.tsx` - Crear organización

**Servicios:**
- `server/services/email/email.service.ts` - Envío de emails
- `server/services/email/index.ts` - Exportaciones
- `server/services/notifications/notification.service.ts` - Notificaciones push
- `server/services/notifications/index.ts` - Exportaciones

**Tests:**
- `__tests__/team/organization.service.test.ts` - Tests unitarios
- `__tests__/team/team.router.test.ts` - Tests de integración

### 10.3 Funcionalidades de Notificaciones

El sistema de notificaciones incluye:

1. **Notificaciones Push:**
   - Nueva asignación de trabajo
   - Trabajo completado
   - Invitación recibida/aceptada
   - Reasignación de trabajo
   - Recordatorios programados

2. **Emails Transaccionales:**
   - Invitación a organización (HTML responsive)
   - Notificación de nueva asignación
   - Trabajo completado (para managers)

### 10.4 Próximas Mejoras Sugeridas

1. **Optimización de Rutas**: Sugerir orden de visitas por proximidad geográfica
2. **Chat Interno**: Comunicación en tiempo real entre miembros
3. **Reportes Avanzados**: Exportación a PDF/Excel con gráficos
4. **API Pública**: Documentación OpenAPI para integraciones
5. **App de Técnico**: Versión simplificada para técnicos en campo

### 10.5 Notas de Despliegue

- Implementar **geolocalización** para tracking de técnicos
- Añadir **firma digital** en servicios completados
- Integrar **calendario externo** (Google Calendar, Outlook)
- Desarrollar **app móvil nativa** para técnicos

---

## Soporte

Para dudas o problemas con la implementación, contactar al equipo de desarrollo.

**Documento generado por Manus AI**
