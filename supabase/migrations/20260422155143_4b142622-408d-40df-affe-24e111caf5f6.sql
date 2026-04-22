DROP FUNCTION IF EXISTS public.get_supervisor_help_requests();

CREATE OR REPLACE FUNCTION public.get_supervisor_help_requests()
 RETURNS TABLE(id uuid, user_id uuid, category text, priority text, description text, location text, status text, selected_ngo_name text, assigned_volunteer_id uuid, created_at timestamp with time zone, requester_name text, image_urls text[])
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    coalesce(req.full_name, 'Community member') as requester_name,
    hr.image_urls
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
$function$;

CREATE OR REPLACE FUNCTION public.notify_on_help_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  ngo_label text;
  vol_label text;
  supervisor RECORD;
BEGIN
  IF NEW.assigned_volunteer_id IS NOT NULL
     AND (OLD.assigned_volunteer_id IS DISTINCT FROM NEW.assigned_volunteer_id) THEN
    ngo_label := COALESCE(NEW.selected_ngo_name, 'an NGO');
    INSERT INTO public.notifications (user_id, title, message, icon)
    VALUES (
      NEW.assigned_volunteer_id,
      '🤝 New assignment from ' || ngo_label,
      'You have been assigned a ' || NEW.category || ' help request at ' || NEW.location || '. Open Tasks to update status.',
      '🤝'
    );
    INSERT INTO public.notifications (user_id, title, message, icon)
    VALUES (
      NEW.user_id,
      '✅ Volunteer assigned',
      'A volunteer from ' || ngo_label || ' is on the way. Open the tracker to follow live updates.',
      '✅'
    );
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT COALESCE(full_name, 'Your volunteer') INTO vol_label
    FROM public.profiles WHERE id = NEW.assigned_volunteer_id;

    INSERT INTO public.notifications (user_id, title, message, icon)
    VALUES (
      NEW.user_id,
      CASE NEW.status
        WHEN 'delivered' THEN '🎉 Help delivered — please rate your volunteer'
        ELSE '📦 Request status: ' || NEW.status
      END,
      CASE NEW.status
        WHEN 'delivered' THEN vol_label || ' marked your request as completed. Open the tracker to leave a rating and share your experience.'
        ELSE vol_label || ' updated your help request to "' || NEW.status || '".'
      END,
      CASE NEW.status
        WHEN 'accepted' THEN '✅'
        WHEN 'on_the_way' THEN '🚗'
        WHEN 'delivered' THEN '🎉'
        ELSE '📦'
      END
    );

    IF NEW.status = 'delivered' AND NEW.assigned_volunteer_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, icon)
      VALUES (
        NEW.assigned_volunteer_id,
        '🎉 Great work! Share your story',
        'You completed a ' || NEW.category || ' help request. Tap to create a post about your contribution and inspire others.',
        '🎉'
      );

      UPDATE public.profiles
      SET tasks_completed = COALESCE(tasks_completed, 0) + 1
      WHERE id = NEW.assigned_volunteer_id;
    END IF;

    IF NEW.selected_ngo_name IS NOT NULL THEN
      FOR supervisor IN
        SELECT p.id
        FROM public.profiles p
        JOIN public.user_roles ur ON ur.user_id = p.id
        WHERE lower(trim(coalesce(p.ngo_name, ''))) = lower(trim(NEW.selected_ngo_name))
          AND ur.role = 'ngo_supervisor'
      LOOP
        INSERT INTO public.notifications (user_id, title, message, icon)
        VALUES (
          supervisor.id,
          CASE NEW.status
            WHEN 'delivered' THEN '🎉 Request completed — share the proof'
            ELSE '📦 Request update: ' || NEW.status
          END,
          CASE NEW.status
            WHEN 'delivered' THEN vol_label || ' completed "' || NEW.category || '" at ' || NEW.location || '. Tap to publish a success story as proof of impact.'
            ELSE vol_label || ' updated request "' || NEW.category || '" at ' || NEW.location || ' to "' || NEW.status || '".'
          END,
          CASE NEW.status
            WHEN 'accepted' THEN '✅'
            WHEN 'on_the_way' THEN '🚗'
            WHEN 'delivered' THEN '🎉'
            ELSE '📦'
          END
        );
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;