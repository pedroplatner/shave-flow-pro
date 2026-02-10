import { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';
import { mockProdutos } from '@/data/mock';

export default function Estoque() {
  const [produtos, setProdutos] = useState(mockProdutos);
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [minimo, setMinimo] = useState('');

  const handleAdd = () => {
    setProdutos([...produtos, {
      id: String(Date.now()), nome, preco: Number(preco), quantidade: Number(quantidade), minimo: Number(minimo)
    }]);
    setNome(''); setPreco(''); setQuantidade(''); setMinimo('');
    setOpen(false);
  };

  const ajustar = (id: string, delta: number) => {
    setProdutos(produtos.map(p => p.id === id ? { ...p, quantidade: Math.max(0, p.quantidade + delta) } : p));
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
                <Button className="w-full" onClick={handleAdd} disabled={!nome || !preco}>Adicionar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-card rounded-xl border border-border animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Produto</th>
                  <th className="text-left py-3 px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Preço</th>
                  <th className="text-left py-3 px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Qtd</th>
                  <th className="text-left py-3 px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Mínimo</th>
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
                    <td className="py-3 px-6 text-sm">
                      {p.quantidade <= p.minimo ? (
                        <span className="flex items-center gap-1 text-danger font-medium"><AlertTriangle className="h-3 w-3" />Baixo</span>
                      ) : (
                        <span className="text-success font-medium">OK</span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => ajustar(p.id, -1)}>
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => ajustar(p.id, 1)}>
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
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
