import { useState, useRef, useEffect, useMemo } from 'react';
import { AgentInputProvider, AgentStatusBar } from '@100xbot/agent-input';
import type { AgentStatus, AgentStatusBarRef } from '@100xbot/agent-input';
import { createMockConfig } from './mockConfig';
import { useSpeechRecognition } from './useSpeechRecognition';
import { Moon, Sun } from '../../src/icons';

const baseMockConfig = createMockConfig();

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

// ─── Test coverage data derived from e2e/tests/ ──────────────────────

interface TestScenario {
  name: string;
  description: string;
}

interface TestCategory {
  id: string;
  title: string;
  file: string;
  count: number;
  description: string;
  tryIt: string;
  scenarios: TestScenario[];
}

const testCategories: TestCategory[] = [
  {
    id: 'mentions',
    title: 'Mention Insertion',
    file: 'mention-insertion.test.ts',
    count: 7,
    description: 'Type @ to trigger a dropdown with tabs, files, and workflows. Select an item to insert a chip.',
    tryIt: 'Type @ in the input above, then select an item from the dropdown.',
    scenarios: [
      { name: '@ shows dropdown', description: 'Typing @ displays the mentions dropdown with all available options' },
      { name: 'File selection', description: 'Selecting a file from the dropdown inserts a file chip' },
      { name: 'Workflow selection', description: 'Selecting a workflow inserts a workflow chip' },
      { name: 'Tab selection', description: 'Selecting a tab inserts a tab chip' },
      { name: 'Escape closes dropdown', description: 'Pressing Escape hides the dropdown and preserves the @ text' },
      { name: '@ in middle of text', description: 'Typing @ mid-sentence opens the dropdown correctly' },
      { name: '@filter narrows results', description: 'Typing after @ filters the mention list in real time' },
    ],
  },
  {
    id: 'add-button',
    title: 'Add Button (+)',
    file: 'add-button.test.ts',
    count: 6,
    description: 'Insert reference chips via the + button as an alternative to @ mentions.',
    tryIt: 'Click the + button on the left side of the input to open the reference picker.',
    scenarios: [
      { name: 'Insert into empty input', description: 'Insert a file chip into an empty input via the + button' },
      { name: 'Insert after text', description: 'Append a file chip after existing typed text' },
      { name: 'Alongside other chips', description: 'Add a file chip alongside an existing workflow chip' },
      { name: 'Tab with workflow', description: 'Insert a tab chip alongside a workflow chip' },
      { name: 'Third chip without corruption', description: 'Inserting a third chip preserves existing chips intact' },
      { name: 'Dropdown opens', description: 'Clicking + opens the reference picker dropdown' },
    ],
  },
  {
    id: 'chip-deletion',
    title: 'Chip Deletion',
    file: 'chip-deletion.test.ts',
    count: 9,
    description: 'Remove chips through Backspace, Delete, Cut, Select All, and the X button — without corrupting adjacent content.',
    tryIt: 'Insert a chip with @, then try deleting it with Backspace, Delete key, or its X button.',
    scenarios: [
      { name: 'Backspace after chip', description: 'Remove chip when cursor is immediately after it' },
      { name: 'Delete before chip', description: 'Remove chip when cursor is immediately before it' },
      { name: 'Cut selection spanning chip', description: 'Cmd/Ctrl+X removes chips within the selection' },
      { name: 'Select All + Delete', description: 'Remove all chips and text at once' },
      { name: 'Select All + type', description: 'Replace all content (including chips) by typing a character' },
      { name: 'No spurious line breaks', description: 'Deleting text between two chips does not inject line breaks' },
      { name: 'Backspace through text into chip', description: 'Backspacing through text correctly removes the adjacent chip' },
      { name: 'Preserve chip integrity', description: 'Deleting text near multiple chips keeps their structure intact' },
      { name: 'X button removal', description: 'Click the remove button on a file chip to delete it' },
    ],
  },
  {
    id: 'paste',
    title: 'Paste Handling',
    file: 'paste-handling.test.ts',
    count: 15,
    description: 'Handles plain text and rich HTML paste from various sources — web pages, Google Docs, code editors.',
    tryIt: 'Copy some text from a web page and paste it into the input.',
    scenarios: [
      { name: 'Plain text paste', description: 'Paste plain text into empty input, mid-text, and over a selection' },
      { name: 'Paste near chips', description: 'Paste text right before or after an existing chip' },
      { name: 'Multi-line paste', description: 'Paste text containing newlines preserves line breaks' },
      { name: 'Chip → plain text', description: 'Copying a chip + text pastes as plain text representation' },
      { name: 'HTML <p> breaks', description: 'Paragraph tags from rich text become proper line breaks' },
      { name: 'HTML <br> tags', description: 'Line break elements are preserved' },
      { name: 'HTML <li> items', description: 'List items from HTML lists become separate lines' },
      { name: 'HTML <div> blocks', description: 'Div-based blocks (Google Docs style) become line breaks' },
      { name: 'HTML <pre> whitespace', description: 'Whitespace in preformatted blocks is preserved' },
      { name: 'HTML headings', description: 'Heading elements create block-level breaks' },
      { name: 'Collapse excessive newlines', description: 'More than 2 consecutive newlines are collapsed to 2' },
      { name: 'Fallback to plain text', description: 'Falls back gracefully when no HTML is provided' },
      { name: 'Preserve newlines in plain text', description: 'Newlines in clipboard plain text are preserved' },
      { name: 'HTML into middle of text', description: 'Rich paste inserts correctly at cursor position' },
    ],
  },
  {
    id: 'multiline',
    title: 'Multiline Input',
    file: 'multiline.test.ts',
    count: 4,
    description: 'Shift+Enter inserts newlines. The input grows in height and supports scrolling.',
    tryIt: 'Press Shift+Enter to create a new line. The input will grow.',
    scenarios: [
      { name: 'Insert newline', description: 'Shift+Enter inserts a newline character' },
      { name: 'Height grows', description: 'Input height increases as lines are added' },
      { name: 'Scrolling', description: 'Tall content becomes scrollable within the input' },
      { name: 'Paste multiline', description: 'Pasting multiline text preserves line structure' },
    ],
  },
  {
    id: 'history',
    title: 'History Navigation',
    file: 'history-navigation.test.ts',
    count: 6,
    description: 'ArrowUp/ArrowDown cycle through previous messages. Drafts are preserved.',
    tryIt: 'Send a message (Enter), then press ArrowUp to recall it.',
    scenarios: [
      { name: 'Load previous', description: 'ArrowUp loads the previous message from history' },
      { name: 'Load next', description: 'ArrowDown navigates forward through history' },
      { name: 'Draft restoration', description: 'Current draft is restored when navigating back' },
      { name: 'New message draft', description: 'New messages start as empty drafts' },
      { name: 'Empty history', description: 'Graceful handling when no history exists' },
      { name: 'Multiple navigations', description: 'Repeated ArrowUp/ArrowDown cycles work correctly' },
    ],
  },
  {
    id: 'cursor',
    title: 'Cursor Position',
    file: 'cursor-position.test.ts',
    count: 5,
    description: 'Cursor position is preserved across typing, chip insertion, deletion, history navigation, and focus cycles.',
    tryIt: 'Type text, insert a chip, then keep typing — notice the cursor stays in place.',
    scenarios: [
      { name: 'After typing', description: 'Cursor stays at the correct position after typing' },
      { name: 'After chip insertion', description: 'Cursor lands right after an inserted chip' },
      { name: 'After delete', description: 'Cursor stays correct after deleting content' },
      { name: 'After history navigation', description: 'Cursor preserved when cycling through history' },
      { name: 'After focus/blur', description: 'Cursor maintained through focus/blur cycles' },
    ],
  },
  {
    id: 'focus-blur',
    title: 'Focus & Blur',
    file: 'focus-blur.test.ts',
    count: 4,
    description: 'Input focuses on click, blurs on outside click, and stays focused after selections.',
    tryIt: 'Click outside the input to blur it, then click back in.',
    scenarios: [
      { name: 'Focus on click', description: 'Input focuses when clicked' },
      { name: 'Blur on outside click', description: 'Input blurs and dropdown hides when clicking outside' },
      { name: 'Focus after mention selection', description: 'Input stays focused after picking a mention' },
      { name: 'Focus after + button', description: 'Input stays focused after using the + button' },
    ],
  },
  {
    id: 'placeholder',
    title: 'Placeholder',
    file: 'placeholder.test.ts',
    count: 4,
    description: 'Placeholder visibility follows focus and content state.',
    tryIt: 'Clear the input and blur it — the placeholder reappears.',
    scenarios: [
      { name: 'Visible when empty', description: 'Placeholder shows in an empty, unfocused input' },
      { name: 'Hidden on focus', description: 'Placeholder hides when input is focused' },
      { name: 'Hidden with text', description: 'Placeholder hides when text is present' },
      { name: 'Restores on clear', description: 'Placeholder reappears when all text is deleted and input blurs' },
    ],
  },
  {
    id: 'json-at',
    title: 'JSON @ Detection',
    file: 'json-at-detection.test.ts',
    count: 4,
    description: 'The @ symbol inside chip data (e.g. email addresses) does not trigger the mentions dropdown.',
    tryIt: 'This is handled internally — @ in chip metadata is ignored, only user-typed @ triggers mentions.',
    scenarios: [
      { name: '@ in chip data ignored', description: '@ inside chip reference data does not open dropdown' },
      { name: 'User-typed @ triggers', description: '@ typed by the user still opens the dropdown' },
      { name: '@ in plain text triggers', description: '@ in regular text (not chip data) triggers normally' },
      { name: 'Multiple @ symbols', description: 'Only user-typed @ symbols trigger the dropdown' },
    ],
  },
  {
    id: 'edge-cases',
    title: 'Edge Cases',
    file: 'edge-cases.test.ts',
    count: 5,
    description: 'Stress tests for rapid input, concurrent operations, and complex chip states.',
    tryIt: 'Try typing and deleting rapidly, or inserting many chips at once.',
    scenarios: [
      { name: 'Rapid typing/deleting', description: 'Handle rapid sequential typing and deletion without corruption' },
      { name: 'Select All with chips', description: 'Select All includes all chips in the selection' },
      { name: 'Multiple chips', description: 'Manage many chips simultaneously without data loss' },
      { name: 'Cleanup after operations', description: 'DOM is clean after complex editing operations' },
      { name: 'Concurrent operations', description: 'Handle overlapping user actions gracefully' },
    ],
  },
];

