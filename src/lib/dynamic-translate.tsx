import { useEffect, useRef, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";

type Lang = "en" | "hi" | "mr" | "te";
const LANG_NAME: Record<Lang, string> = {
  en: "English",
  hi: "Hindi",
  mr: "Marathi",
  te: "Telugu",
};

const STORAGE_PREFIX = "sahyog_tr:";
const memCache = new Map<string, string>();
let pending = new Set<string>();
let queueLang: Lang = "en";
let flushTimer: number | null = null;
let version = 0;
const subscribers = new Set<() => void>();

function bump() {
  version++;
  for (const subscriber of subscribers) subscriber();
}

function subscribe(callback: () => void) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

function getSnapshot() {
  return version;
}

function fromStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_PREFIX + key);
  } catch {
    return null;
  }
}

function toStorage(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, value);
  } catch {
    // ignore storage failures
  }
}

function parseTranslations(raw: string, expectedLength: number): string[] | null {
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed) || parsed.length !== expectedLength) return null;
    return parsed.map((item) => (typeof item === "string" ? item : ""));
  } catch {
    return null;
  }
}

async function flushTranslations() {
  if (typeof window === "undefined") return;
  if (pending.size === 0 || queueLang === "en") {
    pending = new Set();
    return;
  }
  (globalThis as any).__sahyog_isFlushing = true;

  const allPending = Array.from(pending);
  const texts = allPending.slice(0, 20);
  const remaining = allPending.slice(20);
  const lang = queueLang;
  pending = new Set(remaining);
  
  // If we still have items, schedule another flush
  if (pending.size > 0) setTimeout(() => scheduleFlush(), 1500);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return;

  const target = LANG_NAME[lang] ?? lang;
  const prompt = `Translate this JSON array of strings into ${target}. Output ONLY a raw JSON array of translated strings in the same order, no markdown, no explanation. Preserve emojis, numbers, dates, URLs, and brand names.\n${JSON.stringify(texts)}`;

  try {
    console.warn(`Gemini translate: ${texts.length} texts queued for batch flush`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    };

    let response = await fetch(url, options);

    // Retry logic for 429
    if (response.status === 429) {
      await new Promise(r => setTimeout(r, 5000));
      response = await fetch(url, options);
    }

    if (!response.ok) return;
    const json = await response.json();
    const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof raw !== "string") return;
    const translations = parseTranslations(raw, texts.length);
    if (!translations) return;

    translations.forEach((translation, index) => {
      const source = texts[index];
      const key = `${lang}:${source}`;
      const value = translation || source;
      memCache.set(key, value);
      toStorage(key, value);
    });
    bump();
  } finally {
    (globalThis as any).__sahyog_isFlushing = false;
    if (pending.size > 0) scheduleFlush();
  }
}

function scheduleFlush() {
  if (flushTimer !== null || (globalThis as any).__sahyog_isFlushing) return;
  flushTimer = window.setTimeout(async () => {
    flushTimer = null;
    await flushTranslations();
  }, 2000);
}

function ensure(text: string, lang: Lang) {
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

export function useDynamic(text: string): string {
  const { i18n } = useTranslation();
  const lang = (i18n.language || i18n.resolvedLanguage || "en") as Lang;
  const prevLang = useRef<Lang>(lang);
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (prevLang.current !== lang) {
      prevLang.current = lang;
      bump();
    }
  }, [lang]);

  return ensure(text, lang);
}

export function useDynamicMany(texts: string[]): string[] {
  const { i18n } = useTranslation();
  const lang = (i18n.language || i18n.resolvedLanguage || "en") as Lang;
  const prevLang = useRef<Lang>(lang);
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (prevLang.current !== lang) {
      prevLang.current = lang;
      bump();
    }
  }, [lang]);

  return texts.map((text) => ensure(text, lang));
}

export function TT({ children }: { children: string }) {
  const translated = useDynamic(children);
  return <>{translated}</>;
}
