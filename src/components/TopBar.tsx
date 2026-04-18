import { Link } from "@tanstack/react-router";
import { Bell, Search } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { SahyogLogo } from "./SahyogLogo";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TopBarProps {
  search?: string;
  onSearchChange?: (v: string) => void;
  unreadCount?: number;
}

export function TopBar({ search, onSearchChange, unreadCount = 0 }: TopBarProps) {
  const { profile } = useAuth();
  const initials = profile?.full_name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur shadow-card">
      <div className="mx-auto flex max-w-2xl items-center gap-2 px-3 py-2">
        <Link to="/feed"><SahyogLogo size={36} /></Link>
        <div className="relative ml-2 flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search NGOs, events, requests..."
            value={search ?? ""}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full rounded-full border border-border bg-background py-2 pl-8 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <ThemeToggle />
        <Link to="/notifications" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </Link>
        <Link to="/profile">
          <Avatar className="h-8 w-8 border-2 border-primary">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">{initials}</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}
