// Client-side dynamic translator with localStorage cache + batched server calls.
import { useEffect, useState, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { translateBatch } from "./translate.functions";

type Lang = "en" | "hi" | "mr" | "te";

const memCache = new Map<string, string>(); // key = lang:text -> translation
const subscribers = new Set<() => void>();
let pending: Set<string> = new Set(); // texts queued for current lang
let queueLang: Lang = "en";
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let translateFn: ((args: { data: { texts: string[]; targetLang: Lang } }) => Promise<{ translations: string[] }>) | null = null;

const STORAGE_PREFIX = "sahyog_tr:";

function loadFromStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_PREFIX + key);
  } catch {
    return null;
  }
}

function saveToStorage(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, value);
  } catch {
    /* quota — ignore */
  }
}

function notify() {
  subscribers.forEach((s) => s());
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
        saveToStorage(key, t);
      });
      notify();
    } catch {
      // ignore
    }
  }, 80);
}

function ensure(text: string, lang: Lang): string {
  if (!text) return text;
  if (lang === "en") return text;
  const key = `${lang}:${text}`;
  const cached = memCache.get(key);
  if (cached !== undefined) return cached;
  const stored = loadFromStorage(key);
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
  return text; // show original until translation arrives
}

function subscribe(cb: () => void) {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

function getSnapshot() {
  // Snapshot reference changes when notify() runs (via wrapping counter)
  return snapshotVersion;
}
let snapshotVersion = 0;
const origNotify = notify;
function bumpAndNotify() {
  snapshotVersion++;
  origNotify();
}
// Re-bind notify to bumping version
const flushOverride = () => bumpAndNotify();
subscribers.add(() => {}); // ensure set exists; not used directly

export function useDynamic(text: string): string {
  const { i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage ?? "en") as Lang;
  const tfn = useServerFn(translateBatch);
  useEffect(() => {
    translateFn = tfn as typeof translateFn;
  }, [tfn]);
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return ensure(text, lang);
}

export function useDynamicMany(texts: string[]): string[] {
  const { i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage ?? "en") as Lang;
  const tfn = useServerFn(translateBatch);
  useEffect(() => {
    translateFn = tfn as typeof translateFn;
  }, [tfn]);
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return texts.map((t) => ensure(t, lang));
}

// Hook into our flush to bump version
const _origScheduleFlush = scheduleFlush;
void _origScheduleFlush;
// Wire override: replace notify by patching reference (since exports closed over fn)
(function patch() {
  const realFlush = scheduleFlush;
  void realFlush;
})();

// Simpler: replace direct calls — re-export a tick-bumping notifier
export function _internalBumpVersion() {
  snapshotVersion++;
  subscribers.forEach((s) => s());
}

// Patch: override notify (function above) by re-assigning is impossible since const.
// Workaround: use Object.defineProperty? No — easier: call _internalBumpVersion from flush.
// Rewriting flush above won't help; instead poll: a small interval bumps if cache size changed.
let lastCacheSize = 0;
if (typeof window !== "undefined") {
  setInterval(() => {
    if (memCache.size !== lastCacheSize) {
      lastCacheSize = memCache.size;
      _internalBumpVersion();
    }
  }, 120);
}

export function TT({ children }: { children: string }) {
  const t = useDynamic(children);
  return <>{t}</>;
}
