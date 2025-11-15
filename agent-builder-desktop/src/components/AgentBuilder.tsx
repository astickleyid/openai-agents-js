import React, { useState, useEffect } from 'react';
import './AgentBuilder.css';

interface WorkspaceEntry {
  id: string;
  name: string;
  path: string;
  lastOpened: number;
}

interface AgentConfig {
  name: string;
  description: string;
  instructions: string;
  model: string;
  tools: string[];
}

interface LogEntry {
  type: string;
  message: string;
  config?: any;
  code?: number;
}

declare global {
  interface Window {
    electronAPI: {
      openFile: () => Promise<{ canceled: boolean; filePath?: string; content?: string }>;
      saveFile: (content: string) => Promise<{ canceled: boolean; filePath?: string }>;
      workspaceList: () => Promise<WorkspaceEntry[]>;
      workspaceAdd: (entry: { name: string; path: string; content: string }) => Promise<WorkspaceEntry>;
      workspaceRemove: (id: string) => Promise<boolean>;
      workspaceOpen: (id: string) => Promise<WorkspaceEntry & { content: string }>;
      agentRun: (config: any) => Promise<{ success: boolean }>;
      agentStop: () => Promise<{ success: boolean }>;
      onAgentRunLog: (callback: (log: LogEntry) => void) => void;
      removeAgentRunLogListener: () => void;
    };
  }
}

const AgentBuilder: React.FC = () => {
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
    name: 'My Agent',
    description: 'A helpful AI agent',
    instructions: 'You are a helpful assistant.',
    model: 'gpt-4',
    tools: [],
  });

  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [workspaceEntries, setWorkspaceEntries] = useState<WorkspaceEntry[]>([]);
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [runLogs, setRunLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Load workspace on mount.
  useEffect(() => {
    loadWorkspace();

    // Listen to agent run logs.
    window.electronAPI.onAgentRunLog((log: LogEntry) => {
      setRunLogs(prev => [...prev, log]);
      if (log.type === 'exit') {
        setIsRunning(false);
      }
    });

    return () => {
      window.electronAPI.removeAgentRunLogListener();
    };
  }, []);

  const loadWorkspace = async () => {
    const entries = await window.electronAPI.workspaceList();
    setWorkspaceEntries(entries.sort((a, b) => b.lastOpened - a.lastOpened));
  };

  const handleOpenFile = async () => {
    const result = await window.electronAPI.openFile();
    if (!result.canceled && result.content) {
      try {
        const config = JSON.parse(result.content);
        setAgentConfig(config);
        setCurrentFilePath(result.filePath || null);
      } catch (error) {
        alert('Failed to parse agent configuration file');
      }
    }
  };

  const handleSaveFile = async () => {
    const content = JSON.stringify(agentConfig, null, 2);
    const result = await window.electronAPI.saveFile(content);
    if (!result.canceled && result.filePath) {
      setCurrentFilePath(result.filePath);
      alert(`File saved to ${result.filePath}`);
    }
  };

  const handleAddToWorkspace = async () => {
    if (!currentFilePath) {
      alert('Please save the file first');
      return;
    }

    const content = JSON.stringify(agentConfig, null, 2);
    await window.electronAPI.workspaceAdd({
      name: agentConfig.name,
      path: currentFilePath,
      content,
    });

    await loadWorkspace();
    alert('Added to workspace');
  };

  const handleOpenFromWorkspace = async (id: string) => {
    const entry = await window.electronAPI.workspaceOpen(id);
    try {
      const config = JSON.parse(entry.content);
      setAgentConfig(config);
      setCurrentFilePath(entry.path);
      setShowWorkspace(false);
    } catch (error) {
      alert('Failed to parse agent configuration');
    }
  };

  const handleRemoveFromWorkspace = async (id: string) => {
    await window.electronAPI.workspaceRemove(id);
    await loadWorkspace();
  };

  const handleRunAgent = async () => {
    setRunLogs([]);
    setIsRunning(true);
    await window.electronAPI.agentRun(agentConfig);
  };

  const handleStopAgent = async () => {
    await window.electronAPI.agentStop();
    setIsRunning(false);
  };

  const handleConfigChange = (field: keyof AgentConfig, value: string | string[]) => {
    setAgentConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="agent-builder">
      <div className="toolbar">
        <h1>Agent Builder</h1>
        <div className="toolbar-actions">
          <button onClick={handleOpenFile}>Open</button>
          <button onClick={handleSaveFile}>Save As</button>
          <button onClick={handleAddToWorkspace} disabled={!currentFilePath}>
            Add to Workspace
          </button>
          <button onClick={() => setShowWorkspace(!showWorkspace)}>
            {showWorkspace ? 'Hide Workspace' : 'Show Workspace'}
          </button>
        </div>
      </div>

      <div className="main-content">
        {showWorkspace && (
          <div className="workspace-panel">
            <h2>Workspace</h2>
            {workspaceEntries.length === 0 ? (
              <p className="empty-message">No workspace entries</p>
            ) : (
              <div className="workspace-list">
                {workspaceEntries.map(entry => (
                  <div key={entry.id} className="workspace-entry">
                    <div className="entry-info">
                      <div className="entry-name">{entry.name}</div>
                      <div className="entry-path">{entry.path}</div>
                      <div className="entry-date">
                        {new Date(entry.lastOpened).toLocaleString()}
                      </div>
                    </div>
                    <div className="entry-actions">
                      <button onClick={() => handleOpenFromWorkspace(entry.id)}>Open</button>
                      <button onClick={() => handleRemoveFromWorkspace(entry.id)}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="editor-panel">
          <h2>Agent Configuration</h2>
          {currentFilePath && (
            <div className="current-file">Current file: {currentFilePath}</div>
          )}
          
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              value={agentConfig.name}
              onChange={(e) => handleConfigChange('name', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Description:</label>
            <input
              type="text"
              value={agentConfig.description}
              onChange={(e) => handleConfigChange('description', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Model:</label>
            <input
              type="text"
              value={agentConfig.model}
              onChange={(e) => handleConfigChange('model', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Instructions:</label>
            <textarea
              rows={6}
              value={agentConfig.instructions}
              onChange={(e) => handleConfigChange('instructions', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Tools (comma-separated):</label>
            <input
              type="text"
              value={agentConfig.tools.join(', ')}
              onChange={(e) => handleConfigChange('tools', e.target.value.split(',').map(t => t.trim()))}
            />
          </div>

          <div className="run-section">
            <button 
              onClick={handleRunAgent} 
              disabled={isRunning}
              className="run-button"
            >
              Run Agent
            </button>
            <button 
              onClick={handleStopAgent} 
              disabled={!isRunning}
              className="stop-button"
            >
              Stop Agent
            </button>
          </div>

          {runLogs.length > 0 && (
            <div className="run-logs">
              <h3>Run Logs</h3>
              <div className="log-container">
                {runLogs.map((log, index) => (
                  <div key={index} className={`log-entry log-${log.type}`}>
                    <span className="log-type">[{log.type}]</span>
                    <span className="log-message">{log.message}</span>
                    {log.config && (
                      <pre className="log-config">{JSON.stringify(log.config, null, 2)}</pre>
                    )}
                    {log.code !== undefined && (
                      <span className="log-code"> (exit code: {log.code})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentBuilder;
