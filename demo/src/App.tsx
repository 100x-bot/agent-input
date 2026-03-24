import { useState, useRef, useEffect } from 'react';
import { AgentInputProvider, AgentStatusBar } from '@100xbot/agent-input';
import type { AgentStatus, AgentStatusBarRef } from '@100xbot/agent-input';
import { createMockConfig } from './mockConfig';
import { Moon, Sun } from 'lucide-react';

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

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return [dark, setDark] as const;
}

export default function App() {
  const [activePreset, setActivePreset] = useState<PresetKey>('idle');
  const [dark, setDark] = useDarkMode();
  const statusBarRef = useRef<AgentStatusBarRef>(null);

  const status = presetStates[activePreset];

  return (
    <div className="min-h-screen transition-colors duration-200" style={{ backgroundColor: 'var(--ai-surface-tertiary)' }}>
      {/* Skip link */}
      <a href="#demo" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium" style={{ backgroundColor: 'var(--ai-surface-primary)', color: 'var(--ai-text-primary)' }}>
        Skip to demo
      </a>

      {/* Header */}
      <header className="border-b transition-colors duration-200" style={{ backgroundColor: 'var(--ai-surface-primary)', borderColor: 'var(--ai-border-subtle)' }}>
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--ai-text-primary)' }}>
                @100xbot/agent-input
              </h1>
              <p className="mt-1" style={{ color: 'var(--ai-text-muted)' }}>
                AI agent chat input bar for React — mentions, speech, file upload, workflows
              </p>
            </div>
            <div className="flex gap-3 items-center">
              {/* Dark mode toggle */}
              <button
                onClick={() => setDark(!dark)}
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: 'var(--ai-surface-tertiary)', color: 'var(--ai-text-secondary)' }}
                aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <a
                href="https://www.npmjs.com/package/@100xbot/agent-input"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                style={{ backgroundColor: 'var(--ai-status-error-bg)', color: 'var(--ai-status-error)' }}
              >
                npm
              </a>
              <a
                href="https://github.com/100x-bot/agent-input"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                style={{ backgroundColor: 'var(--ai-button-primary-bg)', color: 'var(--ai-text-on-dark)' }}
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* State toggle */}
        <section aria-labelledby="state-heading">
          <h2 id="state-heading" className="text-lg font-semibold mb-3" style={{ color: 'var(--ai-text-primary)' }}>Component State</h2>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Agent status presets">
            {(Object.keys(presetStates) as PresetKey[]).map((key) => {
              const isActive = activePreset === key;
              return (
                <button
                  key={key}
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => setActivePreset(key)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={isActive
                    ? { backgroundColor: 'var(--ai-button-primary-bg)', color: 'var(--ai-text-on-dark)', boxShadow: 'var(--ai-shadow-sm)' }
                    : { backgroundColor: 'var(--ai-surface-primary)', color: 'var(--ai-text-secondary)', border: '1px solid var(--ai-border-default)' }
                  }
                >
                  {key === 'workingSubtask' ? 'Working (subtask)' : key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              );
            })}
          </div>
        </section>

        {/* Live demo */}
        <section id="demo" aria-labelledby="demo-heading">
          <h2 id="demo-heading" className="text-lg font-semibold mb-3" style={{ color: 'var(--ai-text-primary)' }}>Live Demo</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--ai-text-muted)' }}>
            Type in the input below. Use <code className="px-1 rounded text-xs" style={{ backgroundColor: 'var(--ai-surface-active)', color: 'var(--ai-text-primary)' }}>@</code> to trigger mention suggestions for tabs, files, and workflows.
          </p>
          <div className="rounded-xl" style={{ backgroundColor: 'var(--ai-surface-primary)', border: '1px solid var(--ai-border-subtle)', boxShadow: 'var(--ai-shadow-md)' }}>
            <AgentInputProvider config={mockConfig}>
              <AgentStatusBar
                ref={statusBarRef}
                status={status}
                sessionId="demo-session"
                initialValue=""
                onCancel={() => {
                  setActivePreset('idle');
                }}
                onSendMessage={(message, refs) => {
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
        <section aria-labelledby="install-heading">
          <h2 id="install-heading" className="text-lg font-semibold mb-3" style={{ color: 'var(--ai-text-primary)' }}>Quick Start</h2>
          <div className="rounded-xl p-5 overflow-x-auto" style={{ backgroundColor: 'var(--ai-surface-workflow-bar)' }}>
            <pre className="text-sm font-mono" style={{ color: 'var(--ai-status-ready)' }} aria-label="Installation commands">
{`npm install @100xbot/agent-input

# Peer dependencies
npm install react react-dom lucide-react framer-motion`}
            </pre>
          </div>
          <div className="rounded-xl p-5 mt-3 overflow-x-auto" style={{ backgroundColor: 'var(--ai-surface-workflow-bar)' }}>
            <pre className="text-sm font-mono" style={{ color: 'var(--ai-text-placeholder)' }} aria-label="Usage example code">
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
        <footer className="text-center text-sm py-6 border-t" style={{ color: 'var(--ai-text-muted)', borderColor: 'var(--ai-border-subtle)' }}>
          Built by <a href="https://github.com/100x-bot" className="font-medium transition-colors" style={{ color: 'var(--ai-text-secondary)' }}>100x-bot</a> — MIT License
        </footer>
      </main>
    </div>
  );
}
