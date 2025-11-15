# Agent Builder Desktop - Testing Guide

This document describes how to test the Agent Builder Desktop application.

## Prerequisites

- Node.js 18+
- npm or pnpm

## Installation and Build Test

```bash
cd agent-builder-desktop
npm install
npm run build:electron
npm run build:vite
```

Expected results:
- ✅ All dependencies installed without errors
- ✅ Electron files compiled to `dist-electron/`
- ✅ Vite build completed to `dist/`

## Development Mode Test

To test the application in development mode:

```bash
npm run dev
```

This will:
1. Start Vite dev server on port 5173
2. Launch Electron window with the application
3. Open DevTools automatically

### Manual Testing Checklist

#### File Operations
- [ ] Click "Open" button - file dialog appears
- [ ] Select a JSON file - content loads into form
- [ ] Modify agent configuration
- [ ] Click "Save As" - save dialog appears
- [ ] Save to a new location - file is created
- [ ] Click "Open" again - load the saved file

#### Workspace Operations
- [ ] Create/load an agent configuration
- [ ] Save the file using "Save As"
- [ ] Click "Add to Workspace" - confirmation appears
- [ ] Click "Show Workspace" - workspace panel slides in
- [ ] Verify entry appears in workspace list with:
  - Agent name
  - File path
  - Last opened timestamp
- [ ] Click "Open" on workspace entry - agent loads
- [ ] Click "Remove" on workspace entry - entry is removed
- [ ] Close and reopen app - workspace persists

#### Agent Execution
- [ ] Configure an agent (name, description, model, instructions)
- [ ] Click "Run Agent" - button disables, logs appear
- [ ] Observe run logs showing:
  - `[info]` Agent runner starting message
  - `[info]` Configuration received
  - `[info]` Processing message
  - `[success]` Completion message
  - `[exit]` Exit code
- [ ] Click "Stop Agent" while running - process terminates
- [ ] Verify logs show termination

#### UI/UX
- [ ] Form fields are editable
- [ ] Buttons have hover effects
- [ ] Workspace panel toggles on/off
- [ ] Run logs update in real-time
- [ ] File path displays when file is loaded
- [ ] Empty workspace shows "No workspace entries" message

## Build and Packaging Test

Test creating distributable packages:

```bash
npm run package
```

Expected results:
- ✅ Build completes without errors
- ✅ `release/` directory created
- ✅ Platform-specific installer created (based on your OS)

## Integration Tests

### Workspace Persistence Test

1. Start app, add multiple agents to workspace
2. Close the app completely
3. Check `electron/workspace.json` - should contain entries
4. Restart app
5. Workspace should show all previous entries

### File Format Test

1. Create a test agent JSON file manually:
```json
{
  "name": "Test Agent",
  "description": "A test agent",
  "instructions": "You are a helpful assistant",
  "model": "gpt-4",
  "tools": ["search", "calculator"]
}
```

2. Open the file in the app
3. Verify all fields populate correctly
4. Save to a new location
5. Compare files - should be identical (formatting may differ)

### Error Handling Test

1. Try to open an invalid JSON file - should show error
2. Try to add to workspace without saving - should show alert
3. Try to run agent with empty configuration - should handle gracefully

## Known Limitations

- **Agent Runner**: Currently a placeholder that simulates execution
  - Shows simulated log output
  - Exits after 3 seconds
  - Does not actually execute agents
  - See README.md "Adapting Runtime Paths" for integration instructions

- **Workspace Location**: Uses `electron/workspace.json` in dev
  - Should be moved to `app.getPath('userData')` for production
  - See README.md for migration instructions

## Troubleshooting

### Port 5173 in use
```bash
# Kill process using port 5173
lsof -ti:5173 | xargs kill -9
```

### Electron window doesn't open
- Check console for errors
- Verify all dependencies installed
- Try: `rm -rf node_modules && npm install`

### Build fails
- Ensure TypeScript version is correct
- Check for any syntax errors in source files
- Run `npm run build:electron` and `npm run build:vite` separately

## CI/CD Testing

For automated testing in CI/CD pipelines:

```bash
# Install dependencies
npm ci

# Build check
npm run build:electron
npm run build:vite

# Packaging (platform-specific)
npm run package
```

## Performance Testing

- Application should start within 2-3 seconds
- File operations should be instant (<100ms)
- Workspace should load within 500ms
- UI should be responsive (60fps)

## Security Testing

- Verify `nodeIntegration` is disabled in webPreferences
- Verify `contextIsolation` is enabled
- Verify preload script uses contextBridge
- Check that no sensitive data is logged
- Verify file dialogs restrict to appropriate file types
