# Análisis de Costes, Precios y Modelo de Negocio: Piano Emotion Manager

**Fecha:** 24 de diciembre de 2025
**Autor:** Manus AI

## 1. Resumen Ejecutivo

Este documento detalla la estructura de costes, el modelo de precios y los márgenes de beneficio para la aplicación **Piano Emotion Manager**. El análisis cubre los dos modelos de negocio principales:

1.  **Modelo SaaS para Usuarios Finales (Técnicos):** Un modelo de suscripción directa para técnicos de pianos individuales y empresas, con diferentes niveles de servicio.
2.  **Modelo IaaS para Distribuidores y Fabricantes:** Un modelo de "Infraestructura como Servicio" donde el distribuidor o fabricante asume los costes de infraestructura y paga una licencia de software.

El objetivo es establecer una estrategia de precios sostenible que cubra los costes operativos, garantice un margen de beneficio saludable para Piano Emotion y ofrezca un valor claro a cada segmento de clientes.

---

## 2. Modelo de Precios para Usuarios Finales (Técnicos)

Este modelo se basa en un sistema de suscripción freemium con cinco niveles diseñados para adaptarse a las necesidades de diferentes perfiles de técnicos.

### 2.1. Planes de Suscripción

A continuación se presenta una tabla resumen de los planes definidos:

| Plan | Precio Mensual | Precio Anual (-17%) | Límites (WA/Email) | Público Objetivo |
| :--- | :--- | :--- | :--- | :--- |
| **Gratuito** | 0€ | 0€ | N/A | Técnicos que inician o uso básico |
| **Profesional Básico** | 9,99€ | 99€ | 50 WA + 100 Emails | Técnicos independientes |
| **Profesional Avanzado** | 14,99€ | 149€ | 100 WA + 200 Emails | Técnicos con alto volumen |
| **Empresa Básico** | 9,99€ + 5€/técnico | 99€ + 50€/técnico | 50 WA + 100 Emails (por técnico) | Equipos de técnicos |
| **Empresa Avanzado** | 14,99€ + 7€/técnico | 149€ + 70€/técnico | 100 WA + 200 Emails (por técnico) | Equipos con alto volumen |

### 2.2. Análisis de Costes por Usuario

Los costes directos variables por usuario se derivan principalmente del uso de las APIs de WhatsApp Business y de correo electrónico.

- **Coste por mensaje de WhatsApp:** 0,04€
- **Coste por Email:** 0,001€

#### 2.2.1. Coste por Usuario - Nivel Básico
- **Coste WhatsApp:** 50 mensajes/mes * 0,04 €/mensaje = 2,00 €
- **Coste Email:** 100 emails/mes * 0,001 €/email = 0,10 €
- **Coste Directo Total (Básico):** 2,10 €/mes por usuario

#### 2.2.2. Coste por Usuario - Nivel Avanzado
- **Coste WhatsApp:** 100 mensajes/mes * 0,04 €/mensaje = 4,00 €
- **Coste Email:** 200 emails/mes * 0,001 €/email = 0,20 €
- **Coste Directo Total (Avanzado):** 4,20 €/mes por usuario

### 2.3. Cálculo de Precios y Márgenes

El objetivo es mantener un **margen de beneficio bruto del 35%** sobre los costes directos para Piano Emotion. El precio final se calcula con la fórmula: `Precio = Coste / (1 - Margen)`.

#### 2.3.1. Plan Profesional Básico (9,99€/mes)
- **Precio Mínimo (con 35% margen):** 2,10 € / (1 - 0,35) = 3,23 €
- **Precio Final Establecido:** 9,99 €
- **Beneficio Bruto por Usuario:** 9,99 € - 2,10 € = **7,89 €/mes**
- **Margen Bruto Real:** (7,89 € / 9,99 €) * 100 = **79%**

#### 2.3.2. Plan Profesional Avanzado (14,99€/mes)
- **Precio Mínimo (con 35% margen):** 4,20 € / (1 - 0,35) = 6,46 €
- **Precio Final Establecido:** 14,99 €
- **Beneficio Bruto por Usuario:** 14,99 € - 4,20 € = **10,79 €/mes**
- **Margen Bruto Real:** (10,79 € / 14,99 €) * 100 = **72%**

