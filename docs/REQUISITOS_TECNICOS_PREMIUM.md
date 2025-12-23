# Requisitos Técnicos: Restricción de Funcionalidades Premium

Este documento detalla los requisitos técnicos para implementar el sistema de restricción de funcionalidades Premium (WhatsApp, Recordatorios, Portal del Cliente, Notificaciones Push) basado en un umbral de compra mínima.

---

## 1. Arquitectura General

El sistema se basa en un **middleware de control de acceso a nivel de API** y un **contexto de estado de cuenta en el frontend**. Un `cron job` nocturno se encarga de verificar las compras y actualizar el estado de la cuenta de cada técnico.

### Diagrama de Arquitectura

```mermaid
graph TD
    subgraph Frontend
        A[Componente UI] --> B{useAccountTier()};
        B --> C{¿Puede usar?};
        C -->|Sí| D[Ejecuta acción];
        C -->|No| E[Muestra prompt de upgrade];
        D --> F[Llamada a API Backend];
    end

    subgraph Backend
        F --> G{Middleware TierControl};
        G -->|Premium| H[Ejecuta Servicio Premium];
        G -->|Básico| I[Error 403: Premium Requerido];
    end

    subgraph Tareas Programadas
        J(Cron Job Diario) --> K[PurchaseVerificationService];
        K --> L[API WooCommerce];
        K --> M[Actualiza BD];
    end

    subgraph Base de Datos
        M --> N(Tabla Technicians);
    end
```

---

## 2. Modificaciones en la Base de Datos (PostgreSQL)

Se requieren los siguientes cambios en el esquema de Drizzle ORM.

### Tabla `distributors`

Se añaden campos para configurar el sistema por distribuidor.

```typescript
// server/db/schema.ts

export const distributors = pgTable('distributors', {
  // ... campos existentes
  woocommerceUrl: varchar('woocommerce_url', { length: 255 }),
  woocommerceApiKey: varchar('woocommerce_api_key', { length: 255 }),
  woocommerceApiSecret: varchar('woocommerce_api_secret', { length: 255 }),
  minimumPurchaseAmount: decimal('minimum_purchase_amount', { precision: 10, scale: 2 }).default('100.00'),
  trialPeriodDays: integer('trial_period_days').default(30),
});
```

### Tabla `technicians`

Se añaden campos para gestionar el estado de la cuenta de cada técnico.

```typescript
// server/db/schema.ts

export const accountTierEnum = pgEnum('account_tier', ['trial', 'basic', 'premium']);

export const technicians = pgTable('technicians', {
  // ... campos existentes
  accountTier: accountTierEnum('account_tier').default('trial'),
  tierExpiresAt: timestamp('tier_expires_at'), // Fin del periodo de prueba
  lastPurchaseCheck: timestamp('last_purchase_check'),
  purchasesLast30Days: decimal('purchases_last_30_days', { precision: 10, scale: 2 }).default('0.00'),
  woocommerceCustomerId: varchar('woocommerce_customer_id', { length: 100 }), // ID de cliente en WooCommerce
});
```

---

## 3. Backend (Node.js / Express / tRPC)

### 3.1. Servicio de Verificación de Compras

**Ubicación:** `server/services/purchase-verification.service.ts`

**Responsabilidades:**
- Conectar con la API de WooCommerce de un distribuidor.
- Obtener los pedidos de un cliente en un rango de fechas.
- Calcular el total de las compras.
- Actualizar el estado del técnico en la base de datos.

**Interfaz del servicio:**

```typescript
interface WooCommerceOrder {
  id: number;
  total: string;
  date_created: string;
}

interface VerificationResult {
  totalAmount: number;
  newTier: 'basic' | 'premium';
}

class PurchaseVerificationService {
  constructor(private db: DrizzleDB) {}

  public async verifyTechnician(technicianId: string): Promise<VerificationResult> {
    // 1. Obtener técnico y su distribuidor
    // 2. Obtener credenciales de WooCommerce del distribuidor
    // 3. Obtener email o woocommerce_customer_id del técnico
    // 4. Llamar a getWooCommerceOrders()
    // 5. Calcular total
    // 6. Comparar con minimumPurchaseAmount
    // 7. Actualizar technician.accountTier y technician.purchasesLast30Days
    // 8. Devolver resultado
  }

  private async getWooCommerceOrders(config: WooConfig, customerId: string): Promise<WooCommerceOrder[]> {
    // Implementar llamada a la API REST de WooCommerce
    // GET /wp-json/wc/v3/orders?customer={customerId}&after={30_days_ago}
  }
}
```

### 3.2. Middleware de Control de Acceso

**Ubicación:** `server/middleware/require-premium.ts`

**Responsabilidad:** Proteger las rutas de la API que corresponden a funcionalidades Premium.

