
# 🎹 Guía de Usuario: Sistema Multi-Tenant

**Autor:** Manus AI  
**Fecha:** 5 de enero de 2026

## Introducción

Esta guía describe las nuevas funcionalidades del sistema multi-tenant de **Piano Emotion Manager**, diseñadas para administradores y nuevos partners. Aprenderás a registrar una nueva empresa (partner) y a gestionar todos los partners del sistema desde el panel de administración.

---

## 🚀 Registro de un Nuevo Partner (Onboarding)

El flujo de onboarding permite a los nuevos usuarios registrar su empresa como un partner en el sistema. Este proceso se inicia automáticamente después de crear una nueva cuenta en Piano Emotion Manager si el usuario no está asociado a ningún partner existente.

El proceso consta de 3 pasos principales, precedidos por una pantalla de bienvenida.

### 1. Pantalla de Bienvenida

Al iniciar el proceso, verás una pantalla que resume los pasos para configurar tu espacio de trabajo.

- **Resumen de Pasos:** Se muestran los 3 pasos del proceso (Información Básica, Personalización, Configuración).
- **Botón "Comenzar":** Inicia el flujo de registro.
- **Opción "Omitir por ahora":** Permite saltar el proceso y volver más tarde.

`[SCREENSHOT: Pantalla de bienvenida del onboarding]`

### 2. Paso 1: Información Básica

En este paso, proporcionarás la información fundamental de tu empresa.

- **Nombre de la Empresa:** El nombre legal o comercial de tu empresa.
- **Identificador Único (Slug):** Una URL corta y única para tu empresa (ej. `mi-empresa`). Se genera automáticamente a partir del nombre, pero puedes personalizarlo. El sistema verifica su disponibilidad en tiempo real.
- **Email Principal:** El email de contacto principal de la empresa.
- **Email de Soporte (Opcional):** Un email específico para que tus clientes contacten para soporte.
- **Teléfono de Soporte (Opcional):** Un número de teléfono de soporte.

`[SCREENSHOT: Pantalla del Paso 1 del onboarding con validaciones de slug y email]`

### 3. Paso 2: Personalización (Branding)

Aquí puedes personalizar la apariencia de la aplicación para que coincida con la identidad de tu marca.

- **Nombre de Marca (Opcional):** Si tu marca tiene un nombre diferente al de la empresa.
- **Paleta de Colores Predefinida:** Elige una de las paletas de colores sugeridas para una configuración rápida.
- **Color Primario y Secundario:** Personaliza los colores exactos de tu marca usando códigos hexadecimales (ej. `#3b82f6`).
- **Vista Previa:** Una vista previa en tiempo real te muestra cómo se verán los colores en la interfaz.

`[SCREENSHOT: Pantalla del Paso 2 del onboarding con selección de colores y vista previa]`

### 4. Paso 3: Configuración

En el último paso, ajustarás las configuraciones iniciales del sistema.

- **Múltiples Proveedores:** Activa si trabajas con más de un proveedor de pianos o repuestos.
- **E-commerce:** Habilita una tienda online para que tus clientes compren productos o servicios.
- **Pedidos Automáticos:** Permite que el sistema genere pedidos a proveedores automáticamente cuando el stock de un producto es bajo.
  - **Umbral de Stock Mínimo:** Si activas los pedidos automáticos, define la cantidad mínima de stock para que se genere un pedido.
- **Email de Notificaciones (Opcional):** El email donde recibirás alertas del sistema.

`[SCREENSHOT: Pantalla del Paso 3 del onboarding con switches de configuración]`

### 5. Pantalla de Éxito

¡Felicidades! Una vez completado el registro, verás una pantalla de confirmación.

- **Mensaje de Bienvenida:** Confirmación de que tu espacio de trabajo está listo.
- **Próximos Pasos Sugeridos:** Recomendaciones para empezar a usar la aplicación.
- **Botón "Ir al Panel de Control":** Accede a la aplicación.

`[SCREENSHOT: Pantalla de éxito del onboarding con próximos pasos]`

---

## ⚙️ Administración de Partners

El panel de administración, accesible solo para usuarios con rol de administrador, permite gestionar todos los partners del sistema. Desde aquí puedes ver, editar, crear y gestionar los usuarios de cada partner.

### 1. Lista de Partners

Esta es la pantalla principal del panel de administración de partners.

- **Acceso:** `/admin/partners`
- **Funcionalidades:**
  - **Lista Paginada:** Muestra todos los partners registrados.
  - **Búsqueda:** Busca partners por nombre, email o slug.
  - **Filtros:** Filtra la lista por estado (Activo, Inactivo, Suspendido).
  - **Estadísticas Rápidas:** Muestra el número de usuarios y clientes por partner.
  - **Crear Partner:** Un botón flotante permite crear un nuevo partner manualmente.

`[SCREENSHOT: Pantalla de lista de partners con filtros y búsqueda]`

### 2. Detalles y Edición de Partner

Al seleccionar un partner de la lista, accedes a su pantalla de detalles, donde puedes ver y modificar toda su información.

- **Acceso:** `/admin/partners/[id]`
- **Funcionalidades:**
  - **Visualización y Edición:** Permite ver y editar la información del partner.
  - **Configuración de Branding:** Cambia el logo, los colores y el nombre de la marca.
  - **Cambio de Estado:** Activa, inactiva o suspende un partner con una confirmación.
  - **Estadísticas Detalladas:** Muestra un resumen completo de usuarios, clientes, pianos y servicios asociados al partner.

`[SCREENSHOT: Pantalla de detalles de un partner con modo edición activado]`

### 3. Gestión de Usuarios por Partner

Esta pantalla permite administrar los usuarios asociados a un partner específico.

- **Acceso:** `/admin/partners/[id]/users`
- **Funcionalidades:**
  - **Lista de Usuarios:** Muestra todos los usuarios del partner.
  - **Agregar Usuario:** Añade un nuevo usuario al partner mediante su email.
  - **Editar Permisos:** Asigna roles (`Admin`, `User`) y permisos específicos a cada usuario.
  - **Remover Usuario:** Elimina un usuario del partner (con confirmación).
  - **Roles y Permisos:**
    - **Owner:** Propietario del partner (no se puede editar ni eliminar).
    - **Admin:** Acceso completo a la gestión del partner.
    - **User:** Acceso limitado según los permisos asignados.

`[SCREENSHOT: Pantalla de gestión de usuarios de un partner con modal de edición de permisos]`

---
