# Piano Emotion Manager

Sistema de gestión integral para técnicos de pianos. Aplicación web moderna construida con Expo (React Native for Web), tRPC, Drizzle ORM, Clerk Authentication y Stripe Payments.

## 🎹 Características Principales

### Gestión de Clientes
- Registro completo de clientes (particulares, escuelas, conservatorios, salas de conciertos)
- Historial de servicios por cliente
- Gestión de direcciones y datos de contacto
- Portal del cliente con acceso mediante Magic Link

### Gestión de Pianos
- Inventario de pianos por cliente
- Información técnica detallada (marca, modelo, número de serie, año)
- Historial de mantenimiento y servicios
- Categorización (vertical, cola)

### Servicios y Citas
- Programación de afinaciones, reparaciones y mantenimientos
- Calendario integrado con vista diaria, semanal y mensual
- Sistema de recordatorios automáticos (email, WhatsApp)
- Workflow de estados para servicios

### Facturación y Presupuestos
- Generación de facturas con formato español
- Presupuestos convertibles a facturas
- Integración con VeriFactu para facturación electrónica
- Soporte PEPPOL para facturación B2B

### Inventario
- Control de stock de piezas y materiales
- Alertas de stock bajo
- Notificaciones automáticas por email

### Equipos
- Gestión de técnicos y zonas de trabajo
- Asignación de trabajos por zona
- Estadísticas de rendimiento por técnico

### Tienda Online
- Catálogo de productos y servicios
- Carrito de compras
- Integración con Stripe para pagos

## 🛠️ Stack Tecnológico

| Categoría | Tecnología |
|-----------|------------|
| **Frontend** | Expo (React Native for Web), TypeScript |
| **Estilizado** | TailwindCSS, NativeWind |
| **Backend** | tRPC (API type-safe) |
| **Base de Datos** | PostgreSQL (Neon), Drizzle ORM |
| **Autenticación** | Clerk (Google OAuth, Magic Link) |
| **Pagos** | Stripe |
| **Despliegue** | Vercel |
| **Testing** | Vitest, React Testing Library |

## 📁 Estructura del Proyecto

```
piano-emotion-manager/
├── app/                          # Páginas de la aplicación (Expo Router)
│   ├── (tabs)/                   # Navegación por pestañas
│   │   ├── index.tsx             # Dashboard principal
│   │   ├── clients.tsx           # Gestión de clientes
│   │   ├── pianos.tsx            # Gestión de pianos
│   │   ├── services.tsx          # Gestión de servicios
│   │   ├── appointments.tsx      # Calendario de citas
│   │   ├── invoices.tsx          # Facturación
│   │   ├── quotes.tsx            # Presupuestos
│   │   ├── inventory.tsx         # Inventario
│   │   ├── team.tsx              # Gestión de equipos
│   │   └── settings.tsx          # Configuración
│   ├── api/                      # Endpoints API
│   │   ├── trpc/                 # tRPC handlers
│   │   ├── auth/                 # Autenticación
│   │   ├── stripe/               # Webhooks de Stripe
│   │   └── portal/               # Portal del cliente
│   └── login.tsx                 # Página de login
├── components/                   # Componentes reutilizables
│   ├── dashboard/                # Componentes del dashboard
│   ├── form/                     # Componentes de formulario
│   ├── ui/                       # Componentes UI base
│   └── themed-*.tsx              # Componentes con tema
├── hooks/                        # Custom hooks
│   ├── use-form-validation.ts    # Validación de formularios
│   ├── use-theme-color.ts        # Colores del tema
│   └── data/                     # Hooks de datos (tRPC)
├── server/                       # Backend
│   ├── routers/                  # Routers tRPC modulares
│   │   ├── clients.ts            # Router de clientes
│   │   ├── pianos.ts             # Router de pianos
│   │   ├── services.ts           # Router de servicios
│   │   ├── appointments.ts       # Router de citas
│   │   ├── invoices.ts           # Router de facturas
│   │   ├── quotes.ts             # Router de presupuestos
│   │   ├── inventory.ts          # Router de inventario
│   │   ├── team.ts               # Router de equipos
│   │   ├── subscription.ts       # Router de suscripciones
│   │   └── ...                   # Otros routers
│   ├── services/                 # Servicios de negocio
│   │   ├── workflow.service.ts   # Flujo de trabajo
│   │   ├── reminder.service.ts   # Recordatorios
│   │   ├── notification.service.ts # Notificaciones
│   │   ├── email.service.ts      # Envío de emails
│   │   └── ...                   # Otros servicios
│   ├── db/                       # Base de datos
│   │   ├── schema/               # Esquemas Drizzle
│   │   ├── relations.ts          # Relaciones entre tablas
│   │   └── index.ts              # Conexión a BD
│   ├── middleware/               # Middleware
│   │   ├── rate-limiting.ts      # Rate limiting
│   │   └── validation.ts         # Validación Zod
│   └── _core/                    # Core del servidor
│       ├── context.ts            # Contexto tRPC
│       └── trpc.ts               # Configuración tRPC
├── constants/                    # Constantes
│   └── theme.ts                  # Tema de la aplicación
├── types/                        # Definiciones de tipos
│   ├── client.types.ts           # Tipos de cliente
│   ├── piano.types.ts            # Tipos de piano
│   └── ...                       # Otros tipos
├── __tests__/                    # Tests
│   ├── services/                 # Tests de servicios
│   ├── routers/                  # Tests de routers
│   ├── security/                 # Tests de seguridad
│   └── hooks/                    # Tests de hooks
└── docs/                         # Documentación
    ├── api/                      # Documentación API
    └── architecture/             # Diagramas de arquitectura
```

