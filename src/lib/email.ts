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
