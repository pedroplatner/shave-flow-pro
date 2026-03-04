
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

CREATE POLICY "Barbershop access" ON public.agendamentos AS RESTRICTIVE FOR ALL TO authenticated
  USING (is_my_barbershop(barbershop_id))
  WITH CHECK (is_my_barbershop(barbershop_id));
