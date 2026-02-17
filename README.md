# WorkSaver

A prototype teacher web interface for reviewing student work and making instructional decisions quickly.

## Features

- One-click onboarding with **Load demo class** and success state (`Demo loaded ✓`).
- Demo dataset realism (client-side, seeded):
  - 30 students, 8 assignments, 5 standards/objectives, 200 samples.
  - Skyline Express image set reused across samples with deterministic variation.
  - Pre-applied sticker distribution with realistic skew (mostly 0–1 tags, fewer 2+, weighted misconception frequencies).
- Salient primary grouping control via icon tabs:
  - Student, Assignment, Lesson / Objective, Topic, Standard, Misconception.
- Zoomed-out group cards include:
  - sample count,
  - dotmap microviz of group size,
  - top sticker summary pills.
- Group modal includes aggregated sticker summaries and sample gallery.
- Focus modal supports metadata edits and color-coded sticker tagging.
- Instructional insights panel (rule-based): top misconception, suggested move, student list, suggested grouping, CSV export, and re-teach note.
- Guided 60-second tour checklist.
- **Grading Shuffle Sprint** flow:
  - Begin sprint,
  - random sample sequence,
  - “Done with this sample” progression,
  - 5-sample completion prompt (“Do 5 more” / “Close”),
  - graceful edge handling and sprint progress reset option.

## Run locally

```bash
python3 -m http.server 4173
```

Then open <http://localhost:4173>.
