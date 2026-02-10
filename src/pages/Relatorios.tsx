import { useState, useRef } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, DollarSign, Users, Scissors, FileText } from 'lucide-react';
import StatCard from '@/components/StatCard';
import { mockAtendimentos, mockBarbeiros } from '@/data/mock';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const periodos = [
  { label: 'Hoje', value: '1' },
  { label: '3 dias', value: '3' },
  { label: '7 dias', value: '7' },
  { label: '30 dias', value: '30' },
];

export default function Relatorios() {
  const [periodo, setPeriodo] = useState('30');
  const [barbeiro, setBarbeiro] = useState('todos');
  const reportRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const filteredAtendimentos = mockAtendimentos.filter(a => {
    const dataAtend = new Date(a.data);
    const diffDays = (now.getTime() - dataAtend.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > Number(periodo)) return false;
    if (barbeiro !== 'todos' && a.barbeiro !== mockBarbeiros.find(b => b.id === barbeiro)?.nome) return false;
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

  const exportPDF = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, logging: false, backgroundColor: '#0B0B0B' });
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
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

        <div ref={reportRef}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
      </div>
    </Layout>
  );
}
