# Arquitectura del Sistema - Piano Emotion Manager

## Visión General

Piano Emotion Manager sigue una arquitectura moderna de aplicación web full-stack con separación clara entre frontend, backend y servicios externos.

## Diagrama de Arquitectura General

```mermaid
graph TB
    subgraph "Cliente"
        WEB[Web Browser]
        MOBILE[Mobile App]
    end

    subgraph "Frontend - Expo"
        EXPO[Expo Router]
        COMPONENTS[React Components]
        HOOKS[Custom Hooks]
        TRPC_CLIENT[tRPC Client]
    end

    subgraph "Backend - Vercel"
        API[API Routes]
        TRPC_SERVER[tRPC Server]
        ROUTERS[Modular Routers]
        SERVICES[Business Services]
        MIDDLEWARE[Middleware Layer]
    end

    subgraph "Base de Datos"
        DRIZZLE[Drizzle ORM]
        NEON[(Neon PostgreSQL)]
    end

    subgraph "Servicios Externos"
        CLERK[Clerk Auth]
        STRIPE[Stripe Payments]
        RESEND[Resend Email]
        WHATSAPP[WhatsApp API]
    end

    WEB --> EXPO
    MOBILE --> EXPO
    EXPO --> COMPONENTS
    COMPONENTS --> HOOKS
    HOOKS --> TRPC_CLIENT
    TRPC_CLIENT --> API
    API --> MIDDLEWARE
    MIDDLEWARE --> TRPC_SERVER
    TRPC_SERVER --> ROUTERS
    ROUTERS --> SERVICES
    SERVICES --> DRIZZLE
    DRIZZLE --> NEON

    MIDDLEWARE --> CLERK
    SERVICES --> STRIPE
    SERVICES --> RESEND
    SERVICES --> WHATSAPP
```

## Arquitectura de Capas

### 1. Capa de Presentación (Frontend)

```mermaid
graph LR
    subgraph "Expo Router"
        PAGES[Pages/Screens]
        TABS[Tab Navigation]
        MODALS[Modals]
    end

    subgraph "Components"
        UI[UI Components]
        FORM[Form Components]
        DASHBOARD[Dashboard Components]
        THEMED[Themed Components]
    end

    subgraph "State Management"
        TRPC_HOOKS[tRPC Hooks]
        CONTEXT[React Context]
        ASYNC_STORAGE[AsyncStorage]
    end

    PAGES --> UI
    PAGES --> FORM
    PAGES --> DASHBOARD
    UI --> THEMED
    PAGES --> TRPC_HOOKS
    PAGES --> CONTEXT
    CONTEXT --> ASYNC_STORAGE
```

### 2. Capa de API (tRPC)

```mermaid
graph TB
    subgraph "tRPC Server"
        CONTEXT[Context Creation]
        AUTH[Auth Middleware]
        RATE_LIMIT[Rate Limiting]
        VALIDATION[Zod Validation]
    end

    subgraph "Routers"
        CLIENTS[clients.ts]
        PIANOS[pianos.ts]
        SERVICES[services.ts]
        APPOINTMENTS[appointments.ts]
        INVOICES[invoices.ts]
        QUOTES[quotes.ts]
        INVENTORY[inventory.ts]
        TEAM[team.ts]
        REMINDERS[reminders.ts]
        SUBSCRIPTION[subscription.ts]
        ADVANCED[advanced.ts]
    end

    CONTEXT --> AUTH
    AUTH --> RATE_LIMIT
    RATE_LIMIT --> VALIDATION
    VALIDATION --> CLIENTS
    VALIDATION --> PIANOS
    VALIDATION --> SERVICES
    VALIDATION --> APPOINTMENTS
    VALIDATION --> INVOICES
    VALIDATION --> QUOTES
    VALIDATION --> INVENTORY
    VALIDATION --> TEAM
    VALIDATION --> REMINDERS
    VALIDATION --> SUBSCRIPTION
    VALIDATION --> ADVANCED
```

