# WorkSaver

A prototype teacher web interface for reviewing and organizing photos/videos of student work.

## Features

- Cluster-map overview that places work-sample groups on a 2D plane.
- Click-to-zoom workflow: open a cluster to view that group's thumbnails in organized rows, then zoom back out.
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
