@echo off
setlocal
cd /d "%~dp0"
set "OCR_PYTHON=python"
if exist "%USERPROFILE%\RapidOCR\.venv\Scripts\python.exe" set "OCR_PYTHON=%USERPROFILE%\RapidOCR\.venv\Scripts\python.exe"
"%OCR_PYTHON%" -c "import sys; assert sys.version_info >= (3, 10)" >nul 2>&1
if errorlevel 1 (
  echo Python 3.10 or newer was not found. Install Python for your account and reopen this folder.
  pause
  exit /b 1
)
if not exist ".venv\Scripts\python.exe" "%OCR_PYTHON%" -m venv .venv
if errorlevel 1 goto failed
".venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 goto failed
".venv\Scripts\python.exe" service.py --check
if errorlevel 1 goto failed
echo.
echo Setup passed. Double-click START.cmd to open the local OCR test page.
pause
exit /b 0
:failed
echo.
echo Setup did not complete. Copy the error above and send it to your project chat.
pause
exit /b 1
