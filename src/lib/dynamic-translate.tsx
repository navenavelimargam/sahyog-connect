// Client-side dynamic translator: localStorage cache + batched server calls.
import { useEffect, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { translateBatch } from "./translate.functions";

type Lang = "en" | "hi" | "mr" | "te";

const memCache = new Map<string, string>(); // key = `${lang}:${text}` -> translation
let pending = new Set<string>();
let queueLang: Lang = "en";
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let translateFn:
  | ((args: { data: { texts: string[]; targetLang: Lang } }) => Promise<{ translations: string[] }>)
  | null = null;

let version = 0;
const subs = new Set<() => void>();
function bump() {
  version++;
  subs.forEach((s) => s());
}
function subscribe(cb: () => void) {
  subs.add(cb);
  return () => {
    subs.delete(cb);
  };
}
function getSnapshot() {
  return version;
}

const PFX = "sahyog_tr:";
function fromStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(PFX + key);
  } catch {
    return null;
  }
}
function toStorage(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PFX + key, value);
  } catch {
    /* ignore */
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(async () => {
    flushTimer = null;
    const batch = Array.from(pending);
    const lang = queueLang;
    pending = new Set();
    if (!translateFn || batch.length === 0 || lang === "en") return;
    try {
      const res = await translateFn({ data: { texts: batch, targetLang: lang } });
      res.translations.forEach((t, i) => {
        const src = batch[i];
        const key = `${lang}:${src}`;
        memCache.set(key, t);
        toStorage(key, t);
      });
      bump();
    } catch {
      /* ignore */
    }
  }, 80);
}

function ensure(text: string, lang: Lang): string {
  if (!text || lang === "en") return text;
  const key = `${lang}:${text}`;
  const cached = memCache.get(key);
  if (cached !== undefined) return cached;
  const stored = fromStorage(key);
  if (stored) {
    memCache.set(key, stored);
    return stored;
  }
  if (queueLang !== lang) {
    queueLang = lang;
    pending = new Set();
  }
  pending.add(text);
  scheduleFlush();
  return text;
}

function useRegisterFn() {
  const tfn = useServerFn(translateBatch);
  useEffect(() => {
    translateFn = tfn as typeof translateFn;
  }, [tfn]);
}

export function useDynamic(text: string): string {
  const { i18n } = useTranslation();
  useRegisterFn();
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return ensure(text, (i18n.resolvedLanguage ?? "en") as Lang);
}

export function useDynamicMany(texts: string[]): string[] {
  const { i18n } = useTranslation();
  useRegisterFn();
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const lang = (i18n.resolvedLanguage ?? "en") as Lang;
  return texts.map((t) => ensure(t, lang));
}

export function TT({ children }: { children: string }) {
  const t = useDynamic(children);
  return <>{t}</>;
}
