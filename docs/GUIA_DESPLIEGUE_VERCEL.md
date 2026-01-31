# Guía de Despliegue en Vercel - Piano Tech Manager

Esta guía detalla el proceso completo para desplegar la aplicación Piano Tech Manager en Vercel, permitiendo el acceso desde cualquier dispositivo (móvil, tablet u ordenador) con sincronización de datos en la nube.

---

## Requisitos Previos

Antes de comenzar, necesitas:

| Requisito | Descripción | Coste |
|-----------|-------------|-------|
| Cuenta de Vercel | Plataforma de hosting | Gratis (plan Hobby) |
| Cuenta de GitHub | Para conectar el repositorio | Gratis |
| Base de datos MySQL | Para sincronización de datos | Incluida en Manus o externa |
| Dominio personalizado (opcional) | Tu propio dominio web | ~10-15€/año |

---

## Paso 1: Preparar el Repositorio en GitHub

### 1.1 Crear cuenta en GitHub (si no tienes)

1. Ve a [github.com](https://github.com)
2. Haz clic en "Sign up"
3. Completa el registro con tu email

### 1.2 Crear un nuevo repositorio

1. En GitHub, haz clic en el botón **"+"** (esquina superior derecha)
2. Selecciona **"New repository"**
3. Configura el repositorio:
   - **Nombre**: `piano-tech-manager`
   - **Visibilidad**: Private (recomendado)
   - **NO** marques "Add a README file"
4. Haz clic en **"Create repository"**

### 1.3 Subir el código al repositorio

Desde la terminal de tu ordenador, ejecuta estos comandos:

```bash
# Clonar el proyecto desde Manus (descarga los archivos)
# O si ya tienes los archivos descargados, navega a la carpeta

cd piano_tech_app

# Inicializar Git
git init

# Añadir todos los archivos
git add .

# Crear el primer commit
git commit -m "Initial commit - Piano Tech Manager"

# Conectar con tu repositorio de GitHub
git remote add origin https://github.com/TU_USUARIO/piano-tech-manager.git

# Subir el código
git branch -M main
git push -u origin main
```

---

## Paso 2: Crear Cuenta en Vercel

### 2.1 Registro

1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en **"Sign Up"**
3. Selecciona **"Continue with GitHub"** (recomendado)
4. Autoriza a Vercel para acceder a tu cuenta de GitHub

### 2.2 Verificar el email

Vercel enviará un email de verificación. Haz clic en el enlace para confirmar tu cuenta.

---

## Paso 3: Desplegar la Aplicación

### 3.1 Importar el proyecto

1. En el dashboard de Vercel, haz clic en **"Add New..."** → **"Project"**
2. Busca tu repositorio `piano-tech-manager` en la lista
3. Haz clic en **"Import"**

### 3.2 Configurar el proyecto

En la pantalla de configuración:

| Campo | Valor |
|-------|-------|
| **Project Name** | piano-tech-manager |
| **Framework Preset** | Other |
| **Root Directory** | ./ |
| **Build Command** | `pnpm build` |
| **Output Directory** | `dist` |
| **Install Command** | `pnpm install` |

### 3.3 Configurar Variables de Entorno

Haz clic en **"Environment Variables"** y añade las siguientes:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | URL de conexión a MySQL | `mysql://user:pass@host:3306/db` |
| `SESSION_SECRET` | Clave secreta para sesiones | Una cadena aleatoria de 32+ caracteres |
| `OWNER_OPEN_ID` | Tu ID de usuario Manus | Se obtiene al iniciar sesión |

Para generar un SESSION_SECRET seguro, puedes usar:
```bash
openssl rand -base64 32
```

### 3.4 Desplegar

1. Haz clic en **"Deploy"**
2. Espera a que termine el proceso (2-5 minutos)
3. Al finalizar, verás un mensaje de éxito con la URL de tu aplicación

---

## Paso 4: Configurar la Base de Datos

### Opción A: Usar la base de datos de Manus (Recomendado)

Si publicaste la aplicación desde Manus, la base de datos ya está configurada. Solo necesitas copiar la URL de conexión desde el panel de Manus.

### Opción B: Usar PlanetScale (MySQL gratuito)

1. Ve a [planetscale.com](https://planetscale.com)
2. Crea una cuenta gratuita
3. Crea una nueva base de datos:
   - Nombre: `piano-tech`
   - Región: La más cercana a ti
4. Ve a **"Connect"** → **"Create password"**
5. Copia la URL de conexión (formato: `mysql://...`)
6. Pégala en Vercel como variable `DATABASE_URL`

### Opción C: Usar Railway

1. Ve a [railway.app](https://railway.app)
2. Crea una cuenta
3. Haz clic en **"New Project"** → **"Provision MySQL"**
4. En la base de datos creada, ve a **"Connect"**
5. Copia la URL de conexión
6. Pégala en Vercel como variable `DATABASE_URL`

---

## Paso 5: Ejecutar Migraciones de Base de Datos

Después de configurar la base de datos, necesitas crear las tablas:

### Desde Vercel (Recomendado)

1. En tu proyecto de Vercel, ve a **"Settings"** → **"Functions"**
2. Añade un **"Cron Job"** temporal que ejecute la migración
3. O ejecuta manualmente desde la terminal local:

```bash
# Con las variables de entorno configuradas
DATABASE_URL="tu_url_de_conexion" pnpm db:push
```

### Desde tu ordenador local

```bash
# Exportar la variable de entorno
export DATABASE_URL="mysql://user:pass@host:3306/db"

# Ejecutar migraciones
cd piano_tech_app
pnpm db:push
```

---

## Paso 6: Configurar Dominio Personalizado (Opcional)

### 6.1 Comprar un dominio

Puedes comprar un dominio en:
- [Namecheap](https://namecheap.com) (~10€/año)
- [Google Domains](https://domains.google) (~12€/año)
- [GoDaddy](https://godaddy.com) (~15€/año)

### 6.2 Conectar el dominio a Vercel

1. En Vercel, ve a tu proyecto → **"Settings"** → **"Domains"**
2. Escribe tu dominio (ej: `pianotechmanager.com`)
3. Haz clic en **"Add"**
4. Vercel te mostrará los registros DNS que debes configurar

### 6.3 Configurar DNS en tu proveedor

Añade estos registros en el panel de tu proveedor de dominio:

| Tipo | Nombre | Valor |
|------|--------|-------|
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |

La propagación DNS puede tardar hasta 48 horas, aunque normalmente es más rápido.

---

## Paso 7: Instalar la PWA en tus Dispositivos

Una vez desplegada, puedes "instalar" la aplicación en cualquier dispositivo:

### En iPhone/iPad

1. Abre Safari y ve a tu URL (ej: `https://piano-tech.vercel.app`)
2. Toca el botón de compartir (cuadrado con flecha)
3. Selecciona **"Añadir a pantalla de inicio"**
4. Ponle un nombre y toca **"Añadir"**

### En Android

1. Abre Chrome y ve a tu URL
2. Toca el menú (tres puntos)
3. Selecciona **"Instalar aplicación"** o **"Añadir a pantalla de inicio"**
4. Confirma la instalación

### En Windows/Mac (Chrome)

1. Abre Chrome y ve a tu URL
2. Haz clic en el icono de instalación en la barra de direcciones
3. O ve a Menú → **"Instalar Piano Tech Manager"**

---

## Mantenimiento y Actualizaciones

### Actualizar la aplicación

Cada vez que hagas cambios en el código:

```bash
git add .
git commit -m "Descripción del cambio"
git push
```

Vercel detectará el cambio y desplegará automáticamente la nueva versión.

### Monitorizar el uso

En el dashboard de Vercel puedes ver:
- Número de visitas
- Uso de ancho de banda
- Logs de errores
- Tiempo de respuesta

### Límites del plan gratuito de Vercel

| Recurso | Límite |
|---------|--------|
| Ancho de banda | 100 GB/mes |
| Builds | 6000 minutos/mes |
| Funciones serverless | 100 GB-horas/mes |
| Proyectos | Ilimitados |

Para un uso personal/profesional individual, estos límites son más que suficientes.

---

## Solución de Problemas

### Error: "Build failed"

1. Revisa los logs de build en Vercel
2. Asegúrate de que todas las variables de entorno están configuradas
3. Verifica que el comando de build es correcto

### Error: "Database connection failed"

1. Verifica que la URL de la base de datos es correcta
2. Comprueba que la base de datos está activa
3. Asegúrate de que las migraciones se han ejecutado

### La aplicación no carga datos

1. Verifica que has iniciado sesión
2. Comprueba la consola del navegador (F12) para ver errores
3. Revisa los logs de funciones en Vercel

---

## Resumen de URLs Importantes

| Servicio | URL |
|----------|-----|
| Tu aplicación | `https://tu-proyecto.vercel.app` |
| Dashboard de Vercel | `https://vercel.com/dashboard` |
| Repositorio GitHub | `https://github.com/tu-usuario/piano-tech-manager` |

---

## Contacto y Soporte

Si tienes problemas con el despliegue, puedes:

1. Revisar la [documentación de Vercel](https://vercel.com/docs)
2. Consultar los [foros de la comunidad](https://github.com/vercel/vercel/discussions)
3. Contactar con el soporte de Vercel (plan de pago)

---

*Guía creada para Piano Tech Manager - Aplicación de gestión para técnicos de pianos acústicos*
