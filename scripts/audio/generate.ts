/**
 * Generates the pre-recorded Listen clips with Gemini TTS and records which exist.
 *
 *   npm run audio:sync                 generate every missing clip
 *   npm run audio:sync -- --dry-run    list what would be generated, call nothing
 *   npm run audio:sync -- --sample     generate a small spread of clips to judge the voice
 *   npm run audio:check                exit 1 if any clip is missing (for CI)
 *   npm run audio:sync -- --batch      send all missing clips through the Batch API (half price, own quota)
 *   npm run audio:sync -- --force      re-encode every selected clip (e.g. after changing --bitrate)
 *
 * The API's raw audio is cached in audio/.cache, so re-encoding never calls the API again;
 * add --refetch to ask for fresh audio instead.
 *
 * A clip is named after a hash of its locale and exact text (src/audio/clipId.ts),
 * so unchanged text is skipped, edited text produces a new file, and files for
 * text that no longer exists are reported (and removed only with --prune).
 *
 * Needs GEMINI_API_KEY (environment or .env.local) and ffmpeg on the PATH.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { clipId } from '../../src/audio/clipId.ts';
import { collect, LOCALES } from './collect.ts';
import type { Locale, Speakable } from './collect.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const AUDIO_DIR = path.join(root, 'public/audio');
const MANIFEST_FILE = path.join(AUDIO_DIR, 'manifest.json');
const CLIPS_FILE = path.join(root, 'audio/clips.json');

const MODEL = 'gemini-3.8-flash-lite-tts';
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';
/** Rate the API is asked to return, which is also what the clip is encoded from. */
const SAMPLE_RATE = 24000;
/** A request that hangs would otherwise stall the whole run. */
const REQUEST_TIMEOUT_MS = 90_000;
/** Longer waits than this mean a daily quota is spent, not a per-minute limit: stop instead of sleeping. */
const MAX_RETRY_WAIT_MS = 5 * 60_000;

// ---------- arguments ----------

interface Options {
  dryRun: boolean;
  check: boolean;
  force: boolean;
  refetch: boolean;
  batch: boolean;
  batchSlots: number;
  prune: boolean;
  sample: boolean;
  locale: Locale | null;
  only: string | null;
  limit: number;
  voice: string;
  style: string | null;
  bitrate: string;
  concurrency: number;
}

