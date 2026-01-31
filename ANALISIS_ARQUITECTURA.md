# Análisis Exhaustivo de Arquitectura - Piano Emotion Manager

## Fecha de Análisis
15 de enero de 2026

## 1. Estructura General del Proyecto

### 1.1 Tipo de Aplicación
- **Framework Principal**: Expo (React Native para web y móvil)
- **Backend**: Node.js con tRPC
- **Base de Datos**: MySQL/TiDB con Drizzle ORM
- **Autenticación**: Clerk
- **Hosting**: Vercel
- **Pasarela de Pago**: Stripe

### 1.2 Arquitectura de Carpetas

```
piano-emotion-manager/
├── app/                    # Rutas de la aplicación (Expo Router)
├── api/                    # API routes para Vercel
├── server/                 # Lógica del backend
│   ├── _core/             # Núcleo del servidor
│   ├── routers/           # Routers de tRPC
│   ├── services/          # Servicios de negocio
│   ├── security/          # Seguridad y autenticación
│   └── db/                # Configuración de base de datos
├── drizzle/               # Esquemas de Drizzle ORM
├── components/            # Componentes React reutilizables
├── hooks/                 # Custom hooks
├── services/              # Servicios del cliente
├── utils/                 # Utilidades
├── types/                 # Definiciones de tipos TypeScript
└── shared/                # Código compartido entre cliente y servidor
```

## 2. Análisis de Archivos Clave

### 2.1 Configuración del Proyecto

## 3. Estadísticas del Proyecto

### 3.1 Tamaño del Código
- **Total de líneas de código**: ~235,902 líneas
- **Archivos TypeScript**: 490 archivos
- **Archivos TSX (React)**: 276 archivos
- **Archivos JavaScript**: 6 archivos

### 3.2 Distribución del Backend
- **Routers tRPC**: 35 routers
- **Servicios de negocio**: 62 servicios
- **API Routes (Vercel)**: 25 rutas
- **Carpetas de servicios**: 68 directorios

### 3.3 Distribución del Frontend
- **Componentes React**: 116 componentes
- **Custom Hooks**: 90 hooks
- **Pantallas/Rutas**: 136 pantallas
- **Módulos principales**: 
  - Accounting (Contabilidad)
  - Calendar (Calendario)
  - CRM (Gestión de clientes)
  - Inventory (Inventario)
  - Reports (Informes)
  - Shop (Tienda)
  - Team (Equipo)

### 3.4 Dependencias Principales

#### Backend
- **Framework**: Express.js
- **API**: tRPC 11.7.2
- **ORM**: Drizzle ORM 0.44.5
- **Base de datos**: MySQL2 3.16.0
- **Autenticación**: Clerk (múltiples paquetes)
- **Pagos**: Stripe 20.1.0
- **Storage**: AWS S3, Sharp para imágenes
- **Email**: Nodemailer 7.0.12
- **PDF**: PDFKit 0.17.2
- **Validación**: Zod 4.1.12
- **Cache**: Redis 5.10.0

#### Frontend
- **Framework**: Expo 54.0.29
- **React**: 19.1.0
- **React Native**: 0.81.5
- **Navegación**: Expo Router 6.0.19
- **Estado**: TanStack Query 5.60.0
- **UI**: Lucide React (iconos), React Native Reanimated
- **Gráficos**: React Native Chart Kit

## 4. Arquitectura del Backend

### 4.1 Estructura de Capas

```
┌─────────────────────────────────────┐
│     API Layer (Express + tRPC)      │
│  - OAuth routes                     │
│  - Health checks                    │
│  - Webhooks                         │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│       Router Layer (tRPC)           │
│  - 35 routers organizados por       │
│    dominio de negocio               │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Service Layer (Business)       │
│  - 62 servicios especializados      │
│  - Lógica de negocio                │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│       Data Layer (Drizzle ORM)      │
│  - Esquemas de base de datos        │
│  - Migraciones                      │
└─────────────────────────────────────┘
```

### 4.2 Módulos Principales del Backend

#### Facturación Electrónica (E-Invoicing)
Soporte multi-país con servicios especializados:
- **España**: VeriFact-u
- **Francia**: Factur-X
- **Alemania**: ZUGFeRD
- **Italia**: SDI
- **Portugal**: CIUS-PT
- **Bélgica**: PEPPOL
- **Dinamarca**: OIOUBL
- **Reino Unido**: MTD (Making Tax Digital)

