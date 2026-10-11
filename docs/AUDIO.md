# Listen audio

Every Listen button plays a recording of its exact text when one exists, and falls back to the
device voice (`speechSynthesis`) otherwise. A phone with no Bengali voice therefore still gets
Bengali audio for everything that has a clip.

## How it works

- `src/composables/useSpeech.ts` looks the text up in `src/audio/clips.ts`. A clip's id is a hash of
  the locale and the exact text (`src/audio/clipId.ts`), and its file is
  `public/audio/<locale>/<id>.mp3`. Edit a string and its old clip stops matching, so the app uses the
  device voice until the clip is regenerated.
- `public/audio/manifest.json` lists which ids exist per locale. `audio/clips.json` records what each
  clip says and where it appears, for review.
- In `npm run dev`, the console warns `[audio] no clip for …` whenever a button asks for text with no
  recording.

## Regenerating clips

Needs `ffmpeg` on the PATH and a Gemini API key in `GEMINI_API_KEY` (export it, or put it in
`.env.local`, which is git-ignored).

```bash
npm run audio:sync -- --dry-run   # list what is missing, call nothing
npm run audio:sync -- --batch     # generate every missing clip through the Batch API
npm run audio:check               # exit 1 if any clip is missing (for CI)
npm run audio:review              # write audio/review.html: every clip beside its text
```

- Only missing clips are generated, so edits cost one request each. `--only <name>` and `--locale` narrow
  a run; `--force` redoes the selected clips.
- Clips are 24 kHz mono MP3 at 48 kbps (`--bitrate` changes it). The API's raw audio is cached in
  `audio/.cache` (git-ignored), so re-encoding at another bitrate needs no new requests.
- **Use `--batch` for anything large.** Plain requests are limited per day by the key's billing tier
  (100 a day at the time of writing); batch jobs were not, and finished 250 clips in about 25 minutes.
  Interrupted batch runs resume from `audio/.cache/batches.json`.
- Clips for text that no longer exists are listed as orphans; `--prune` deletes them.

## Adding something that can be spoken

The generator cannot see inside Vue pages, so it rebuilds each page's spoken text itself.

1. Put the page's list of translation keys in `src/content/topics.ts`, and have the page import it.
2. Add the same text assembly to `scripts/audio/collect.ts` (title plus points, chunked the way
   `ListenList` or `ListenText` chunks it).
3. Run `npm run audio:sync -- --batch`, then listen to the new clips in `audio/review.html`.

If step 2 is skipped or drifts from the page, the dev console warning above shows it.

## Text with a date

The Home reminder card contains a date, so no recording of the whole sentence can exist. It is played
from pieces instead: the words before the date, the day, the month, then any words after
(`src/audio/dateSpeech.ts`). The generator records each piece once (every day 1–31, every month, and
the words around the date for each reminder type), and any date is a combination of them. These
fragment clips have their leading and trailing silence trimmed so the joins stay tight.

## Not covered

Text with a changing part that is not a date keeps using the device voice: the tetanus tracker (dose
counts and dates), the tetanus dose info in the timeline, and the Home reminder when it shows an event
that is not an ANC visit, PNC contact, tetanus dose or due date.

## Review

Gemini TTS can mispronounce or drop words, and this is health content. Have someone who speaks the
language listen to new or changed clips (`audio/review.html`) before they ship.
