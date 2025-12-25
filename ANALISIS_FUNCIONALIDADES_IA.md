# Análisis de Funcionalidades de IA - Piano Emotion Manager

**Fecha:** 25 de diciembre de 2025  
**Versión:** 1.0

---

## 1. Resumen Ejecutivo

Piano Emotion Manager incluye **dos categorías de funcionalidades de IA**:

1. **IA Predictiva Local (Sin API Externa)**: Algoritmos estadísticos implementados en el servidor que no requieren APIs externas ni costes adicionales.

2. **IA Generativa (Requiere API Externa)**: Funcionalidades que utilizan modelos de lenguaje grande (LLM), generación de imágenes y transcripción de voz que requieren una API key externa.

---

## 2. Funcionalidades de IA Implementadas

### 2.1. IA Predictiva Local (Sin Coste Adicional)

Estas funcionalidades están **completamente implementadas** y funcionan con algoritmos estadísticos locales:

| Funcionalidad | Descripción | Estado | Coste |
|---------------|-------------|--------|-------|
| **Predicción de Ingresos** | Predice ingresos futuros basándose en historial de facturas | ✅ Funcional | 0€ |
| **Predicción de Pérdida de Clientes (Churn)** | Identifica clientes en riesgo de abandono | ✅ Funcional | 0€ |
| **Predicción de Mantenimiento** | Predice cuándo cada piano necesitará servicio | ✅ Funcional | 0€ |
| **Predicción de Carga de Trabajo** | Estima la carga de trabajo semanal | ✅ Funcional | 0€ |
| **Predicción de Inventario** | Predice demanda de materiales y sugiere pedidos | ✅ Funcional | 0€ |
| **Recomendaciones de Servicio** | Sugiere servicios adicionales según historial | ✅ Funcional | 0€ |
| **Programación Inteligente** | Optimiza rutas y horarios de citas | ✅ Funcional | 0€ |
| **Recordatorios Automáticos** | Envía recordatorios personalizados | ✅ Funcional | 0€ |
| **Búsqueda Inteligente** | Búsqueda por palabras clave en la app | ✅ Funcional | 0€ |

**Algoritmos utilizados:**
- Regresión lineal para tendencias
- Análisis de estacionalidad
- Cálculo de varianza y confianza
- Promedios móviles
- Scoring basado en reglas

### 2.2. IA Generativa (Requiere API Externa)

Estas funcionalidades están **preparadas pero no activas** porque requieren una API key:

| Funcionalidad | Descripción | Estado | API Requerida |
|---------------|-------------|--------|---------------|
| **Chat con LLM** | Conversación inteligente con asistente | ⚠️ Preparado | BUILT_IN_FORGE_API_KEY |
| **Generación de Imágenes** | Crear imágenes desde texto | ⚠️ Preparado | BUILT_IN_FORGE_API_KEY |
| **Transcripción de Voz** | Convertir audio a texto (Whisper) | ⚠️ Preparado | BUILT_IN_FORGE_API_KEY |
| **Sugerencias de Precios** | Análisis de mercado con IA | ⚠️ Premium | BUILT_IN_FORGE_API_KEY |
| **Insights de Clientes** | Análisis avanzado de comportamiento | ⚠️ Premium | BUILT_IN_FORGE_API_KEY |
| **Diagnóstico de Pianos** | Análisis inteligente del estado | ⚠️ Premium | BUILT_IN_FORGE_API_KEY |
| **Análisis de Negocio** | Informes generados por IA | ⚠️ Premium | BUILT_IN_FORGE_API_KEY |
| **Análisis de Satisfacción** | Análisis de sentimiento de feedback | ⚠️ Premium | BUILT_IN_FORGE_API_KEY |
| **Asistente por Voz** | Control de la app por voz | ⚠️ Premium | BUILT_IN_FORGE_API_KEY |
| **Notas Automáticas** | Resúmenes de servicios desde audio | ⚠️ Premium | BUILT_IN_FORGE_API_KEY |

---

## 3. Costes de Producción de IA Generativa

### 3.1. Modelo de Precios por API

El proyecto está configurado para usar **Gemini 2.5 Flash** a través de una API compatible con OpenAI:

| Servicio | Modelo | Coste Aproximado |
|----------|--------|------------------|
| **LLM (Chat)** | gemini-2.5-flash | ~$0.075/1M tokens entrada, ~$0.30/1M tokens salida |
| **Transcripción** | whisper-1 | ~$0.006/minuto de audio |
| **Generación de Imágenes** | Varies | ~$0.02-0.04/imagen |

### 3.2. Estimación de Costes Mensuales por Usuario

Asumiendo un uso moderado:

| Funcionalidad | Uso Estimado | Coste/Usuario/Mes |
|---------------|--------------|-------------------|
| Chat con Asistente | 50 consultas (~2000 tokens/consulta) | ~$0.03 |
| Transcripción de Voz | 10 minutos de audio | ~$0.06 |
| Generación de Imágenes | 5 imágenes | ~$0.15 |
| **Total Estimado** | - | **~$0.24/usuario/mes** |

### 3.3. Proyección de Costes por Escala

| Usuarios | Coste IA/Mes | Coste IA/Año |
|----------|--------------|--------------|
| 100 | ~$24 (~22€) | ~$288 (~264€) |
| 500 | ~$120 (~110€) | ~$1,440 (~1,320€) |
| 1,000 | ~$240 (~220€) | ~$2,880 (~2,640€) |
| 2,000 | ~$480 (~440€) | ~$5,760 (~5,280€) |

