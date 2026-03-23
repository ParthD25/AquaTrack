@echo off
:: MASTER WSL REMOVAL SCRIPT (Aggressive Version)
:: MUST BE RUN AS ADMINISTRATOR.

echo ----------------------------------------------------
echo STEP 1: Killing WSL related processes...
taskkill /f /im wsl.exe /t 2>nul
taskkill /f /im wslservice.exe /t 2>nul
taskkill /f /im wslhost.exe /t 2>nul

echo ----------------------------------------------------
echo STEP 2: Disabling WSL Registry Triggers...
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "WSLUpdate" /f 2>nul
reg delete "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "WSLUpdate" /f 2>nul

echo ----------------------------------------------------
echo STEP 3: Disabling Windows Features...
dism.exe /online /disable-feature /featurename:Microsoft-Windows-Subsystem-Linux /norestart
dism.exe /online /disable-feature /featurename:VirtualMachinePlatform /norestart

echo ----------------------------------------------------
echo STEP 4: Deleting/Renaming wsl.exe stub...
set "WSL_PATH=C:\Windows\System32\wsl.exe"
takeown /f "%WSL_PATH%" /a
icacls "%WSL_PATH%" /grant administrators:F
echo Attempting to delete %WSL_PATH%...
del /f /q "%WSL_PATH%"
if exist "%WSL_PATH%" (
    echo [!] Delete failed, attempting to RENAME to %WSL_PATH%.old...
    move /y "%WSL_PATH%" "%WSL_PATH%.old"
)

echo ----------------------------------------------------
echo STEP 5: Cleaning AppData Packages...
powershell "ls $env:LOCALAPPDATA\Packages | Where-Object { $_.Name -like 'CanonicalGroupLimited*' -or $_.Name -like '*Debian*' -or $_.Name -like '*Kali*' } | Remove-Item -Recurse -Force"

echo ----------------------------------------------------
echo DONE. Please RESTART your computer now.
echo If the prompt appears again, it may be triggered by a specific IDE plugin.
pause
