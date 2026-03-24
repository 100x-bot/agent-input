# @100xbot/agent-input

A reusable AI agent chat input bar for React applications. Features rich text input with @mentions, speech recognition, file uploads, model selection, and workflow integration.

## Installation

```bash
npm install @100xbot/agent-input
```

**Peer dependencies:**

```bash
npm install react react-dom lucide-react framer-motion
```

## Quick Start

Wrap your component tree with `AgentInputProvider` and pass a config object that bridges your app's data sources:

```tsx
import { AgentInputProvider, AgentStatusBar } from '@100xbot/agent-input';
import type { AgentInputConfig } from '@100xbot/agent-input';

function App() {
  const config: AgentInputConfig = {
    sendMessage: async (msg) => { /* your messaging layer */ },
    extractReferences: (text) => { /* parse @references from text */ return []; },
    parseReferences: (text) => ({ references: [], segments: [{ type: 'text', content: text }] }),
    mentions: {
      getSuggestions: (params) => [],
      getAllItems: (sections) => [],
      filteredHistory: () => [],
      getFilteredLoadedHistory: () => [],
      getFilteredWorkflows: () => [],
    },
  };

  return (
    <AgentInputProvider config={config}>
      <AgentStatusBar
        status={{ state: 'idle', operation: '' }}
        sessionId="session-1"
        initialValue=""
        onSendMessage={(message, references) => {
          console.log('Send:', message, references);
        }}
      />
    </AgentInputProvider>
  );
}
```

## Exports

### Main (`@100xbot/agent-input`)

| Export | Description |
|--------|-------------|
| `AgentInputProvider` | React context provider — wrap your tree with this |
| `useAgentInput` | Hook to access the config from any child component |
| `AgentStatusBar` | Main chat input bar component |
| `RichInput` | ContentEditable input with reference chip rendering |
| `ListeningNotification` | Speech recognition status overlay |
| `ModelSelectorDropdown` | LLM model picker dropdown |
| `ChatModeSwitcher` | Chat/Build mode toggle |
| `MentionsDropdown` | @mention suggestion dropdown |
| `AddButtonDropdown` | Plus button menu (files, tabs, workflows) |
| `InputToolbar` | Bottom toolbar with all action buttons |
| `AgentHeader` | Status header with agent state display |
| `AgentStatusIndicator` | Compact status indicator |
| `ModeSwitcher` | Builder/Normal mode toggle |
| `ExpandableHistory` | Message history list |
| `ExpandableWorkflows` | Workflow list |
| `RecordingButton` | Recording button component |
| `useDropdownNavigation` | Keyboard navigation hook for dropdowns |
| `useInputHistory` | Bash-style arrow key history navigation |

### Recording (`@100xbot/agent-input/recording`)

| Export | Description |
|--------|-------------|
| `RecordingExplainerDialog` | Multi-state recording dialog with processing animation |
| `RecordingAnimation` | Recording state animation |
| `RecordingIllustration` | Recording illustration graphic |
| `ProcessingAnimation` | Processing state animation |

### Workflow (`@100xbot/agent-input/workflow`)

| Export | Description |
|--------|-------------|
| `WorkflowReview` | Workflow review and approval component |

## AgentInputConfig

The provider config bridges your application's data layer with the component library:

```typescript
interface AgentInputConfig {
  // Required
  sendMessage: (message: any) => Promise<any>;
  extractReferences: (text: string, metadata?) => Reference[];
  parseReferences: (text: string, metadata?) => { references: Reference[]; segments: ContentSegment[] };
  mentions: {
    getSuggestions: (params: MentionSuggestionsParams) => MentionSection[];
    getAllItems: (sections: MentionSection[]) => FlatMentionItem[];
    filteredHistory: (params) => string[];
    getFilteredLoadedHistory: (params) => string[];
    getFilteredWorkflows: (params) => WorkflowData[];
  };

  // Optional
  speech?: { recognition: SpeechRecognitionState; synthesis: { cancel: () => void } };
  files?: { list: () => FileData[]; search: (q: string) => FileData[]; triggerPicker: () => void; ... };
  tabs?: { items: TabData[]; search: (q: string) => TabData[] };
  workflows?: { items: WorkflowData[]; isLoading: boolean; isSearching: boolean; fetch: (...) => Promise<void> };
  history?: { items: string[]; save: (msg: string) => void };
  model?: { selectedId: string; showDialog: boolean; setShowDialog: ...; loadSelectedModel: ...; setSelectedId: ... };
  conversation?: { addMessage: (message: any) => void };
  viewMode?: { displayMode: 'chat' | 'log'; setDisplayMode: (mode) => void };
  auth?: { authState: any };
  theme?: { currentTheme: { name: string } };
  port?: { onMessage: { addListener: (h) => void; removeListener: (h) => void } };
}
```

See `src/context/AgentInputProvider.tsx` for the full type definition.

## Tailwind CSS

This library uses Tailwind CSS utility classes. Add the package's source to your Tailwind content config:

```js
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{ts,tsx}',
    './node_modules/@100xbot/agent-input/dist/**/*.{mjs,cjs}',
  ],
};
```

Or for Tailwind CSS v4 with `@tailwindcss/vite`:

```css
/* app.css */
@import "tailwindcss";
@source "../node_modules/@100xbot/agent-input/dist";
```

## Types

All types are exported from the main entry point:

```typescript
import type {
  AgentStatus,
  Reference,
  DOMElementData,
  TabData,
  FileData,
  WorkflowData,
  MentionSection,
  FlatMentionItem,
  DisplayMode,
  LLMModel,
  ModelSelectionConfig,
  ContentSegment,
} from '@100xbot/agent-input';
```

## License

MIT
