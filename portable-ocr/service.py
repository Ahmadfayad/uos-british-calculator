"""Loopback OCR service with optional keyed tunnel endpoints; no document logs."""
import argparse
import io
import hmac
import http.client
import json
import math
import os
import re
import secrets
import threading
import time
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

import numpy as np
import pypdfium2 as pdfium
from PIL import Image, ImageDraw, ImageFont
from rapidocr import RapidOCR
from rapidocr.ch_ppocr_rec.typings import TextRecInput
from rapidocr.utils.process_img import get_rotate_crop_image
from rapidocr.utils.typings import EngineType

ROOT = Path(__file__).resolve().parent
PORT = 8766
MAX_BYTES = 50 * 1024 * 1024
MAX_PIXELS = 20_000_000
Image.MAX_IMAGE_PIXELS = MAX_PIXELS
LOCK = threading.Lock()
# ponytail: one request at a time; add a bounded worker pool if shared usage grows.


def group_lines(texts, boxes, width, height, rtl=False):
    """Match the calculator's groupPaddleLines so table columns stay together."""
    items = []
    for text, box in zip(texts, boxes):
        if not text.strip():
            continue
        x0, y0 = box.min(axis=0)
        x1, y1 = box.max(axis=0)
        items.append({'text': text, 'x0':float(x0), 'x1':float(x1), 'y0':float(y0), 'y1':float(y1)})
    lines = []
    for item in sorted(items, key=lambda item: (item['y0'], item['x0'])):
        cy, h = (item['y0'] + item['y1']) / 2, item['y1'] - item['y0']
        line = next((line for line in lines if abs(line['cy'] - cy) < min(line['h'], h) * 0.5), None)
        if line is None:
            line = {'cy':cy, 'h':h, 'items':[]}
            lines.append(line)
        line['items'].append(item)
    return '\n'.join(' '.join(item['text'] for item in sorted(line['items'], key=lambda item: item['x0'], reverse=rtl)) for line in lines), [
        {'x0':min(item['x0'] for item in line['items'])/width, 'x1':max(item['x1'] for item in line['items'])/width,
         'y0':min(item['y0'] for item in line['items'])/height, 'y1':max(item['y1'] for item in line['items'])/height} for line in lines]


