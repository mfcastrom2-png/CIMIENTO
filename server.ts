import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Encabezados básicos de endurecimiento de seguridad HTTP (OWASP Secure Headers)
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Control de tasa de peticiones en memoria para prevenir abusos / Spam Relay
const emailRateLimiter = new Map<string, { count: number; resetAt: number }>();
const MAX_EMAILS_PER_WINDOW = 30; // máx 30 envíos
const WINDOW_MS = 60 * 1000; // ventana de 1 minuto

function rateLimitCheck(ip: string): boolean {
  const now = Date.now();
  const record = emailRateLimiter.get(ip);
  if (!record || now > record.resetAt) {
    emailRateLimiter.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (record.count >= MAX_EMAILS_PER_WINDOW) {
    return false;
  }
  record.count++;
  return true;
}

app.use(express.json({ limit: '10mb' }));

/**
 * Helper para construir el transportador nodemailer con parámetros estrictos y tolerantes
 */
function crearTransporterSMTP(config: {
  servidorSmtp: string;
  puertoSmtp: number;
  seguridadSmtp: string;
  usuarioSmtp: string;
  passwordSmtp: string;
  permitirInseguroTls?: boolean;
}) {
  const isSecure = config.puertoSmtp === 465 || config.seguridadSmtp === 'SSL';
  
  return nodemailer.createTransport({
    host: config.servidorSmtp.trim(),
    port: config.puertoSmtp || 587,
    secure: isSecure,
    auth: (config.usuarioSmtp && config.passwordSmtp) ? {
      user: config.usuarioSmtp.trim(),
      pass: config.passwordSmtp.trim()
    } : undefined,
    tls: {
      // Por defecto en producción rechaza certificados inválidos o autofirmados para prevenir ataques Man-In-The-Middle
      rejectUnauthorized: config.permitirInseguroTls === true ? false : (process.env.NODE_ENV !== 'production' ? false : true)
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
}

/**
 * ENDPOINT: Probar conexión SMTP en vivo y enviar correo real de prueba
 */
app.post('/api/probar-conexion-smtp', async (req, res) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  if (!rateLimitCheck(clientIp)) {
    return res.status(429).json({
      success: false,
      message: 'Demasiadas solicitudes de envío. Por favor espere un momento antes de reintentar.'
    });
  }

  const { config, emailDestino } = req.body;

  if (!config || !config.servidorSmtp || !config.emailRemitente) {
    return res.status(400).json({
      success: false,
      message: 'Faltan parámetros de configuración del servidor SMTP o email remitente.'
    });
  }

  if (!emailDestino || !emailDestino.includes('@')) {
    return res.status(400).json({
      success: false,
      message: 'Debe especificar un correo destinatario válido para la prueba.'
    });
  }

  const logTimestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  let logs: string[] = [];

  try {
    logs.push(`[${logTimestamp}] Conectando con servidor ${config.servidorSmtp}:${config.puertoSmtp}...`);
    
    const transporter = crearTransporterSMTP(config);

    // 1. Verificar credenciales y handshake
    logs.push(`[${logTimestamp}] Verificando credenciales SMTP para "${config.usuarioSmtp || config.emailRemitente}"...`);
    await transporter.verify();
    logs.push(`[${logTimestamp}] Handshake y autenticación SMTP completados con éxito (250 OK).`);

    // 2. Enviar correo real de prueba
    logs.push(`[${logTimestamp}] Despachando mensaje MIME multipart a <${emailDestino}>...`);
    
    const remitenteFinal = `"${config.nombreRemitente || 'Gestión Humana'}" <${config.emailRemitente}>`;
    
    const info = await transporter.sendMail({
      from: remitenteFinal,
      to: emailDestino,
      replyTo: config.emailRespuesta || config.emailRemitente,
      subject: `Prueba de Conexión de Correo Corporativo — ${config.nombreRemitente || 'CIMIENTO S.A.S.'}`,
      text: `Hola,\n\nEste es un correo oficial de confirmación generado por el Sistema de Gestión Humana y SG-SST.\n\nEl servidor SMTP (${config.servidorSmtp}:${config.puertoSmtp}) ha sido configurado y autenticado satisfactoriamente para despachar notificaciones con remitente "${remitenteFinal}".\n\nFecha y hora: ${logTimestamp}\n\nAtentamente,\nDirección de Gestión Humana\n${config.firmalegalHabeasData || ''}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #8FA7D6; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #18235C; padding: 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 20px; font-weight: bold; color: #ffffff;">Prueba de Conexión Exitosa</h1>
            <p style="margin: 6px 0 0; font-size: 12px; color: #00FF00; font-weight: bold;">Buzón Corporativo Oficial Homologado</p>
          </div>
          <div style="padding: 24px; color: #282829; font-size: 13px; line-height: 1.6;">
            <p style="margin-top: 0;">Estimado(a) Administrador(a),</p>
            <p>Le confirmamos que la integración con su servidor de correo SMTP corporativo ha sido <strong>verificada y validada exitosamente</strong>.</p>
            <div style="background-color: #f8fafc; border-left: 4px solid #18235C; padding: 12px 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; font-size: 12px;"><strong>Servidor Host:</strong> ${config.servidorSmtp}:${config.puertoSmtp}</p>
              <p style="margin: 4px 0 0; font-size: 12px;"><strong>Remitente Autorizado:</strong> ${remitenteFinal}</p>
              <p style="margin: 4px 0 0; font-size: 12px;"><strong>Cifrado:</strong> ${config.seguridadSmtp}</p>
              <p style="margin: 4px 0 0; font-size: 12px;"><strong>Destinatario de Prueba:</strong> ${emailDestino}</p>
            </div>
            <p>A partir de este momento, las notificaciones de activación de cuenta, solicitudes de EPP, constancias y alertas serán despachadas directamente desde este buzón oficial.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 10px; color: #64748b; margin-bottom: 0; line-height: 1.4;">
              ${config.firmalegalHabeasData || 'Mensaje confidencial de acuerdo con la Ley 1581 de 2012 y el Código Sustantivo del Trabajo.'}
            </p>
          </div>
        </div>
      `
    });

    logs.push(`[${logTimestamp}] Servidor respondió: ${info.response || '250 Message queued'}`);
    logs.push(`[${logTimestamp}] Message ID: ${info.messageId}`);
    logs.push(`[${logTimestamp}] ¡CORREO REAL ENTREGADO SATISFACTORIAMENTE A ${emailDestino}!`);

    return res.json({
      success: true,
      message: `¡Correo de prueba enviado exitosamente a ${emailDestino}! Revise su bandeja de entrada (y spam).`,
      messageId: info.messageId,
      log: logs.join('\n')
    });
  } catch (error: any) {
    const errorMsg = error?.message || 'Error desconocido al conectar con el servidor SMTP';
    logs.push(`[${logTimestamp}] ERROR: ${errorMsg}`);
    
    // Sugerencias diagnósticas
    let sugerencia = '';
    if (errorMsg.includes('Invalid login') || errorMsg.includes('BadCredentials') || errorMsg.includes('Username and Password not accepted')) {
      sugerencia = 'Si utiliza Gmail o Google Workspace con verificación en dos pasos (2FA), no use su contraseña habitual. Debe generar una "Contraseña de Aplicación" de 16 caracteres en myaccount.google.com -> Seguridad -> Contraseñas de aplicaciones.';
    } else if (errorMsg.includes('ETIMEDOUT') || errorMsg.includes('ECONNREFUSED')) {
      sugerencia = 'No se pudo establecer conexión con el puerto especificado. Intente con el puerto 587 (STARTTLS) o 465 (SSL).';
    }

    return res.status(500).json({
      success: false,
      message: `Error al enviar correo: ${errorMsg}${sugerencia ? `\n\n💡 Sugerencia: ${sugerencia}` : ''}`,
      log: logs.join('\n')
    });
  }
});

/**
 * ENDPOINT: Enviar cualquier correo institucional real
 */
app.post('/api/enviar-correo-institucional', async (req, res) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  if (!rateLimitCheck(clientIp)) {
    return res.status(429).json({
      success: false,
      message: 'Límite de tasa de despacho excedido. Por favor espere antes de enviar más correos.'
    });
  }

  const { config, destinatario, destinatarioNombre, asunto, cuerpoTexto, cuerpoHtml } = req.body;

  if (!config || !config.servidorSmtp || !config.emailRemitente) {
    return res.status(400).json({
      success: false,
      message: 'Faltan parámetros de configuración del buzón corporativo.'
    });
  }

  if (!destinatario || !destinatario.includes('@')) {
    return res.status(400).json({
      success: false,
      message: 'Destinatario inválido.'
    });
  }

  try {
    const transporter = crearTransporterSMTP(config);
    const remitenteFinal = `"${config.nombreRemitente || 'Gestión Humana'}" <${config.emailRemitente}>`;

    const info = await transporter.sendMail({
      from: remitenteFinal,
      to: destinatario,
      replyTo: config.emailRespuesta || config.emailRemitente,
      subject: asunto,
      text: cuerpoTexto,
      html: cuerpoHtml || `<div style="font-family: Arial, sans-serif; white-space: pre-wrap;">${cuerpoTexto}</div>`
    });

    return res.json({
      success: true,
      messageId: info.messageId,
      message: `Correo despachado correctamente a ${destinatario}`
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || 'Error al despachar el correo institucional'
    });
  }
});

/**
 * Montaje de Vite en desarrollo o archivos estáticos en producción
 */
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor ejecutándose en http://0.0.0.0:${PORT} (Modo: ${isProd ? 'Producción' : 'Desarrollo'})`);
  });
}

startServer().catch(err => {
  console.error('Error al iniciar el servidor:', err);
});
