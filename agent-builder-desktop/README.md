# Agent Builder Desktop

A lightweight Electron + Vite + React desktop playground for visually composing and running agents.

## Features

- **Visual Agent Builder**: Add, remove, and toggle steps with a user-friendly interface
- **Edit Agent Metadata**: Update agent name and description
- **Run Agents**: Execute agents via a child process that streams logs back to the UI
- **Save/Load**: Persist agents locally for future editing
- **Export JSON**: Download agent configuration as JSON

## Architecture

The desktop app uses:

- **Electron**: Desktop application framework
- **React**: UI components
- **Vite**: Fast development and build tooling
- **TypeScript**: Type-safe code

### How Agent Execution Works

When you click "Run Agent":

1. The React renderer sends the agent JSON to the Electron main process via IPC
2. The main process spawns a child Node.js process running `electron/agent-runner.js`
3. The runner receives the agent JSON via stdin
4. The runner attempts to load a runtime executor from the repository (see Runtime Paths below)
5. If found, the runtime executes the agent and streams events back
6. If not found, a stub executor simulates execution
7. Log lines are streamed back to the renderer in real-time

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
cd agent-builder-desktop
npm install
```

### Development

Run the app in development mode with two terminal windows:

**Terminal 1** - Start the Vite dev server:

```bash
npm run dev
```

**Terminal 2** - Start Electron (after Vite is running):

```bash
electron dist-electron/main.js --dev
```

This will:

1. Start the Vite dev server on http://localhost:5173
2. Launch Electron pointing to the dev server
3. Enable hot-reload for React components
4. Open DevTools automatically

### Building

Build the app for production:

```bash
npm run build
```

This compiles TypeScript and bundles the React app.

### Testing the App

1. Build the Electron main process: `npm run build`
2. In one terminal, start Vite: `npm run dev`
3. In another terminal, start Electron: `electron dist-electron/main.js --dev`
4. Use the UI to:
   - Update the agent name and description
   - Add steps by clicking "Add Step"
   - Edit step names and descriptions
   - Toggle steps on/off with checkboxes
   - Remove steps with the "Remove" button
5. Click "Run Agent" to execute
6. Watch the "Run Log" panel on the right for streamed output
7. Use "Save" to persist the agent, "Load" to restore it, or "Export JSON" to download

## Integrating with Your Agent Runtime

The agent runner (`electron/agent-runner.js`) searches for a runtime module at several candidate paths:

- `./dist/index.js`
- `./lib/index.js`
- `./index.js`
- `./packages/agents/dist/index.js`
- `./packages/agents-core/dist/index.js`

### Runtime Module Requirements

Your runtime module should export a `runAgent` function:

```javascript
module.exports = {
  runAgent: async (agent, options) => {
    const { emit } = options;

    // Execute the agent.
    emit({ type: 'start', message: 'Starting execution...' });
    // ... your logic here ...
    emit({ type: 'complete', message: 'Execution complete.' });
  },
};
```

### Customizing Runtime Paths

Edit `electron/agent-runner.js` and update the `RUNTIME_CANDIDATES` array to match your repository's build structure.

### Using a CLI Instead

If you prefer to run a CLI command instead of requiring a module directly, modify the runner to spawn your CLI with the agent JSON as an argument or stdin.

## Folder Structure

```
agent-builder-desktop/
├── electron/
│   ├── main.ts              # Electron main process (IPC, child process spawning)
│   ├── preload.ts           # Preload script (exposes safe APIs to renderer)
│   └── agent-runner.js      # Child process script for running agents
├── src/
│   ├── components/
│   │   └── AgentBuilder.tsx # React component for building agents
│   ├── App.tsx              # Main React app component
│   ├── main.tsx             # React entry point
│   └── styles.css           # Global styles
├── index.html               # HTML template
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript config for React
├── tsconfig.electron.json   # TypeScript config for Electron
├── vite.config.ts           # Vite configuration
└── README.md                # This file
```

## Notes

- The app stores saved agents in Electron's user data directory
- Logs are displayed in real-time in the "Run Log" panel
- If no runtime is found, the stub executor simulates execution so you can test the UI immediately

## Troubleshooting

**Issue**: Electron window doesn't open

- Make sure all dependencies are installed: `npm install`
- Check that port 5173 is available for Vite dev server

**Issue**: Agent execution fails

- Verify the runtime paths in `electron/agent-runner.js`
- Check the Run Log panel for error messages
- Ensure your runtime module exports a `runAgent` function

**Issue**: Logs aren't streaming

- Check the browser console for errors
- Verify IPC communication is working between main and renderer

## License

Same as the parent repository.
