@echo off
setlocal enabledelayedexpansion

echo ====================================================================
echo   API Gateway Security Controls With ARSA Intelligence
echo   Automated System Startup (Windows CMD)
echo ====================================================================
echo.

rem Navigate to the directory of this batch file
cd /d "%~dp0"

rem Locate Java 21 executable
set "JAVA_CMD=java"
if exist "C:\Program Files\Java\jdk-21\bin\java.exe" (
    set "JAVA_CMD=C:\Program Files\Java\jdk-21\bin\java.exe"
) else if defined JAVA_HOME (
    if exist "%JAVA_HOME%\bin\java.exe" (
        set "JAVA_CMD=%JAVA_HOME%\bin\java.exe"
    )
)

echo [1/4] Checking MySQL Database connection on port 3306...
netstat -aon | findstr ":3306" | findstr "LISTENING" >nul 2>&1
if !errorlevel! equ 0 (
    echo   -^> [OK] MySQL is active and listening on port 3306.
) else (
    echo   -^> [INFO] MySQL is not detected on port 3306. Attempting startup...
    if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" (
        start "MySQL Database (3306)" "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --datadir="%~dp0mysql_runtime" --port=3306 --console
        timeout /t 5 /nobreak >nul
        echo   -^> [OK] MySQL Server initiated.
    ) else (
        net start MySQL80 >nul 2>&1
    )
)
echo.

echo [2/4] Starting Spring Boot Backend (Port 8080)...
netstat -aon | findstr ":8080" | findstr "LISTENING" >nul 2>&1
if !errorlevel! equ 0 (
    echo   -^> [OK] Backend service is already active on port 8080.
) else (
    set "LOCAL_BACKEND_ENV=set SEED_DEMO_DATA=true && set SERVER_ADDRESS=127.0.0.1"
    if exist "%~dp0backend\target\backend-0.0.1-SNAPSHOT.jar" (
        start "Backend Service (8080)" cmd /k "cd /d "%~dp0backend" && echo === Spring Boot Backend (Port 8080) === && !LOCAL_BACKEND_ENV! && "!JAVA_CMD!" -jar target\backend-0.0.1-SNAPSHOT.jar"
        echo   -^> Backend service spawned from production JAR.
    ) else (
        echo   -^> Production JAR not found. Starting via Maven...
        start "Backend Service (8080)" cmd /k "cd /d "%~dp0backend" && echo === Spring Boot Backend (Port 8080) === && !LOCAL_BACKEND_ENV! && mvn spring-boot:run"
        echo   -^> Backend service spawned via Maven.
    )
)
echo.

echo [3/4] Starting Spring Cloud Gateway (Port 8081)...
netstat -aon | findstr ":8081" | findstr "LISTENING" >nul 2>&1
if !errorlevel! equ 0 (
    echo   -^> [OK] Gateway service is already active on port 8081.
) else (
    set "LOCAL_GATEWAY_ENV=set SBMS_BACKEND_URL=http://localhost:8082 && set CORS_ALLOWED_ORIGINS=http://localhost:5174,http://localhost:5173,http://localhost:3000,http://127.0.0.1:3000,http://127.0.0.1:5174,http://127.0.0.1:5173"
    if exist "%~dp0gateway\target\gateway-0.0.1-SNAPSHOT.jar" (
        start "Gateway Service (8081)" cmd /k "cd /d "%~dp0gateway" && !LOCAL_GATEWAY_ENV! && echo === Spring Cloud Gateway (Port 8081) === && "!JAVA_CMD!" -jar target\gateway-0.0.1-SNAPSHOT.jar"
        echo   -^> Gateway service spawned from production JAR.
    ) else (
        echo   -^> Production JAR not found. Starting via Maven...
        start "Gateway Service (8081)" cmd /k "cd /d "%~dp0gateway" && !LOCAL_GATEWAY_ENV! && echo === Spring Cloud Gateway (Port 8081) === && mvn spring-boot:run"
        echo   -^> Gateway service spawned via Maven.
    )
)
echo.

echo [4/4] Starting React + Vite Frontend (Port 5174)...
netstat -aon | findstr ":5174" | findstr "LISTENING" >nul 2>&1
if !errorlevel! equ 0 (
    echo   -^> [OK] Frontend service is already active on port 5174.
) else (
    start "Frontend Service (5174)" cmd /k "cd /d "%~dp0frontend" && echo === ARSA React Frontend (Port 5174) === && npm run dev"
    echo   -^> Frontend dev server spawned.
)
echo.

echo Waiting for services to initialize...
timeout /t 6 /nobreak >nul

echo Opening ARSA Dashboard in browser...
start http://localhost:5174/

echo ====================================================================
echo   All Services Have Been Launched!
echo.
echo   - Frontend: http://localhost:5174/
echo   - Gateway:  http://localhost:8081/
echo   - Backend:  http://localhost:8080/
echo.
echo   Demo Credentials:
echo     Admin: admin / Admin@12345   (Full ARSA Dashboard, Audit, Matrix)
echo     User:  alice_dev / SecurePassword@123 (User Portal, 403 Forbidden demo)
echo ====================================================================
echo.
pause
