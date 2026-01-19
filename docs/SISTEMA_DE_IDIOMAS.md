# Documentación del Sistema de Idiomas

## 1. Arquitectura General

El sistema de internacionalización (i18n) de Piano Emotion Manager está diseñado para ser robusto, escalable y fácil de mantener. Se basa en una arquitectura cliente-servidor que permite una gestión centralizada de los idiomas y una experiencia de usuario fluida.

### 1.1. Componentes Principales

- **Cliente (React Native / Expo)**: Gestiona la presentación de los idiomas al usuario y la interacción con el sistema de i18n.
- **Servidor (tRPC)**: Controla la lógica de negocio, la gestión de idiomas por partner y la persistencia de las preferencias de usuario.
- **Base de Datos (TiDB)**: Almacena la configuración de idiomas por partner y las preferencias de usuario.

### 1.2. Flujo de Datos

1.  El cliente solicita los idiomas disponibles al servidor.
2.  El servidor obtiene la configuración de idiomas del partner actual de la base de datos.
3.  El servidor devuelve la lista de idiomas permitidos al cliente.
4.  El cliente muestra los idiomas disponibles en el selector de idiomas.
5.  El usuario selecciona un idioma.
6.  El cliente guarda la preferencia de idioma localmente (AsyncStorage) y la envía al servidor.
7.  El servidor guarda la preferencia de idioma del usuario en la base de datos.

## 2. Gestión de Idiomas

### 2.1. Añadir un Nuevo Idioma

Para añadir un nuevo idioma, sigue estos pasos:

1.  **Crear el archivo de traducción**: Crea un nuevo archivo `translations.json` en el directorio `locales/<código_idioma>/`.
2.  **Añadir el idioma al cliente**: Añade el nuevo idioma al array `supportedLanguages` en `locales/index.ts`.
3.  **Añadir el idioma al servidor**: Añade el nuevo idioma al array `SUPPORTED_LANGUAGES` y al objeto `LANGUAGE_INFO` en `server/routers/language.router.ts`.

### 2.2. Configurar Idiomas por Partner

Cada partner puede tener su propia configuración de idiomas. Esto se gestiona a través de la tabla `partner_settings` en la base de datos.

- **`supportedLanguages`**: Un array JSON que contiene los códigos de los idiomas permitidos. Si es `NULL`, se permiten todos los idiomas.
- **`defaultLanguage`**: El idioma por defecto para el partner.

### 2.3. Panel de Administración de Idiomas

Se ha creado un nuevo panel de administración en `/settings/languages` que permite a los administradores de partners gestionar los idiomas disponibles para su organización.

## 3. Traducciones

### 3.1. Archivos de Traducción

Los archivos de traducción se encuentran en el directorio `locales/`. Cada idioma tiene su propio directorio con un archivo `translations.json`.

### 3.2. Validación de Traducciones

Se ha creado un script de validación en `scripts/validate_translations.ts` que comprueba la consistencia de las claves de traducción entre los diferentes idiomas. Para ejecutarlo, usa el siguiente comando:

```bash
tsx scripts/validate_translations.ts
```

## 4. Próximos Pasos

- **Completar las traducciones faltantes**: Es prioritario completar las traducciones faltantes en todos los idiomas.
- **Automatizar la validación**: Se recomienda integrar el script de validación en el proceso de CI/CD para asegurar la consistencia de las traducciones de forma automática.
- **Mejorar el panel de administración**: Se pueden añadir más funcionalidades al panel de administración, como la posibilidad de editar las traducciones directamente desde la interfaz.
