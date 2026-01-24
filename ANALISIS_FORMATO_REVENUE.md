# Análisis: Dónde aplicar formato compacto de revenue

## Problema
El valor de revenue muestra decimales y números grandes (10.000€) que se salen del círculo visual en el dashboard.

## Solución Implementada (INCORRECTA)
✅ `components/dashboard-editor/widgets/PredictionsWidget.tsx` - línea 80-82
   - Formato: `10.0k€` para valores >= 10.000
   - **PROBLEMA**: Este widget usa `trpc.advanced.predictions.getRevenue` que devuelve el valor ya formateado

## Solución Correcta
El formato debe aplicarse en el SERVICIO que genera los datos, no en el componente que los muestra.

### Opciones:

1. **Router de predicciones avanzadas** (`server/routers/ai-predictions-enhanced.router.ts`)
   - Endpoint: `advanced.predictions.getRevenue`
   - Llama a: `enhanced-predictions.service.ts`

2. **Servicio de predicciones con Gemini** (`server/services/ai-predictions/gemini-predictions.service.ts`)
   - Función: `predictRevenue()`
   - Devuelve: `RevenuePrediction` con `predictedAmount: number`

3. **Router de predicciones simple** (`server/routers/ai-predictions-new.router.ts`)
   - Endpoint: `aiPredictions.getDashboardPredictions`
   - Usa: `gemini-predictions.service.ts`

## Decisión
Aplicar el formato en el **router** que devuelve los datos al dashboard, para que todos los componentes que consuman esos datos vean el valor ya formateado correctamente.

El problema es que el valor es `number`, no `string`, así que necesitamos cambiar el tipo o formatear en el componente.

**MEJOR OPCIÓN**: Formatear en el componente pero asegurarnos de que el número NO tenga decimales (ya hecho con `Math.round`).
