const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

app.post('/api/contact', (req, res) => {
  const { name, email, city, phone, service, message } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Nombre y email son obligatorios.' });
  }

  console.log('Nueva solicitud de cotización:', {
    name,
    email,
    city,
    phone,
    service,
    message,
    receivedAt: new Date().toISOString()
  });

  res.json({ success: true, message: 'Solicitud recibida. Nosotros nos contactaremos pronto.' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(port, () => {
  console.log(`Servidor backend ejecutándose en http://localhost:${port}`);
});
