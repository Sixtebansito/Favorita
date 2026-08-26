import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon: LucideIcon;
}

export default function MetricCard({ title, value, description, trend, icon: Icon }: MetricCardProps) {
  return (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)' }}>{title}</h3>
        <Icon size={16} color="var(--muted-foreground)" />
      </div>
      <div>
        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--foreground)' }}>{value}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
          {trend && (
            <span style={{ 
              fontSize: '0.75rem', 
              fontWeight: 500, 
              color: trend.isPositive ? '#16a34a' : '#dc2626',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
            </span>
          )}
          {description && (
            <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{description}</span>
          )}
        </div>
      </div>
    </div>
  );
}
