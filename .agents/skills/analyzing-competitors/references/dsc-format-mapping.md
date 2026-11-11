# Mapping Analyzed Videos to DSC Academy Formats & Skills

After extracting frames, montage grids, scene changes, and audio transcription from a reference video (TikTok, YouTube Shorts, YouTube Long-form, Reels, or local MP4), use this reference to translate the visual, audio, and narrative breakdown into an actionable production proposal for this workspace.

---

## 1. Existing Formats & Skills Matrix (`scripts/lib/formats.mjs`)

| Reference Video Style | Orientation | Matching Format (`script.json`) | Skill to Load | Builder & Key Features |
|---|---|---|---|---|
| **Kinetic Typography / Explainer Shorts** — 2-tier hook, bold/clean animated captions, big counters, A/B compare cards, lists, arrows, fast SFX (`whoosh`, `pop`, `ding`) | `9x16` | `shorts-kinetic` (25–60s) or `shorts-micro` (15–30s) | `dsc-shorts` | `scripts/build-shorts.mjs` (`cues`: `hook_2tier`, `big_counter`, `ab_compare`, `list`, `steps`, `statement`, `arrow`, `question`, `outro_cta`) |
| **Fast Sticker / Meme Beat Explainer** (Gorillanomics style) — solid/white background, character + prop stickers popping every 4–5 syllables (~1 image/sec), 2-word center captions, deadpan storytelling | `9x16` | `shorts-sticker` | `dsc-shorts` | `scripts/build-sticker.mjs` (`beats[]` synced to `at` keywords, `fx: pop\|shake\|zoom\|drop`, shared `cast.dir`) |
| **Breaking News / Financial 60s Digest** (CafeF / VTV24 / Taichinhso style) — persistent brand frame, uppercase 3-line headline, date badge, karaoke/box captions, event footage + data cards (`stat`, `count`, `bar`, `text`) | `9x16` | `news` | `dsc-news` | `scripts/build-news.mjs` + `scripts/news-media.mjs` (projects: `taichinhso`, `tintaichinh60s`) |
| **Whiteboard / Hand-drawn Stroke Story** (Nikola / VideoScribe style) — hand holding pen drawing organic ink illustrations stroke-by-stroke, or animated SVG diagrams, centered layout + transparent brand karaoke | `16x9` or `9x16` | `handdrawn` | `dsc-handdrawn` | `scripts/build-designed.mjs` + `scripts/render-whiteboard.mjs` (`visual.type: "whiteboard"` or `"drawing"`) |
| **2D Stick-Figure / OverSimplified Animation** — lip-synced host character (`An` puppet) with preset macro dashboards/scales/tanks/charts, OR custom hand-coded GSAP scenes (`scenes.mjs`) with camera punch-ins & gags | `16x9` (or `9x16` series) | `toon` or `series` | `dsc-toon` | `scripts/build-toon.mjs` (`scripts/lib/toon-presets.mjs` + custom `videos/<id>/scenes.mjs`) |
| **Vox-style Paper Collage / Investigative Essay** — textured paper/kraft/grid backgrounds, archival photos with source citations, red strings/marker circles, 2.5D camera (`push_in`, `parallax`, `paper_wipe`), data charts | `16x9` | `essay` (`essay.version: 2`) | `dsc-essay` | `scripts/build-essay.mjs` (`visual.proposition`, `pieces[]`, `camera`, `cuts[]`, verified `sources[]`) |
| **Clean Branded Data Visualization** — focused bar/line charts from CSV/JSON with explicit units, animated counters, comparisons | `9x16` or `16x9` | `dataviz` | `video-producer` | `scripts/build-designed.mjs` (`visual.type`: `bar`, `line`, `counter`, `compare`) |
| **Product / App UI Walkthrough** — real screen recordings/screenshots of web or mobile UI with step callouts | `16x9` or `9x16` | `tutorial` or `promo` | `video-producer` | `scripts/build-designed.mjs` (`visual.type`: `ui`, `steps`, `statement`, `outro`) |
| **Narrated Faceless Explainer** — clean branded slides combining curated imagery, statements, steps, and diagrams | `16x9` or `9x16` | `faceless` | `video-producer` | `scripts/build-designed.mjs` (`visual.type`: `image`, `statement`, `steps`, `compare`) |
| **Cinematic AI Character Story** — narrative short film with consistent AI-generated characters and locations across shots | `16x9` or `9x16` | `story` | `dsc-story` | `scripts/build-story.mjs` + `scripts/story-images.mjs` |

