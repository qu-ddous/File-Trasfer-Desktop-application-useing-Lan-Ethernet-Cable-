@echo off
:: WireDrop Windows Defender Firewall 1-Click Enabler (Auto-Elevating)
title WireDrop Firewall Enabler

:: Check for Administrator permissions and auto-elevate
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [INFO] Requesting Administrator Privileges...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process cmd -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
    exit /b
)

echo ========================================================
echo   WireDrop - Windows Defender Firewall Configuration
echo ========================================================
echo.
echo Adding Windows Firewall Inbound Rules across ALL profiles
echo (Public, Private, Domain) for direct Ethernet connections...
echo.

:: 1. Allow Port 52521 TCP (High-Speed File Transfer Socket)
netsh advfirewall firewall delete rule name="WireDrop Transfer TCP 52521" >nul 2>&1
netsh advfirewall firewall add rule name="WireDrop Transfer TCP 52521" dir=in action=allow protocol=TCP localport=52521 profile=any

:: 2. Allow Port 52520 UDP (Auto Peer Discovery Beacon)
netsh advfirewall firewall delete rule name="WireDrop Discovery UDP 52520" >nul 2>&1
netsh advfirewall firewall add rule name="WireDrop Discovery UDP 52520" dir=in action=allow protocol=UDP localport=52520 profile=any

:: 3. Allow Port 52522 TCP (Direct Browser Web Share & REST API)
netsh advfirewall firewall delete rule name="WireDrop Web Share TCP 52522" >nul 2>&1
netsh advfirewall firewall add rule name="WireDrop Web Share TCP 52522" dir=in action=allow protocol=TCP localport=52522 profile=any

:: 4. Allow WireDrop Application Executables
if exist "%~dp0WireDrop.exe" (
    netsh advfirewall firewall delete rule name="WireDrop Desktop App" >nul 2>&1
    netsh advfirewall firewall add rule name="WireDrop Desktop App" dir=in action=allow program="%~dp0WireDrop.exe" profile=any
)
if exist "%~dp0release\win-unpacked\WireDrop.exe" (
    netsh advfirewall firewall delete rule name="WireDrop Dev App" >nul 2>&1
    netsh advfirewall firewall add rule name="WireDrop Dev App" dir=in action=allow program="%~dp0release\win-unpacked\WireDrop.exe" profile=any
)

echo.
echo ========================================================
echo   SUCCESS! All WireDrop Ports Are Now Open:
echo     - Port 52520 (UDP): Auto Peer Discovery
echo     - Port 52521 (TCP): Gigabit File Transfer Sockets
echo     - Port 52522 (TCP): Web Browser App Download & API
echo.
echo   You can now connect any PC via Ethernet cable and open
echo   the download link in Chrome without timeouts!
echo ========================================================
echo.
pause
