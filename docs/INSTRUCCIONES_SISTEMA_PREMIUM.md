## 🚀 ¡A Jugar! Los 4 Pasos para Activar el Sistema Premium

Imagina que hemos construido un castillo de LEGO increíble (el sistema Premium). Ahora tenemos que conectarlo a todo lo demás para que funcione.

---

### Paso 1: 🗝️ El Cofre de los Secretos (Conectar con la Base de Datos)

**¿Qué es?**
El "cofre de los secretos" es nuestra base de datos. Guarda toda la información: quién es Premium, quién es Básico, cuánto ha comprado cada técnico, etc.

**¿Qué hay que hacer?**
1. **Abre el cofre**: Conéctate a tu base de datos (Neon, Supabase, etc.).
2. **Añade los nuevos cajones**: Ejecuta el comando de migración de Drizzle. Esto creará las nuevas tablas que hemos diseñado (`distributor_premium_config`, `technician_account_status`, etc.).

**Comando mágico:**
```bash
pnpm db:push
```

**¿Por qué?**
Sin esto, la app no sabe dónde guardar la información de las cuentas Premium y todo se rompería.

---

### Paso 2: 🛒 La Llave de la Tienda (Configurar WooCommerce)

**¿Qué es?**
La "llave de la tienda" son las credenciales de la API de WooCommerce. Permiten a nuestra app preguntar a tu tienda: "Oye, ¿cuánto ha comprado este técnico?".

**¿Qué hay que hacer?**
1. **Ve al Panel del Distribuidor**: Entra en la nueva página `distributor-panel`.
2. **Rellena los campos**: Pon la URL de tu tienda, la Consumer Key y el Consumer Secret.
3. **Prueba la conexión**: Dale al botón "Probar conexión".
4. **Activa la verificación**: Marca la casilla "Habilitar verificación automática".
5. **Guarda**: Dale al botón "Guardar configuración".

**¿Por qué?**
Sin esto, la app no puede saber cuánto ha comprado cada técnico y no puede decidir si es Premium o Básico.

---

### Paso 3: 🦉 El Búho Nocturno (Activar el Cron Job)

**¿Qué es?**
El "búho nocturno" es una tarea automática que se despierta cada noche a las 2:00 AM. Su trabajo es ir a la tienda (con la llave que le dimos) y preguntar por las compras de TODOS los técnicos.

**¿Qué hay que hacer?**
1. **Ve a tu servidor**: Conéctate al servidor donde corre la app (Vercel, Railway, etc.).
2. **Añade una tarea programada**: Busca la sección de "Cron Jobs" o "Scheduled Tasks".
3. **Crea una nueva tarea**:
   - **Horario**: `0 2 * * *` (significa "a las 2:00 AM todos los días")
   - **Comando**: `node server/jobs/run-daily-check.js` (o la ruta correcta)

**¿Por qué?**
Sin el búho, el estado de los técnicos no se actualizaría nunca. Un técnico que compre mucho seguiría siendo Básico, y uno que no compre nada seguiría siendo Premium.

---

### Paso 4: 🧪 El Experimento Final (Probar el Flujo Completo)

**¿Qué es?**
Ahora que todo está conectado, vamos a probar que funciona como un coche de carreras.

**¿Qué hay que hacer?**
1. **Crea un técnico de prueba**: Regístralo en la app.
2. **Verifica el estado inicial**: Debería ser `trial` (periodo de prueba).
3. **Haz una compra en WooCommerce**: Usa el email del técnico de prueba y haz una compra superior a la mínima (ej: 150€).
4. **Fuerza la verificación**: Ejecuta el cron job manualmente (o espera a las 2:00 AM).
5. **Verifica el cambio a Premium**: El técnico debería ser `premium` ahora.
6. **Crea otro técnico**: No hagas ninguna compra.
7. **Espera a que termine el trial**: Pasa el tiempo o ajústalo en la BD.
8. **Verifica el cambio a Básico**: El técnico debería ser `basic` ahora.
9. **Intenta usar WhatsApp**: Debería mostrar el mensaje para mejorar la cuenta.

**¿Por qué?**
Para asegurarnos de que no hay errores y que la experiencia para el técnico y el distribuidor es perfecta.

---

¡Y ya está! Con estos 4 pasos, el castillo de LEGO está vivo y funcionando. 🎉
