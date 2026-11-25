@echo off
:: WireDrop 1-Click Ethernet IP Setup
echo ========================================================
echo   WireDrop - High-Speed Ethernet Cable IP Setup
echo ========================================================
echo.
echo Checking administrator permissions...

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Please right-click this file and select "Run as administrator".
    echo.
    pause
    exit /b 1
)

echo.
echo Choose configuration for this computer:
echo [1] Setup as Computer A (IP: 192.168.123.1)
echo [2] Setup as Computer B (IP: 192.168.123.2)
echo [3] Revert Ethernet back to Automatic (DHCP)
echo [4] Check current Ethernet Status
echo.
set /p choice="Enter choice [1-4]: "

if "%choice%"=="1" (
    echo.
    echo Configuring Ethernet adapter with IP 192.168.123.1...
    netsh interface ip set address name="Ethernet" static 192.168.123.1 255.255.255.0 none
    echo SUCCESS: Computer A is set to 192.168.123.1!
    echo On the other computer, run this script and choose [2].
) else if "%choice%"=="2" (
    echo.
    echo Configuring Ethernet adapter with IP 192.168.123.2...
    netsh interface ip set address name="Ethernet" static 192.168.123.2 255.255.255.0 none
    echo SUCCESS: Computer B is set to 192.168.123.2!
    echo On the other computer, make sure it is set to [1] (192.168.123.1).
) else if "%choice%"=="3" (
    echo.
    echo Reverting Ethernet to DHCP (Automatic)...
    netsh interface ip set address name="Ethernet" dhcp
    echo SUCCESS: Ethernet reset to automatic DHCP.
) else if "%choice%"=="4" (
    echo.
    netsh interface ipv4 show config name="Ethernet"
) else (
    echo Invalid choice.
)

echo.
echo Verifying Ethernet link...
ipconfig | findstr /i "Ethernet"
echo.
pause
