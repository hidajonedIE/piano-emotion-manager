# Plan de Implementación: Modelo "Gratis con Compra Mínima"

Este documento detalla los pasos técnicos y de producto para implementar el modelo de negocio donde los distribuidores ofrecen la app gratis a los técnicos a cambio de una compra mínima mensual en su tienda.

---

## 1. Lógica del Modelo

El sistema funcionará de la siguiente manera:

1.  **Registro del Técnico**: Un técnico se registra en la versión de la app de un distribuidor. Su cuenta se crea en estado **"Periodo de Gracia"** (ej: 30 días).

2.  **Conexión con WooCommerce**: El sistema se conecta a la tienda WooCommerce del distribuidor usando la API.

3.  **Verificación Automática**: Cada noche, un proceso automático (`cron job`) revisa las compras de cada técnico en los últimos 30 días.

4.  **Actualización de Estado**:
    *   Si `Compras últimos 30 días >= Compra Mínima`, el estado de la cuenta del técnico es **"Activo"**.
    *   Si `Compras últimos 30 días < Compra Mínima`, el estado de la cuenta es **"Limitado"**.

5.  **Modo Limitado**: En este modo, la app sigue funcionando para consultas, pero se bloquean acciones clave (crear nuevas citas, facturas, clientes). Aparece un banner permanente recordando cómo reactivar la cuenta.

### Diagrama de Flujo de Estados

```mermaid
graph TD
    A[Registro] --> B{Periodo de Gracia (30 días)};
    B --> C{Verificación diaria};
    C -->|Compra >= Mínima| D[✅ Activo];
    C -->|Compra < Mínima| E[⚠️ Limitado];
    D --> C;
    E --> C;
```

---

## 2. Requisitos Técnicos

### Base de Datos

**Tabla `distributors` (Distribuidores):**

| Campo | Tipo | Descripción |
|---|---|---|
| `wooCommerceUrl` | `varchar` | URL de la tienda del distribuidor |
| `wooCommerceApiKey` | `varchar` | Clave API de WooCommerce |
| `wooCommerceApiSecret` | `varchar` | Secreto API de WooCommerce |
| `minimumPurchaseAmount` | `decimal` | Importe de compra mínima (ej: 100.00) |
| `gracePeriodDays` | `integer` | Días de periodo de gracia (ej: 30) |

**Tabla `technicians` (Técnicos):**

| Campo | Tipo | Descripción |
|---|---|---|
| `accountStatus` | `enum` | `active`, `limited`, `grace_period`, `locked` |
| `statusExpiresAt` | `timestamp` | Fecha de fin del periodo de gracia |
| `lastPurchaseCheck` | `timestamp` | Última vez que se verificaron las compras |
| `totalPurchasesLast30Days` | `decimal` | Importe total de compras |

### Backend

1.  **`PurchaseVerificationService`**: Un nuevo servicio encargado de la lógica de verificación.
    *   **`checkTechnicianPurchases(technicianId)`**: Función principal que:
        1.  Obtiene las credenciales de WooCommerce del distribuidor asociado.
        2.  Llama a la API de WooCommerce: `GET /wp-json/wc/v3/orders?customer_email={email}&after={fecha_hace_30_dias}`.
        3.  Suma el total de los pedidos.
        4.  Actualiza el estado del técnico en la base de datos.

2.  **Cron Job (Tarea Programada)**:
    *   Se ejecuta cada noche a las 02:00 AM.
    *   Recorre todos los técnicos cuyo `statusExpiresAt` ha pasado.
    *   Llama a `checkTechnicianPurchases` para cada uno.

### Frontend (App del Técnico)

1.  **Contexto Global `useAccountStatus`**:
    *   Provee el estado actual de la cuenta (`active`, `limited`) a toda la app.
    *   El backend enviará este estado al iniciar sesión.

2.  **Componente `AccountStatusBanner`**:
    *   Un banner no descartable que aparece en la parte superior si el estado es `limited`.
    *   Texto: "Tu cuenta está limitada. Compra al menos X€ más este mes para reactivar todas las funciones."
    *   Botón: "Ir a la tienda".

3.  **Bloqueo de Funcionalidades**:
    *   Los botones de acciones clave (ej: "Nueva Cita", "Guardar Factura") se deshabilitan si `status === 'limited'`.
    *   Al hacer clic, un tooltip explica por qué está bloqueado.

4.  **Página "Estado de Cuenta"** (en Configuración):
    *   Muestra el estado actual.
    *   Gráfico de progreso: "Has comprado X€ de los Y€ necesarios este mes".
    *   Fecha de la próxima revisión.
    *   Enlace a la tienda del distribuidor.

---

## 3. Plan de Implementación por Fases

### Sprint 1: Backend y Base de Datos (1 semana)

1.  **Tarea**: Modificar el esquema de la base de datos para añadir los nuevos campos en `distributors` y `technicians`.
2.  **Tarea**: Crear el `PurchaseVerificationService`.
3.  **Tarea**: Implementar la lógica de conexión con la API de WooCommerce.
4.  **Tarea**: Crear el cron job para la verificación diaria.

### Sprint 2: Frontend y Experiencia de Usuario (1-2 semanas)

1.  **Tarea**: Implementar el contexto `useAccountStatus`.
2.  **Tarea**: Crear el componente `AccountStatusBanner`.
3.  **Tarea**: Aplicar la lógica de bloqueo condicional a los botones y acciones clave.
4.  **Tarea**: Diseñar y desarrollar la página "Estado de Cuenta".

### Sprint 3: Panel del Distribuidor (1 semana)

1.  **Tarea**: Crear una nueva sección en el panel de administración del distribuidor para que pueda:
    *   Introducir sus credenciales de WooCommerce.
    *   Establecer el importe de compra mínima.
    *   Ver una lista de sus técnicos y el estado de sus cuentas.

### Sprint 4: Pruebas y Lanzamiento (1 semana)

1.  **Tarea**: Probar el flujo completo con una tienda WooCommerce de prueba.
2.  **Tarea**: Simular diferentes escenarios (compra suficiente, insuficiente, técnico nuevo).
3.  **Tarea**: Documentar la funcionalidad para los distribuidores.
4.  **Tarea**: Desplegar.

**Duración total estimada: 4-5 semanas.**

---

## 4. Experiencia de Usuario

### Para el Técnico

- **Transparencia**: Siempre sabe cuál es su estado y cuánto le falta para cumplir el objetivo.
- **Motivación**: El sistema le incentiva a centralizar sus compras en el distribuidor para mantener la app 100% funcional.
- **Sin sorpresas**: El periodo de gracia le da tiempo para adaptarse al sistema.

### Para el Distribuidor

- **Fidelización automática**: La app se convierte en un programa de lealtad que no requiere gestión manual.
- **Aumento de ventas**: Incentiva compras recurrentes para mantener el acceso a la app.
- **Control total**: Puede definir el umbral de compra que le sea rentable.

---

*Documento generado para Piano Emotion Manager - Diciembre 2024*
