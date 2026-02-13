import { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, ArrowUp, ArrowDown, FileText } from 'lucide-react';
import { useProdutos, useBarbershopId } from '@/hooks/useBarbershop';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Movimentacao {
  id: string;
  produtoId: string;
  produtoNome: string;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  nf?: string;
  data: string;
}

export default function Estoque() {
  const { data: produtos = [] } = useProdutos();
  const queryClient = useQueryClient();
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [movOpen, setMovOpen] = useState(false);
  const [movTipo, setMovTipo] = useState<'entrada' | 'saida'>('entrada');
  const [movProdutoId, setMovProdutoId] = useState('');
  const [movQtd, setMovQtd] = useState('');
  const [movNf, setMovNf] = useState('');

  const openMov = (produtoId: string, tipo: 'entrada' | 'saida') => {
    setMovProdutoId(produtoId); setMovTipo(tipo); setMovQtd(''); setMovNf(''); setMovOpen(true);
  };

  const handleMov = async () => {
    const qty = Number(movQtd);
    if (qty <= 0) return;
    const prod = produtos.find(p => p.id === movProdutoId);
    if (!prod) return;
    const newQty = movTipo === 'entrada' ? prod.quantidade + qty : Math.max(0, prod.quantidade - qty);
    const { error } = await supabase.from('produtos').update({ quantidade: newQty }).eq('id', movProdutoId);
    if (error) { toast.error('Erro ao registrar movimentação'); return; }
    setMovimentacoes([{
      id: String(Date.now()), produtoId: movProdutoId, produtoNome: prod.nome,
      tipo: movTipo, quantidade: qty, nf: movNf || undefined, data: new Date().toISOString(),
    }, ...movimentacoes]);
    queryClient.invalidateQueries({ queryKey: ['produtos'] });
    toast.success('Movimentação registrada!');
    setMovOpen(false);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Estoque</h2>
          <p className="text-muted-foreground mt-1 font-body text-sm">Controle de entradas, saídas e movimentações</p>
        </div>

        <Dialog open={movOpen} onOpenChange={setMovOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{movTipo === 'entrada' ? 'Entrada de Produto' : 'Saída de Produto'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2"><Label>Quantidade</Label><Input type="number" value={movQtd} onChange={e => setMovQtd(e.target.value)} placeholder="Quantidade" /></div>
              <div className="space-y-2"><Label>Nota Fiscal (opcional)</Label><Input value={movNf} onChange={e => setMovNf(e.target.value)} placeholder="Número da NF" /></div>
              <Button className="w-full" onClick={handleMov} disabled={!movQtd || Number(movQtd) <= 0}>
                {movTipo === 'entrada' ? 'Registrar Entrada' : 'Registrar Saída'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Mobile cards */}
        <div className="block sm:hidden space-y-3">
          <h3 className="font-semibold text-base">Produtos em Estoque</h3>
          {produtos.map(p => (
            <div key={p.id} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">{p.nome}</span>
                {p.quantidade <= p.minimo ? (
                  <span className="flex items-center gap-1 text-destructive text-xs font-medium"><AlertTriangle className="h-3 w-3" />Baixo</span>
                ) : (
                  <span className="text-xs font-medium text-green-600">OK</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-muted-foreground">Qtd:</span> <span className="font-bold text-lg">{p.quantidade}</span>
                  <span className="text-muted-foreground ml-3">Mín:</span> {p.minimo}
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8 text-green-600" onClick={() => openMov(p.id, 'entrada')}><ArrowUp className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 text-destructive" onClick={() => openMov(p.id, 'saida')}><ArrowDown className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block bg-card rounded-xl border border-border animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 lg:px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Produto</th>
                  <th className="text-left py-3 px-4 lg:px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Qtd</th>
                  <th className="text-left py-3 px-4 lg:px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Mín</th>
                  <th className="text-left py-3 px-4 lg:px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Status</th>
                  <th className="text-right py-3 px-4 lg:px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map(p => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 lg:px-6 text-sm font-medium">{p.nome}</td>
                    <td className="py-3 px-4 lg:px-6 text-sm font-bold">{p.quantidade}</td>
                    <td className="py-3 px-4 lg:px-6 text-sm text-muted-foreground">{p.minimo}</td>
                    <td className="py-3 px-4 lg:px-6 text-sm">
                      {p.quantidade <= p.minimo ? (
                        <span className="flex items-center gap-1 text-destructive font-medium"><AlertTriangle className="h-3 w-3" />Baixo</span>
                      ) : (
                        <span className="text-green-600 font-medium">OK</span>
                      )}
                    </td>
                    <td className="py-3 px-4 lg:px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => openMov(p.id, 'entrada')} title="Entrada"><ArrowUp className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => openMov(p.id, 'saida')} title="Saída"><ArrowDown className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Movimentações */}
        <div>
          <h3 className="font-semibold text-base mb-3">Movimentações Recentes</h3>
          <div className="bg-card rounded-xl border border-border animate-fade-in">
            {movimentacoes.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground font-body text-sm">Nenhuma movimentação registrada.</div>
            ) : (
              <>
                <div className="block sm:hidden p-3 space-y-2">
                  {movimentacoes.map(m => (
                    <div key={m.id} className="border border-border rounded-lg p-3 text-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{m.produtoNome}</span>
                        <span className={m.tipo === 'entrada' ? 'text-green-600 font-semibold' : 'text-destructive font-semibold'}>
                          {m.tipo === 'entrada' ? '+' : '-'}{m.quantidade}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{new Date(m.data).toLocaleString('pt-BR')}</span>
                        {m.nf && <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{m.nf}</span>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 lg:px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Data</th>
                        <th className="text-left py-3 px-4 lg:px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Produto</th>
                        <th className="text-left py-3 px-4 lg:px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Tipo</th>
                        <th className="text-left py-3 px-4 lg:px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Qtd</th>
                        <th className="text-left py-3 px-4 lg:px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">NF</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movimentacoes.map(m => (
                        <tr key={m.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4 lg:px-6 text-sm">{new Date(m.data).toLocaleString('pt-BR')}</td>
                          <td className="py-3 px-4 lg:px-6 text-sm font-medium">{m.produtoNome}</td>
                          <td className="py-3 px-4 lg:px-6 text-sm">
                            <span className={m.tipo === 'entrada' ? 'text-green-600 font-medium' : 'text-destructive font-medium'}>
                              {m.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                            </span>
                          </td>
                          <td className="py-3 px-4 lg:px-6 text-sm font-bold">{m.quantidade}</td>
                          <td className="py-3 px-4 lg:px-6 text-sm">
                            {m.nf ? <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{m.nf}</span> : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
