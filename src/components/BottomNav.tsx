import { Link, useLocation } from "@tanstack/react-router";
import { Home, User, LifeBuoy, LayoutDashboard, ClipboardList, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

type NavTo = "/feed" | "/profile" | "/help" | "/dashboard" | "/tasks" | "/notifications" | "/tracker";
type Item = { to: NavTo; icon: typeof Home; label: string; center?: boolean };

export function BottomNav() {
  const loc = useLocation();
  const { role } = useAuth();

  // Role-based items. The center "Help" button is always there for the requesting flow.
  let items: Item[];
  if (role === "ngo_supervisor") {
    items = [
      { to: "/feed", icon: Home, label: "Home" },
      { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/help", icon: LifeBuoy, label: "Help", center: true },
      { to: "/notifications", icon: Bell, label: "Alerts" },
      { to: "/profile", icon: User, label: "Profile" },
    ];
  } else if (role === "volunteer") {
    items = [
      { to: "/feed", icon: Home, label: "Home" },
      { to: "/tasks", icon: ClipboardList, label: "Tasks" },
      { to: "/help", icon: LifeBuoy, label: "Help", center: true },
      { to: "/notifications", icon: Bell, label: "Alerts" },
      { to: "/profile", icon: User, label: "Profile" },
    ];
  } else {
    items = [
      { to: "/feed", icon: Home, label: "Home" },
      { to: "/notifications", icon: Bell, label: "Alerts" },
      { to: "/help", icon: LifeBuoy, label: "Help", center: true },
      { to: "/tracker", icon: LayoutDashboard, label: "Tracker" } as Item,
      { to: "/profile", icon: User, label: "Profile" },
    ];
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card shadow-card">
      <div className="mx-auto flex max-w-2xl items-end justify-around px-2 py-2">
        {items.map(({ to, icon: Icon, label, center }) => {
          const active = loc.pathname === to || (to === "/feed" && loc.pathname === "/");
          if (center) {
            return (
              <Link key={to} to={to} className="-mt-6 flex flex-col items-center">
                <div className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-orange transition-transform",
                  active && "scale-110"
                )}>
                  <Icon className="h-7 w-7" />
                </div>
                <span className="mt-1 text-[10px] font-semibold text-accent">{label}</span>
              </Link>
            );
          }
          return (
            <Link key={to} to={to} className="flex flex-1 flex-col items-center py-1">
              <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("mt-1 text-[10px] font-semibold", active ? "text-primary" : "text-muted-foreground")}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
