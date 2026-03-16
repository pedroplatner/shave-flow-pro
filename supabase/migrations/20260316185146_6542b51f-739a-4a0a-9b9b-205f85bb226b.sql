
-- Add pin_hash column to barbershops
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS pin_hash text;

-- Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Function to set the barbershop PIN (hashed server-side)
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
    SET pin_hash = encode(extensions.digest(_pin::bytea, 'sha256'), 'hex')
    WHERE owner_id = auth.uid();
END;
$$;

-- Function to verify the barbershop PIN
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
      AND pin_hash = encode(extensions.digest(_pin::bytea, 'sha256'), 'hex')
  );
END;
$$;

-- Function to check if a PIN is configured
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
