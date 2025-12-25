#!/usr/bin/env python3
"""
Demostración de Gemini API para Piano Emotion Manager
Muestra diferentes casos de uso de IA generativa aplicados al negocio
"""

import os
import json
from openai import OpenAI

# Configurar cliente con Gemini
client = OpenAI()

def print_section(title):
    print("\n" + "="*60)
    print(f"🎹 {title}")
    print("="*60 + "\n")

def call_gemini(prompt, system_prompt=None):
    """Llamada a Gemini API"""
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})
    
    response = client.chat.completions.create(
        model="gemini-2.5-flash",
        messages=messages,
        max_tokens=1500,
        temperature=0.7
    )
    return response.choices[0].message.content

# ============================================================
# DEMO 1: Prueba básica de conexión
# ============================================================
print_section("DEMO 1: Prueba de Conexión con Gemini")

response = call_gemini(
    "Responde en una línea: ¿Estás funcionando correctamente? Incluye un emoji de piano."
)
print(f"Respuesta: {response}")

# ============================================================
# DEMO 2: Generación de Email de Recordatorio
# ============================================================
print_section("DEMO 2: Generación de Email de Recordatorio")

email_prompt = """Genera un email de recordatorio de mantenimiento de piano para:

Cliente: María García López
Piano: Yamaha U3 (vertical)
Último servicio: Hace 8 meses (afinación)
Próximo servicio recomendado: Afinación

Requisitos:
- Tono profesional pero cercano
- Mencionar la importancia del mantenimiento regular
- Incluir llamada a la acción para agendar cita
- Máximo 150 palabras

Responde en formato JSON con "asunto" y "cuerpo"."""

email_response = call_gemini(
    email_prompt,
    system_prompt="Eres un asistente de comunicación para un técnico de pianos profesional en España."
)
print(email_response)

# ============================================================
# DEMO 3: Generación de Informe de Servicio
# ============================================================
print_section("DEMO 3: Generación de Informe de Servicio")

informe_prompt = """Genera un informe profesional de servicio basado en estas notas del técnico:

Piano: Steinway Model B (cola de 211cm)
Cliente: Conservatorio Municipal de Madrid
Fecha: 25 de diciembre de 2024
Tipo de servicio: Afinación completa + regulación parcial

Notas del técnico:
- Afinación a 442Hz según preferencia del cliente
- Detectado desgaste en martillos de la octava central
- Regulación de escape en notas graves (Do1-Sol2)
- Pedal de resonancia ajustado
- Recomendado cambio de fieltros en próxima visita

El informe debe incluir:
1. Resumen ejecutivo
2. Estado del instrumento
3. Trabajos realizados
4. Recomendaciones
5. Próximo mantenimiento sugerido"""

informe_response = call_gemini(
    informe_prompt,
    system_prompt="Eres un técnico de pianos senior con 20 años de experiencia. Redactas informes técnicos profesionales."
)
print(informe_response)

# ============================================================
# DEMO 4: Análisis de Cliente (Riesgo de Pérdida)
# ============================================================
print_section("DEMO 4: Análisis de Riesgo de Pérdida de Cliente")

analisis_prompt = """Analiza el riesgo de pérdida de este cliente y proporciona recomendaciones:

Datos del cliente:
- Nombre: Academia de Música Allegro
- Tipo: Escuela de música (cliente B2B)
- Antigüedad: 5 años como cliente
- Pianos registrados: 8 (6 verticales, 2 colas)
- Historial de servicios:
  * 2022: 12 servicios (afinaciones mensuales)
  * 2023: 8 servicios
  * 2024: 3 servicios (último hace 4 meses)
- Gasto total histórico: 8,500€
- Último contacto: Email sin respuesta hace 2 meses
- Notas: Mencionaron problemas de presupuesto en última visita

Proporciona:
1. Nivel de riesgo (bajo/medio/alto) con porcentaje
2. Factores de riesgo identificados
3. 3 acciones concretas para retener al cliente
4. Propuesta de valor personalizada

Responde en formato estructurado."""

analisis_response = call_gemini(
    analisis_prompt,
    system_prompt="Eres un experto en retención de clientes B2B del sector musical. Analizas datos y propones estrategias efectivas."
)
print(analisis_response)

# ============================================================
# DEMO 5: Sugerencia de Precios
# ============================================================
print_section("DEMO 5: Sugerencia Inteligente de Precios")

precios_prompt = """Como consultor de precios para servicios de piano en España, sugiere un precio para:

Servicio solicitado: Regulación completa de mecanismo
Piano: Bösendorfer 225 (cola de concierto)
Ubicación: Barcelona (zona alta)
Cliente: Pianista profesional (solista internacional)
Complejidad: Alta (piano de concierto, estándar exigente)
Tiempo estimado: 6-8 horas

Contexto de mercado:
- Afinación estándar en Barcelona: 80-120€
- Regulación básica: 150-250€
- El cliente ha pagado anteriormente 180€ por afinaciones premium

Proporciona:
1. Precio sugerido
2. Rango aceptable (mínimo-máximo)
3. Justificación del precio
4. Cómo presentar el presupuesto al cliente"""

precios_response = call_gemini(
    precios_prompt,
    system_prompt="Eres un consultor de negocios especializado en servicios de piano de alta gama en España."
)
print(precios_response)

# ============================================================
# DEMO 6: Asistente de Chat (Pregunta Técnica)
# ============================================================
print_section("DEMO 6: Asistente de Chat - Pregunta Técnica")

chat_prompt = """Un cliente me pregunta: "Mi piano Yamaha tiene algunas teclas que suenan más apagadas que otras, especialmente en la zona media. ¿Qué puede ser y cuánto costaría arreglarlo?"

Responde como si fueras el asistente de chat de Piano Emotion Manager, dando una respuesta útil y profesional que:
1. Explique las posibles causas
2. Sugiera un diagnóstico
3. Dé un rango de precios orientativo
4. Invite a agendar una visita"""

chat_response = call_gemini(
    chat_prompt,
    system_prompt="""Eres PianoBot, el asistente virtual de Piano Emotion Manager. 
Ayudas a técnicos de piano y sus clientes con información técnica y comercial.
Respondes de forma clara, profesional y en español.
Siempre sugieres agendar una visita para diagnóstico preciso."""
)
print(chat_response)

# ============================================================
# RESUMEN
# ============================================================
print_section("RESUMEN DE DEMOS COMPLETADAS")
print("""
✅ Demo 1: Prueba de conexión - Gemini funcionando correctamente
✅ Demo 2: Email de recordatorio - Generación automática de comunicaciones
✅ Demo 3: Informe de servicio - Documentación profesional automatizada
✅ Demo 4: Análisis de churn - Predicción de pérdida de clientes
✅ Demo 5: Sugerencia de precios - Pricing inteligente
✅ Demo 6: Asistente de chat - Respuestas técnicas automatizadas

Todas estas funcionalidades pueden integrarse en Piano Emotion Manager
usando el servicio de Gemini que ya está preparado en:
  server/_core/gemini.ts
""")
