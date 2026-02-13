
-- Barbershops
CREATE TABLE public.barbershops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  nome TEXT NOT NULL DEFAULT 'Minha Barbearia',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.barbershops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access" ON public.barbershops FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- Helper functions (after table exists)
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

-- Barbeiros
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

-- Servicos
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

-- Produtos
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

-- Atendimentos
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

-- Auto-create barbershop on new user signup
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
