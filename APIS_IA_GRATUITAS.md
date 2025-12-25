# APIs de IA con Planes Gratuitos para Piano Emotion Manager

## Resumen Ejecutivo

Existen múltiples proveedores de APIs de IA que ofrecen planes gratuitos con límites generosos. A continuación se presenta un análisis detallado de las mejores opciones para integrar en Piano Emotion Manager.

---

## 1. Google Gemini API (Recomendado)

**URL**: https://ai.google.dev/gemini-api

Google ofrece un plan gratuito muy generoso para su API de Gemini, ideal para proyectos en desarrollo y pequeñas aplicaciones.

### Modelos Disponibles Gratis

| Modelo | Input | Output | Contexto | Notas |
|--------|-------|--------|----------|-------|
| Gemini 3 Flash Preview | Gratis | Gratis | 1M tokens | Modelo más reciente, muy rápido |
| Gemini 2.5 Pro | Gratis | Gratis | 1M tokens | Excelente para razonamiento complejo |
| Gemini 2.5 Flash | Gratis | Gratis | 1M tokens | Balance velocidad/calidad |
| Gemini 2.5 Flash-Lite | Gratis | Gratis | 1M tokens | Más ligero y rápido |
| Gemini 2.0 Flash | Gratis | Gratis | 1M tokens | Versión estable |

### Limitaciones del Plan Gratuito

El plan gratuito incluye rate limits que varían por modelo. Según la documentación oficial, los límites típicos son entre 15-60 RPM (requests per minute) y 1,000-14,400 RPD (requests per day) dependiendo del modelo.

**Importante**: El contenido enviado al plan gratuito **se usa para mejorar los productos de Google**. Para uso comercial con datos sensibles, se recomienda el plan de pago.

### Cómo Obtener API Key

1. Ir a https://aistudio.google.com/
2. Crear un proyecto o seleccionar uno existente
3. Obtener API key desde la sección "API Keys"

---

## 2. Groq (Velocidad Ultra-Rápida)

**URL**: https://console.groq.com

Groq ofrece inferencia extremadamente rápida gracias a su hardware LPU especializado.

### Plan Gratuito - Límites por Modelo

| Modelo | RPM | RPD | TPM | TPD |
|--------|-----|-----|-----|-----|
| Llama 3.3 70B Versatile | 30 | 1K | 12K | 100K |
| Llama 3.1 8B Instant | 30 | 14.4K | 6K | 500K |
| Llama 4 Scout 17B | 30 | 1K | 30K | 500K |
| Qwen3 32B | 60 | 1K | 6K | 500K |
| Whisper Large V3 (audio) | 20 | 2K | - | 28.8K seg/día |

### Ventajas

Groq es conocido por su velocidad de inferencia, siendo hasta 10x más rápido que otros proveedores. Ideal para aplicaciones que requieren respuestas en tiempo real.

### Cómo Obtener API Key

1. Registrarse en https://console.groq.com
2. Ir a "API Keys" en el dashboard
3. Crear una nueva API key

---

## 3. Cloudflare Workers AI

**URL**: https://developers.cloudflare.com/workers-ai/

Cloudflare ofrece un plan gratuito con 10,000 "Neurons" por día, que equivale aproximadamente a miles de requests dependiendo del modelo.

### Plan Gratuito

| Plan | Asignación Gratuita | Precio Adicional |
|------|---------------------|------------------|
| Workers Free | 10,000 Neurons/día | N/A (requiere upgrade) |
| Workers Paid | 10,000 Neurons/día | $0.011 / 1,000 Neurons |

### Modelos Disponibles

Cloudflare ofrece acceso a múltiples modelos incluyendo Llama 3.2, Llama 3.3, Mistral, DeepSeek, Qwen, y modelos de audio como Whisper. Los precios varían por modelo, pero la asignación gratuita de 10,000 neurons/día permite un uso considerable.

### Ejemplo de Costes en Neurons

El modelo Llama 3.2 1B consume aproximadamente 2,457 neurons por millón de tokens de entrada y 18,252 neurons por millón de tokens de salida. Esto significa que con 10,000 neurons diarios se pueden procesar varios cientos de requests típicos.