### 3. Capa de Servicios (Business Logic)

```mermaid
graph TB
    subgraph "Core Services"
        WORKFLOW[Workflow Service]
        NOTIFICATION[Notification Service]
        REMINDER[Reminder Service]
    end

    subgraph "Integration Services"
        EMAIL[Email Service]
        WHATSAPP[WhatsApp Service]
        PAYMENT[Payment Service]
    end

    subgraph "Domain Services"
        CONTRACT[Contract Service]
        DASHBOARD[Dashboard Service]
        STOCK[Stock Notification Service]
    end

    subgraph "External Services"
        VERIFACTU[VeriFactu Service]
        PEPPOL[PEPPOL Service]
    end

    WORKFLOW --> NOTIFICATION
    NOTIFICATION --> EMAIL
    NOTIFICATION --> WHATSAPP
    REMINDER --> NOTIFICATION
    CONTRACT --> EMAIL
    STOCK --> EMAIL
```

### 4. Capa de Datos (Drizzle ORM)

```mermaid
erDiagram
    CLIENTS ||--o{ PIANOS : owns
    CLIENTS ||--o{ INVOICES : receives
    CLIENTS ||--o{ QUOTES : receives
    CLIENTS ||--o{ APPOINTMENTS : has
    
    PIANOS ||--o{ SERVICES : receives
    PIANOS ||--o{ APPOINTMENTS : scheduled_for
    
    SERVICES ||--o{ INVOICE_ITEMS : generates
    SERVICES }o--|| TEAM_MEMBERS : assigned_to
    
    INVOICES ||--o{ INVOICE_ITEMS : contains
    INVOICES ||--o{ PAYMENTS : has
    
    QUOTES ||--o{ QUOTE_ITEMS : contains
    
    TEAM_MEMBERS }o--o{ ZONES : covers
    
    INVENTORY_ITEMS ||--o{ STOCK_MOVEMENTS : tracks
    
    REMINDERS }o--|| CLIENTS : for
    REMINDERS }o--|| PIANOS : about
```

## Flujo de Autenticación

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Clerk
    participant Backend
    participant Database

    User->>Frontend: Click Login
    Frontend->>Clerk: Redirect to OAuth
    Clerk->>User: Show Google Login
    User->>Clerk: Authenticate
    Clerk->>Frontend: Return JWT Token
    Frontend->>Backend: Request with JWT
    Backend->>Clerk: Verify Token
    Clerk->>Backend: Token Valid
    Backend->>Database: Get/Create User
    Database->>Backend: User Data
    Backend->>Frontend: Response with User Context
```

## Flujo de Pago con Stripe

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Stripe
    participant Database

    User->>Frontend: Select Plan
    Frontend->>Backend: Create Checkout Session
    Backend->>Stripe: Create Session
    Stripe->>Backend: Session URL
    Backend->>Frontend: Redirect URL
    Frontend->>Stripe: Redirect to Checkout
    User->>Stripe: Complete Payment
    Stripe->>Backend: Webhook: payment_success
    Backend->>Database: Update Subscription
    Backend->>Stripe: Acknowledge
    Stripe->>Frontend: Redirect to Success
```

## Flujo de Workflow de Servicios

```mermaid
stateDiagram-v2
    [*] --> Pending: Service Created
    Pending --> Scheduled: Assign Date
    Scheduled --> InProgress: Start Work
    InProgress --> Completed: Finish Work
    InProgress --> Pending: Reschedule
    Scheduled --> Cancelled: Cancel
    Pending --> Cancelled: Cancel
    Completed --> [*]
    Cancelled --> [*]

    note right of Scheduled
        Notifications sent
        to client
    end note

    note right of Completed
        Invoice can be
        generated
    end note
```

## Estructura de Módulos

