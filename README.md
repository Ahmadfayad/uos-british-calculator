# UOS British Calculator

A British Curriculum Grade Calculator for the University of Sharjah.

## 🚀 Live Site

https://uos-british-calculator.vercel.app

## 📦 Deployment

Deployed on Vercel from the `main` branch of this repository.

## 🛠️ Local Development

Serve the folder with any static web server, for example:

```bash
npx serve .
```

Opening `index.html` directly from disk also works, but the PaddleOCR models cannot be
loaded from `file://`, so the certificate reader falls back to Tesseract.

## 📝 Features

- Calculate British curriculum averages (O-Level / IGCSE, AS-Level, A-Level) using the
  UOS Foreign Certificates Booklet rules
- Extra board subjects and Grade 12 MOE marks are added whenever they raise the average
- Medicine, Dental and Pharmacy checks with level-specific minimum grades, explained per scenario
- Scenario editing, PDF and Excel reports
- **Read subjects from certificates (OCR):** drop PDF or image scans; subjects, levels and
  grades are detected for staff to review before they are added. Everything runs in the
  browser, and no document is uploaded. Engines:
  - Auto: PaddleOCR, with Tesseract as backup (recommended)
  - PaddleOCR only
  - Tesseract only
  - Both engines combined
- Dark/Light theme, responsive design

### Teaching the reader (shared rules)

When a document's layout is not recognised, staff click a line under
**"Teach the reader a new layout"** and say which subject, level and grade it
shows. Corrected subject spellings are remembered too. A taught rule works at once
on that computer and is sent to Supabase as *pending*; an admin approves it
(footer → **Admin**) and it then applies for everyone. Rules contain layout
patterns only, never student data.

Setup: run [`supabase/setup.sql`](supabase/setup.sql) in the Supabase SQL editor,
create an admin user, then set `SUPABASE_URL` and `SUPABASE_KEY` (the
**publishable/anon** key, never the `service_role` key) at the top of the
"Learned reading rules" script in `index.html`. Without them, taught rules stay on
the computer that taught them.

PaddleOCR model details and licences: [`models/paddleocr/README.md`](models/paddleocr/README.md).
