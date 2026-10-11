/**
 * Stable id for a pre-recorded clip: derived from the locale and the exact text
 * that is spoken, so editing a string yields a new id and the old clip simply
 * stops matching (the app then falls back to the device voice).
 *
 * Pure and dependency-free: the audio generator (scripts/audio) and the app
 * compute the same id from the same text.
 */

/** cyrb53 string hash (53-bit, two 32-bit lanes). Not cryptographic; plenty for a few hundred clips. */
function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/** Collapses whitespace so cosmetic differences (line breaks, double spaces) don't change the id. */
export function normaliseSpokenText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function clipId(locale: string, text: string): string {
  return cyrb53(`${locale}\u0000${normaliseSpokenText(text)}`).toString(36).padStart(11, '0');
}
