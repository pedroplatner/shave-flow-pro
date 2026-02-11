import Layout from '@/components/Layout';
import { useApp } from '@/contexts/AppContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTheme } from 'next-themes';
import { Calendar, Package, Warehouse, Moon, Sun, Bot } from 'lucide-react';

export default function Configuracoes() {
  const { settings, updateSettings } = useApp();
  const { theme, setTheme } = useTheme();

  const modules = [
    { key: 'moduloAgendamentos' as const, label: 'Agendamentos', desc: 'Ativar módulo de agendamentos', icon: Calendar },
    { key: 'moduloProdutos' as const, label: 'Produtos', desc: 'Vender produtos nos atendimentos', icon: Package },
    { key: 'moduloEstoque' as const, label: 'Estoque', desc: 'Controle de estoque de produtos', icon: Warehouse },
    { key: 'moduloIA' as const, label: 'Assistente IA', desc: 'Chat inteligente com análise do negócio', icon: Bot },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
          <p className="text-muted-foreground mt-1 font-body">Personalize o sistema</p>
        </div>

        <div className="space-y-4 max-w-2xl">
          <div className="bg-card rounded-xl border border-border p-6 animate-fade-in">
            <h3 className="text-lg font-semibold mb-6">Módulos</h3>
            <div className="space-y-5">
              {modules.map(m => (
                <div key={m.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <m.icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label className="text-sm font-medium">{m.label}</Label>
                      <p className="text-sm text-muted-foreground font-body">{m.desc}</p>
                    </div>
                  </div>
                  <Switch checked={settings[m.key]} onCheckedChange={v => updateSettings({ [m.key]: v })} />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 animate-fade-in">
            <h3 className="text-lg font-semibold mb-6">Aparência</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <Moon className="h-5 w-5 text-muted-foreground" /> : <Sun className="h-5 w-5 text-muted-foreground" />}
                <div>
                  <Label className="text-sm font-medium">Modo Escuro</Label>
                  <p className="text-sm text-muted-foreground font-body">Alternar entre modo claro e escuro</p>
                </div>
              </div>
              <Switch checked={theme === 'dark'} onCheckedChange={v => setTheme(v ? 'dark' : 'light')} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
