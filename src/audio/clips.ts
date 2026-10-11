import { clipId } from './clipId';

/**
 * Pre-recorded Listen clips (see scripts/audio). public/audio/manifest.json lists the
 * clip ids that exist per locale; a clip's file is public/audio/<locale>/<id>.mp3, where
 * the id is derived from the exact text, so text with no recording simply has no clip.
 */

let available: Record<string, Set<string>> = {};
let loading: Promise<void> | null = null;

const base = (): string => import.meta.env.BASE_URL || '/';

/** Loads the list of available clips once. Any failure just means "no clips": the device voice is used. */
export function loadClipManifest(): Promise<void> {
  loading ??= fetch(`${base()}audio/manifest.json`)
    .then((response): Promise<Record<string, string[]>> => (response.ok ? response.json() : Promise.resolve({})))
    .then((manifest) => {
      available = Object.fromEntries(Object.entries(manifest).map(([locale, ids]) => [locale, new Set(ids)]));
    })
    .catch(() => undefined);
  return loading;
}

const warned = new Set<string>();

/** URL of the recording for this exact text, or null when there isn't one. */
export function clipUrl(locale: string, text: string): string | null {
  const ids = available[locale];
  if (!ids || ids.size === 0) return null;
  const id = clipId(locale, text);
  if (ids.has(id)) return `${base()}audio/${locale}/${id}.mp3`;
  if (import.meta.env.DEV && !warned.has(`${locale}${text}`)) {
    warned.add(`${locale}${text}`);
    console.warn(`[audio] no clip for (${locale}) "${text.slice(0, 80)}": run npm run audio:sync, or scripts/audio/collect.ts has drifted from the page`);
  }
  return null;
}
