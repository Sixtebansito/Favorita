'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get('email') as string;

  if (!email) {
    return { error: 'Por favor, ingrese su correo electrónico' };
  }

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    // Para evitar revelar qué correos existen, devolvemos success incluso si no existe
    return { success: true };
  }

  // Generar token único de 32 bytes
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 3600000); // 1 hora de validez

  // Guardar token en la BD
  await prisma.passwordResetToken.create({
    data: {
      email,
      token,
      expires
    }
  });

  // Regla Especial: Si el correo es admin@admin.com, enviamos a dannygghhm@gmail.com
  const sendTo = email === 'admin@admin.com' ? 'dannygghhm@gmail.com' : email;

  // Configurar Nodemailer
  // Se asume que el usuario ha configurado EMAIL_USER y EMAIL_PASS en su .env
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: sendTo,
      subject: 'Recuperación de Contraseña - Favorita',
      html: `
        <h2>Recuperación de Contraseña</h2>
        <p>Hola ${user.name},</p>
        <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva:</p>
        <a href="${resetLink}" style="display:inline-block;padding:10px 20px;background-color:#0070f3;color:#fff;text-decoration:none;border-radius:5px;">Restablecer Contraseña</a>
        <p>Si no solicitaste esto, puedes ignorar este correo.</p>
        <p>Este enlace expirará en 1 hora.</p>
      `
    });

    return { success: true };
  } catch (error) {
    console.error('Error enviando correo de recuperación:', error);
    return { error: 'Ocurrió un error al intentar enviar el correo. Verifica la configuración SMTP.' };
  }
}

export async function resetPassword(formData: FormData) {
  const token = formData.get('token') as string;
  const password = formData.get('password') as string;

  if (!token || !password) {
    return { error: 'Datos incompletos.' };
  }

  // Buscar el token en la BD
  const resetTokenRecord = await prisma.passwordResetToken.findUnique({
    where: { token }
  });

  if (!resetTokenRecord) {
    return { error: 'El enlace de recuperación es inválido.' };
  }

  if (resetTokenRecord.expires < new Date()) {
    // Eliminar token expirado
    await prisma.passwordResetToken.delete({ where: { id: resetTokenRecord.id } });
    return { error: 'El enlace de recuperación ha expirado.' };
  }

  // Hashear nueva contraseña y actualizar
  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { email: resetTokenRecord.email },
    data: { password: hashedPassword }
  });

  // Eliminar el token usado
  await prisma.passwordResetToken.deleteMany({
    where: { email: resetTokenRecord.email }
  });

  return { success: true };
}
