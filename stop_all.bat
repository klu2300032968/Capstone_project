@echo off
setlocal enabledelayedexpansion

echo ====================================================================
echo   API Gateway Security Controls With ARSA Intelligence
echo   Automated System Shutdown (Windows CMD)
echo ====================================================================
echo.

cd /d "%~dp0"

for %%P in (8080 8081 5174) do (
    echo Checking port %%P...
    for /f "tokens=5" %%A in ('netstat -aon ^| findstr ":%%P" ^| findstr "LISTENING"') do (
        echo   -^> Terminating process with PID %%A on port %%P...
        taskkill /F /PID %%A >nul 2>&1
    )
)

echo.
echo ====================================================================
echo   All Application Services (8080, 8081, 5174) Have Been Stopped.
echo ====================================================================
echo.
pause
