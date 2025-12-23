# Plan de Implementación: Modelo "Gratis con Compra Mínima"

Este documento detalla los pasos técnicos y de producto para implementar el modelo de negocio donde los distribuidores ofrecen la app gratis a los técnicos, bloqueando únicamente los servicios con coste real si no se alcanza una compra mínima mensual.

---

## 1. Filosofía del Modelo

El principio fundamental es **justo y transparente**: el técnico puede usar todas las funcionalidades que no generan coste para el distribuidor. Solo se bloquean los servicios que tienen un coste real asociado (WhatsApp, notificaciones automáticas, portal del cliente).

### Funcionalidades por Tipo de Cuenta

| Funcionalidad | Cuenta Básica | Cuenta Premium |
|---------------|:-------------:|:--------------:|
| Gestión de clientes | ✅ | ✅ |
| Gestión de pianos | ✅ | ✅ |
| Calendario y citas | ✅ | ✅ |
| Facturación | ✅ | ✅ |
| Inventario | ✅ | ✅ |
| Informes y estadísticas | ✅ | ✅ |
| Firma digital | ✅ | ✅ |
| Exportar PDF | ✅ | ✅ |
| Mapa de clientes | ✅ | ✅ |
| Modo offline | ✅ | ✅ |
| **WhatsApp Business** | ❌ | ✅ |
| **Recordatorios automáticos** | ❌ | ✅ |
| **Portal del cliente** | ❌ | ✅ |
| **Notificaciones push a clientes** | ❌ | ✅ |

### Lógica de Estados

```
┌─────────────────────────────────────────────────────────────────┐
│                     TÉCNICO SE REGISTRA                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              PERIODO DE PRUEBA (30 días)                        │
│         Todo funciona (Premium) para que pruebe                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              VERIFICACIÓN DIARIA DE COMPRAS                     │
│         (Consulta API WooCommerce del distribuidor)             │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│    COMPRA >= MÍNIMA      │    │    COMPRA < MÍNIMA       │
│                          │    │                          │
│    ✅ CUENTA PREMIUM     │    │    📦 CUENTA BÁSICA      │
│    Todo funciona         │    │    Sin servicios con     │
│                          │    │    coste (WhatsApp,      │
│                          │    │    portal, recordatorios)│
└──────────────────────────┘    └──────────────────────────┘
```

---

## 2. Análisis de Costes por Servicio

### Servicios con Coste (Bloqueados en Básica)

| Servicio | Coste unitario | Uso típico/mes | Coste/técnico/mes |
|----------|----------------|----------------|-------------------|
| WhatsApp - Recordatorio cita | 0.07€ | 40 mensajes | 2.80€ |
| WhatsApp - Confirmaciones | 0.07€ | 40 mensajes | 2.80€ |
| WhatsApp - Chat con cliente | 0.005€ | 80 mensajes | 0.40€ |
| Portal cliente - Notificaciones | 0.07€ | 20 mensajes | 1.40€ |
| **TOTAL** | | | **~7.40€** |

### Servicios sin Coste (Siempre disponibles)

| Servicio | Coste | Razón |
|----------|-------|-------|
| Gestión de datos | 0€ | Base de datos ya pagada |
| Emails (Resend Free) | 0€ | 3,000 emails/mes gratis |
| Generación PDF | 0€ | Se genera en el navegador |
| Almacenamiento | 0€ | Incluido en hosting |

---

## 3. Requisitos Técnicos

### 3.1 Base de Datos

**Modificaciones en tabla `distributors`:**

```sql
ALTER TABLE distributors ADD COLUMN woocommerce_url VARCHAR(255);
ALTER TABLE distributors ADD COLUMN woocommerce_api_key VARCHAR(255);
ALTER TABLE distributors ADD COLUMN woocommerce_api_secret VARCHAR(255);
ALTER TABLE distributors ADD COLUMN minimum_purchase_amount DECIMAL(10,2) DEFAULT 100.00;
ALTER TABLE distributors ADD COLUMN trial_period_days INTEGER DEFAULT 30;
```

**Modificaciones en tabla `technicians`:**

```sql
ALTER TABLE technicians ADD COLUMN account_tier ENUM('trial', 'basic', 'premium') DEFAULT 'trial';
ALTER TABLE technicians ADD COLUMN tier_expires_at TIMESTAMP;
ALTER TABLE technicians ADD COLUMN last_purchase_check TIMESTAMP;
ALTER TABLE technicians ADD COLUMN purchases_last_30_days DECIMAL(10,2) DEFAULT 0;
ALTER TABLE technicians ADD COLUMN woocommerce_customer_id VARCHAR(100);
```