**Nota:** Estos costes son adicionales a la infraestructura base (Vercel, TiDB).

---

## 4. Requisitos para Activar las Funcionalidades de IA

### 4.1. Variables de Entorno Necesarias

Para activar las funcionalidades de IA generativa, se necesitan estas variables en Vercel:

```env
# API de IA (Manus Forge o compatible con OpenAI)
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=tu_api_key_aqui
```

### 4.2. Opciones de Proveedores de API

| Proveedor | Ventajas | Desventajas |
|-----------|----------|-------------|
| **Manus Forge** | Integrado en el scaffold, configuración simple | Requiere cuenta Manus |
| **OpenAI Directo** | Documentación extensa, modelos avanzados | Más caro, requiere cambiar base_url |
| **Google AI (Gemini)** | Económico, buen rendimiento | Requiere adaptador de API |
| **Anthropic (Claude)** | Alta calidad de respuestas | Más caro |

### 4.3. Pasos para Activar

1. **Obtener API Key:**
   - Registrarse en el proveedor elegido
   - Generar una API key con permisos de chat, audio y/o imágenes

2. **Configurar en Vercel:**
   ```bash
   # En el dashboard de Vercel > Settings > Environment Variables
   BUILT_IN_FORGE_API_URL = https://forge.manus.im
   BUILT_IN_FORGE_API_KEY = sk-xxxxxxxxxxxx
   ```

3. **Redesplegar la aplicación:**
   - El redeploy aplicará las nuevas variables
   - Las funcionalidades de IA se activarán automáticamente

---

## 5. Estado Actual del Asistente IA

### 5.1. Asistente de Chat (AIAssistant.tsx)

El asistente de chat actual funciona con **respuestas predefinidas** (no usa LLM):

```typescript
const SAMPLE_RESPONSES: Record<string, { text: string; suggestions: string[] }> = {
  'cita': { text: 'Para programar una nueva cita...', suggestions: [...] },
  'factura': { text: 'Para crear una nueva factura...', suggestions: [...] },
  // etc.
};
```

**Para activar IA real:**
- Se necesita conectar el componente con `invokeLLM()` del servidor
- Requiere `BUILT_IN_FORGE_API_KEY` configurada

### 5.2. Pantalla de Predicciones (predictions.tsx)

La pantalla de predicciones actualmente usa **datos de ejemplo (MOCK_DATA)**:

```typescript
const MOCK_DATA = {
  revenue: [
    { period: 'Enero 2026', value: 4250, confidence: 78, ... },
    // ...
  ],
  // ...
};
```

**Para activar predicciones reales:**
- Conectar con `PredictionService` del backend
- Crear endpoints tRPC para cada tipo de predicción
- Esto **NO requiere API externa** - usa algoritmos locales

---

## 6. Recomendaciones

### 6.1. Funcionalidades Gratuitas (Prioridad Alta)

Estas funcionalidades ya están implementadas y solo necesitan conectarse:

1. **Activar Predicciones Reales:**
   - Crear router tRPC para `PredictionService`
   - Conectar `predictions.tsx` con el backend
   - **Coste: 0€**

2. **Mejorar Asistente con Respuestas Predefinidas:**
   - Ampliar el diccionario de respuestas
   - Añadir más temas de ayuda
   - **Coste: 0€**

### 6.2. Funcionalidades Premium (Requieren API)

Para ofrecer como plan Premium:

1. **Asistente IA Conversacional:**
   - Conectar con LLM
   - **Coste: ~$0.03/usuario/mes**

2. **Transcripción de Notas de Voz:**
   - Activar Whisper para servicios
   - **Coste: ~$0.06/usuario/mes**

3. **Análisis Avanzado con IA:**
   - Insights de clientes, diagnósticos
   - **Coste: ~$0.10/usuario/mes**

### 6.3. Modelo de Monetización Sugerido

| Plan | Funcionalidades IA | Precio Sugerido |
|------|-------------------|-----------------|
| **Gratuito** | Predicciones locales (sin LLM) | 0€ |
| **Profesional** | + Asistente IA básico | +2€/mes |
| **Premium** | + Transcripción + Análisis avanzado | +5€/mes |

---

## 7. Conclusiones

1. **Las predicciones funcionan sin coste adicional** - Solo necesitan conectarse al frontend.

2. **El asistente IA actual es simulado** - Usa respuestas predefinidas, no LLM real.

3. **Para IA generativa real se necesita:**
   - `BUILT_IN_FORGE_API_KEY` en Vercel
   - Coste estimado: ~$0.24/usuario/mes

4. **Recomendación:** Activar primero las predicciones locales (gratis) y ofrecer IA generativa como plan Premium para cubrir los costes de API.

---

## 8. Archivos Relevantes

| Archivo | Descripción |
|---------|-------------|
| `server/_core/llm.ts` | Cliente LLM (gemini-2.5-flash) |
| `server/_core/imageGeneration.ts` | Generación de imágenes |
| `server/_core/voiceTranscription.ts` | Transcripción Whisper |
| `server/services/analytics/prediction.service.ts` | Servicio de predicciones (local) |
| `app/predictions.tsx` | UI de predicciones |
| `app/settings/ai.tsx` | Configuración de IA |
| `components/ai/AIAssistant.tsx` | Asistente de chat |