## 🚀 Instalación y Configuración

### Requisitos Previos

- Node.js 18+
- pnpm (recomendado) o npm
- Cuenta en Clerk (autenticación)
- Cuenta en Stripe (pagos)
- Base de datos PostgreSQL (Neon recomendado)

### Variables de Entorno

Crear archivo `.env.local` con las siguientes variables:

```env
# Base de datos
DATABASE_URL=postgresql://user:password@host:5432/database

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Email (Resend)
RESEND_API_KEY=re_...

# WhatsApp (opcional)
WHATSAPP_API_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
```

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/usuario/piano-emotion-manager.git
cd piano-emotion-manager

# Instalar dependencias
pnpm install

# Ejecutar migraciones de base de datos
pnpm db:push

# Iniciar servidor de desarrollo
pnpm dev
```

### Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `pnpm dev` | Inicia servidor de desarrollo |
| `pnpm build` | Compila para producción |
| `pnpm start` | Inicia servidor de producción |
| `pnpm test` | Ejecuta tests |
| `pnpm lint` | Ejecuta linter |
| `pnpm db:push` | Aplica cambios de esquema a BD |
| `pnpm db:studio` | Abre Drizzle Studio |

## 📡 API Reference

### Endpoints tRPC

La API está construida con tRPC, proporcionando type-safety end-to-end.

#### Clientes

| Procedimiento | Tipo | Descripción |
|---------------|------|-------------|
| `clients.list` | Query | Lista todos los clientes |
| `clients.getById` | Query | Obtiene cliente por ID |
| `clients.create` | Mutation | Crea nuevo cliente |
| `clients.update` | Mutation | Actualiza cliente |
| `clients.delete` | Mutation | Elimina cliente |
| `clients.search` | Query | Busca clientes por término |

#### Pianos

| Procedimiento | Tipo | Descripción |
|---------------|------|-------------|
| `pianos.list` | Query | Lista todos los pianos |
| `pianos.getByClient` | Query | Obtiene pianos de un cliente |
| `pianos.create` | Mutation | Crea nuevo piano |
| `pianos.update` | Mutation | Actualiza piano |
| `pianos.delete` | Mutation | Elimina piano |

#### Servicios

| Procedimiento | Tipo | Descripción |
|---------------|------|-------------|
| `services.list` | Query | Lista todos los servicios |
| `services.getByPiano` | Query | Obtiene servicios de un piano |
| `services.create` | Mutation | Crea nuevo servicio |
| `services.updateStatus` | Mutation | Actualiza estado del servicio |
| `services.complete` | Mutation | Marca servicio como completado |

#### Facturación

| Procedimiento | Tipo | Descripción |
|---------------|------|-------------|
| `invoices.list` | Query | Lista todas las facturas |
| `invoices.create` | Mutation | Crea nueva factura |
| `invoices.generatePDF` | Mutation | Genera PDF de factura |
| `invoices.sendByEmail` | Mutation | Envía factura por email |
| `invoices.markAsPaid` | Mutation | Marca factura como pagada |

### Webhooks

#### Stripe Webhook (`/api/stripe/webhook`)

Maneja eventos de Stripe:
- `checkout.session.completed` - Pago completado
- `customer.subscription.created` - Suscripción creada
- `customer.subscription.updated` - Suscripción actualizada
- `customer.subscription.deleted` - Suscripción cancelada

#### Portal del Cliente (`/api/portal/*`)

Endpoints para el portal de clientes:
- `POST /api/portal/auth` - Autenticación con Magic Link
- `GET /api/portal/services` - Lista servicios del cliente
- `GET /api/portal/invoices` - Lista facturas del cliente

## 🔒 Seguridad

### Autenticación

- **Clerk** para autenticación de usuarios
- **Google OAuth** como proveedor principal
- **Magic Link** para portal de clientes
- Tokens JWT validados en cada request

### Rate Limiting

Implementado en `server/middleware/rate-limiting.ts`:

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| API General | 100 requests | 1 minuto |
| Login | 5 requests | 15 minutos |
| Webhooks | 50 requests | 1 minuto |

### Validación

- Todos los inputs validados con **Zod**
- Esquemas de validación en `hooks/use-form-validation.ts`
- Sanitización de datos antes de inserción en BD

### CORS

Configuración estricta de CORS en `server/middleware/cors.ts`:
- Solo dominios autorizados
- Métodos HTTP específicos
- Headers controlados

## 🧪 Testing

### Ejecutar Tests

```bash
# Todos los tests
pnpm test

# Con cobertura
pnpm test -- --coverage

# Tests específicos
pnpm test -- --grep "workflow"
```

### Estructura de Tests

```
__tests__/
├── services/           # Tests de servicios de negocio
├── routers/            # Tests de routers tRPC
├── security/           # Tests de seguridad
├── hooks/              # Tests de custom hooks
└── team/               # Tests de funcionalidad de equipos
```

### Cobertura Actual

- **190 tests** pasando
- Cobertura de servicios críticos: workflow, notificaciones, stock
- Tests de seguridad: rate limiting, CORS, validación

## 📊 Base de Datos

### Esquema Principal

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   clients   │────<│   pianos    │────<│  services   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                       │
       │            ┌─────────────┐           │
       └───────────>│   invoices  │<──────────┘
                    └─────────────┘
                           │
                    ┌─────────────┐
                    │invoice_items│
                    └─────────────┘
```

### Tablas Principales

| Tabla | Descripción |
|-------|-------------|
| `clients` | Clientes del negocio |
| `pianos` | Pianos registrados |
| `services` | Servicios realizados |
| `appointments` | Citas programadas |
| `invoices` | Facturas emitidas |
| `invoice_items` | Líneas de factura |
| `quotes` | Presupuestos |
| `quote_items` | Líneas de presupuesto |
| `inventory_items` | Items de inventario |
| `team_members` | Miembros del equipo |
| `zones` | Zonas de trabajo |
| `reminders` | Recordatorios programados |

### Migraciones

```bash
# Aplicar cambios de esquema
pnpm db:push

# Generar migración
pnpm db:generate

# Abrir Drizzle Studio
pnpm db:studio
```

## 🌐 Despliegue

### Vercel (Recomendado)

1. Conectar repositorio de GitHub a Vercel
2. Configurar variables de entorno
3. Deploy automático en cada push a `main`

### Variables de Entorno en Producción

Asegurarse de configurar todas las variables de `.env.local` en el dashboard de Vercel.

### Dominio Personalizado

Configurar en Vercel Dashboard > Settings > Domains

## 📝 Contribuir

1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -am 'Añade nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

### Convenciones de Código

- **TypeScript** estricto (sin `any`)
- **ESLint** + **Prettier** para formateo
- **Conventional Commits** para mensajes de commit
- Tests para nuevas funcionalidades

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.

## 🆘 Soporte

Para soporte técnico o consultas:
- Crear issue en GitHub
- Email: soporte@pianoemotion.com

---

Desarrollado con ❤️ para técnicos de pianos profesionales
<-- Trigger Vercel redeploy -->
