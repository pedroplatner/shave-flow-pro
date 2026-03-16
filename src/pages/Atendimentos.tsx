import { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Minus, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useBarbeiros, useServicos, useAtendimentos, useBarbershopId, useProdutos, useCaixaDiario, useComandas } from '@/hooks/useBarbershop';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import PinDialog from '@/components/PinDialog';

interface ProdutoSelecionado {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
}

const BARBER_COLORS = [
  'hsl(var(--primary))',
  'hsl(210, 70%, 50%)',
  'hsl(140, 60%, 40%)',
  'hsl(270, 60%, 55%)',
  'hsl(350, 65%, 50%)',
  'hsl(30, 80%, 50%)',
  'hsl(180, 60%, 40%)',
  'hsl(320, 60%, 50%)',
];

function getBarberColor(index: number) {
  return BARBER_COLORS[index % BARBER_COLORS.length];
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function getWeekDays(refDate: Date) {
  const d = new Date(refDate);
  const day = d.getDay();
  const sun = new Date(d);
  sun.setDate(d.getDate() - day);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const dd = new Date(sun);
    dd.setDate(sun.getDate() + i);
    days.push(dd);
  }
  return days;
}

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function Atendimentos() {
  const { data: barbeiros = [] } = useBarbeiros();
  const { data: servicos = [] } = useServicos();
  const { data: atendimentos = [] } = useAtendimentos();
  const { data: produtos = [] } = useProdutos();
  const { data: bsId } = useBarbershopId();
  const { data: caixaHoje } = useCaixaDiario();
  const queryClient = useQueryClient();

  const [dataSelecionada, setDataSelecionada] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const { data: comandas = [] } = useComandas(bsId, dataSelecionada);

  // Detail view
  const [barbeiroDetalhe, setBarbeiroDetalhe] = useState<any>(null);

  // Sheet (new atendimento)
  const [open, setOpen] = useState(false);
  const [preSelectedBarbeiro, setPreSelectedBarbeiro] = useState<string | null>(null);
  const [cliente, setCliente] = useState('');
  const [barbeiro, setBarbeiro] = useState('');
  const [servicosSel, setServicosSel] = useState<string[]>([]);
  const [produtosSel, setProdutosSel] = useState<ProdutoSelecionado[]>([]);
  const [produtoSelect, setProdutoSelect] = useState('');
  const [pagamento, setPagamento] = useState('');
  const [obs, setObs] = useState('');
  const [saving, setSaving] = useState(false);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editCliente, setEditCliente] = useState('');
  const [editBarbeiro, setEditBarbeiro] = useState('');
  const [editServicos, setEditServicos] = useState<string[]>([]);
  const [editPagamento, setEditPagamento] = useState('');
  const [editObs, setEditObs] = useState('');

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // PIN
  const [pinOpen, setPinOpen] = useState(false);
  const [pinAction, setPinAction] = useState<(() => void) | null>(null);

  const weekDays = useMemo(() => getWeekDays(new Date(dataSelecionada + 'T12:00:00')), [dataSelecionada]);
  const hoje = new Date().toISOString().split('T')[0];

  // Filter atendimentos by selected date
  const atendDoDia = useMemo(() => {
    return atendimentos.filter(a => {
      const ad = new Date(a.data).toISOString().split('T')[0];
      return ad === dataSelecionada;
    });
  }, [atendimentos, dataSelecionada]);

  const barbeirosAtivos = barbeiros.filter(b => b.ativo);

  // Group atendimentos by barbeiro
  const atendPorBarbeiro = useMemo(() => {
    const map: Record<string, typeof atendDoDia> = {};
    barbeirosAtivos.forEach(b => { map[b.nome] = []; });
    atendDoDia.forEach(a => {
      if (!map[a.barbeiro]) map[a.barbeiro] = [];
      map[a.barbeiro].push(a);
    });
    return map;
  }, [atendDoDia, barbeirosAtivos]);

  // Comanda status helper
  const getComandaStatus = (barbeiroId: string) => {
    // Past dates: always treated as closed
    if (dataSelecionada < hoje) return 'fechada';
    const c = comandas.find(c => c.barbeiro_id === barbeiroId);
    return c?.status || 'aberta';
  };

  // Totals
  const totalAtendDia = atendDoDia.length;
  const totalReceitaDia = atendDoDia.reduce((s, a) => s + Number(a.total), 0);
  const comandasAbertas = barbeirosAtivos.filter(b => getComandaStatus(b.id) === 'aberta').length;
  const comandasFechadas = barbeirosAtivos.filter(b => {
    const c = comandas.find(cm => cm.barbeiro_id === b.id);
    return c?.status === 'fechada';
  }).length;

  // ── Form logic ──
  const totalServicos = servicosSel.reduce((acc, sName) => {
    const s = servicos.find(x => x.nome === sName);
    return acc + (s ? Number(s.preco) : 0);
  }, 0);
  const totalProdutos = produtosSel.reduce((acc, p) => acc + p.preco * p.quantidade, 0);
  const total = totalServicos + totalProdutos;
  const qtdProdutosTotal = produtosSel.reduce((acc, p) => acc + p.quantidade, 0);
  const comissaoProdutos = qtdProdutosTotal * 5;

  const editTotal = editServicos.reduce((acc, sName) => {
    const s = servicos.find(x => x.nome === sName);
    return acc + (s ? Number(s.preco) : 0);
  }, 0);

  const toggleServico = (nome: string) => setServicosSel(prev => prev.includes(nome) ? prev.filter(x => x !== nome) : [...prev, nome]);
  const toggleEditServico = (nome: string) => setEditServicos(prev => prev.includes(nome) ? prev.filter(x => x !== nome) : [...prev, nome]);

  const addProduto = () => {
    if (!produtoSelect) return;
    const prod = produtos.find(p => p.id === produtoSelect);
    if (!prod) return;
    setProdutosSel(prev => {
      const existing = prev.find(p => p.id === prod.id);
      if (existing) return prev.map(p => p.id === prod.id ? { ...p, quantidade: p.quantidade + 1 } : p);
      return [...prev, { id: prod.id, nome: prod.nome, preco: Number(prod.preco), quantidade: 1 }];
    });
    setProdutoSelect('');
  };
  const updateProdutoQtd = (id: string, delta: number) => {
    setProdutosSel(prev => prev.map(p => p.id === id ? { ...p, quantidade: Math.max(1, p.quantidade + delta) } : p));
  };
  const removeProduto = (id: string) => setProdutosSel(prev => prev.filter(p => p.id !== id));

  const handleSubmit = async () => {
    if (!bsId) return;
    setSaving(true);
    const barbeiroNome = barbeiros.find(b => b.id === barbeiro)?.nome || '';
    const produtosArray = produtosSel.map(p => p.quantidade > 1 ? `${p.nome} x${p.quantidade}` : p.nome);

    const { error } = await supabase.from('atendimentos').insert({
      barbershop_id: bsId, cliente: cliente || '', barbeiro: barbeiroNome,
      servicos: servicosSel, produtos: produtosArray, forma_pagamento: pagamento, total, observacoes: obs,
    });

    for (const p of produtosSel) {
      await supabase.from('produtos').update({
        quantidade: Math.max(0, (produtos.find(x => x.id === p.id)?.quantidade || 0) - p.quantidade),
      }).eq('id', p.id);
    }

    if (caixaHoje && caixaHoje.status === 'aberto') {
      const descCaixa = `Atendimento - ${barbeiroNome}${cliente ? ` / ${cliente}` : ''}`;
      await supabase.from('caixa_movimentacoes').insert({
        caixa_id: caixaHoje.id, barbershop_id: bsId, tipo: 'entrada',
        descricao: descCaixa, valor: total, origem: 'atendimento',
      });
      queryClient.invalidateQueries({ queryKey: ['caixa_movimentacoes'] });
      queryClient.invalidateQueries({ queryKey: ['caixa_diario'] });
    }

    // Auto-create comanda if not exists
    const bObj = barbeiros.find(b => b.id === barbeiro);
    if (bObj) {
      await supabase.from('comandas').upsert({
        barbershop_id: bsId, barbeiro_id: bObj.id, barbeiro_nome: bObj.nome,
        data: dataSelecionada, status: 'aberta',
      }, { onConflict: 'barbershop_id,barbeiro_id,data', ignoreDuplicates: true });
      queryClient.invalidateQueries({ queryKey: ['comandas'] });
    }

    setSaving(false);
    if (error) { toast.error('Erro ao salvar atendimento'); return; }
    toast.success('Atendimento registrado!');
    queryClient.invalidateQueries({ queryKey: ['atendimentos'] });
    queryClient.invalidateQueries({ queryKey: ['produtos'] });
    setCliente(''); setBarbeiro(''); setServicosSel([]); setProdutosSel([]); setPagamento(''); setObs('');
    setOpen(false); setPreSelectedBarbeiro(null);
  };

  const openNewForBarbeiro = (barbeiroId: string) => {
    setPreSelectedBarbeiro(barbeiroId);
    setBarbeiro(barbeiroId);
    setOpen(true);
  };

  const openEdit = (a: any) => {
    setEditId(a.id); setEditCliente(a.cliente); setEditBarbeiro(a.barbeiro);
    setEditServicos(a.servicos as string[]); setEditPagamento(a.forma_pagamento);
    setEditObs(a.observacoes || ''); setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editId) return;
    setSaving(true);
    const { error } = await supabase.from('atendimentos').update({
      cliente: editCliente, barbeiro: editBarbeiro,
      servicos: editServicos, forma_pagamento: editPagamento, total: editTotal, observacoes: editObs,
    }).eq('id', editId);
    setSaving(false);
    if (error) { toast.error('Erro ao atualizar'); return; }
    toast.success('Atendimento atualizado!');
    queryClient.invalidateQueries({ queryKey: ['atendimentos'] });
    setEditOpen(false); setEditId(null);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('atendimentos').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Atendimento excluído!');
    queryClient.invalidateQueries({ queryKey: ['atendimentos'] });
    setDeleteId(null);
  };

  const withPinVerification = (action: () => void) => {
    const pin = localStorage.getItem('caixa_pin');
    if (pin) {
      setPinAction(() => action);
      setPinOpen(true);
    } else {
      action();
    }
  };

  const fecharComanda = async (barb: any) => {
    if (!bsId) return;
    await supabase.from('comandas').upsert({
      barbershop_id: bsId, barbeiro_id: barb.id, barbeiro_nome: barb.nome,
      data: dataSelecionada, status: 'fechada',
    }, { onConflict: 'barbershop_id,barbeiro_id,data' });
    queryClient.invalidateQueries({ queryKey: ['comandas'] });
    toast.success(`Comanda de ${barb.nome} fechada!`);
  };

  const reabrirComanda = async (barb: any) => {
    if (!bsId) return;
    await supabase.from('comandas').upsert({
      barbershop_id: bsId, barbeiro_id: barb.id, barbeiro_nome: barb.nome,
      data: dataSelecionada, status: 'aberta',
    }, { onConflict: 'barbershop_id,barbeiro_id,data' });
    queryClient.invalidateQueries({ queryKey: ['comandas'] });
    toast.success(`Comanda de ${barb.nome} reaberta!`);
  };

  const navigateMonth = (delta: number) => {
    const d = new Date(dataSelecionada + 'T12:00:00');
    d.setMonth(d.getMonth() + delta);
    setDataSelecionada(d.toISOString().split('T')[0]);
  };

  const servicoCheckList = (selected: string[], toggle: (nome: string) => void) => (
    <>
      {servicos.filter(s => s.ativo).map(s => (
        <label key={s.id} className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors">
          <div className="flex items-center gap-3">
            <Checkbox checked={selected.includes(s.nome)} onCheckedChange={() => toggle(s.nome)} />
            <span className="text-sm font-medium">{s.nome}</span>
          </div>
          <span className="text-sm font-semibold text-primary">R$ {Number(s.preco).toFixed(2)}</span>
        </label>
      ))}
    </>
  );

  const produtosComEstoque = produtos.filter(p => p.quantidade > 0);

  // ═══════════════════════ DETAIL VIEW ═══════════════════════
  if (barbeiroDetalhe) {
    const barb = barbeiroDetalhe;
    const barbAtend = atendPorBarbeiro[barb.nome] || [];
    const barbIdx = barbeirosAtivos.findIndex(b => b.id === barb.id);
    const status = getComandaStatus(barb.id);
    const receitaServicos = barbAtend.reduce((s, a) => {
      return s + (a.servicos as string[]).reduce((ss, sn) => {
        const sv = servicos.find(x => x.nome === sn);
        return ss + (sv ? Number(sv.preco) : 0);
      }, 0);
    }, 0);
    const receitaProdutos = barbAtend.reduce((s, a) => s + Number(a.total), 0) - receitaServicos;
    const receitaTotal = barbAtend.reduce((s, a) => s + Number(a.total), 0);
    const ticketMedio = barbAtend.length > 0 ? receitaTotal / barbAtend.length : 0;
    const qtdProdBarbeiro = barbAtend.reduce((s, a) => {
      return s + (a.produtos as string[]).reduce((ps, pn) => {
        const match = pn.match(/x(\d+)$/);
        return ps + (match ? parseInt(match[1]) : 1);
      }, 0);
    }, 0);
    const comissaoEstimada = (receitaServicos * barb.comissao / 100) + (qtdProdBarbeiro * 5);

    // Payment breakdown
    const pagamentosMap: Record<string, number> = {};
    barbAtend.forEach(a => {
      pagamentosMap[a.forma_pagamento] = (pagamentosMap[a.forma_pagamento] || 0) + Number(a.total);
    });

    return (
      <Layout>
        <PinDialog open={pinOpen} onOpenChange={setPinOpen} onConfirm={() => { pinAction?.(); setPinOpen(false); setPinAction(null); }} />

        <div className="space-y-4 sm:space-y-6">
          {/* Header */}
          <button onClick={() => setBarbeiroDetalhe(null)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Voltar para Atendimentos
          </button>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white text-lg sm:text-xl font-bold shrink-0"
              style={{ backgroundColor: getBarberColor(barbIdx) }}>
              {barb.nome.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold truncate">{barb.nome}</h2>
                <Badge variant={status === 'aberta' ? 'default' : 'secondary'}
                  className={status === 'aberta' ? 'bg-green-600 text-white' : ''}>
                  {status === 'aberta' ? 'Comanda Aberta' : 'Fechada'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground capitalize">
                {formatDateLabel(new Date(dataSelecionada + 'T12:00:00'))} · {barb.comissao}% de comissão
              </p>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Atendimentos', value: barbAtend.length },
              { label: 'Receita total', value: `R$ ${receitaTotal.toFixed(2)}`, highlight: true },
              { label: 'Ticket médio', value: `R$ ${ticketMedio.toFixed(2)}` },
              { label: 'Comissão estimada', value: `R$ ${comissaoEstimada.toFixed(2)}`, green: true },
            ].map((s, i) => (
              <Card key={i} className="bg-card border">
                <CardContent className="p-3 sm:p-4">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`text-lg sm:text-xl font-bold mt-1 ${s.highlight ? 'text-primary' : ''} ${s.green ? 'text-green-500' : ''}`}>{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Atendimentos list */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold">Atendimentos do dia</h3>
              {status === 'aberta' && (
                <Button variant="outline" size="sm" className="text-primary border-primary text-xs" onClick={() => openNewForBarbeiro(barb.id)}>
                  <Plus className="h-3 w-3 mr-1" /> Novo Atendimento
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {barbAtend.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Nenhum atendimento registrado.</p>}
              {barbAtend.map((a, idx) => {
                const hora = new Date(a.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                const allItems: { nome: string; tipo: string; preco: number }[] = [];
                (a.servicos as string[]).forEach(sn => {
                  const sv = servicos.find(x => x.nome === sn);
                  allItems.push({ nome: sn, tipo: 'serviço', preco: sv ? Number(sv.preco) : 0 });
                });
                (a.produtos as string[]).forEach(pn => {
                  const match = pn.match(/^(.+?)(?:\s*x(\d+))?$/);
                  const nome = match ? match[1].trim() : pn;
                  const qtd = match && match[2] ? parseInt(match[2]) : 1;
                  const prod = produtos.find(x => x.nome === nome);
                  allItems.push({ nome: pn, tipo: 'produto', preco: prod ? Number(prod.preco) * qtd : 0 });
                });

                return (
                  <Card key={a.id} className="bg-card border">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold shrink-0">{idx + 1}</span>
                          <div className="min-w-0">
                            <span className="font-medium text-sm block truncate">
                              {a.cliente || <span className="italic text-muted-foreground">Cliente não informado</span>}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{hora} · {a.forma_pagamento}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-sm font-semibold text-primary mr-1">R$ {Number(a.total).toFixed(2)}</span>
                          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => openEdit(a)}>Editar</Button>
                          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setDeleteId(a.id)}>Excluir</Button>
                        </div>
                      </div>
                      <div className="space-y-1 ml-8">
                        {allItems.map((item, ii) => (
                          <div key={ii} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span>{item.nome}</span>
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{item.tipo}</Badge>
                            </div>
                            <span>R$ {item.preco.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Financial footer */}
          {barbAtend.length > 0 && (
            <Card className="bg-card border">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Receita serviços</span><span className="font-semibold">R${receitaServicos.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Receita produtos</span><span className="font-semibold">R$ {receitaProdutos.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Formas de pagamento</span>
                  <span className="text-xs text-muted-foreground">{Object.entries(pagamentosMap).map(([k, v]) => `${k} R$${v.toFixed(0)}`).join(' · ')}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between items-center">
                  <span className="font-semibold">Total do dia</span>
                  <span className="text-xl font-bold text-primary">R$ {receitaTotal.toFixed(2)}</span>
                </div>
                <div className="bg-green-950/30 border border-green-800/30 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <span className="text-sm font-medium text-green-400">Comissão a pagar</span>
                    <p className="text-xs text-muted-foreground">Serviços ({barb.comissao}%) + Produtos ({qtdProdBarbeiro} un × R$5)</p>
                  </div>
                  <span className="text-lg font-bold text-green-400">R$ {comissaoEstimada.toFixed(2)}</span>
                </div>
                {status === 'aberta' && (
                  <Button className="w-full mt-2" onClick={() => withPinVerification(() => fecharComanda(barb))}>
                    Fechar Comanda do {barb.nome}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Shared dialogs below */}
        {renderSheetAndDialogs()}
      </Layout>
    );
  }

  // ═══════════════════════ MAIN VIEW ═══════════════════════
  function renderSheetAndDialogs() {
    return (
      <>
        {/* New Atendimento Sheet */}
        <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) setPreSelectedBarbeiro(null); }}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader><SheetTitle>Novo Atendimento</SheetTitle></SheetHeader>
            <div className="space-y-6 mt-6">
              <div className="space-y-2">
                <Label>Nome do Cliente (opcional)</Label>
                <Input placeholder="Nome do cliente (opcional)" value={cliente} onChange={e => setCliente(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Barbeiro</Label>
                <Select value={barbeiro} onValueChange={setBarbeiro} disabled={!!preSelectedBarbeiro}>
                  <SelectTrigger><SelectValue placeholder="Selecione o barbeiro" /></SelectTrigger>
                  <SelectContent>{barbeirosAtivos.map(b => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-3"><Label>Serviços</Label>{servicoCheckList(servicosSel, toggleServico)}</div>
              <div className="space-y-3">
                <Label>Produtos</Label>
                <div className="flex gap-2">
                  <Select value={produtoSelect} onValueChange={setProdutoSelect}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Selecione um produto..." /></SelectTrigger>
                    <SelectContent>
                      {produtosComEstoque.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.nome} — R$ {Number(p.preco).toFixed(2)} (estoque: {p.quantidade})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" onClick={addProduto} disabled={!produtoSelect}>Adicionar</Button>
                </div>
                {produtosSel.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">Nenhum produto adicionado</p>
                ) : (
                  <div className="space-y-2">
                    {produtosSel.map(p => (
                      <div key={p.id} className="flex items-center justify-between bg-muted rounded-lg p-3 gap-2">
                        <span className="text-sm font-medium truncate flex-1">{p.nome}</span>
                        <div className="flex items-center gap-1">
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateProdutoQtd(p.id, -1)}><Minus className="h-3 w-3" /></Button>
                          <span className="text-sm font-semibold w-6 text-center">{p.quantidade}</span>
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateProdutoQtd(p.id, 1)}><Plus className="h-3 w-3" /></Button>
                        </div>
                        <span className="text-sm font-semibold text-primary w-20 text-right">R$ {(p.preco * p.quantidade).toFixed(2)}</span>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeProduto(p.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    ))}
                  </div>
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
              <div className="space-y-2"><Label>Observações</Label><Textarea placeholder="Observações opcionais..." value={obs} onChange={e => setObs(e.target.value)} /></div>
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-2xl font-bold text-primary">R$ {total.toFixed(2)}</span>
                </div>
                {produtosSel.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    + R$ {comissaoProdutos.toFixed(2)} comissão produtos ({qtdProdutosTotal} un. × R$ 5,00)
                  </p>
                )}
              </div>
              <Button className="w-full" onClick={handleSubmit} disabled={!barbeiro || servicosSel.length === 0 || !pagamento || saving}>
                {saving ? 'Salvando...' : 'Finalizar Atendimento'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); if (!v) setEditId(null); }}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader><DialogTitle>Editar Atendimento</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2"><Label>Cliente (opcional)</Label><Input value={editCliente} onChange={e => setEditCliente(e.target.value)} /></div>
              <div className="space-y-2"><Label>Barbeiro</Label><Input value={editBarbeiro} onChange={e => setEditBarbeiro(e.target.value)} /></div>
              <div className="space-y-3"><Label>Serviços</Label>{servicoCheckList(editServicos, toggleEditServico)}</div>
              <div className="space-y-2">
                <Label>Pagamento</Label>
                <Select value={editPagamento} onValueChange={setEditPagamento}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="Pix">Pix</SelectItem>
                    <SelectItem value="Cartão Débito">Cartão Débito</SelectItem>
                    <SelectItem value="Cartão Crédito">Cartão Crédito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Observações</Label><Textarea value={editObs} onChange={e => setEditObs(e.target.value)} /></div>
              <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-2xl font-bold text-primary">R$ {editTotal.toFixed(2)}</span>
              </div>
              <Button className="w-full" onClick={handleUpdate} disabled={saving}>{saving ? 'Salvando...' : 'Salvar Alterações'}</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete AlertDialog */}
        <AlertDialog open={!!deleteId} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir atendimento?</AlertDialogTitle>
              <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <PinDialog open={pinOpen} onOpenChange={setPinOpen} onConfirm={() => { pinAction?.(); setPinOpen(false); setPinAction(null); }} />
      </>
    );
  }

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Atendimentos</h2>
          <p className="text-muted-foreground mt-1 text-sm">Registre e gerencie os atendimentos do dia</p>
        </div>

        {/* BLOCO 1 — Calendário semanal */}
        <Card className="bg-card border">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateMonth(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <p className="text-xs text-muted-foreground capitalize">
                {new Date(dataSelecionada + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </p>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateMonth(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {weekDays.map((d, i) => {
                const ds = d.toISOString().split('T')[0];
                const isSelected = ds === dataSelecionada;
                const isToday = ds === hoje;
                return (
                  <button key={i} onClick={() => setDataSelecionada(ds)}
                    className="flex flex-col items-center gap-0.5 py-1 rounded-lg transition-colors hover:bg-muted">
                    <span className="text-[10px] text-muted-foreground">{DAY_LABELS[i]}</span>
                    <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-colors
                      ${isToday && isSelected ? 'bg-primary text-primary-foreground' : isToday ? 'ring-2 ring-primary text-primary' : isSelected ? 'bg-muted-foreground/20' : ''}`}>
                      {d.getDate()}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* BLOCO 2 — Profissionais */}
        <Card className="bg-card border">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-4 overflow-x-auto pb-1">
              {barbeirosAtivos.map((b, i) => (
                <button key={b.id} onClick={() => setBarbeiroDetalhe(b)}
                  className="flex flex-col items-center gap-1 group shrink-0">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold transition-transform group-hover:scale-110 group-hover:ring-2 group-hover:ring-primary"
                    style={{ backgroundColor: getBarberColor(i) }}>
                    {b.nome.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[50px]">{b.nome}</span>
                </button>
              ))}
              <button onClick={() => window.location.href = '/barbeiros'}
                className="flex flex-col items-center gap-1 shrink-0 group">
                <div className="w-9 h-9 rounded-full border-2 border-dashed border-muted-foreground/40 flex items-center justify-center text-muted-foreground group-hover:border-primary group-hover:text-primary transition-colors">
                  <Plus className="h-4 w-4" />
                </div>
                <span className="text-[10px] text-muted-foreground">novo</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* BLOCO 3 — Resumo */}
        <Card className="bg-card border">
          <CardContent className="p-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border">
              {[
                { label: 'Total atend.', value: totalAtendDia },
                { label: 'Receita total', value: `R$ ${totalReceitaDia.toFixed(2)}`, primary: true },
                { label: 'Cmd. abertas', value: comandasAbertas },
                { label: 'Cmd. fechadas', value: comandasFechadas },
              ].map((item, i) => (
                <div key={i} className="p-3 sm:p-4 text-center">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{item.label}</p>
                  <p className={`text-lg sm:text-xl font-bold mt-0.5 ${item.primary ? 'text-primary' : ''}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* BLOCO 4 — Cards por barbeiro */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {barbeirosAtivos.map((barb, bIdx) => {
            const bAtend = atendPorBarbeiro[barb.nome] || [];
            const status = getComandaStatus(barb.id);
            const subtotal = bAtend.reduce((s, a) => s + Number(a.total), 0);
            const isFechada = status === 'fechada';

            return (
              <Card key={barb.id} className={`bg-card border ${isFechada ? 'opacity-60' : ''}`}>
                {/* Card header */}
                <div className="px-3 py-2.5 border-b border-border">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: getBarberColor(bIdx) }}>
                        {barb.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="font-medium text-sm truncate block">{barb.nome}</span>
                        <span className="text-[10px] text-muted-foreground">{bAtend.length} atend. · R$ {subtotal.toFixed(2)}</span>
                      </div>
                    </div>
                    <Badge variant={isFechada ? 'secondary' : 'default'}
                      className={`text-[10px] shrink-0 ${!isFechada ? 'bg-green-600 text-white' : ''}`}>
                      {isFechada ? 'Fechada' : 'Aberta'}
                    </Badge>
                  </div>
                  {!isFechada && (
                    <Button variant="outline" size="sm"
                      className="w-full mt-2 text-primary border-primary text-xs h-7"
                      onClick={() => openNewForBarbeiro(barb.id)}>
                      ＋ Novo Atendimento
                    </Button>
                  )}
                </div>

                {/* Card body */}
                <CardContent className="p-2 space-y-1.5">
                  {bAtend.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-3">Sem atendimentos</p>
                  )}
                  {bAtend.map(a => {
                    const hora = new Date(a.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    const svNames = (a.servicos as string[]).join(' + ');
                    const prods = (a.produtos as string[]);
                    const items = prods.length > 0 ? `${svNames} + ${prods.join(', ')}` : svNames;
                    return (
                      <div key={a.id} className={`bg-muted rounded-lg p-2 flex justify-between items-start gap-2 ${isFechada ? 'opacity-40' : ''}`}>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">
                            {a.cliente || <span className="italic text-muted-foreground">Não informado</span>}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">{items} · {hora}</p>
                        </div>
                        <span className="text-xs font-semibold text-primary shrink-0">R$ {Number(a.total).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </CardContent>

                {/* Card footer */}
                <div className="px-3 pb-2.5">
                  {!isFechada ? (
                    <Button variant="outline" size="sm"
                      className="w-full text-primary border-primary text-xs h-8"
                      onClick={() => withPinVerification(() => fecharComanda(barb))}>
                      Fechar Comanda
                    </Button>
                  ) : (
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-border">
                      <span className="text-muted-foreground">Comanda fechada</span>
                      <span className="font-semibold text-primary">R$ {subtotal.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {renderSheetAndDialogs()}
    </Layout>
  );
}
