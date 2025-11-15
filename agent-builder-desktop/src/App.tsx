import { useState, useEffect } from 'react';
import AgentBuilder from './components/AgentBuilder';

// TypeScript declaration for electron API.
declare global {
  interface Window {
    electronAPI: {
      saveAgent: (
        agentData: string,
      ) => Promise<{ success: boolean; path?: string; error?: string }>;
      loadAgent: () => Promise<{
        success: boolean;
        data?: string;
        error?: string;
      }>;
      runAgent: (agentJSON: string) => Promise<{
        success: boolean;
        exitCode?: number;
        logs?: string[];
        error?: string;
      }>;
      onAgentLog: (callback: (log: string) => void) => void;
    };
  }
}

function App() {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Listen for agent logs from main process.
    if (window.electronAPI) {
      window.electronAPI.onAgentLog((log: string) => {
        setLogs((prev) => [...prev, log]);
      });
    }
  }, []);

  const handleRun = async (agentJSON: string) => {
    setLogs([]); // Clear previous logs.
    if (window.electronAPI) {
      const result = await window.electronAPI.runAgent(agentJSON);
      if (!result.success) {
        setLogs((prev) => [
          ...prev,
          `Error: ${result.error || 'Unknown error'}`,
        ]);
      }
    } else {
      setLogs(['Error: Electron API not available']);
    }
  };

  const handleSave = async (agentJSON: string) => {
    if (window.electronAPI) {
      const result = await window.electronAPI.saveAgent(agentJSON);
      if (result.success) {
        alert(`Agent saved to: ${result.path}`);
      } else {
        alert(`Failed to save agent: ${result.error}`);
      }
    }
  };

  const handleLoad = async (): Promise<string | null> => {
    if (window.electronAPI) {
      const result = await window.electronAPI.loadAgent();
      if (result.success && result.data) {
        return result.data;
      } else {
        alert(`Failed to load agent: ${result.error}`);
      }
    }
    return null;
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Agent Builder Desktop</h1>
      </header>
      <div className="main-content">
        <div className="builder-panel">
          <AgentBuilder
            onRun={handleRun}
            onSave={handleSave}
            onLoad={handleLoad}
          />
        </div>
        <div className="log-panel">
          <div className="log-panel-header">Run Log</div>
          <div className="log-panel-content">
            {logs.length === 0 ? (
              <div className="empty-state">
                No logs yet. Click "Run Agent" to see output.
              </div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="log-line">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
