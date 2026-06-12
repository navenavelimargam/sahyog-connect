import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  url?: string; // absolute or relative; resolves to current origin
  caption?: string; // for Instagram (clipboard); falls back to title
  className?: string;
  compact?: boolean;
}

/**
 * Subtle row of share buttons: WhatsApp, LinkedIn, Instagram (clipboard).
 * Renders inline SVGs so we don't depend on extra icon packages.
 */
export function ShareButtons({ title, url, caption, className, compact = true }: Props) {
  const absoluteUrl = (() => {
    if (typeof window === "undefined") return url ?? "";
    if (!url) return window.location.href;
    if (url.startsWith("http")) return url;
    return new URL(url, window.location.origin).toString();
  })();

  const waText = encodeURIComponent(`Check this out on Sahyog: ${title} ${absoluteUrl}`);
  const waHref = `https://wa.me/?text=${waText}`;
  const linkedInHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    absoluteUrl
  )}&title=${encodeURIComponent(title)}`;

  const igCaption = caption ?? `${title}\n\nSeen on Sahyog — India's volunteer coordination network.\n${absoluteUrl}`;

  const handleInstagram = async () => {
    try {
      await navigator.clipboard.writeText(igCaption);
      toast.success("Caption copied! Open Instagram to paste");
    } catch {
      toast.error("Could not copy caption");
    }
  };

  const size = compact ? "h-7 w-7" : "h-9 w-9";
  const icon = compact ? 14 : 18;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Share
      </span>
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on WhatsApp"
        className={cn(
          "flex items-center justify-center rounded-full bg-[#25D366] text-white transition hover:opacity-90",
          size
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <svg viewBox="0 0 24 24" width={icon} height={icon} fill="currentColor" aria-hidden>
          <path d="M19.05 4.91A10 10 0 0 0 4.1 18.36L3 22l3.74-1.07a10 10 0 0 0 4.84 1.24h.01a10 10 0 0 0 7.46-17.26zM12.6 20.5h-.01a8.3 8.3 0 0 1-4.24-1.16l-.3-.18-2.22.64.63-2.17-.2-.31a8.32 8.32 0 1 1 6.34 3.18zm4.55-6.22c-.25-.13-1.47-.72-1.7-.8-.23-.09-.4-.13-.56.12-.17.25-.65.8-.8.97-.15.17-.3.19-.55.06-.25-.12-1.04-.38-1.99-1.22-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.39.11-.51.11-.11.25-.3.37-.45.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.4-.42-.56-.43-.14 0-.31-.02-.48-.02s-.43.06-.65.31c-.22.25-.85.83-.85 2.02 0 1.18.86 2.33.98 2.49.12.17 1.7 2.6 4.12 3.65 1.45.62 2.02.68 2.74.57.43-.06 1.34-.55 1.53-1.08.19-.53.19-.99.13-1.08-.06-.09-.23-.15-.48-.27z" />
        </svg>
      </a>
      <a
        href={linkedInHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
        className={cn(
          "flex items-center justify-center rounded-full bg-[#0A66C2] text-white transition hover:opacity-90",
          size
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <svg viewBox="0 0 24 24" width={icon} height={icon} fill="currentColor" aria-hidden>
          <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.03-1.85-3.03-1.85 0-2.13 1.45-2.13 2.94v5.66H9.36V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.8 0 0 .77 0 1.72v20.56C0 23.23.8 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
        </svg>
      </a>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleInstagram();
        }}
        aria-label="Copy caption for Instagram"
        className={cn(
          "flex items-center justify-center rounded-full text-white transition hover:opacity-90",
          "bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]",
          size
        )}
      >
        <svg viewBox="0 0 24 24" width={icon} height={icon} fill="currentColor" aria-hidden>
          <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.34 4.14.63a5.86 5.86 0 0 0-2.13 1.38A5.86 5.86 0 0 0 .63 4.14C.34 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.27 2.15.56 2.91.31.81.72 1.5 1.38 2.16.66.66 1.35 1.07 2.16 1.38.76.29 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.27 2.91-.56.81-.31 1.5-.72 2.16-1.38.66-.66 1.07-1.35 1.38-2.16.29-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.27-2.15-.56-2.91a5.86 5.86 0 0 0-1.38-2.16A5.86 5.86 0 0 0 19.86.63C19.1.34 18.22.13 16.95.07 15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zm0 10.16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.84a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z" />
        </svg>
      </button>
    </div>
  );
}
