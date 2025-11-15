import { contextBridge, ipcRenderer } from 'electron';

/**
 * Expose safe APIs to the renderer process.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  saveAgent: (agentData: string) => ipcRenderer.invoke('save-agent', agentData),
  loadAgent: () => ipcRenderer.invoke('load-agent'),
  runAgent: (agentJSON: string) => ipcRenderer.invoke('run-agent', agentJSON),
  onAgentLog: (callback: (log: string) => void) => {
    ipcRenderer.on('agent-log', (_event, log) => callback(log));
  },
});
