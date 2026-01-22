# Problema Adicional: Campo `role` en User

## Fecha: 22 Enero 2026

## Problema

El campo `role` en la tabla `users` es de tipo:
```typescript
role: mysqlEnum(['user','admin']).default('user').notNull()
```

Pero el servicio de Shop espera roles como:
- 'owner'
- 'admin'
- 'manager'
- 'senior_tech'
- 'technician'
- 'apprentice'
- 'receptionist'
- 'accountant'
- 'viewer'

## Soluciones Posibles

### Opción 1: Usar 'admin' como fallback
Si el usuario tiene role='admin', usarlo. Si tiene role='user', usar 'viewer' o 'technician'.

### Opción 2: Agregar campo organizationRole
Agregar un campo separado para el rol dentro de la organización.

### Opción 3: Tabla de membresía
Usar la tabla de membresía de organización que probablemente ya existe.

## Solución Temporal

Por ahora, modificar el servicio de Shop para:
1. Si role='admin' → usar 'admin' en shop
2. Si role='user' → usar 'owner' (para que tenga acceso completo por ahora)

Esto permitirá que la tienda funcione mientras se implementa un sistema de roles más robusto.
