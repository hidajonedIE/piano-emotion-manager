# Guía para Conectar el Portal del Cliente (¡Como para niños de 4 años!)

¡Hola! Vamos a conectar los cables de nuestro nuevo portal para que funcione. ¡Es como un juego de construcción!

---

## 1. La Casita del Portal 🏡 (Configurar el Subdominio)

**¿Qué es esto?**
Vamos a darle una dirección especial a nuestro portal para que los clientes puedan visitarlo. Será como construir una casita nueva al lado de la nuestra.

**Nuestra casa:** `pianoemotion.es`
**La casita del cliente:** `portal.pianoemotion.es`

**Pasos:**

1.  **Ve a donde compraste tu dirección** (tu "tienda de direcciones", como GoDaddy, Namecheap, etc.).
2.  Busca un botón que diga **"DNS"** o **"Gestionar Dominios"**. Es como el panel de control de tus direcciones.
3.  Busca un botón para **"Añadir un nuevo récord"**.
4.  Elige el tipo **`CNAME`**.
5.  Rellena dos cajitas:
    *   **Nombre/Host:** Escribe `portal`
    *   **Valor/Apunta a:** Escribe `cname.vercel-dns.com.` (¡con el punto al final!)
6.  **¡Listo!** Ahora ve a Vercel, entra en tu proyecto `piano-emotion-manager`.
7.  Ve a **Settings -> Domains**.
8.  Escribe `portal.pianoemotion.es` y dale a **Add**. Vercel verá la señal que pusimos y conectará la casita.

¡Felicidades! La casita del portal ya tiene su dirección.

---

## 2. El Cofre de los Secretos 🗝️ (Conectar la Base de Datos)

**¿Qué es esto?**
Nuestra app guarda todos los datos (clientes, pianos, facturas) en un cofre del tesoro (la base de datos). Tenemos que darle al portal la llave secreta para que pueda ver esos datos.

**Pasos:**

1.  Ve a donde está tu cofre del tesoro (**Vercel Postgres**, Neon, etc.).
2.  Busca la **"llave secreta"**. Se llama **"Connection String"** o **"URL de conexión"**. Es una frase muy larga y secreta.
3.  **Cópiala** con mucho cuidado.
4.  Vuelve a Vercel, a tu proyecto `piano-emotion-manager`.
5.  Ve a **Settings -> Environment Variables** (Variables de Entorno).
6.  Crea una nueva variable:
    *   **Nombre:** `DATABASE_URL`
    *   **Valor:** Pega aquí la llave secreta que copiaste.
7.  Asegúrate de que se aplica a **Production** (Producción).

¡Genial! El portal ya sabe cómo abrir el cofre de los secretos.

---

## 3. El Cartero Mágico 💌 (Configurar el Email)

**¿Qué es esto?**
Para que los clientes entren al portal, les enviaremos un email con un "enlace mágico". Necesitamos contratar a un cartero mágico que envíe estos emails por nosotros.

**Nuestro cartero recomendado:** **Resend.com** (es fácil y tiene un plan gratis).

**Pasos:**

1.  Ve a **Resend.com** y crea una cuenta.
2.  Busca una sección llamada **"API Keys"** y crea una nueva llave. Será otra contraseña secreta.
3.  **Cópiala**.
4.  Vuelve a Vercel, a las **Environment Variables**.
5.  Crea una nueva variable:
    *   **Nombre:** `RESEND_API_KEY`
    *   **Valor:** Pega aquí la llave secreta de Resend.
6.  Crea otra variable para decirle al cartero desde qué dirección envía las cartas:
    *   **Nombre:** `FROM_EMAIL`
    *   **Valor:** `hola@pianoemotion.es` (o el email que prefieras)

¡Perfecto! Nuestro cartero mágico ya está listo para repartir los enlaces.

---

## 4. El Teléfono Rojo 📞 (Chat con WhatsApp)

**¿Qué es esto?**
En lugar de construir un chat complicado dentro del portal, vamos a usar algo que todo el mundo tiene: **WhatsApp**. Es como instalar un teléfono rojo directo entre el técnico y el cliente.

**¿Por qué es mejor?**
- Los clientes reciben los mensajes en su móvil, no tienen que entrar al portal.
- Es más cómodo y rápido para ellos.
- Reciben notificaciones de WhatsApp que nunca se pierden.

**Pasos:**

1.  Necesitamos un proveedor que conecte nuestra app con WhatsApp. El más famoso es **Twilio**.
2.  Ve a **Twilio.com** y crea una cuenta.
3.  Sigue sus pasos para obtener un número de teléfono para **WhatsApp Business API**.
4.  Cuando lo tengas, busca tres cosas:
    *   `Account SID` (el DNI de tu cuenta)
    *   `Auth Token` (la contraseña de tu cuenta)
    *   El número de WhatsApp que te han dado.
5.  Vuelve a Vercel, a las **Environment Variables**.
6.  Crea estas tres variables:
    *   **Nombre:** `TWILIO_ACCOUNT_SID` -> **Valor:** (pega el SID de tu cuenta)
    *   **Nombre:** `TWILIO_AUTH_TOKEN` -> **Valor:** (pega el token de tu cuenta)
    *   **Nombre:** `TWILIO_WHATSAPP_NUMBER` -> **Valor:** (pega tu número de WhatsApp, ej: `whatsapp:+14155238886`)

¡Y ya está! El código que he preparado usará estas llaves para que el chat del portal envíe y reciba mensajes a través de WhatsApp. ¡Mucho más potente!
