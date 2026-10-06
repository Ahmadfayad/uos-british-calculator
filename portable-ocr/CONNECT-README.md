# Connect the work PC to the online calculator

Staff continue using https://uos-british-calculator.vercel.app/ and Auto mode.
There is no staff login. Anyone able to use the website can request OCR; the
private connection key protects the work PC endpoint, not access to the website.

## On the work PC only

1. Extract this updated package into your existing OCR folder, replacing source
   files. Keep its existing `.venv` and `models` folders. If using a fresh folder,
   run SETUP.cmd first.
2. Double-click CONNECT.cmd. It creates a private `connection-key.txt` and
   downloads Cloudflare's official portable tunnel program. No admin rights,
   Cloudflare account or incoming firewall rule is required.
3. Stop the old OCR window and double-click START.cmd again, so it loads the key.
4. Keep START and CONNECT windows open. Send only the printed
   `https://...trycloudflare.com` address to the project chat.

The tunnel is temporary: restarting CONNECT changes the address. It is a speed
test connection, not a permanent production service. A stable tunnel requires
separate setup. Never send the connection key to chat, commit it, or share it
with staff. Only paste it into the private Vercel settings below.

## In the existing Vercel project

Project Settings → Environment Variables. Add for Production:

- `OCR_SERVER_URL`: the HTTPS address printed by CONNECT.cmd, without a trailing path.
- `OCR_SERVER_TOKEN`: the contents of `connection-key.txt` from the work PC.

Deploy the updated calculator and redeploy after changing these variables.
Do not give either variable a public/browser prefix. The website sends PNG
files/pages to its own `/api/ocr`; Vercel adds the private key and forwards them to
the work PC over HTTPS. Staff do not visit the tunnel or local test page.

The calculator sends original scanned PDFs with up to 3 pages and at most 4 MB
to the work PC. This preserved every grade in the supplied certificate;
browser-rendered PNG pages changed one A* to A during testing, so they are not
used for PDF forwarding. Larger PDFs and PDFs with usable result text layers
keep the existing browser/text-layer path. Image uploads use lossless PNG at
their original resolution and must fit 4 MB; larger images use browser OCR.
If the server is unavailable at the initial check (2 seconds
maximum), the whole batch uses browser OCR. A connection failure during a batch
switches the remaining pages to browser OCR; an in-flight request can wait up
to 14 seconds before falling back. No whole-file retry solely for a connection
failure. No document or recognised text is saved or logged by the OCR service.
Pages transit Vercel and Cloudflare; normal provider operational metadata may
still be recorded. Do not claim documents remain on the staff computer.

Test the same certificate through the website and check every grade. The
reported 7.3 seconds is local OCR only; online upload and rendering add time.
An asleep, disconnected or powered-off work PC cannot provide OCR.
