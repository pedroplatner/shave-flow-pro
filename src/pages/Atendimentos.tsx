import { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { useBarbeiros, useServicos, useAtendimentos, useBarbershopId } from '@/hooks/useBarbershop';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function Atendimentos() {
  const { data: barbeiros = [] } = useBarbeiros();
  const { data: servicos = [] } = useServicos();
  const { data: atendimentos = [] } = useAtendimentos();
  const { data: bsId } = useBarbershopId();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [cliente, setCliente] = useState('');
  const [barbeiro, setBarbeiro] = useState('');
  const [servicosSel, setServicosSel] = useState<string[]>([]);
  const [pagamento, setPagamento] = useState('');
  const [obs, setObs] = useState('');
  const [saving, setSaving] = useState(false);

  const total = servicosSel.reduce((acc, sId) => {
    const s = servicos.find(x => x.id === sId);
    return acc + (s ? Number(s.preco) : 0);
  }, 0);

  const toggleServico = (id: string) => {
    setServicosSel(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = async () => {
    if (!bsId) return;
    setSaving(true);
    const barbeiroNome = barbeiros.find(b => b.id === barbeiro)?.nome || '';
    const servicosNomes = servicosSel.map(id => servicos.find(s => s.id === id)?.nome || '');

    const { error } = await supabase.from('atendimentos').insert({
      barbershop_id: bsId,
      cliente,
      barbeiro: barbeiroNome,
      servicos: servicosNomes,
      forma_pagamento: pagamento,
      total,
      observacoes: obs,
    });

    setSaving(false);
    if (error) {
      toast.error('Erro ao salvar atendimento');
      console.error(error);
      return;
    }

    toast.success('Atendimento registrado!');
    queryClient.invalidateQueries({ queryKey: ['atendimentos'] });
    setCliente(''); setBarbeiro(''); setServicosSel([]); setPagamento(''); setObs('');
    setOpen(false);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Atendimentos</h2>
            <p className="text-muted-foreground mt-1 font-body text-sm">Registre e gerencie os atendimentos do dia</p>
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Novo Atendimento</Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Novo Atendimento</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                <div className="space-y-2">
                  <Label>Nome do Cliente</Label>
                  <Input placeholder="Nome do cliente" value={cliente} onChange={e => setCliente(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Barbeiro</Label>
                  <Select value={barbeiro} onValueChange={setBarbeiro}>
                    <SelectTrigger><SelectValue placeholder="Selecione o barbeiro" /></SelectTrigger>
                    <SelectContent>
                      {barbeiros.filter(b => b.ativo).map(b => (
                        <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label>Serviços</Label>
                  {servicos.filter(s => s.ativo).map(s => (
                    <label key={s.id} className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors">
                      <div className="flex items-center gap-3">
                        <Checkbox checked={servicosSel.includes(s.id)} onCheckedChange={() => toggleServico(s.id)} />
                        <span className="text-sm font-medium">{s.nome}</span>
                      </div>
                      <span className="text-sm font-semibold text-primary">R$ {Number(s.preco).toFixed(2)}</span>
                    </label>
                  ))}
                  {servicos.filter(s => s.ativo).length === 0 && (
                    <p className="text-sm text-muted-foreground">Cadastre serviços primeiro.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Forma de Pagamento</Label>
                  <Select value={pagamento} onValueChange={setPagamento}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="Pix">Pix</SelectItem>
                      <SelectItem value="Cartão Débito">Cartão Débito</SelectItem>
                      <SelectItem value="Cartão Crédito">Cartão Crédito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea placeholder="Observações opcionais..." value={obs} onChange={e => setObs(e.target.value)} />
                </div>
                <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-2xl font-bold text-primary">R$ {total.toFixed(2)}</span>
                </div>
                <Button className="w-full" onClick={handleSubmit} disabled={!cliente || !barbeiro || servicosSel.length === 0 || !pagamento || saving}>
                  {saving ? 'Salvando...' : 'Finalizar Atendimento'}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {atendimentos.length === 0 && (
          <p className="text-center text-muted-foreground py-12">Nenhum atendimento registrado ainda.</p>
        )}

        {/* Mobile cards */}
        <div className="block sm:hidden space-y-3">
          {atendimentos.map(a => (
            <div key={a.id} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{a.cliente}</span>
                <span className="font-semibold text-primary">R$ {Number(a.total).toFixed(2)}</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>{a.barbeiro} · {(a.servicos as string[]).join(', ')}</p>
                <p>{new Date(a.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · {a.forma_pagamento}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        {atendimentos.length > 0 && (
          <div className="hidden sm:block bg-card rounded-xl border border-border animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 lg:px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Hora</th>
                    <th className="text-left py-3 px-4 lg:px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Cliente</th>
                    <th className="text-left py-3 px-4 lg:px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Barbeiro</th>
                    <th className="text-left py-3 px-4 lg:px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Serviços</th>
                    <th className="text-left py-3 px-4 lg:px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Pagamento</th>
                    <th className="text-right py-3 px-4 lg:px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {atendimentos.map(a => (
                    <tr key={a.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 lg:px-6 text-sm font-body">{new Date(a.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="py-3 px-4 lg:px-6 text-sm font-medium">{a.cliente}</td>
                      <td className="py-3 px-4 lg:px-6 text-sm font-body">{a.barbeiro}</td>
                      <td className="py-3 px-4 lg:px-6 text-sm font-body">{(a.servicos as string[]).join(', ')}</td>
                      <td className="py-3 px-4 lg:px-6 text-sm font-body">{a.forma_pagamento}</td>
                      <td className="py-3 px-4 lg:px-6 text-sm text-right font-semibold">R$ {Number(a.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
