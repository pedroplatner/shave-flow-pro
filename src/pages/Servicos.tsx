import { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Clock } from 'lucide-react';
import { mockServicos } from '@/data/mock';

export default function Servicos() {
  const [servicos, setServicos] = useState(mockServicos);
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [duracao, setDuracao] = useState('');

  const handleAdd = () => {
    setServicos([...servicos, {
      id: String(Date.now()), nome, preco: Number(preco), duracao: Number(duracao), ativo: true
    }]);
    setNome(''); setPreco(''); setDuracao('');
    setOpen(false);
  };

  const toggleAtivo = (id: string) => {
    setServicos(servicos.map(s => s.id === id ? { ...s, ativo: !s.ativo } : s));
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Serviços</h2>
            <p className="text-muted-foreground mt-1 font-body">Cadastre e gerencie seus serviços</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Novo Serviço</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Serviço</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Corte Masculino" />
                </div>
                <div className="space-y-2">
                  <Label>Preço (R$)</Label>
                  <Input type="number" value={preco} onChange={e => setPreco(e.target.value)} placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label>Duração (minutos)</Label>
                  <Input type="number" value={duracao} onChange={e => setDuracao(e.target.value)} placeholder="30" />
                </div>
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
                  <th className="text-left py-3 px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Serviço</th>
                  <th className="text-left py-3 px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Preço</th>
                  <th className="text-left py-3 px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Duração</th>
                  <th className="text-left py-3 px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Status</th>
                  <th className="text-right py-3 px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Ativo</th>
                </tr>
              </thead>
              <tbody>
                {servicos.map(s => (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-6 text-sm font-medium">{s.nome}</td>
                    <td className="py-3 px-6 text-sm font-body">R$ {s.preco.toFixed(2)}</td>
                    <td className="py-3 px-6 text-sm font-body">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-muted-foreground" />{s.duracao} min</span>
                    </td>
                    <td className="py-3 px-6 text-sm">
                      <span className={s.ativo ? 'text-success font-medium' : 'text-danger font-medium'}>{s.ativo ? 'Ativo' : 'Inativo'}</span>
                    </td>
                    <td className="py-3 px-6 text-right">
                      <Switch checked={s.ativo} onCheckedChange={() => toggleAtivo(s.id)} />
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
