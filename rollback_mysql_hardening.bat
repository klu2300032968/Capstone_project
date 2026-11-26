@echo off
echo ========================================================
echo Phase 2.7 - MySQL Hardening Rollback Script
echo ========================================================
echo.

echo 1. Restoring Original Inbound Firewall Rules...
netsh advfirewall firewall set rule name="Port 3306" new enable=yes
netsh advfirewall firewall set rule name="Port 33060" new enable=yes
echo.

echo 2. Restoring Original my.ini from backup...
copy /Y "E:\backups\phase_2_7_20261125\my.ini.bak" "C:\ProgramData\MySQL\MySQL Server 8.0\my.ini"
echo.

echo 3. Restarting MySQL80 service...
net stop MySQL80
net start MySQL80
echo.

echo 4. Verifying Listening Ports...
netstat -ano | findstr ":3306"
echo.
echo ========================================================
echo Rollback complete.
echo ========================================================
pause
