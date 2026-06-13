CREATE OR REPLACE FUNCTION public.is_supervisor_for_ngo_name(_ngo_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.user_roles ur
      ON ur.user_id = p.id
     AND ur.role = 'ngo_supervisor'::public.app_role
    WHERE p.id = auth.uid()
      AND nullif(trim(coalesce(_ngo_name, '')), '') IS NOT NULL
      AND lower(trim(coalesce(p.ngo_name, ''))) = lower(trim(coalesce(_ngo_name, '')))
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_supervisor_for_ngo_name(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_supervisor_for_ngo_name(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_supervisor_for_ngo_name(text) TO service_role;