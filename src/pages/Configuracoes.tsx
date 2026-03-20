import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { useApp } from '@/contexts/AppContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { Package, Moon, Sun, Bot, ShieldCheck, ImagePlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function Configuracoes() {
  const { settings, updateSettings } = useApp();
  const { theme, setTheme } = useTheme();

  const [pin, setPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [hasPin, setHasPin] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.rpc('has_barbershop_pin').then(({ data }) => {
      setHasPin(!!data);
      setLoading(false);
    });
  }, []);

  const handleSavePin = async () => {
    if (pin.length !== 4) { toast.error('PIN deve ter 4 dígitos'); return; }

    // If changing PIN, verify current first
    if (hasPin && editing) {
      if (currentPin.length !== 4) { toast.error('Digite o PIN atual'); return; }
      const { data: valid, error: vErr } = await supabase.rpc('verify_barbershop_pin', { _pin: currentPin });
      if (vErr || !valid) { toast.error('PIN atual incorreto'); return; }
    }

    const { error } = await supabase.rpc('set_barbershop_pin', { _pin: pin });
    if (error) { toast.error('Erro ao salvar PIN'); return; }
    localStorage.removeItem('caixa_pin');
    setHasPin(true);
    setEditing(false);
    setPin('');
    setCurrentPin('');
    toast.success('PIN salvo!');
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Selecione uma imagem'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Imagem deve ter no máximo 2MB'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      updateSettings({ logoUrl: reader.result as string });
      toast.success('Logo atualizada!');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    updateSettings({ logoUrl: '' });
    toast.success('Logo removida!');
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
          {/* Logo */}
          <div className="bg-card rounded-xl border border-border p-6 animate-fade-in">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <ImagePlus className="h-5 w-5 text-muted-foreground" /> Logo da Barbearia
            </h3>
            <div className="flex items-center gap-4">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="h-16 w-16 object-contain rounded-lg border border-border" />
              ) : (
                <div className="h-16 w-16 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground">
                  <ImagePlus className="h-6 w-6" />
                </div>
              )}
              <div className="space-y-2">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  {settings.logoUrl ? 'Trocar Logo' : 'Enviar Logo'}
                </Button>
                {settings.logoUrl && (
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={handleRemoveLogo}>
                    <Trash2 className="h-4 w-4 mr-1" /> Remover
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">Imagem PNG ou JPG, máximo 2MB.</p>
          </div>

          {/* Modules */}
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

          {/* Appearance */}
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

          {/* PIN Security */}
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
                  {hasPin && editing && (
                    <div className="space-y-2">
                      <Label>PIN atual</Label>
                      <Input
                        type="password"
                        maxLength={4}
                        placeholder="****"
                        value={currentPin}
                        onChange={e => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="max-w-[160px] text-center text-lg tracking-[0.5em] font-mono"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>{hasPin && editing ? 'Novo PIN de 4 dígitos' : 'PIN de 4 dígitos'}</Label>
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
                    <Button size="sm" onClick={handleSavePin} disabled={pin.length !== 4 || (hasPin && editing && currentPin.length !== 4)}>Salvar PIN</Button>
                    {editing && <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setPin(''); setCurrentPin(''); }}>Cancelar</Button>}
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