const totalTests = testCategories.reduce((sum, c) => sum + c.count, 0);

// ─── Components ──────────────────────────────────────────────────────

function TestCategoryCard({ category, isExpanded, onToggle }: {
  category: TestCategory;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="rounded-xl transition-all duration-200 overflow-hidden"
      style={{
        backgroundColor: 'var(--ai-surface-primary)',
        border: `1px solid ${isExpanded ? 'var(--ai-button-primary-bg)' : 'var(--ai-border-subtle)'}`,
        boxShadow: isExpanded ? 'var(--ai-shadow-md)' : 'none',
      }}
    >
      <button
        onClick={onToggle}
        className="w-full text-left px-5 py-4 flex items-center justify-between gap-3"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold"
            style={{ backgroundColor: 'var(--ai-status-ready-bg)', color: 'var(--ai-status-ready)' }}
          >
            {category.count}
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--ai-text-primary)' }}>
              {category.title}
            </h3>
            <p className="text-xs truncate mt-0.5" style={{ color: 'var(--ai-text-muted)' }}>
              {category.description}
            </p>
          </div>
        </div>
        <svg
          className="shrink-0 w-4 h-4 transition-transform duration-200"
          style={{ color: 'var(--ai-text-muted)', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-5 pb-4 space-y-3">
          {/* Try it hint */}
          <div
            className="flex items-start gap-2 text-xs px-3 py-2 rounded-lg"
            style={{ backgroundColor: 'var(--ai-status-working-bg)', color: 'var(--ai-status-working)' }}
          >
            <span className="shrink-0 mt-0.5">&#9654;</span>
            <span>{category.tryIt}</span>
          </div>

          {/* Scenario list */}
          <div className="space-y-1">
            {category.scenarios.map((scenario, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-xs px-3 py-1.5 rounded-md"
                style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'var(--ai-surface-tertiary)' }}
              >
                <span
                  className="shrink-0 mt-0.5 w-4 h-4 flex items-center justify-center rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: 'var(--ai-status-ready-bg)', color: 'var(--ai-status-ready)' }}
                >
                  &#10003;
                </span>
                <div className="min-w-0">
                  <span className="font-medium" style={{ color: 'var(--ai-text-primary)' }}>{scenario.name}</span>
                  <span style={{ color: 'var(--ai-text-muted)' }}> — {scenario.description}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Source file link */}
          <div className="text-xs pt-1" style={{ color: 'var(--ai-text-muted)' }}>
            <a
              href={`https://github.com/100x-bot/agent-input/blob/main/e2e/tests/${category.file}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 transition-colors hover:underline"
              style={{ color: 'var(--ai-text-secondary)' }}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              e2e/tests/{category.file}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────

export default function App() {
  const [activePreset, setActivePreset] = useState<PresetKey>('idle');
  const [dark, setDark] = useDarkMode();
  const statusBarRef = useRef<AgentStatusBarRef>(null);
  const speechRecognition = useSpeechRecognition();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('');

  const status = presetStates[activePreset];

  const mockConfig = useMemo(() => ({
    ...baseMockConfig,
    speech: {
      recognition: speechRecognition,
      synthesis: { cancel: () => {} },
    },
  }), [speechRecognition]);

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedCategories(new Set(testCategories.map(c => c.id)));
  const collapseAll = () => setExpandedCategories(new Set());

  const filteredCategories = filter
    ? testCategories.filter(c => {
        const q = filter.toLowerCase();
        return (
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.scenarios.some(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
        );
      })
    : testCategories;

  const filteredTestCount = filteredCategories.reduce((sum, c) => sum + c.count, 0);

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
            Type in the input below. Use <code className="px-1 rounded text-xs" style={{ backgroundColor: 'var(--ai-surface-active)', color: 'var(--ai-text-primary)' }}>@</code> to trigger mention suggestions, <code className="px-1 rounded text-xs" style={{ backgroundColor: 'var(--ai-surface-active)', color: 'var(--ai-text-primary)' }}>+</code> button to add references, or <code className="px-1 rounded text-xs" style={{ backgroundColor: 'var(--ai-surface-active)', color: 'var(--ai-text-primary)' }}>Shift+Enter</code> for multiline.
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

        {/* ─── Test Coverage Showcase ─────────────────────────────── */}
        <section aria-labelledby="coverage-heading">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 id="coverage-heading" className="text-lg font-semibold" style={{ color: 'var(--ai-text-primary)' }}>
                E2E Test Coverage
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--ai-text-muted)' }}>
                {totalTests} scenarios across {testCategories.length} categories — every interaction tested with Playwright.
              </p>
            </div>
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ backgroundColor: 'var(--ai-status-ready-bg)', color: 'var(--ai-status-ready)' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {totalTests} tests passing
            </div>
          </div>

          {/* Filter + expand/collapse controls */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter tests..."
                className="w-full text-sm px-3 py-2 rounded-lg outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--ai-surface-primary)',
                  color: 'var(--ai-text-primary)',
                  border: '1px solid var(--ai-border-default)',
                }}
              />
              {filter && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--ai-text-muted)' }}>
                  {filteredTestCount} tests
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={expandAll}
                className="px-3 py-2 text-xs font-medium rounded-lg transition-colors"
                style={{ backgroundColor: 'var(--ai-surface-primary)', color: 'var(--ai-text-secondary)', border: '1px solid var(--ai-border-default)' }}
              >
                Expand all
              </button>
              <button
                onClick={collapseAll}
                className="px-3 py-2 text-xs font-medium rounded-lg transition-colors"
                style={{ backgroundColor: 'var(--ai-surface-primary)', color: 'var(--ai-text-secondary)', border: '1px solid var(--ai-border-default)' }}
              >
                Collapse all
              </button>
            </div>
          </div>

          {/* Category cards */}
          <div className="space-y-2">
            {filteredCategories.map((category) => (
              <TestCategoryCard
                key={category.id}
                category={category}
                isExpanded={expandedCategories.has(category.id)}
                onToggle={() => toggleCategory(category.id)}
              />
            ))}
          </div>

          {filter && filteredCategories.length === 0 && (
            <p className="text-sm text-center py-8" style={{ color: 'var(--ai-text-muted)' }}>
              No tests match "{filter}"
            </p>
          )}
        </section>

        {/* Install instructions */}
        <section aria-labelledby="install-heading">
          <h2 id="install-heading" className="text-lg font-semibold mb-3" style={{ color: 'var(--ai-text-primary)' }}>Quick Start</h2>
          <div className="rounded-xl p-5 overflow-x-auto" style={{ backgroundColor: 'var(--ai-surface-workflow-bar)' }}>
            <pre className="text-sm font-mono" style={{ color: 'var(--ai-status-ready)' }} aria-label="Installation commands">
{`npm install @100xbot/agent-input

# Only peer dependencies: react and react-dom`}
            </pre>
          </div>
          <div className="rounded-xl p-5 mt-3 overflow-x-auto" style={{ backgroundColor: 'var(--ai-surface-workflow-bar)' }}>
            <pre className="text-sm font-mono" style={{ color: 'var(--ai-text-placeholder)' }} aria-label="Usage example code">
{`import '@100xbot/agent-input/styles.css';
import { AgentInputProvider, AgentStatusBar } from '@100xbot/agent-input';
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
