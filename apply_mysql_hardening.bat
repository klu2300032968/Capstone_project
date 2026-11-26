@echo off
echo ========================================================
echo Phase 2.7 - MySQL Network Hardening Script
echo ========================================================
echo.

echo 1. Disabling Inbound Firewall Rules for Port 3306 and 33060...
netsh advfirewall firewall set rule name="Port 3306" new enable=no
netsh advfirewall firewall set rule name="Port 33060" new enable=no
echo.

echo 2. Backing up and copying hardened my.ini...
copy /Y "C:\ProgramData\MySQL\MySQL Server 8.0\my.ini" "E:\backups\phase_2_7_20261125\my.ini.admin_backup.bak"
copy /Y "E:\backups\phase_2_7_20261125\my.ini.hardened" "C:\ProgramData\MySQL\MySQL Server 8.0\my.ini"
echo.

echo 3. Restarting MySQL80 service...
net stop MySQL80
net start MySQL80
echo.

echo 4. Verifying Listening Ports...
netstat -ano | findstr ":3306"
echo.
echo ========================================================
echo Hardening execution finished.
echo ========================================================
pause