class Reader:
    def __init__(self, backend='onnxruntime'):
        common = {
            'Global.log_level': 'error', 'Global.use_cls': False,
            'Global.text_score': 0.0, 'Global.max_side_len': 4000,
            'Det.model_path': str(ROOT / 'models/det_ppocrv4_mobile.onnx'),
            'Det.mean': [0.485, 0.456, 0.406], 'Det.std': [0.229, 0.224, 0.225],
            'Det.limit_type': 'max', 'Det.limit_side_len': 1920,
            'EngineConfig.onnxruntime.intra_op_num_threads': min(4, max(1, (os.cpu_count() or 2) - 1)),
            'EngineConfig.onnxruntime.inter_op_num_threads': 1,
        }
        if backend == 'openvino':
            common.update({'Det.engine_type':EngineType.OPENVINO, 'Rec.engine_type':EngineType.OPENVINO,
                'EngineConfig.openvino.inference_num_threads':4,
                'EngineConfig.openvino.num_streams':1,
                'EngineConfig.openvino.performance_hint':'LATENCY'})
        self.engines = {}
        for lang in ('en', 'ar'):
            self.engines[lang] = RapidOCR(params={**common,
                'Rec.model_path': str(ROOT / f'models/rec_{lang}_ppocrv{5 if lang == "en" else 3}_mobile.onnx'),
                'Rec.rec_keys_path': str(ROOT / f'models/dict_{lang}.txt'),
                'Rec.lang_type': 'en' if lang == 'en' else 'arabic',
            })

    def read_image(self, image, number, level):
        start = time.perf_counter()
        if image.width * image.height > MAX_PIXELS:
            raise ValueError('Page/image is too large. Use a normal A4 certificate scan.')
        # Match the browser's grayscale input; RapidOCR takes OpenCV BGR arrays.
        image = image.convert('L').convert('RGB')
        pixels = np.asarray(image)[:, :, ::-1].copy()
        result = self.engines['en'](pixels, use_cls=False)
        texts = list(result.txts or ())
        boxes = [] if result.boxes is None else result.boxes
        text, line_boxes = group_lines(texts, boxes, image.width, image.height)
        page = {'page': number, 'text': text, 'source': 'ocr',
                'confidence': round(float(np.mean(result.scores)) * 100) if texts else 0,
                'lineBoxes': line_boxes}
        if (level == 'moe' or re.search(r'GRADE\s*12|YEAR\s*12|Ministry of Education', text, re.I)) and len(boxes):
            # Reuse detected boxes: Arabic recognition adds no second detection pass.
            crops = [get_rotate_crop_image(pixels, box.copy()) for box in boxes]
            arabic = self.engines['ar'].text_rec(TextRecInput(img=crops))
            page['arabicText'] = group_lines(arabic.txts or (), boxes, image.width, image.height, rtl=True)[0]
        page['seconds'] = round(time.perf_counter() - start, 2)
        return page

    def read(self, data, is_pdf, level):
        if level not in ('o-level', 'as-level', 'a-level', 'moe'):
            raise ValueError('Choose a valid certificate type.')
        pages = []
        if is_pdf:
            with pdfium.PdfDocument(data) as document:
                if not 1 <= len(document) <= 60:
                    raise ValueError('Use a PDF with 1 to 60 pages.')
                for index in range(len(document)):
                    page = document[index]
                    try:
                        width, height = page.get_size()
                        if math.ceil(width * 300 / 72) * math.ceil(height * 300 / 72) > MAX_PIXELS:
                            raise ValueError('PDF page is too large. Use a normal A4 certificate scan.')
                        bitmap = page.render(scale=300 / 72)
                        try:
                            pages.append(self.read_image(bitmap.to_pil(), index + 1, level))
                        finally:
                            bitmap.close()
                    finally:
                        page.close()
        else:
            with Image.open(io.BytesIO(data)) as image:
                pages.append(self.read_image(image, 1, level))
        return pages


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass  # Do not log student filenames, documents or recognised text.

    def reply(self, status, data, content_type='application/json'):
        body = json.dumps(data, ensure_ascii=False).encode() if content_type == 'application/json' else data
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'")
        self.end_headers()
        self.wfile.write(body)

    def allowed(self):
        # Restrict Host and Origin as well as listening on loopback. No CORS headers.
        hosts = {f'127.0.0.1:{PORT}', f'localhost:{PORT}'}
        origin = self.headers.get('Origin')
        return self.headers.get('Host') in hosts and (origin is None or origin in {f'http://{host}' for host in hosts})

    def remote_allowed(self):
        key = getattr(self.server, 'connection_key', '')
        return bool(key) and self.headers.get('Origin') is None and hmac.compare_digest(self.headers.get('Authorization', ''), 'Bearer ' + key)

    def do_GET(self):
        if self.path == '/remote-health':
            return self.reply(200, {'ready':True}) if self.remote_allowed() else self.reply(403, {'error':'Connection key required'})
        if not self.allowed():
            return self.reply(403, {'error':'Use the local OCR test page.'})
        if self.path == '/':
            return self.reply(200, (ROOT / 'test.html').read_bytes(), 'text/html; charset=utf-8')
        if self.path == '/health':
            return self.reply(200, {'ready':True, 'localOnly':True})
        self.reply(404, {'error':'Not found'})

    def do_POST(self):
        url = urlsplit(self.path)
        remote = url.path == '/remote-ocr'
        if not (self.remote_allowed() if remote else self.allowed()):
            return self.reply(403, {'error':'Connection not allowed'})
        if url.path not in ('/ocr', '/remote-ocr'):
            return self.reply(404, {'error':'Not found'})
        if remote and self.headers.get('Content-Type') not in ('image/png', 'application/pdf'):
            return self.reply(415, {'error':'Send a PNG or PDF'})
        try:
            length = int(self.headers.get('Content-Length', '0'))
        except ValueError:
            return self.reply(400, {'error':'Invalid file size'})
        if not 0 < length <= (4 * 1024 * 1024 if remote else MAX_BYTES) or self.headers.get('Transfer-Encoding'):
            return self.reply(413, {'error':'Select a file smaller than 50 MB.'})
        if not LOCK.acquire(blocking=False):
            return self.reply(503, {'error':'Another file is being read. Try again after it finishes.'})
        try:
            self.connection.settimeout(30)
            data = self.rfile.read(length)
            if len(data) != length:
                raise ValueError('File transfer did not finish.')
            if remote and not data.startswith(b'%PDF-' if self.headers.get('Content-Type') == 'application/pdf' else b'\x89PNG\r\n\x1a\n'):
                raise ValueError('Invalid file')
            start = time.perf_counter()
            pages = self.server.reader.read(data, self.headers.get('Content-Type') == 'application/pdf', parse_qs(url.query).get('level', [''])[0])
            self.reply(200, {'pages':pages, 'seconds':round(time.perf_counter() - start, 2)})
        except (ValueError, OSError, pdfium.PdfiumError, Image.DecompressionBombError):
            self.reply(400, {'error':'Could not read this file. Check its type, size, certificate category and PDF password.'})
        except Exception:
            self.reply(500, {'error':'OCR failed. Check the local installation or try a clearer scan.'})
        finally:
            LOCK.release()


