import { Users, Truck, FileSpreadsheet, DollarSign, ListTodo, MapPin, Receipt, TableProperties } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import MetricCard from '@/components/MetricCard';
import { getUserSession } from './actions/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await getUserSession();
  if (!session) redirect('/login');

  const isAdmin = session.role === 'ADMIN';

  if (isAdmin) {
    return <AdminDashboard />
  } else {
    return <UserDashboard session={session} />
  }
}

async function AdminDashboard() {
  const [totalUsuarios, totalTransportistas, totalCabezales, totalLiquidaciones] = await Promise.all([
    prisma.user.count(),
    prisma.transportista.count(),
    prisma.cabezal.count(),
    prisma.liquidacion.count()
  ]);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const liquidacionesMes = await prisma.liquidacion.aggregate({
    where: {
      createdAt: { gte: startOfMonth }
    },
    _sum: { total_pagado: true }
  });
  const totalMes = liquidacionesMes._sum.total_pagado || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>Panel de Administración</h1>
        <p style={{ color: 'var(--muted-foreground)' }}>Vista general del sistema de transporte de La Favorita.</p>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <MetricCard title="Usuarios del Sistema" value={totalUsuarios} icon={Users} />
        <MetricCard title="Transportistas" value={totalTransportistas} icon={Truck} />
        <MetricCard title="Cabezales" value={totalCabezales} icon={ListTodo} />
        <MetricCard title="Liquidaciones (Histórico)" value={totalLiquidaciones} icon={FileSpreadsheet} />
        <MetricCard title="Total Pagado (Mes)" value={`$${totalMes.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} icon={DollarSign} />
      </section>

      <section className="card" style={{ padding: '2rem', marginTop: '1rem' }}>
        <div className="card-header" style={{ padding: '0 0 1.5rem 0' }}>
          <h2 className="card-title" style={{ fontSize: '1.25rem' }}>Acciones Administrativas Rápidas</h2>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a href="/transportistas" className="btn btn-primary" style={{ boxShadow: '0 4px 14px 0 rgba(0,0,0,0.1)' }}>
            <Truck size={16} /> Gestionar Transportistas
          </a>
          <a href="/tarifario" className="btn btn-secondary" style={{ boxShadow: '0 4px 14px 0 rgba(0,0,0,0.05)' }}>
            <TableProperties size={16} /> Tarifario y Destinos
          </a>
          <a href="/prefacturas" className="btn btn-secondary" style={{ boxShadow: '0 4px 14px 0 rgba(0,0,0,0.05)' }}>
            <Receipt size={16} /> Ver Liquidaciones
          </a>
        </div>
      </section>
    </div>
  );
}

async function UserDashboard({ session }: { session: any }) {
  const cabezalWhere = {
    transportista: { users: { some: { id: session.id } } }
  };
  const liquidacionWhere = {
    transportista: { users: { some: { id: session.id } } }
  };

  const [totalCabezales, totalLiquidaciones] = await Promise.all([
    prisma.cabezal.count({ where: cabezalWhere }),
    prisma.liquidacion.count({ where: liquidacionWhere })
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>Bienvenido, {session.name}</h1>
        <p style={{ color: 'var(--muted-foreground)' }}>Panel de control de tu gestión de transporte.</p>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <MetricCard title="Tus Cabezales" value={totalCabezales} icon={Truck} />
        <MetricCard title="Tus Prefacturas Generadas" value={totalLiquidaciones} icon={FileSpreadsheet} />
      </section>

      <section className="card" style={{ padding: '2rem', marginTop: '1rem' }}>
        <div className="card-header" style={{ padding: '0 0 1.5rem 0' }}>
          <h2 className="card-title" style={{ fontSize: '1.25rem' }}>Opciones Principales</h2>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flexDirection: 'column' }}>
          <a href="/guias/registro" className="btn btn-primary" style={{ padding: '1.5rem', fontSize: '1.1rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', justifyContent: 'center' }}>
            <MapPin size={24} style={{ marginRight: '0.5rem' }} /> Iniciar Registro de Guías
          </a>
          <a href="/prefacturas" className="btn btn-secondary" style={{ padding: '1.5rem', fontSize: '1.1rem', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)' }}>
            <Receipt size={24} style={{ marginRight: '0.5rem' }} /> Generar Prefactura / Liquidación
          </a>
        </div>
      </section>
    </div>
  );
}
