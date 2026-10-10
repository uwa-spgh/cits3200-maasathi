/**
 * Helpers for reading long bullet lists aloud in digestible parts.
 * Both functions are pure and have no dependency on the DOM or i18n.
 */

/** Counts words by splitting on whitespace (works for English and Bengali). */
function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
}

/** A trailing chunk at or below this fraction of maxWords counts as "tiny". */
const TINY_FRACTION = 1 / 3;
/** A tiny trailing chunk is only merged if the result stays within this multiple of maxWords. */
const MERGE_CEILING = 1.25;

/**
 * Groups consecutive points into chunks of at most `maxWords` words each.
 *
 * - Points are never split. A point longer than `maxWords` becomes its own chunk.
 * - Blank points are dropped.
 * - If the final chunk is tiny and can be merged into the previous one without
 *   exceeding `maxWords * 1.25`, the two are merged, so a lone short point is not
 *   left dangling as its own "part".
 */
export function chunkPoints(points: string[], maxWords = 45): string[][] {
  const limit = Math.max(1, maxWords);
  const chunks: { items: string[]; words: number }[] = [];

  // Greedy pass: keep adding points while the running total stays within the limit.
  for (const point of points) {
    const words = wordCount(point);
    if (words === 0) continue;
    const current = chunks[chunks.length - 1];
    if (current && current.words + words <= limit) {
      current.items.push(point);
      current.words += words;
    } else {
      chunks.push({ items: [point], words });
    }
  }

  // Tail pass: fold a tiny last chunk back into the previous one when it still fits the ceiling.
  if (chunks.length >= 2) {
    const last = chunks[chunks.length - 1];
    const prev = chunks[chunks.length - 2];
    if (last.words <= limit * TINY_FRACTION && prev.words + last.words <= limit * MERGE_CEILING) {
      prev.items.push(...last.items);
      prev.words += last.words;
      chunks.pop();
    }
  }

  return chunks.map((chunk) => chunk.items);
}

/** Sentence-final punctuation: Latin `. ! ?`, the ellipsis, and the Bengali danda `।`. */
const SENTENCE_END = /[.!?…।]$/;
/** Closing quotes or brackets that can follow final punctuation, e.g. `(see below.)`. */
const TRAILING_CLOSERS = /[)\]"'”’»]+$/;
/** Clause-level punctuation that reads badly as a sentence end, e.g. "Signs include:". */
const CLAUSE_END = /[:;,]$/;
/** Any Bengali script character, used to pick the danda over a full stop. */
const BENGALI = /[ঀ-৿]/;

/**
 * Ends one fragment with sentence punctuation, without doubling any that is already there.
 * Uses the Bengali danda `।` for Bengali text and `.` otherwise.
 * Returns an empty string for blank input.
 */
function asSentence(text: string): string {
  const s = text.trim();
  if (!s) return '';
  // Check the punctuation before any closing quote/bracket, so `"hi."` is not given a second full stop.
  if (SENTENCE_END.test(s.replace(TRAILING_CLOSERS, ''))) return s;
  const terminator = BENGALI.test(s) ? '।' : '.';
  // Replace a dangling clause mark rather than appending after it: "Signs include:" -> "Signs include."
  if (CLAUSE_END.test(s)) return `${s.slice(0, -1)}${terminator}`;
  return `${s}${terminator}`;
}

/**
 * Joins an optional title and a list of points into a single utterance for speech synthesis.
 * Every part ends with exactly one sentence terminator and parts are separated by one space.
 */
export function speechText(title: string | undefined, points: string[]): string {
  return [title ?? '', ...points]
    .map(asSentence)
    .filter((part) => part !== '')
    .join(' ');
}

/**
 * Splits one line into sentences, keeping each sentence's final punctuation and any
 * closing quote or bracket that follows it. A line without punctuation is one sentence.
 */
function splitSentences(line: string): string[] {
  const matches = line.match(/[^.!?…।]+[.!?…।]*["'”’»)\]]*|[.!?…।]+["'”’»)\]]*/g) ?? [];
  return matches.map((s) => s.trim()).filter((s) => s !== '');
}

/**
 * Splits prose into parts of at most `maxWords` words, breaking only between sentences.
 *
 * - Each part is a string where sentences are joined by a space and paragraphs
 *   (input lines) by a newline, so the result can be shown with paragraph breaks intact.
 * - A sentence longer than `maxWords` becomes its own part.
 * - Grouping and the tiny-tail merge follow `chunkPoints`.
 * - Text that fits in `maxWords` returns a single part.
 */
export function chunkSentences(text: string, maxWords = 45): string[] {
  const sentences: string[] = [];
  const paragraphs: number[] = [];
  text.split('\n').forEach((line, para) => {
    for (const sentence of splitSentences(line)) {
      sentences.push(sentence);
      paragraphs.push(para);
    }
  });

  // chunkPoints keeps order and drops nothing here (every sentence has words), so the
  // paragraph index of each sentence can be recovered by position.
  let next = 0;
  return chunkPoints(sentences, maxWords).map((group) => {
    let part = '';
    group.forEach((sentence, i) => {
      const at = next++;
      if (i > 0) part += paragraphs[at] === paragraphs[at - 1] ? ' ' : '\n';
      part += sentence;
    });
    return part;
  });
}
