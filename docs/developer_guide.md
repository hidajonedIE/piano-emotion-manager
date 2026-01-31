
 # 🎹 Guía para Desarrolladores: Sistema Multi-Tenant

**Autor:** Manus AI  
**Fecha:** 5 de enero de 2026

## Introducción

Esta guía técnica detalla la implementación del sistema multi-tenant y el flujo de onboarding en **Piano Emotion Manager**. Está dirigida a desarrolladores que necesiten entender, mantener o extender estas funcionalidades.

La arquitectura se basa en un identificador `partnerId` que segmenta los datos a nivel de base de datos, garantizando el aislamiento entre los diferentes partners. La autenticación es gestionada por **Clerk**, y el flujo de onboarding se activa para usuarios nuevos que no pertenecen a ningún partner.

---

## 🚀 Backend: Flujo de Onboarding (`onboarding.router.ts`)

El backend del flujo de onboarding se centraliza en `server/routers/onboarding.router.ts`. Este router de tRPC gestiona todo el proceso de registro de un nuevo partner.

### Endpoints Públicos (`publicProcedure`)

Estos endpoints se pueden llamar sin autenticación y se usan para validaciones en tiempo real en el formulario de registro.

| Endpoint | Input (Zod Schema) | Output | Descripción |
| :--- | :--- | :--- | :--- |
| `checkSlugAvailability` | `z.object({ slug: z.string() })` | `{ available: boolean }` | Verifica si un slug está disponible. |
| `checkEmailAvailability` | `z.object({ email: z.string().email() })` | `{ available: boolean }` | Verifica si un email ya está en uso (en `partners` o `users`). |
| `suggestSlug` | `z.object({ name: z.string() })` | `{ suggestions: string[] }` | Sugiere slugs disponibles a partir del nombre de la empresa. |
| `validateStep1` | `step1Schema` | `{ valid: true }` | Valida los datos del paso 1 y verifica la unicidad de slug y email. |
| `validateStep2` | `step2Schema` | `{ valid: true }` | Valida los datos del paso 2 (actualmente solo formato de colores). |
| `validateStep3` | `step3Schema` | `{ valid: true }` | Valida los datos del paso 3. |
| `completeRegistration` | `completeRegistrationSchema` | `{ success: true, partnerId: number }` | **Endpoint principal.** Crea el partner, sus settings y el usuario administrador. |

### Endpoint Protegido (`protectedProcedure`)

Este endpoint requiere autenticación.

| Endpoint | Input | Output | Descripción |
| :--- | :--- | :--- | :--- |
| `getOnboardingStatus` | `undefined` | `{ completed: boolean, hasPartner: boolean }` | Verifica si el usuario autenticado ya ha completado el onboarding y tiene un partner asignado. |

### Proceso de `completeRegistration`

Este es el endpoint más importante del flujo. Realiza las siguientes acciones en una transacción simulada:

1.  **Verificaciones Finales:** Vuelve a comprobar la disponibilidad del slug y el email para evitar condiciones de carrera.
2.  **Crear Partner:** Inserta un nuevo registro en la tabla `partners`.
3.  **Crear Settings:** Inserta un nuevo registro en la tabla `partnerSettings` asociado al nuevo `partnerId`.
4.  **Gestionar Usuario Administrador:**
    - Si el usuario ya existe en la tabla `users` (por su email), se reutiliza su `userId`.
    - Si no existe, se crea un nuevo usuario en la tabla `users`. **Nota:** Esto se integra con Clerk, y el `openId` es temporal hasta que Clerk lo actualiza.
5.  **Crear Relación `partner_users`:** Inserta un registro en la tabla `partner_users` para vincular al usuario con el nuevo partner, asignándole el rol de `owner` y todos los permisos iniciales.

---
## 🎨 Frontend: Flujo de Onboarding y Guards

El frontend implementa el flujo de onboarding en una nueva sección de la aplicación bajo `app/onboarding/`. La lógica de redirección se gestiona mediante un nuevo componente `OnboardingGuard`.

### Estructura de Archivos

