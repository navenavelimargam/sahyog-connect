import { supabase } from "@/integrations/supabase/client";

const BUCKET = "sahyog-uploads";

/**
 * Upload a list of files to the user's folder in the sahyog-uploads bucket.
 * Returns the storage paths (NOT URLs) so they can be persisted and turned
 * into signed URLs at view-time.
 */
export async function uploadFiles(userId: string, files: File[]): Promise<string[]> {
  const paths: string[] = [];
  for (const f of files) {
    const ext = f.name.split(".").pop() || "bin";
    const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = `${userId}/${safe}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, f, {
      cacheControl: "3600",
      upsert: false,
      contentType: f.type || undefined,
    });
    if (error) throw error;
    paths.push(path);
  }
  return paths;
}

/** Convert stored paths into temporary signed URLs (1 hour). */
export async function getSignedUrls(paths: string[]): Promise<string[]> {
  if (!paths || paths.length === 0) return [];
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600);
  if (error || !data) return [];
  return data.map((d) => d.signedUrl);
}

/** A list of NGOs whose supervisors exist as accounts in the system. */
export const REGISTERED_NGOS = [
  "Akshaya Patra Foundation",
  "Goonj",
  "Smile India Trust",
  "Green Yatra",
  "HealthReach India",
  "CRY — Child Rights and You",
  "Nanhi Kali (Mahindra Foundation)",
  "HelpAge India",
  "Pratham",
  "SEWA (Self Employed Women's Association)",
  "iCall (TISS)",
  "Médecins Sans Frontières India",
  "Indian Red Cross Society",
  "People for Animals (PFA)",
  "Wildlife SOS India",
  "Art of Living India",
];
