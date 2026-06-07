import { useDynamic } from "@/lib/dynamic-translate";

/** Inline translator for dynamic text (NGO names, descriptions, categories). */
export function DT({ children }: { children: string }) {
  const v = useDynamic(children);
  return <>{v}</>;
}
