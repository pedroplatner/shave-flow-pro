import { useState, useRef, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Send, User, Loader2, Sparkles } from 'lucide-react';
import { useAtendimentos, useBarbeiros, useServicos, useProdutos } from '@/hooks/useBarbershop';
import ReactMarkdown from 'react-markdown';

type Msg = { role: 'user' | 'assistant'; content: string };

const SUGGESTIONS = [
  'Qual foi a receita total desta semana?',
  'Qual barbeiro teve mais atendimentos?',
  'Quais produtos estão com estoque baixo?',
  'Me dê um resumo geral do negócio',
  'Qual serviço gera mais receita?',
];

export default function AssistenteIA() {
  const { data: atendimentos = [] } = useAtendimentos();
  const { data: barbeiros = [] } = useBarbeiros();
  const { data: servicos = [] } = useServicos();
  const { data: produtos = [] } = useProdutos();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const getBusinessData = () => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const receitaHoje = atendimentos.filter(a => new Date(a.data) >= startOfDay).reduce((acc, a) => acc + Number(a.total), 0);
    const receitaSemanal = atendimentos.filter(a => (now.getTime() - new Date(a.data).getTime()) / 86400000 <= 7).reduce((acc, a) => acc + Number(a.total), 0);
    const receitaMensal = atendimentos.filter(a => (now.getTime() - new Date(a.data).getTime()) / 86400000 <= 30).reduce((acc, a) => acc + Number(a.total), 0);
    return {
      receitaHoje, receitaSemanal, receitaMensal, totalAtendimentos: atendimentos.length,
      atendimentos: atendimentos.slice(0, 50).map(a => ({ data: a.data, cliente: a.cliente, barbeiro: a.barbeiro, servicos: a.servicos, total: a.total, formaPagamento: a.forma_pagamento })),
      barbeiros: barbeiros.map(b => ({
        nome: b.nome, ativo: b.ativo, comissao: b.comissao,
        atendimentos: atendimentos.filter(a => a.barbeiro === b.nome).length,
        receita: atendimentos.filter(a => a.barbeiro === b.nome).reduce((acc, a) => acc + Number(a.total), 0),
      })),
      servicos: servicos.map(s => ({ nome: s.nome, preco: s.preco, duracao: s.duracao, ativo: s.ativo })),
      produtos: produtos.map(p => ({ nome: p.nome, preco: p.preco, quantidade: p.quantidade, minimo: p.minimo, estoqueBaixo: p.quantidade <= p.minimo })),
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
    <Layout>
      <div className="flex flex-col h-[calc(100vh-5rem)] sm:h-[calc(100vh-7rem)]">
        <div className="mb-3 sm:mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            Assistente IA
          </h2>
          <p className="text-muted-foreground mt-1 font-body text-sm">Pergunte qualquer coisa sobre seu negócio</p>
        </div>
        <div className="flex-1 bg-card rounded-xl border border-border flex flex-col overflow-hidden min-h-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 sm:space-y-6 px-2">
                <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-primary/10 flex items-center justify-center"><Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary" /></div>
                <div><h3 className="text-lg sm:text-xl font-semibold mb-2">Como posso ajudar?</h3><p className="text-muted-foreground font-body text-xs sm:text-sm max-w-md">Tenho acesso a todos os dados da sua barbearia.</p></div>
                <div className="flex flex-wrap gap-2 justify-center max-w-lg">{SUGGESTIONS.map((s, i) => <button key={i} onClick={() => send(s)} className="text-xs px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors text-left">{s}</button>)}</div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 sm:gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1"><Bot className="h-3 w-3 sm:h-4 sm:w-4 text-primary" /></div>}
                <div className={`max-w-[85%] sm:max-w-[75%] rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <div className="whitespace-pre-wrap font-body prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-headings:font-semibold [&_strong]:font-semibold [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm">
                    {m.role === 'assistant' ? <ReactMarkdown>{m.content}</ReactMarkdown> : m.content}
                  </div>
                </div>
                {m.role === 'user' && <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1"><User className="h-3 w-3 sm:h-4 sm:w-4" /></div>}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex gap-2 sm:gap-3"><div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Bot className="h-3 w-3 sm:h-4 sm:w-4 text-primary" /></div><div className="bg-muted rounded-xl px-4 py-3"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div></div>
            )}
          </div>
          <div className="border-t border-border p-3 sm:p-4">
            <form onSubmit={e => { e.preventDefault(); send(input); }} className="flex gap-2">
              <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Pergunte sobre receitas, barbeiros..." disabled={isLoading} className="flex-1 text-sm" />
              <Button type="submit" disabled={isLoading || !input.trim()} size="icon"><Send className="h-4 w-4" /></Button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
