REVOKE EXECUTE ON FUNCTION public.get_supervisor_help_requests() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_supervisor_volunteers() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rate_assigned_volunteer(uuid, int, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_supervisor_help_requests() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_supervisor_volunteers() TO service_role;
GRANT EXECUTE ON FUNCTION public.rate_assigned_volunteer(uuid, int, text) TO service_role;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND _user_id = auth.uid()
  )
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;