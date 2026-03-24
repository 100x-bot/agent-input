// ─── Agent Status Types ──────────────────────────────────────────────

export type AgentState = 'idle' | 'working' | 'waiting_for_human' | 'error';

export interface AgentStatus {
  state: AgentState;
  operation?: string;
  details?: {
    model?: string;
    streaming?: boolean;
    iteration?: number;
    maxIterations?: number;
    toolCount?: number;
    step?: number;
    totalSteps?: number;
    [key: string]: any;
  };
  duration?: number;
  progress?: number;
  canCancel?: boolean;
  error?: string;
  subtaskId?: string;
  subtaskTitle?: string;
  isChildMessage?: boolean;
  currentTool?: string;
  toolDuration?: number;
}

// ─── Reference Types ─────────────────────────────────────────────────

export interface DOMElementSelectors {
  id?: string;
  class?: string[];
  xpath?: string;
  xpathRelative?: string;
  nthChild?: string;
  attributes?: string[];
  text?: string;
}

export interface DOMElementHierarchy {
  tagName: string;
  selector: string;
  attributes: Record<string, string>;
}

export interface DOMElementSibling {
  tagName: string;
  selector: string;
  attributes: Record<string, string>;
  textContent?: string;
  index: number;
}

export interface DOMElementData {
  primarySelector: string;
  selectors: DOMElementSelectors;
  hierarchy: DOMElementHierarchy[];
  siblings?: DOMElementSibling[];
  attributes: Record<string, string>;
  outerHTML: string;
}

export interface BaseReference {
  type: 'dom' | 'file' | 'workflow' | 'tab' | 'page' | 'selection' | 'screenshot';
  raw: string;
  displayText: string;
}

export interface DOMReference extends BaseReference {
  type: 'dom';
  selector: string;
  elementData?: DOMElementData;
}

export interface FileReference extends BaseReference {
  type: 'file';
  fileKey: string;
  fileName?: string;
  mimeType?: string;
  metadata?: {
    filename?: string;
    size?: number;
    createdAt?: string;
  };
}

export interface WorkflowReference extends BaseReference {
  type: 'workflow';
  workflowName: string;
}

export interface TabReference extends BaseReference {
  type: 'tab';
  tabId: string;
  tabTitle?: string;
  favIconUrl?: string;
}

export interface SimpleReference extends BaseReference {
  type: 'page' | 'selection' | 'screenshot';
}

export type Reference = DOMReference | FileReference | WorkflowReference | TabReference | SimpleReference;

// ─── Reference Helpers ───────────────────────────────────────────────

export function getReferenceIcon(type: Reference['type']): string {
  switch (type) {
    case 'dom': return '🎯';
    case 'file': return '📄';
    case 'workflow': return '🔧';
    case 'tab': return '📑';
    case 'page': return '📄';
    case 'selection': return '✂️';
    case 'screenshot': return '📸';
    default: return '📌';
  }
}

export function getReferenceColorClasses(type: Reference['type']): string {
  switch (type) {
    case 'dom': return 'bg-[#E3E6F2] text-[#2C2949] border-[#979FBE]';
    case 'file': return 'bg-[#DEE8E5] text-[#2C2949] border-[#B1C2BC]';
    case 'workflow': return 'bg-[#DEE8E5] text-[#2C2949] border-[#B1C2BC]';
    case 'tab': return 'bg-[#E3E6F2] text-[#2C2949] border-[#979FBE]';
    case 'page': return 'bg-yellow-100 text-yellow-800';
    case 'selection': return 'bg-pink-100 text-pink-800';
    case 'screenshot': return 'bg-[#E3E6F2] text-[#2C2949] border-[#979FBE]';
    default: return 'bg-gray-100 text-gray-800';
  }
}

// ─── Mention Types ───────────────────────────────────────────────────

export interface MentionItem {
  mention: string;
  displayText: string;
  icon: string;
  favIconUrl?: string;
}

export interface MentionSection {
  type: 'tabs' | 'files' | 'workflows' | 'actions' | 'commands';
  label: string;
  items: MentionItem[];
}

export interface FlatMentionItem extends MentionItem {
  sectionLabel: string;
}

// ─── Data Types ──────────────────────────────────────────────────────

export interface TabData {
  id: number;
  title: string;
  url?: string;
  favIconUrl?: string;
}

export interface FileData {
  key: string;
  type?: string;
  mimeType?: string;
  metadata?: {
    filename?: string;
    size?: number;
    createdAt?: number;
    description?: string;
    mimeType?: string;
  };
}

export interface WorkflowData {
  name: string;
  description?: string;
  creator_id?: {
    reference_id: string;
    creator_slug: string;
    creator_image: { name: string }[];
    creator_name: string;
  };
}

// ─── Recording Types ─────────────────────────────────────────────────

export type RecordingState = 'idle' | 'recording' | 'processing' | 'review';

export interface RecordingButtonContent {
  recordingTitle: string;
  recordingButtonLabel: string;
  recordingButtonIcon: React.ReactNode;
}

// ─── Mode Types ──────────────────────────────────────────────────────

export interface ModeConfig {
  id: string;
  name: string;
  description: string;
  tooltip: string;
  icon: React.ReactNode;
}

export type DisplayMode = 'chat' | 'log';

// ─── Model Types ─────────────────────────────────────────────────────

export interface LLMModel {
  id: string;
  name: string;
  provider: string;
  description?: string;
  max_tokens?: number;
  context_window?: number;
  capabilities?: string[];
  supports_tools?: boolean;
  supports_streaming?: boolean;
  supports_vision?: boolean;
  deprecated?: boolean;
  isImageGeneration?: boolean;
  isVideoGeneration?: boolean;
  isAudioGeneration?: boolean;
}

export interface ModelSelectionConfig {
  selectedModel: string;
  lastFetched: number;
  fallbackModel?: string;
}

// ─── Content Segment (for RichInput rendering) ──────────────────────

export interface ContentSegment {
  type: 'text' | 'reference';
  content: string;
  reference?: Reference;
}
