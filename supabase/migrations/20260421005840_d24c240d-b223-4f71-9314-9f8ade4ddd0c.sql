create or replace function public.get_supervisor_volunteers()
returns table (
  id uuid,
  full_name text,
  city text,
  skills text[],
  rating numeric,
  tasks_completed integer,
  ngo_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.full_name,
    p.city,
    p.skills,
    p.rating,
    p.tasks_completed,
    p.ngo_name
  from public.profiles p
  join public.user_roles ur
    on ur.user_id = p.id
   and ur.role = 'volunteer'
  join public.profiles supervisor
    on supervisor.id = auth.uid()
  where public.has_role(auth.uid(), 'ngo_supervisor')
    and nullif(trim(coalesce(supervisor.ngo_name, '')), '') is not null
    and lower(trim(coalesce(p.ngo_name, ''))) = lower(trim(coalesce(supervisor.ngo_name, '')))
  order by coalesce(p.tasks_completed, 0) desc, p.full_name asc;
$$;

grant execute on function public.get_supervisor_volunteers() to authenticated;

create or replace function public.get_supervisor_help_requests()
returns table (
  id uuid,
  user_id uuid,
  category text,
  priority text,
  description text,
  location text,
  status text,
  selected_ngo_name text,
  assigned_volunteer_id uuid,
  created_at timestamptz,
  requester_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    hr.id,
    hr.user_id,
    hr.category,
    hr.priority,
    hr.description,
    hr.location,
    hr.status,
    hr.selected_ngo_name,
    hr.assigned_volunteer_id,
    hr.created_at,
    coalesce(req.full_name, 'Community member') as requester_name
  from public.help_requests hr
  join public.profiles supervisor
    on supervisor.id = auth.uid()
  left join public.profiles req
    on req.id = hr.user_id
  where public.has_role(auth.uid(), 'ngo_supervisor')
    and nullif(trim(coalesce(supervisor.ngo_name, '')), '') is not null
    and lower(trim(coalesce(hr.selected_ngo_name, ''))) = lower(trim(coalesce(supervisor.ngo_name, '')))
  order by hr.created_at desc
  limit 100;
$$;

grant execute on function public.get_supervisor_help_requests() to authenticated;