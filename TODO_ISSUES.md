# TODOs para GitHub Issues

Este archivo contiene todos los comentarios `TODO` encontrados en el código, organizados por categoría y prioridad para facilitar su migración a GitHub Issues.

**Total de TODOs:** 89
**Fecha de extracción:** 24 de diciembre de 2025

---

## 🔴 Prioridad Alta - Portal del Cliente (27 TODOs)

Estos TODOs están en `server/routes/portal.ts` y son críticos para el funcionamiento del portal del cliente.

### Issue: Implementar autenticación Magic Link del Portal

**Archivo:** `server/routes/portal.ts`
**Labels:** `enhancement`, `portal`, `auth`

```
- [ ] Verificar que el email pertenece a un cliente existente (línea 27)
- [ ] Generar token único (línea 28)
- [ ] Guardar en base de datos (línea 32)
- [ ] Enviar email con el magic link (línea 33)
- [ ] Verificar token en base de datos (línea 60)
- [ ] Marcar como usado (línea 61)
- [ ] Generar token de sesión JWT (línea 62)
- [ ] Verificar token JWT del header Authorization (línea 86)
- [ ] Obtener usuario de la base de datos (línea 87)
```

### Issue: Implementar endpoints del Portal del Cliente

**Archivo:** `server/routes/portal.ts`
**Labels:** `enhancement`, `portal`, `api`

```
- [ ] Obtener clientId del token JWT (línea 114)
- [ ] Consultar pianos del cliente (línea 115)
- [ ] Verificar que el piano pertenece al cliente (línea 145)
- [ ] Obtener servicios del cliente (línea 173)
- [ ] Verificar que el servicio pertenece al cliente (línea 191)
- [ ] Generar o recuperar PDF de la factura (línea 231)
- [ ] Crear solicitud de cita en base de datos (línea 273)
- [ ] Notificar al técnico de nueva solicitud (línea 274)
- [ ] Verificar que la solicitud pertenece al cliente y está pendiente (línea 312)
- [ ] Cancelar solicitud (línea 313)
- [ ] Verificar que el servicio pertenece al cliente para valoración (línea 339)
- [ ] Verificar que no existe valoración previa (línea 340)
- [ ] Crear valoración (línea 341)
- [ ] Obtener mensajes paginados (línea 393)
- [ ] Crear mensaje (línea 418)
- [ ] Notificar al técnico de nuevo mensaje (línea 419)
- [ ] Marcar mensajes como leídos (línea 445)
```

---

## 🟠 Prioridad Media - Módulo de Equipos (17+ TODOs)

Estos TODOs están en `server/routers/team-extended.router.ts` y servicios relacionados.

### Issue: Implementar queries y mutations del módulo de equipos

**Archivo:** `server/routers/team-extended.router.ts`
**Labels:** `enhancement`, `team`, `api`

```
- [ ] Implementar query real para estadísticas de equipo (línea 437)
- [ ] Implementar query real para rendimiento (línea 442)
- [ ] Implementar query real para actividad (línea 452)
- [ ] Implementar mutation real para crear equipo (línea 457)
- [ ] Implementar mutation real para actualizar equipo (línea 462)
- [ ] Implementar mutation real para eliminar equipo (línea 467)
- [ ] Implementar mutation real para añadir miembro (línea 472)
- [ ] Implementar query real para obtener miembros (línea 477)
- [ ] Implementar query real para obtener equipos (línea 488)
- [ ] Implementar query real para obtener equipo por ID (línea 499)
- [ ] Implementar query real para obtener miembros de equipo (línea 504)
- [ ] Implementar query real para estadísticas de miembro (línea 514)
- [ ] Implementar mutation real para actualizar rol (línea 519)
- [ ] Implementar mutation real para eliminar miembro (línea 524)
- [ ] Implementar mutation real para asignar trabajo (línea 529)
- [ ] Implementar mutation real para reasignar trabajo (línea 534)
- [ ] Implementar mutation real para completar trabajo (línea 539)
```

### Issue: Implementar notificaciones en asignaciones de trabajo

**Archivo:** `server/services/team/work-assignment.service.ts`
**Labels:** `enhancement`, `team`, `notifications`

```
- [ ] Enviar notificación al técnico cuando se le asigna trabajo (línea 129)
- [ ] Notificar a ambos técnicos cuando se reasigna trabajo (línea 276)
- [ ] Notificar al manager cuando se completa trabajo (línea 330)
- [ ] Considerar zona y especialidad del técnico en asignación automática (línea 537)
```

### Issue: Implementar lógica de permisos por equipo/zona

**Archivo:** `server/services/team/permissions.service.ts`
**Labels:** `enhancement`, `team`, `permissions`

```
- [ ] Implementar lógica de equipo/zona en verificación de permisos (línea 287)
```

---

## 🟡 Prioridad Media - Frontend App (15 TODOs)

### Issue: Completar funcionalidades del panel de distribuidores

**Archivo:** `app/distributor-panel.tsx`
**Labels:** `enhancement`, `distributor`

```
- [ ] Cargar datos reales de la API (línea 88)
- [ ] Llamar a la API real para acciones (línea 135)
- [ ] Guardar configuración en la API (línea 159)
```

