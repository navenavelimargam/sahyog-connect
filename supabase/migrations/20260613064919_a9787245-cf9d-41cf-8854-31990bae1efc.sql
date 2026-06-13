
DROP POLICY IF EXISTS "Owner or assigned can update" ON public.help_requests;

-- Requester can edit their own request but cannot change assignment fields
CREATE POLICY "Requester can update own request"
ON public.help_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND assigned_volunteer_id IS NOT DISTINCT FROM (SELECT assigned_volunteer_id FROM public.help_requests h WHERE h.id = help_requests.id)
  AND ngo_id IS NOT DISTINCT FROM (SELECT ngo_id FROM public.help_requests h WHERE h.id = help_requests.id)
  AND sender_ngo_id IS NOT DISTINCT FROM (SELECT sender_ngo_id FROM public.help_requests h WHERE h.id = help_requests.id)
);

-- Assigned volunteer can update status/eta but cannot reassign the request
CREATE POLICY "Assigned volunteer can update request"
ON public.help_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = assigned_volunteer_id)
WITH CHECK (
  auth.uid() = assigned_volunteer_id
  AND user_id = (SELECT user_id FROM public.help_requests h WHERE h.id = help_requests.id)
);

-- NGO supervisors can manage requests for their NGO
CREATE POLICY "NGO supervisors can update requests"
ON public.help_requests
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'ngo_supervisor'))
WITH CHECK (public.has_role(auth.uid(), 'ngo_supervisor'));
