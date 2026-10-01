# PaddleOCR models

These models power the "Read subjects from certificates" feature when the
PaddleOCR engine is selected. They run in the browser through ONNX Runtime Web;
no document is uploaded anywhere.

| File | Model | Source |
|---|---|---|
| `det_ppocrv4_mobile.onnx` | PP-OCRv4 mobile text detection | [`@gutenye/ocr-models`](https://www.npmjs.com/package/@gutenye/ocr-models) 1.4.2 (`ch_PP-OCRv4_det_infer.onnx`) |
| `rec_en_ppocrv5_mobile.onnx`, `dict_en.txt` | PP-OCRv5 mobile English recognition | [`monkt/paddleocr-onnx`](https://huggingface.co/monkt/paddleocr-onnx) (`languages/english/`) |
| `rec_ar_ppocrv3_mobile.onnx`, `dict_ar.txt` | PP-OCRv3 mobile Arabic recognition | [`monkt/paddleocr-onnx`](https://huggingface.co/monkt/paddleocr-onnx) (`languages/arabic/`) |

The models are by [PaddlePaddle/PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR)
and are licensed under the Apache License 2.0.
