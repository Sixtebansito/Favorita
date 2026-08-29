'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPassword } from '@/app/actions/resetPassword';
import { KeyRound, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

function ResetPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) {
      setError('Falta el token de recuperación.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    formData.append('token', token);
    const res = await resetPassword(formData);

    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (!token) {
    return (
      <div style={{ textAlign: 'center', width: '100%' }}>
        <div style={{ 
          width: '100%', 
          padding: '0.75rem', 
          backgroundColor: '#fee2e2', 
          color: '#991b1b', 
          borderRadius: 'var(--radius)', 
          fontSize: '0.875rem',
          textAlign: 'center',
          marginBottom: '1rem'
        }}>
          Enlace de recuperación inválido o faltante.
        </div>
        <Link href="/login" className="btn btn-outline" style={{ width: '100%' }}>
          Volver al Inicio de Sesión
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
        <CheckCircle2 size={48} color="#16a34a" />
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>¡Contraseña Actualizada!</h2>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
            Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
          </p>
        </div>
        <Link href="/login" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
          Ir a Iniciar Sesión
        </Link>
      </div>
    );
  }

  return (
    <>
      <div style={{ textAlign: 'center', width: '100%' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>Nueva Contraseña</h1>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
          Ingresa tu nueva contraseña a continuación
        </p>
      </div>

      {error && (
        <div style={{ 
          width: '100%', 
          padding: '0.75rem', 
          backgroundColor: '#fee2e2', 
          color: '#991b1b', 
          borderRadius: 'var(--radius)', 
          fontSize: '0.875rem',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="password" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Nueva Contraseña</label>
          <input 
            id="password"
            name="password" 
            type="password" 
            className="form-input" 
            placeholder="••••••••" 
            minLength={6}
            required 
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}
          disabled={loading}
        >
          {loading ? 'Guardando...' : 'Guardar Contraseña'}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--muted)',
      padding: '1rem'
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '400px',
        padding: '2.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary)',
          color: 'var(--primary-foreground)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '0.5rem'
        }}>
          <KeyRound size={24} />
        </div>
        
        <Suspense fallback={<div>Cargando...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
