
-- Tabela caixas_diarios
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
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (is_my_barbershop(barbershop_id))
  WITH CHECK (is_my_barbershop(barbershop_id));

-- Tabela caixa_movimentacoes
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
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (is_my_barbershop(barbershop_id))
  WITH CHECK (is_my_barbershop(barbershop_id));
