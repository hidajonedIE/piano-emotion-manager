# Manual de Usuario

## Piano Emotion Manager

---

## Índice

1. [Introducción](#introducción)
2. [Dashboard Principal](#dashboard-principal)
3. [Gestión de Clientes](#gestión-de-clientes)
4. [Gestión de Pianos](#gestión-de-pianos)
5. [Registro de Servicios](#registro-de-servicios)
6. [Agenda y Calendario](#agenda-y-calendario)
7. [Inventario de Materiales](#inventario-de-materiales)
8. [Proveedores](#proveedores)
9. [Facturación](#facturación)
10. [Tarifas](#tarifas)
11. [Datos Fiscales](#datos-fiscales)
12. [Configuración](#configuración)
13. [Copias de Seguridad](#copias-de-seguridad)

---

## Introducción

Piano Emotion Manager es una aplicación diseñada para ayudarte a gestionar todos los aspectos de tu trabajo como técnico de piano. Esta guía te explicará cómo utilizar cada función de la aplicación para sacarle el máximo partido.

La aplicación está organizada en módulos accesibles desde el Dashboard principal y la barra de navegación inferior. Cada módulo está diseñado para ser intuitivo y fácil de usar, pero esta guía te proporcionará información detallada sobre todas las opciones disponibles.

---

## Dashboard Principal

El Dashboard es la pantalla de inicio de Piano Emotion Manager. Desde aquí tienes una visión general de tu actividad y acceso rápido a todas las funciones.

### Cabecera

En la parte superior encontrarás el nombre de la aplicación junto con la fecha actual. Esta cabecera te ayuda a orientarte rápidamente.

### Acciones Rápidas

Esta sección contiene botones para las acciones más frecuentes:

| Acción | Descripción |
|--------|-------------|
| **Nuevo Cliente** | Abre el formulario para registrar un nuevo cliente |
| **Nuevo Piano** | Permite añadir un piano (primero debes tener al menos un cliente) |
| **Nuevo Servicio** | Registra una afinación, reparación u otro servicio |
| **Nueva Cita** | Programa una cita en tu agenda |

### Este Mes

Muestra un resumen de tu actividad del mes actual:

| Estadística | Significado |
|-------------|-------------|
| **Servicios** | Número total de servicios realizados este mes |
| **Ingresos** | Suma de los importes de todos los servicios del mes |

### Módulos

Acceso directo a todas las secciones de la aplicación: Clientes, Pianos, Servicios, Agenda, Inventario, Proveedores, Facturas, Tarifas, Datos Fiscales y Configuración.

### Últimos Servicios

Lista de los servicios más recientes que has registrado, ordenados por fecha. Toca cualquier servicio para ver sus detalles.

---

## Gestión de Clientes

La sección de Clientes te permite mantener un registro organizado de todas las personas para las que trabajas.

### Ver Lista de Clientes

Accede a la pestaña **Clientes** en la barra de navegación inferior. Verás una lista de todos tus clientes ordenados alfabéticamente.

### Añadir un Nuevo Cliente

1. Toca el botón **+** o **Nuevo Cliente**
2. Completa el formulario con los datos del cliente:

| Campo | Descripción | Obligatorio |
|-------|-------------|-------------|
| **Nombre** | Nombre completo del cliente | Sí |
| **Teléfono** | Número de contacto principal | Recomendado |
| **Email** | Correo electrónico | Opcional |
| **Dirección** | Dirección postal completa | Recomendado |
| **Notas** | Observaciones adicionales | Opcional |

3. Toca **Guardar** para registrar el cliente

### Editar un Cliente

1. Toca sobre el cliente en la lista
2. Se abrirá la ficha del cliente con todos sus datos
3. Toca **Editar** para modificar la información
4. Realiza los cambios necesarios
5. Toca **Guardar** para confirmar

### Eliminar un Cliente

1. Abre la ficha del cliente
2. Toca **Eliminar** (generalmente en la parte inferior)
3. Confirma la eliminación

> **Importante:** Al eliminar un cliente, también se eliminarán todos sus pianos y servicios asociados. Esta acción no se puede deshacer.

### Ver Pianos de un Cliente

Desde la ficha de cada cliente, puedes ver la lista de pianos que tiene registrados y acceder directamente a ellos.

---

## Gestión de Pianos

La sección de Pianos te permite registrar información detallada de cada instrumento.

### Ver Lista de Pianos

Accede a la pestaña **Pianos** en la barra de navegación inferior. Verás todos los pianos registrados con información básica de cada uno.

### Indicadores de Estado

Los pianos pueden mostrar indicadores visuales según su estado:

| Indicador | Significado |
|-----------|-------------|
| 🔴 **Rojo** | Piano que requiere atención urgente |
| 🟡 **Amarillo** | Piano con mantenimiento próximo |
| 🟢 **Verde** | Piano en buen estado |

### Añadir un Nuevo Piano

1. Toca el botón **+** o **Nuevo Piano**
2. Completa el formulario:

| Campo | Descripción | Obligatorio |
|-------|-------------|-------------|
| **Cliente** | Propietario del piano | Sí |
| **Marca** | Fabricante (Yamaha, Steinway, etc.) | Sí |
| **Modelo** | Modelo específico | Recomendado |
| **Número de Serie** | Identificador único del piano | Recomendado |
| **Tipo** | Vertical, Cola, Gran Cola | Sí |
| **Año de Fabricación** | Año aproximado | Opcional |
| **Ubicación** | Dónde está el piano (salón, estudio, etc.) | Opcional |
| **Notas** | Observaciones técnicas | Opcional |

3. Toca **Guardar** para registrar el piano

### Historial de Servicios

Desde la ficha de cada piano, puedes ver el historial completo de todos los servicios realizados en ese instrumento, lo que te permite hacer un seguimiento detallado de su mantenimiento.

---

## Registro de Servicios

Los servicios son el núcleo de tu actividad. Aquí registras cada afinación, reparación o mantenimiento que realizas.

### Ver Lista de Servicios

Accede a la pestaña **Servicios** en la barra de navegación inferior. Los servicios se muestran ordenados por fecha, del más reciente al más antiguo.

### Tipos de Servicio

Piano Emotion Manager incluye los tipos de servicio más comunes:

| Tipo | Descripción |
|------|-------------|
| **Afinación** | Ajuste de la tensión de las cuerdas |
| **Regulación** | Ajuste del mecanismo del teclado |
| **Entonación** | Ajuste del timbre de los martillos |
| **Reparación** | Arreglo de componentes dañados |
| **Mantenimiento** | Revisión general y limpieza |
| **Otro** | Cualquier otro tipo de servicio |

### Registrar un Nuevo Servicio

1. Toca el botón **+** o **Nuevo Servicio**
2. Completa el formulario:

| Campo | Descripción | Obligatorio |
|-------|-------------|-------------|
| **Piano** | Selecciona el piano atendido | Sí |
| **Tipo de Servicio** | Afinación, Reparación, etc. | Sí |
| **Fecha** | Fecha en que se realizó el servicio | Sí |
| **Precio** | Importe cobrado | Recomendado |
| **Observaciones** | Detalles técnicos, problemas encontrados, etc. | Recomendado |

3. Toca **Guardar** para registrar el servicio

### Consejos para las Observaciones

Las observaciones son muy valiosas para el seguimiento a largo plazo. Te recomendamos incluir:

- Estado general del piano al llegar
- Problemas detectados durante el servicio
- Trabajos realizados
- Recomendaciones para el cliente
- Próximo mantenimiento sugerido

---

## Agenda y Calendario

La Agenda te ayuda a organizar tus citas y planificar tu trabajo.

### Ver la Agenda

Accede a la pestaña **Agenda** en la barra de navegación inferior. Verás un calendario con tus citas programadas.

### Vistas Disponibles

| Vista | Descripción |
|-------|-------------|
| **Día** | Detalle de las citas de un día específico |
| **Semana** | Vista semanal con todas las citas |
| **Mes** | Calendario mensual con indicadores de días con citas |

### Programar una Nueva Cita

1. Toca el botón **+** o **Nueva Cita**
2. Completa los datos:

| Campo | Descripción | Obligatorio |
|-------|-------------|-------------|
| **Cliente** | Cliente de la cita | Sí |
| **Piano** | Piano a atender (opcional) | Opcional |
| **Fecha** | Día de la cita | Sí |
| **Hora** | Hora de inicio | Sí |
| **Tipo de Servicio** | Servicio previsto | Recomendado |
| **Notas** | Información adicional | Opcional |

3. Toca **Guardar** para programar la cita

### Convertir Cita en Servicio

Una vez realizada la cita, puedes convertirla fácilmente en un servicio registrado:

1. Abre la cita completada
2. Toca **Registrar Servicio**
3. Los datos se rellenarán automáticamente
4. Añade el precio y las observaciones
5. Guarda el servicio

---

## Inventario de Materiales

El módulo de Inventario te permite controlar tu stock de materiales y recambios.

### Ver Inventario

Accede a **Módulos → Inventario** desde el Dashboard. Verás la lista de todos los materiales registrados.

### Categorías de Materiales

| Categoría | Ejemplos |
|-----------|----------|
| **Cuerdas** | Cuerdas de diferentes calibres |
| **Martillos** | Cabezas de martillo, vástagos |
| **Fieltros** | Fieltros de apagadores, de teclas |
| **Herramientas** | Llaves de afinar, destornilladores |
| **Otros** | Lubricantes, limpiadores, etc. |

### Añadir Material

1. Toca **+** o **Nuevo Material**
2. Completa la información:

| Campo | Descripción |
|-------|-------------|
| **Nombre** | Nombre descriptivo del material |
| **Categoría** | Tipo de material |
| **Cantidad** | Unidades en stock |
| **Stock Mínimo** | Cantidad mínima recomendada |
| **Proveedor** | Proveedor habitual (opcional) |
| **Notas** | Información adicional |

3. Guarda el material

### Alertas de Stock Bajo

Cuando un material está por debajo del stock mínimo configurado, aparecerá una alerta en el Dashboard para recordarte que debes reponerlo.

---

## Proveedores

Mantén un registro de tus proveedores de materiales y servicios.

### Ver Proveedores

Accede a **Módulos → Proveedores** desde el Dashboard.

### Añadir Proveedor

1. Toca **+** o **Nuevo Proveedor**
2. Introduce los datos:

| Campo | Descripción |
|-------|-------------|
| **Nombre** | Nombre de la empresa |
| **Contacto** | Persona de contacto |
| **Teléfono** | Número de teléfono |
| **Email** | Correo electrónico |
| **Web** | Página web |
| **Dirección** | Dirección postal |
| **Notas** | Condiciones, descuentos, etc. |

3. Guarda el proveedor

---

## Facturación

El módulo de Facturas te permite generar documentos profesionales para tus clientes.

### Crear una Factura

1. Accede a **Módulos → Facturas**
2. Toca **Nueva Factura**
3. Selecciona el cliente
4. Añade los servicios a facturar
5. Revisa los totales
6. Guarda o exporta la factura

### Datos de la Factura

La factura incluirá automáticamente tus datos fiscales (configurados en Datos Fiscales) y los datos del cliente.

---

## Tarifas

Define tus precios estándar para cada tipo de servicio.

### Configurar Tarifas

1. Accede a **Módulos → Tarifas**
2. Verás la lista de tipos de servicio
3. Toca cada uno para establecer el precio
4. Guarda los cambios

Las tarifas configuradas se sugerirán automáticamente al registrar nuevos servicios.

---

## Datos Fiscales

Configura tu información fiscal para las facturas.

### Información Requerida

| Campo | Descripción |
|-------|-------------|
| **Nombre/Razón Social** | Tu nombre o el de tu empresa |
| **NIF/CIF** | Número de identificación fiscal |
| **Dirección** | Dirección fiscal completa |
| **Código Postal** | CP de tu dirección |
| **Ciudad** | Localidad |
| **Provincia** | Provincia |
| **Teléfono** | Teléfono de contacto |
| **Email** | Email de facturación |

---

## Configuración

Accede a los ajustes generales de la aplicación.

### Opciones Disponibles

| Opción | Descripción |
|--------|-------------|
| **Ayuda** | Acceso a este manual dentro de la app |
| **Copia de Seguridad** | Exportar e importar datos |
| **Acerca de** | Información de la versión |

---

## Copias de Seguridad

Protege tus datos creando copias de seguridad periódicas.

### Crear una Copia de Seguridad

1. Accede a **Configuración → Copia de Seguridad**
2. Toca **Exportar Datos**
3. Se generará un archivo con todos tus datos
4. Guarda el archivo en un lugar seguro (nube, ordenador, etc.)

### Restaurar una Copia de Seguridad

1. Accede a **Configuración → Copia de Seguridad**
2. Toca **Importar Datos**
3. Selecciona el archivo de copia de seguridad
4. Confirma la restauración

> **Importante:** Al restaurar una copia de seguridad, los datos actuales serán reemplazados por los de la copia.

### Recomendaciones

- Crea una copia de seguridad al menos una vez por semana
- Guarda las copias en un lugar diferente a tu dispositivo (nube, email, ordenador)
- Antes de actualizar la app o cambiar de dispositivo, crea una copia de seguridad

---

## Atajos y Gestos

### Gestos Táctiles

| Gesto | Acción |
|-------|--------|
| **Deslizar hacia abajo** | Actualizar la lista (pull-to-refresh) |
| **Tocar elemento** | Ver detalles |
| **Mantener pulsado** | Opciones adicionales (en algunos elementos) |

### Navegación

La barra inferior te permite moverte rápidamente entre las secciones principales: Inicio, Clientes, Pianos, Servicios y Agenda.

---

## Consejos de Uso

1. **Registra los servicios el mismo día**: Así no olvidarás detalles importantes.

2. **Usa las notas**: Las observaciones en clientes, pianos y servicios son muy valiosas para el seguimiento.

3. **Configura las tarifas**: Te ahorrará tiempo al registrar servicios.

4. **Haz copias de seguridad**: Protege tu trabajo creando copias regularmente.

5. **Revisa el Dashboard**: El resumen mensual te ayuda a tener una visión clara de tu actividad.

---

*Piano Emotion Manager - Tu asistente profesional*

*Versión 1.0 | Diciembre 2024*
