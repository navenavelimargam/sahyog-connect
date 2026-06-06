
-- 1. event_registrations: owner-only SELECT
DROP POLICY IF EXISTS "Event regs viewable by authenticated" ON public.event_registrations;
CREATE POLICY "Users view own registrations"
  ON public.event_registrations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. help_requests: restricted SELECT
DROP POLICY IF EXISTS "Help requests viewable by authenticated" ON public.help_requests;
CREATE POLICY "Help requests viewable by stakeholders"
  ON public.help_requests FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR auth.uid() = assigned_volunteer_id
    OR auth.uid() = ngo_id
    OR public.has_role(auth.uid(), 'ngo_supervisor'::app_role)
  );

-- 3. profiles: owner-only SELECT
DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON public.profiles;
CREATE POLICY "Users view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 4. user_roles: remove self-insert policy (handle_new_user trigger handles signup via SECURITY DEFINER)
DROP POLICY IF EXISTS "Users insert own role on signup" ON public.user_roles;

-- 5. storage sahyog-uploads: owner-folder-only SELECT
DROP POLICY IF EXISTS "Sahyog uploads readable by authenticated" ON storage.objects;
CREATE POLICY "Users read own files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'sahyog-uploads'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- 6. SECURITY DEFINER functions: revoke broad EXECUTE
-- Trigger functions (only the trigger context should call them)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_ngo_on_help_request() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_supervisor_on_new_volunteer() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_help_update() FROM PUBLIC, anon, authenticated;

-- RLS helper: needed by authenticated for policy checks, but not by anon
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- Supervisor RPCs: only authenticated (function itself checks ngo_supervisor role)
REVOKE EXECUTE ON FUNCTION public.get_supervisor_volunteers() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_supervisor_volunteers() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_supervisor_help_requests() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_supervisor_help_requests() TO authenticated;
