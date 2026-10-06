@echo off
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
  echo Run SETUP.cmd first.
  pause
  exit /b 1
)
".venv\Scripts\python.exe" service.py --prepare-connection
if errorlevel 1 exit /b 1
if not exist "cloudflared.exe" (
  echo Downloading the free tunnel program from Cloudflare's official GitHub release...
  powershell -NoProfile -Command "$ErrorActionPreference='Stop'; Invoke-WebRequest 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile 'cloudflared.exe'"
  if errorlevel 1 (
    echo Download failed. Please send the error message.
    pause
    exit /b 1
  )
)
echo Restart START.cmd to load the connection key. Keep both windows open.
echo Send the https://...trycloudflare.com address to the project chat.
echo Do not send connection-key.txt to the chat or put it on GitHub.
"cloudflared.exe" tunnel --url http://127.0.0.1:8766
pause
