# Graph Report - UOS British Calculator  (2026-10-07)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 410 nodes · 869 edges · 29 communities (22 shown, 7 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 22 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `91731a13`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- service.py
- server.js
- UOS British Calculator
- Handler
- saveLearnedRule
- Set up OCR on the other Windows PC
- index.ts
- vercel.json
- index.html
- submitTeach
- formatPercentage
- renderAdminPanel
- addOcrRowsToCalculator
- handleCertificateFiles
- appAlert
- extractPages
- ocr-gateway.test.js
- loadPdfLibrary
- Connect the work PC to the online calculator
- playwright
- AGENTS.md
- tools/README.md
- below-minimum.test.js
- update-graph.cjs
- ocr-speed.test.js
- ocr-review-fixes.test.js

## God Nodes (most connected - your core abstractions)
1. `renderAdminPanel()` - 22 edges
2. `submitTeach()` - 16 edges
3. `parseDocument()` - 15 edges
4. `parseResultLine()` - 15 edges
5. `addOcrRowsToCalculator()` - 15 edges
6. `handleCertificateFiles()` - 15 edges
7. `renderOcrReview()` - 15 edges
8. `normalizeGrade()` - 14 edges
9. `sbFetch()` - 14 edges
10. `escHtml()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `make_reader()` --uses--> `Reader`  [INFERRED]
  tests/ocr-native-speed.py → portable-ocr/service.py
- `handleCertificateFiles()` --calls--> `parseOcrPages()`  [EXTRACTED]
  index.html → index.html

## Import Cycles
- None detected.

## Communities (29 total, 7 thin omitted)

### Community 0 - "service.py"
Cohesion: 0.08
Nodes (4): check(), group_lines(), Reader, make_reader()

### Community 1 - "server.js"
Cohesion: 0.14
Nodes (11): { chromium }, expected, fs, path, samples, { serve }, fs, http (+3 more)

### Community 2 - "UOS British Calculator"
Cohesion: 0.29
Nodes (6): 📦 Deployment, 📝 Features, 🚀 Live Site, 🛠️ Local Development, Teaching the reader (shared rules), UOS British Calculator

### Community 4 - "saveLearnedRule"
Cohesion: 0.29
Nodes (10): buildLayoutRegex(), compileLearnedRules(), escapeRegex(), loadLearnedRules(), readLocalRules(), ruleKey(), saveLearnedRule(), supabaseReady() (+2 more)

### Community 6 - "Set up OCR on the other Windows PC"
Cohesion: 0.50
Nodes (3): Next step, Set up OCR on the other Windows PC, What is ready

### Community 8 - "vercel.json"
Cohesion: 0.40
Nodes (4): maxDuration, functions, api/ocr.js, headers

### Community 10 - "index.html"
Cohesion: 0.05
Nodes (31): allSubjects, AR_NUMBER_WORDS, closeSuccessModal(), closeSuccessModalAndScrollToScenarios(), ENGINE_NAMES, GRADE_WORDS, gradeNotes, gradeStatusLabels (+23 more)

### Community 11 - "submitTeach"
Cohesion: 0.11
Nodes (41): bigramSimilarity(), classifyPageStatus(), cleanBoardSubject(), cleanOcrLine(), cleanSchoolSubject(), deriveLayoutTemplate(), expandSubjectAbbreviations(), guessTeachValues() (+33 more)

### Community 12 - "formatPercentage"
Cohesion: 0.12
Nodes (36): addSubjectToScenario(), appendExcludedSubjectsToPdf(), buildPdfHeader(), buildScenarioPresentation(), buildStablePresentation(), _calcScenarioPDFBodyHeight(), calculateOverallPercentage(), coreScienceType() (+28 more)

### Community 13 - "renderAdminPanel"
Cohesion: 0.17
Nodes (20): adminAlertsHTML(), adminMsg(), adminPasswordPrompt(), adminSaveNewPassword(), adminSaveWebhook(), adminSendPasswordLink(), adminSetStatus(), adminShowChangePassword() (+12 more)

### Community 14 - "addOcrRowsToCalculator"
Cohesion: 0.11
Nodes (30): addFilledSubjectCard(), addOcrRowsToCalculator(), addSubjectRow(), adminCleanupPages(), adminConfirmDeleteAllPages(), appConfirm(), autoAddNextRow(), categoryOf() (+22 more)

### Community 15 - "handleCertificateFiles"
Cohesion: 0.12
Nodes (24): cropSnapshot(), escHtml(), fileFingerprint(), handleCertificateFiles(), highlightMatch(), makeSnapshots(), needsConfirmation(), ocrFileFor() (+16 more)

### Community 16 - "appAlert"
Cohesion: 0.28
Nodes (13): adminViewSample(), appAlert(), bulkAddRows(), downloadData(), downloadScenarioPDF(), getRequiredEmployeeName(), getRequiredStudentId(), loadJsPDF() (+5 more)

### Community 17 - "extractPages"
Cohesion: 0.25
Nodes (11): extractPages(), hasResultLines(), imageFileToCanvas(), mergeEngineRows(), readCertificateFile(), readFileBothEngines(), readFileWithEngine(), renderPdfPage() (+3 more)

### Community 18 - "ocr-gateway.test.js"
Cohesion: 0.25
Nodes (6): assert, fs, handler, { Readable }, request(), vm

### Community 20 - "loadPdfLibrary"
Cohesion: 0.10
Nodes (28): arabicWordMarks(), digitMark(), ensurePaddleReady(), findMoeMark(), getOcrEngine(), getTessWorker(), groupPaddleLines(), loadOrt() (+20 more)

### Community 21 - "Connect the work PC to the online calculator"
Cohesion: 0.50
Nodes (3): Connect the work PC to the online calculator, In the existing Vercel project, On the work PC only

### Community 22 - "playwright"
Cohesion: 0.20
Nodes (9): playwright, devDependencies, playwright, name, private, scripts, test, test:ocr (+1 more)

### Community 27 - "below-minimum.test.js"
Cohesion: 0.20
Nodes (6): { chromium }, { serve }, { chromium }, pages, { serve }, serve()

### Community 28 - "update-graph.cjs"
Cohesion: 0.22
Nodes (7): { execFileSync }, fs, html, input, path, root, source

### Community 29 - "ocr-speed.test.js"
Cohesion: 0.14
Nodes (9): assert, fs, html, vm, assert, { chromium }, fs, path (+1 more)

### Community 31 - "ocr-review-fixes.test.js"
Cohesion: 0.22
Nodes (6): assert, { chromium }, { serve }, assert, { chromium }, { serve }

## Knowledge Gaps
- **90 isolated node(s):** `{ chromium }`, `expected`, `fs`, `path`, `samples` (+85 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 140 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `isBelowMinimum()` connect `formatPercentage` to `index.html`, `below-minimum.test.js`?**
  _High betweenness centrality (0.237) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `addOcrRowsToCalculator()` (e.g. with `escHtml()` and `needsConfirmation()`) actually correct?**
  _`addOcrRowsToCalculator()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `{ chromium }`, `expected`, `fs` to the rest of the system?**
  _90 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `service.py` be split into smaller, more focused modules?**
  _Cohesion score 0.07507507507507508 - nodes in this community are weakly interconnected._
- **Why does `playwright` connect `playwright` to `server.js`, `below-minimum.test.js`, `ocr-speed.test.js`, `ocr-review-fixes.test.js`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Should `server.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14166666666666666 - nodes in this community are weakly interconnected._
- **Why does `serve()` connect `below-minimum.test.js` to `server.js`, `ocr-speed.test.js`, `ocr-review-fixes.test.js`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._