#### 2.3.3. Planes de Empresa
Los planes de empresa aplican un coste adicional por técnico que también respeta los márgenes.

- **Empresa Básico (+5€/técnico):** El coste por técnico es de 2,10€. El beneficio adicional es de 2,90€ por técnico, resultando en un margen del 58% sobre el añadido.
- **Empresa Avanzado (+7€/técnico):** El coste por técnico es de 4,20€. El beneficio adicional es de 2,80€ por técnico, resultando en un margen del 40% sobre el añadido.

**Conclusión:** Los precios establecidos superan ampliamente el objetivo de margen del 35%, proporcionando un modelo de negocio robusto que puede absorber costes indirectos (soporte, mantenimiento, marketing) y generar un beneficio neto saludable.

---

## 3. Modelo para Distribuidores y Fabricantes (IaaS)

Este modelo (referido como "Modelo 3") está diseñado para grandes cuentas que desean ofrecer la aplicación como un valor añadido a su red de técnicos, posiblemente bajo su propia marca (white-label).

### 3.1. Estructura del Modelo

En este escenario, el distribuidor/fabricante paga directamente los costes de infraestructura a los proveedores correspondientes (Vercel, TiDB, Meta, SendGrid, etc.). Piano Emotion Manager cobra únicamente por el software y los servicios asociados.

| Concepto | Precio | Frecuencia | Notas |
| :--- | :--- | :--- | :--- |
| **Setup Inicial** | 500€ - 1.000€ | Pago Único | Incluye configuración de la instancia, personalización básica y formación. |
| **Licencia de Software** | 99€ - 199€ | Mensual | Da acceso a la aplicación y sus funcionalidades base. |
| **Soporte y Actualizaciones** | Incluido | N/A | Incluido en la licencia mensual. |
| **Costes de Infraestructura** | Variable | Mensual | Pagado directamente por el cliente a los proveedores (Vercel, TiDB, etc.). |
| **Funcionalidades de IA** | Opcional | Bajo Demanda | Se cotiza como un add-on separado según las necesidades. |

### 3.2. Beneficios para Piano Emotion

Este modelo de negocio presenta un **riesgo financiero nulo** para Piano Emotion en cuanto a costes variables, ya que son asumidos por el cliente. El beneficio es directo y se basa en los ingresos por la licencia y el setup inicial.

- **Ingreso Mensual Recurrente (MRR):** 99€ - 199€ por cliente.
- **Ingreso Único:** 500€ - 1.000€ por cliente.

Este modelo es altamente escalable y rentable, ya que el coste de mantenimiento por cada nueva instancia de distribuidor es marginal.

---

## 4. Funcionalidades Incluidas por Plan

A continuación se desglosan las funcionalidades clave para cada nivel de suscripción.

### Plan Gratuito
- **Gestión Completa:** Clientes y pianos ilimitados.
- **Organización:** Agenda, calendario y gestión de servicios.
- **Finanzas:** Facturación básica.
- **Recursos:** Acceso a Piano Emotion Store.
- **Historial:** Registro de todas las intervenciones.

### Planes Profesionales (Básico y Avanzado)
Añaden sobre el plan Gratuito:
- **Comunicaciones:** Integración con WhatsApp Business y Email.
- **Automatización:** Recordatorios automáticos, confirmaciones de cita y marketing básico.
- **Soporte:** Prioritario (Básico) y Premium (Avanzado).
- **Capacidad:** El plan Avanzado duplica la capacidad de mensajes y ofrece plantillas ilimitadas y campañas avanzadas.

### Planes de Empresa (Básico y Avanzado)
Añaden sobre los planes Profesionales:
- **Gestión de Equipos:** Panel de administración, asignación de clientes y reportes de equipo.
- **Multi-técnico:** Permite añadir múltiples usuarios bajo una misma cuenta.
- **Capacidad por Técnico:** Los límites de mensajes se aplican a cada técnico de la cuenta.
- **Estadísticas Avanzadas:** El plan Avanzado ofrece analíticas detalladas por técnico.