def check(reader):
    boxes = np.array([[[0,0],[90,0],[90,20],[0,20]], [[200,0],[220,0],[220,20],[200,20]]])
    text, lines = group_lines(['Biology', 'A*'], boxes, 300, 100)
    assert text == 'Biology A*' and len(lines) == 1, 'Table columns must form one result line'
    image = Image.new('RGB', (1000, 220), 'white')
    font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 48)
    ImageDraw.Draw(image).text((30, 60), 'Mathematics Grade A', fill='black', font=font)
    buffer = io.BytesIO()
    image.save(buffer, format='PNG')
    pages = reader.read(buffer.getvalue(), False, 'o-level')
    assert 'Mathematics' in pages[0]['text'] and 'A' in pages[0]['text'], 'English OCR check failed'
    arabic = Image.new('RGB', (1000, 220), 'white')
    ImageDraw.Draw(arabic).text((30, 60), 'اللغة العربية 85', fill='black', font=font)
    result = reader.read_image(arabic, 1, 'moe')
    assert result.get('arabicText') and any('\u0600' <= c <= '\u06ff' for c in result['arabicText']), 'Arabic OCR check failed'
    pdf = io.BytesIO()
    image.save(pdf, format='PDF', resolution=150)
    assert 'Mathematics' in reader.read(pdf.getvalue(), True, 'o-level')[0]['text'], 'PDF OCR check failed'
    try:
        reader.read(buffer.getvalue(), False, 'invalid')
    except ValueError:
        pass
    else:
        raise AssertionError('Category validation failed')
    with ThreadingHTTPServer(('127.0.0.1', 0), Handler) as server:
        server.reader = reader
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            connection = http.client.HTTPConnection('127.0.0.1', server.server_port, timeout=30)
            host = {'Host': f'127.0.0.1:{PORT}'}
            connection.request('GET', '/health', headers=host)
            response = connection.getresponse()
            assert response.status == 200 and json.loads(response.read())['ready']
            connection.request('POST', '/ocr?level=o-level', body=buffer.getvalue(), headers={**host, 'Content-Type':'application/octet-stream'})
            response = connection.getresponse()
            assert response.status == 200 and 'Mathematics' in json.loads(response.read())['pages'][0]['text']
            connection.request('POST', '/ocr?level=o-level', body=b'x', headers={**host, 'Origin':'https://untrusted.example'})
            response = connection.getresponse()
            assert response.status == 403
            response.read()
            server.connection_key = 'a' * 64
            connection.request('GET', '/remote-health', headers={'Host':'tunnel.example'})
            response = connection.getresponse()
            assert response.status == 403
            response.read()
            auth = {'Host':'tunnel.example', 'Authorization':'Bearer ' + server.connection_key}
            connection.request('POST', '/remote-ocr?level=o-level', body=buffer.getvalue(), headers={**auth, 'Content-Type':'image/png'})
            response = connection.getresponse()
            assert response.status == 200 and 'Mathematics' in json.loads(response.read())['pages'][0]['text']
            connection.request('GET', '/', headers=auth)
            response = connection.getresponse()
            assert response.status == 403, 'The tunnel must not expose the local test page'
            response.read()
            connection.close()
        finally:
            server.shutdown()
            thread.join()
    print('PASS English, Arabic, PDF, HTTP and origin validation checks. No student documents used.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    parser.add_argument('--prepare-connection', action='store_true')
    parser.add_argument('--backend', choices=['openvino', 'onnxruntime'], default='openvino')
    args = parser.parse_args()
    key_file = ROOT / 'connection-key.txt'
    if args.prepare_connection:
        if not key_file.exists():
            key_file.write_text(secrets.token_hex(32), encoding='ascii')
        print('Connection key saved. Keep connection-key.txt private; paste it only into the Vercel environment settings.')
        raise SystemExit(0)
    connection_key = key_file.read_text(encoding='ascii').strip() if key_file.exists() else ''
    if connection_key and not re.fullmatch('[a-f0-9]{64}', connection_key):
        raise ValueError('Invalid connection-key.txt; remove it and run CONNECT.cmd again.')
    print('Loading English and Arabic OCR models. Please wait...', flush=True)
    try:
        reader = Reader(args.backend)
        print('OCR backend: ' + args.backend, flush=True)
    except Exception:
        if args.backend != 'openvino':
            raise
        print('OpenVINO could not start; using the original ONNX CPU reader.', flush=True)
        reader = Reader()
    if args.check:
        check(reader)
    else:
        with ThreadingHTTPServer(('127.0.0.1', PORT), Handler) as server:
            server.reader = reader
            server.connection_key = connection_key
            print(f'Ready: http://127.0.0.1:{PORT} — keep this window open. Ctrl+C stops OCR.', flush=True)
            webbrowser.open(f'http://127.0.0.1:{PORT}')
            try:
                server.serve_forever()
            except KeyboardInterrupt:
                pass