### 3.2 Backend: Servicio de Verificación de Compras

**Archivo: `services/purchase-verification-service.ts`**

```typescript
interface PurchaseVerificationResult {
  totalPurchases: number;
  meetsMinimum: boolean;
  newTier: 'basic' | 'premium';
  purchaseDetails: {
    orderId: string;
    date: string;
    amount: number;
  }[];
}

class PurchaseVerificationService {
  
  // Verificar compras de un técnico
  async verifyTechnicianPurchases(technicianId: string): Promise<PurchaseVerificationResult>;
  
  // Obtener pedidos de WooCommerce
  async getWooCommerceOrders(distributorId: string, customerEmail: string, since: Date): Promise<Order[]>;
  
  // Actualizar tier del técnico
  async updateTechnicianTier(technicianId: string, newTier: 'basic' | 'premium'): Promise<void>;
  
  // Cron job: verificar todos los técnicos
  async runDailyVerification(): Promise<void>;
}
```

### 3.3 Backend: Middleware de Control de Acceso

**Archivo: `middleware/tier-access-control.ts`**

```typescript
// Servicios que requieren cuenta Premium
const PREMIUM_ONLY_SERVICES = [
  'whatsapp.sendMessage',
  'whatsapp.sendReminder',
  'notifications.sendPush',
  'portal.enableAccess',
  'reminders.scheduleAutomatic',
];

// Middleware que verifica el tier antes de ejecutar
function requirePremium(req, res, next) {
  const technician = req.user;
  
  if (technician.accountTier === 'premium' || technician.accountTier === 'trial') {
    return next();
  }
  
  return res.status(403).json({
    error: 'premium_required',
    message: 'Esta función requiere cuenta Premium',
    currentTier: technician.accountTier,
    purchasesNeeded: technician.minimumPurchase - technician.purchasesLast30Days,
  });
}
```

### 3.4 Frontend: Hook de Control de Tier

**Archivo: `hooks/use-account-tier.ts`**

```typescript
interface AccountTierContext {
  tier: 'trial' | 'basic' | 'premium';
  trialEndsAt: Date | null;
  purchasesLast30Days: number;
  minimumPurchase: number;
  purchasesNeeded: number;
  progressPercent: number;
  isPremiumFeature: (feature: string) => boolean;
  canUse: (feature: string) => boolean;
}

// Uso en componentes:
const { tier, canUse, purchasesNeeded } = useAccountTier();

if (!canUse('whatsapp')) {
  // Mostrar mensaje de upgrade
}
```

### 3.5 Frontend: Componentes de UI

**Componente: `PremiumFeatureBadge`**
- Icono de estrella junto a funciones Premium
- Tooltip explicando qué es y cómo desbloquear

**Componente: `UpgradePrompt`**
- Modal que aparece al intentar usar función Premium en cuenta Básica
- Muestra progreso de compras y cuánto falta
- Botón directo a la tienda del distribuidor

**Componente: `AccountStatusCard`**
- Widget en el Dashboard mostrando estado actual
- Barra de progreso de compras
- Días restantes de prueba (si aplica)

---

## 4. Experiencia de Usuario

### 4.1 Durante el Periodo de Prueba

El técnico ve un banner discreto:

```
┌─────────────────────────────────────────────────────────────────┐
│ 🎁 Periodo de prueba: 23 días restantes                        │
│    Disfruta de todas las funciones Premium gratis.             │
│    Para mantenerlas, compra 100€/mes en [Distribuidor].        │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Cuenta Básica (no cumple mínimo)

Las funciones Premium aparecen con un candado y badge "Premium":

```
┌─────────────────────────────────────────────────────────────────┐
│ 📱 WhatsApp                                          🔒 Premium │
│                                                                 │
│ Envía recordatorios automáticos a tus clientes por WhatsApp.   │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Compra 45€ más este mes para desbloquear                    │ │
│ │ ████████████░░░░░░░░ 55% completado                         │ │
│ │                                                             │ │
│ │ [Ir a la tienda]                                            │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Cuenta Premium (cumple mínimo)

Todo funciona sin restricciones. Badge discreto de agradecimiento:

