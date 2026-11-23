# Building Windows Distributable for LANShare

## Prerequisites
1. **Node.js 18+** with `npm`
2. **Python 3.11+**
3. **PyInstaller** (`pip install pyinstaller`)

## Packaging Sequence

### Step 1: Package Python Backend
Compile the Python backend into a standalone binary:
```powershell
cd backend
pyinstaller --clean --noconfirm --onedir --name run --add-data "app;app" run.py
```
This produces `backend/dist/run/run.exe`. Copy or symlink to `backend-dist`:
```powershell
New-Item -ItemType Directory -Force -Path ..\backend-dist
Copy-Item -Recurse -Force dist\run\* ..\backend-dist\
cd ..
```

### Step 2: Build React Frontend and Electron Main
```powershell
npm run build
npm run build:electron
```

### Step 3: Package with Electron Builder
```powershell
npm run dist
```
This generates the Windows setup executable:
`release/LANShare Setup 1.0.0.exe`
