import { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, DollarSign, Users, Scissors, FileText, TrendingDown, TrendingUp, Package, ShoppingCart } from 'lucide-react';
import StatCard from '@/components/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAtendimentos, useBarbeiros, useProdutos, useCaixaHistorico, useCaixaMovimentacoesByCaixaIds } from '@/hooks/useBarbershop';
import jsPDF from 'jspdf';

const periodos = [
  { label: 'Hoje', value: '1' },
  { label: '7 dias', value: '7' },
  { label: '30 dias', value: '30' },
  { label: '90 dias', value: '90' },
];

function getQtdProdutos(produtos: string[]): number {
  return produtos.reduce((acc, p) => {
    const match = p.match(/x(\d+)$/);
    return acc + (match ? parseInt(match[1]) : 1);
  }, 0);
}

function getProdutoNome(p: string): string {
  return p.replace(/\s*x\d+$/, '').trim();
}

export default function Relatorios() {
  const { data: atendimentos = [] } = useAtendimentos();
  const { data: barbeiros = [] } = useBarbeiros();
  const { data: produtos = [] } = useProdutos();
  const { data: historicoCaixas = [] } = useCaixaHistorico();
  const histIds = historicoCaixas.map(h => h.id);
  const { data: allHistMovs = [] } = useCaixaMovimentacoesByCaixaIds(histIds);

  const [periodo, setPeriodo] = useState('30');
  const [barbeiro, setBarbeiro] = useState('todos');

  const now = new Date();
  const filteredAtendimentos = atendimentos.filter(a => {
    const diffDays = (now.getTime() - new Date(a.data).getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > Number(periodo)) return false;
    if (barbeiro !== 'todos') {
      const barbeiroNome = barbeiros.find(b => b.id === barbeiro)?.nome;
      if (a.barbeiro !== barbeiroNome) return false;
    }
    return true;
  });

  const receitaTotal = filteredAtendimentos.reduce((acc, a) => acc + Number(a.total), 0);
  const totalAtendimentos = filteredAtendimentos.length;
  const ticketMedio = totalAtendimentos > 0 ? receitaTotal / totalAtendimentos : 0;

  // Comissões
  const comissaoTotal = filteredAtendimentos.reduce((acc, a) => {
    const barb = barbeiros.find(b => b.nome === a.barbeiro);
    const comServicos = Number(a.total) * (barb?.comissao || 40) / 100;
    const qtdProd = getQtdProdutos(a.produtos as string[]);
    return acc + comServicos + qtdProd * 5;
  }, 0);

  // Saídas manuais do caixa no período
  const saidasCaixa = allHistMovs
    .filter(m => m.tipo === 'saida' && m.origem === 'manual')
    .filter(m => {
      const diffDays = (now.getTime() - new Date(m.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= Number(periodo);
    })
    .reduce((s, m) => s + Number(m.valor), 0);

  const lucroReal = receitaTotal - comissaoTotal - saidasCaixa;

  // Chart: last 6 months
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const monthAtends = atendimentos.filter(a => { const dt = new Date(a.data); return dt >= d && dt <= end; });
    const rec = monthAtends.reduce((s, a) => s + Number(a.total), 0);
    const com = monthAtends.reduce((s, a) => {
      const b = barbeiros.find(bb => bb.nome === a.barbeiro);
      return s + Number(a.total) * (b?.comissao || 40) / 100 + getQtdProdutos(a.produtos as string[]) * 5;
    }, 0);
    return { mes: d.toLocaleDateString('pt-BR', { month: 'short' }), Receita: rec, Lucro: rec - com };
  });

  // Breakdown pagamento
  const pagamentos: Record<string, number> = {};
  filteredAtendimentos.forEach(a => { pagamentos[a.forma_pagamento] = (pagamentos[a.forma_pagamento] || 0) + Number(a.total); });

  // Barbeiros tab
  const comissoesPorBarbeiro = barbeiros.map(b => {
    const atends = filteredAtendimentos.filter(a => a.barbeiro === b.nome);
    const receita = atends.reduce((s, a) => s + Number(a.total), 0);
    const comServicos = atends.reduce((s, a) => s + Number(a.total) * (b.comissao || 40) / 100, 0);
    const qtdProd = atends.reduce((s, a) => s + getQtdProdutos(a.produtos as string[]), 0);
    const comProdutos = qtdProd * 5;
    const ticket = atends.length > 0 ? receita / atends.length : 0;
    return { nome: b.nome, atendimentos: atends.length, receita, ticket, comServicos, comProdutos, total: comServicos + comProdutos };
  }).filter(b => b.atendimentos > 0);

  // Produtos tab
  const produtoVendas: Record<string, { nome: string; qtd: number; receita: number }> = {};
  filteredAtendimentos.forEach(a => {
    (a.produtos as string[]).forEach(p => {
      const match = p.match(/x(\d+)$/);
      const qtd = match ? parseInt(match[1]) : 1;
      const nome = getProdutoNome(p);
      if (!produtoVendas[nome]) produtoVendas[nome] = { nome, qtd: 0, receita: 0 };
      produtoVendas[nome].qtd += qtd;
      const prod = produtos.find(x => x.nome === nome);
      produtoVendas[nome].receita += (prod ? Number(prod.preco) : 0) * qtd;
    });
  });
  const produtosList = Object.values(produtoVendas).sort((a, b) => b.qtd - a.qtd);
  const totalItensVendidos = produtosList.reduce((s, p) => s + p.qtd, 0);
  const receitaProdutos = produtosList.reduce((s, p) => s + p.receita, 0);
  const maisVendido = produtosList[0]?.nome || '—';

  const exportCSV = () => {
    const header = 'Data,Cliente,Barbeiro,Serviços,Pagamento,Total\n';
    const rows = filteredAtendimentos.map(a =>
      `${new Date(a.data).toLocaleDateString('pt-BR')},${a.cliente},${a.barbeiro},"${(a.servicos as string[]).join('; ')}",${a.forma_pagamento},${Number(a.total).toFixed(2)}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'relatorio-barberpro.csv'; link.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      let y = 20;
      pdf.setFontSize(22); pdf.setFont('helvetica', 'bold');
      pdf.text('BarberPro - Relatório', pageWidth / 2, y, { align: 'center' });
      y += 10; pdf.setFontSize(10); pdf.setFont('helvetica', 'normal');
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, y, { align: 'center' });
      y += 12;

      // Comissões por barbeiro
      pdf.setFontSize(14); pdf.setFont('helvetica', 'bold');
      pdf.text('Comissões por Barbeiro', 14, y); y += 8;
      pdf.setFillColor(30, 30, 30); pdf.setTextColor(255);
      pdf.rect(14, y, pageWidth - 28, 8, 'F');
      pdf.setFontSize(8); pdf.setFont('helvetica', 'bold');
      const cols2 = ['Barbeiro', 'Atend.', 'Receita', 'Com. Serv.', 'Com. Prod.', 'Total'];
      const xs = [16, 55, 80, 110, 140, 170];
      cols2.forEach((c, i) => pdf.text(c, xs[i], y + 5.5));
      y += 8; pdf.setTextColor(0); pdf.setFont('helvetica', 'normal');
      comissoesPorBarbeiro.forEach((b, i) => {
        if (i % 2 === 0) { pdf.setFillColor(248); pdf.rect(14, y, pageWidth - 28, 7, 'F'); }
        const vals = [b.nome, String(b.atendimentos), `R$ ${b.receita.toFixed(2)}`, `R$ ${b.comServicos.toFixed(2)}`, `R$ ${b.comProdutos.toFixed(2)}`, `R$ ${b.total.toFixed(2)}`];
        vals.forEach((v, j) => pdf.text(v.substring(0, 22), xs[j], y + 5));
        y += 7;
      });
      pdf.save('relatorio-barberpro.pdf');
    } catch (err) { console.error('Erro PDF:', err); }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Relatórios</h2>
            <p className="text-muted-foreground mt-1 font-body text-sm">Analise o desempenho da sua barbearia</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-2" />CSV</Button>
            <Button variant="outline" size="sm" onClick={exportPDF}><FileText className="h-4 w-4 mr-2" />PDF</Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
          {periodos.map(p => (
            <Button key={p.value} variant={periodo === p.value ? 'default' : 'outline'} size="sm" onClick={() => setPeriodo(p.value)}>{p.label}</Button>
          ))}
          <Select value={barbeiro} onValueChange={setBarbeiro}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Todos os barbeiros" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os barbeiros</SelectItem>
              {barbeiros.map(b => (<SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="financeiro" className="space-y-4">
          <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="barbeiros">Barbeiros</TabsTrigger>
            <TabsTrigger value="produtos">Produtos</TabsTrigger>
          </TabsList>

          {/* ABA FINANCEIRO */}
          <TabsContent value="financeiro" className="space-y-6">
            <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4">
              <StatCard title="Receita Total" value={`R$ ${receitaTotal.toFixed(2)}`} icon={DollarSign} />
              <StatCard title="Comissões" value={`R$ ${comissaoTotal.toFixed(2)}`} icon={Users} />
              <StatCard title="Saídas Caixa" value={`R$ ${saidasCaixa.toFixed(2)}`} icon={TrendingDown} />
              <StatCard title="Lucro Real" value={`R$ ${lucroReal.toFixed(2)}`} icon={TrendingUp} />
              <StatCard title="Ticket Médio" value={`R$ ${ticketMedio.toFixed(2)}`} icon={Scissors} />
            </div>

            {/* Chart 6 months */}
            <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
              <h3 className="text-base font-semibold mb-4">Receita vs Lucro — Últimos 6 meses</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={v => `R$${v}`} width={55} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="Receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Lucro" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Breakdown pagamento */}
            {Object.keys(pagamentos).length > 0 && (
              <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
                <h3 className="text-base font-semibold mb-4">Formas de Pagamento</h3>
                <div className="space-y-2">
                  {Object.entries(pagamentos).sort((a, b) => b[1] - a[1]).map(([forma, valor]) => (
                    <div key={forma} className="flex items-center justify-between bg-muted rounded-lg p-3">
                      <span className="text-sm font-medium">{forma}</span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-primary">R$ {valor.toFixed(2)}</span>
                        <span className="text-xs text-muted-foreground ml-2">({(valor / receitaTotal * 100).toFixed(0)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tabela detalhada */}
            <div className="block sm:hidden space-y-3">
              {filteredAtendimentos.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">Nenhum atendimento encontrado.</p>
              ) : filteredAtendimentos.map(a => (
                <div key={a.id} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{a.cliente || <span className="italic text-muted-foreground">N/I</span>}</span>
                    <span className="font-semibold text-primary text-sm">R$ {Number(a.total).toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>{a.barbeiro} · {(a.servicos as string[]).join(', ')}</p>
                    <p>{new Date(a.data).toLocaleDateString('pt-BR')} · {a.forma_pagamento}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden sm:block bg-card rounded-xl border border-border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 lg:px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Data</th>
                      <th className="text-left py-3 px-4 lg:px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Cliente</th>
                      <th className="text-left py-3 px-4 lg:px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Barbeiro</th>
                      <th className="text-left py-3 px-4 lg:px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Serviços</th>
                      <th className="text-left py-3 px-4 lg:px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Pagamento</th>
                      <th className="text-right py-3 px-4 lg:px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAtendimentos.length === 0 ? (
                      <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Nenhum atendimento encontrado.</td></tr>
                    ) : filteredAtendimentos.map(a => (
                      <tr key={a.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 lg:px-6 text-sm">{new Date(a.data).toLocaleDateString('pt-BR')}</td>
                        <td className="py-3 px-4 lg:px-6 text-sm font-medium">{a.cliente || <span className="italic text-muted-foreground">N/I</span>}</td>
                        <td className="py-3 px-4 lg:px-6 text-sm">{a.barbeiro}</td>
                        <td className="py-3 px-4 lg:px-6 text-sm">{(a.servicos as string[]).join(', ')}</td>
                        <td className="py-3 px-4 lg:px-6 text-sm">{a.forma_pagamento}</td>
                        <td className="py-3 px-4 lg:px-6 text-sm text-right font-semibold">R$ {Number(a.total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* ABA BARBEIROS */}
          <TabsContent value="barbeiros" className="space-y-6">
            {comissoesPorBarbeiro.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">Nenhum atendimento no período.</p>
            ) : (
              <>
                {/* Mobile */}
                <div className="block sm:hidden space-y-3">
                  {comissoesPorBarbeiro.map(b => (
                    <div key={b.nome} className="bg-card rounded-xl border border-border p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">{b.nome}</span>
                        <span className="font-bold text-primary">R$ {b.total.toFixed(2)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <p>{b.atendimentos} atend.</p>
                        <p>Receita: R$ {b.receita.toFixed(2)}</p>
                        <p>Ticket: R$ {b.ticket.toFixed(2)}</p>
                        <p>Serv.: R$ {b.comServicos.toFixed(2)}</p>
                        <p>Prod.: R$ {b.comProdutos.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop */}
                <div className="hidden sm:block bg-card rounded-xl border border-border">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Barbeiro</th>
                          <th className="text-center py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Atend.</th>
                          <th className="text-right py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Receita</th>
                          <th className="text-right py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Ticket Médio</th>
                          <th className="text-right py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Com. Serv. (%)</th>
                          <th className="text-right py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Com. Prod. (R$5)</th>
                          <th className="text-right py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Total a Pagar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comissoesPorBarbeiro.map(b => (
                          <tr key={b.nome} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                            <td className="py-3 px-4 text-sm font-medium">{b.nome}</td>
                            <td className="py-3 px-4 text-sm text-center">{b.atendimentos}</td>
                            <td className="py-3 px-4 text-sm text-right">R$ {b.receita.toFixed(2)}</td>
                            <td className="py-3 px-4 text-sm text-right">R$ {b.ticket.toFixed(2)}</td>
                            <td className="py-3 px-4 text-sm text-right">R$ {b.comServicos.toFixed(2)}</td>
                            <td className="py-3 px-4 text-sm text-right">R$ {b.comProdutos.toFixed(2)}</td>
                            <td className="py-3 px-4 text-sm text-right font-bold text-primary">R$ {b.total.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Fechamento card */}
                <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
                  <h3 className="font-semibold mb-3">Fechamento — Valor a Pagar</h3>
                  <div className="space-y-2">
                    {comissoesPorBarbeiro.map(b => (
                      <div key={b.nome} className="flex items-center justify-between bg-muted rounded-lg p-3">
                        <span className="text-sm font-medium">{b.nome}</span>
                        <span className="text-sm font-bold text-primary">R$ {b.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* ABA PRODUTOS */}
          <TabsContent value="produtos" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <StatCard title="Itens Vendidos" value={String(totalItensVendidos)} icon={ShoppingCart} />
              <StatCard title="Receita Produtos" value={`R$ ${receitaProdutos.toFixed(2)}`} icon={Package} />
              <StatCard title="Mais Vendido" value={maisVendido} icon={TrendingUp} />
            </div>

            {produtosList.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">Nenhum produto vendido no período.</p>
            ) : (
              <>
                {/* Mobile */}
                <div className="block sm:hidden space-y-3">
                  {produtosList.map(p => {
                    const prod = produtos.find(x => x.nome === p.nome);
                    const custoUnit = Number((prod as any)?.custo || 0);
                    const custoTotal = custoUnit * p.qtd;
                    const margem = p.receita > 0 && custoUnit > 0 ? ((p.receita - custoTotal) / p.receita * 100) : 0;
                    return (
                      <div key={p.nome} className="bg-card rounded-xl border border-border p-4">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-sm">{p.nome}</span>
                          <span className="font-bold text-primary text-sm">R$ {p.receita.toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <p>{p.qtd} vendidos · Custo: R$ {custoTotal.toFixed(2)} · Margem: {custoUnit > 0 ? `${margem.toFixed(0)}%` : '—'}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Desktop */}
                <div className="hidden sm:block bg-card rounded-xl border border-border">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Produto</th>
                          <th className="text-center py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Qtd Vendida</th>
                          <th className="text-right py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Receita</th>
                          <th className="text-right py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Custo Total</th>
                          <th className="text-right py-3 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Margem</th>
                        </tr>
                      </thead>
                      <tbody>
                        {produtosList.map(p => {
                          const prod = produtos.find(x => x.nome === p.nome);
                          const custoUnit = Number((prod as any)?.custo || 0);
                          const custoTotal = custoUnit * p.qtd;
                          const margem = p.receita > 0 && custoUnit > 0 ? ((p.receita - custoTotal) / p.receita * 100) : 0;
                          const margemColor = custoUnit === 0 ? '' : margem > 40 ? 'text-green-500' : margem >= 20 ? 'text-yellow-500' : 'text-destructive';
                          return (
                            <tr key={p.nome} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                              <td className="py-3 px-4 text-sm font-medium">{p.nome}</td>
                              <td className="py-3 px-4 text-sm text-center">{p.qtd}</td>
                              <td className="py-3 px-4 text-sm text-right font-semibold">R$ {p.receita.toFixed(2)}</td>
                              <td className="py-3 px-4 text-sm text-right">{custoUnit > 0 ? `R$ ${custoTotal.toFixed(2)}` : '—'}</td>
                              <td className={`py-3 px-4 text-sm text-right font-semibold ${margemColor}`}>{custoUnit > 0 ? `${margem.toFixed(0)}%` : '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
