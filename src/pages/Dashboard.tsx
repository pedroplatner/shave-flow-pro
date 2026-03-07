import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import { DollarSign, TrendingUp, Calendar, Scissors, AlertTriangle, Wallet, Trophy } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAtendimentos, useBarbeiros, useProdutos, useCaixaDiario, useCaixaMovimentacoes } from '@/hooks/useBarbershop';

export default function Dashboard() {
  const { data: atendimentos = [] } = useAtendimentos();
  const { data: barbeiros = [] } = useBarbeiros();
  const { data: produtos = [] } = useProdutos();
  const { data: caixaHoje } = useCaixaDiario();
  const { data: movsCaixa = [] } = useCaixaMovimentacoes(caixaHoje?.id);

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const atendHoje = atendimentos.filter(a => new Date(a.data) >= startOfDay);
  const receitaHoje = atendHoje.reduce((acc, a) => acc + Number(a.total), 0);
  const atendimentosHoje = atendHoje.length;

  const receitaSemanal = atendimentos
    .filter(a => (now.getTime() - new Date(a.data).getTime()) / (1000 * 60 * 60 * 24) <= 7)
    .reduce((acc, a) => acc + Number(a.total), 0);

  const receitaMensal = atendimentos
    .filter(a => (now.getTime() - new Date(a.data).getTime()) / (1000 * 60 * 60 * 24) <= 30)
    .reduce((acc, a) => acc + Number(a.total), 0);

  // Saldo caixa
  let saldoCaixaText = 'Caixa fechado';
  let saldoCaixaCor = false;
  if (caixaHoje && caixaHoje.status === 'aberto') {
    const ent = movsCaixa.filter(m => m.tipo === 'entrada').reduce((s, m) => s + Number(m.valor), 0);
    const sai = movsCaixa.filter(m => m.tipo === 'saida').reduce((s, m) => s + Number(m.valor), 0);
    const saldo = Number(caixaHoje.valor_inicial) + ent - sai;
    saldoCaixaText = `R$ ${saldo.toFixed(2)}`;
    saldoCaixaCor = true;
  } else if (caixaHoje && caixaHoje.status === 'fechado') {
    saldoCaixaText = `R$ ${Number(caixaHoje.valor_fechamento).toFixed(2)}`;
  }

  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const receita = atendimentos
      .filter(a => { const dt = new Date(a.data); return dt >= dayStart && dt < dayEnd; })
      .reduce((acc, a) => acc + Number(a.total), 0);
    return { day: dias[dayStart.getDay()], receita };
  });

  // Ranking barbeiros — mês atual
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const atendMes = atendimentos.filter(a => new Date(a.data) >= startOfMonth);
  const rankingBarbeiros = barbeiros
    .map(b => {
      const atends = atendMes.filter(a => a.barbeiro === b.nome);
      const receita = atends.reduce((acc, a) => acc + Number(a.total), 0);
      return { nome: b.nome, atendimentos: atends.length, receita, ticketMedio: atends.length > 0 ? receita / atends.length : 0 };
    })
    .filter(b => b.atendimentos > 0)
    .sort((a, b) => b.receita - a.receita);

  const medals = ['🥇', '🥈', '🥉'];
  const alertasEstoque = produtos.filter(p => p.quantidade <= p.minimo);
  const recentAtendimentos = [...atendimentos].slice(0, 5);

  return (
    <Layout>
      <div className="space-y-6 sm:space-y-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-1 font-body text-sm">Visão geral da sua barbearia</p>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4">
          <StatCard title="Receita Hoje" value={`R$ ${receitaHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={DollarSign} />
          <StatCard title="Atend. Hoje" value={String(atendimentosHoje)} icon={Scissors} />
          <StatCard title="Receita Semanal" value={`R$ ${receitaSemanal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={TrendingUp} />
          <StatCard title="Receita Mensal" value={`R$ ${receitaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={Calendar} />
          <div className="bg-card rounded-xl border border-border p-4 flex flex-col items-center justify-center col-span-2 xl:col-span-1">
            <Wallet className="h-5 w-5 text-muted-foreground mb-1" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Saldo Caixa</span>
            <span className={`text-lg font-bold ${saldoCaixaCor ? 'text-primary' : 'text-muted-foreground'}`}>{saldoCaixaText}</span>
          </div>
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
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
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
              {alertasEstoque.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{item.nome}</p>
                    <p className="text-xs text-muted-foreground font-body">Mínimo: {item.minimo}</p>
                  </div>
                  <span className="text-destructive font-bold text-lg">{item.quantidade}</span>
                </div>
              ))}
              {alertasEstoque.length === 0 && <p className="text-sm text-muted-foreground font-body">Nenhum alerta no momento.</p>}
            </div>
          </div>
        </div>

        {/* Ranking Barbeiros */}
        {rankingBarbeiros.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4 sm:p-6 animate-fade-in">
            <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Ranking de Barbeiros — Mês atual
            </h3>
            {/* Mobile */}
            <div className="block sm:hidden space-y-3">
              {rankingBarbeiros.map((b, i) => (
                <div key={b.nome} className="bg-muted rounded-lg p-3 flex items-center gap-3">
                  <span className="text-xl">{medals[i] || `${i + 1}º`}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{b.nome}</p>
                    <p className="text-xs text-muted-foreground">{b.atendimentos} atend. · Ticket: R$ {b.ticketMedio.toFixed(2)}</p>
                  </div>
                  <span className="font-bold text-primary text-sm">R$ {b.receita.toFixed(2)}</span>
                </div>
              ))}
            </div>
            {/* Desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">#</th>
                    <th className="text-left py-2 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Barbeiro</th>
                    <th className="text-center py-2 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Atendimentos</th>
                    <th className="text-right py-2 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Receita</th>
                    <th className="text-right py-2 px-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">Ticket Médio</th>
                  </tr>
                </thead>
                <tbody>
                  {rankingBarbeiros.map((b, i) => (
                    <tr key={b.nome} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                      <td className="py-2 px-4 text-lg">{medals[i] || `${i + 1}º`}</td>
                      <td className="py-2 px-4 text-sm font-medium">{b.nome}</td>
                      <td className="py-2 px-4 text-sm text-center">{b.atendimentos}</td>
                      <td className="py-2 px-4 text-sm text-right font-bold text-primary">R$ {b.receita.toFixed(2)}</td>
                      <td className="py-2 px-4 text-sm text-right">R$ {b.ticketMedio.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {recentAtendimentos.length > 0 && (
          <>
            <div className="block sm:hidden space-y-3">
              <h3 className="text-base font-semibold">Atendimentos Recentes</h3>
              {recentAtendimentos.map(a => (
                <div key={a.id} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{a.cliente || <span className="italic text-muted-foreground">N/I</span>}</span>
                    <span className="font-semibold text-primary text-sm">R$ {Number(a.total).toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>{a.barbeiro} · {(a.servicos as string[]).join(', ')}</p>
                    <p>{new Date(a.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden sm:block bg-card rounded-xl border border-border animate-fade-in">
              <div className="p-6 pb-0"><h3 className="text-lg font-semibold">Atendimentos Recentes</h3></div>
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
                        <td className="py-3 px-4 lg:px-6 text-sm font-medium">{a.cliente || <span className="italic text-muted-foreground">N/I</span>}</td>
                        <td className="py-3 px-4 lg:px-6 text-sm font-body">{a.barbeiro}</td>
                        <td className="py-3 px-4 lg:px-6 text-sm font-body">{(a.servicos as string[]).join(', ')}</td>
                        <td className="py-3 px-4 lg:px-6 text-sm text-right font-semibold">R$ {Number(a.total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
