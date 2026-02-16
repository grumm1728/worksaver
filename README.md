# WorkSaver

A prototype teacher web interface for reviewing and organizing photos/videos of student work.

## Features

- Context-aware zoomed-out views by active filter:
  - **Student**: alphabetized bulletin-board grid with per-student sample volume indicator.
  - **Assignment**: desk-themed timeline lanes (`Today`, `1-7 days ago`, `8-30 days ago`, `31+ days ago (school year)`).
  - **Math Topic / Common Core**: chalkboard-themed k-means style concept clusters.
- Seeded with a larger dataset: provided local `photo *.JPG` samples plus 20 additional dummy captures for testing scale.
- Click-to-zoom workflow: open a group from zoomed-out view and inspect that group's thumbnails in organized rows.
- Grouping controls: student, assignment, math topic, and Common Core standard.
- Optional shuffle inside each group.
- Focus mode for a single capture with editable metadata.
- Annotation tools in focus mode:
  - Highlighter rectangles
  - Sticker tags for "Good Work Example" and "Misconception to Watch"

## Run locally

```bash
python3 -m http.server 4173
```

Then open <http://localhost:4173>.