---

## 2. Diagnostic Checklist: What to Extract from the Reference Video

When analyzing a TikTok or YouTube clip for production adaptation, always quantify these 5 dimensions:

1. **Hook Architecture (0:00 – 0:05)**:
   - Spoken hook layers (Question → Paradox/Contradiction → Open Loop).
   - Visual hook (2-tier headline, shock number, character reaction, or striking footage).
   - First-cut timing (how many seconds until the first visual change or zoom).
2. **Pacing & Cadence Metrics**:
   - **Visual Pacing**: Total scene changes (`scene_changes`), average shot duration (`average_shot_duration_seconds` from `frames/metadata.json`), and sub-scene micro-beats (elements appearing per second).
   - **Audio Pacing**: Speaking rate (`syllables_per_second` and `words_per_minute` from `audio/audio_metadata.json`). Compare with DSC benchmarks:
     - Fast News (`tintaichinh60s`): ~4.5 – 4.8 syllables/sec
     - Kinetic Shorts (`dsc-shorts`): ~3.8 – 4.3 syllables/sec
     - Macro Toon / Essay (`dsc-toon` / `dsc-essay`): ~3.0 – 3.5 syllables/sec
   - **Sentence Flow (Accordion Cadence)**: How short punchy sentences alternate with longer explanatory clauses and conversational bridges (*"Nhưng khoan..."*, *"Sự thật là..."*).
3. **Layout, Typography & Caption System**:
   - Aspect ratio (`9x16` vs `16x9`) and zone division (top header/title, center stage, bottom caption zone, TikTok/Shorts UI safe zones).
   - Caption style: word-by-word karaoke fill (`fill`), active word highlight box (`box`), 2–3 word bold pop (`bold` / Hormozi), or full-clause clean subtitle (`clean`).
   - Color palette (background hex, primary text hex, accent/highlight hex).
4. **Visual Asset & Animation Mechanism**:
   - How visuals are constructed: DOM/SVG programmatic cards, cut-out PNG stickers/characters, whiteboard stroke reveal, news footage + stat cards, or paper collage.
   - Camera & transitions: static vs continuous drift, keyword punch-zoom, whip/wipe/cut transitions.
5. **Sound Design**:
   - Voice tone, silence gaps (`hush` before punchlines), background music mood & relative level (LUFS / dB below voice), and SFX triggers on visual beats.

---

## 3. Formulating the 3-Tier Production Proposal

Every analysis must conclude with a clear recommendation structured into **3 actionable options** so the user can choose how to proceed:

### Option 1: Tạo ngay bằng Format & Skill có sẵn (Ready-to-Run)
- Identify the best target **Project** (`dsc-academy`, `taichinhso`, `tintaichinh60s`, or `npm run project -- init <new-project>`) and **Format** + **Skill**.
- Provide the exact CLI command to scaffold:
  ```bash
  npm run new -- <video-id> "<Title>" --project <project-id> --format <format>
  ```
- Provide a concrete **`script.json` mapping blueprint** showing how each section of the analyzed video translates into the chosen format's scenes, `visual.type` / `cue` / `beats`, and audio settings.

### Option 2: Tinh chỉnh / Mở rộng Bộ dựng hiện có (Customize Existing Builder)
- When the reference video has 1–2 signature elements not yet in the closest existing format (e.g., a new stat card layout in `build-news.mjs`, a new `cue` in `build-shorts.mjs`, a new preset in `toon-presets.mjs`, or a custom `design/tokens.json` format profile):
- List the exact files to modify, what parameters to add to `script.json`, and how it preserves `workflows/design-policy.md` and `npm test`.

### Option 3: Tạo Format & Skill Video mới (`dsc-<new-format>`)
- When the reference video represents a distinct format worth reusing as a new template in the workspace:
- Propose:
  1. **Skill definition**: `.agents/skills/dsc-<new-format>/SKILL.md` (synced via `npm run skills:sync`).
  2. **Format registry entry**: `scripts/lib/formats.mjs` (`FORMATS['<new-format>']`).
  3. **Builder architecture**: `scripts/build-<new-format>.mjs` (or extending `scripts/build-designed.mjs`) using HyperFrames, GSAP timelines, and Whisper word alignment (`scripts/lib/words.mjs`).

