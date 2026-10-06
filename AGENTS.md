# Project workflow

Apply the installed Ponytail skill in full mode for coding work. Understand the
flow and callers first; reuse existing helpers, native browser features and
installed dependencies. Prefer the smallest correct change. Preserve validation,
security, accessibility and staff review of OCR results. Verify non-trivial
changes with the smallest relevant runnable check. Honor the user's mode changes.

Before answering architecture questions or changing code, query
`graphify-out/graph.json` with Graphify using function names present in the graph.
Read the actual source before editing; the graph is navigation, not proof.

After code changes, run `node tools/update-graph.cjs`. This indexes the inline
JavaScript in `index.html` and preserves its source line numbers. Project commit
and checkout hooks run the same adapter. If rebuilding fails, report it and do
not treat the old graph as current. Never include student samples in graph input.

The app is a static page; keep changes in its existing structure unless the
task needs otherwise. Tests live in `tests/`. Sample PDFs and OCR comparison
reports are private, local-only files in the ignored `samples/` folder.