function parseArgs(argv: string[]): Options {
  const opts: Options = {
    dryRun: false,
    check: false,
    force: false,
    refetch: false,
    batch: false,
    batchSlots: 4,
    prune: false,
    sample: false,
    locale: null,
    only: null,
    limit: Infinity,
    voice: 'Kore',
    style: null,
    bitrate: '48k',
    concurrency: 2
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = (): string => {
      const v = argv[++i];
      if (v === undefined) fail(`${arg} needs a value`);
      return v;
    };
    switch (arg) {
      case '--dry-run': opts.dryRun = true; break;
      case '--check': opts.check = true; break;
      case '--force': opts.force = true; break;
      case '--refetch': opts.refetch = true; break;
      case '--batch': opts.batch = true; break;
      case '--batch-slots': opts.batchSlots = Math.max(1, Number(value())); break;
      case '--prune': opts.prune = true; break;
      case '--sample': opts.sample = true; break;
      case '--locale': {
        const v = value();
        if (!(LOCALES as readonly string[]).includes(v)) fail(`--locale must be one of ${LOCALES.join(', ')}`);
        opts.locale = v as Locale;
        break;
      }
      case '--only': opts.only = value().toLowerCase(); break;
      case '--limit': opts.limit = Number(value()); break;
      case '--voice': opts.voice = value(); break;
      case '--style': opts.style = value(); break;
      case '--bitrate': opts.bitrate = value(); break;
      case '--concurrency': opts.concurrency = Math.max(1, Number(value())); break;
      default: fail(`Unknown option ${arg}`);
    }
  }
  if (!Number.isFinite(opts.limit) && opts.limit !== Infinity) fail('--limit must be a number');
  return opts;
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

// ---------- environment ----------

function loadEnvFile(): void {
  const file = path.join(root, '.env.local');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

// ---------- Gemini TTS ----------

class ApiError extends Error {
  status: number;
  retryAfterMs: number | null;
  constructor(message: string, status: number, retryAfterMs: number | null) {
    super(message);
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

/** The API says to come back much later; no point retrying within this run. */
class QuotaError extends Error {}

interface RawAudio {
  data: Buffer;
  mimeType: string;
}

/** Finds the first audio part in a response, wherever the API nests it. */
function findAudio(node: unknown): { data: string; mime_type?: string } | null {
  if (!node || typeof node !== 'object') return null;
  const obj = node as Record<string, unknown>;
  if (obj.type === 'audio' && typeof obj.data === 'string') return obj as { data: string; mime_type?: string };
  for (const value of Object.values(obj)) {
    const hit = findAudio(value);
    if (hit) return hit;
  }
  return null;
}

async function synthesise(text: string, opts: Options, apiKey: string): Promise<RawAudio> {
  const content: Record<string, unknown> = { type: 'text', text };
  if (opts.style) content.annotations = [{ type: 'speech_metadata', style: opts.style }];
  const body = {
    model: MODEL,
    input: [{ type: 'user_input', content: [content] }],
    response_format: { type: 'audio', mime_type: 'audio/l16', sample_rate: SAMPLE_RATE },
    generation_config: { speech_config: [{ voice: opts.voice }] }
  };
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'x-goog-api-key': apiKey, 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  });
  if (!response.ok) {
    const retryAfter = Number(response.headers.get('retry-after'));
    throw new ApiError(
      `HTTP ${response.status}: ${(await response.text()).slice(0, 1200)}`,
      response.status,
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : null
    );
  }
  const json: unknown = await response.json();
  const audio = findAudio(json);
  if (!audio) throw new ApiError(`No audio in response: ${JSON.stringify(json).slice(0, 400)}`, 0, null);
  return { data: Buffer.from(audio.data, 'base64'), mimeType: audio.mime_type ?? 'audio/l16' };
}

async function synthesiseWithRetry(text: string, opts: Options, apiKey: string): Promise<RawAudio> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await synthesise(text, opts, apiKey);
    } catch (err) {
      const timedOut = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');
      const retriable = timedOut || (err instanceof ApiError && (err.status === 429 || err.status >= 500));
      if (!retriable || attempt >= 5) throw err;
      const wait = (err instanceof ApiError ? err.retryAfterMs : null) ?? 2000 * 2 ** attempt;
      if (wait > MAX_RETRY_WAIT_MS) {
        throw new QuotaError(`Rate limited for ${Math.round(wait / 3_600_000 * 10) / 10} hours (daily quota spent?). ${(err as Error).message}`);
      }
      console.warn(`  retrying in ${Math.round(wait / 1000)}s (${(err as Error).message.slice(0, 80)})`);
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }
}

// ---------- raw audio cache ----------

const CACHE_DIR = path.join(root, 'audio/.cache');

/** Raw API audio is kept (gitignored) so a clip can be re-encoded at another bitrate without a new request. */
function cacheFile(clip: { locale: string; id: string }, ext: 'raw' | 'wav'): string {
  return path.join(CACHE_DIR, clip.locale, `${clip.id}.${ext}`);
}

function readCache(clip: { locale: string; id: string }): RawAudio | null {
  // Headerless PCM (single requests) is always at the generator's sample rate; WAV carries its own header.
  const raw = cacheFile(clip, 'raw');
  if (fs.existsSync(raw)) return { data: fs.readFileSync(raw), mimeType: `audio/l16;rate=${SAMPLE_RATE}` };
  const wav = cacheFile(clip, 'wav');
  if (fs.existsSync(wav)) return { data: fs.readFileSync(wav), mimeType: 'audio/wav' };
  return null;
}

function writeCache(clip: { locale: string; id: string }, audio: RawAudio): void {
  const isWav = /wav/i.test(audio.mimeType);
  if (!isWav && !/l16|pcm/i.test(audio.mimeType)) return;
  const file = cacheFile(clip, isWav ? 'wav' : 'raw');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, audio.data);
}

// ---------- encoding ----------

