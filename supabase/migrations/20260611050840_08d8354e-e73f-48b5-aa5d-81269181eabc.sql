
ALTER TABLE public.help_requests
  ADD COLUMN IF NOT EXISTS request_type text NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS sender_ngo_id uuid;

ALTER TABLE public.help_requests
  DROP CONSTRAINT IF EXISTS help_requests_request_type_check;
ALTER TABLE public.help_requests
  ADD CONSTRAINT help_requests_request_type_check
  CHECK (request_type IN ('user','ngo'));

DROP FUNCTION IF EXISTS public.get_supervisor_help_requests();

CREATE OR REPLACE FUNCTION public.get_supervisor_help_requests()
 RETURNS TABLE(
   id uuid, user_id uuid, category text, priority text, description text,
   location text, status text, selected_ngo_name text, assigned_volunteer_id uuid,
   created_at timestamp with time zone, requester_name text, image_urls text[],
   latitude double precision, longitude double precision, ai_reason text,
   request_type text, sender_ngo_id uuid, sender_ngo_name text
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select hr.id, hr.user_id, hr.category, hr.priority, hr.description, hr.location,
    hr.status, hr.selected_ngo_name, hr.assigned_volunteer_id, hr.created_at,
    coalesce(req.full_name, 'Community member'),
    hr.image_urls, hr.latitude, hr.longitude, hr.ai_reason,
    hr.request_type, hr.sender_ngo_id,
    sender.ngo_name
  from public.help_requests hr
  join public.profiles supervisor on supervisor.id = auth.uid()
  left join public.profiles req on req.id = hr.user_id
  left join public.profiles sender on sender.id = hr.sender_ngo_id
  where public.has_role(auth.uid(), 'ngo_supervisor')
    and nullif(trim(coalesce(supervisor.ngo_name, '')), '') is not null
    and lower(trim(coalesce(hr.selected_ngo_name, ''))) = lower(trim(coalesce(supervisor.ngo_name, '')))
  order by
    case when hr.request_type = 'ngo' then 0 else 1 end,
    hr.created_at desc
  limit 100;
$function$;
