import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Scissors } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [barbearia, setBarbearia] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-4">
            <Scissors className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-primary">Barber</span>Pro
          </h1>
          <p className="text-muted-foreground mt-2 font-body">Crie sua conta</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Seu Nome</Label>
              <Input placeholder="Nome completo" value={nome} onChange={e => setNome(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nome da Barbearia</Label>
              <Input placeholder="Ex: Barbearia Premium" value={barbearia} onChange={e => setBarbearia(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full">Criar Conta</Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-6 font-body">
            Já tem conta?{' '}
            <Link to="/login" className="text-primary hover:underline">Fazer login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
