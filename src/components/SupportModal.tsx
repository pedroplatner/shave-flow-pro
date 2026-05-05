import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Scissors, Wallet, Users, Sparkles,
  Package, BarChart3, Bot, Settings, X, ChevronRight,
} from 'lucide-react';
import { useSupportGuide } from '@/contexts/SupportGuideContext';

const sections = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    steps: [
      'Visão geral do dia: atendimentos, receita e caixa em um só lugar.',
      'Cards de resumo atualizados em tempo real conforme você registra atendimentos.',
      'Ponto de partida — sempre abra o sistema por aqui para checar o dia.',
    ],
  },
  {
    icon: Scissors,
    label: 'Atendimentos',
    steps: [
      'Registre cada atendimento: cliente, barbeiro, serviço e valor.',
      'Histórico completo com filtros por data e barbeiro.',
      'Os valores registrados aqui alimentam automaticamente o Caixa e os Relatórios.',
    ],
  },
  {
    icon: Wallet,
    label: 'Caixa',
    steps: [
      'Abra o caixa no início do dia e feche ao encerrar o expediente.',
      'Registre entradas e saídas além dos atendimentos (despesas, extras).',
      'O PIN de segurança protege ações sensíveis — configure em Configurações.',
    ],
  },
  {
    icon: Users,
    label: 'Barbeiros',
    steps: [
      'Cadastre todos os profissionais da barbearia com nome e foto.',
      'Cada atendimento é vinculado a um barbeiro para rastreio de produção.',
      'Edite ou desative barbeiros sem perder o histórico deles.',
    ],
  },
  {
    icon: Sparkles,
    label: 'Serviços',
    steps: [
      'Cadastre todos os serviços com nome, preço e duração.',
      'Os serviços aparecem automaticamente ao registrar um novo atendimento.',
      'Alterar o preço de um serviço não afeta atendimentos já registrados.',
    ],
  },
  {
    icon: Package,
    label: 'Produtos',
    steps: [
      'Módulo opcional — ative em Configurações → Módulos.',
      'Gerencie o estoque de produtos vendidos na barbearia.',
      'Produtos podem ser adicionados junto ao atendimento na hora do checkout.',
    ],
  },
  {
    icon: BarChart3,
    label: 'Relatórios',
    steps: [
      'Analise o desempenho por período: receita, atendimentos e ticket médio.',
      'Veja a produção individual de cada barbeiro.',
      'Exporte ou visualize direto na tela para tomada de decisão.',
    ],
  },
  {
    icon: Bot,
    label: 'Assistente IA',
    steps: [
      'Módulo opcional — ative em Configurações → Módulos.',
      'Chat inteligente que analisa os dados do seu negócio e responde perguntas.',
      'Pergunte sobre receita, desempenho, tendências ou qualquer dúvida operacional.',
    ],
  },
  {
    icon: Settings,
    label: 'Configurações',
    steps: [
      'Faça upload do logo da sua barbearia para personalizar o sistema.',
      'Ative ou desative módulos (Produtos e Assistente IA) conforme a necessidade.',
      'Configure o PIN de segurança para proteger o Caixa.',
      'Alterne entre modo claro e escuro a qualquer momento.',
    ],
  },
];

export default function SupportModal() {
  const { open, closeGuide } = useSupportGuide();
  const [active, setActive] = useState(0);

  const current = sections[active];
  const Icon = current.icon;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) closeGuide(); }}>
      <DialogContent
        className="max-w-3xl p-0 gap-0 overflow-hidden rounded-2xl border-border"
        hideCloseButton
      >
        <div className="flex h-[520px]">
          {/* Sidebar */}
          <nav className="w-52 shrink-0 border-r border-border bg-muted/30 flex flex-col py-4">
            <p className="px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Módulos
            </p>
            <div className="flex-1 space-y-0.5 px-2 overflow-y-auto">
              {sections.map((s, i) => {
                const SIcon = s.icon;
                return (
                  <button
                    key={s.label}
                    onClick={() => setActive(i)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                      i === active
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    <SIcon className="h-4 w-4 shrink-0" />
                    {s.label}
                    {i === active && <ChevronRight className="h-3.5 w-3.5 ml-auto shrink-0" />}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-border">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-0.5">
                  Guia do Sistema
                </p>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  {current.label}
                </h2>
              </div>
              <button
                onClick={closeGuide}
                className="text-muted-foreground hover:text-foreground transition-colors rounded-lg p-1.5 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Steps */}
            <div className="flex-1 px-8 py-6 overflow-y-auto">
              <ol className="space-y-4">
                {current.steps.map((step, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-foreground/80 leading-relaxed font-body">
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            </div>

            {/* Footer */}
            <div className="px-8 py-4 border-t border-border flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {active + 1} de {sections.length}
              </p>
              <div className="flex gap-2">
                {active < sections.length - 1 ? (
                  <Button size="sm" onClick={() => setActive(i => i + 1)}>
                    Próximo
                  </Button>
                ) : (
                  <Button size="sm" onClick={closeGuide}>
                    Entendido
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
