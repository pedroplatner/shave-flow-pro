import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Scissors, Users, Sparkles, Package,
  BarChart3, Settings, Menu, LogOut, Bot, Wallet, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Scissors, label: 'Atendimentos', path: '/atendimentos' },
  { icon: Wallet, label: 'Caixa', path: '/caixa' },
  { icon: Users, label: 'Barbeiros', path: '/barbeiros' },
  { icon: Sparkles, label: 'Serviços', path: '/servicos' },
  { icon: Package, label: 'Produtos', path: '/produtos', modules: ['moduloProdutos'] as const },
  { icon: BarChart3, label: 'Relatórios', path: '/relatorios' },
  { icon: Bot, label: 'Assistente IA', path: '/assistente-ia', modules: ['moduloIA'] as const },
  { icon: Settings, label: 'Configurações', path: '/configuracoes' },
];

function DesktopSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useApp();
  const { signOut } = useAuth();
  const customLogo = settings.logoUrl || null;

  const filteredItems = menuItems.filter(item => {
    if (item.modules) {
      return item.modules.some(mod => (settings as any)[mod]);
    }
    return true;
  });

  return (
    <aside
      className={cn(
        'hidden lg:flex border-r border-border flex-col fixed h-screen bg-background transition-all duration-300 z-30',
        collapsed ? 'w-[68px]' : 'w-64'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className={cn('flex items-center justify-center py-5', collapsed ? 'px-2 min-h-[60px]' : 'px-6 min-h-[112px]')}>
          {customLogo && (
            <img
              src={customLogo}
              alt="Logo"
              className={cn('object-contain transition-all duration-300', collapsed ? 'h-10 w-10' : 'h-20 w-20')}
            />
          )}
        </div>

        {/* Nav */}
        <TooltipProvider delayDuration={0}>
          <nav className={cn('flex-1 space-y-1', collapsed ? 'px-2' : 'px-3')}>
            {filteredItems.map(item => {
              const isActive = location.pathname === item.path;
              const linkContent = (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center rounded-lg text-sm font-medium transition-all duration-200',
                    collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.path}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }
              return linkContent;
            })}
          </nav>
        </TooltipProvider>

        {/* Footer */}
        <div className={cn('border-t border-border', collapsed ? 'p-2' : 'p-4')}>
          <TooltipProvider delayDuration={0}>
            {/* Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onToggle}
                  className={cn(
                    'flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors w-full rounded-lg',
                    collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
                  )}
                >
                  {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                  {!collapsed && <span>Recolher</span>}
                </button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" sideOffset={8}>Expandir</TooltipContent>
              )}
            </Tooltip>

            {/* Logout */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={async () => { await signOut(); navigate('/login'); }}
                  className={cn(
                    'flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors w-full rounded-lg',
                    collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
                  )}
                >
                  <LogOut className="h-5 w-5" />
                  {!collapsed && <span>Sair</span>}
                </button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" sideOffset={8}>Sair</TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </aside>
  );
}

function MobileSidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useApp();
  const { signOut } = useAuth();
  const customLogo = settings.logoUrl || null;

  const filteredItems = menuItems.filter(item => {
    if (item.modules) {
      return item.modules.some(mod => (settings as any)[mod]);
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 pb-8 flex items-center justify-center min-h-[112px]">
        {customLogo && <img src={customLogo} alt="Logo" className="h-20 w-20 object-contain" />}
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
                isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border">
        <button
          onClick={async () => { await signOut(); navigate('/login'); }}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
        >
          <LogOut className="h-5 w-5" />
          Sair
        </button>
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });
  const { settings } = useApp();
  const customLogo = settings.logoUrl || null;

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      localStorage.setItem('sidebar-collapsed', String(!prev));
      return !prev;
    });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DesktopSidebar collapsed={collapsed} onToggle={toggleCollapsed} />

      <div className={cn('flex-1 flex flex-col transition-all duration-300', collapsed ? 'lg:ml-[68px]' : 'lg:ml-64')}>
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-border sticky top-0 z-40 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 min-h-[40px]">
            {customLogo && <img src={customLogo} alt="Logo" className="h-10 w-10 object-contain" />}
          </div>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <MobileSidebarContent onItemClick={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