El flujo de onboarding se organiza en la siguiente estructura de carpetas, utilizando el file-based routing de Expo Router:

```
/app
├── onboarding/
│   ├── welcome.tsx       # Pantalla de bienvenida
│   ├── step1.tsx         # Formulario de información básica
│   ├── step2.tsx         # Formulario de branding
│   ├── step3.tsx         # Formulario de configuración y envío final
│   ├── success.tsx       # Pantalla de éxito post-registro
│   └── _layout.tsx       # Layout del stack de onboarding
├── components/
│   ├── auth-guard.tsx      # Guarda de autenticación existente
│   └── onboarding-guard.tsx # Nueva guarda para el flujo de onboarding
└── _layout.tsx             # Layout principal de la aplicación (modificado)
```

### Componentes Clave

#### 1. `OnboardingGuard` (`components/onboarding-guard.tsx`)

Este componente es un High-Order Component (HOC) que envuelve las rutas principales de la aplicación. Su lógica es la siguiente:

1.  **Verificar Autenticación:** Se ejecuta después de `AuthGuard`, por lo que solo se activa para usuarios autenticados.
2.  **Llamar a `getOnboardingStatus`:** Utiliza el endpoint de tRPC para verificar si el usuario tiene un partner asignado.
3.  **Redirigir si es necesario:**
    - Si `getOnboardingStatus` devuelve `{ completed: false }` o `{ hasPartner: false }`, el guard redirige al usuario a `/onboarding/welcome`.
    - La redirección solo ocurre si el usuario no está ya en una ruta de onboarding o en otra ruta pública exenta.
4.  **Permitir Acceso:** Si el usuario ya tiene un partner, el guard no hace nada y permite el acceso a la ruta solicitada.

#### 2. `_layout.tsx` (Layout Principal)

El layout principal de la aplicación (`app/_layout.tsx`) se ha modificado para integrar el `OnboardingGuard`:

```tsx
// app/_layout.tsx (extracto)

// ... imports
import { OnboardingGuard } from "@/components/onboarding-guard";

// ...

<AuthGuard>
  <OnboardingGuard> // <-- Envoltura añadida
    <Stack>
      {/* ... pantallas ... */}
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
    </Stack>
  </OnboardingGuard>
</AuthGuard>
```

El `OnboardingGuard` se coloca dentro del `AuthGuard` para asegurar que solo se ejecute para usuarios autenticados.

#### 3. Pantallas de Onboarding (`app/onboarding/*.tsx`)

-   **Persistencia de Datos:** Los datos introducidos en cada paso del formulario se guardan en `AsyncStorage` bajo la clave `@onboarding_data`. Esto permite al usuario navegar hacia atrás y adelante sin perder la información.
-   **Validación en Tiempo Real:** El `step1.tsx` utiliza los endpoints `checkSlugAvailability` y `checkEmailAvailability` con un debounce para dar feedback instantáneo al usuario.
-   **Llamada Final:** El `step3.tsx` recopila todos los datos de `AsyncStorage`, los combina con la información del usuario autenticado (`user.fullName`, `user.email`) y llama al `completeRegistrationMutation`.
-   **Limpieza:** Tras un registro exitoso en `success.tsx`, se limpia la clave `@onboarding_data` de `AsyncStorage`.

### Flujo de Navegación

1.  Un nuevo usuario se registra a través de Clerk.
2.  El usuario es redirigido a la aplicación, ya autenticado.
3.  `AuthGuard` permite el acceso.
4.  `OnboardingGuard` se activa, llama a `getOnboardingStatus` y, al no encontrar un partner, redirige a `/onboarding/welcome`.
5.  El usuario completa los 3 pasos del formulario.
6.  En el paso 3, se llama a `completeRegistration`.
7.  El backend crea el partner y asocia al usuario.
8.  El frontend redirige a `/onboarding/success`.
9.  Desde la pantalla de éxito, el usuario navega a la aplicación principal (ej. `/(tabs)`).
10. En futuras visitas, `OnboardingGuard` llamará a `getOnboardingStatus`, encontrará que el usuario ya tiene un partner y permitirá el acceso directo a la aplicación.

---
