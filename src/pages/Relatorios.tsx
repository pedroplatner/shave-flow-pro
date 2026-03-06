import { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, DollarSign, Users, Scissors, FileText } from 'lucide-react';
import StatCard from '@/components/StatCard';
import { useAtendimentos, useBarbeiros } from '@/hooks/useBarbershop';
import jsPDF from 'jspdf';

const periodos = [
  { label: 'Hoje', value: '1' },
  { label: '3 dias', value: '3' },
  { label: '7 dias', value: '7' },
  { label: '30 dias', value: '30' },
];

function getQtdProdutos(produtos: string[]): number {
  return produtos.reduce((acc, p) => {
    const match = p.match(/x(\d+)$/);
    return acc + (match ? parseInt(match[1]) : 1);
  }, 0);
}

export default function Relatorios() {
  const { data: atendimentos = [] } = useAtendimentos();
  const { data: barbeiros = [] } = useBarbeiros();
  const [periodo, setPeriodo] = useState('30');
  const [barbeiro, setBarbeiro] = useState('todos');

  const now = new Date();
  const filteredAtendimentos = atendimentos.filter(a => {
    const dataAtend = new Date(a.data);
    const diffDays = (now.getTime() - dataAtend.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > Number(periodo)) return false;
    if (barbeiro !== 'todos') {
      const barbeiroNome = barbeiros.find(b => b.id === barbeiro)?.nome;
      if (a.barbeiro !== barbeiroNome) return false;
    }
    return true;
  });

  const receitaTotal = filteredAtendimentos.reduce((acc, a) => acc + Number(a.total), 0);
  const totalAtendimentos = filteredAtendimentos.length;

  // Comissão com R$5 por produto
  const comissaoTotal = filteredAtendimentos.reduce((acc, a) => {
    const barb = barbeiros.find(b => b.nome === a.barbeiro);
    const comissaoServicos = Number(a.total) * (barb?.comissao || 40) / 100;
    const qtdProd = getQtdProdutos(a.produtos as string[]);
    const comissaoProdutos = qtdProd * 5;
    return acc + comissaoServicos + comissaoProdutos;
  }, 0);

  // Comissões por barbeiro
  const comissoesPorBarbeiro = barbeiros.map(b => {
    const atends = filteredAtendimentos.filter(a => a.barbeiro === b.nome);
    const comServicos = atends.reduce((s, a) => s + Number(a.total) * (b.comissao || 40) / 100, 0);
    const qtdProd = atends.reduce((s, a) => s + getQtdProdutos(a.produtos as string[]), 0);
    const comProdutos = qtdProd * 5;
    return { nome: b.nome, atendimentos: atends.length, comServicos, comProdutos, total: comServicos + comProdutos };
  }).filter(b => b.atendimentos > 0);

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
      const periodoLabel = periodos.find(p => p.value === periodo)?.label || periodo;
      const barbeiroLabel = barbeiro === 'todos' ? 'Todos' : (barbeiros.find(b => b.id === barbeiro)?.nome || 'Todos');
      let y = 20;
      pdf.setFontSize(22); pdf.setFont('helvetica', 'bold');
      pdf.text('BarberPro - Relatório', pageWidth / 2, y, { align: 'center' });
      y += 10; pdf.setFontSize(10); pdf.setFont('helvetica', 'normal');
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, y, { align: 'center' });
      y += 12; pdf.setFontSize(11); pdf.setFont('helvetica', 'bold');
      pdf.text('Filtros:', 14, y); pdf.setFont('helvetica', 'normal');
      pdf.text(`Período: ${periodoLabel}  |  Barbeiro: ${barbeiroLabel}`, 40, y);
      y += 10;
      pdf.setDrawColor(200); pdf.setFillColor(245, 245, 245);
      const cardW = (pageWidth - 42) / 3;
      const cards = [
        { label: 'Receita Total', value: `R$ ${receitaTotal.toFixed(2)}` },
        { label: 'Atendimentos', value: String(totalAtendimentos) },
        { label: 'Comissões', value: `R$ ${comissaoTotal.toFixed(2)}` },
      ];
      cards.forEach((c, i) => {
        const x = 14 + i * (cardW + 7);
        pdf.roundedRect(x, y, cardW, 22, 3, 3, 'FD');
        pdf.setFontSize(9); pdf.setFont('helvetica', 'normal');
        pdf.text(c.label, x + cardW / 2, y + 8, { align: 'center' });
        pdf.setFontSize(14); pdf.setFont('helvetica', 'bold');
        pdf.text(c.value, x + cardW / 2, y + 18, { align: 'center' });
      });
      y += 32; pdf.setFontSize(12); pdf.setFont('helvetica', 'bold');
      pdf.text('Detalhamento', 14, y); y += 8;
      const cols = [
        { label: 'Data', x: 14, w: 25 }, { label: 'Cliente', x: 39, w: 40 },
        { label: 'Barbeiro', x: 79, w: 35 }, { label: 'Serviços', x: 114, w: 45 },
        { label: 'Pgto', x: 159, w: 22 }, { label: 'Total', x: 181, w: 20 },
      ];
      pdf.setFillColor(30, 30, 30); pdf.setTextColor(255);
      pdf.rect(14, y, pageWidth - 28, 8, 'F');
      pdf.setFontSize(8); pdf.setFont('helvetica', 'bold');
      cols.forEach(c => pdf.text(c.label, c.x + 2, y + 5.5));
      y += 8; pdf.setTextColor(0); pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
      filteredAtendimentos.forEach((a, i) => {
        if (y > 270) { pdf.addPage(); y = 20; }
        if (i % 2 === 0) { pdf.setFillColor(248, 248, 248); pdf.rect(14, y, pageWidth - 28, 7, 'F'); }
        const row = [
          new Date(a.data).toLocaleDateString('pt-BR'), (a.cliente || 'N/I').substring(0, 22),
          a.barbeiro.substring(0, 18), (a.servicos as string[]).join(', ').substring(0, 24),
          a.forma_pagamento.substring(0, 12), `R$ ${Number(a.total).toFixed(2)}`,
        ];
        row.forEach((val, j) => pdf.text(val, cols[j].x + 2, y + 5));
        y += 7;
      });
      if (filteredAtendimentos.length === 0) pdf.text('Nenhum atendimento encontrado.', 14, y + 5);
      pdf.save('relatorio-barberpro.pdf');
    } catch (err) { console.error('Erro ao gerar PDF:', err); }
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <StatCard title="Receita Total" value={`R$ ${receitaTotal.toFixed(2)}`} icon={DollarSign} />
          <StatCard title="Atendimentos" value={String(totalAtendimentos)} icon={Scissors} />
          <StatCard title="Comissões" value={`R$ ${comissaoTotal.toFixed(2)}`} icon={Users} />
        </div>

        {/* Comissões por barbeiro */}
        {comissoesPorBarbeiro.length > 0 && (
          <div className="bg-card rounded-xl border border-border">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold">Comissões por Barbeiro</h3>
            </div>
            {/* Mobile cards */}
            <div className="block sm:hidden p-3 space-y-3">
              {comissoesPorBarbeiro.map(b => (
                <div key={b.nome} className="bg-muted rounded-lg p-3 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">{b.nome}</span>
                    <span className="font-bold text-primary text-sm">R$ {b.total.toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p>{b.atendimentos} atend. · Serviços: R$ {b.comServicos.toFixed(2)} · Produtos: R$ {b.comProdutos.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 lg:px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Barbeiro</th>
                    <th className="text-center py-3 px-4 lg:px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Atendimentos</th>
                    <th className="text-right py-3 px-4 lg:px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Comissão Serviços (%)</th>
                    <th className="text-right py-3 px-4 lg:px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Comissão Produtos (+R$5)</th>
                    <th className="text-right py-3 px-4 lg:px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {comissoesPorBarbeiro.map(b => (
                    <tr key={b.nome} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 lg:px-6 text-sm font-medium">{b.nome}</td>
                      <td className="py-3 px-4 lg:px-6 text-sm text-center">{b.atendimentos}</td>
                      <td className="py-3 px-4 lg:px-6 text-sm text-right">R$ {b.comServicos.toFixed(2)}</td>
                      <td className="py-3 px-4 lg:px-6 text-sm text-right">R$ {b.comProdutos.toFixed(2)}</td>
                      <td className="py-3 px-4 lg:px-6 text-sm text-right font-bold text-primary">R$ {b.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
        <div className="hidden sm:block bg-card rounded-xl border border-border animate-fade-in">
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
                  <tr><td colSpan={6} className="py-8 text-center text-muted-foreground font-body">Nenhum atendimento encontrado.</td></tr>
                ) : filteredAtendimentos.map(a => (
                  <tr key={a.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 lg:px-6 text-sm font-body">{new Date(a.data).toLocaleDateString('pt-BR')}</td>
                    <td className="py-3 px-4 lg:px-6 text-sm font-medium">{a.cliente || <span className="italic text-muted-foreground">N/I</span>}</td>
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
      </div>
    </Layout>
  );
}