### Issue: Implementar estadísticas reales del módulo de equipos

**Archivo:** `app/(app)/team/index.tsx`
**Labels:** `enhancement`, `team`, `stats`

```
- [ ] Calcular ingresos totales del mes desde servicios (línea 127)
- [ ] Calcular servicios totales del mes desde servicios (línea 128)
- [ ] Calcular valoración media del mes desde valoraciones (línea 129)
- [ ] Calcular ingresos totales por técnico desde servicios (línea 150)
- [ ] Calcular valoración media por técnico desde valoraciones (línea 151)
- [ ] Calcular número de valoraciones por técnico (línea 152)
- [ ] Calcular llegadas a tiempo desde asignaciones (línea 153)
- [ ] Calcular llegadas tarde desde asignaciones (línea 154)
```

### Issue: Implementar modal de cookies en configuración de privacidad

**Archivo:** `app/privacy-settings.tsx`
**Labels:** `enhancement`, `privacy`

```
- [ ] Abrir modal de cookies (línea 370)
```

### Issue: Cargar y guardar configuración desde AsyncStorage/API

**Archivo:** `app/settings/index.tsx`
**Labels:** `enhancement`, `settings`

```
- [ ] Cargar configuración desde AsyncStorage o API (línea 146)
- [ ] Guardar configuración en AsyncStorage o API (línea 156)
```

### Issue: Implementar verificación real de permisos en dashboard

**Archivo:** `components/dashboard/EnhancedDashboard.tsx`
**Labels:** `enhancement`, `permissions`

```
- [ ] Implementar verificación real de permisos (línea 299)
```

---

## 🟢 Prioridad Baja - Backend Services (30+ TODOs)

### Issue: Completar servicio de VeriFactu

**Archivo:** `server/services/verifactu.service.ts`
**Labels:** `enhancement`, `invoicing`, `verifactu`

```
- [ ] Implementar consulta de estado (línea 339)
- [ ] Verificar conexión real con VeriFactu (línea 353)
- [ ] Contar facturas pendientes (línea 358)
- [ ] Contar facturas enviadas hoy (línea 359)
```

### Issue: Completar servicio de notificaciones

**Archivo:** `server/services/notifications/notification.service.ts`
**Labels:** `enhancement`, `notifications`

```
- [ ] Guardar notificación en base de datos (línea 173)
- [ ] Eliminar notificación de base de datos (línea 185)
- [ ] Guardar preferencias en base de datos (línea 336)
- [ ] Actualizar estado de notificación en base de datos (línea 386)
- [ ] Actualizar estado de lectura en base de datos (línea 400)
```

### Issue: Completar servicio de tienda

**Archivo:** `server/services/shop/shop.service.ts`
**Labels:** `enhancement`, `shop`

```
- [ ] Encriptar contraseña de tienda (línea 193)
- [ ] Añadir filtros de categoría y búsqueda (línea 301)
```

### Issue: Implementar jobs de verificación de compras

**Archivo:** `server/jobs/daily-purchase-check.ts`
**Labels:** `enhancement`, `jobs`

```
- [ ] Implementar con Drizzle ORM - obtener usuarios (línea 79)
- [ ] Implementar con Drizzle ORM - verificar compras (línea 95)
- [ ] Implementar con Drizzle ORM - actualizar estado (línea 103)
- [ ] Implementar envío de email/notificación (línea 116)
```

### Issue: Completar servicio de facturación electrónica PEPPOL (Bélgica)

**Archivo:** `server/services/einvoicing/belgium/peppol.service.ts`
**Labels:** `enhancement`, `invoicing`, `peppol`

```
- [ ] Implementar lógica de envío a Access Point PEPPOL (línea 54)
- [ ] Implementar lógica de recuperación de estado (línea 70)
- [ ] Añadir reglas de validación específicas a PEPPOL BIS 3.0 (línea 87)
- [ ] Detallar sub-totales por tasa de IVA (línea 144)
```

### Issue: Integrar servicio de email real para notificaciones de stock

**Archivo:** `services/stock-notifications.ts`
**Labels:** `enhancement`, `notifications`, `email`

```
- [ ] Integrar con servicio de email real (SendGrid, AWS SES, etc.) (línea 254)
```

---

## Cómo crear los Issues en GitHub

1. Ve a https://github.com/hidajonedIE/piano-emotion-manager/issues
2. Haz clic en "New issue"
3. Copia el título y descripción de cada sección
4. Añade los labels sugeridos
5. Asigna la prioridad correspondiente (milestone o project)

### Labels sugeridos para crear:

- `enhancement` - Mejoras de funcionalidad
- `portal` - Relacionado con el portal del cliente
- `team` - Relacionado con el módulo de equipos
- `auth` - Relacionado con autenticación
- `api` - Relacionado con endpoints de API
- `notifications` - Relacionado con notificaciones
- `permissions` - Relacionado con permisos
- `invoicing` - Relacionado con facturación
- `shop` - Relacionado con la tienda
- `privacy` - Relacionado con privacidad/GDPR
- `settings` - Relacionado con configuración
- `stats` - Relacionado con estadísticas
- `distributor` - Relacionado con distribuidores

---

*Generado automáticamente por el análisis de código de Piano Emotion Manager*
