import { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, User, Pencil } from 'lucide-react';
import { useBarbeiros, useBarbershopId } from '@/hooks/useBarbershop';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function Barbeiros() {
  const { data: barbeiros = [] } = useBarbeiros();
  const { data: bsId } = useBarbershopId();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [comissao, setComissao] = useState('40');

  const resetForm = () => { setNome(''); setTelefone(''); setComissao('40'); };

  const handleAdd = async () => {
    if (!bsId) return;
    const { error } = await supabase.from('barbeiros').insert({
      barbershop_id: bsId, nome, telefone, comissao: Number(comissao),
    });
    if (error) { toast.error('Erro ao adicionar'); return; }
    toast.success('Barbeiro adicionado!');
    queryClient.invalidateQueries({ queryKey: ['barbeiros'] });
    resetForm(); setOpen(false);
  };

  const openEdit = (id: string) => {
    const b = barbeiros.find(x => x.id === id);
    if (!b) return;
    setEditId(id); setNome(b.nome); setTelefone(b.telefone || ''); setComissao(String(b.comissao));
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editId) return;
    const { error } = await supabase.from('barbeiros').update({ nome, telefone, comissao: Number(comissao) }).eq('id', editId);
    if (error) { toast.error('Erro ao editar'); return; }
    toast.success('Barbeiro atualizado!');
    queryClient.invalidateQueries({ queryKey: ['barbeiros'] });
    resetForm(); setEditId(null); setEditOpen(false);
  };

  const toggleAtivo = async (id: string) => {
    const b = barbeiros.find(x => x.id === id);
    if (!b) return;
    await supabase.from('barbeiros').update({ ativo: !b.ativo }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['barbeiros'] });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Barbeiros</h2>
            <p className="text-muted-foreground mt-1 font-body">Gerencie sua equipe</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Novo Barbeiro</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Barbeiro</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2"><Label>Nome</Label><Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo" /></div>
                <div className="space-y-2"><Label>Telefone</Label><Input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(11) 99999-0000" /></div>
                <div className="space-y-2"><Label>Comissão (%)</Label><Input type="number" value={comissao} onChange={e => setComissao(e.target.value)} /></div>
                <Button className="w-full" onClick={handleAdd} disabled={!nome}>Adicionar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); if (!v) { resetForm(); setEditId(null); } }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar Barbeiro</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2"><Label>Nome</Label><Input value={nome} onChange={e => setNome(e.target.value)} /></div>
              <div className="space-y-2"><Label>Telefone</Label><Input value={telefone} onChange={e => setTelefone(e.target.value)} /></div>
              <div className="space-y-2"><Label>Comissão (%)</Label><Input type="number" value={comissao} onChange={e => setComissao(e.target.value)} /></div>
              <Button className="w-full" onClick={handleEdit} disabled={!nome}>Salvar Alterações</Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {barbeiros.map(b => (
            <div key={b.id} className="bg-card rounded-xl border border-border p-6 animate-fade-in">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{b.nome}</h3>
                    <p className="text-sm text-muted-foreground font-body">{b.telefone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(b.id)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Switch checked={b.ativo} onCheckedChange={() => toggleAtivo(b.id)} />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm font-body">
                <span className="text-muted-foreground">Comissão: {b.comissao}%</span>
                <span className={b.ativo ? 'text-green-500 font-medium' : 'text-destructive font-medium'}>
                  {b.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
