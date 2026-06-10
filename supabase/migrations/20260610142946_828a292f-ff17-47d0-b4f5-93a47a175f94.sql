
CREATE TYPE public.b2b_category AS ENUM ('food_supplies', 'financial_aid', 'medical_appliances');
CREATE TYPE public.b2b_urgency AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.b2b_status AS ENUM ('open', 'fulfilling', 'closed');

CREATE TABLE public.b2b_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ngo_name text NOT NULL,
  category public.b2b_category NOT NULL,
  urgency public.b2b_urgency NOT NULL DEFAULT 'medium',
  quantity text NOT NULL,
  description text NOT NULL,
  needed_by date,
  status public.b2b_status NOT NULL DEFAULT 'open',
  supporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  supporter_ngo_name text,
  city text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.b2b_requests TO authenticated;
GRANT ALL ON public.b2b_requests TO service_role;

ALTER TABLE public.b2b_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "NGO supervisors can view all b2b requests"
  ON public.b2b_requests FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'ngo_supervisor'));

CREATE POLICY "NGO supervisors can create their own b2b requests"
  ON public.b2b_requests FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'ngo_supervisor') AND auth.uid() = ngo_id);

CREATE POLICY "NGO supervisors can update owned or claim open requests"
  ON public.b2b_requests FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'ngo_supervisor')
    AND (auth.uid() = ngo_id OR status = 'open' OR auth.uid() = supporter_id)
  )
  WITH CHECK (public.has_role(auth.uid(), 'ngo_supervisor'));

CREATE POLICY "Owners can delete their b2b requests"
  ON public.b2b_requests FOR DELETE
  TO authenticated
  USING (auth.uid() = ngo_id);

CREATE OR REPLACE FUNCTION public.update_b2b_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_b2b_requests_updated_at
  BEFORE UPDATE ON public.b2b_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_b2b_updated_at();

CREATE INDEX idx_b2b_requests_status_created ON public.b2b_requests (status, created_at DESC);
CREATE INDEX idx_b2b_requests_ngo_id ON public.b2b_requests (ngo_id);
