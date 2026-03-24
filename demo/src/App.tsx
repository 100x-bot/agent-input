import { useState, useRef } from 'react';
import { AgentInputProvider, AgentStatusBar } from '@100xbot/agent-input';
import type { AgentStatus, AgentStatusBarRef } from '@100xbot/agent-input';
import { createMockConfig } from './mockConfig';

const mockConfig = createMockConfig();

const presetStates: Record<string, AgentStatus> = {
  idle: {
    state: 'idle',
  },
  working: {
    state: 'working',
    operation: 'Analyzing page content',
    progress: 65,
    canCancel: true,
    details: {
      model: 'claude-sonnet-4-6',
      streaming: true,
      step: 3,
      totalSteps: 5,
    },
    currentTool: 'extract_content',
    toolDuration: 2400,
    duration: 8500,
  },
  workingSubtask: {
    state: 'working',
    operation: 'Running sub-task',
    progress: 30,
    canCancel: true,
    subtaskTitle: 'Extracting table data',
    subtaskId: 'subtask-1',
    details: {
      model: 'claude-haiku-4-5',
      iteration: 2,
      maxIterations: 5,
    },
    duration: 3200,
  },
  error: {
    state: 'error',
    error: 'Rate limit exceeded. Please try again in a few seconds.',
    operation: 'Generating response',
  },
  waiting: {
    state: 'waiting_for_human',
    operation: 'Waiting for your confirmation to proceed',
  },
};

type PresetKey = keyof typeof presetStates;

export default function App() {
  const [activePreset, setActivePreset] = useState<PresetKey>('idle');
  const statusBarRef = useRef<AgentStatusBarRef>(null);

  const status = presetStates[activePreset];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                @100xbot/agent-input
              </h1>
              <p className="text-gray-500 mt-1">
                AI agent chat input bar for React — mentions, speech, file upload, workflows
              </p>
            </div>
            <div className="flex gap-3">
              <a
                href="https://www.npmjs.com/package/@100xbot/agent-input"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 rounded-md bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 transition-colors"
              >
                npm
              </a>
              <a
                href="https://github.com/100x-bot/agent-input"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 rounded-md bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* State toggle */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Component State</h2>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(presetStates) as PresetKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setActivePreset(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activePreset === key
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {key === 'workingSubtask' ? 'Working (subtask)' : key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
        </section>

        {/* Live demo */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Live Demo</h2>
          <p className="text-sm text-gray-500 mb-4">
            Type in the input below. Use <code className="bg-gray-200 px-1 rounded">@</code> to trigger mention suggestions for tabs, files, and workflows.
          </p>
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <AgentInputProvider config={mockConfig}>
              <AgentStatusBar
                ref={statusBarRef}
                status={status}
                sessionId="demo-session"
                initialValue=""
                onCancel={() => {
                  console.log('[Demo] Cancel clicked');
                  setActivePreset('idle');
                }}
                onSendMessage={(message, refs) => {
                  console.log('[Demo] Message sent:', message, refs);
                  setActivePreset('working');
                  setTimeout(() => setActivePreset('idle'), 3000);
                }}
                hasMessages={true}
                showInput={true}
                placeholder="Ask the agent anything..."
                availableWorkflows={['Summarize Page', 'Generate Tests', 'Translate Content']}
              />
            </AgentInputProvider>
          </div>
        </section>

        {/* Install instructions */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Quick Start</h2>
          <div className="bg-gray-900 rounded-xl p-5 overflow-x-auto">
            <pre className="text-green-400 text-sm font-mono">
{`npm install @100xbot/agent-input

# Peer dependencies
npm install react react-dom lucide-react framer-motion`}
            </pre>
          </div>
          <div className="bg-gray-900 rounded-xl p-5 mt-3 overflow-x-auto">
            <pre className="text-gray-300 text-sm font-mono">
{`import { AgentInputProvider, AgentStatusBar } from '@100xbot/agent-input';
import type { AgentInputConfig, AgentStatus } from '@100xbot/agent-input';

const config: AgentInputConfig = {
  sendMessage: async (msg) => { /* your send logic */ },
  mentions: { /* mention handlers */ },
  extractReferences: (text) => [],
  parseReferences: (text) => ({
    references: [],
    segments: [{ type: 'text', content: text }],
  }),
};

function App() {
  const [status, setStatus] = useState<AgentStatus>({ state: 'idle' });

  return (
    <AgentInputProvider config={config}>
      <AgentStatusBar
        status={status}
        sessionId="my-session"
        initialValue=""
        onSendMessage={(msg, refs) => { /* handle */ }}
      />
    </AgentInputProvider>
  );
}`}
            </pre>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-sm text-gray-400 py-6 border-t border-gray-200">
          Built by <a href="https://github.com/100x-bot" className="text-gray-600 hover:text-gray-900">100x-bot</a> — MIT License
        </footer>
      </main>
    </div>
  );
}
