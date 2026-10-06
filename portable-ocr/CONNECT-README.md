# Connect the work PC to the online calculator

Staff continue using https://uos-british-calculator.vercel.app/ and the standalone **Server OCR — OpenVINO** option.
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

Server OCR sends original PDFs up to 4 MB to the OCR computer. Images are sent
as lossless PNG at their original resolution and must also fit 4 MB. Oversized
files are rejected with a clear message. An unavailable/busy server, timeout,
or empty result never triggers a different OCR engine. Browser Auto, PaddleOCR,
Tesseract and combined mode remain separate choices.

The initial server check waits up to 2 seconds; an upload waits up to 14 seconds.
Larger page counts may exceed that time: split lengthy PDFs into smaller
certificates. The OCR service does not save or log documents or recognised text.
Pages transit Vercel and Cloudflare; normal provider operational metadata may
still be recorded. Do not claim documents remain on the staff computer.

Test the same certificate through the website and check every grade. The
reported 7.3 seconds is local OCR only; online upload and rendering add time.
An asleep, disconnected or powered-off work PC cannot provide OCR.
