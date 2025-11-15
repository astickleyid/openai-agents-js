import React, { useState } from 'react';

interface Step {
  name: string;
  description: string;
  enabled: boolean;
}

interface Agent {
  name: string;
  description: string;
  steps: Step[];
}

interface AgentBuilderProps {
  onRun: (agentJSON: string) => void;
  onSave: (agentJSON: string) => void;
  onLoad: () => Promise<string | null>;
}

const AgentBuilder: React.FC<AgentBuilderProps> = ({
  onRun,
  onSave,
  onLoad,
}) => {
  const [agent, setAgent] = useState<Agent>({
    name: 'My Agent',
    description: 'A sample agent',
    steps: [],
  });

  const handleAddStep = () => {
    setAgent({
      ...agent,
      steps: [
        ...agent.steps,
        {
          name: `Step ${agent.steps.length + 1}`,
          description: '',
          enabled: true,
        },
      ],
    });
  };

  const handleRemoveStep = (index: number) => {
    setAgent({
      ...agent,
      steps: agent.steps.filter((_, i) => i !== index),
    });
  };

  const handleToggleStep = (index: number) => {
    const newSteps = [...agent.steps];
    newSteps[index].enabled = !newSteps[index].enabled;
    setAgent({ ...agent, steps: newSteps });
  };

  const handleStepChange = (
    index: number,
    field: 'name' | 'description',
    value: string,
  ) => {
    const newSteps = [...agent.steps];
    newSteps[index][field] = value;
    setAgent({ ...agent, steps: newSteps });
  };

  const handleRun = () => {
    const agentJSON = JSON.stringify(agent, null, 2);
    onRun(agentJSON);
  };

  const handleSave = () => {
    const agentJSON = JSON.stringify(agent, null, 2);
    onSave(agentJSON);
  };

  const handleLoad = async () => {
    const data = await onLoad();
    if (data) {
      try {
        const loadedAgent = JSON.parse(data);
        setAgent(loadedAgent);
      } catch (_err) {
        alert('Failed to parse loaded agent JSON');
      }
    }
  };

  const handleExport = () => {
    const agentJSON = JSON.stringify(agent, null, 2);
    const blob = new Blob([agentJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agent.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="agent-form">
      <div className="form-group">
        <label htmlFor="agent-name">Agent Name</label>
        <input
          id="agent-name"
          type="text"
          value={agent.name}
          onChange={(e) => setAgent({ ...agent, name: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label htmlFor="agent-description">Agent Description</label>
        <textarea
          id="agent-description"
          value={agent.description}
          onChange={(e) => setAgent({ ...agent, description: e.target.value })}
        />
      </div>

      <div className="steps-section">
        <div className="steps-header">
          <h3>Steps</h3>
          <button className="button button-primary" onClick={handleAddStep}>
            Add Step
          </button>
        </div>

        {agent.steps.length === 0 ? (
          <div className="empty-state">
            No steps yet. Click "Add Step" to get started.
          </div>
        ) : (
          agent.steps.map((step, index) => (
            <div key={index} className="step-item">
              <div className="step-header">
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    checked={step.enabled}
                    onChange={() => handleToggleStep(index)}
                  />
                  <span className="step-title">
                    Step {index + 1}: {step.name}
                  </span>
                </div>
                <div className="step-actions">
                  <button
                    className="button button-danger button-small"
                    onClick={() => handleRemoveStep(index)}
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor={`step-name-${index}`}>Step Name</label>
                <input
                  id={`step-name-${index}`}
                  type="text"
                  value={step.name}
                  onChange={(e) =>
                    handleStepChange(index, 'name', e.target.value)
                  }
                />
              </div>

              <div className="form-group">
                <label htmlFor={`step-description-${index}`}>
                  Step Description
                </label>
                <textarea
                  id={`step-description-${index}`}
                  value={step.description}
                  onChange={(e) =>
                    handleStepChange(index, 'description', e.target.value)
                  }
                />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="actions-bar">
        <button className="button button-success" onClick={handleRun}>
          Run Agent
        </button>
        <button className="button button-primary" onClick={handleSave}>
          Save
        </button>
        <button className="button button-secondary" onClick={handleLoad}>
          Load
        </button>
        <button className="button button-secondary" onClick={handleExport}>
          Export JSON
        </button>
      </div>
    </div>
  );
};

export default AgentBuilder;
