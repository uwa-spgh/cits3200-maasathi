/**
 * Writes audio/review.html: every generated clip next to the text it speaks, for listening through.
 * Open the file in a browser (npm run audio:review).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const clips: Record<string, { locale: string; sources: string[]; text: string }> = JSON.parse(
  fs.readFileSync(path.join(root, 'audio/clips.json'), 'utf8')
);
const manifest: Record<string, string[]> = JSON.parse(fs.readFileSync(path.join(root, 'public/audio/manifest.json'), 'utf8'));

const escape = (s: string): string => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

const rows: string[] = [];
for (const locale of Object.keys(manifest)) {
  for (const id of manifest[locale]) {
    const clip = clips[`${locale}/${id}`];
    if (!clip) continue;
    rows.push(`<section>
  <h2><span class="loc">${locale}</span> ${escape(clip.sources[0])}${clip.sources.length > 1 ? ` <small>+${clip.sources.length - 1} more places</small>` : ''}</h2>
  <audio controls preload="none" src="../public/audio/${locale}/${id}.mp3"></audio>
  <pre lang="${locale}">${escape(clip.text)}</pre>
</section>`);
  }
}

fs.writeFileSync(
  path.join(root, 'audio/review.html'),
  `<!doctype html><meta charset="utf-8"><title>Listen clips</title>
<style>
body{font:16px/1.5 system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem}
section{border-bottom:1px solid #ddd;padding:1rem 0}
h2{font-size:1rem;margin:0 0 .5rem}.loc{background:#333;color:#fff;border-radius:4px;padding:0 .4em;text-transform:uppercase}
small{color:#777;font-weight:normal}audio{width:100%}pre{white-space:pre-wrap;font:inherit;margin:.5rem 0 0}
</style>
<h1>${rows.length} clips</h1>
${rows.join('\n')}
`
);
console.log(`Wrote audio/review.html (${rows.length} clips)`);
