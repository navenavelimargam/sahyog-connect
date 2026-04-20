import { useEffect, useState } from "react";
import { getSignedUrls } from "@/lib/uploads";
import { ImageIcon } from "lucide-react";

/**
 * Renders an image stored in the private sahyog-uploads bucket by resolving a signed URL.
 * Falls back to a placeholder while loading or if the path is empty.
 */
export function SignedImage({ path, alt, className }: { path: string; alt: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!path) return;
    // Already a public URL? Just use it.
    if (path.startsWith("http")) { setUrl(path); return; }
    getSignedUrls([path]).then((urls) => { if (!cancelled) setUrl(urls[0] ?? null); });
    return () => { cancelled = true; };
  }, [path]);

  if (!url) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className ?? ""}`}>
        <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
      </div>
    );
  }
  return <img src={url} alt={alt} loading="lazy" className={className} />;
}
