import { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, User } from 'lucide-react';
import { mockBarbeiros } from '@/data/mock';

export default function Barbeiros() {
  const [barbeiros, setBarbeiros] = useState(mockBarbeiros);
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [comissao, setComissao] = useState('40');

  const handleAdd = () => {
    setBarbeiros([...barbeiros, {
      id: String(Date.now()), nome, telefone, ativo: true, comissao: Number(comissao)
    }]);
    setNome(''); setTelefone(''); setComissao('40');
    setOpen(false);
  };

  const toggleAtivo = (id: string) => {
    setBarbeiros(barbeiros.map(b => b.id === id ? { ...b, ativo: !b.ativo } : b));
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
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo" />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(11) 99999-0000" />
                </div>
                <div className="space-y-2">
                  <Label>Comissão (%)</Label>
                  <Input type="number" value={comissao} onChange={e => setComissao(e.target.value)} />
                </div>
                <Button className="w-full" onClick={handleAdd} disabled={!nome}>Adicionar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

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
                <Switch checked={b.ativo} onCheckedChange={() => toggleAtivo(b.id)} />
              </div>
              <div className="mt-4 flex items-center justify-between text-sm font-body">
                <span className="text-muted-foreground">Comissão: {b.comissao}%</span>
                <span className={b.ativo ? 'text-success font-medium' : 'text-danger font-medium'}>
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
