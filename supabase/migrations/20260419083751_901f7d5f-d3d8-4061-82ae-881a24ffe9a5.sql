
-- Add columns for NGO selection + ETA tracking
ALTER TABLE public.help_requests
  ADD COLUMN IF NOT EXISTS selected_ngo_name text,
  ADD COLUMN IF NOT EXISTS eta_minutes integer;

-- Index to find supervisors by NGO name quickly
CREATE INDEX IF NOT EXISTS idx_profiles_ngo_name ON public.profiles (ngo_name);
CREATE INDEX IF NOT EXISTS idx_help_requests_selected_ngo ON public.help_requests (selected_ngo_name);
CREATE INDEX IF NOT EXISTS idx_help_requests_assigned_volunteer ON public.help_requests (assigned_volunteer_id);

-- Trigger: notify NGO supervisors when a help request is created with a selected NGO
CREATE OR REPLACE FUNCTION public.notify_ngo_on_help_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supervisor RECORD;
  requester_name text;
BEGIN
  IF NEW.selected_ngo_name IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(full_name, 'A community member') INTO requester_name
  FROM public.profiles WHERE id = NEW.user_id;

  FOR supervisor IN
    SELECT p.id
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE p.ngo_name = NEW.selected_ngo_name
      AND ur.role = 'ngo_supervisor'
  LOOP
    INSERT INTO public.notifications (user_id, title, message, icon)
    VALUES (
      supervisor.id,
      '🆘 New help request — ' || UPPER(NEW.priority),
      requester_name || ' needs ' || NEW.category || ' help at ' || NEW.location || '. Tap to assign a volunteer.',
      '🆘'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_ngo_on_help_request ON public.help_requests;
CREATE TRIGGER trg_notify_ngo_on_help_request
AFTER INSERT ON public.help_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_ngo_on_help_request();

-- Trigger: notify volunteer when assigned, and notify user on status changes
CREATE OR REPLACE FUNCTION public.notify_on_help_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ngo_label text;
  vol_label text;
BEGIN
  -- Volunteer just got assigned
  IF NEW.assigned_volunteer_id IS NOT NULL
     AND (OLD.assigned_volunteer_id IS DISTINCT FROM NEW.assigned_volunteer_id) THEN
    ngo_label := COALESCE(NEW.selected_ngo_name, 'an NGO');
    INSERT INTO public.notifications (user_id, title, message, icon)
    VALUES (
      NEW.assigned_volunteer_id,
      '🤝 New assignment from ' || ngo_label,
      'You have been assigned a ' || NEW.category || ' help request at ' || NEW.location || '. Open Tasks to update status.',
      '🤝'
    );

    -- Also tell the requesting user
    INSERT INTO public.notifications (user_id, title, message, icon)
    VALUES (
      NEW.user_id,
      '✅ Volunteer assigned',
      'A volunteer from ' || ngo_label || ' is on the way. Open the tracker to follow live updates.',
      '✅'
    );
  END IF;

  -- Status changed by volunteer / NGO
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT COALESCE(full_name, 'Your volunteer') INTO vol_label
    FROM public.profiles WHERE id = NEW.assigned_volunteer_id;

    INSERT INTO public.notifications (user_id, title, message, icon)
    VALUES (
      NEW.user_id,
      '📦 Request status: ' || NEW.status,
      vol_label || ' updated your help request to "' || NEW.status || '".',
      CASE NEW.status
        WHEN 'accepted' THEN '✅'
        WHEN 'on_the_way' THEN '🚗'
        WHEN 'delivered' THEN '🎉'
        ELSE '📦'
      END
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_help_update ON public.help_requests;
CREATE TRIGGER trg_notify_on_help_update
AFTER UPDATE ON public.help_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_on_help_update();
