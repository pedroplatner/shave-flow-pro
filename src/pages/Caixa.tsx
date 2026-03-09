import { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Wallet, ArrowUpCircle, ArrowDownCircle, Lock, ChevronDown, History, Pencil, Trash2, Unlock } from 'lucide-react';
import StatCard from '@/components/StatCard';
import { useCaixaDiario, useCaixaMovimentacoes, useBarbershopId, useCaixaHistorico, useCaixaMovimentacoesByCaixaIds } from '@/hooks/useBarbershop';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import PinDialog, { withPinVerification } from '@/components/PinDialog';

function MovBadge({ tipo, origem }: { tipo: string; origem: string }) {
  if (tipo === 'saida') return <Badge variant="destructive" className="shrink-0">Saída</Badge>;
  if (origem === 'atendimento') return <Badge className="shrink-0 bg-blue-600 hover:bg-blue-700">Atendimento</Badge>;
  return <Badge className="shrink-0 bg-green-600 hover:bg-green-700">Entrada</Badge>;
}

function MovItem({ m, caixaAberto, onEdit, onDelete }: { m: any; caixaAberto: boolean; onEdit?: (m: any) => void; onDelete?: (m: any) => void }) {
  const isManual = m.origem !== 'atendimento';
  return (
    <div className="bg-card border border-border rounded-lg p-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <span className="text-xs text-muted-foreground shrink-0">{new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
        <MovBadge tipo={m.tipo} origem={m.origem} />
        <span className="text-sm truncate">{m.descricao}</span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <span className={`font-semibold text-sm ${m.tipo === 'entrada' ? 'text-green-500' : 'text-destructive'}`}>
          {m.tipo === 'entrada' ? '+' : '-'} R$ {Number(m.valor).toFixed(2)}
        </span>
        {caixaAberto && isManual && onEdit && onDelete && (
          <>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(m)}><Pencil className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(m)}><Trash2 className="h-3.5 w-3.5" /></Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function Caixa() {
  const { data: caixa, isLoading } = useCaixaDiario();
  const { data: movimentacoes = [] } = useCaixaMovimentacoes(caixa?.id);
  const { data: bsId } = useBarbershopId();
  const { data: historico = [] } = useCaixaHistorico();
  const queryClient = useQueryClient();

  const hoje = new Date().toISOString().split('T')[0];
  const historicoAnterior = historico.filter(h => h.data !== hoje);
  const histIds = historicoAnterior.map(h => h.id);
  const { data: allHistMovs = [] } = useCaixaMovimentacoesByCaixaIds(histIds);

  const [valorInicial, setValorInicial] = useState('0');
  const [movDialog, setMovDialog] = useState<'entrada' | 'saida' | null>(null);
  const [movDescricao, setMovDescricao] = useState('');
  const [movValor, setMovValor] = useState('');
  const [saving, setSaving] = useState(false);

  // Edit mov state
  const [editMovOpen, setEditMovOpen] = useState(false);
  const [editMovId, setEditMovId] = useState<string | null>(null);
  const [editMovDescricao, setEditMovDescricao] = useState('');

  // Delete mov state
  const [deleteMovId, setDeleteMovId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // PIN state
  const [pinOpen, setPinOpen] = useState(false);
  const [pinAction, setPinAction] = useState<(() => void) | null>(null);

  const totalEntradas = movimentacoes.filter(m => m.tipo === 'entrada').reduce((s, m) => s + Number(m.valor), 0);
  const totalSaidas = movimentacoes.filter(m => m.tipo === 'saida').reduce((s, m) => s + Number(m.valor), 0);
  const saldoAtual = Number(caixa?.valor_inicial || 0) + totalEntradas - totalSaidas;

  const invalidateCaixa = () => {
    queryClient.invalidateQueries({ queryKey: ['caixa_diario'] });
    queryClient.invalidateQueries({ queryKey: ['caixa_movimentacoes'] });
    queryClient.invalidateQueries({ queryKey: ['caixa_historico'] });
    queryClient.invalidateQueries({ queryKey: ['caixa_movimentacoes_bulk'] });
  };

  const handleAbrirCaixa = async () => {
    if (!bsId) return;
    setSaving(true);
    const { error } = await supabase.from('caixas_diarios').insert({ barbershop_id: bsId, data: hoje, valor_inicial: parseFloat(valorInicial) || 0, status: 'aberto' });
    setSaving(false);
    if (error) { toast.error('Erro ao abrir caixa'); return; }
    toast.success('Caixa aberto!');
    invalidateCaixa();
  };

  const handleAddMov = async () => {
    if (!caixa || !bsId || !movDialog) return;
    setSaving(true);
    const { error } = await supabase.from('caixa_movimentacoes').insert({ caixa_id: caixa.id, barbershop_id: bsId, tipo: movDialog, descricao: movDescricao, valor: parseFloat(movValor) || 0, origem: 'manual' });
    setSaving(false);
    if (error) { toast.error('Erro ao registrar'); return; }
    toast.success(movDialog === 'entrada' ? 'Entrada registrada!' : 'Saída registrada!');
    invalidateCaixa();
    setMovDialog(null); setMovDescricao(''); setMovValor('');
  };

  const handleFecharCaixa = async () => {
    if (!caixa) return;
    setSaving(true);
    const { error } = await supabase.from('caixas_diarios').update({ status: 'fechado', valor_fechamento: saldoAtual }).eq('id', caixa.id);
    setSaving(false);
    if (error) { toast.error('Erro ao fechar caixa'); return; }
    toast.success('Caixa fechado!');
    invalidateCaixa();
  };

  const doReabrirCaixa = async () => {
    if (!caixa) return;
    setSaving(true);
    const { error } = await supabase.from('caixas_diarios').update({ status: 'aberto', valor_fechamento: null }).eq('id', caixa.id);
    setSaving(false);
    if (error) { toast.error('Erro ao reabrir caixa'); return; }
    toast.success('Caixa reaberto!');
    invalidateCaixa();
  };

  const handleReabrirCaixa = () => {
    withPinVerification(doReabrirCaixa, setPinOpen, setPinAction);
  };

  const handleEditMov = (m: any) => {
    withPinVerification(() => {
      setEditMovId(m.id);
      setEditMovDescricao(m.descricao);
      setEditMovOpen(true);
    }, setPinOpen, setPinAction);
  };

  const handleSaveEditMov = async () => {
    if (!editMovId) return;
    setSaving(true);
    const { error } = await supabase.from('caixa_movimentacoes').update({ descricao: editMovDescricao }).eq('id', editMovId);
    setSaving(false);
    if (error) { toast.error('Erro ao editar'); return; }
    toast.success('Movimentação atualizada!');
    invalidateCaixa();
    setEditMovOpen(false); setEditMovId(null);
  };

  const handleDeleteMov = (m: any) => {
    withPinVerification(() => {
      setDeleteMovId(m.id);
      setDeleteConfirmOpen(true);
    }, setPinOpen, (fn) => setPinAction(() => fn));
  };

  const confirmDeleteMov = async () => {
    if (!deleteMovId) return;
    setSaving(true);
    const { error } = await supabase.from('caixa_movimentacoes').delete().eq('id', deleteMovId);
    setSaving(false);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Movimentação excluída!');
    invalidateCaixa();
    setDeleteConfirmOpen(false); setDeleteMovId(null);
  };

  const HistoricoSection = () => {
    if (historicoAnterior.length === 0) return null;
    return (
      <div className="space-y-4 mt-8">
        <h3 className="text-lg font-semibold flex items-center gap-2"><History className="h-5 w-5 text-primary" /> Histórico de Caixas</h3>
        <div className="space-y-2">
          {historicoAnterior.map(h => {
            const movs = allHistMovs.filter(m => m.caixa_id === h.id);
            const ent = movs.filter(m => m.tipo === 'entrada').reduce((s, m) => s + Number(m.valor), 0);
            const sai = movs.filter(m => m.tipo === 'saida').reduce((s, m) => s + Number(m.valor), 0);
            const saldo = Number(h.valor_fechamento ?? (Number(h.valor_inicial) + ent - sai));
            return (
              <Collapsible key={h.id}>
                <CollapsibleTrigger className="w-full">
                  <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-sm">{new Date(h.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}</span>
                      <Badge variant={h.status === 'fechado' ? 'secondary' : 'default'} className="text-xs">{h.status === 'fechado' ? 'Fechado' : 'Aberto'}</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm text-primary">R$ {saldo.toFixed(2)}</span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="bg-muted/30 border border-border border-t-0 rounded-b-xl p-4 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="bg-card rounded-lg p-3 text-center"><p className="text-xs text-muted-foreground">Inicial</p><p className="font-semibold text-sm">R$ {Number(h.valor_inicial).toFixed(2)}</p></div>
                      <div className="bg-card rounded-lg p-3 text-center"><p className="text-xs text-muted-foreground">Entradas</p><p className="font-semibold text-sm text-green-500">R$ {ent.toFixed(2)}</p></div>
                      <div className="bg-card rounded-lg p-3 text-center"><p className="text-xs text-muted-foreground">Saídas</p><p className="font-semibold text-sm text-destructive">R$ {sai.toFixed(2)}</p></div>
                      <div className="bg-card rounded-lg p-3 text-center"><p className="text-xs text-muted-foreground">Saldo</p><p className="font-bold text-sm text-primary">R$ {saldo.toFixed(2)}</p></div>
                    </div>
                    {movs.length > 0 ? (
                      <div className="space-y-2">{movs.map(m => <MovItem key={m.id} m={m} caixaAberto={false} />)}</div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-2">Sem movimentações</p>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </div>
    );
  };

  if (isLoading) return <Layout><p className="text-center text-muted-foreground py-12">Carregando...</p></Layout>;

  // ESTADO 1 — Sem caixa hoje
  if (!caixa) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 w-full max-w-md space-y-6 text-center">
            <Wallet className="h-12 w-12 mx-auto text-primary" />
            <h2 className="text-xl sm:text-2xl font-bold">Abrir Caixa do Dia</h2>
            <p className="text-muted-foreground text-sm">Informe o valor inicial para começar o dia.</p>
            <div className="space-y-2 text-left">
              <Label>Valor inicial em caixa (R$)</Label>
              <Input type="number" min="0" step="0.01" value={valorInicial} onChange={e => setValorInicial(e.target.value)} placeholder="0,00" />
            </div>
            <Button className="w-full" onClick={handleAbrirCaixa} disabled={saving}>{saving ? 'Abrindo...' : 'Abrir Caixa'}</Button>
          </div>
        </div>
        <HistoricoSection />
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

          <div className="bg-card border border-border rounded-xl p-6 text-center space-y-3">
            <Lock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Caixa encerrado.</p>
            <Button variant="outline" onClick={handleReabrirCaixa} disabled={saving}>
              <Unlock className="h-4 w-4 mr-2" /> Reabrir Caixa
            </Button>
          </div>

          {movimentacoes.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Movimentações do dia</h3>
              {movimentacoes.map(m => <MovItem key={m.id} m={m} caixaAberto={false} />)}
            </div>
          )}
          <HistoricoSection />
        </div>
        <PinDialog open={pinOpen} onOpenChange={setPinOpen} onConfirm={() => { if (pinAction) pinAction(); }} />
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

        {/* Add mov dialog */}
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

        {/* Edit mov dialog */}
        <Dialog open={editMovOpen} onOpenChange={v => { if (!v) { setEditMovOpen(false); setEditMovId(null); } }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Editar Descrição</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input value={editMovDescricao} onChange={e => setEditMovDescricao(e.target.value)} />
              </div>
              <Button className="w-full" onClick={handleSaveEditMov} disabled={!editMovDescricao || saving}>
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete mov confirm */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Movimentação?</AlertDialogTitle>
              <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteMov}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Movimentações</h3>
          {movimentacoes.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6">Nenhuma movimentação registrada.</p>
          ) : movimentacoes.map(m => <MovItem key={m.id} m={m} caixaAberto onEdit={handleEditMov} onDelete={handleDeleteMov} />)}
        </div>

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
                  O saldo atual é <strong className="text-foreground">R$ {saldoAtual.toFixed(2)}</strong>. Após fechar, não será possível adicionar novas movimentações.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleFecharCaixa}>Confirmar Fechamento</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <HistoricoSection />
      </div>
      <PinDialog open={pinOpen} onOpenChange={setPinOpen} onConfirm={() => { if (pinAction) pinAction(); }} />
    </Layout>
  );
}
