import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Camera, Megaphone, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { uploadFiles } from "@/lib/uploads";

export const Route = createFileRoute("/post")({
  component: CreatePostPage,
  head: () => ({ meta: [{ title: "Create Post — Sahyog" }] }),
});

const POST_TYPES = [
  { key: "activity", label: "Activity Update" },
  { key: "event", label: "Event/Camp" },
  { key: "story", label: "Success Story" },
  { key: "urgent", label: "Urgent Appeal" },
];

const CATEGORIES = ["tree", "blood", "food", "shelter", "medical", "education", "emergency", "clothes", "water", "animal"];

function CreatePostPage() {
  const { user, loading, profile } = useAuth();
  const navigate = useNavigate();
  const [postType, setPostType] = useState("activity");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState(profile?.city || "");
  const [category, setCategory] = useState("food");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const onPickFiles = (list: FileList | null) => {
    if (!list) return;
    const picked = Array.from(list).slice(0, 4 - files.length);
    const sizeOk = picked.filter((f) => {
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`${f.name} is over 5MB and was skipped`);
        return false;
      }
      return true;
    });
    setFiles((prev) => [...prev, ...sizeOk]);
    setPreviews((prev) => [...prev, ...sizeOk.map((f) => URL.createObjectURL(f))]);
  };

  const removeFile = (i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => {
      const url = prev[i];
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title || !description) { toast.error("Title and description required"); return; }
    setBusy(true);
    try {
      const paths = files.length > 0 ? await uploadFiles(user.id, files) : [];
      const { error } = await supabase.from("posts").insert({
        author_id: user.id,
        post_type: postType,
        title,
        description,
        category,
        location,
        image_urls: paths,
      });
      if (error) throw error;
      toast.success("Post published! 📢");
      navigate({ to: "/profile" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not publish post";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <main className="mx-auto max-w-2xl px-4 py-4">
        <h1 className="font-display text-2xl font-bold">📢 Create Post</h1>
        <p className="text-sm text-muted-foreground">Share an update, event, or appeal with the Sahyog community.</p>

        <form onSubmit={submit} className="mt-4 space-y-4 rounded-2xl border border-border bg-card p-4 shadow-card">
          <div>
            <Label>Post Type</Label>
            <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {POST_TYPES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setPostType(t.key)}
                  className={cn(
                    "rounded-lg border-2 px-2 py-2 text-xs font-semibold",
                    postType === t.key ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Posting as</Label>
            <Input value={profile?.ngo_name || profile?.full_name || ""} disabled />
          </div>

          <div className="space-y-2">
            <Label>Post Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tree plantation drive — Sunday morning" required />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell the community what you did, what you need, or what's coming up…" required />
          </div>

          <div className="space-y-2">
            <Label>Upload Images (up to 4, max 5MB each)</Label>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => { onPickFiles(e.target.files); e.target.value = ""; }}
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={files.length >= 4}
              className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 py-8 text-sm text-muted-foreground hover:border-primary disabled:opacity-50"
            >
              <Camera className="mb-2 h-6 w-6" />
              {files.length === 0 ? "Tap to upload up to 4 images" : `Add more (${files.length}/4)`}
            </button>
            {previews.length > 0 && (
              <div className="mt-2 grid grid-cols-4 gap-2">
                {previews.map((url, i) => (
                  <div key={i} className="relative aspect-square overflow-hidden rounded-lg border border-border">
                    <img src={url} alt={`preview-${i}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
                      aria-label="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Nagpur" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <Button type="submit" disabled={busy} className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Megaphone className="mr-2 h-4 w-4" />}
            Publish Post
          </Button>
        </form>
      </main>
      <BottomNav />
    </div>
  );
}
