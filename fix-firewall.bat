@echo off
:: WireDrop Windows Firewall 1-Click Enabler
echo ========================================================
echo   WireDrop - Windows Defender Firewall Configuration
echo ========================================================
echo.
echo Requesting administrator permissions...

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Please right-click this file and select "Run as administrator".
    echo.
    pause
    exit /b 1
)

echo Adding Windows Firewall rules for WireDrop Gigabit sockets...

:: Allow Port 52521 TCP (File Transfer Streaming)
netsh advfirewall firewall delete rule name="WireDrop Transfer TCP 52521" >nul 2>&1
netsh advfirewall firewall add rule name="WireDrop Transfer TCP 52521" dir=in action=allow protocol=TCP localport=52521 profile=any

:: Allow Port 52520 UDP (Auto Discovery Beacon)
netsh advfirewall firewall delete rule name="WireDrop Discovery UDP 52520" >nul 2>&1
netsh advfirewall firewall add rule name="WireDrop Discovery UDP 52520" dir=in action=allow protocol=UDP localport=52520 profile=any

:: Allow Port 52522 TCP (Local API)
netsh advfirewall firewall delete rule name="WireDrop API TCP 52522" >nul 2>&1
netsh advfirewall firewall add rule name="WireDrop API TCP 52522" dir=in action=allow protocol=TCP localport=52522 profile=any

echo.
echo ========================================================
echo   SUCCESS: Ports 52520 and 52521 are now ALLOWED in
echo   Windows Firewall across all networks (Public & Private)!
echo ========================================================
echo.
pause
