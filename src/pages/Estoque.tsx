import { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, AlertTriangle, ArrowUp, ArrowDown, FileText, Pencil } from 'lucide-react';
import { mockProdutos } from '@/data/mock';

interface Produto {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
  minimo: number;
  percVenda?: number;
  percCompra?: number;
}

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
  const [produtos, setProdutos] = useState<Produto[]>(mockProdutos.map(p => ({ ...p, percVenda: undefined, percCompra: undefined })));
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [movOpen, setMovOpen] = useState(false);
  const [movTipo, setMovTipo] = useState<'entrada' | 'saida'>('entrada');
  const [movProdutoId, setMovProdutoId] = useState('');

  // Form fields
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [minimo, setMinimo] = useState('');
  const [percVenda, setPercVenda] = useState('');
  const [percCompra, setPercCompra] = useState('');
  const [movQtd, setMovQtd] = useState('');
  const [movNf, setMovNf] = useState('');

  const resetForm = () => { setNome(''); setPreco(''); setQuantidade(''); setMinimo(''); setPercVenda(''); setPercCompra(''); };

  const handleAdd = () => {
    setProdutos([...produtos, {
      id: String(Date.now()), nome, preco: Number(preco), quantidade: Number(quantidade), minimo: Number(minimo),
      percVenda: percVenda ? Number(percVenda) : undefined,
      percCompra: percCompra ? Number(percCompra) : undefined,
    }]);
    resetForm();
    setOpen(false);
  };

  const openEdit = (id: string) => {
    const p = produtos.find(x => x.id === id);
    if (!p) return;
    setEditId(id);
    setNome(p.nome);
    setPreco(String(p.preco));
    setQuantidade(String(p.quantidade));
    setMinimo(String(p.minimo));
    setPercVenda(p.percVenda != null ? String(p.percVenda) : '');
    setPercCompra(p.percCompra != null ? String(p.percCompra) : '');
    setEditOpen(true);
  };

  const handleEdit = () => {
    setProdutos(produtos.map(p => p.id === editId ? {
      ...p, nome, preco: Number(preco), quantidade: Number(quantidade), minimo: Number(minimo),
      percVenda: percVenda ? Number(percVenda) : undefined,
      percCompra: percCompra ? Number(percCompra) : undefined,
    } : p));
    resetForm();
    setEditId(null);
    setEditOpen(false);
  };

  const openMov = (produtoId: string, tipo: 'entrada' | 'saida') => {
    setMovProdutoId(produtoId);
    setMovTipo(tipo);
    setMovQtd('');
    setMovNf('');
    setMovOpen(true);
  };

  const handleMov = () => {
    const qty = Number(movQtd);
    if (qty <= 0) return;
    const prod = produtos.find(p => p.id === movProdutoId);
    if (!prod) return;

    setProdutos(produtos.map(p => p.id === movProdutoId ? {
      ...p, quantidade: movTipo === 'entrada' ? p.quantidade + qty : Math.max(0, p.quantidade - qty)
    } : p));

    setMovimentacoes([{
      id: String(Date.now()),
      produtoId: movProdutoId,
      produtoNome: prod.nome,
      tipo: movTipo,
      quantidade: qty,
      nf: movNf || undefined,
      data: new Date().toISOString(),
    }, ...movimentacoes]);

    setMovOpen(false);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Estoque</h2>
            <p className="text-muted-foreground mt-1 font-body">Controle de produtos e insumos</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Novo Produto</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Produto</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2"><Label>Nome</Label><Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do produto" /></div>
                <div className="space-y-2"><Label>Preço (R$)</Label><Input type="number" value={preco} onChange={e => setPreco(e.target.value)} /></div>
                <div className="space-y-2"><Label>Quantidade Inicial</Label><Input type="number" value={quantidade} onChange={e => setQuantidade(e.target.value)} /></div>
                <div className="space-y-2"><Label>Estoque Mínimo</Label><Input type="number" value={minimo} onChange={e => setMinimo(e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>% Venda (opcional)</Label><Input type="number" value={percVenda} onChange={e => setPercVenda(e.target.value)} placeholder="Ex: 30" /></div>
                  <div className="space-y-2"><Label>% Compra (opcional)</Label><Input type="number" value={percCompra} onChange={e => setPercCompra(e.target.value)} placeholder="Ex: 10" /></div>
                </div>
                <Button className="w-full" onClick={handleAdd} disabled={!nome || !preco}>Adicionar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); if (!v) { resetForm(); setEditId(null); } }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar Produto</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2"><Label>Nome</Label><Input value={nome} onChange={e => setNome(e.target.value)} /></div>
              <div className="space-y-2"><Label>Preço (R$)</Label><Input type="number" value={preco} onChange={e => setPreco(e.target.value)} /></div>
              <div className="space-y-2"><Label>Quantidade</Label><Input type="number" value={quantidade} onChange={e => setQuantidade(e.target.value)} /></div>
              <div className="space-y-2"><Label>Estoque Mínimo</Label><Input type="number" value={minimo} onChange={e => setMinimo(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>% Venda (opcional)</Label><Input type="number" value={percVenda} onChange={e => setPercVenda(e.target.value)} /></div>
                <div className="space-y-2"><Label>% Compra (opcional)</Label><Input type="number" value={percCompra} onChange={e => setPercCompra(e.target.value)} /></div>
              </div>
              <Button className="w-full" onClick={handleEdit} disabled={!nome || !preco}>Salvar Alterações</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Movimentação Dialog */}
        <Dialog open={movOpen} onOpenChange={setMovOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{movTipo === 'entrada' ? 'Entrada de Produto' : 'Saída de Produto'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input type="number" value={movQtd} onChange={e => setMovQtd(e.target.value)} placeholder="Quantidade" />
              </div>
              <div className="space-y-2">
                <Label>Nota Fiscal (opcional)</Label>
                <Input value={movNf} onChange={e => setMovNf(e.target.value)} placeholder="Número da NF" />
              </div>
              <Button className="w-full" onClick={handleMov} disabled={!movQtd || Number(movQtd) <= 0}>
                {movTipo === 'entrada' ? 'Registrar Entrada' : 'Registrar Saída'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Tabs defaultValue="produtos">
          <TabsList>
            <TabsTrigger value="produtos">Produtos</TabsTrigger>
            <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
          </TabsList>

          <TabsContent value="produtos" className="mt-4">
            <div className="bg-card rounded-xl border border-border animate-fade-in">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Produto</th>
                      <th className="text-left py-3 px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Preço</th>
                      <th className="text-left py-3 px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Qtd</th>
                      <th className="text-left py-3 px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Mín</th>
                      <th className="text-left py-3 px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">% Venda</th>
                      <th className="text-left py-3 px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Status</th>
                      <th className="text-right py-3 px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtos.map(p => (
                      <tr key={p.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-6 text-sm font-medium">{p.nome}</td>
                        <td className="py-3 px-6 text-sm font-body">R$ {p.preco.toFixed(2)}</td>
                        <td className="py-3 px-6 text-sm font-bold">{p.quantidade}</td>
                        <td className="py-3 px-6 text-sm text-muted-foreground font-body">{p.minimo}</td>
                        <td className="py-3 px-6 text-sm text-muted-foreground font-body">{p.percVenda != null ? `${p.percVenda}%` : '—'}</td>
                        <td className="py-3 px-6 text-sm">
                          {p.quantidade <= p.minimo ? (
                            <span className="flex items-center gap-1 text-danger font-medium"><AlertTriangle className="h-3 w-3" />Baixo</span>
                          ) : (
                            <span className="text-success font-medium">OK</span>
                          )}
                        </td>
                        <td className="py-3 px-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p.id)} title="Editar">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-success" onClick={() => openMov(p.id, 'entrada')} title="Entrada">
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-danger" onClick={() => openMov(p.id, 'saida')} title="Saída">
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="movimentacoes" className="mt-4">
            <div className="bg-card rounded-xl border border-border animate-fade-in">
              {movimentacoes.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground font-body">Nenhuma movimentação registrada.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Data</th>
                        <th className="text-left py-3 px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Produto</th>
                        <th className="text-left py-3 px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Tipo</th>
                        <th className="text-left py-3 px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Qtd</th>
                        <th className="text-left py-3 px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">NF</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movimentacoes.map(m => (
                        <tr key={m.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-6 text-sm font-body">{new Date(m.data).toLocaleString('pt-BR')}</td>
                          <td className="py-3 px-6 text-sm font-medium">{m.produtoNome}</td>
                          <td className="py-3 px-6 text-sm">
                            <span className={m.tipo === 'entrada' ? 'text-success font-medium' : 'text-danger font-medium'}>
                              {m.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                            </span>
                          </td>
                          <td className="py-3 px-6 text-sm font-bold">{m.quantidade}</td>
                          <td className="py-3 px-6 text-sm font-body">
                            {m.nf ? <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{m.nf}</span> : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
