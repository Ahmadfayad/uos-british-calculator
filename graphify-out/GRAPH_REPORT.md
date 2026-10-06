# Graph Report - UOS British Calculator  (2026-10-06)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 400 nodes · 850 edges · 26 communities (19 shown, 7 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 22 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `76ba6e14`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- service.py
- server.js
- UOS British Calculator
- Handler
- handleCertificateFiles
- findMoeMark
- Set up OCR on the other Windows PC
- index.ts
- vercel.json
- index.html
- submitTeach
- formatPercentage
- renderAdminPanel
- addOcrRowsToCalculator
- renderOcrReview
- appAlert
- extractPages
- ocr-speed.test.js
- paddleReadWith
- paddleSession
- Connect the work PC to the online calculator
- AGENTS.md
- tools/README.md

## God Nodes (most connected - your core abstractions)
1. `renderAdminPanel()` - 22 edges
2. `submitTeach()` - 16 edges
3. `parseDocument()` - 15 edges
4. `parseResultLine()` - 15 edges
5. `addOcrRowsToCalculator()` - 15 edges
6. `renderOcrReview()` - 15 edges
7. `handleCertificateFiles()` - 15 edges
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

## Communities (26 total, 7 thin omitted)

### Community 0 - "service.py"
Cohesion: 0.08
Nodes (4): check(), group_lines(), Reader, make_reader()

### Community 1 - "server.js"
Cohesion: 0.07
Nodes (26): playwright, { chromium }, { serve }, { chromium }, expected, fs, path, samples (+18 more)

### Community 2 - "UOS British Calculator"
Cohesion: 0.29
Nodes (6): 📦 Deployment, 📝 Features, 🚀 Live Site, 🛠️ Local Development, Teaching the reader (shared rules), UOS British Calculator

### Community 4 - "handleCertificateFiles"
Cohesion: 0.18
Nodes (14): ensurePaddleReady(), fileFingerprint(), getOcrEngine(), getTessWorker(), handleCertificateFiles(), loadOrt(), loadPdfLibrary(), loadScriptOnce() (+6 more)

### Community 5 - "findMoeMark"
Cohesion: 0.70
Nodes (5): arabicWordMarks(), digitMark(), findMoeMark(), normalizeArabic(), parseMoeRows()

### Community 6 - "Set up OCR on the other Windows PC"
Cohesion: 0.50
Nodes (3): Next step, Set up OCR on the other Windows PC, What is ready

### Community 8 - "vercel.json"
Cohesion: 0.40
Nodes (4): maxDuration, functions, api/ocr.js, headers

### Community 10 - "index.html"
Cohesion: 0.05
Nodes (33): allSubjects, AR_NUMBER_WORDS, buildLayoutRegex(), closeSuccessModal(), closeSuccessModalAndScrollToScenarios(), ENGINE_NAMES, escapeRegex(), GRADE_WORDS (+25 more)

### Community 11 - "submitTeach"
Cohesion: 0.11
Nodes (41): bigramSimilarity(), classifyPageStatus(), cleanBoardSubject(), cleanOcrLine(), cleanSchoolSubject(), deriveLayoutTemplate(), expandSubjectAbbreviations(), guessTeachValues() (+33 more)

### Community 12 - "formatPercentage"
Cohesion: 0.12
Nodes (36): addSubjectToScenario(), appendExcludedSubjectsToPdf(), buildPdfHeader(), buildScenarioPresentation(), buildStablePresentation(), _calcScenarioPDFBodyHeight(), calculateOverallPercentage(), coreScienceType() (+28 more)

### Community 13 - "renderAdminPanel"
Cohesion: 0.12
Nodes (29): adminAlertsHTML(), adminMsg(), adminPasswordPrompt(), adminSaveNewPassword(), adminSaveWebhook(), adminSendPasswordLink(), adminSetStatus(), adminShowChangePassword() (+21 more)

### Community 14 - "addOcrRowsToCalculator"
Cohesion: 0.11
Nodes (30): addFilledSubjectCard(), addOcrRowsToCalculator(), addSubjectRow(), adminCleanupPages(), adminConfirmDeleteAllPages(), appConfirm(), autoAddNextRow(), categoryOf() (+22 more)

### Community 15 - "renderOcrReview"
Cohesion: 0.18
Nodes (17): cropSnapshot(), escHtml(), highlightMatch(), makeSnapshots(), needsConfirmation(), ocrFileFor(), ocrFlag(), ocrGradeCell() (+9 more)

### Community 16 - "appAlert"
Cohesion: 0.32
Nodes (12): appAlert(), bulkAddRows(), downloadData(), downloadScenarioPDF(), getRequiredEmployeeName(), getRequiredStudentId(), loadJsPDF(), _preloadLogo() (+4 more)

### Community 17 - "extractPages"
Cohesion: 0.25
Nodes (11): extractPages(), hasResultLines(), imageFileToCanvas(), mergeEngineRows(), readCertificateFile(), readFileBothEngines(), readFileWithEngine(), renderPdfPage() (+3 more)

### Community 18 - "ocr-speed.test.js"
Cohesion: 0.07
Nodes (22): assert, fs, html, vm, assert, fs, handler, { Readable } (+14 more)

### Community 19 - "paddleReadWith"
Cohesion: 0.28
Nodes (9): groupPaddleLines(), looksLikeMoeDocument(), normalizeBoxes(), paddleReadPage(), paddleReadWith(), resetTessWorker(), tesseractReadPage(), tessRecognize() (+1 more)

### Community 20 - "paddleSession"
Cohesion: 0.60
Nodes (5): paddleDetect(), paddleRecognize(), paddleSession(), reverseArabicPrediction(), runPaddle()

### Community 21 - "Connect the work PC to the online calculator"
Cohesion: 0.50
Nodes (3): Connect the work PC to the online calculator, In the existing Vercel project, On the work PC only

## Knowledge Gaps
- **84 isolated node(s):** `{ chromium }`, `{ serve }`, `{ chromium }`, `expected`, `fs` (+79 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 134 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `isBelowMinimum()` connect `formatPercentage` to `server.js`, `index.html`?**
  _High betweenness centrality (0.221) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `addOcrRowsToCalculator()` (e.g. with `escHtml()` and `needsConfirmation()`) actually correct?**
  _`addOcrRowsToCalculator()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `{ chromium }`, `{ serve }`, `{ chromium }` to the rest of the system?**
  _84 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `service.py` be split into smaller, more focused modules?**
  _Cohesion score 0.07507507507507508 - nodes in this community are weakly interconnected._
- **Why does `playwright` connect `server.js` to `ocr-speed.test.js`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Should `server.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Why does `serve()` connect `server.js` to `ocr-speed.test.js`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._