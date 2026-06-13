REVOKE EXECUTE ON FUNCTION public.get_supervisor_help_requests() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.rate_assigned_volunteer(uuid, int, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_supervisor_help_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rate_assigned_volunteer(uuid, int, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_supervisor_help_requests() TO service_role;
GRANT EXECUTE ON FUNCTION public.rate_assigned_volunteer(uuid, int, text) TO service_role;