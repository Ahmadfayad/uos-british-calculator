"""Serial native OCR comparison. Documents/results stay in the supplied output folder."""
import argparse
import json
import platform
import statistics
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'portable-ocr'))
from service import Reader, ROOT
from rapidocr import RapidOCR
from rapidocr.utils.typings import EngineType, ModelType, OCRVersion


def make_reader(variant):
    reader = Reader.__new__(Reader)
    params = {
        'Global.log_level':'error', 'Global.use_cls':False, 'Global.text_score':0.0,
        'Global.max_side_len':4000, 'EngineConfig.onnxruntime.intra_op_num_threads':4,
        'EngineConfig.onnxruntime.inter_op_num_threads':1,
        'Det.limit_type':'max', 'Det.limit_side_len':1920,
        'Det.model_path':str(ROOT / 'models/det_ppocrv4_mobile.onnx'),
        'Det.mean':[0.485,0.456,0.406], 'Det.std':[0.229,0.224,0.225],
        'Rec.model_path':str(ROOT / 'models/rec_en_ppocrv5_mobile.onnx'),
        'Rec.rec_keys_path':str(ROOT / 'models/dict_en.txt'), 'Rec.lang_type':'en',
    }
    if variant == 'onnx-6-threads':
        params['EngineConfig.onnxruntime.intra_op_num_threads'] = 6
    if variant.startswith('v6-'):
        params.update({'Det.model_path':None, 'Rec.model_path':None, 'Rec.rec_keys_path':None,
            'Det.ocr_version':OCRVersion.PPOCRV6, 'Rec.ocr_version':OCRVersion.PPOCRV6,
            'Det.model_type':ModelType.TINY if variant == 'v6-tiny' else ModelType.SMALL,
            'Rec.model_type':ModelType.TINY if variant == 'v6-tiny' else ModelType.SMALL,
            'Rec.lang_type':'ch', 'Det.mean':[0.5]*3, 'Det.std':[0.5]*3})
    if variant == 'openvino':
        params.update({'Det.engine_type':EngineType.OPENVINO, 'Rec.engine_type':EngineType.OPENVINO,
            'EngineConfig.openvino.inference_num_threads':4,
            'EngineConfig.openvino.num_streams':1,
            'EngineConfig.openvino.performance_hint':'LATENCY'})
    reader.engines = {'en': RapidOCR(params=params)}
    return reader


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('pdf', type=Path)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--runs', type=int, default=2)
    parser.add_argument('--variants', nargs='+', default=['current', 'onnx-6-threads', 'openvino', 'v6-small', 'v6-tiny'])
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    data = args.pdf.read_bytes()
    results = []
    for variant in args.variants:
        try:
            started = time.perf_counter()
            reader = make_reader(variant)
            startup = round(time.perf_counter() - started, 2)
            runs = []
            for index in range(args.runs):
                started = time.perf_counter()
                pages = reader.read(data, True, 'o-level')
                seconds = round(time.perf_counter() - started, 2)
                runs.append({'seconds':seconds, 'pages':pages})
                print(f'{variant} run {index+1}: {seconds}s, {len(pages)} pages', flush=True)
            result = {'variant':variant, 'startupSeconds':startup,
                      'medianSeconds':statistics.median(run['seconds'] for run in runs), 'runs':runs}
            del reader
        except Exception as error:
            result = {'variant':variant, 'error':str(error)}
            print(f'{variant}: failed — {type(error).__name__}', flush=True)
        results.append(result)
        (args.output / 'native-results.json').write_text(json.dumps({'platform':platform.platform(), 'results':results}, ensure_ascii=False, indent=2), encoding='utf8')
