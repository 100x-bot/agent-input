import type { AgentInputConfig } from '@100xbot/agent-input';
import type { TabData, FileData, WorkflowData, MentionSection, FlatMentionItem } from '@100xbot/agent-input';
import React from 'react';

const mockTabs: TabData[] = [
  { id: 1, title: 'GitHub - 100x-bot/agent-input', url: 'https://github.com/100x-bot/agent-input', favIconUrl: 'https://github.com/favicon.ico' },
  { id: 2, title: 'React Documentation', url: 'https://react.dev', favIconUrl: 'https://react.dev/favicon.ico' },
  { id: 3, title: 'Tailwind CSS', url: 'https://tailwindcss.com', favIconUrl: 'https://tailwindcss.com/favicon.ico' },
];

const mockFiles: FileData[] = [
  { key: 'file-1', metadata: { filename: 'report.pdf', size: 245000, mimeType: 'application/pdf' } },
  { key: 'file-2', metadata: { filename: 'screenshot.png', size: 128000, mimeType: 'image/png' } },
  { key: 'file-3', metadata: { filename: 'data.csv', size: 54000, mimeType: 'text/csv' } },
];

const mockWorkflows: WorkflowData[] = [
  { name: 'Summarize Page', description: 'Extract key points from the current page' },
  { name: 'Generate Tests', description: 'Create unit tests for selected code' },
  { name: 'Translate Content', description: 'Translate page content to another language' },
];

function filterByQuery<T extends { title?: string; name?: string; metadata?: { filename?: string } }>(items: T[], query: string): T[] {
  if (!query) return items;
  const q = query.toLowerCase();
  return items.filter(item => {
    const text = ('title' in item ? (item as any).title : '') + ('name' in item ? (item as any).name : '') + (item.metadata?.filename || '');
    return text.toLowerCase().includes(q);
  });
}

export function createMockConfig(): AgentInputConfig {
  const fileInputRef = React.createRef<HTMLInputElement>();

  return {
    sendMessage: async (message: any) => {
      console.log('[Demo] sendMessage:', message);
      return { success: true, response: 'Mock response from agent' };
    },

    mentions: {
      getSuggestions: ({ mentionFilter }) => {
        const sections: MentionSection[] = [];
        const filteredTabs = filterByQuery(mockTabs, mentionFilter);
        if (filteredTabs.length > 0) {
          sections.push({
            type: 'tabs',
            label: 'Tabs',
            items: filteredTabs.map(t => ({
              mention: `@tab:${t.id}`,
              displayText: t.title,
              icon: '📑',
              favIconUrl: t.favIconUrl,
            })),
          });
        }
        const filteredFiles = filterByQuery(mockFiles, mentionFilter);
        if (filteredFiles.length > 0) {
          sections.push({
            type: 'files',
            label: 'Files',
            items: filteredFiles.map(f => ({
              mention: `@file:${f.key}`,
              displayText: f.metadata?.filename || f.key,
              icon: '📄',
            })),
          });
        }
        const filteredWorkflows = filterByQuery(mockWorkflows, mentionFilter);
        if (filteredWorkflows.length > 0) {
          sections.push({
            type: 'workflows',
            label: 'Workflows',
            items: filteredWorkflows.map(w => ({
              mention: `@workflow:${w.name}`,
              displayText: w.name,
              icon: '🔧',
            })),
          });
        }
        return sections;
      },
      getAllItems: (sections) => {
        const items: FlatMentionItem[] = [];
        for (const section of sections) {
          for (const item of section.items) {
            items.push({ ...item, sectionLabel: section.label });
          }
        }
        return items;
      },
      filteredHistory: ({ messageHistory, filterText }) => {
        if (!filterText) return messageHistory;
        return messageHistory.filter(m => m.toLowerCase().includes(filterText.toLowerCase()));
      },
      getFilteredLoadedHistory: ({ loadedHistoryItems, filterText }) => {
        if (!filterText) return loadedHistoryItems;
        return loadedHistoryItems.filter(m => m.toLowerCase().includes(filterText.toLowerCase()));
      },
      getFilteredWorkflows: ({ workflows, filterText }) => {
        return filterByQuery(workflows, filterText);
      },
    },

    files: {
      upload: (file, setMessage, focusInput) => {
        console.log('[Demo] File uploaded:', file.name);
        setMessage(prev => prev + ` [uploaded: ${file.name}]`);
        focusInput();
      },
      list: () => mockFiles,
      search: (query) => filterByQuery(mockFiles, query),
      triggerPicker: () => console.log('[Demo] File picker triggered'),
      handlePaste: (e) => console.log('[Demo] Paste event'),
      handleFileSelect: (e) => console.log('[Demo] File selected'),
      fileInputRef,
    },

    tabs: {
      items: mockTabs,
      search: (query) => filterByQuery(mockTabs, query),
    },

    workflows: {
      items: mockWorkflows,
      isLoading: false,
      isSearching: false,
      fetch: async () => {},
    },

    history: {
      items: [
        'Summarize this page for me',
        'What are the key takeaways?',
        'Generate a test plan',
      ],
      save: (message) => console.log('[Demo] History saved:', message),
    },

  };
}
