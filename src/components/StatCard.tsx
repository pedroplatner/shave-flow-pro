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
    <div className="bg-card rounded-xl border border-border p-4 sm:p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <span className="text-xs sm:text-sm text-muted-foreground font-body">{title}</span>
        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        </div>
      </div>
      <div className="text-xl sm:text-3xl font-bold tracking-tight">{value}</div>
      {change && (
        <p className={`text-xs sm:text-sm mt-1 ${positive ? 'text-green-600' : 'text-destructive'}`}>
          {change}
        </p>
      )}
    </div>
  );
}
