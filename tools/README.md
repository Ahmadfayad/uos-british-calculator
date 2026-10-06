# Ponytail and Graphify

`AGENTS.md` makes Ponytail full mode and Graphify navigation the default for this
project. The installed Ponytail plugin supplies the lifecycle hooks and mode
switches. Its SessionStart hook has been checked to emit instructions and persist
full mode; no additional global configuration is needed.

Graphify is already installed. Enable the versioned project hooks in a new clone:

```sh
git config --local core.hooksPath .githooks
node tools/update-graph.cjs
```

On Linux/macOS, also make both files in `.githooks/` executable. These are custom
project adapters: Graphify's stock hook-status check can call them out of date.
Verify with `git config --local --get core.hooksPath` and
`git hook run post-commit`; do not replace them with the stock installer, which
would omit the calculator's inline JavaScript.

The commit and branch-checkout hooks call this same adapter. It extracts inline
JavaScript without changing `index.html`, preserves its line numbers, builds the
graph, maps source links back to `index.html`, and removes the temporary input.
It verifies the upload entry point and that no student samples were indexed.
Updates run locally without an LLM or API key. Commit graph.json and the report
when useful; previews, caches and machine-specific state are ignored.

Query functions directly:

```sh
graphify query "handleCertificateFiles" --budget 1000
graphify path "handleCertificateFiles" "extractPages"
```

Read the source before editing and run the adapter after uncommitted changes;
Git hooks cannot detect edits until a commit or branch checkout. If a rebuild
fails, its error is displayed and the existing graph may be stale.

The local Graphify runtime lacks its optional SQL parser. JavaScript and tests
are indexed; read SQL migrations directly until `tree_sitter_sql` is installed
in that runtime. Samples, models and dependencies are excluded from graph input.
