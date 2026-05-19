const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const projectRoot = path.join(__dirname, '..');
const assetCache = process.env.NODE_ENV === 'production' ? '30d' : 0;
const contactWindowMs = 15 * 60 * 1000;
const contactLimit = 5;
const contactAttempts = new Map();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  next();
});

app.use(express.json({ limit: '32kb' }));
app.use('/photos', express.static(path.join(projectRoot, 'photos'), {
  immutable: process.env.NODE_ENV === 'production',
  maxAge: assetCache
}));
app.use('/frontend', express.static(path.join(projectRoot, 'frontend')));
app.use('/security', express.static(path.join(projectRoot, 'security'), { redirect: false }));
app.use('/solutions', express.static(path.join(projectRoot, 'solutions'), { redirect: false }));

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanText(value = '', maxLength = 1000) {
  return String(value)
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function contactRateLimit(req, res, next) {
  const now = Date.now();
  const key = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const record = contactAttempts.get(key) || { count: 0, resetAt: now + contactWindowMs };

  if (record.resetAt <= now) {
    record.count = 0;
    record.resetAt = now + contactWindowMs;
  }

  record.count += 1;
  contactAttempts.set(key, record);

  if (record.count > contactLimit) {
    return res.status(429).json({
      success: false,
      message: 'Recibimos muchas solicitudes seguidas. Intenta nuevamente en unos minutos.'
    });
  }

  next();
}

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

app.post('/api/contact', contactRateLimit, async (req, res) => {
  const payload = {
    name: cleanText(req.body.name, 120),
    email: cleanText(req.body.email, 160),
    city: cleanText(req.body.city, 120),
    phone: cleanText(req.body.phone, 40),
    service: cleanText(req.body.service, 160),
    message: cleanText(req.body.message, 1200)
  };
  const { name, email, phone } = payload;

  if (!name || !email || !phone) {
    return res.status(400).json({
      success: false,
      message: 'Nombre, email y teléfono son obligatorios.'
    });
  }

  if (!EMAIL_PATTERN.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Ingresa un email válido.'
    });
  }

  try {
    const transporter = getTransporter();
    const { text, html } = buildEmail(payload);

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

app.get('/healthz', (req, res) => {
  res.json({ ok: true });
});

app.get('/shared.css', (req, res) => {
  res.sendFile(path.join(projectRoot, 'shared.css'));
});

app.get(['/security', '/security/'], (req, res) => {
  res.sendFile(path.join(projectRoot, 'security', 'index.html'));
});

app.get(['/solutions', '/solutions/'], (req, res) => {
  res.sendFile(path.join(projectRoot, 'solutions', 'index.html'));
});

app.get(['/solutions/cesta', '/solutions/cesta/'], (req, res) => {
  res.sendFile(path.join(projectRoot, 'solutions', 'cesta.html'));
});

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({
      success: false,
      message: 'La solicitud no tiene un formato válido.'
    });
  }

  next(error);
});

app.get('*', (req, res) => {
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`Servidor backend ejecutándose en http://localhost:${port}`);
});
