import { useState, useRef, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Send, User, Loader2, Sparkles } from 'lucide-react';
import { mockAtendimentos, mockBarbeiros, mockServicos, mockProdutos } from '@/data/mock';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getBusinessData = () => {
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
      receitaHoje,
      receitaSemanal,
      receitaMensal,
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
      servicos: mockServicos.map(s => ({
        nome: s.nome, preco: s.preco, duracao: s.duracao, ativo: s.ativo,
      })),
      produtos: mockProdutos.map(p => ({
        nome: p.nome, preco: p.preco, quantidade: p.quantidade, minimo: p.minimo,
        estoqueBaixo: p.quantidade <= p.minimo,
      })),
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
    <Layout>
      <div className="flex flex-col h-[calc(100vh-7rem)]">
        <div className="mb-4">
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            Assistente IA
          </h2>
          <p className="text-muted-foreground mt-1 font-body">Pergunte qualquer coisa sobre seu negócio</p>
        </div>

        <div className="flex-1 bg-card rounded-xl border border-border flex flex-col overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Como posso ajudar?</h3>
                  <p className="text-muted-foreground font-body text-sm max-w-md">
                    Tenho acesso a todos os dados da sua barbearia: receitas, atendimentos, barbeiros, serviços e estoque.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => send(s)}
                      className="text-xs px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors text-left"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={`max-w-[75%] rounded-xl px-4 py-3 text-sm ${
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}>
                  <div className="whitespace-pre-wrap font-body prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-headings:font-semibold [&_strong]:font-semibold [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm">
                    {m.role === 'assistant' ? (
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    ) : (
                      m.content
                    )}
                  </div>
                </div>
                {m.role === 'user' && (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-xl px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border p-4">
            <form onSubmit={e => { e.preventDefault(); send(input); }} className="flex gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Pergunte sobre receitas, barbeiros, estoque..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !input.trim()} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
