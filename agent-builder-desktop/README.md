# Agent Builder Desktop

A desktop application for building and running OpenAI agents, built with Electron, Vite, and React.

## Features

- **File Operations**: Open and save agent configurations as JSON files
- **Workspace Management**: Maintain a list of recent agents for quick access
- **Agent Runner**: Execute agents and monitor their output in real-time
- **Cross-Platform**: Package for macOS, Windows, and Linux

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

```bash
cd agent-builder-desktop
npm install
```

### Development

Run the application in development mode:

```bash
npm run dev
```

This will:
1. Start the Vite development server on port 5173
2. Launch Electron with hot reload enabled
3. Open DevTools automatically for debugging

### Building for Production

Build the application:

```bash
npm run build:vite    # Build the React app
npm run build:electron # Build Electron files
```

### Packaging for Distribution

Create distributable packages:

```bash
npm run package
# or
npm run dist
```

This will create platform-specific installers in the `release/` directory using electron-builder.

**Build targets:**
- macOS: DMG and ZIP
- Windows: NSIS installer and ZIP
- Linux: AppImage and DEB

## Usage

### Creating an Agent

1. Launch the application
2. Fill in the agent configuration:
   - **Name**: A descriptive name for your agent
   - **Description**: What the agent does
   - **Model**: The AI model to use (e.g., `gpt-4`, `gpt-3.5-turbo`)
   - **Instructions**: System prompt for the agent
   - **Tools**: Comma-separated list of tools the agent can use

### Saving and Loading

- **Save As**: Click "Save As" to save the current configuration to a JSON file
- **Open**: Click "Open" to load an existing agent configuration
- **Add to Workspace**: Save the current file and add it to your workspace for quick access

### Workspace

The workspace panel shows your recent agents:
- Click "Show Workspace" to toggle the workspace panel
- Click "Open" on any workspace entry to load that agent
- Click "Remove" to remove an entry from the workspace
- Entries are sorted by last opened time

### Running Agents

1. Configure your agent
2. Click "Run Agent" to execute it
3. Monitor the output in the Run Logs section
4. Click "Stop Agent" to terminate execution

**Note**: The agent runner is currently a placeholder that simulates execution. See "Adapting Runtime Paths" below to connect it to a real agent runtime.

## Configuration

### Workspace Metadata

Workspace metadata is stored in `electron/workspace.json` during development. An initial empty workspace file is included in the repository and will be auto-populated as you add agents to your workspace.

**For production**, you should move this to the user's application data directory:
- macOS: `~/Library/Application Support/Agent Builder/workspace.json`
- Windows: `%APPDATA%/Agent Builder/workspace.json`
- Linux: `~/.config/agent-builder/workspace.json`

To implement this, update `electron/main.ts`:

```typescript
import { app } from 'electron';
const WORKSPACE_FILE = path.join(app.getPath('userData'), 'workspace.json');
```

### Adapting Runtime Paths

The agent runner (`electron/agent-runner.js`) needs to be configured to point to your actual agent runtime.

**Current placeholder paths** in `agent-runner.js`:
```javascript
const runtimeCandidates = [
  './packages/agents-core/dist/index.js',
  './packages/agents-openai/dist/index.js',
  './node_modules/@openai/agents/dist/index.js',
];
```

**To adapt for production:**

1. Bundle the runtime with your application or install it as a dependency
2. Update the `runtimeCandidates` array to point to the correct paths
3. Ensure the `cwd` in `main.ts` is set correctly when spawning the runner

Example for bundled runtime:
```javascript
const runtimePath = path.join(process.resourcesPath, 'app', 'runtime', 'agent.js');
```

### Auto-Update (Placeholder)

Auto-update functionality is commented out in `electron/main.ts`. To enable:

1. Set up a release server compatible with electron-updater
2. Configure the `publish` section in `package.json`:
```json
"build": {
  "publish": {
    "provider": "github",
    "owner": "your-username",
    "repo": "your-repo"
  }
}
```
3. Uncomment and configure the auto-updater in `main.ts`

## Project Structure

```
agent-builder-desktop/
├── electron/
│   ├── main.ts              # Electron main process
│   ├── preload.ts           # Preload script for IPC
│   ├── agent-runner.js      # Agent execution script
│   └── workspace.json       # Workspace metadata (gitignored)
├── src/
│   ├── components/
│   │   ├── AgentBuilder.tsx # Main UI component
│   │   └── AgentBuilder.css # Component styles
│   ├── App.tsx              # Root component
│   ├── App.css              # App styles
│   ├── main.tsx             # React entry point
│   └── index.css            # Global styles
├── dist/                    # Built React app (gitignored)
├── dist-electron/           # Built Electron files (gitignored)
├── release/                 # Packaged distributables (gitignored)
├── index.html               # HTML template
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript config (React)
├── tsconfig.electron.json   # TypeScript config (Electron)
├── tsconfig.node.json       # TypeScript config (Vite)
├── package.json             # Dependencies and scripts
└── README.md                # This file
```

## Testing Steps

1. **Install dependencies**:
   ```bash
   cd agent-builder-desktop
   npm install
   ```

2. **Run in development mode**:
   ```bash
   npm run dev
   ```

3. **Test file operations**:
   - Create a new agent configuration
   - Click "Save As" and save to a location
   - Click "Open" and load the saved file

4. **Test workspace**:
   - Save an agent configuration
   - Click "Add to Workspace"
   - Click "Show Workspace" to view entries
   - Open an entry from the workspace
   - Remove an entry

5. **Test agent execution**:
   - Configure an agent
   - Click "Run Agent"
   - Observe the logs streaming in the Run Logs section
   - Click "Stop Agent" to terminate

6. **Test packaging** (optional):
   ```bash
   npm run package
   ```
   - Check the `release/` directory for built packages

## Troubleshooting

### Port 5173 already in use

If you see an error about port 5173 being in use, either:
- Kill the process using that port
- Change the port in `vite.config.ts`

### Electron window doesn't open

- Check the console for errors
- Ensure all dependencies are installed
- Try deleting `node_modules` and reinstalling

### Agent runner doesn't work

The current runner is a placeholder. Follow the "Adapting Runtime Paths" section to connect to a real runtime.

### Workspace not persisting

Check that `electron/workspace.json` exists and has write permissions. For production, move to `app.getPath('userData')`.

## License

This project is part of the OpenAI Agents JS repository.

## Contributing

Contributions are welcome! Please follow the repository's contribution guidelines.
