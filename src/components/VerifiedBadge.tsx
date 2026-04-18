import { CheckCircle2, Handshake, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

type BadgeKind = "user" | "volunteer" | "ngo";

export function VerifiedBadge({ kind, className }: { kind: BadgeKind; className?: string }) {
  const config = {
    user: { Icon: CheckCircle2, label: "Verified", classes: "bg-success/15 text-success" },
    volunteer: { Icon: Handshake, label: "Volunteer", classes: "bg-chart-4/15 text-chart-4" },
    ngo: { Icon: Building2, label: "NGO", classes: "bg-accent/15 text-accent" },
  }[kind];
  const { Icon, label, classes } = config;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", classes, className)}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
