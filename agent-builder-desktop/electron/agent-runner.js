/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
/**
 * agent-runner.js
 *
 * This Node.js script is spawned as a child process by the Electron main process.
 * It reads agent JSON from stdin, attempts to load a runtime executor from the
 * repository, and executes the agent. If no runtime is found, it falls back to
 * a stub executor that simulates execution.
 *
 * Runtime paths to search (examples):
 * - ./dist/index.js
 * - ./lib/index.js
 * - ./index.js
 * - ./packages/agents/dist/index.js
 * - ./packages/agents-core/dist/index.js
 *
 * The runtime module should export a function like:
 * runAgent(agent, options) where options.emit is a callback for events.
 *
 * Log output: This script emits JSON log lines to stdout.
 */

const fs = require('fs');
const path = require('path');

/**
 * Candidate paths where the runtime executor might be located.
 * Adjust these paths to match your repo's build structure.
 */
const RUNTIME_CANDIDATES = [
  path.join(__dirname, '../../dist/index.js'),
  path.join(__dirname, '../../lib/index.js'),
  path.join(__dirname, '../../index.js'),
  path.join(__dirname, '../../packages/agents/dist/index.js'),
  path.join(__dirname, '../../packages/agents-core/dist/index.js'),
];

/**
 * Emit a JSON log line to stdout.
 */
function emitLog(type, message, data = {}) {
  console.log(
    JSON.stringify({
      type,
      message,
      data,
      timestamp: new Date().toISOString(),
    }),
  );
}

/**
 * Attempt to locate and load the runtime module.
 */
function loadRuntime() {
  for (const candidatePath of RUNTIME_CANDIDATES) {
    if (fs.existsSync(candidatePath)) {
      try {
        const runtime = require(candidatePath);
        emitLog('info', `Loaded runtime from: ${candidatePath}`);
        return runtime;
      } catch (err) {
        emitLog(
          'warn',
          `Failed to load runtime from ${candidatePath}: ${err.message}`,
        );
      }
    }
  }
  emitLog('warn', 'No runtime module found, falling back to stub executor.');
  return null;
}

/**
 * Stub executor: simulates agent execution.
 */
function stubExecutor(agent, options) {
  const { emit } = options;

  emit({ type: 'start', message: 'Starting stub execution...' });

  // Simulate processing steps.
  const steps = agent.steps || [];
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    emit({
      type: 'step',
      message: `Executing step ${i + 1}/${steps.length}: ${step.name || 'Unnamed'}`,
      data: { step, index: i },
    });
  }

  emit({ type: 'complete', message: 'Stub execution completed successfully.' });
}

/**
 * Main entry point.
 */
async function main() {
  emitLog('info', 'Agent runner started.');

  // Read agent JSON from stdin.
  let inputData = '';
  process.stdin.setEncoding('utf-8');
  process.stdin.on('data', (chunk) => {
    inputData += chunk;
  });

  process.stdin.on('end', async () => {
    try {
      const agent = JSON.parse(inputData);
      emitLog('info', 'Agent JSON parsed successfully.', { name: agent.name });

      // Attempt to load runtime.
      const runtime = loadRuntime();

      if (runtime && typeof runtime.runAgent === 'function') {
        // Use the real runtime.
        emitLog('info', 'Using project runtime to execute agent.');
        await runtime.runAgent(agent, {
          emit: (evt) => {
            emitLog('agent-event', 'Event from runtime', evt);
          },
        });
      } else {
        // Fallback to stub.
        emitLog('info', 'Using stub executor.');
        stubExecutor(agent, {
          emit: (evt) => {
            emitLog('agent-event', 'Event from stub executor', evt);
          },
        });
      }

      emitLog('info', 'Agent execution finished.');
      process.exit(0);
    } catch (err) {
      emitLog('error', `Failed to execute agent: ${err.message}`, {
        stack: err.stack,
      });
      process.exit(1);
    }
  });
}

main();
