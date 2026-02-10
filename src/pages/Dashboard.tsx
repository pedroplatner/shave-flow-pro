import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import { DollarSign, TrendingUp, Calendar, Users, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = [
  { day: 'Seg', receita: 850 },
  { day: 'Ter', receita: 1200 },
  { day: 'Qua', receita: 980 },
  { day: 'Qui', receita: 1450 },
  { day: 'Sex', receita: 1800 },
  { day: 'Sáb', receita: 2200 },
  { day: 'Dom', receita: 400 },
];

const recentAtendimentos = [
  { id: 1, cliente: 'João Silva', barbeiro: 'Carlos', servico: 'Corte + Barba', valor: 75, hora: '14:30' },
  { id: 2, cliente: 'Pedro Santos', barbeiro: 'Rafael', servico: 'Corte', valor: 45, hora: '13:15' },
  { id: 3, cliente: 'Lucas Oliveira', barbeiro: 'Carlos', servico: 'Barba', valor: 35, hora: '12:00' },
  { id: 4, cliente: 'Marcos Lima', barbeiro: 'André', servico: 'Corte + Sobrancelha', valor: 60, hora: '11:30' },
  { id: 5, cliente: 'Gabriel Costa', barbeiro: 'Rafael', servico: 'Corte', valor: 45, hora: '10:00' },
];

const alertasEstoque = [
  { produto: 'Pomada Modeladora', quantidade: 2, minimo: 5 },
  { produto: 'Shampoo Profissional', quantidade: 1, minimo: 3 },
];

export default function Dashboard() {
  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-1 font-body">Visão geral da sua barbearia</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Receita Hoje" value="R$ 580" icon={DollarSign} change="+12% vs ontem" positive />
          <StatCard title="Receita Semanal" value="R$ 8.880" icon={TrendingUp} change="+8% vs semana anterior" positive />
          <StatCard title="Receita Mensal" value="R$ 32.450" icon={Calendar} change="+15% vs mês anterior" positive />
          <StatCard title="Barbeiros Ativos" value="4" icon={Users} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 bg-card rounded-xl border border-border p-6 animate-fade-in">
            <h3 className="text-lg font-semibold mb-6">Faturamento — Últimos 7 dias</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={v => `R$${v}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                  }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Receita']}
                />
                <Bar dataKey="receita" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 animate-fade-in">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Alertas de Estoque
            </h3>
            <div className="space-y-3">
              {alertasEstoque.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{item.produto}</p>
                    <p className="text-xs text-muted-foreground font-body">Mínimo: {item.minimo}</p>
                  </div>
                  <span className="text-danger font-bold text-lg">{item.quantidade}</span>
                </div>
              ))}
              {alertasEstoque.length === 0 && (
                <p className="text-sm text-muted-foreground font-body">Nenhum alerta no momento.</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border animate-fade-in">
          <div className="p-6 pb-0">
            <h3 className="text-lg font-semibold">Atendimentos Recentes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Hora</th>
                  <th className="text-left py-3 px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Cliente</th>
                  <th className="text-left py-3 px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Barbeiro</th>
                  <th className="text-left py-3 px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Serviço</th>
                  <th className="text-right py-3 px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Valor</th>
                </tr>
              </thead>
              <tbody>
                {recentAtendimentos.map(a => (
                  <tr key={a.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-6 text-sm font-body">{a.hora}</td>
                    <td className="py-3 px-6 text-sm font-medium">{a.cliente}</td>
                    <td className="py-3 px-6 text-sm font-body">{a.barbeiro}</td>
                    <td className="py-3 px-6 text-sm font-body">{a.servico}</td>
                    <td className="py-3 px-6 text-sm text-right font-semibold">R$ {a.valor}</td>
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
