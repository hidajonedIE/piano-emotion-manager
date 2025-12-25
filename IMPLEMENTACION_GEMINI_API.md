# Guía de Implementación: Google Gemini API Gratuita

## Índice

1. [Resumen](#resumen)
2. [Obtener API Key Gratuita](#obtener-api-key-gratuita)
3. [Configuración en el Proyecto](#configuración-en-el-proyecto)
4. [Modificaciones de Código](#modificaciones-de-código)
5. [Casos de Uso para Piano Emotion Manager](#casos-de-uso-para-piano-emotion-manager)
6. [Ejemplos de Implementación](#ejemplos-de-implementación)
7. [Límites y Consideraciones](#límites-y-consideraciones)

---

## Resumen

Google Gemini API ofrece un plan gratuito muy generoso que permite integrar IA generativa en Piano Emotion Manager sin coste inicial. Esta guía detalla cómo implementarlo.

### Modelos Disponibles Gratis

| Modelo | Contexto | Velocidad | Mejor Para |
|--------|----------|-----------|------------|
| **gemini-2.5-flash** | 1M tokens | Muy rápida | Chat, asistentes, tareas generales |
| **gemini-2.5-pro** | 1M tokens | Rápida | Razonamiento complejo, análisis |
| **gemini-2.0-flash** | 1M tokens | Rápida | Producción estable |

### Límites del Plan Gratuito

- **15-60 RPM** (requests por minuto) según modelo
- **1,000-14,400 RPD** (requests por día) según modelo
- **Suficiente para**: ~100-500 usuarios activos con uso moderado

---

## Obtener API Key Gratuita

### Paso 1: Crear Cuenta en Google AI Studio

1. Ir a [https://aistudio.google.com/](https://aistudio.google.com/)
2. Iniciar sesión con tu cuenta de Google
3. Aceptar los términos de servicio

### Paso 2: Obtener API Key

1. En el menú lateral, hacer clic en **"Get API key"**
2. Seleccionar **"Create API key in new project"** o usar un proyecto existente
3. Copiar la API key generada (formato: `AIza...`)

### Paso 3: Verificar la API Key

Puedes probar la API key con este comando curl:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=TU_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hola, ¿cómo estás?"}]}]}'
```

---

## Configuración en el Proyecto

### Opción A: Usando la API de Gemini Directamente

#### 1. Añadir Variable de Entorno

En Vercel o tu archivo `.env.local`:

```env
GEMINI_API_KEY=AIza...tu_api_key_aqui
```

#### 2. Instalar SDK de Google

```bash
pnpm add @google/generative-ai
```

### Opción B: Usando API Compatible con OpenAI (Recomendado)

Gemini ofrece un endpoint compatible con la API de OpenAI, lo que permite usar el código existente con mínimos cambios.

#### 1. Configurar Variables de Entorno

```env
BUILT_IN_FORGE_API_URL=https://generativelanguage.googleapis.com/v1beta/openai
BUILT_IN_FORGE_API_KEY=AIza...tu_api_key_aqui
```

---

## Modificaciones de Código

### Modificar el Servicio LLM Existente

El archivo `server/_core/llm.ts` ya está preparado para usar una API compatible con OpenAI. Solo necesitas:

#### Opción 1: Usar el endpoint compatible de Gemini

Modifica `server/_core/llm.ts`:

```typescript
// Cambiar el modelo por defecto
const payload: Record<string, unknown> = {
  model: "gemini-2.5-flash",  // Ya está configurado
  messages: messages.map(normalizeMessage),
};

// El endpoint se configura via variable de entorno
// BUILT_IN_FORGE_API_URL=https://generativelanguage.googleapis.com/v1beta/openai
```

#### Opción 2: Crear un servicio específico para Gemini

Crear `server/_core/gemini.ts`:

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV } from "./env";

const genAI = new GoogleGenerativeAI(ENV.geminiApiKey || "");

export type GeminiMessage = {
  role: "user" | "model";
  parts: { text: string }[];
};

export async function invokeGemini(
  messages: GeminiMessage[],
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: options?.model || "gemini-2.5-flash",
  });

  const chat = model.startChat({
    history: messages.slice(0, -1),
    generationConfig: {
      maxOutputTokens: options?.maxTokens || 2048,
      temperature: options?.temperature || 0.7,
    },
  });

  const lastMessage = messages[messages.length - 1];
  const result = await chat.sendMessage(lastMessage.parts[0].text);
  const response = await result.response;
  
  return response.text();
}

// Función para chat simple
export async function chatWithGemini(prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// Función para análisis con contexto
export async function analyzeWithGemini(
  systemPrompt: string,
  userInput: string
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: systemPrompt,
  });
  
  const result = await model.generateContent(userInput);
  return result.response.text();
}
```

---

## Casos de Uso para Piano Emotion Manager

### 1. Asistente de Chat Inteligente

**Descripción**: Reemplazar el asistente actual (que usa respuestas predefinidas) por uno con IA real.

**Implementación**:

```typescript
// server/routers/ai-assistant.router.ts
import { z } from 'zod';
import { router, protectedProcedure } from '@/server/trpc';
import { chatWithGemini } from '@/server/_core/gemini';

export const aiAssistantRouter = router({
  chat: protectedProcedure
    .input(z.object({
      message: z.string(),
      context: z.object({
        clientCount: z.number().optional(),
        pendingServices: z.number().optional(),
        recentActivity: z.string().optional(),
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      const systemPrompt = `Eres un asistente experto en gestión de servicios de afinación y mantenimiento de pianos.
      Tu nombre es PianoBot y ayudas a técnicos de piano con:
      - Programación de citas
      - Consejos técnicos sobre afinación y reparación
      - Gestión de clientes
      - Facturación y presupuestos
      
      Contexto del usuario:
      - Clientes: ${input.context?.clientCount || 'desconocido'}
      - Servicios pendientes: ${input.context?.pendingServices || 'desconocido'}
      
      Responde de forma concisa y profesional en español.`;

      const response = await chatWithGemini(`${systemPrompt}\n\nUsuario: ${input.message}`);
      return { response };
    }),
});
```

**Coste estimado**: ~$0.01-0.03 por usuario/mes

---

### 2. Generación Automática de Informes de Servicio

**Descripción**: Generar informes profesionales de servicio a partir de notas del técnico.

**Implementación**:

```typescript
// server/services/ai/report-generator.ts
import { analyzeWithGemini } from '@/server/_core/gemini';

export async function generateServiceReport(serviceData: {
  pianoModel: string;
  serviceType: string;
  technicianNotes: string;
  tasksCompleted: string[];
}): Promise<string> {
  const prompt = `Genera un informe profesional de servicio de piano basado en estos datos:
  
  Piano: ${serviceData.pianoModel}
  Tipo de servicio: ${serviceData.serviceType}
  Notas del técnico: ${serviceData.technicianNotes}
  Tareas completadas: ${serviceData.tasksCompleted.join(', ')}
  
  El informe debe incluir:
  1. Resumen ejecutivo
  2. Estado del piano antes del servicio
  3. Trabajos realizados
  4. Recomendaciones para el cliente
  5. Próximo mantenimiento sugerido
  
  Formato: Profesional pero accesible para el cliente.`;

  return analyzeWithGemini(
    "Eres un experto en redacción de informes técnicos de pianos.",
    prompt
  );
}
```

**Coste estimado**: ~$0.005 por informe

---

### 3. Análisis Inteligente de Clientes

**Descripción**: Analizar patrones de clientes y generar insights.

**Implementación**:

```typescript
// server/services/ai/client-analyzer.ts
import { analyzeWithGemini } from '@/server/_core/gemini';

export async function analyzeClientBehavior(clientData: {
  name: string;
  serviceHistory: { date: string; type: string; cost: number }[];
  lastContact: string;
  totalSpent: number;
}): Promise<{
  summary: string;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}> {
  const prompt = `Analiza este cliente de servicios de piano:
  
  Nombre: ${clientData.name}
  Historial de servicios: ${JSON.stringify(clientData.serviceHistory)}
  Último contacto: ${clientData.lastContact}
  Total gastado: ${clientData.totalSpent}€
  
  Proporciona:
  1. Un resumen del comportamiento del cliente
  2. Nivel de riesgo de pérdida (low/medium/high)
  3. 3 recomendaciones específicas para retenerlo
  
  Responde en formato JSON.`;

  const response = await analyzeWithGemini(
    "Eres un analista de CRM especializado en retención de clientes.",
    prompt
  );

  return JSON.parse(response);
}
```

**Coste estimado**: ~$0.01 por análisis

---

### 4. Sugerencias de Precios Inteligentes

**Descripción**: Sugerir precios basados en el tipo de servicio, piano y mercado.

**Implementación**:

```typescript
// server/services/ai/pricing-advisor.ts
import { analyzeWithGemini } from '@/server/_core/gemini';

export async function suggestPricing(serviceData: {
  serviceType: string;
  pianoType: string;
  pianoBrand: string;
  location: string;
  complexity: 'simple' | 'medium' | 'complex';
  historicalPrices?: number[];
}): Promise<{
  suggestedPrice: number;
  priceRange: { min: number; max: number };
  justification: string;
}> {
  const prompt = `Como experto en precios de servicios de piano en España, sugiere un precio para:
  
  Servicio: ${serviceData.serviceType}
  Tipo de piano: ${serviceData.pianoType}
  Marca: ${serviceData.pianoBrand}
  Ubicación: ${serviceData.location}
  Complejidad: ${serviceData.complexity}
  ${serviceData.historicalPrices ? `Precios anteriores: ${serviceData.historicalPrices.join(', ')}€` : ''}
  
  Responde en JSON con:
  - suggestedPrice: precio recomendado en euros
  - priceRange: { min, max } rango aceptable
  - justification: breve justificación`;

  const response = await analyzeWithGemini(
    "Eres un consultor de precios para servicios de piano en España.",
    prompt
  );

  return JSON.parse(response);
}
```

**Coste estimado**: ~$0.005 por consulta

---

### 5. Transcripción de Notas de Voz

**Descripción**: Usar Gemini para procesar notas de voz transcritas.

**Nota**: Gemini puede procesar audio directamente, pero para notas de voz cortas, es más eficiente usar Whisper para transcribir y luego Gemini para estructurar.

```typescript
// server/services/ai/voice-notes.ts
import { analyzeWithGemini } from '@/server/_core/gemini';

export async function processVoiceNote(transcription: string): Promise<{
  summary: string;
  actionItems: string[];
  clientMentioned?: string;
  serviceType?: string;
}> {
  const prompt = `Procesa esta nota de voz de un técnico de pianos:
  
  "${transcription}"
  
  Extrae:
  1. Resumen conciso
  2. Acciones a realizar (lista)
  3. Cliente mencionado (si aplica)
  4. Tipo de servicio (si aplica)
  
  Responde en JSON.`;

  const response = await analyzeWithGemini(
    "Eres un asistente que procesa notas de voz de técnicos de piano.",
    prompt
  );

  return JSON.parse(response);
}
```

---

### 6. Emails Automáticos Personalizados

**Descripción**: Generar emails de seguimiento, recordatorios y marketing.

```typescript
// server/services/ai/email-generator.ts
import { analyzeWithGemini } from '@/server/_core/gemini';

export async function generateEmail(params: {
  type: 'reminder' | 'followup' | 'promotion' | 'thank_you';
  clientName: string;
  lastService?: string;
  nextServiceDate?: string;
  customContext?: string;
}): Promise<{
  subject: string;
  body: string;
}> {
  const templates = {
    reminder: "recordatorio de mantenimiento de piano",
    followup: "seguimiento después del servicio",
    promotion: "oferta especial de servicios",
    thank_you: "agradecimiento por confiar en nosotros",
  };

  const prompt = `Genera un email profesional de ${templates[params.type]} para:
  
  Cliente: ${params.clientName}
  ${params.lastService ? `Último servicio: ${params.lastService}` : ''}
  ${params.nextServiceDate ? `Próximo servicio sugerido: ${params.nextServiceDate}` : ''}
  ${params.customContext ? `Contexto adicional: ${params.customContext}` : ''}
  
  El email debe ser:
  - Profesional pero cercano
  - En español
  - Conciso (máximo 150 palabras)
  
  Responde en JSON con "subject" y "body".`;

  const response = await analyzeWithGemini(
    "Eres un experto en comunicación con clientes de servicios de piano.",
    prompt
  );

  return JSON.parse(response);
}
```

**Coste estimado**: ~$0.003 por email

---

## Límites y Consideraciones

### Límites del Plan Gratuito

| Modelo | RPM | RPD | Tokens/min |
|--------|-----|-----|------------|
| gemini-2.5-flash | 15 | 1,500 | 1,000,000 |
| gemini-2.5-pro | 2 | 50 | 32,000 |
| gemini-2.0-flash | 15 | 1,500 | 1,000,000 |

### Recomendaciones

1. **Usar gemini-2.5-flash** para la mayoría de casos (más rápido y generoso)
2. **Implementar caché** para respuestas frecuentes
3. **Rate limiting** en el frontend para evitar abusos
4. **Fallback a respuestas predefinidas** si se alcanza el límite

### Consideraciones de Privacidad

> **Importante**: En el plan gratuito, Google puede usar el contenido enviado para mejorar sus modelos.

**Recomendaciones**:
- No enviar datos personales sensibles (DNI, tarjetas, etc.)
- Anonimizar nombres de clientes si es posible
- Para datos sensibles, considerar el plan de pago

### Ejemplo de Rate Limiting

```typescript
// lib/rate-limiter.ts
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(userId: string, maxRequests = 50): boolean {
  const now = Date.now();
  const userLimit = requestCounts.get(userId);
  
  if (!userLimit || userLimit.resetAt < now) {
    requestCounts.set(userId, { count: 1, resetAt: now + 60000 }); // Reset cada minuto
    return true;
  }
  
  if (userLimit.count >= maxRequests) {
    return false;
  }
  
  userLimit.count++;
  return true;
}
```

---

## Resumen de Costes Estimados

| Funcionalidad | Coste por Uso | Uso Mensual (100 usuarios) | Coste Mensual |
|---------------|---------------|----------------------------|---------------|
| Chat asistente | $0.02/conversación | 500 conversaciones | $10 |
| Informes de servicio | $0.005/informe | 200 informes | $1 |
| Análisis de clientes | $0.01/análisis | 100 análisis | $1 |
| Emails automáticos | $0.003/email | 300 emails | $0.90 |
| **Total estimado** | - | - | **~$13/mes** |

**Con el plan gratuito**: La mayoría de estos usos estarían cubiertos sin coste, especialmente para pequeños negocios con menos de 100 usuarios activos.

---

## Próximos Pasos

1. **Obtener API key** de Google AI Studio
2. **Configurar variables de entorno** en Vercel
3. **Implementar el servicio Gemini** (`server/_core/gemini.ts`)
4. **Crear el router de asistente IA** (`server/routers/ai-assistant.router.ts`)
5. **Actualizar el componente AIAssistant** para usar el nuevo endpoint
6. **Probar y ajustar** los prompts según necesidades

---

*Documento creado: Diciembre 2024*
*Versión: 1.0*
