import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const TRACKER_STEPS = [
  { key: "accepted", label: "Request Accepted", desc: "NGO has accepted your request and is assigning a volunteer" },
  { key: "on_the_way", label: "On The Way", desc: "Your volunteer is heading to your location" },
  { key: "delivered", label: "Delivered", desc: "Help has been delivered — thank you for using Sahyog" },
] as const;

export type TrackerStatus = typeof TRACKER_STEPS[number]["key"] | "pending";

/** Map a help_request.status to a step index in TRACKER_STEPS (0-based). */
export function statusToIndex(status: string, hasVolunteer: boolean): number {
  if (status === "delivered") return 2;
  if (status === "on_the_way") return 1;
  if (status === "accepted") return hasVolunteer ? 0 : -1;
  return -1; // pending / unknown
}

interface Props {
  status: string;
  hasVolunteer: boolean;
  updatedAt?: string | null;
  className?: string;
  compact?: boolean;
}

/**
 * Vertical timeline that mirrors the same 3 statuses on every screen
 * (user tracker, NGO dashboard, volunteer task card).
 */
export function StatusTimeline({ status, hasVolunteer, updatedAt, className, compact }: Props) {
  const active = statusToIndex(status, hasVolunteer);
  const niceTime = updatedAt ? new Date(updatedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : null;

  return (
    <ol className={cn("relative space-y-3", compact && "space-y-2", className)}>
      {TRACKER_STEPS.map((step, i) => {
        const done = i < active;
        const current = i === active;
        const pending = i > active;
        return (
          <li key={step.key} className="relative flex gap-3">
            {/* connector */}
            {i < TRACKER_STEPS.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "absolute left-[11px] top-6 h-[calc(100%-4px)] w-0.5",
                  done ? "bg-success" : current ? "bg-accent/50" : "bg-border"
                )}
              />
            )}
            <div
              className={cn(
                "relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                done && "border-success bg-success text-success-foreground",
                current && "border-accent bg-accent text-accent-foreground animate-pulse",
                pending && "border-border bg-background text-muted-foreground"
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : <span className="text-[10px] font-bold">{i + 1}</span>}
            </div>
            <div className="flex-1 pb-1">
              <div
                className={cn(
                  "text-sm font-bold leading-tight",
                  done && "text-success",
                  current && "text-accent",
                  pending && "text-muted-foreground"
                )}
              >
                {step.label}
              </div>
              {!compact && (
                <div className="text-[11px] text-muted-foreground">
                  {current && niceTime ? `Updated ${niceTime}` : step.desc}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
