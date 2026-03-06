import { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Wallet, ArrowUpCircle, ArrowDownCircle, Lock } from 'lucide-react';
import StatCard from '@/components/StatCard';
import { useCaixaDiario, useCaixaMovimentacoes, useBarbershopId } from '@/hooks/useBarbershop';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function Caixa() {
  const { data: caixa, isLoading } = useCaixaDiario();
  const { data: movimentacoes = [] } = useCaixaMovimentacoes(caixa?.id);
  const { data: bsId } = useBarbershopId();
  const queryClient = useQueryClient();

  const [valorInicial, setValorInicial] = useState('0');
  const [movDialog, setMovDialog] = useState<'entrada' | 'saida' | null>(null);
  const [movDescricao, setMovDescricao] = useState('');
  const [movValor, setMovValor] = useState('');
  const [saving, setSaving] = useState(false);

  const totalEntradas = movimentacoes.filter(m => m.tipo === 'entrada').reduce((s, m) => s + Number(m.valor), 0);
  const totalSaidas = movimentacoes.filter(m => m.tipo === 'saida').reduce((s, m) => s + Number(m.valor), 0);
  const saldoAtual = Number(caixa?.valor_inicial || 0) + totalEntradas - totalSaidas;

  const handleAbrirCaixa = async () => {
    if (!bsId) return;
    setSaving(true);
    const hoje = new Date().toISOString().split('T')[0];
    const { error } = await supabase.from('caixas_diarios').insert({
      barbershop_id: bsId,
      data: hoje,
      valor_inicial: parseFloat(valorInicial) || 0,
      status: 'aberto',
    });
    setSaving(false);
    if (error) { toast.error('Erro ao abrir caixa'); return; }
    toast.success('Caixa aberto!');
    queryClient.invalidateQueries({ queryKey: ['caixa_diario'] });
  };

  const handleAddMov = async () => {
    if (!caixa || !bsId || !movDialog) return;
    setSaving(true);
    const { error } = await supabase.from('caixa_movimentacoes').insert({
      caixa_id: caixa.id,
      barbershop_id: bsId,
      tipo: movDialog,
      descricao: movDescricao,
      valor: parseFloat(movValor) || 0,
      origem: 'manual',
    });
    setSaving(false);
    if (error) { toast.error('Erro ao registrar'); return; }
    toast.success(movDialog === 'entrada' ? 'Entrada registrada!' : 'Saída registrada!');
    queryClient.invalidateQueries({ queryKey: ['caixa_movimentacoes'] });
    queryClient.invalidateQueries({ queryKey: ['caixa_diario'] });
    setMovDialog(null); setMovDescricao(''); setMovValor('');
  };

  const handleFecharCaixa = async () => {
    if (!caixa) return;
    setSaving(true);
    const { error } = await supabase.from('caixas_diarios').update({
      status: 'fechado',
      valor_fechamento: saldoAtual,
    }).eq('id', caixa.id);
    setSaving(false);
    if (error) { toast.error('Erro ao fechar caixa'); return; }
    toast.success('Caixa fechado!');
    queryClient.invalidateQueries({ queryKey: ['caixa_diario'] });
  };

  if (isLoading) return <Layout><p className="text-center text-muted-foreground py-12">Carregando...</p></Layout>;

  // ESTADO 1 — Sem caixa hoje
  if (!caixa) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 w-full max-w-md space-y-6 text-center">
            <Wallet className="h-12 w-12 mx-auto text-primary" />
            <h2 className="text-xl sm:text-2xl font-bold">Abrir Caixa do Dia</h2>
            <p className="text-muted-foreground text-sm">Informe o valor inicial para começar o dia.</p>
            <div className="space-y-2 text-left">
              <Label>Valor inicial em caixa (R$)</Label>
              <Input type="number" min="0" step="0.01" value={valorInicial} onChange={e => setValorInicial(e.target.value)} placeholder="0,00" />
            </div>
            <Button className="w-full" onClick={handleAbrirCaixa} disabled={saving}>
              {saving ? 'Abrindo...' : 'Abrir Caixa'}
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // ESTADO 3 — Caixa fechado
  if (caixa.status === 'fechado') {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Caixa do Dia</h2>
            <p className="text-muted-foreground mt-1 text-sm">Resumo do caixa encerrado</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <StatCard title="Valor Inicial" value={`R$ ${Number(caixa.valor_inicial).toFixed(2)}`} icon={Wallet} />
            <StatCard title="Total Entradas" value={`R$ ${totalEntradas.toFixed(2)}`} icon={ArrowUpCircle} />
            <StatCard title="Total Saídas" value={`R$ ${totalSaidas.toFixed(2)}`} icon={ArrowDownCircle} />
            <StatCard title="Valor Fechamento" value={`R$ ${Number(caixa.valor_fechamento).toFixed(2)}`} icon={Lock} />
          </div>
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <Lock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Caixa encerrado. Um novo caixa poderá ser aberto amanhã.</p>
          </div>

          {movimentacoes.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Movimentações do dia</h3>
              {movimentacoes.map(m => (
                <div key={m.id} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-muted-foreground shrink-0">{new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    <Badge variant={m.tipo === 'entrada' ? 'default' : 'destructive'} className="shrink-0">{m.tipo === 'entrada' ? 'Entrada' : 'Saída'}</Badge>
                    <span className="text-sm truncate">{m.descricao}</span>
                  </div>
                  <span className={`font-semibold text-sm shrink-0 ${m.tipo === 'entrada' ? 'text-green-500' : 'text-destructive'}`}>
                    {m.tipo === 'entrada' ? '+' : '-'} R$ {Number(m.valor).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // ESTADO 2 — Caixa aberto
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Caixa do Dia</h2>
          <p className="text-muted-foreground mt-1 text-sm">Gerencie entradas e saídas do dia</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <StatCard title="Valor Inicial" value={`R$ ${Number(caixa.valor_inicial).toFixed(2)}`} icon={Wallet} />
          <StatCard title="Total Entradas" value={`R$ ${totalEntradas.toFixed(2)}`} icon={ArrowUpCircle} />
          <StatCard title="Total Saídas" value={`R$ ${totalSaidas.toFixed(2)}`} icon={ArrowDownCircle} />
          <div className="bg-card border-2 border-primary rounded-xl p-4 flex flex-col items-center justify-center">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Saldo Atual</span>
            <span className="text-xl sm:text-2xl font-bold text-primary">R$ {saldoAtual.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button onClick={() => setMovDialog('entrada')} className="flex-1">
            <ArrowUpCircle className="h-4 w-4 mr-2" /> + Registrar Entrada
          </Button>
          <Button variant="outline" onClick={() => setMovDialog('saida')} className="flex-1">
            <ArrowDownCircle className="h-4 w-4 mr-2" /> - Registrar Saída
          </Button>
        </div>

        {/* Movimentações dialog */}
        <Dialog open={!!movDialog} onOpenChange={v => { if (!v) setMovDialog(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>{movDialog === 'entrada' ? 'Registrar Entrada' : 'Registrar Saída'}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input placeholder="Ex: Pagamento cliente" value={movDescricao} onChange={e => setMovDescricao(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input type="number" min="0.01" step="0.01" placeholder="0,00" value={movValor} onChange={e => setMovValor(e.target.value)} />
              </div>
              <Button className="w-full" onClick={handleAddMov} disabled={!movDescricao || !movValor || saving}>
                {saving ? 'Salvando...' : 'Confirmar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Lista movimentações */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Movimentações</h3>
          {movimentacoes.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6">Nenhuma movimentação registrada.</p>
          ) : movimentacoes.map(m => (
            <div key={m.id} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs text-muted-foreground shrink-0">{new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                <Badge variant={m.tipo === 'entrada' ? 'default' : 'destructive'} className="shrink-0">{m.tipo === 'entrada' ? 'Entrada' : 'Saída'}</Badge>
                <span className="text-sm truncate">{m.descricao}</span>
              </div>
              <span className={`font-semibold text-sm shrink-0 ${m.tipo === 'entrada' ? 'text-green-500' : 'text-destructive'}`}>
                {m.tipo === 'entrada' ? '+' : '-'} R$ {Number(m.valor).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Fechar Caixa */}
        <div className="pt-4 border-t border-border">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full text-destructive border-destructive hover:bg-destructive/10">
                <Lock className="h-4 w-4 mr-2" /> Fechar Caixa
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Fechar Caixa do Dia?</AlertDialogTitle>
                <AlertDialogDescription>
                  O saldo atual é <strong className="text-foreground">R$ {saldoAtual.toFixed(2)}</strong>. Após fechar, não será possível adicionar novas movimentações hoje.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleFecharCaixa}>Confirmar Fechamento</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Layout>
  );
}
