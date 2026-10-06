# Graph Report - UOS British Calculator  (2026-10-06)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 333 nodes · 758 edges · 21 communities (13 shown, 8 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `eb68903c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- saveLearnedRule
- server.js
- UOS British Calculator
- adminCleanupPages
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
- loadPdfLibrary
- AGENTS.md
- tools/README.md

## God Nodes (most connected - your core abstractions)
1. `renderAdminPanel()` - 22 edges
2. `submitTeach()` - 16 edges
3. `parseDocument()` - 15 edges
4. `parseResultLine()` - 15 edges
5. `addOcrRowsToCalculator()` - 15 edges
6. `renderOcrReview()` - 15 edges
7. `normalizeGrade()` - 14 edges
8. `sbFetch()` - 14 edges
9. `handleCertificateFiles()` - 14 edges
10. `escHtml()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `handleCertificateFiles()` --calls--> `parseOcrPages()`  [EXTRACTED]
  index.html → index.html

## Import Cycles
- None detected.

## Communities (21 total, 8 thin omitted)

### Community 0 - "saveLearnedRule"
Cohesion: 0.29
Nodes (10): buildLayoutRegex(), compileLearnedRules(), escapeRegex(), loadLearnedRules(), readLocalRules(), ruleKey(), saveLearnedRule(), supabaseReady() (+2 more)

### Community 1 - "server.js"
Cohesion: 0.07
Nodes (26): playwright, { chromium }, { serve }, { chromium }, expected, fs, path, samples (+18 more)

### Community 2 - "UOS British Calculator"
Cohesion: 0.29
Nodes (6): 📦 Deployment, 📝 Features, 🚀 Live Site, 🛠️ Local Development, Teaching the reader (shared rules), UOS British Calculator

### Community 10 - "index.html"
Cohesion: 0.05
Nodes (31): allSubjects, AR_NUMBER_WORDS, closeSuccessModal(), closeSuccessModalAndScrollToScenarios(), ENGINE_NAMES, GRADE_WORDS, gradeNotes, gradeStatusLabels (+23 more)

### Community 11 - "submitTeach"
Cohesion: 0.11
Nodes (42): bigramSimilarity(), classifyPageStatus(), cleanBoardSubject(), cleanOcrLine(), cleanSchoolSubject(), deriveLayoutTemplate(), expandSubjectAbbreviations(), guessTeachValues() (+34 more)

### Community 12 - "formatPercentage"
Cohesion: 0.12
Nodes (36): addSubjectToScenario(), appendExcludedSubjectsToPdf(), buildPdfHeader(), buildScenarioPresentation(), buildStablePresentation(), _calcScenarioPDFBodyHeight(), calculateOverallPercentage(), coreScienceType() (+28 more)

### Community 13 - "renderAdminPanel"
Cohesion: 0.17
Nodes (20): adminAlertsHTML(), adminMsg(), adminPasswordPrompt(), adminSaveNewPassword(), adminSaveWebhook(), adminSendPasswordLink(), adminSetStatus(), adminShowChangePassword() (+12 more)

### Community 14 - "addOcrRowsToCalculator"
Cohesion: 0.13
Nodes (27): addFilledSubjectCard(), addOcrRowsToCalculator(), addSubjectRow(), appConfirm(), autoAddNextRow(), categoryOf(), clearStaleState(), closeMobileBreakdown() (+19 more)

### Community 15 - "renderOcrReview"
Cohesion: 0.13
Nodes (22): cropSnapshot(), escHtml(), fileFingerprint(), handleCertificateFiles(), highlightMatch(), makeSnapshots(), needsConfirmation(), ocrFileFor() (+14 more)

### Community 16 - "appAlert"
Cohesion: 0.28
Nodes (13): adminViewSample(), appAlert(), bulkAddRows(), downloadData(), downloadScenarioPDF(), getRequiredEmployeeName(), getRequiredStudentId(), loadJsPDF() (+5 more)

### Community 17 - "extractPages"
Cohesion: 0.24
Nodes (10): extractPages(), imageFileToCanvas(), mergeEngineRows(), readCertificateFile(), readFileBothEngines(), readFileWithEngine(), renderPdfPage(), rowKey() (+2 more)

### Community 18 - "ocr-speed.test.js"
Cohesion: 0.09
Nodes (16): assert, fs, html, vm, assert, { chromium }, fs, path (+8 more)

### Community 19 - "loadPdfLibrary"
Cohesion: 0.11
Nodes (27): arabicWordMarks(), digitMark(), ensurePaddleReady(), findMoeMark(), getOcrEngine(), getTessWorker(), groupPaddleLines(), loadOrt() (+19 more)

## Knowledge Gaps
- **75 isolated node(s):** `{ chromium }`, `{ serve }`, `{ chromium }`, `expected`, `fs` (+70 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 100 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `isBelowMinimum()` connect `formatPercentage` to `server.js`, `index.html`?**
  _High betweenness centrality (0.276) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `addOcrRowsToCalculator()` (e.g. with `escHtml()` and `needsConfirmation()`) actually correct?**
  _`addOcrRowsToCalculator()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `{ chromium }`, `{ serve }`, `{ chromium }` to the rest of the system?**
  _75 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `server.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Why does `playwright` connect `server.js` to `ocr-speed.test.js`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Should `index.html` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Why does `serve()` connect `server.js` to `ocr-speed.test.js`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._