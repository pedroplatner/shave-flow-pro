import { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { mockBarbeiros, mockServicos, mockAtendimentos } from '@/data/mock';

export default function Atendimentos() {
  const [atendimentos, setAtendimentos] = useState(mockAtendimentos);
  const [open, setOpen] = useState(false);
  const [cliente, setCliente] = useState('');
  const [barbeiro, setBarbeiro] = useState('');
  const [servicosSel, setServicosSel] = useState<string[]>([]);
  const [pagamento, setPagamento] = useState('');
  const [obs, setObs] = useState('');

  const total = servicosSel.reduce((acc, sId) => {
    const s = mockServicos.find(x => x.id === sId);
    return acc + (s?.preco || 0);
  }, 0);

  const toggleServico = (id: string) => {
    setServicosSel(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = () => {
    const novo = {
      id: String(Date.now()),
      data: new Date().toISOString(),
      cliente,
      barbeiro: mockBarbeiros.find(b => b.id === barbeiro)?.nome || '',
      servicos: servicosSel.map(id => mockServicos.find(s => s.id === id)?.nome || ''),
      produtos: [] as string[],
      formaPagamento: pagamento,
      total,
      observacoes: obs,
    };
    setAtendimentos([novo, ...atendimentos]);
    setCliente(''); setBarbeiro(''); setServicosSel([]); setPagamento(''); setObs('');
    setOpen(false);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Atendimentos</h2>
            <p className="text-muted-foreground mt-1 font-body">Registre e gerencie os atendimentos do dia</p>
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Novo Atendimento</Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Novo Atendimento</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                <div className="space-y-2">
                  <Label>Nome do Cliente</Label>
                  <Input placeholder="Nome do cliente" value={cliente} onChange={e => setCliente(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Barbeiro</Label>
                  <Select value={barbeiro} onValueChange={setBarbeiro}>
                    <SelectTrigger><SelectValue placeholder="Selecione o barbeiro" /></SelectTrigger>
                    <SelectContent>
                      {mockBarbeiros.filter(b => b.ativo).map(b => (
                        <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label>Serviços</Label>
                  {mockServicos.filter(s => s.ativo).map(s => (
                    <label key={s.id} className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors">
                      <div className="flex items-center gap-3">
                        <Checkbox checked={servicosSel.includes(s.id)} onCheckedChange={() => toggleServico(s.id)} />
                        <span className="text-sm font-medium">{s.nome}</span>
                      </div>
                      <span className="text-sm font-semibold text-primary">R$ {s.preco}</span>
                    </label>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label>Forma de Pagamento</Label>
                  <Select value={pagamento} onValueChange={setPagamento}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="Pix">Pix</SelectItem>
                      <SelectItem value="Cartão Débito">Cartão Débito</SelectItem>
                      <SelectItem value="Cartão Crédito">Cartão Crédito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea placeholder="Observações opcionais..." value={obs} onChange={e => setObs(e.target.value)} />
                </div>
                <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-2xl font-bold text-primary">R$ {total.toFixed(2)}</span>
                </div>
                <Button className="w-full" onClick={handleSubmit} disabled={!cliente || !barbeiro || servicosSel.length === 0 || !pagamento}>
                  Finalizar Atendimento
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="bg-card rounded-xl border border-border animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Hora</th>
                  <th className="text-left py-3 px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Cliente</th>
                  <th className="text-left py-3 px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Barbeiro</th>
                  <th className="text-left py-3 px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Serviços</th>
                  <th className="text-left py-3 px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Pagamento</th>
                  <th className="text-right py-3 px-6 text-xs text-muted-foreground font-medium uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody>
                {atendimentos.map(a => (
                  <tr key={a.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-6 text-sm font-body">{new Date(a.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="py-3 px-6 text-sm font-medium">{a.cliente}</td>
                    <td className="py-3 px-6 text-sm font-body">{a.barbeiro}</td>
                    <td className="py-3 px-6 text-sm font-body">{a.servicos.join(', ')}</td>
                    <td className="py-3 px-6 text-sm font-body">{a.formaPagamento}</td>
                    <td className="py-3 px-6 text-sm text-right font-semibold">R$ {a.total.toFixed(2)}</td>
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
