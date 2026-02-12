import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';
import { mockAtendimentos, mockBarbeiros, mockServicos, mockProdutos } from '@/data/mock';
import ReactMarkdown from 'react-markdown';
import { useLocation } from 'react-router-dom';

type Msg = { role: 'user' | 'assistant'; content: string };

function getBusinessData() {
  const now = new Date();
  const receitaHoje = mockAtendimentos
    .filter(a => new Date(a.data).toDateString() === now.toDateString())
    .reduce((acc, a) => acc + a.total, 0);
  const receitaSemanal = mockAtendimentos
    .filter(a => (now.getTime() - new Date(a.data).getTime()) / (1000 * 60 * 60 * 24) <= 7)
    .reduce((acc, a) => acc + a.total, 0);
  const receitaMensal = mockAtendimentos
    .filter(a => (now.getTime() - new Date(a.data).getTime()) / (1000 * 60 * 60 * 24) <= 30)
    .reduce((acc, a) => acc + a.total, 0);
  return {
    receitaHoje, receitaSemanal, receitaMensal,
    totalAtendimentos: mockAtendimentos.length,
    atendimentos: mockAtendimentos.map(a => ({
      data: a.data, cliente: a.cliente, barbeiro: a.barbeiro,
      servicos: a.servicos, total: a.total, formaPagamento: a.formaPagamento,
    })),
    barbeiros: mockBarbeiros.map(b => ({
      nome: b.nome, ativo: b.ativo, comissao: b.comissao,
      atendimentos: mockAtendimentos.filter(a => a.barbeiro === b.nome).length,
      receita: mockAtendimentos.filter(a => a.barbeiro === b.nome).reduce((acc, a) => acc + a.total, 0),
    })),
    servicos: mockServicos.map(s => ({ nome: s.nome, preco: s.preco, duracao: s.duracao, ativo: s.ativo })),
    produtos: mockProdutos.map(p => ({
      nome: p.nome, preco: p.preco, quantidade: p.quantidade, minimo: p.minimo,
      estoqueBaixo: p.quantidade <= p.minimo,
    })),
  };
}

export default function FloatingAIChat() {
  const { settings } = useApp();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Don't show on the full AI page or if module is off
  if (!settings.moduloIA || location.pathname === '/assistente-ia') return null;

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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          businessData: getBusinessData(),
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Erro ${resp.status}`);
      }
      if (!resp.body) throw new Error('Sem resposta');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: 'assistant', content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${e.message || 'Erro ao conectar com a IA.'}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-105 active:scale-95"
        >
          <Bot className="h-6 w-6" />
        </button>
      )}

      {/* Mini chat */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[90vw] max-w-sm h-[70vh] max-h-[500px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm">Assistente IA</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <Bot className="h-10 w-10 text-primary/40 mb-2" />
                <p className="text-sm text-muted-foreground">Pergunte qualquer coisa sobre seu negócio</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="h-3 w-3 text-primary" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                  m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  <div className="prose prose-sm max-w-none prose-p:my-0.5 prose-ul:my-0.5 prose-headings:my-1 prose-headings:text-sm [&_strong]:font-semibold">
                    {m.role === 'assistant' ? <ReactMarkdown>{m.content}</ReactMarkdown> : m.content}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex gap-2">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-3 w-3 text-primary" />
                </div>
                <div className="bg-muted rounded-xl px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border p-3">
            <form onSubmit={e => { e.preventDefault(); send(input); }} className="flex gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Pergunte algo..."
                disabled={isLoading}
                className="flex-1 text-sm h-9"
              />
              <Button type="submit" disabled={isLoading || !input.trim()} size="icon" className="h-9 w-9 shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
