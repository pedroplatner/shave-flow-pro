
-- Replace SHA-256 with bcrypt for PIN hashing

-- Update set_barbershop_pin to use bcrypt
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

-- Update verify_barbershop_pin to use bcrypt comparison
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

-- Invalidate existing SHA-256 hashes (users will need to re-set their PIN)
UPDATE public.barbershops SET pin_hash = NULL WHERE pin_hash IS NOT NULL;
