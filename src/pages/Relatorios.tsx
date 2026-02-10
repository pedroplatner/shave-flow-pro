import { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, DollarSign, Users, Scissors } from 'lucide-react';
import StatCard from '@/components/StatCard';
import { mockAtendimentos, mockBarbeiros } from '@/data/mock';

const periodos = [
  { label: 'Hoje', value: '1' },
  { label: '3 dias', value: '3' },
  { label: '7 dias', value: '7' },
  { label: '30 dias', value: '30' },
];

export default function Relatorios() {
  const [periodo, setPeriodo] = useState('7');
  const [barbeiro, setBarbeiro] = useState('todos');

  const receitaTotal = mockAtendimentos.reduce((acc, a) => acc + a.total, 0);
  const totalAtendimentos = mockAtendimentos.length;
  const comissaoTotal = receitaTotal * 0.4;

  const exportCSV = () => {
    const header = 'Data,Cliente,Barbeiro,Serviços,Pagamento,Total\n';
    const rows = mockAtendimentos.map(a =>
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Relatórios</h2>
            <p className="text-muted-foreground mt-1 font-body">Analise o desempenho da sua barbearia</p>
          </div>
          <Button variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />Exportar CSV
          </Button>
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
                {mockAtendimentos.map(a => (
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
