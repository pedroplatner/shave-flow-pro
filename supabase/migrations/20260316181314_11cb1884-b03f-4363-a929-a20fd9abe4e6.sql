
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
  FOR ALL
  TO authenticated
  USING (is_my_barbershop(barbershop_id))
  WITH CHECK (is_my_barbershop(barbershop_id));
