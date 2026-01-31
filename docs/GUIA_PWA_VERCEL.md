# Guía de Despliegue PWA en Vercel

Esta guía te explica paso a paso cómo desplegar Piano Tech Manager como una Progressive Web App (PWA) en Vercel y vincular tu dominio personalizado.

## ¿Qué es una PWA?

Una PWA es una aplicación web que se comporta como una app nativa:
- Se puede instalar en el móvil/ordenador desde el navegador
- Funciona offline (con datos en caché)
- Aparece con su propio icono en el escritorio/launcher
- No requiere tiendas de aplicaciones (App Store/Google Play)

## Requisitos Previos

1. Cuenta en [GitHub](https://github.com) (gratuita)
2. Cuenta en [Vercel](https://vercel.com) (gratuita)
3. Acceso a la configuración DNS de tu dominio (pianoemotion.es)

---

## Paso 1: Subir el Código a GitHub

### 1.1 Crear Repositorio en GitHub

1. Ve a [github.com/new](https://github.com/new)
2. Nombre del repositorio: `piano-tech-manager`
3. Visibilidad: **Privado** (recomendado)
4. NO marques "Add a README file"
5. Haz clic en **Create repository**

### 1.2 Subir el Código

Desde la terminal en la carpeta del proyecto:

```bash
# Inicializar git (si no está inicializado)
git init

# Añadir todos los archivos
git add .

# Crear el primer commit
git commit -m "Initial commit - Piano Tech Manager"

# Conectar con GitHub (reemplaza TU_USUARIO)
git remote add origin https://github.com/TU_USUARIO/piano-tech-manager.git

# Subir el código
git branch -M main
git push -u origin main
```

---

## Paso 2: Crear Cuenta en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en **Sign Up**
3. Selecciona **Continue with GitHub**
4. Autoriza a Vercel a acceder a tu cuenta de GitHub

---

## Paso 3: Importar Proyecto en Vercel

### 3.1 Crear Nuevo Proyecto

1. En el dashboard de Vercel, haz clic en **Add New...** → **Project**
2. Selecciona **Import Git Repository**
3. Busca y selecciona `piano-tech-manager`
4. Haz clic en **Import**

### 3.2 Configurar el Proyecto

En la pantalla de configuración:

| Campo | Valor |
|-------|-------|
| **Project Name** | piano-tech-manager |
| **Framework Preset** | Other |
| **Root Directory** | ./ |
| **Build Command** | `npx expo export --platform web` |
| **Output Directory** | `dist` |
| **Install Command** | `pnpm install` |

### 3.3 Variables de Entorno (Opcional)

Si necesitas variables de entorno, añádelas en **Environment Variables**:
- No son necesarias para la versión básica con almacenamiento local

### 3.4 Desplegar

1. Haz clic en **Deploy**
2. Espera 2-3 minutos mientras se construye
3. Una vez completado, verás una URL como: `piano-tech-manager.vercel.app`

---

## Paso 4: Vincular tu Dominio (pianoemotion.es)

### 4.1 Añadir Dominio en Vercel

1. En tu proyecto de Vercel, ve a **Settings** → **Domains**
2. Escribe `pianoemotion.es` y haz clic en **Add**
3. Vercel te mostrará los registros DNS necesarios

### 4.2 Configurar DNS en tu Proveedor

Ve al panel de control de tu proveedor de dominio (donde compraste pianoemotion.es) y configura:

**Opción A: Usando registro A (recomendado)**

| Tipo | Nombre | Valor |
|------|--------|-------|
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |

**Opción B: Usando CNAME (si no puedes usar A)**

| Tipo | Nombre | Valor |
|------|--------|-------|
| CNAME | @ | cname.vercel-dns.com |
| CNAME | www | cname.vercel-dns.com |

### 4.3 Verificar Configuración

1. Vuelve a Vercel → Settings → Domains
2. Espera unos minutos (puede tardar hasta 48h, pero normalmente 5-30 min)
3. Verás un check verde cuando esté verificado
4. Vercel configurará automáticamente HTTPS/SSL

---

## Paso 5: Instalar la PWA

### En Móvil (iOS)

1. Abre Safari y ve a `pianoemotion.es`
2. Toca el botón de compartir (cuadrado con flecha)
3. Selecciona **Añadir a pantalla de inicio**
4. Ponle nombre y confirma

### En Móvil (Android)

1. Abre Chrome y ve a `pianoemotion.es`
2. Toca el menú (tres puntos)
3. Selecciona **Instalar aplicación** o **Añadir a pantalla de inicio**
4. Confirma la instalación

### En Ordenador (Chrome/Edge)

1. Abre el navegador y ve a `pianoemotion.es`
2. En la barra de direcciones aparecerá un icono de instalación
3. Haz clic y selecciona **Instalar**
4. La app aparecerá en tu escritorio/menú de aplicaciones

---

## Actualizaciones Futuras

Cuando quieras actualizar la aplicación:

```bash
# Hacer cambios en el código
# ...

# Guardar cambios
git add .
git commit -m "Descripción de los cambios"

# Subir a GitHub
git push

# Vercel desplegará automáticamente
```

Vercel detectará los cambios en GitHub y desplegará automáticamente la nueva versión.

---

## Solución de Problemas

### El dominio no funciona

- Verifica que los DNS estén correctamente configurados
- Espera hasta 48 horas para la propagación DNS
- Usa [dnschecker.org](https://dnschecker.org) para verificar la propagación

### Error en el build

- Revisa los logs en Vercel → Deployments → Ver deployment fallido
- Asegúrate de que el Build Command sea correcto: `npx expo export --platform web`

### La PWA no se puede instalar

- Asegúrate de acceder por HTTPS (no HTTP)
- Verifica que el manifest.json esté accesible en `/manifest.json`
- Prueba en modo incógnito para descartar caché

---

## Costes

| Servicio | Coste |
|----------|-------|
| Vercel (Hobby) | Gratis |
| GitHub (Free) | Gratis |
| Dominio .es | ~10-15€/año |
| **Total** | **~10-15€/año** |

---

## Soporte

Si tienes problemas con el despliegue, puedes:
1. Consultar la [documentación de Vercel](https://vercel.com/docs)
2. Consultar la [documentación de Expo Web](https://docs.expo.dev/workflow/web/)
