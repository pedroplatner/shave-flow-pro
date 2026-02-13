import { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil } from 'lucide-react';
import { useProdutos, useBarbershopId } from '@/hooks/useBarbershop';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function Produtos() {
  const { data: produtos = [] } = useProdutos();
  const { data: bsId } = useBarbershopId();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [minimo, setMinimo] = useState('');

  const resetForm = () => { setNome(''); setPreco(''); setQuantidade(''); setMinimo(''); };

  const handleAdd = async () => {
    if (!bsId) return;
    const { error } = await supabase.from('produtos').insert({
      barbershop_id: bsId, nome, preco: Number(preco), quantidade: Number(quantidade), minimo: Number(minimo),
    });
    if (error) { toast.error('Erro ao adicionar'); return; }
    toast.success('Produto adicionado!');
    queryClient.invalidateQueries({ queryKey: ['produtos'] });
    resetForm(); setOpen(false);
  };

  const openEdit = (id: string) => {
    const p = produtos.find(x => x.id === id);
    if (!p) return;
    setEditId(id); setNome(p.nome); setPreco(String(p.preco)); setQuantidade(String(p.quantidade)); setMinimo(String(p.minimo));
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editId) return;
    const { error } = await supabase.from('produtos').update({ nome, preco: Number(preco), quantidade: Number(quantidade), minimo: Number(minimo) }).eq('id', editId);
    if (error) { toast.error('Erro ao editar'); return; }
    toast.success('Produto atualizado!');
    queryClient.invalidateQueries({ queryKey: ['produtos'] });
    resetForm(); setEditId(null); setEditOpen(false);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Produtos</h2>
            <p className="text-muted-foreground mt-1 font-body text-sm">Cadastro e gestão de produtos</p>
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

        <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); if (!v) { resetForm(); setEditId(null); } }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar Produto</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2"><Label>Nome</Label><Input value={nome} onChange={e => setNome(e.target.value)} /></div>
              <div className="space-y-2"><Label>Preço (R$)</Label><Input type="number" value={preco} onChange={e => setPreco(e.target.value)} /></div>
              <div className="space-y-2"><Label>Quantidade</Label><Input type="number" value={quantidade} onChange={e => setQuantidade(e.target.value)} /></div>
              <div className="space-y-2"><Label>Estoque Mínimo</Label><Input type="number" value={minimo} onChange={e => setMinimo(e.target.value)} /></div>
              <Button className="w-full" onClick={handleEdit} disabled={!nome || !preco}>Salvar Alterações</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Mobile card view */}
        <div className="block sm:hidden space-y-3">
          {produtos.map(p => (
            <div key={p.id} className="bg-card rounded-xl border border-border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{p.nome}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p.id)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Preço:</span> <span className="font-medium">R$ {Number(p.preco).toFixed(2)}</span></div>
                <div><span className="text-muted-foreground">Qtd:</span> <span className="font-bold">{p.quantidade}</span></div>
                <div><span className="text-muted-foreground">Mín:</span> {p.minimo}</div>
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
                  <th className="text-left py-3 px-4 lg:px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Preço</th>
                  <th className="text-left py-3 px-4 lg:px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Qtd</th>
                  <th className="text-left py-3 px-4 lg:px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Mín</th>
                  <th className="text-right py-3 px-4 lg:px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map(p => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 lg:px-6 text-sm font-medium">{p.nome}</td>
                    <td className="py-3 px-4 lg:px-6 text-sm font-body">R$ {Number(p.preco).toFixed(2)}</td>
                    <td className="py-3 px-4 lg:px-6 text-sm font-bold">{p.quantidade}</td>
                    <td className="py-3 px-4 lg:px-6 text-sm text-muted-foreground font-body">{p.minimo}</td>
                    <td className="py-3 px-4 lg:px-6 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p.id)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
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