/** Encodes whatever the API returned to a small mono speech MP3. */
function encode(audio: RawAudio, outFile: string, bitrate: string): Promise<void> {
  const raw = /l16|pcm/i.test(audio.mimeType) && !/wav/i.test(audio.mimeType);
  const rate = Number(audio.mimeType.match(/rate=(\d+)/)?.[1] ?? SAMPLE_RATE);
  const args = [
    '-hide_banner', '-loglevel', 'error', '-y',
    ...(raw ? ['-f', 's16le', '-ar', String(rate), '-ac', '1'] : []),
    '-i', 'pipe:0',
    '-ac', '1', '-ar', String(SAMPLE_RATE),
    '-c:a', 'libmp3lame', '-b:a', bitrate,
    outFile
  ];
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', args, { stdio: ['pipe', 'ignore', 'pipe'] });
    let stderr = '';
    ffmpeg.stderr.on('data', (chunk) => (stderr += chunk));
    ffmpeg.on('error', (err) => reject(new Error(`could not run ffmpeg: ${err.message}`)));
    ffmpeg.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}: ${stderr.trim()}`))));
    ffmpeg.stdin.on('error', () => undefined);
    ffmpeg.stdin.end(audio.data);
  });
}

// ---------- planning ----------

interface Clip extends Speakable {
  id: string;
  file: string;
}

const clipPath = (locale: Locale, id: string): string => path.join(AUDIO_DIR, locale, `${id}.mp3`);

/** A small spread to judge the voice: a short hint, a medical passage, the longest clip, and danger signs. */
function pickSample(clips: Clip[]): Clip[] {
  const picks: Clip[] = [];
  for (const locale of LOCALES) {
    const mine = clips.filter((c) => c.locale === locale);
    const bySource = (needle: string): Clip | undefined => mine.find((c) => c.sources.some((s) => s.includes(needle)));
    const longest = [...mine].sort((a, b) => b.text.length - a.text.length)[0];
    const shortest = [...mine].sort((a, b) => a.text.length - b.text.length)[0];
    for (const clip of [
      shortest,
      bySource('Hint: onboarding.welcome_text'),
      bySource('Information > ANC: pre_eclampsia_monitoring'),
      bySource('Danger signs: pregnancy'),
      longest
    ]) {
      if (clip && !picks.includes(clip)) picks.push(clip);
    }
  }
  return picks;
}

// ---------- Batch API ----------

const BASE = 'https://generativelanguage.googleapis.com/v1beta';
/** Keeps each job's inline response (base64 audio) comfortably small. */
const BATCH_MAX_REQUESTS = 20;
const BATCH_MAX_WORDS = 500;
const BATCH_POLL_MS = 20_000;
const BATCH_STATE_FILE = path.join(CACHE_DIR, 'batches.json');
const TERMINAL = /SUCCEEDED|FAILED|CANCELLED|EXPIRED/;

const wordsIn = (text: string): number => text.trim().split(/\s+/).length;

function planBatches(clips: Clip[]): Clip[][] {
  const batches: Clip[][] = [];
  let current: Clip[] = [];
  let words = 0;
  for (const clip of clips) {
    const w = wordsIn(clip.text);
    if (current.length > 0 && (current.length >= BATCH_MAX_REQUESTS || words + w > BATCH_MAX_WORDS)) {
      batches.push(current);
      current = [];
      words = 0;
    }
    current.push(clip);
    words += w;
  }
  if (current.length > 0) batches.push(current);
  return batches;
}

async function apiJson(url: string, apiKey: string, body?: unknown): Promise<any> {
  const response = await fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: { 'x-goog-api-key': apiKey, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS * 2)
  });
  if (!response.ok) throw new ApiError(`HTTP ${response.status}: ${(await response.text()).slice(0, 800)}`, response.status, null);
  return response.json();
}

async function submitBatch(clips: Clip[], opts: Options, apiKey: string): Promise<string> {
  const requests = clips.map((clip) => ({
    request: {
      contents: [{ parts: [{ text: clip.text }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: opts.voice } } }
      }
    },
    metadata: { key: `${clip.locale}/${clip.id}` }
  }));
  const job = await apiJson(`${BASE}/models/${MODEL}:batchGenerateContent`, apiKey, {
    batch: { display_name: `maasathi-audio-${Date.now()}`, input_config: { requests: { requests } } }
  });
  return job.name as string;
}

/** Finds the list of per-request results wherever the API nests it. */
function findInlined(node: any): any[] | null {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node.inlinedResponses)) return node.inlinedResponses;
  for (const value of Object.values(node)) {
    const hit = findInlined(value);
    if (hit) return hit;
  }
  return null;
}

function readBatchState(): Record<string, string[]> {
  return fs.existsSync(BATCH_STATE_FILE) ? JSON.parse(fs.readFileSync(BATCH_STATE_FILE, 'utf8')) : {};
}

function writeBatchState(state: Record<string, string[]>): void {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(BATCH_STATE_FILE, JSON.stringify(state, null, 2));
}

/**
 * Sends every clip through the Batch API, a few jobs at a time, and encodes the results.
 * Submitted job names are kept in audio/.cache/batches.json, so an interrupted run picks them up again.
 */
async function runBatches(todo: Clip[], opts: Options, apiKey: string): Promise<{ done: number; failed: number }> {
  const byKey = new Map(todo.map((c) => [`${c.locale}/${c.id}`, c]));
  const savedJobs = readBatchState();
  const inFlight = new Set(Object.values(savedJobs).flat());
  const fresh = todo.filter((c) => !inFlight.has(`${c.locale}/${c.id}`));
  const queue = planBatches(fresh);
  const active = new Map<string, string[]>(Object.entries(savedJobs));
  if (active.size > 0) console.log(`Resuming ${active.size} batch job(s) from an earlier run.`);

  let done = 0;
  let failed = 0;
  const total = todo.length;

  const finish = async (name: string): Promise<void> => {
    const job = await apiJson(`${BASE}/${name}`, apiKey);
    const jobState: string = job.metadata?.state ?? '';
    if (!TERMINAL.test(jobState)) return;
    const keys = active.get(name) ?? [];
    active.delete(name);
    const remaining = readBatchState();
    delete remaining[name];
    writeBatchState(remaining);
    if (!/SUCCEEDED/.test(jobState)) {
      failed += keys.length;
      console.error(`  batch ${name} ${jobState}: ${keys.length} clip(s) not generated`);
      return;
    }
    for (const entry of findInlined(job) ?? []) {
      const key = entry?.metadata?.key as string | undefined;
      const clip = key ? byKey.get(key) : undefined;
      const part = entry?.response?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData;
      if (!clip || !part) {
        failed++;
        console.error(`  FAILED ${key ?? '?'}: ${JSON.stringify(entry?.error ?? entry).slice(0, 300)}`);
        continue;
      }
      try {
        const audio: RawAudio = { data: Buffer.from(part.data, 'base64'), mimeType: part.mimeType ?? 'audio/wav' };
        writeCache(clip, audio);
        fs.mkdirSync(path.dirname(clip.file), { recursive: true });
        await encode(audio, clip.file, opts.bitrate);
        done++;
        console.log(`  [${done + failed}/${total}] ${clip.locale} ${clip.id} ${(fs.statSync(clip.file).size / 1024).toFixed(1)} KB  ${clip.sources[0]}`);
      } catch (err) {
        failed++;
        console.error(`  FAILED ${key} (encode): ${(err as Error).message}`);
      }
    }
  };

  while (queue.length > 0 || active.size > 0) {
    while (queue.length > 0 && active.size < opts.batchSlots) {
      const chunk = queue[0];
      try {
        const name = await submitBatch(chunk, opts, apiKey);
        queue.shift();
        active.set(name, chunk.map((c) => `${c.locale}/${c.id}`));
        const state = readBatchState();
        state[name] = active.get(name)!;
        writeBatchState(state);
        console.log(`Submitted ${name} (${chunk.length} clips, ${chunk.reduce((n, c) => n + wordsIn(c.text), 0)} words); ${queue.length} more to submit.`);
      } catch (err) {
        if (err instanceof ApiError && (err.status === 429 || err.status >= 500) && active.size > 0) {
          console.warn(`  cannot submit yet, waiting for a running job (${err.message.slice(0, 200)})`);
          break;
        }
        throw err;
      }
    }
    if (active.size === 0 && queue.length > 0) continue;
    await new Promise((resolve) => setTimeout(resolve, BATCH_POLL_MS));
    for (const name of [...active.keys()]) await finish(name);
    if (active.size > 0) console.log(`  ${active.size} job(s) running, ${queue.length} waiting; ${done} done, ${failed} failed.`);
  }
  return { done, failed };
}

// ---------- main ----------

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  loadEnvFile();

  const { speakables, missingKeys } = collect();
  if (missingKeys.length > 0) {
    fail(`Translation keys referenced but missing:\n  ${missingKeys.join('\n  ')}`);
  }

  const all: Clip[] = speakables.map((s) => {
    const id = clipId(s.locale, s.text);
    return { ...s, id, file: clipPath(s.locale, id) };
  });

  // Two different strings must never share an id.
  const seen = new Map<string, Clip>();
  for (const clip of all) {
    const key = `${clip.locale}/${clip.id}`;
    const other = seen.get(key);
    if (other) fail(`Clip id collision ${key}:\n  ${other.text}\n  ${clip.text}`);
    seen.set(key, clip);
  }

  let wanted = all;
  if (opts.locale) wanted = wanted.filter((c) => c.locale === opts.locale);
  if (opts.only) wanted = wanted.filter((c) => c.sources.some((s) => s.toLowerCase().includes(opts.only!)));
  if (opts.sample) wanted = pickSample(wanted);

  const missing = wanted.filter((c) => opts.force || !fs.existsSync(c.file));
  const todo = missing.slice(0, opts.limit);

  const words = (clips: Clip[]): number => clips.reduce((n, c) => n + c.text.trim().split(/\s+/).length, 0);
  console.log(
    `${all.length} clips in the app (${LOCALES.map((l) => `${all.filter((c) => c.locale === l).length} ${l}`).join(', ')}); ` +
      `${wanted.length} selected, ${missing.length} missing, generating ${todo.length} (${words(todo)} words).`
  );

  if (opts.check) {
    const absent = all.filter((c) => !fs.existsSync(c.file));
    if (absent.length > 0) {
      console.error(`${absent.length} clip(s) missing. Run npm run audio:sync.`);
      for (const clip of absent.slice(0, 10)) console.error(`  [${clip.locale}] ${clip.sources[0]}: ${clip.text.slice(0, 60)}…`);
      process.exit(1);
    }
    console.log('All clips present.');
    return;
  }

  if (opts.dryRun) {
    for (const clip of todo) console.log(`  [${clip.locale}] ${clip.id}  ${clip.sources[0]}  (${clip.text.trim().split(/\s+/).length} words)`);
    return;
  }

  if (todo.length > 0) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) fail('GEMINI_API_KEY is not set (export it, or put it in .env.local).');

    if (opts.batch) {
      const { done, failed } = await runBatches(todo, opts, apiKey);
      console.log(`Generated ${done}, failed ${failed}.`);
      if (failed > 0) process.exitCode = 1;
      writeIndexes(all);
      reportOrphans(all, opts.prune);
      return;
    }

    let done = 0;
    let failed = 0;
    const queue = [...todo];
    const worker = async (): Promise<void> => {
      for (let clip = queue.shift(); clip; clip = queue.shift()) {
        try {
          const audio = (!opts.refetch && readCache(clip)) || (await synthesiseWithRetry(clip.text, opts, apiKey));
          writeCache(clip, audio);
          fs.mkdirSync(path.dirname(clip.file), { recursive: true });
          await encode(audio, clip.file, opts.bitrate);
          done++;
          console.log(`  [${done + failed}/${todo.length}] ${clip.locale} ${clip.id} ${(fs.statSync(clip.file).size / 1024).toFixed(1)} KB  ${clip.sources[0]}`);
        } catch (err) {
          failed++;
          if (err instanceof QuotaError) {
            queue.length = 0;
            console.error(`  STOPPING: ${err.message}`);
            continue;
          }
          console.error(`  FAILED ${clip.locale} ${clip.id} (${clip.sources[0]}): ${(err as Error).message}`);
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(opts.concurrency, todo.length) }, worker));
    console.log(`Generated ${done}, failed ${failed}.`);
    if (failed > 0) process.exitCode = 1;
  }

  writeIndexes(all);
  reportOrphans(all, opts.prune);
}

/** Records which clips exist (shipped with the app) and what each one says (kept for review). */
function writeIndexes(all: Clip[]): void {
  const manifest: Record<string, string[]> = {};
  for (const locale of LOCALES) {
    manifest[locale] = all.filter((c) => c.locale === locale && fs.existsSync(c.file)).map((c) => c.id).sort();
  }
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest) + '\n');

  const clips: Record<string, { locale: Locale; sources: string[]; text: string }> = {};
  for (const clip of [...all].sort((a, b) => a.locale.localeCompare(b.locale) || a.id.localeCompare(b.id))) {
    clips[`${clip.locale}/${clip.id}`] = { locale: clip.locale, sources: clip.sources, text: clip.text };
  }
  fs.mkdirSync(path.dirname(CLIPS_FILE), { recursive: true });
  fs.writeFileSync(CLIPS_FILE, JSON.stringify(clips, null, 2) + '\n');
}

/** Clip files whose text no longer exists in the app. Removed only with --prune. */
function reportOrphans(all: Clip[], prune: boolean): void {
  const live = new Set(all.map((c) => c.file));
  const orphans: string[] = [];
  for (const locale of LOCALES) {
    const dir = path.join(AUDIO_DIR, locale);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      const file = path.join(dir, name);
      if (name.endsWith('.mp3') && !live.has(file)) orphans.push(file);
    }
  }
  if (orphans.length === 0) return;
  if (prune) {
    for (const file of orphans) fs.unlinkSync(file);
    console.log(`Removed ${orphans.length} orphaned clip(s).`);
  } else {
    console.log(`${orphans.length} orphaned clip(s) no longer match any text (remove with --prune):`);
    for (const file of orphans.slice(0, 10)) console.log(`  ${path.relative(root, file)}`);
  }
}

main().catch((err) => fail(String(err?.stack ?? err)));
