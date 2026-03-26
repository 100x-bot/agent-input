// Context
export { AgentInputProvider, useAgentInput } from './context/AgentInputProvider';
export type { AgentInputConfig, ResolvedAgentInputConfig } from './context/AgentInputProvider';

// Main component
export { default as AgentStatusBar } from './components/AgentStatusBar';
export type { AgentStatusBarRef } from './components/AgentStatusBar';

// Sub-components (tree-shakeable)
export { default as RichInput } from './components/RichInputTipTap';
export type { RichInputRef } from './components/RichInputTipTap';
export { default as ListeningNotification } from './components/ListeningNotification';
export { default as ModelSelectorDropdown } from './components/ModelSelectorDropdown';
export { default as AgentHeader } from './components/AgentHeader';
export { default as AgentStatusIndicator } from './components/AgentStatusIndicator';
export { default as InputToolbar } from './components/InputToolbar';
export { default as ChatModeSwitcher } from './components/ChatModeSwitcher';
export { default as MentionsDropdown } from './components/MentionsDropdown';
export { default as AddButtonDropdown } from './components/AddButtonDropdown';
export { default as ModeSwitcher } from './components/ModeSwitcher';
export { default as ExpandableHistory } from './components/ExpandableHistory';
export { default as ExpandableWorkflows } from './components/ExpandableWorkflows';
export { default as RecordingButton } from './components/RecordingButton';

// Hooks
export { useDropdownNavigation } from './hooks/useDropdownNavigation';
export { useInputHistory } from './hooks/useInputHistory';

// Types
export type {
  AgentStatus,
  AgentState,
  DOMElementData,
  DOMElementSelectors,
  DOMElementHierarchy,
  DOMElementSibling,
  Reference,
  DOMReference,
  FileReference,
  WorkflowReference,
  TabReference,
  SimpleReference,
  BaseReference,
  MentionItem,
  MentionSection,
  FlatMentionItem,
  MentionsDropdownRenderProps,
  TabData,
  FileData,
  WorkflowData,
  RecordingState,
  RecordingButtonContent,
  ModeConfig,
  DisplayMode,
  LLMModel,
  ModelSelectionConfig,
  ContentSegment,
} from './types';

export { getReferenceIcon, getReferenceColorClasses, getReferenceColorStyle } from './types';

// Reference parser utilities
export { parseReferences, extractReferences } from './utils/referenceParser';