```mermaid
graph TB
    subgraph "Core Modules"
        CLIENTS_MOD[Clients Module]
        PIANOS_MOD[Pianos Module]
        SERVICES_MOD[Services Module]
    end

    subgraph "Business Modules"
        INVOICING[Invoicing Module]
        QUOTING[Quoting Module]
        SCHEDULING[Scheduling Module]
    end

    subgraph "Operations Modules"
        INVENTORY_MOD[Inventory Module]
        TEAM_MOD[Team Module]
        REMINDERS_MOD[Reminders Module]
    end

    subgraph "Premium Modules"
        SHOP[Shop Module]
        PORTAL[Client Portal]
        ANALYTICS[Analytics Module]
    end

    CLIENTS_MOD --> PIANOS_MOD
    PIANOS_MOD --> SERVICES_MOD
    SERVICES_MOD --> INVOICING
    SERVICES_MOD --> SCHEDULING
    CLIENTS_MOD --> QUOTING
    SERVICES_MOD --> TEAM_MOD
    INVENTORY_MOD --> SERVICES_MOD
    REMINDERS_MOD --> CLIENTS_MOD
    PORTAL --> CLIENTS_MOD
    SHOP --> INVOICING
```

## Seguridad

### Capas de Seguridad

```mermaid
graph TB
    subgraph "Perimeter Security"
        CORS[CORS Policy]
        RATE_LIMIT[Rate Limiting]
    end

    subgraph "Authentication"
        CLERK_AUTH[Clerk JWT]
        SESSION[Session Management]
    end

    subgraph "Authorization"
        RBAC[Role-Based Access]
        OWNERSHIP[Resource Ownership]
    end

    subgraph "Data Security"
        VALIDATION[Input Validation]
        SANITIZATION[Data Sanitization]
        ENCRYPTION[Encryption at Rest]
    end

    CORS --> RATE_LIMIT
    RATE_LIMIT --> CLERK_AUTH
    CLERK_AUTH --> SESSION
    SESSION --> RBAC
    RBAC --> OWNERSHIP
    OWNERSHIP --> VALIDATION
    VALIDATION --> SANITIZATION
    SANITIZATION --> ENCRYPTION
```

## Despliegue

### Arquitectura de Despliegue

```mermaid
graph TB
    subgraph "GitHub"
        REPO[Repository]
        ACTIONS[GitHub Actions]
    end

    subgraph "Vercel"
        EDGE[Edge Network]
        SERVERLESS[Serverless Functions]
        STATIC[Static Assets]
    end

    subgraph "External Services"
        NEON_DB[(Neon PostgreSQL)]
        CLERK_SVC[Clerk]
        STRIPE_SVC[Stripe]
        RESEND_SVC[Resend]
    end

    REPO --> ACTIONS
    ACTIONS --> VERCEL
    VERCEL --> EDGE
    EDGE --> SERVERLESS
    EDGE --> STATIC
    SERVERLESS --> NEON_DB
    SERVERLESS --> CLERK_SVC
    SERVERLESS --> STRIPE_SVC
    SERVERLESS --> RESEND_SVC
```

## Escalabilidad

### Consideraciones de Escalabilidad

| Componente | Estrategia |
|------------|------------|
| Frontend | CDN de Vercel, Edge caching |
| API | Serverless auto-scaling |
| Base de Datos | Neon auto-scaling, connection pooling |
| Autenticación | Clerk managed service |
| Pagos | Stripe managed service |

### Patrones Implementados

1. **Serverless Functions**: Escalado automático sin gestión de servidores
2. **Edge Caching**: Assets estáticos en CDN global
3. **Connection Pooling**: Gestión eficiente de conexiones a BD
4. **Lazy Loading**: Carga diferida de componentes
5. **Memoization**: Cache de resultados de cálculos costosos

## Monitorización

### Métricas Clave

- Tiempo de respuesta de API
- Tasa de errores
- Uso de base de datos
- Conversiones de pago
- Usuarios activos

### Herramientas

- Vercel Analytics
- Sentry (error tracking)
- Stripe Dashboard
- Clerk Dashboard
