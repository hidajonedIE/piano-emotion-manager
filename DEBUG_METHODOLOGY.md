# Metodología de Debugging - Piano Emotion Manager

## Resumen del Problema Resuelto

**Problema:** El login en web fallaba con error `Cannot destructure property 'createdSessionId' of 'undefined'` después de cambiar el nivel de suscripción del usuario.

**Causa Raíz (VERDADERA):** El commit 90b9e2e creó un archivo `lib/clerk-wrapper.ts` que cambió cómo se importa Clerk en `app/login.tsx`. El wrapper intenta usar `@clerk/clerk-react` en web, pero como no está instalado, devuelve un fallback vacío que no funciona.

**Solución Correcta:** Revertir `app/login.tsx` para importar directamente de `@clerk/clerk-expo`, que sí tiene soporte para web y funciona correctamente.

---

## Cadena de Eventos

1. **Commit 61bb149** (02:33) - Se activó la suscripción premium del usuario
2. **Commit 90b9e2e** (02:48) - Se creó `lib/clerk-wrapper.ts` y se cambió la importación de Clerk
3. **Commits posteriores** - Manus entró en un ciclo de intentos fallidos de corrección
4. **Solución** - Revertir la importación a `@clerk/clerk-expo`

---

## El Verdadero Problema

### El Wrapper Defectuoso

**Archivo:** `lib/clerk-wrapper.ts`

```typescript
if (Platform.OS === 'web') {
  try {
    clerkModule = require('@clerk/clerk-react');  // ← No está instalado
  } catch (e) {
    console.warn('Failed to load @clerk/clerk-react');
    clerkModule = {
      // ... fallback vacío
      useSSO: () => ({ startSSOFlow: async () => {} })  // ← Función vacía
    };
  }
}
```

### El Cambio que Rompió Todo

**Commit 90b9e2e cambió:**

```typescript
// ANTES (funcionaba):
import { useSSO } from "@clerk/clerk-expo";

// DESPUÉS (no funciona):
import { useSSO } from "../lib/clerk-wrapper";
```

### Por Qué Funcionaba Antes

`@clerk/clerk-expo` tiene soporte para web (Expo es multiplataforma). El `useSSO` de `@clerk/clerk-expo` funciona correctamente en web.

### Por Qué No Funciona Ahora

El wrapper intenta hacer `require('@clerk/clerk-react')` que no está instalado, causando que devuelva un fallback vacío. Cuando `handleGoogleSignIn` intenta destructurar `createdSessionId` de `undefined`, falla.

---

## Lecciones Aprendidas

### ❌ Lo que NO hacer:
1. **No asumir sin verificar** - Asumí que `@clerk/clerk-react` nunca estuvo instalado sin revisar el historial
2. **No cambiar código sin entender la causa raíz** - Añadí `@clerk/clerk-react` sin entender por qué el wrapper lo necesitaba
3. **No ignorar el historial de Git** - El historial mostraba exactamente qué cambió y cuándo

### ✅ Lo que SÍ hacer:
1. **Revisar el historial de Git primero** - Identificar exactamente qué cambió
2. **Entender la cadena causal** - Conectar los eventos en orden
3. **Buscar la causa raíz, no síntomas** - El error de "destructure" era un síntoma, no la causa
4. **Revertir cambios problemáticos** - Si algo funcionaba antes y ahora no, revertir es la solución

---

## Cambios Realizados

### Commit: "fix: restore direct import from @clerk/clerk-expo to fix web OAuth login"

**Archivo:** `app/login.tsx`

**Cambio:**
```diff
- import { useSignIn, useSignUp, useAuth } from "../lib/clerk-wrapper";
+ import { useSignIn, useSignUp, useAuth } from "@clerk/clerk-expo";
+ import { useSSO } from "@clerk/clerk-expo";
```

---

## Archivos Relacionados

- `app/login.tsx` - Componente de login (ARREGLADO)
- `lib/clerk-wrapper.ts` - Wrapper defectuoso (DEBE SER ELIMINADO O ARREGLADO)
- `components/clerk-provider.tsx` - Proveedor de Clerk
- `package.json` - Dependencias

---

## Recomendaciones

1. **Eliminar o arreglar `lib/clerk-wrapper.ts`** - No debería existir si no funciona
2. **Usar `@clerk/clerk-expo` directamente** - Funciona en web y nativo
3. **Revisar otros archivos que usen el wrapper** - Cambiarlos también a `@clerk/clerk-expo`

---

## Errores Observados en la Consola (Referencia)

```
❌ Failed to load @clerk/clerk-react
❌ Cannot destructure property 'createdSessionId' of 'undefined'
❌ Failed to load resource: /api/auth/me (401 Not authenticated)
```

---

## Verificación Post-Fix

Después de restaurar la importación:

1. ✅ `useSSO` se importa de `@clerk/clerk-expo`
2. ✅ `startSSOFlow` devuelve un objeto válido
3. ✅ El flujo de OAuth de Google funciona
4. ✅ El login es posible nuevamente

