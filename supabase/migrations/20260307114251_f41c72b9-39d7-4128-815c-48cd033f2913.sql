
-- Fix RESTRICTIVE policies on caixas_diarios, caixa_movimentacoes, agendamentos
DROP POLICY IF EXISTS "Barbershop access" ON public.caixas_diarios;
CREATE POLICY "Barbershop access" ON public.caixas_diarios FOR ALL TO authenticated USING (is_my_barbershop(barbershop_id)) WITH CHECK (is_my_barbershop(barbershop_id));

DROP POLICY IF EXISTS "Barbershop access" ON public.caixa_movimentacoes;
CREATE POLICY "Barbershop access" ON public.caixa_movimentacoes FOR ALL TO authenticated USING (is_my_barbershop(barbershop_id)) WITH CHECK (is_my_barbershop(barbershop_id));

DROP POLICY IF EXISTS "Barbershop access" ON public.agendamentos;
CREATE POLICY "Barbershop access" ON public.agendamentos FOR ALL TO authenticated USING (is_my_barbershop(barbershop_id)) WITH CHECK (is_my_barbershop(barbershop_id));

-- Add custo and fornecedor columns to produtos
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS custo numeric DEFAULT 0;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS fornecedor text DEFAULT '';
