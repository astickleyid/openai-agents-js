import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { spawn } from 'child_process';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the app.
  const isDev = process.argv.includes('--dev');
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers.

/**
 * Save agent JSON to a file.
 */
ipcMain.handle('save-agent', async (_event, agentData: string) => {
  try {
    const savePath = path.join(app.getPath('userData'), 'agent.json');
    fs.writeFileSync(savePath, agentData, 'utf-8');
    return { success: true, path: savePath };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

/**
 * Load agent JSON from a file.
 */
ipcMain.handle('load-agent', async () => {
  try {
    const loadPath = path.join(app.getPath('userData'), 'agent.json');
    if (!fs.existsSync(loadPath)) {
      return { success: false, error: 'No saved agent found' };
    }
    const data = fs.readFileSync(loadPath, 'utf-8');
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

/**
 * Run agent by spawning a child process that executes agent-runner.js.
 */
ipcMain.handle('run-agent', async (_event, agentJSON: string) => {
  return new Promise((resolve) => {
    const runnerPath = path.join(__dirname, 'agent-runner.js');

    // Spawn node with agent-runner.js.
    const child = spawn('node', [runnerPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const logs: string[] = [];

    // Write agent JSON to stdin and close.
    child.stdin.write(agentJSON);
    child.stdin.end();

    // Collect stdout (JSON log lines).
    child.stdout.on('data', (data) => {
      const lines = data
        .toString()
        .split('\n')
        .filter((l: string) => l.trim());
      for (const line of lines) {
        logs.push(line);
        // Send log lines to renderer in real-time.
        if (mainWindow) {
          mainWindow.webContents.send('agent-log', line);
        }
      }
    });

    // Collect stderr.
    child.stderr.on('data', (data) => {
      const errLine = data.toString();
      logs.push(`[stderr] ${errLine}`);
      if (mainWindow) {
        mainWindow.webContents.send('agent-log', `[stderr] ${errLine}`);
      }
    });

    // Handle process exit.
    child.on('close', (code) => {
      resolve({
        success: code === 0,
        exitCode: code,
        logs,
      });
    });

    child.on('error', (err) => {
      resolve({
        success: false,
        error: err.message,
        logs,
      });
    });
  });
});
