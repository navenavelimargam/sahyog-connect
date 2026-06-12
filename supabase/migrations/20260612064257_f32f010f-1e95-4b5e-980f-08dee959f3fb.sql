
-- 1. Tighten B2B update policy
DROP POLICY IF EXISTS "NGO supervisors can update owned or claim open requests" ON public.b2b_requests;

CREATE POLICY "Owners can update their b2b requests"
ON public.b2b_requests FOR UPDATE
USING (has_role(auth.uid(), 'ngo_supervisor'::app_role) AND auth.uid() = ngo_id)
WITH CHECK (has_role(auth.uid(), 'ngo_supervisor'::app_role) AND auth.uid() = ngo_id);

CREATE POLICY "Supporters can update requests they claimed"
ON public.b2b_requests FOR UPDATE
USING (has_role(auth.uid(), 'ngo_supervisor'::app_role) AND auth.uid() = supporter_id)
WITH CHECK (has_role(auth.uid(), 'ngo_supervisor'::app_role) AND auth.uid() = supporter_id);

CREATE POLICY "NGO supervisors can claim open requests"
ON public.b2b_requests FOR UPDATE
USING (
  has_role(auth.uid(), 'ngo_supervisor'::app_role)
  AND status = 'open'::b2b_status
  AND supporter_id IS NULL
  AND auth.uid() <> ngo_id
)
WITH CHECK (
  has_role(auth.uid(), 'ngo_supervisor'::app_role)
  AND auth.uid() = supporter_id
);

-- 2. Remove client-side notification inserts
DROP POLICY IF EXISTS "Users insert own notifications" ON public.notifications;

-- 3. Provide secure RPC for rating a volunteer (replaces direct client notification insert)
CREATE OR REPLACE FUNCTION public.rate_assigned_volunteer(
  _request_id uuid,
  _rating int,
  _feedback text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_volunteer uuid;
  v_prev numeric;
  v_tasks int;
  v_new numeric;
BEGIN
  IF _rating < 1 OR _rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;

  SELECT assigned_volunteer_id INTO v_volunteer
  FROM public.help_requests
  WHERE id = _request_id AND user_id = auth.uid();

  IF v_volunteer IS NULL THEN
    RAISE EXCEPTION 'Not authorized or no volunteer assigned';
  END IF;

  SELECT COALESCE(rating, 5), COALESCE(tasks_completed, 0) + 1
    INTO v_prev, v_tasks
  FROM public.profiles WHERE id = v_volunteer;

  v_new := ROUND(((v_prev * (v_tasks - 1)) + _rating) / v_tasks, 2);

  UPDATE public.profiles
  SET rating = v_new, tasks_completed = v_tasks
  WHERE id = v_volunteer;

  INSERT INTO public.notifications (user_id, title, message, icon)
  VALUES (
    v_volunteer,
    '⭐ You received a ' || _rating || '-star rating!',
    CASE WHEN _feedback IS NOT NULL AND length(_feedback) > 0
      THEN '"' || _feedback || '" — Your new average rating is ' || v_new::text || ' ⭐'
      ELSE 'A community member rated your help ' || _rating || '/5. Your new average is ' || v_new::text || ' ⭐. Keep up the great work!'
    END,
    '⭐'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rate_assigned_volunteer(uuid, int, text) TO authenticated;
