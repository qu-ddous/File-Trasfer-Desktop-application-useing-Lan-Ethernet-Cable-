import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

export class BackendManager {
  private process: ChildProcess | null = null;
  private apiPort: number = 52522;

  constructor(port: number = 52522) {
    this.apiPort = port;
  }

  public start(): Promise<boolean> {
    return new Promise((resolve) => {
      const isPackaged = app.isPackaged;
      let pythonExecutable: string;
      let scriptOrBin: string;
      let args: string[] = [];

      // Check paths for packaged vs dev
      const packagedBinary = path.join(process.resourcesPath, 'backend', 'run.exe');
      const devBinary = path.join(app.getAppPath(), '..', 'backend-dist', 'run.exe');
      const scriptPath = path.join(__dirname, '..', '..', 'backend', 'run.py');

      if (fs.existsSync(packagedBinary)) {
        scriptOrBin = packagedBinary;
        pythonExecutable = scriptOrBin;
      } else if (fs.existsSync(devBinary)) {
        scriptOrBin = devBinary;
        pythonExecutable = scriptOrBin;
      } else {
        pythonExecutable = process.platform === 'win32' ? 'python' : 'python3';
        scriptOrBin = scriptPath;
        args = [scriptOrBin];
      }

      console.log(`[BackendManager] Starting backend from: ${scriptOrBin}`);

      const env = {
        ...process.env,
        LANSHARE_API_PORT: this.apiPort.toString(),
        PYTHONUNBUFFERED: '1'
      };

      try {
        if (scriptOrBin.endsWith('.exe')) {
          this.process = spawn(scriptOrBin, [], { env, detached: false });
        } else {
          this.process = spawn(pythonExecutable, args, { env, detached: false });
        }

        this.process.stdout?.on('data', (data) => {
          console.log(`[Python Backend]: ${data.toString().trim()}`);
        });

        this.process.stderr?.on('data', (data) => {
          console.error(`[Python Backend ERR]: ${data.toString().trim()}`);
        });

        this.process.on('close', (code) => {
          console.log(`[BackendManager] Backend closed with code ${code}`);
          this.process = null;
        });

        // Resolve after brief buffer to allow server to spin up
        setTimeout(() => resolve(true), 1500);
      } catch (err) {
        console.error('[BackendManager] Failed to spawn backend:', err);
        resolve(false);
      }
    });
  }

  public stop() {
    if (this.process) {
      console.log('[BackendManager] Terminating backend process...');
      this.process.kill();
      this.process = null;
    }
  }
}