#### Gestión de Inventario
- Productos y servicios
- Stock y almacenes
- Proveedores
- Integración con facturas

#### CRM
- Gestión de clientes
- Campañas de marketing
- Seguimiento de interacciones

#### Contabilidad
- Asientos contables
- Conciliación bancaria
- Informes financieros

#### Calendario y Citas
- Sincronización con Google Calendar
- Recordatorios automáticos
- Gestión de disponibilidad

#### Tienda Online
- Integración con WooCommerce
- Gestión de productos
- Procesamiento de pedidos

## 5. Arquitectura del Frontend

### 5.1 Estructura de Navegación (Expo Router)

```
app/
├── (app)/              # Rutas autenticadas principales
│   ├── accounting/     # Módulo de contabilidad
│   ├── calendar/       # Módulo de calendario
│   ├── crm/           # Módulo CRM
│   ├── inventory/     # Módulo de inventario
│   ├── reports/       # Módulo de informes
│   ├── shop/          # Módulo de tienda
│   └── team/          # Módulo de equipo
├── (tabs)/            # Navegación por pestañas
├── login/             # Autenticación
├── onboarding/        # Proceso de incorporación
└── portal/            # Portal de clientes
```

### 5.2 Patrón de Componentes

#### Componentes UI Base
- Botones, inputs, modales
- Tarjetas, listas
- Formularios reutilizables

#### Componentes de Dominio
- Específicos por módulo (accounting, crm, etc.)
- Componentes compuestos
- Layouts especializados

#### Hooks Personalizados
- Data fetching con tRPC
- Estado local
- Lógica de negocio del cliente

## 6. Seguridad

### 6.1 Autenticación y Autorización
- **Clerk** para gestión de usuarios
- JWT para tokens de sesión
- OAuth para integraciones externas

### 6.2 Protección de API
- **CORS** configurado con lista blanca de orígenes
- **Rate Limiting** por tipo de endpoint:
  - Auth: límites estrictos
  - API general: límites moderados
  - Operaciones costosas (PDF, email): límites bajos
  - Portal público: límites específicos

### 6.3 Validación de Datos
- **Zod** para validación de esquemas
- Sanitización de inputs
- Validación en cliente y servidor

## 7. Integraciones Externas

### 7.1 Servicios de Terceros
- **Stripe**: Procesamiento de pagos
- **AWS S3**: Almacenamiento de archivos
- **Google APIs**: Calendar, OAuth
- **Microsoft Graph**: Integración Office 365
- **WhatsApp Business**: Mensajería
- **Nodemailer**: Envío de emails

### 7.2 Webhooks
- Clerk (eventos de usuario)
- Stripe (eventos de pago)
- WooCommerce (eventos de tienda)

## 8. Performance y Escalabilidad

### 8.1 Optimizaciones Actuales
- **Bundling**: esbuild para compilación rápida
- **Code splitting**: Expo Router automático
- **Caching**: Redis para datos frecuentes
- **Query caching**: TanStack Query en frontend

### 8.2 Limitaciones Identificadas
- Bundle size del backend: 657.6kb (puede optimizarse)
- No hay lazy loading explícito en servicios
- Posible duplicación de código entre servicios
- Falta de compresión de respuestas HTTP

## 9. Testing

### 9.1 Configuración Actual
- **Framework**: Vitest
- **Coverage**: Configurado pero no ejecutado
- **Tests existentes**: Mínimos (solo algunos archivos en __tests__)

### 9.2 Áreas sin Tests
- Mayoría de routers tRPC
- Servicios de negocio
- Componentes React
- Hooks personalizados

## 10. Deployment

### 10.1 Configuración Vercel
- **Build command**: `pnpm run build && npx expo export --platform web`
- **Output directory**: dist/
- **Node version**: 20.x
- **Serverless Functions**: API routes en carpeta api/

### 10.2 Variables de Entorno Requeridas
- DATABASE_URL (TiDB)
- CLERK_* (múltiples claves)
- STRIPE_* (claves de API)
- AWS_* (credenciales S3)
- REDIS_URL
- Otras integraciones específicas

---

**Fecha de análisis**: 15 de enero de 2026
**Versión del proyecto**: 1.0.0
**Estado**: Análisis completado - Listo para fase de optimización
