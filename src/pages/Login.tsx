import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import GridGlowBackground from '@/components/GridGlowBackground';

type Mode = 'login' | 'register';

const REMEMBER_KEY = 'auth-remember-email';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp } = useAuth();

  const initialMode: Mode = location.pathname === '/register' ? 'register' : 'login';
  const [mode, setMode] = useState<Mode>(initialMode);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMode(location.pathname === '/register' ? 'register' : 'login');
  }, [location.pathname]);

  // Pré-preenche o e-mail salvo
  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      setEmail(saved);
      setRemember(true);
    }
  }, []);

  const switchMode = (next: Mode) => {
    setMode(next);
    navigate(next === 'login' ? '/login' : '/register', { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Preencha e-mail e senha');
      return;
    }
    setLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      setLoading(false);
      if (error) {
        toast.error(error);
        return;
      }
      if (remember) localStorage.setItem(REMEMBER_KEY, email);
      else localStorage.removeItem(REMEMBER_KEY);
      navigate('/');
    } else {
      const { error } = await signUp(email, password);
      if (error) {
        setLoading(false);
        toast.error(error);
        return;
      }
      // Auto-confirm está habilitado, então tentamos logar direto
      const { error: signInError } = await signIn(email, password);
      setLoading(false);
      if (signInError) {
        toast.success('Conta criada! Faça login para continuar.');
        switchMode('login');
        return;
      }
      localStorage.setItem(REMEMBER_KEY, email);
      toast.success('Conta criada com sucesso!');
      navigate('/');
    }
  };

  const isLogin = mode === 'login';

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-5xl rounded-3xl overflow-hidden border border-border shadow-2xl grid grid-cols-1 md:grid-cols-2 bg-card min-h-[560px]">
        {/* Painel do formulário (esquerda no login, direita no registro) */}
        <div
          className={cn(
            'relative bg-card p-8 sm:p-12 flex flex-col justify-center order-2',
            isLogin ? 'md:order-1' : 'md:order-2'
          )}
        >
          <div className="w-full max-w-sm mx-auto animate-fade-in">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-foreground">
              {isLogin ? 'Fazer login' : 'Criar conta'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="sr-only">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl bg-muted/50 border-border"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="sr-only">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl bg-muted/50 border-border"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
              </div>

              {isLogin && (
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                    <Checkbox
                      checked={remember}
                      onCheckedChange={(v) => setRemember(v === true)}
                    />
                    Lembrar sempre
                  </label>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl text-base font-semibold mt-2"
              >
                {loading
                  ? (isLogin ? 'Entrando...' : 'Criando...')
                  : (isLogin ? 'Entrar' : 'Cadastrar')}
              </Button>
            </form>
          </div>
        </div>

        {/* Painel promocional (direita no login, esquerda no registro) */}
        <div
          className={cn(
            'relative p-8 sm:p-12 flex flex-col justify-center items-center text-center overflow-hidden order-1',
            isLogin ? 'md:order-2' : 'md:order-1'
          )}
          style={{
            background:
              'radial-gradient(circle at 30% 30%, hsl(var(--primary) / 0.35), transparent 60%), radial-gradient(circle at 70% 70%, hsl(var(--primary) / 0.25), transparent 55%), linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--card)) 100%)',
          }}
        >
          {/* Glow decorativo */}
          <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-xs animate-fade-in">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground leading-tight">
              {isLogin ? (
                <>Não tem<br />uma conta?</>
              ) : (
                <>Já possui<br />uma conta?</>
              )}
            </h2>
            <p className="text-sm text-muted-foreground mb-8 font-body">
              {isLogin
                ? 'Crie sua conta agora e gerencie sua barbearia de forma simples e profissional.'
                : 'Faça login e continue de onde parou na gestão da sua barbearia.'}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => switchMode(isLogin ? 'register' : 'login')}
              className="rounded-full px-8 h-11 border-border bg-background/40 backdrop-blur hover:bg-background/60"
            >
              {isLogin ? 'Cadastre-se' : 'Fazer login'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
