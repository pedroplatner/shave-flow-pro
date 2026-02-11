import { useState, useRef } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, DollarSign, Users, Scissors, FileText } from 'lucide-react';
import StatCard from '@/components/StatCard';
import { mockAtendimentos, mockBarbeiros } from '@/data/mock';
import jsPDF from 'jspdf';

const periodos = [
  { label: 'Hoje', value: '1' },
  { label: '3 dias', value: '3' },
  { label: '7 dias', value: '7' },
  { label: '30 dias', value: '30' },
];

export default function Relatorios() {
  const [periodo, setPeriodo] = useState('30');
  const [barbeiro, setBarbeiro] = useState('todos');

  const now = new Date();
  const filteredAtendimentos = mockAtendimentos.filter(a => {
    const dataAtend = new Date(a.data);
    const diffDays = (now.getTime() - dataAtend.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > Number(periodo)) return false;
    if (barbeiro !== 'todos') {
      const barbeiroNome = mockBarbeiros.find(b => b.id === barbeiro)?.nome;
      if (a.barbeiro !== barbeiroNome) return false;
    }
    return true;
  });

  const receitaTotal = filteredAtendimentos.reduce((acc, a) => acc + a.total, 0);
  const totalAtendimentos = filteredAtendimentos.length;
  const comissaoTotal = filteredAtendimentos.reduce((acc, a) => {
    const barb = mockBarbeiros.find(b => b.nome === a.barbeiro);
    return acc + (a.total * (barb?.comissao || 40) / 100);
  }, 0);

  const exportCSV = () => {
    const header = 'Data,Cliente,Barbeiro,Serviços,Pagamento,Total\n';
    const rows = filteredAtendimentos.map(a =>
      `${new Date(a.data).toLocaleDateString('pt-BR')},${a.cliente},${a.barbeiro},"${a.servicos.join('; ')}",${a.formaPagamento},${a.total}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'relatorio-barberpro.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const periodoLabel = periodos.find(p => p.value === periodo)?.label || periodo;
      const barbeiroLabel = barbeiro === 'todos' ? 'Todos' : (mockBarbeiros.find(b => b.id === barbeiro)?.nome || 'Todos');
      let y = 20;

      // Header
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.text('BarberPro - Relatório', pageWidth / 2, y, { align: 'center' });
      y += 10;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, y, { align: 'center' });
      y += 12;

      // Filters
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Filtros:', 14, y);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Período: ${periodoLabel}  |  Barbeiro: ${barbeiroLabel}`, 40, y);
      y += 10;

      // Summary cards
      pdf.setDrawColor(200);
      pdf.setFillColor(245, 245, 245);
      const cardW = (pageWidth - 42) / 3;
      const cards = [
        { label: 'Receita Total', value: `R$ ${receitaTotal.toFixed(2)}` },
        { label: 'Atendimentos', value: String(totalAtendimentos) },
        { label: 'Comissões', value: `R$ ${comissaoTotal.toFixed(2)}` },
      ];
      cards.forEach((c, i) => {
        const x = 14 + i * (cardW + 7);
        pdf.roundedRect(x, y, cardW, 22, 3, 3, 'FD');
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text(c.label, x + cardW / 2, y + 8, { align: 'center' });
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(c.value, x + cardW / 2, y + 18, { align: 'center' });
      });
      y += 32;

      // Table header
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Detalhamento', 14, y);
      y += 8;

      const cols = [
        { label: 'Data', x: 14, w: 25 },
        { label: 'Cliente', x: 39, w: 40 },
        { label: 'Barbeiro', x: 79, w: 35 },
        { label: 'Serviços', x: 114, w: 45 },
        { label: 'Pgto', x: 159, w: 22 },
        { label: 'Total', x: 181, w: 20 },
      ];

      pdf.setFillColor(30, 30, 30);
      pdf.setTextColor(255);
      pdf.rect(14, y, pageWidth - 28, 8, 'F');
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      cols.forEach(c => pdf.text(c.label, c.x + 2, y + 5.5));
      y += 8;
      pdf.setTextColor(0);

      // Table rows
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      filteredAtendimentos.forEach((a, i) => {
        if (y > 270) {
          pdf.addPage();
          y = 20;
        }
        if (i % 2 === 0) {
          pdf.setFillColor(248, 248, 248);
          pdf.rect(14, y, pageWidth - 28, 7, 'F');
        }
        const row = [
          new Date(a.data).toLocaleDateString('pt-BR'),
          a.cliente.substring(0, 22),
          a.barbeiro.substring(0, 18),
          a.servicos.join(', ').substring(0, 24),
          a.formaPagamento.substring(0, 12),
          `R$ ${a.total.toFixed(2)}`,
        ];
        row.forEach((val, j) => pdf.text(val, cols[j].x + 2, y + 5));
        y += 7;
      });

      if (filteredAtendimentos.length === 0) {
        pdf.text('Nenhum atendimento encontrado para os filtros selecionados.', 14, y + 5);
      }

      pdf.save('relatorio-barberpro.pdf');
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Relatórios</h2>
            <p className="text-muted-foreground mt-1 font-body">Analise o desempenho da sua barbearia</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" />CSV
            </Button>
            <Button variant="outline" onClick={exportPDF}>
              <FileText className="h-4 w-4 mr-2" />PDF
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {periodos.map(p => (
            <Button key={p.value} variant={periodo === p.value ? 'default' : 'outline'} size="sm" onClick={() => setPeriodo(p.value)}>
              {p.label}
            </Button>
          ))}
          <Select value={barbeiro} onValueChange={setBarbeiro}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos os barbeiros" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os barbeiros</SelectItem>
              {mockBarbeiros.map(b => (
                <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Receita Total" value={`R$ ${receitaTotal.toFixed(2)}`} icon={DollarSign} />
          <StatCard title="Atendimentos" value={String(totalAtendimentos)} icon={Scissors} />
          <StatCard title="Comissões" value={`R$ ${comissaoTotal.toFixed(2)}`} icon={Users} />
        </div>

        <div className="bg-card rounded-xl border border-border animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Data</th>
                  <th className="text-left py-3 px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Cliente</th>
                  <th className="text-left py-3 px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Barbeiro</th>
                  <th className="text-left py-3 px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Serviços</th>
                  <th className="text-left py-3 px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Pagamento</th>
                  <th className="text-right py-3 px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredAtendimentos.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-muted-foreground font-body">Nenhum atendimento encontrado para os filtros selecionados.</td></tr>
                ) : filteredAtendimentos.map(a => (
                  <tr key={a.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-6 text-sm font-body">{new Date(a.data).toLocaleDateString('pt-BR')}</td>
                    <td className="py-3 px-6 text-sm font-medium">{a.cliente}</td>
                    <td className="py-3 px-6 text-sm font-body">{a.barbeiro}</td>
                    <td className="py-3 px-6 text-sm font-body">{a.servicos.join(', ')}</td>
                    <td className="py-3 px-6 text-sm font-body">{a.formaPagamento}</td>
                    <td className="py-3 px-6 text-sm text-right font-semibold">R$ {a.total.toFixed(2)}</td>
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
