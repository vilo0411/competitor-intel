# Third-party notice: rea-video

Parts of this skill are adapted from **rea-video** — https://github.com/JuneYaooo/rea-video
Copyright 2026 JuneYaooo. Licensed under the Apache License, Version 2.0 (http://www.apache.org/licenses/LICENSE-2.0).

| File in this skill | Adapted from | Changes |
|---|---|---|
| `scripts/motion-timeline.mjs` | `rea_video/motion.py` (motion events, chaining, sequences, static elements) | Ported from Python/OpenCV to dependency-free Node; static elements at cell resolution; per-shot runs with two-pass splitting; small crisp swaps and temporary elements kept as events; Whisper word alignment; `build-sticker` beat suggestions; Vietnamese report lines. |
| `references/breakdown-schema.md`, `scripts/check-breakdown.mjs` | `rea_video/vlm.py` (SHOT_PROMPT, WHOLE_PROMPT fields), `rea_video/narrative.py` (narrative roles) | Translated and reduced to graphic/explainer video fields; added DSC format mapping (`format_fit`, `remake.route`), `seen` flag and validator. |

These files are modified versions of the original work. The original NOTICE reads: "rea-video, Copyright 2026 JuneYaooo".