```
┌─────────────────────────────────────────────────────────────────┐
│ ⭐ Cuenta Premium activa                                        │
│    Gracias por confiar en [Distribuidor].                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Panel del Distribuidor

El distribuidor necesita una sección para gestionar este sistema:

### 5.1 Configuración

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| URL WooCommerce | URL de su tienda | `https://mitienda.com` |
| API Key | Clave de WooCommerce | `ck_xxxxx` |
| API Secret | Secreto de WooCommerce | `cs_xxxxx` |
| Compra mínima | Importe mensual requerido | 100€ |
| Días de prueba | Periodo de gracia inicial | 30 |

### 5.2 Vista de Técnicos

| Técnico | Tier | Compras (30d) | Mínimo | Estado |
|---------|------|---------------|--------|--------|
| Juan García | Premium | 156€ | 100€ | ✅ Activo |
| María López | Básica | 45€ | 100€ | ⚠️ Falta 55€ |
| Pedro Ruiz | Prueba | 0€ | 100€ | 🎁 15 días |

### 5.3 Estadísticas

- Total técnicos activos (Premium)
- Total técnicos en Básica
- Técnicos en periodo de prueba
- Tasa de conversión (Prueba → Premium)
- Compras totales generadas

---

## 6. Plan de Implementación por Sprints

### Sprint 1: Backend Core (1 semana)

| Tarea | Prioridad | Horas est. |
|-------|-----------|------------|
| Modificar esquema de BD | Alta | 2h |
| Crear PurchaseVerificationService | Alta | 8h |
| Integración API WooCommerce | Alta | 6h |
| Cron job de verificación diaria | Alta | 4h |
| Middleware de control de acceso | Alta | 4h |
| **Total** | | **24h** |

### Sprint 2: Frontend - Hooks y Contexto (1 semana)

| Tarea | Prioridad | Horas est. |
|-------|-----------|------------|
| Hook useAccountTier | Alta | 4h |
| Contexto global de tier | Alta | 3h |
| Lógica de bloqueo en botones | Alta | 6h |
| Componente PremiumFeatureBadge | Media | 3h |
| Componente UpgradePrompt | Alta | 4h |
| **Total** | | **20h** |

### Sprint 3: Frontend - UI y UX (1 semana)

| Tarea | Prioridad | Horas est. |
|-------|-----------|------------|
| AccountStatusCard en Dashboard | Alta | 4h |
| Página "Estado de Cuenta" | Alta | 6h |
| Banner de periodo de prueba | Media | 3h |
| Animaciones y transiciones | Baja | 3h |
| Traducciones (6 idiomas) | Media | 4h |
| **Total** | | **20h** |

### Sprint 4: Panel del Distribuidor (1 semana)

| Tarea | Prioridad | Horas est. |
|-------|-----------|------------|
| Página de configuración WooCommerce | Alta | 6h |
| Vista de lista de técnicos | Alta | 6h |
| Dashboard de estadísticas | Media | 4h |
| Exportar datos a CSV | Baja | 2h |
| **Total** | | **18h** |

### Sprint 5: Testing y Lanzamiento (1 semana)

| Tarea | Prioridad | Horas est. |
|-------|-----------|------------|
| Tests unitarios | Alta | 8h |
| Tests de integración WooCommerce | Alta | 4h |
| Pruebas con tienda real | Alta | 4h |
| Documentación para distribuidores | Media | 4h |
| Despliegue y monitorización | Alta | 4h |
| **Total** | | **24h** |

---

## 7. Resumen

### Tiempo total estimado: 5 semanas (~106 horas)

### Beneficios del modelo

| Para el Técnico | Para el Distribuidor |
|-----------------|---------------------|
| App 100% funcional para gestión | Coste cero si técnico no compra |
| Solo pierde "extras" de comunicación | Fidelización automática |
| Incentivo claro y justo | Aumento de ventas recurrentes |
| Sin frustración por bloqueos | Control total del umbral |

### Coste para el distribuidor

| Escenario | Técnicos Premium | Coste/mes |
|-----------|------------------|-----------|
| Pequeño | 10 | ~74€ |
| Mediano | 50 | ~370€ |
| Grande | 100 | ~740€ |

**Pero ese coste se compensa con las compras mínimas:**
- 10 técnicos × 100€ = 1,000€/mes en ventas
- Con margen del 30% = 300€ beneficio
- Coste WhatsApp = 74€
- **Beneficio neto = 226€/mes**

---

*Documento actualizado para Piano Emotion Manager - Diciembre 2024*
