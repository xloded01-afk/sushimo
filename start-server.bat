@echo off
cd /d "%~dp0"
where python >nul 2>nul
if errorlevel 1 (
  echo Python ne najden. Ustanovite Python 3 i zapustite fail snova.
  pause
  exit /b 1
)
echo ==============================================
echo   Sushimo local server: http://localhost:8000/
echo   Press Ctrl+C to stop the server
echo ==============================================
start "" cmd /c "timeout /t 2 >nul & start "" http://localhost:8000/"
python -m http.server 8000
