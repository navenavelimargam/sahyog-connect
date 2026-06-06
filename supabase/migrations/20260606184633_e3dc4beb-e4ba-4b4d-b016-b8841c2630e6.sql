
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

ALTER TABLE public.help_requests
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS ai_reason text;

CREATE INDEX IF NOT EXISTS idx_profiles_latlng ON public.profiles(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_help_requests_latlng ON public.help_requests(latitude, longitude);

DROP FUNCTION IF EXISTS public.get_supervisor_help_requests();
DROP FUNCTION IF EXISTS public.get_supervisor_volunteers();

CREATE FUNCTION public.get_supervisor_help_requests()
 RETURNS TABLE(id uuid, user_id uuid, category text, priority text, description text, location text, status text, selected_ngo_name text, assigned_volunteer_id uuid, created_at timestamp with time zone, requester_name text, image_urls text[], latitude double precision, longitude double precision, ai_reason text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  select hr.id, hr.user_id, hr.category, hr.priority, hr.description, hr.location,
    hr.status, hr.selected_ngo_name, hr.assigned_volunteer_id, hr.created_at,
    coalesce(req.full_name, 'Community member'),
    hr.image_urls, hr.latitude, hr.longitude, hr.ai_reason
  from public.help_requests hr
  join public.profiles supervisor on supervisor.id = auth.uid()
  left join public.profiles req on req.id = hr.user_id
  where public.has_role(auth.uid(), 'ngo_supervisor')
    and nullif(trim(coalesce(supervisor.ngo_name, '')), '') is not null
    and lower(trim(coalesce(hr.selected_ngo_name, ''))) = lower(trim(coalesce(supervisor.ngo_name, '')))
  order by hr.created_at desc
  limit 100;
$$;

CREATE FUNCTION public.get_supervisor_volunteers()
 RETURNS TABLE(id uuid, full_name text, city text, skills text[], rating numeric, tasks_completed integer, ngo_name text, latitude double precision, longitude double precision, last_seen_at timestamptz)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  select p.id, p.full_name, p.city, p.skills, p.rating, p.tasks_completed, p.ngo_name,
    p.latitude, p.longitude, p.last_seen_at
  from public.profiles p
  join public.user_roles ur on ur.user_id = p.id and ur.role = 'volunteer'
  join public.profiles supervisor on supervisor.id = auth.uid()
  where public.has_role(auth.uid(), 'ngo_supervisor')
    and nullif(trim(coalesce(supervisor.ngo_name, '')), '') is not null
    and lower(trim(coalesce(p.ngo_name, ''))) = lower(trim(coalesce(supervisor.ngo_name, '')))
  order by coalesce(p.tasks_completed, 0) desc, p.full_name asc;
$$;

REVOKE EXECUTE ON FUNCTION public.get_supervisor_help_requests() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_supervisor_volunteers() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_supervisor_help_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_supervisor_volunteers() TO authenticated;
