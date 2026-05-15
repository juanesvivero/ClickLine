const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const projectRoot = path.join(__dirname, '..');

app.use(express.json());
app.use('/photos', express.static(path.join(projectRoot, 'photos')));
app.use('/frontend', express.static(path.join(projectRoot, 'frontend')));
app.use('/security', express.static(path.join(projectRoot, 'security'), { redirect: false }));
app.use('/solutions', express.static(path.join(projectRoot, 'solutions'), { redirect: false }));

function getTransporter() {
  const required = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_TO'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Faltan variables SMTP: ${missing.join(', ')}`);
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildEmail({ name, email, city, phone, service, message }) {
  const rows = [
    ['Nombre', name],
    ['Email', email],
    ['Ciudad', city],
    ['Telefono', phone],
    ['Servicio', service],
    ['Mensaje', message]
  ];

  const text = rows
    .map(([label, value]) => `${label}: ${value || 'No especificado'}`)
    .join('\n');

  const htmlRows = rows
    .map(([label, value]) => `
      <tr>
        <td style="padding:10px 12px;border:1px solid #e5e7eb;font-weight:700;">${label}</td>
        <td style="padding:10px 12px;border:1px solid #e5e7eb;">${escapeHtml(value || 'No especificado')}</td>
      </tr>
    `)
    .join('');

  const html = `
    <div style="font-family:Ethnocentric, Orbitron, 'Eurostile Extended', 'Bank Gothic', Arial, sans-serif;color:#111827;">
      <h2 style="color:#061A2F;">Nueva solicitud de cotización - Click Line Security</h2>
      <p>Un visitante envió el formulario de contacto desde la landing.</p>
      <table style="border-collapse:collapse;width:100%;max-width:680px;">${htmlRows}</table>
      <p style="color:#6b7280;font-size:13px;margin-top:18px;">Recibido: ${new Date().toLocaleString('es-EC')}</p>
    </div>
  `;

  return { text, html };
}

app.post('/api/contact', async (req, res) => {
  const { name, email, city, phone, service, message } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({
      success: false,
      message: 'Nombre, email y teléfono son obligatorios.'
    });
  }

  try {
    const transporter = getTransporter();
    const { text, html } = buildEmail({ name, email, city, phone, service, message });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: process.env.EMAIL_TO,
      replyTo: email,
      subject: `Nueva cotización web: ${name}`,
      text,
      html
    });

    res.json({
      success: true,
      message: 'Solicitud enviada. Nosotros nos contactaremos pronto.'
    });
  } catch (error) {
    console.error('Error enviando email de contacto:', error);
    res.status(500).json({
      success: false,
      message: 'No pudimos enviar la solicitud por email. Intenta por WhatsApp.'
    });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(projectRoot, 'index.html'));
});

app.get('/security', (req, res) => {
  res.sendFile(path.join(projectRoot, 'security', 'index.html'));
});

app.get('/solutions', (req, res) => {
  res.sendFile(path.join(projectRoot, 'solutions', 'index.html'));
});

app.get('*', (req, res) => {
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`Servidor backend ejecutándose en http://localhost:${port}`);
});
