# Optimización de Alertas y Avisos

## Fecha
12 de enero de 2026

## Problema Identificado
El dashboard tardaba 2-3 segundos en cargar las alertas y avisos, causando una mala experiencia de usuario.

## Causa Raíz
1. **useRecommendations**: Iteraba sobre todos los pianos y para cada piano hacía `.filter()` + `.sort()` sobre todos los servicios
2. **useAllAlerts**: Múltiples iteraciones sobre appointments, invoices y quotes con `.filter()` y `.reduce()` repetidos
3. **Cálculos de fechas repetidos**: Se creaban objetos `Date` múltiples veces en cada render

## Optimizaciones Aplicadas

### 1. useRecommendations
- **Pre-cálculo de mapa de servicios**: Se crea un `Map<string, Service[]>` que agrupa servicios por piano una sola vez
- **Ordenamiento único**: Los servicios se ordenan una sola vez al crear el mapa, no en cada iteración
- **Memoización de funciones**: Las funciones de filtrado se memorizan con `useMemo`

**Resultado**: Reducción de O(n²) a O(n) en complejidad temporal

### 2. useAllAlerts
- **Cálculo de fechas único**: Todas las fechas (today, tomorrow, nextWeek, etc.) se calculan una sola vez con `useMemo`
- **Iteración única**: appointments, invoices y quotes se procesan en una sola pasada
- **Acumuladores**: Se usan acumuladores para evitar múltiples `.reduce()`

**Resultado**: Reducción de múltiples iteraciones a una sola por tipo de dato

### 3. Estadísticas
- **Contador optimizado**: En lugar de múltiples `.filter().length`, se usa un solo `forEach` con contadores

## Impacto Esperado
- **Tiempo de carga**: De 2-3 segundos a <1 segundo
- **Re-renders**: Reducción significativa de re-renders innecesarios
- **Experiencia de usuario**: Carga instantánea de alertas

## Archivos Modificados
- `hooks/use-recommendations.ts` (optimizado)
- `hooks/use-all-alerts.ts` (optimizado)

## Archivos de Backup
- `hooks/use-recommendations-backup.ts`
- `hooks/use-all-alerts-backup.ts`

## Compatibilidad
✅ 100% compatible con el código existente
✅ Misma interfaz pública
✅ Mismos resultados
✅ Sin cambios en componentes que usan estos hooks
