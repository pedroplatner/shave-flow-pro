import { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Plus, Check, X, Trash2 } from 'lucide-react';

const initialAgendamentos = [
  { id: '1', hora: '09:00', cliente: 'Roberto Alves', barbeiro: 'Carlos Silva', servico: 'Corte + Barba', status: 'confirmado' },
  { id: '2', hora: '10:00', cliente: 'Fernando Souza', barbeiro: 'Rafael Santos', servico: 'Corte Masculino', status: 'confirmado' },
  { id: '3', hora: '11:00', cliente: 'Ricardo Lima', barbeiro: 'André Oliveira', servico: 'Barba', status: 'pendente' },
  { id: '4', hora: '14:00', cliente: 'Thiago Pereira', barbeiro: 'Carlos Silva', servico: 'Corte + Sobrancelha', status: 'confirmado' },
  { id: '5', hora: '15:30', cliente: 'Bruno Costa', barbeiro: 'Rafael Santos', servico: 'Pigmentação', status: 'pendente' },
];

export default function Agendamentos() {
  const [agendamentos, setAgendamentos] = useState(initialAgendamentos);

  const updateStatus = (id: string, status: string) => {
    setAgendamentos(agendamentos.map(a => a.id === id ? { ...a, status } : a));
  };

  const removeAgendamento = (id: string) => {
    setAgendamentos(agendamentos.filter(a => a.id !== id));
  };

  const statusColors: Record<string, string> = {
    confirmado: 'bg-success/10 text-success',
    pendente: 'bg-primary/10 text-primary',
    cancelado: 'bg-danger/10 text-danger',
  };

  const statusLabels: Record<string, string> = {
    confirmado: 'Confirmado',
    pendente: 'Pendente',
    cancelado: 'Cancelado',
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Agendamentos</h2>
            <p className="text-muted-foreground mt-1 font-body">Agenda do dia — 10 de Fevereiro, 2026</p>
          </div>
          <Button><Plus className="h-4 w-4 mr-2" />Novo Agendamento</Button>
        </div>

        <div className="space-y-3">
          {agendamentos.map(a => (
            <div key={a.id} className="bg-card rounded-xl border border-border p-5 flex items-center justify-between animate-fade-in hover:border-primary/20 transition-colors">
              <div className="flex items-center gap-5">
                <div className="text-center min-w-[60px]">
                  <div className="text-xl font-bold">{a.hora}</div>
                </div>
                <div className="h-10 w-px bg-border" />
                <div>
                  <h3 className="font-semibold">{a.cliente}</h3>
                  <p className="text-sm text-muted-foreground font-body">{a.servico} • {a.barbeiro}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${statusColors[a.status] || ''}`}>
                  {statusLabels[a.status] || a.status}
                </span>
                <div className="flex items-center gap-1">
                  {a.status === 'pendente' && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-success" onClick={() => updateStatus(a.id, 'confirmado')} title="Confirmar">
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  {a.status !== 'cancelado' && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-danger" onClick={() => updateStatus(a.id, 'cancelado')} title="Cancelar">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => removeAgendamento(a.id)} title="Excluir">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {agendamentos.length === 0 && (
            <div className="text-center py-12 text-muted-foreground font-body">Nenhum agendamento para hoje.</div>
          )}
        </div>
      </div>
    </Layout>
  );
}
