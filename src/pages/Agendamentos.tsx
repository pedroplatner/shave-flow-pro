import { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Plus, Check, X, Trash2 } from 'lucide-react';
import { useAgendamentos, useBarbeiros, useServicos, useBarbershopId } from '@/hooks/useBarbershop';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function Agendamentos() {
  const { data: agendamentos = [] } = useAgendamentos();
  const { data: barbeiros = [] } = useBarbeiros();
  const { data: servicos = [] } = useServicos();
  const { data: bsId } = useBarbershopId();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [hora, setHora] = useState('');
  const [cliente, setCliente] = useState('');
  const [barbeiro, setBarbeiro] = useState('');
  const [servico, setServico] = useState('');

  const handleAdd = async () => {
    if (!bsId) return;
    const barbeiroNome = barbeiros.find(b => b.id === barbeiro)?.nome || '';
    const servicoNome = servicos.find(s => s.id === servico)?.nome || '';
    const { error } = await supabase.from('agendamentos').insert({
      barbershop_id: bsId, hora, cliente, barbeiro: barbeiroNome, servico: servicoNome,
    });
    if (error) { toast.error('Erro ao criar agendamento'); return; }
    toast.success('Agendamento criado!');
    queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
    setHora(''); setCliente(''); setBarbeiro(''); setServico('');
    setOpen(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('agendamentos').update({ status }).eq('id', id);
    if (error) { toast.error('Erro ao atualizar'); return; }
    queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('agendamentos').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Agendamento excluído');
    queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
  };

  const statusColors: Record<string, string> = {
    confirmado: 'bg-green-500/10 text-green-600',
    pendente: 'bg-primary/10 text-primary',
    cancelado: 'bg-destructive/10 text-destructive',
  };
  const statusLabels: Record<string, string> = { confirmado: 'Confirmado', pendente: 'Pendente', cancelado: 'Cancelado' };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Agendamentos</h2>
            <p className="text-muted-foreground mt-1 font-body text-sm">Gerencie a agenda da barbearia</p>
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Novo Agendamento</Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
              <SheetHeader><SheetTitle>Novo Agendamento</SheetTitle></SheetHeader>
              <div className="space-y-4 mt-6">
                <div className="space-y-2"><Label>Horário</Label><Input type="time" value={hora} onChange={e => setHora(e.target.value)} /></div>
                <div className="space-y-2"><Label>Cliente</Label><Input placeholder="Nome do cliente" value={cliente} onChange={e => setCliente(e.target.value)} /></div>
                <div className="space-y-2">
                  <Label>Barbeiro</Label>
                  <Select value={barbeiro} onValueChange={setBarbeiro}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{barbeiros.filter(b => b.ativo).map(b => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Serviço</Label>
                  <Select value={servico} onValueChange={setServico}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{servicos.filter(s => s.ativo).map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={handleAdd} disabled={!hora || !cliente || !barbeiro || !servico}>Agendar</Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="space-y-3">
          {agendamentos.map(a => (
            <div key={a.id} className="bg-card rounded-xl border border-border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in hover:border-primary/20 transition-colors">
              <div className="flex items-center gap-4">
                <div className="text-center min-w-[50px]">
                  <div className="text-lg sm:text-xl font-bold">{a.hora}</div>
                </div>
                <div className="h-10 w-px bg-border hidden sm:block" />
                <div>
                  <h3 className="font-semibold text-sm sm:text-base">{a.cliente}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground font-body">{a.servico} • {a.barbeiro}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-end">
                <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${statusColors[a.status] || ''}`}>
                  {statusLabels[a.status] || a.status}
                </span>
                <div className="flex items-center gap-1">
                  {a.status === 'pendente' && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => updateStatus(a.id, 'confirmado')} title="Confirmar">
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  {a.status !== 'cancelado' && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => updateStatus(a.id, 'cancelado')} title="Cancelar">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => remove(a.id)} title="Excluir">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {agendamentos.length === 0 && (
            <div className="text-center py-12 text-muted-foreground font-body">Nenhum agendamento registrado.</div>
          )}
        </div>
      </div>
    </Layout>
  );
}
