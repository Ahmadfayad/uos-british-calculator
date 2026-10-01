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

PaddleOCR model details and licences: [`models/paddleocr/README.md`](models/paddleocr/README.md).
