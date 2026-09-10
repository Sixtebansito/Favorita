import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendBackupEmail(to: string, backupData: any, filename: string) {
  const mailOptions = {
    from: `"Sistema Favorita" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Backup Automático de Base de Datos',
    text: 'Adjunto encontrarás el respaldo de la base de datos generado automáticamente.',
    attachments: [
      {
        filename,
        content: JSON.stringify(backupData, null, 2),
      },
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email enviado: ' + info.response);
    return { success: true };
  } catch (error: any) {
    console.error('Error al enviar correo:', error);
    return { success: false, error: error.message };
  }
}

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  const mailOptions = {
    from: `"Sistema Favorita" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Recuperación de Contraseña',
    html: `
      <h2>Recuperación de Contraseña</h2>
      <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:</p>
      <a href="${resetLink}" style="display:inline-block;padding:10px 20px;background:#0f172a;color:#fff;text-decoration:none;border-radius:5px;">Restablecer Contraseña</a>
      <p style="margin-top:20px;font-size:0.9rem;color:#64748b;">Este enlace expirará en 1 hora. Si no solicitaste este cambio, puedes ignorar este correo.</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email de recuperación enviado: ' + info.response);
    return { success: true };
  } catch (error: any) {
    console.error('Error al enviar correo de recuperación:', error);
    return { success: false, error: error.message };
  }
}

export async function sendLoginNotificationEmail(to: string, name: string) {
  const mailOptions = {
    from: `"Sistema Favorita" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Nuevo inicio de sesión en tu cuenta',
    html: `
      <h2>Hola, ${name}</h2>
      <p>Te informamos que se ha iniciado sesión en tu cuenta en el Sistema de Gestión Favorita.</p>
      <p><strong>Fecha y hora:</strong> ${new Date().toLocaleString('es-ES')}</p>
      <p style="margin-top:20px;font-size:0.9rem;color:#64748b;">Si no fuiste tú, por favor cambia tu contraseña inmediatamente o contacta al administrador.</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email de notificación de login enviado: ' + info.response);
    return { success: true };
  } catch (error: any) {
    console.error('Error al enviar correo de notificación de login:', error);
    return { success: false, error: error.message };
  }
}
