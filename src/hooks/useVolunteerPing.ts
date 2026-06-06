import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentPosition } from "@/lib/geolocation";

// Pings volunteer location to Supabase every 30s while the tab is open.
export function useVolunteerPing(userId: string | null, role: string | null) {
  useEffect(() => {
    if (!userId || role !== "volunteer") return;
    let cancelled = false;

    const ping = async () => {
      if (cancelled || document.hidden) return;
      try {
        const c = await getCurrentPosition();
        if (cancelled) return;
        await supabase
          .from("profiles")
          .update({
            latitude: c.lat,
            longitude: c.lng,
            last_seen_at: new Date().toISOString(),
          })
          .eq("id", userId);
      } catch {
        // user may have denied permission — silent
      }
    };

    ping();
    const id = window.setInterval(ping, 30_000);
    const onVisible = () => { if (!document.hidden) ping(); };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [userId, role]);
}
