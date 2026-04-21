-- Update notify_on_help_update to also notify the supervisor and the volunteer when status changes (especially delivered)
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
  -- Volunteer just got assigned
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

  -- Status changed
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT COALESCE(full_name, 'Your volunteer') INTO vol_label
    FROM public.profiles WHERE id = NEW.assigned_volunteer_id;

    -- Notify the requesting user
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

    -- Notify the volunteer themselves on delivery (confirmation + post prompt)
    IF NEW.status = 'delivered' AND NEW.assigned_volunteer_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, icon)
      VALUES (
        NEW.assigned_volunteer_id,
        '🎉 Great work! Share your story',
        'You completed a ' || NEW.category || ' help request. Tap to create a post about your contribution and inspire others.',
        '🎉'
      );

      -- Bump tasks_completed for the volunteer
      UPDATE public.profiles
      SET tasks_completed = COALESCE(tasks_completed, 0) + 1
      WHERE id = NEW.assigned_volunteer_id;
    END IF;

    -- Notify all supervisors of this NGO on any status change
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
            WHEN 'delivered' THEN '🎉 Request completed'
            ELSE '📦 Request update: ' || NEW.status
          END,
          vol_label || ' updated request "' || NEW.category || '" at ' || NEW.location || ' to "' || NEW.status || '".',
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

-- Give all volunteers with no rating a friendly default
UPDATE public.profiles p
SET rating = 4.7
WHERE (rating IS NULL OR rating = 0)
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p.id AND ur.role = 'volunteer'
  );

-- Default new volunteer signups to a friendly starting rating
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role app_role;
BEGIN
  v_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'user');

  INSERT INTO public.profiles (id, full_name, email, phone, city, ngo_name, skills, rating)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'ngo_name',
    CASE WHEN NEW.raw_user_meta_data->>'skills' IS NOT NULL
      THEN string_to_array(NEW.raw_user_meta_data->>'skills', ',')
      ELSE NULL END,
    CASE WHEN v_role = 'volunteer' THEN 4.7 ELSE 0 END
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role);

  RETURN NEW;
END;
$function$;
