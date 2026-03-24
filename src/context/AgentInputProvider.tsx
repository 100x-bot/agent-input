import React, { createContext, useContext } from 'react';
import type {
  MentionSection,
  FlatMentionItem,
  FileData,
  TabData,
  WorkflowData,
  Reference,
  DOMElementData,
  LLMModel,
} from '../types';

export interface AgentInputConfig {
  // Messaging
  sendMessage: (message: any) => Promise<any>;
  onPortMessage?: (handler: (msg: any) => void) => () => void;

  // Speech (optional)
  speech?: {
    recognition: {
      state: 'idle' | 'listening' | 'processing';
      isListening: boolean;
      transcript: string;
      interimTranscript: string;
      autoSubmitCountdown: number;
      error: { message: string } | null;
      toggleListening: () => void;
      clearTranscript: () => void;
      cancelAutoSubmit: () => void;
      resetError: () => void;
      setOnAutoSubmit?: (callback: () => void) => void;
    };
    synthesis: { cancel: () => void };
  };

  // Mentions
  mentions: {
    getSuggestions: (params: {
      message: string;
      mentionFilter: string;
      messageHistory: string[];
      tabs: TabData[];
      files: FileData[];
      workflows: WorkflowData[];
      availableWorkflows: string[];
      searchTabs: (query: string) => TabData[];
      searchFiles: (query: string) => FileData[];
      isSearchingWorkflows: boolean;
      getSlashCommandSuggestions?: (input: string) => string[];
      filterText: string;
    }) => MentionSection[];
    getAllItems: (sections: MentionSection[]) => FlatMentionItem[];
    filteredHistory: (params: { messageHistory: string[]; filterText: string }) => string[];
    getFilteredLoadedHistory: (params: { loadedHistoryItems: string[]; filterText: string }) => string[];
    getFilteredWorkflows: (params: { workflows: WorkflowData[]; filterText: string }) => WorkflowData[];
  };

  // Files (optional)
  files?: {
    upload: (file: File, setMessage: (updater: (prev: string) => string) => void, focusInput: () => void) => void;
    list: () => FileData[];
    search: (query: string) => FileData[];
    triggerPicker: () => void;
    handlePaste: (e: React.ClipboardEvent<HTMLDivElement>) => void;
    handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
  };

  // Tabs (optional)
  tabs?: {
    items: TabData[];
    search: (query: string) => TabData[];
  };

  // Workflows (optional)
  workflows?: {
    items: WorkflowData[];
    isLoading: boolean;
    isSearching: boolean;
    fetch: (params?: { query?: string; debounce?: boolean }) => Promise<void>;
  };

  // History (optional)
  history?: {
    items: string[];
    save: (message: string) => void;
  };

  // Model selection (optional)
  model?: {
    selectedId: string;
    showDialog: boolean;
    setShowDialog: (show: boolean) => void;
    loadSelectedModel: () => void;
    setSelectedId: (id: string) => void;
  };

  // Conversation (optional)
  conversation?: {
    addMessage: (message: any) => void;
  };

  // View mode (optional)
  viewMode?: {
    displayMode: 'chat' | 'log';
    setDisplayMode: (mode: 'chat' | 'log') => void;
  };

  // Auth (optional)
  auth?: {
    authState: any;
  };

  // Theme (optional)
  theme?: {
    currentTheme: { name: string; [key: string]: any };
  };

  // Reference parsing
  extractReferences: (text: string, metadata?: { domElements?: Map<string, DOMElementData | string>; availableWorkflows?: string[] }) => Reference[];

  // Reference display parsing (for RichInput)
  parseReferences: (text: string, metadata?: { domElements?: Map<string, any> }) => {
    references: Reference[];
    segments: Array<{ type: 'text' | 'reference'; content: string; reference?: Reference }>;
  };

  // Port for direct message listener (optional)
  port?: {
    onMessage: {
      addListener: (handler: (msg: any) => void) => void;
      removeListener: (handler: (msg: any) => void) => void;
    };
  };
}

const AgentInputContext = createContext<AgentInputConfig | null>(null);

export function AgentInputProvider({
  config,
  children,
}: {
  config: AgentInputConfig;
  children: React.ReactNode;
}) {
  return (
    <AgentInputContext.Provider value={config}>
      {children}
    </AgentInputContext.Provider>
  );
}

export function useAgentInput(): AgentInputConfig {
  const ctx = useContext(AgentInputContext);
  if (!ctx) {
    throw new Error('useAgentInput must be used within an AgentInputProvider');
  }
  return ctx;
}
