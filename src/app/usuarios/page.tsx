import { prisma } from '@/lib/prisma';
import UsuarioClient from './UsuarioClient';

export default async function UsuariosPage() {
  const usuarios = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Gestión de Usuarios</h1>
        <p>Administra los usuarios que tendrán acceso al sistema.</p>
      </header>

      <UsuarioClient usuarios={usuarios} />
    </div>
  );
}
