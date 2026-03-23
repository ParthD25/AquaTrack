@echo off
:: This script takes ownership of wsl.exe files and deletes them.
:: MUST BE RUN AS ADMINISTRATOR.

set "WSL_PATH1=C:\Windows\System32\wsl.exe"
set "WSL_PATH2=C:\Windows\WinSxS\amd64_microsoft-windows-lxss-wsl_31bf3856ad364e35_10.0.26100.7309_none_1eba71e67edf962a\wsl.exe"

echo Killing any processes using wsl.exe...
taskkill /f /im wsl.exe /t 2>nul
taskkill /f /im wslservice.exe /t 2>nul

echo Taking ownership of %WSL_PATH1%...
takeown /f "%WSL_PATH1%" /a
icacls "%WSL_PATH1%" /grant administrators:F
echo Deleting %WSL_PATH1%...
del /f /q "%WSL_PATH1%"
if exist "%WSL_PATH1%" (
    echo [ERROR] Could not delete %WSL_PATH1%. Try running in Safe Mode or checking if an IDE is locked onto it.
) else (
    echo [SUCCESS] Deleted %WSL_PATH1%.
)

echo Taking ownership of %WSL_PATH2%...
takeown /f "%WSL_PATH2%" /a
icacls "%WSL_PATH2%" /grant administrators:F
echo Deleting %WSL_PATH2%...
del /f /q "%WSL_PATH2%"
if exist "%WSL_PATH2%" (
    echo [ERROR] Could not delete %WSL_PATH2%.
) else (
    echo [SUCCESS] Deleted %WSL_PATH2%.
)

echo.
echo Operation complete.
pause
