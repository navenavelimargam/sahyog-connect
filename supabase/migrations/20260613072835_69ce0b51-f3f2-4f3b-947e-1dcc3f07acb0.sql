CREATE OR REPLACE FUNCTION public.is_supervisor_for_ngo_name(_ngo_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
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

DROP POLICY IF EXISTS "Help requests viewable by stakeholders" ON public.help_requests;
CREATE POLICY "Help requests viewable by stakeholders"
ON public.help_requests
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR auth.uid() = assigned_volunteer_id
  OR auth.uid() = ngo_id
  OR public.is_supervisor_for_ngo_name(selected_ngo_name)
);

DROP POLICY IF EXISTS "NGO supervisors can update requests" ON public.help_requests;
CREATE POLICY "NGO supervisors can update requests"
ON public.help_requests
FOR UPDATE
TO authenticated
USING (
  public.is_supervisor_for_ngo_name(selected_ngo_name)
)
WITH CHECK (
  public.is_supervisor_for_ngo_name(selected_ngo_name)
  AND user_id = (SELECT h.user_id FROM public.help_requests h WHERE h.id = help_requests.id)
  AND selected_ngo_name IS NOT DISTINCT FROM (SELECT h.selected_ngo_name FROM public.help_requests h WHERE h.id = help_requests.id)
  AND sender_ngo_id IS NOT DISTINCT FROM (SELECT h.sender_ngo_id FROM public.help_requests h WHERE h.id = help_requests.id)
  AND request_type IS NOT DISTINCT FROM (SELECT h.request_type FROM public.help_requests h WHERE h.id = help_requests.id)
);