import { useTranslation } from "react-i18next";

/** Inline translator for dynamic text using pre-translated props. */
export function DT({ en, hi, mr, te, children }: { en?: string; hi?: string; mr?: string; te?: string; children?: string }) {
  const { i18n } = useTranslation();
  const lang = i18n.resolvedLanguage;
  const text = en || children || "";
  if (!text) return null;

  if (lang === "hi" && hi) return <>{hi}</>;
  if (lang === "mr" && mr) return <>{mr}</>;
  if (lang === "te" && te) return <>{te}</>;
  return <>{text}</>;
}
