
-- 1. Storage bucket for post + help uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('sahyog-uploads', 'sahyog-uploads', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Sahyog uploads readable by all"
ON storage.objects FOR SELECT
USING (bucket_id = 'sahyog-uploads');

CREATE POLICY "Users upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'sahyog-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'sahyog-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'sahyog-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 2. Event registrations table
CREATE TABLE public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_id text NOT NULL,
  event_title text NOT NULL,
  event_ngo text,
  event_date text,
  event_location text,
  full_name text NOT NULL,
  phone text NOT NULL,
  num_people integer NOT NULL DEFAULT 1,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event regs viewable by authenticated"
ON public.event_registrations FOR SELECT
TO authenticated USING (true);

CREATE POLICY "Users register themselves"
ON public.event_registrations FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own registrations"
ON public.event_registrations FOR UPDATE
TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users delete own registrations"
ON public.event_registrations FOR DELETE
TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_event_regs_user ON public.event_registrations(user_id);
CREATE INDEX idx_event_regs_event ON public.event_registrations(event_id);

-- 3. Notify NGO supervisor when a new volunteer joins their NGO
CREATE OR REPLACE FUNCTION public.notify_supervisor_on_new_volunteer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  vol_profile RECORD;
  supervisor RECORD;
BEGIN
  IF NEW.role <> 'volunteer' THEN
    RETURN NEW;
  END IF;

  SELECT full_name, ngo_name, city INTO vol_profile
  FROM public.profiles WHERE id = NEW.user_id;

  IF vol_profile.ngo_name IS NULL OR vol_profile.ngo_name = '' THEN
    RETURN NEW;
  END IF;

  FOR supervisor IN
    SELECT p.id
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE p.ngo_name = vol_profile.ngo_name
      AND ur.role = 'ngo_supervisor'
  LOOP
    INSERT INTO public.notifications (user_id, title, message, icon)
    VALUES (
      supervisor.id,
      '🙋 New volunteer joined ' || vol_profile.ngo_name,
      COALESCE(vol_profile.full_name, 'A volunteer') || ' from ' || COALESCE(vol_profile.city, 'your area') || ' just signed up. They are now available for assignment.',
      '🙋'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_supervisor_new_volunteer
AFTER INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.notify_supervisor_on_new_volunteer();
