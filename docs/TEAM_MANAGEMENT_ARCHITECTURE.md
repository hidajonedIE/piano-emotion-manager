# Arquitectura Multi-Tenant y Gestión de Equipos

**Autor:** Manus AI
**Fecha:** 24 de diciembre de 2025
**Versión:** 1.0

## 1. Visión General

Este documento describe la arquitectura y el diseño del esquema de base de datos para implementar la funcionalidad de **gestión de equipos de técnicos** en la aplicación **Piano Emotion Manager**. El objetivo es evolucionar de un modelo de usuario único a un modelo **multi-tenant**, donde una **Organización** puede tener múltiples **Miembros** (usuarios) con diferentes roles y permisos.

## 2. Modelo de Datos

Se introducirán nuevas tablas y se modificarán las existentes para soportar la estructura de organizaciones.

### 2.1. Nuevas Tablas

#### `organizations`

Esta tabla almacenará la información de cada empresa o equipo de técnicos.

| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `int` | PK, Auto-incremento |
| `name` | `varchar(255)` | Nombre de la organización. |
| `ownerId` | `int` | FK a `users.id`. El usuario que creó la organización. |
| `subscriptionPlan` | `enum` | Plan de suscripción (ej: 'free', 'team', 'enterprise'). |
| `createdAt` | `timestamp` | Fecha de creación. |
| `updatedAt` | `timestamp` | Fecha de última actualización. |

#### `organization_members`

Tabla pivote que asocia usuarios a organizaciones y les asigna un rol.

| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `organizationId` | `int` | FK a `organizations.id`. |
| `userId` | `int` | FK a `users.id`. |
| `role` | `enum` | Rol del usuario en la organización. |
| `status` | `enum` | Estado de la membresía (ej: 'active', 'pending_invitation'). |
| `invitedAt` | `timestamp` | Fecha de invitación. |
| `joinedAt` | `timestamp` | Fecha de unión. |

### 2.2. Roles de Usuario

Se definirá un `enum` con los siguientes roles dentro de una organización:

-   `admin`: Control total sobre la organización, incluyendo facturación, gestión de miembros y configuración.
-   `technician`: Puede ser asignado a trabajos, ver su propio calendario, registrar servicios y ver clientes. No puede ver datos de otros técnicos ni gestionar la organización.
-   `manager`: Puede ver el calendario de todos los técnicos, asignar trabajos y ver reportes de todo el equipo. No puede gestionar la facturación ni los miembros de la organización.
-   `viewer`: Rol de solo lectura. Puede ver calendarios y reportes pero no puede modificar nada.

### 2.3. Modificaciones a Tablas Existentes

El principal cambio será reemplazar el campo `odId` (Owner user ID) por `organizationId` en todas las tablas de datos principales. Esto asegura que todos los datos (clientes, pianos, servicios, etc.) pertenezcan a una organización en lugar de a un usuario individual.

**Tablas a modificar:**

-   `clients`: `odId` -> `organizationId`
-   `pianos`: `odId` -> `organizationId`
-   `services`: `odId` -> `organizationId`. Se añadirá un campo `technicianId` (FK a `users.id`) para asignar el servicio a un técnico específico.
-   `inventory`: `odId` -> `organizationId`
-   `appointments`: `odId` -> `organizationId`. Se añadirá un campo `technicianId`.
-   `invoices`: `odId` -> `organizationId`
-   `serviceRates`: `odId` -> `organizationId`
-   `businessInfo`: Se reemplazará por la tabla `organizations`.
-   `reminders`: `odId` -> `organizationId`. Se añadirá un campo `technicianId`.

## 3. Lógica de Acceso a Datos (Row-Level Security)

La lógica de acceso a los datos se basará en el `organizationId` del usuario autenticado. Todas las consultas a la base de datos deberán incluir una cláusula `WHERE organizationId = ?` para asegurar el aislamiento de los datos entre organizaciones.

El rol del usuario determinará qué puede hacer con esos datos:

-   Un `technician` solo podrá ver las citas y servicios donde `technicianId` sea su propio `userId`.
-   Un `manager` o `admin` podrá ver todos los datos de su `organizationId`.

## 4. Flujo de Usuario

1.  **Registro y Creación de Organización:** Un nuevo usuario se registra y crea una nueva organización, convirtiéndose en su `owner` y `admin`.
2.  **Invitación de Miembros:** El `admin` puede invitar a nuevos miembros a su organización por email.
3.  **Aceptación de Invitación:** El usuario invitado recibe un email, se registra (si no tiene cuenta) y acepta la invitación, pasando a ser miembro de la organización con el rol asignado.
4.  **Asignación de Trabajos:** Un `admin` o `manager` crea una nueva cita/servicio y la asigna a un técnico disponible del equipo.
5.  **Ejecución del Trabajo:** El técnico asignado ve el trabajo en su calendario, lo realiza y completa la información del servicio.
6.  **Supervisión:** El `manager` puede ver el estado de todos los trabajos en un calendario o dashboard compartido.

Este diseño proporciona una base sólida para construir una aplicación multi-tenant robusta y escalable.
