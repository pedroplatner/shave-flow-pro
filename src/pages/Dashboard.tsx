import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import { DollarSign, TrendingUp, Calendar, Users, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { mockAtendimentos, mockBarbeiros, mockProdutos } from '@/data/mock';

export default function Dashboard() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Compute real metrics from atendimentos
  const receitaHoje = mockAtendimentos
    .filter(a => new Date(a.data) >= startOfDay)
    .reduce((acc, a) => acc + a.total, 0);

  const receitaSemanal = mockAtendimentos
    .filter(a => (now.getTime() - new Date(a.data).getTime()) / (1000 * 60 * 60 * 24) <= 7)
    .reduce((acc, a) => acc + a.total, 0);

  const receitaMensal = mockAtendimentos
    .filter(a => (now.getTime() - new Date(a.data).getTime()) / (1000 * 60 * 60 * 24) <= 30)
    .reduce((acc, a) => acc + a.total, 0);

  const barbeirosAtivos = mockBarbeiros.filter(b => b.ativo).length;

  // Chart: last 7 days
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const receita = mockAtendimentos
      .filter(a => { const dt = new Date(a.data); return dt >= dayStart && dt < dayEnd; })
      .reduce((acc, a) => acc + a.total, 0);
    return { day: dias[dayStart.getDay()], receita };
  });

  // Recent atendimentos (sorted by date desc, top 5)
  const recentAtendimentos = [...mockAtendimentos]
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 5);

  // Stock alerts
  const alertasEstoque = mockProdutos.filter(p => p.quantidade <= p.minimo);

  return (
    <Layout>
      <div className="space-y-6 sm:space-y-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-1 font-body text-sm">Visão geral da sua barbearia</p>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <StatCard title="Receita Hoje" value={`R$ ${receitaHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={DollarSign} />
          <StatCard title="Receita Semanal" value={`R$ ${receitaSemanal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={TrendingUp} />
          <StatCard title="Receita Mensal" value={`R$ ${receitaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={Calendar} />
          <StatCard title="Barbeiros Ativos" value={String(barbeirosAtivos)} icon={Users} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 bg-card rounded-xl border border-border p-4 sm:p-6 animate-fade-in">
            <h3 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">Faturamento — Últimos 7 dias</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={v => `R$${v}`} width={55} />
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

          <div className="bg-card rounded-xl border border-border p-4 sm:p-6 animate-fade-in">
            <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Alertas de Estoque
            </h3>
            <div className="space-y-3">
              {alertasEstoque.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{item.nome}</p>
                    <p className="text-xs text-muted-foreground font-body">Mínimo: {item.minimo}</p>
                  </div>
                  <span className="text-destructive font-bold text-lg">{item.quantidade}</span>
                </div>
              ))}
              {alertasEstoque.length === 0 && (
                <p className="text-sm text-muted-foreground font-body">Nenhum alerta no momento.</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent - Mobile cards */}
        <div className="block sm:hidden space-y-3">
          <h3 className="text-base font-semibold">Atendimentos Recentes</h3>
          {recentAtendimentos.map(a => (
            <div key={a.id} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{a.cliente}</span>
                <span className="font-semibold text-primary text-sm">R$ {a.total.toFixed(2)}</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>{a.barbeiro} · {a.servicos.join(', ')}</p>
                <p>{new Date(a.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Recent - Desktop table */}
        <div className="hidden sm:block bg-card rounded-xl border border-border animate-fade-in">
          <div className="p-6 pb-0">
            <h3 className="text-lg font-semibold">Atendimentos Recentes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 lg:px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Hora</th>
                  <th className="text-left py-3 px-4 lg:px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Cliente</th>
                  <th className="text-left py-3 px-4 lg:px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Barbeiro</th>
                  <th className="text-left py-3 px-4 lg:px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Serviço</th>
                  <th className="text-right py-3 px-4 lg:px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Valor</th>
                </tr>
              </thead>
              <tbody>
                {recentAtendimentos.map(a => (
                  <tr key={a.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 lg:px-6 text-sm font-body">{new Date(a.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="py-3 px-4 lg:px-6 text-sm font-medium">{a.cliente}</td>
                    <td className="py-3 px-4 lg:px-6 text-sm font-body">{a.barbeiro}</td>
                    <td className="py-3 px-4 lg:px-6 text-sm font-body">{a.servicos.join(', ')}</td>
                    <td className="py-3 px-4 lg:px-6 text-sm text-right font-semibold">R$ {a.total.toFixed(2)}</td>
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