---

## 4. OpenRouter (Acceso Unificado)

**URL**: https://openrouter.ai

OpenRouter actúa como gateway unificado a más de 600 modelos de diferentes proveedores, incluyendo varios modelos completamente gratuitos.

### Modelos Gratuitos Destacados

| Modelo | Contexto | Precio |
|--------|----------|--------|
| Xiaomi MiMo-V2-Flash | 262K | $0/M input, $0/M output |
| AllenAI Olmo 3.1 32B Think | 66K | $0/M input, $0/M output |
| NVIDIA Nemotron 3 Nano 30B | 256K | $0/M input, $0/M output |
| Arcee Trinity Mini | - | $0/M input, $0/M output |

### Ventajas

OpenRouter permite cambiar entre modelos fácilmente usando la misma API, lo que facilita probar diferentes opciones sin cambiar código.

---

## 5. Hugging Face Inference API

**URL**: https://huggingface.co/inference-api

Hugging Face ofrece acceso gratuito a miles de modelos open-source con límites de rate.

### Plan Gratuito

El plan gratuito incluye un límite mensual de créditos equivalente a aproximadamente $0.10 USD. Esto permite experimentar con modelos pero no es suficiente para uso en producción.

### Modelos Disponibles

Acceso a más de 200,000 modelos en el Hub de Hugging Face, incluyendo modelos de texto, imagen, audio, y más.

---

## Comparativa de Opciones

| Proveedor | Mejor Para | Límite Diario Aproximado | Velocidad | Facilidad de Integración |
|-----------|------------|--------------------------|-----------|--------------------------|
| Google Gemini | Uso general, multimodal | ~1,000-14,400 requests | Alta | Muy fácil |
| Groq | Velocidad máxima | ~1,000-14,400 requests | Muy alta | Fácil |
| Cloudflare | Edge computing | ~100-500 requests | Alta | Media |
| OpenRouter | Flexibilidad de modelos | Ilimitado (modelos free) | Variable | Muy fácil |
| Hugging Face | Experimentación | Muy limitado | Media | Fácil |

---

## Recomendación para Piano Emotion Manager

### Opción 1: Google Gemini (Recomendado)

Para el asistente de chat y funcionalidades de IA generativa, Google Gemini ofrece el mejor balance entre calidad, velocidad y límites generosos. El modelo **Gemini 2.5 Flash** es ideal para un asistente conversacional.

**Configuración sugerida**:
```env
GEMINI_API_KEY=tu_api_key_aqui
GEMINI_MODEL=gemini-2.5-flash
```

### Opción 2: Groq (Para máxima velocidad)

Si la velocidad de respuesta es crítica, Groq con **Llama 3.3 70B** ofrece respuestas casi instantáneas.

**Configuración sugerida**:
```env
GROQ_API_KEY=tu_api_key_aqui
GROQ_MODEL=llama-3.3-70b-versatile
```

### Opción 3: OpenRouter (Para flexibilidad)

Si se desea la posibilidad de cambiar entre modelos sin modificar código, OpenRouter es la mejor opción.

**Configuración sugerida**:
```env
OPENROUTER_API_KEY=tu_api_key_aqui
OPENROUTER_MODEL=xiaomi/mimo-v2-flash:free
```

---

## Consideraciones de Privacidad

Es importante tener en cuenta que la mayoría de planes gratuitos utilizan los datos enviados para mejorar sus modelos. Para aplicaciones con datos sensibles de clientes, se recomienda:

1. Usar el plan de pago de Google Gemini (el contenido NO se usa para entrenar)
2. Usar modelos self-hosted
3. Anonimizar datos antes de enviarlos a la API

---

## Próximos Pasos para Implementación

1. **Crear cuenta** en el proveedor elegido (Google AI Studio recomendado)
2. **Obtener API key** desde el dashboard del proveedor
3. **Configurar variables de entorno** en Vercel
4. **Modificar el servicio LLM** en `server/_core/llm.ts` para usar la nueva API
5. **Probar** con el asistente de chat existente

---

*Documento actualizado: Diciembre 2024*
*Fuentes: Documentación oficial de Google AI, Groq, Cloudflare, OpenRouter*
