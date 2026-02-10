import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  change?: string;
  positive?: boolean;
}

export default function StatCard({ title, value, icon: Icon, change, positive }: StatCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground font-body">{title}</span>
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
      <div className="text-3xl font-bold tracking-tight">{value}</div>
      {change && (
        <p className={`text-sm mt-1 ${positive ? 'text-success' : 'text-danger'}`}>
          {change}
        </p>
      )}
    </div>
  );
}
