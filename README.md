# WorkSaver

A prototype teacher web interface for reviewing student work and making instructional decisions quickly.

## Features

- Value-first onboarding with a clear teacher-decision framing and one-click **Load Demo Class (200 samples)**.
- Empty-state landing with **Try demo** CTA and a full client-side demo dataset.
- Filtered overview modes for teacher workflows:
  - Student (bulletin-board style grid)
  - Assignment (timeline lanes)
  - Lesson / Objective, Standard, and Misconception (cluster map)
- Click any group to open a **modal gallery** of work samples.
- Focus mode for a single sample with metadata editing, including **Lesson / Objective**.
- 5 misconception/strength stickers:
  - Place value confusion
  - Regrouping error
  - Didn't show work
  - Great strategy
  - Answer-only
- Real-time **Instructional insights** panel (rule-based): top misconception, suggested next move, student list, grouping suggestion, export CSV, and re-teach note.
- Guided **60-second tour** checklist that walks reviewers through the decision loop.
- Tagging polish with toast feedback and undo support (button + Ctrl/Cmd+Z).

## Run locally

```bash
python3 -m http.server 4173
```

Then open <http://localhost:4173>.
