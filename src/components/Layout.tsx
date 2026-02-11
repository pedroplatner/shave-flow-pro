import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import {
  LayoutDashboard, Scissors, Users, Sparkles, Package,
  BarChart3, Calendar, Settings, Menu, LogOut, Bot
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Scissors, label: 'Atendimentos', path: '/atendimentos' },
  { icon: Users, label: 'Barbeiros', path: '/barbeiros' },
  { icon: Sparkles, label: 'Serviços', path: '/servicos' },
  { icon: Package, label: 'Produtos & Estoque', path: '/estoque', modules: ['moduloProdutos', 'moduloEstoque'] as const },
  { icon: BarChart3, label: 'Relatórios', path: '/relatorios' },
  { icon: Calendar, label: 'Agendamentos', path: '/agendamentos', modules: ['moduloAgendamentos'] as const },
  { icon: Bot, label: 'Assistente IA', path: '/assistente-ia', modules: ['moduloIA'] as const },
  { icon: Settings, label: 'Configurações', path: '/configuracoes' },
];

function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  const location = useLocation();
  const { settings } = useApp();

  const filteredItems = menuItems.filter(item => {
    if (item.modules) {
      return item.modules.some(mod => (settings as any)[mod]);
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 pb-8">
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-primary">Barber</span>Pro
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Gestão para Barbearias</p>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {filteredItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onItemClick}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border">
        <Link
          to="/login"
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sair
        </Link>
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden lg:flex w-64 border-r border-border flex-col fixed h-screen bg-background">
        <SidebarContent />
      </aside>

      <div className="flex-1 lg:ml-64 flex flex-col">
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-border sticky top-0 z-40 bg-background/80 backdrop-blur-sm">
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-primary">Barber</span>Pro
          </h1>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SidebarContent onItemClick={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
