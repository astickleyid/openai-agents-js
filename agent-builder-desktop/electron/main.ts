import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import { spawn, ChildProcess } from 'child_process';

let mainWindow: BrowserWindow | null = null;
let agentProcess: ChildProcess | null = null;
const WORKSPACE_FILE = path.join(__dirname, '..', 'electron', 'workspace.json');

interface WorkspaceEntry {
  id: string;
  name: string;
  path: string;
  lastOpened: number;
}

interface Workspace {
  entries: WorkspaceEntry[];
}

// Load workspace metadata.
async function loadWorkspace(): Promise<Workspace> {
  try {
    const data = await fs.readFile(WORKSPACE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { entries: [] };
  }
}

// Save workspace metadata.
async function saveWorkspace(workspace: Workspace): Promise<void> {
  await fs.writeFile(WORKSPACE_FILE, JSON.stringify(workspace, null, 2), 'utf-8');
}

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

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    if (agentProcess) {
      agentProcess.kill();
    }
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

// Open file dialog.
ipcMain.handle('dialog:openFile', async () => {
  if (!mainWindow) return { canceled: true };
  
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true };
  }

  const filePath = result.filePaths[0];
  const content = await fs.readFile(filePath, 'utf-8');
  return { canceled: false, filePath, content };
});

// Save file dialog.
ipcMain.handle('dialog:saveFile', async (_event, content: string) => {
  if (!mainWindow) return { canceled: true };

  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    defaultPath: 'agent.json'
  });

  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }

  await fs.writeFile(result.filePath, content, 'utf-8');
  return { canceled: false, filePath: result.filePath };
});

// Workspace: list entries.
ipcMain.handle('workspace:list', async () => {
  const workspace = await loadWorkspace();
  return workspace.entries;
});

// Workspace: add entry.
ipcMain.handle('workspace:add', async (_event, entry: { name: string; path: string; content: string }) => {
  const workspace = await loadWorkspace();
  
  // Check if entry already exists.
  const existingIndex = workspace.entries.findIndex(e => e.path === entry.path);
  
  const workspaceEntry: WorkspaceEntry = {
    id: Date.now().toString(),
    name: entry.name,
    path: entry.path,
    lastOpened: Date.now()
  };

  if (existingIndex >= 0) {
    workspace.entries[existingIndex] = workspaceEntry;
  } else {
    workspace.entries.push(workspaceEntry);
  }

  await saveWorkspace(workspace);
  return workspaceEntry;
});

// Workspace: remove entry.
ipcMain.handle('workspace:remove', async (_event, id: string) => {
  const workspace = await loadWorkspace();
  workspace.entries = workspace.entries.filter(e => e.id !== id);
  await saveWorkspace(workspace);
  return true;
});

// Workspace: open entry.
ipcMain.handle('workspace:open', async (_event, id: string) => {
  const workspace = await loadWorkspace();
  const entry = workspace.entries.find(e => e.id === id);
  
  if (!entry) {
    throw new Error('Entry not found');
  }

  const content = await fs.readFile(entry.path, 'utf-8');
  
  // Update last opened time.
  entry.lastOpened = Date.now();
  await saveWorkspace(workspace);

  return { ...entry, content };
});

// Run agent.
ipcMain.handle('agent:run', async (_event, agentConfig: any) => {
  // Kill existing process if running.
  if (agentProcess) {
    agentProcess.kill();
    agentProcess = null;
  }

  // Spawn agent-runner.js.
  const runnerPath = path.join(__dirname, '..', 'electron', 'agent-runner.js');
  const repoRoot = path.join(__dirname, '..', '..');
  
  agentProcess = spawn(process.execPath, [runnerPath], {
    cwd: repoRoot,
    env: {
      ...process.env,
      AGENT_CONFIG: JSON.stringify(agentConfig)
    }
  });

  // Stream stdout.
  agentProcess.stdout?.on('data', (data) => {
    const lines = data.toString().split('\n').filter((line: string) => line.trim());
    lines.forEach((line: string) => {
      try {
        const logEntry = JSON.parse(line);
        mainWindow?.webContents.send('agent:run-log', logEntry);
      } catch (e) {
        mainWindow?.webContents.send('agent:run-log', { type: 'stdout', message: line });
      }
    });
  });

  // Stream stderr.
  agentProcess.stderr?.on('data', (data) => {
    mainWindow?.webContents.send('agent:run-log', { type: 'error', message: data.toString() });
  });

  // Handle exit.
  agentProcess.on('exit', (code) => {
    mainWindow?.webContents.send('agent:run-log', { type: 'exit', code });
    agentProcess = null;
  });

  return { success: true };
});

// Stop agent.
ipcMain.handle('agent:stop', async () => {
  if (agentProcess) {
    agentProcess.kill();
    agentProcess = null;
    return { success: true };
  }
  return { success: false };
});

// Placeholder for auto-update (to be implemented).
// app.on('ready', () => {
//   autoUpdater.checkForUpdatesAndNotify();
// });