```typescript
import { Request, Response, NextFunction } from 'express';

export function requirePremium(req: Request, res: Response, next: NextFunction) {
  const user = req.user; // Asumiendo que el usuario está en req.user

  if (user.accountTier === 'premium' || user.accountTier === 'trial') {
    return next();
  }

  const needed = user.distributor.minimumPurchaseAmount - user.purchasesLast30Days;

  return res.status(403).json({
    error: 'PREMIUM_REQUIRED',
    message: 'Esta funcionalidad requiere una cuenta Premium.',
    details: {
      currentTier: user.accountTier,
      purchasesNeeded: Math.max(0, needed),
    },
  });
}
```

**Uso en las rutas:**

```typescript
// server/routes/whatsapp.ts
router.post('/send-message', requirePremium, WhatsAppController.sendMessage);

// server/routes/reminders.ts
router.post('/schedule', requirePremium, ReminderController.schedule);
```

### 3.3. Tarea Programada (Cron Job)

**Ubicación:** `server/jobs/daily-purchase-check.ts`

**Responsabilidad:** Ejecutar el servicio de verificación para todos los técnicos elegibles.

```typescript
import cron from 'node-cron';
import { PurchaseVerificationService } from '../services/purchase-verification.service';

// Se ejecuta todos los días a las 2:00 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Iniciando verificación diaria de compras...');
  
  const verificationService = new PurchaseVerificationService(/* db */);
  
  // 1. Obtener todos los técnicos cuyo periodo de prueba ha terminado
  const techniciansToVerify = await db.select().from(technicians).where(...);
  
  for (const tech of techniciansToVerify) {
    try {
      await verificationService.verifyTechnician(tech.id);
    } catch (error) {
      console.error(`Error verificando al técnico ${tech.id}:`, error);
    }
  }
  
  console.log('Verificación diaria completada.');
});
```

---

## 4. Frontend (React / Vite)

### 4.1. Contexto de Estado de Cuenta

**Ubicación:** `src/contexts/AccountTierContext.tsx`

**Responsabilidad:** Proveer el estado de la cuenta a toda la aplicación y centralizar la lógica de permisos.

```typescript
import React, { createContext, useContext, useMemo } from 'react';

interface AccountTierData {
  tier: 'trial' | 'basic' | 'premium';
  trialEndsAt?: string;
  purchasesLast30Days: number;
  minimumPurchase: number;
}

const AccountTierContext = createContext<AccountTierData | null>(null);

export const AccountTierProvider = ({ children, data }) => {
  const value = useMemo(() => ({
    ...data,
    isPremium: data.tier === 'premium' || data.tier === 'trial',
    purchasesNeeded: Math.max(0, data.minimumPurchase - data.purchasesLast30Days),
    progressPercent: (data.purchasesLast30Days / data.minimumPurchase) * 100,
  }), [data]);

  return <AccountTierContext.Provider value={value}>{children}</AccountTierContext.Provider>;
};

export const useAccountTier = () => {
  const context = useContext(AccountTierContext);
  if (!context) throw new Error('useAccountTier debe ser usado dentro de un AccountTierProvider');
  return context;
};
```

### 4.2. Componentes de UI

**`PremiumFeature` (Wrapper Component):**
- Un componente que envuelve funcionalidades Premium.
- Muestra un badge "Premium" y un tooltip.
- Si el usuario no es Premium, muestra el `UpgradePrompt` al hacer clic.

```jsx
// Uso:
<PremiumFeature featureName="WhatsApp">
  <Button onClick={handleSendWhatsApp}>Enviar por WhatsApp</Button>
</PremiumFeature>
```

**`UpgradePrompt` (Modal):**
- Se muestra al intentar usar una función Premium sin permiso.
- Muestra el progreso de compras y cuánto falta.
- Incluye un botón que redirige a la tienda del distribuidor.

---

## 5. Panel del Distribuidor

Se debe crear una nueva sección en el panel de administración del distribuidor con los siguientes campos:

- **Formulario de Configuración:**
  - `URL de WooCommerce`: `https://tienda.distribuidor.com`
  - `Clave API de WooCommerce`: `ck_...`
  - `Secreto API de WooCommerce`: `cs_...`
  - `Importe de Compra Mínima`: `100.00` €
  - `Periodo de Prueba`: `30` días

- **Tabla de Técnicos:**
  - Columnas: Nombre, Email, Tier, Compras (30d), Próxima Revisión.
  - Botón para forzar una verificación manual de un técnico.

---

## 6. Flujo de Datos

1.  **Login del Técnico**: La API de login devuelve el objeto `accountTier` junto con los datos del usuario.
2.  **Carga de la App**: El `AccountTierProvider` se inicializa con estos datos.
3.  **Interacción del Usuario**: El componente `PremiumFeature` usa el hook `useAccountTier` para decidir si mostrar el contenido o el prompt de upgrade.
4.  **Llamada a API**: Si el usuario es Premium, la llamada a la API se realiza.
5.  **Verificación en Backend**: El middleware `requirePremium` valida el `accountTier` del usuario antes de procesar la solicitud.
6.  **Proceso Nocturno**: El `cron job` se ejecuta, llama al `PurchaseVerificationService`, que a su vez llama a la API de WooCommerce y actualiza la base de datos. La próxima vez que el técnico inicie sesión, recibirá su nuevo estado.
