# Click Line Security

Sitio web dividido en frontend y backend para la landing page de Click Line Security.

## Estructura

- `frontend/`
  - `index.html` — página principal con el diseño completo.
  - `styles.css` — estilos personalizados adicionales.
  - `script.js` — lógica de formulario y mensajes de usuario.
- `backend/`
  - `server.js` — servidor Express que sirve el sitio y procesa el formulario.
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

## Notas

- El formulario de contacto envía datos al endpoint `/api/contact`.
- Esta estructura separa claramente el frontend estático del backend de recepción de solicitudes.
