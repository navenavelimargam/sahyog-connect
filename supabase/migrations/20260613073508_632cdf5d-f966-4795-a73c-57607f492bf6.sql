DROP POLICY IF EXISTS "Assigned volunteer can update request" ON public.help_requests;
CREATE POLICY "Assigned volunteer can update request"
ON public.help_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = assigned_volunteer_id)
WITH CHECK (
  auth.uid() = assigned_volunteer_id
  AND status IN ('accepted', 'on_the_way', 'delivered')
  AND (eta_minutes IS NULL OR eta_minutes BETWEEN 0 AND 1440)
  AND user_id = (SELECT h.user_id FROM public.help_requests h WHERE h.id = help_requests.id)
  AND assigned_volunteer_id IS NOT DISTINCT FROM (SELECT h.assigned_volunteer_id FROM public.help_requests h WHERE h.id = help_requests.id)
  AND ngo_id IS NOT DISTINCT FROM (SELECT h.ngo_id FROM public.help_requests h WHERE h.id = help_requests.id)
  AND selected_ngo_name IS NOT DISTINCT FROM (SELECT h.selected_ngo_name FROM public.help_requests h WHERE h.id = help_requests.id)
  AND sender_ngo_id IS NOT DISTINCT FROM (SELECT h.sender_ngo_id FROM public.help_requests h WHERE h.id = help_requests.id)
  AND request_type IS NOT DISTINCT FROM (SELECT h.request_type FROM public.help_requests h WHERE h.id = help_requests.id)
  AND category IS NOT DISTINCT FROM (SELECT h.category FROM public.help_requests h WHERE h.id = help_requests.id)
  AND priority IS NOT DISTINCT FROM (SELECT h.priority FROM public.help_requests h WHERE h.id = help_requests.id)
  AND description IS NOT DISTINCT FROM (SELECT h.description FROM public.help_requests h WHERE h.id = help_requests.id)
  AND location IS NOT DISTINCT FROM (SELECT h.location FROM public.help_requests h WHERE h.id = help_requests.id)
  AND latitude IS NOT DISTINCT FROM (SELECT h.latitude FROM public.help_requests h WHERE h.id = help_requests.id)
  AND longitude IS NOT DISTINCT FROM (SELECT h.longitude FROM public.help_requests h WHERE h.id = help_requests.id)
  AND ai_reason IS NOT DISTINCT FROM (SELECT h.ai_reason FROM public.help_requests h WHERE h.id = help_requests.id)
  AND image_urls IS NOT DISTINCT FROM (SELECT h.image_urls FROM public.help_requests h WHERE h.id = help_requests.id)
  AND created_at IS NOT DISTINCT FROM (SELECT h.created_at FROM public.help_requests h WHERE h.id = help_requests.id)
);