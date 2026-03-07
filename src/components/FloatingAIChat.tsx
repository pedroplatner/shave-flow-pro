import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';
import { useAtendimentos, useBarbeiros, useServicos, useProdutos, useCaixaDiario, useCaixaMovimentacoes } from '@/hooks/useBarbershop';
import ReactMarkdown from 'react-markdown';
import { useLocation } from 'react-router-dom';

type Msg = { role: 'user' | 'assistant'; content: string };

export default function FloatingAIChat() {
  const { settings } = useApp();
  const location = useLocation();
  const { data: atendimentos = [] } = useAtendimentos();
  const { data: barbeiros = [] } = useBarbeiros();
  const { data: servicos = [] } = useServicos();
  const { data: produtos = [] } = useProdutos();
  const { data: caixaHoje } = useCaixaDiario();
  const { data: movsCaixa = [] } = useCaixaMovimentacoes(caixaHoje?.id);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  if (!settings.moduloIA || location.pathname === '/assistente-ia') return null;

  const getBusinessData = () => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const receitaHoje = atendimentos.filter(a => new Date(a.data) >= startOfDay).reduce((acc, a) => acc + Number(a.total), 0);
    const receitaSemanal = atendimentos.filter(a => (now.getTime() - new Date(a.data).getTime()) / 86400000 <= 7).reduce((acc, a) => acc + Number(a.total), 0);
    const receitaMensal = atendimentos.filter(a => (now.getTime() - new Date(a.data).getTime()) / 86400000 <= 30).reduce((acc, a) => acc + Number(a.total), 0);

    const entCaixa = movsCaixa.filter(m => m.tipo === 'entrada').reduce((s, m) => s + Number(m.valor), 0);
    const saiCaixa = movsCaixa.filter(m => m.tipo === 'saida').reduce((s, m) => s + Number(m.valor), 0);
    const saldoCaixa = caixaHoje ? Number(caixaHoje.valor_inicial) + entCaixa - saiCaixa : null;

    return {
      receitaHoje, receitaSemanal, receitaMensal, totalAtendimentos: atendimentos.length,
      caixa: caixaHoje ? { status: caixaHoje.status, valorInicial: caixaHoje.valor_inicial, saldo: saldoCaixa, entradas: entCaixa, saidas: saiCaixa } : null,
      atendimentos: atendimentos.slice(0, 100).map(a => ({ data: a.data, cliente: a.cliente, barbeiro: a.barbeiro, servicos: a.servicos, produtos: a.produtos, total: a.total, formaPagamento: a.forma_pagamento })),
      barbeiros: barbeiros.map(b => ({
        nome: b.nome, ativo: b.ativo, comissao: b.comissao,
        atendimentos: atendimentos.filter(a => a.barbeiro === b.nome).length,
        receita: atendimentos.filter(a => a.barbeiro === b.nome).reduce((acc, a) => acc + Number(a.total), 0),
      })),
      servicos: servicos.map(s => ({ nome: s.nome, preco: s.preco, duracao: s.duracao, ativo: s.ativo })),
      produtos: produtos.map(p => ({ nome: p.nome, preco: p.preco, quantidade: p.quantidade, minimo: p.minimo, estoqueBaixo: p.quantidade <= p.minimo, custo: (p as any).custo || 0, fornecedor: (p as any).fornecedor || '' })),
    };
  };

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    let assistantSoFar = '';
    const allMessages = [...messages, userMsg];
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/barberpro-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: allMessages.map(m => ({ role: m.role, content: m.content })), businessData: getBusinessData() }),
      });
      if (!resp.ok) { const err = await resp.json().catch(() => ({})); throw new Error(err.error || `Erro ${resp.status}`); }
      if (!resp.body) throw new Error('Sem resposta');
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let ni: number;
        while ((ni = buf.indexOf('\n')) !== -1) {
          let line = buf.slice(0, ni); buf = buf.slice(ni + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '' || !line.startsWith('data: ')) continue;
          const j = line.slice(6).trim();
          if (j === '[DONE]') break;
          try {
            const c = JSON.parse(j).choices?.[0]?.delta?.content;
            if (c) { assistantSoFar += c; setMessages(prev => { const l = prev[prev.length - 1]; if (l?.role === 'assistant') return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m); return [...prev, { role: 'assistant', content: assistantSoFar }]; }); }
          } catch { buf = line + '\n' + buf; break; }
        }
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${e.message || 'Erro ao conectar com a IA.'}` }]);
    } finally { setIsLoading(false); }
  };

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-105 active:scale-95">
          <Bot className="h-6 w-6" />
        </button>
      )}
      {open && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[90vw] max-w-sm h-[70vh] max-h-[500px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
            <div className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /><span className="font-semibold text-sm">Assistente IA</span></div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors"><X className="h-5 w-5" /></button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4"><Bot className="h-10 w-10 text-primary/40 mb-2" /><p className="text-sm text-muted-foreground">Pergunte qualquer coisa sobre seu negócio</p></div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1"><Bot className="h-3 w-3 text-primary" /></div>}
                <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <div className="prose prose-sm max-w-none prose-p:my-0.5 prose-ul:my-0.5 prose-headings:my-1 prose-headings:text-sm [&_strong]:font-semibold">
                    {m.role === 'assistant' ? <ReactMarkdown>{m.content}</ReactMarkdown> : m.content}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex gap-2"><div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Bot className="h-3 w-3 text-primary" /></div><div className="bg-muted rounded-xl px-3 py-2"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div></div>
            )}
          </div>
          <div className="border-t border-border p-3">
            <form onSubmit={e => { e.preventDefault(); send(input); }} className="flex gap-2">
              <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Pergunte algo..." disabled={isLoading} className="flex-1 text-sm h-9" />
              <Button type="submit" disabled={isLoading || !input.trim()} size="icon" className="h-9 w-9 shrink-0"><Send className="h-4 w-4" /></Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
