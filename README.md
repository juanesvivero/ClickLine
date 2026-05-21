# Clickline

Sitio web dividido en frontend y backend para el portal corporativo de Clickline y sus marcas.

## Estructura

- `index.html` — portal principal para elegir entre Clickline Security y Clickline Solutions.
- `security/index.html` — landing de Clickline Security.
- `solutions/index.html` — landing inicial de Clickline Solutions.
- `frontend/`
  - `index.html` — versión anterior/alternativa del frontend.
  - `styles.css` — estilos personalizados adicionales.
  - `script.js` — lógica de formulario y mensajes de usuario.
- `backend/`
  - `server.js` — servidor Express que sirve el sitio y envía el formulario por email.
- `package.json` — dependencias del backend.

## Uso

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Inicia el servidor:

   ```bash
   npm start
   ```

3. Abre en el navegador:

   ```
   http://localhost:3000
   ```

## Rutas

- `/` — selector de marca.
- `/security` — página de Clickline Security.
- `/solutions` — página de Clickline Solutions.
- `/solutions/cesta` — cesta de Clickline Solutions.
- `/healthz` — verificación básica del servidor.

## Verificación antes de producción

```bash
npm run check
npm run audit:high
```

## Notas

- El formulario de contacto envía datos al endpoint `/api/contact`.
- El backend usa Nodemailer. Copia `.env.example` en tu proveedor de hosting o configura estas variables de entorno antes de iniciar el servidor:

  ```bash
  SMTP_HOST=smtp.sendgrid.net
  SMTP_PORT=587
  SMTP_SECURE=false
  SMTP_USER=apikey
  SMTP_PASS=TU_API_KEY_DE_SENDGRID
  EMAIL_FROM=ventas@clickline.mobi
  EMAIL_TO=correo-destino@ejemplo.com
  ```

- Para Gmail u otro proveedor SMTP, cambia `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` y `EMAIL_FROM` según el proveedor.
- Si faltan variables SMTP, `/api/contact` responderá con error y el frontend abrirá WhatsApp como alternativa.
