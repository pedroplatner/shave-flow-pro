-- ============================================================
-- SHAVE FLOW PRO — Schema Completo
-- Cole tudo isso no SQL Editor do Supabase e execute
-- ============================================================


-- ============================================================
-- 1. BARBERSHOPS + FUNÇÕES AUXILIARES + TABELAS BASE
-- ============================================================

CREATE TABLE public.barbershops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  nome TEXT NOT NULL DEFAULT 'Minha Barbearia',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.barbershops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access" ON public.barbershops FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE OR REPLACE FUNCTION public.get_my_barbershop_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.barbershops WHERE owner_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_my_barbershop(_barbershop_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.barbershops WHERE id = _barbershop_id AND owner_id = auth.uid()
  )
$$;

CREATE TABLE public.barbeiros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT DEFAULT '',
  ativo BOOLEAN NOT NULL DEFAULT true,
  comissao INTEGER NOT NULL DEFAULT 40,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.barbeiros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Barbershop access" ON public.barbeiros FOR ALL USING (public.is_my_barbershop(barbershop_id)) WITH CHECK (public.is_my_barbershop(barbershop_id));

CREATE TABLE public.servicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  preco NUMERIC(10,2) NOT NULL DEFAULT 0,
  duracao INTEGER NOT NULL DEFAULT 30,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Barbershop access" ON public.servicos FOR ALL USING (public.is_my_barbershop(barbershop_id)) WITH CHECK (public.is_my_barbershop(barbershop_id));

CREATE TABLE public.produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  preco NUMERIC(10,2) NOT NULL DEFAULT 0,
  quantidade INTEGER NOT NULL DEFAULT 0,
  minimo INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Barbershop access" ON public.produtos FOR ALL USING (public.is_my_barbershop(barbershop_id)) WITH CHECK (public.is_my_barbershop(barbershop_id));

CREATE TABLE public.atendimentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  data TIMESTAMPTZ NOT NULL DEFAULT now(),
  cliente TEXT NOT NULL,
  barbeiro TEXT NOT NULL,
  servicos TEXT[] NOT NULL DEFAULT '{}',
  produtos TEXT[] NOT NULL DEFAULT '{}',
  forma_pagamento TEXT NOT NULL,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  observacoes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.atendimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Barbershop access" ON public.atendimentos FOR ALL USING (public.is_my_barbershop(barbershop_id)) WITH CHECK (public.is_my_barbershop(barbershop_id));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.barbershops (owner_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- 2. AGENDAMENTOS
-- ============================================================

CREATE TABLE public.agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  hora TEXT NOT NULL,
  cliente TEXT NOT NULL,
  barbeiro TEXT NOT NULL,
  servico TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Barbershop access" ON public.agendamentos FOR ALL TO authenticated
  USING (is_my_barbershop(barbershop_id))
  WITH CHECK (is_my_barbershop(barbershop_id));


-- ============================================================
-- 3. CAIXA
-- ============================================================

CREATE TABLE public.caixas_diarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  valor_inicial NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'aberto',
  valor_fechamento NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (barbershop_id, data)
);

ALTER TABLE public.caixas_diarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Barbershop access" ON public.caixas_diarios
  FOR ALL TO authenticated
  USING (is_my_barbershop(barbershop_id))
  WITH CHECK (is_my_barbershop(barbershop_id));

CREATE TABLE public.caixa_movimentacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caixa_id UUID NOT NULL REFERENCES public.caixas_diarios(id) ON DELETE CASCADE,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  origem TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.caixa_movimentacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Barbershop access" ON public.caixa_movimentacoes
  FOR ALL TO authenticated
  USING (is_my_barbershop(barbershop_id))
  WITH CHECK (is_my_barbershop(barbershop_id));


-- ============================================================
-- 4. AJUSTES DE POLICIES + COLUNAS EXTRAS EM PRODUTOS
-- ============================================================

ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS custo numeric DEFAULT 0;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS fornecedor text DEFAULT '';


-- ============================================================
-- 5. COMANDAS
-- ============================================================

CREATE TABLE public.comandas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  barbeiro_id uuid NOT NULL REFERENCES public.barbeiros(id) ON DELETE CASCADE,
  barbeiro_nome text NOT NULL,
  data date NOT NULL,
  status text NOT NULL DEFAULT 'aberta',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(barbershop_id, barbeiro_id, data)
);

ALTER TABLE public.comandas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Barbershop access" ON public.comandas
  FOR ALL TO authenticated
  USING (is_my_barbershop(barbershop_id))
  WITH CHECK (is_my_barbershop(barbershop_id));


-- ============================================================
-- 6. PIN DE ACESSO (bcrypt via pgcrypto)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS pin_hash text;

CREATE OR REPLACE FUNCTION public.set_barbershop_pin(_pin text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF length(_pin) != 4 OR _pin !~ '^\d{4}$' THEN
    RAISE EXCEPTION 'PIN must be exactly 4 digits';
  END IF;
  UPDATE public.barbershops
    SET pin_hash = extensions.crypt(_pin, extensions.gen_salt('bf', 10))
    WHERE owner_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_barbershop_pin(_pin text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.barbershops
    WHERE owner_id = auth.uid()
      AND pin_hash IS NOT NULL
      AND pin_hash = extensions.crypt(_pin, pin_hash)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.has_barbershop_pin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.barbershops
    WHERE owner_id = auth.uid()
      AND pin_hash IS NOT NULL
  );
END;
$$;
