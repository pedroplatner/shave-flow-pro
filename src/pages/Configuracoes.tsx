import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useApp } from '@/contexts/AppContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { Package, Moon, Sun, Bot, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function Configuracoes() {
  const { settings, updateSettings } = useApp();
  const { theme, setTheme } = useTheme();

  const [pin, setPin] = useState('');
  const [hasPin, setHasPin] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.rpc('has_barbershop_pin').then(({ data }) => {
      setHasPin(!!data);
      setLoading(false);
    });
  }, []);

  const handleSavePin = async () => {
    if (pin.length !== 4) { toast.error('PIN deve ter 4 dígitos'); return; }
    const { error } = await supabase.rpc('set_barbershop_pin', { _pin: pin });
    if (error) { toast.error('Erro ao salvar PIN'); return; }
    // Remove legacy localStorage PIN if present
    localStorage.removeItem('caixa_pin');
    setHasPin(true);
    setEditing(false);
    setPin('');
    toast.success('PIN salvo!');
  };

  const modules = [
    { key: 'moduloProdutos' as const, label: 'Produtos', desc: 'Vender produtos nos atendimentos', icon: Package },
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

          <div className="bg-card rounded-xl border border-border p-6 animate-fade-in">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-muted-foreground" /> Segurança do Caixa
            </h3>
            <div className="space-y-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : hasPin && !editing ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">PIN configurado</p>
                    <p className="text-sm text-muted-foreground font-mono tracking-widest">****</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Alterar PIN</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>PIN de 4 dígitos</Label>
                    <Input
                      type="password"
                      maxLength={4}
                      placeholder="0000"
                      value={pin}
                      onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="max-w-[160px] text-center text-lg tracking-[0.5em] font-mono"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSavePin} disabled={pin.length !== 4}>Salvar PIN</Button>
                    {editing && <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setPin(''); }}>Cancelar</Button>}
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">O PIN protege ações sensíveis do caixa como editar movimentações, excluir e reabrir o caixa.</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
