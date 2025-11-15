import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use.
// the ipcRenderer without exposing the entire object.
contextBridge.exposeInMainWorld('electronAPI', {
  // File dialogs.
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (content: string) => ipcRenderer.invoke('dialog:saveFile', content),

  // Workspace operations.
  workspaceList: () => ipcRenderer.invoke('workspace:list'),
  workspaceAdd: (entry: { name: string; path: string; content: string }) => 
    ipcRenderer.invoke('workspace:add', entry),
  workspaceRemove: (id: string) => ipcRenderer.invoke('workspace:remove', id),
  workspaceOpen: (id: string) => ipcRenderer.invoke('workspace:open', id),

  // Agent operations.
  agentRun: (agentConfig: any) => ipcRenderer.invoke('agent:run', agentConfig),
  agentStop: () => ipcRenderer.invoke('agent:stop'),
  
  // Listen to agent run logs.
  onAgentRunLog: (callback: (log: any) => void) => {
    ipcRenderer.on('agent:run-log', (_event, log) => callback(log));
  },
  
  // Remove listener.
  removeAgentRunLogListener: () => {
    ipcRenderer.removeAllListeners('agent:run-log');
  }
});
