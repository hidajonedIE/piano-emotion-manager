# Sistema de Licencias de Piano Emotion

## Visión General

El sistema de licencias permite a Piano Emotion gestionar el acceso de técnicos a la aplicación, tanto individuales como clientes de distribuidores.

## Modelo de Negocio

```
┌─────────────────────────────────────────────────────────────────┐
│                     PIANO EMOTION (Admin)                        │
│                                                                  │
│  • Crea distribuidores                                          │
│  • Configura módulos por distribuidor                           │
│  • Genera licencias con configuración específica                │
│  • Gestiona todo el sistema                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │                               │
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│   LICENCIA DIRECTA      │     │  LICENCIA DISTRIBUIDOR  │
│                         │     │                         │
│  • Técnico individual   │     │  • Distribuidor pide    │
│  • Compra directa a PE  │     │    X licencias con Y    │
│  • Config estándar PE   │     │    configuración        │
│                         │     │  • PE genera el lote    │
│                         │     │  • Distribuidor entrega │
│                         │     │    a sus clientes       │
└─────────────────────────┘     └─────────────────────────┘
              │                               │
              ▼                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         TÉCNICO                                  │
│                                                                  │
│  1. Descarga la app                                             │
│  2. Introduce código de licencia (PE-XXXX-XXXX-XXXX)           │
│  3. App se configura automáticamente según la licencia          │
│  4. Accede a los módulos permitidos                             │
│  5. Ve la tienda correspondiente (PE o distribuidor)            │
└─────────────────────────────────────────────────────────────────┘
```

## Tipos de Licencia

| Tipo | Descripción | Uso típico |
|------|-------------|------------|
| `trial` | Prueba gratuita temporal | Nuevos usuarios, demos |
| `free` | Gratuita permanente con límites | Usuarios básicos |
| `starter` | Funcionalidades básicas | Técnicos individuales |
| `professional` | Funcionalidades avanzadas | Técnicos profesionales |
| `enterprise` | Todo incluido + equipos | Empresas, distribuidores |

## Estados de Licencia

| Estado | Descripción |
|--------|-------------|
| `available` | Generada pero no activada |
| `active` | Activada y en uso |
| `expired` | Expiró la fecha de validez |
| `revoked` | Revocada por el admin |
| `suspended` | Suspendida temporalmente |

## Tablas de Base de Datos

### `platform_admins`
Administradores de Piano Emotion que pueden gestionar el sistema.

### `license_templates`
Plantillas predefinidas para crear licencias rápidamente.

### `licenses`
Licencias individuales con su código único y configuración.

### `license_batches`
Lotes de licencias generados para distribuidores.

### `license_history`
Historial de cambios para auditoría.

## Flujo de Trabajo

### 1. Crear un Distribuidor

```
Admin PE → Panel Admin → Nuevo Distribuidor
  ├── Datos básicos (nombre, contacto, logo)
  ├── Configuración WooCommerce (si tiene tienda)
  └── Configuración de módulos por defecto
```

### 2. Generar Licencias para Distribuidor

```
Admin PE → Panel Admin → Generar Lote de Licencias
  ├── Seleccionar distribuidor
  ├── Cantidad de licencias
  ├── Tipo de licencia (starter, professional, etc.)
  ├── Configuración de módulos (puede diferir del default)
  ├── Duración (días o sin expiración)
  └── Generar → Se crean N códigos únicos
```

### 3. Entregar Licencias

```
Admin PE → Exportar códigos → Enviar al distribuidor
  └── Distribuidor → Entrega códigos a sus clientes
```

### 4. Activación por el Técnico

```
Técnico → App → Activar Licencia
  ├── Introduce código (PE-XXXX-XXXX-XXXX)
  ├── Sistema valida el código
  ├── Si válido:
  │   ├── Asocia licencia al usuario
  │   ├── Configura módulos según licencia
  │   ├── Si tiene distribuidor, asocia al distribuidor
  │   └── Muestra tienda correspondiente
  └── Si inválido: Error
```

## Formato de Código de Licencia

```
PE-XXXX-XXXX-XXXX

PE = Prefijo Piano Emotion
XXXX = Grupos alfanuméricos (A-Z, 0-9, sin caracteres confusos)

Ejemplos:
- PE-A1B2-C3D4-E5F6
- PE-PROF-2024-0001
- PE-DIST-RENNER-001
```

## Panel de Administración

### Secciones

1. **Dashboard**
   - Estadísticas generales
   - Licencias activas vs disponibles
   - Distribuidores activos

2. **Distribuidores**
   - Lista de distribuidores
   - Crear/editar distribuidor
   - Configurar módulos
   - Ver licencias asociadas

3. **Licencias**
   - Lista de todas las licencias
   - Filtrar por estado, tipo, distribuidor
   - Crear licencia individual
   - Generar lote de licencias
   - Revocar/suspender licencias

4. **Plantillas**
   - Plantillas de licencia predefinidas
   - Crear/editar plantillas

5. **Usuarios**
   - Lista de técnicos activos
   - Ver licencia de cada usuario
   - Historial de activaciones

6. **Auditoría**
   - Historial de cambios
   - Log de activaciones

## API Endpoints

### Administración (solo admins)

```typescript
// Distribuidores
POST   /api/admin/distributors
GET    /api/admin/distributors
GET    /api/admin/distributors/:id
PUT    /api/admin/distributors/:id
DELETE /api/admin/distributors/:id

// Licencias
POST   /api/admin/licenses              // Crear licencia individual
POST   /api/admin/licenses/batch        // Generar lote
GET    /api/admin/licenses
GET    /api/admin/licenses/:id
PUT    /api/admin/licenses/:id/revoke
PUT    /api/admin/licenses/:id/suspend
PUT    /api/admin/licenses/:id/reactivate

// Plantillas
POST   /api/admin/license-templates
GET    /api/admin/license-templates
PUT    /api/admin/license-templates/:id
DELETE /api/admin/license-templates/:id
```

### Activación (usuarios)

```typescript
// Activar licencia
POST   /api/licenses/activate
  Body: { code: "PE-XXXX-XXXX-XXXX" }
  Response: { success: true, license: {...}, moduleConfig: {...} }

// Ver mi licencia
GET    /api/licenses/my-license
  Response: { license: {...}, moduleConfig: {...}, distributor: {...} }
```

## Seguridad

1. **Solo admins de plataforma** pueden crear/gestionar licencias
2. **Códigos únicos** generados con entropía suficiente
3. **Historial completo** de todas las acciones
4. **Validación en servidor** de cada activación
5. **Rate limiting** en endpoint de activación

## Integración con Módulos Existentes

La licencia define qué módulos ve el usuario:

```typescript
// Al cargar la app
const license = await getLicense(userId);
const moduleConfig = license.moduleConfig;

// En el menú
if (moduleConfig.suppliersEnabled) {
  showMenuItem('Proveedores');
}

// En la tienda
if (license.distributorId) {
  showDistributorShop(license.distributorId);
} else {
  showPianoEmotionShop();
}
```
