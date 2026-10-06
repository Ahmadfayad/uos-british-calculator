# Set up OCR on the other Windows PC

1. Copy this entire folder to `Documents\UOS Local OCR` on that PC. Extract the
   ZIP first; do not run scripts from inside the ZIP. Avoid a shared/cloud folder.
2. Double-click **SETUP.cmd** once. Internet is needed to download the free
   Python packages. This creates an isolated `.venv` inside this folder. It
   uses your existing user-installed Python; no administrator access is requested.
3. Wait for **Setup passed**. The checks read generated English, Arabic and PDF
   examples, never student certificates. If setup fails, send the displayed error.
4. Double-click **START.cmd**. Wait for **Ready**. A browser opens the local test
   page at `http://127.0.0.1:8766`. Keep the command window open during use.
5. Choose the certificate type and a PDF/image. Compare the returned text and
   every grade with the original. Record the reading time and the website's time
   for the same file on this PC. Send these timings back to the project chat.
6. Close the command window or press Ctrl+C to stop.

## What is ready

The service reads all PDF pages at 300 dpi and images with native CPU OCR. Models
stay loaded between requests. English and Arabic recognition use the same model
files as the calculator; the reading implementation differs, so grade equality
is not guaranteed. MOE mode reuses English detection boxes for Arabic recognition.
Choose MOE for Arabic school marks; British categories read English only. The
test page displays recognised text, not calculated admissions results.

This version uses OpenVINO on CPU by default. It was faster on the developer PC
and preserved all seven subject/grade pairs in the supplied two-page O-Level
certificate; this is not proof of accuracy on all documents or timings on your
PC. It automatically falls back to ONNX if OpenVINO cannot initialise. For a
speed comparison, stop the window, run **START-ORIGINAL.cmd**, and read the same
certificate again. Compare first-use and repeated-use times separately.
Both readers now combine subjects and grades on the same line for the calculator.

Only one file is processed at a time (PDFium is not thread-safe). Files are
limited to 50 MB, PDFs to 60 pages, and rendered pages/images to 20 megapixels.
PDFs with passwords, oversized pages or unsupported files may be rejected.
This test service OCRs every page, including digital pages with a text layer;
the browser calculator can be faster on those PDFs. Compare scanned certificates.

Documents and results are held in memory and are not saved or logged by this
service. They are not sent to a cloud OCR provider. Python packages may be
downloaded during setup; the English/Arabic model files are included in the ZIP.
Temporary Python environments, browser memory and OS paging still use ordinary
computer storage; this is not a secure erasure guarantee.

## Next step

The website connection is prepared. Follow **CONNECT-README.md** on the work PC
to create a temporary tunnel, then configure the private Vercel variables and
deploy the website changes. Staff login is not required. The local test page
stays restricted; the separate remote endpoints require a private connection key.
No Windows service, firewall rule, automatic startup or paid subscription is added.

If Windows blocks downloaded scripts, confirm this folder came from your project
chat and follow your organisation's software policy. If Python is not found,
reopen PowerShell after installing it and check `python --version`. A missing
Visual C++ runtime may require IT; these scripts will not install system components.

Models: PaddleOCR, Apache 2.0. See `models/README.md` and `models/LICENSE`.
RapidOCR: Apache 2.0; ONNX Runtime: MIT; pypdfium2: Apache 2.0/BSD-3-Clause,
with third-party PDFium notices shipped by its Python package.
