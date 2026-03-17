
INSERT INTO public.barbershops (owner_id)
SELECT id FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.barbershops b WHERE b.owner_id = u.id
);
