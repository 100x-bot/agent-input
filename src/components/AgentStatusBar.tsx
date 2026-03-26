
import React, { forwardRef, KeyboardEvent, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ArrowDownToLine, X } from '../icons';
import { useAgentInput } from '../context/AgentInputProvider';
import type { AgentStatus, DOMElementData, Reference, WorkflowData, MentionsDropdownRenderProps } from '../types';
import RichInput, { RichInputRef } from './RichInputTipTap';
import ListeningNotification from './ListeningNotification';
import AgentHeader from './AgentHeader';
import InputToolbar from './InputToolbar';
import { useInputHistory } from '../hooks/useInputHistory';
import { mentionToChipAttrs } from '../utils/mentionUtils';


type WorkflowWithCreator = WorkflowData & {
    creator_id?: {
        reference_id: string;
        creator_slug: string;
        creator_image: { name: string }[];
        creator_name: string;
    };
};

interface AgentStatusBarProps {
    status: AgentStatus;
    sessionId: string;
    onCancel?: () => void;
    onRunAll?: () => Promise<void>;
    cellCount?: number;
    hasMessages?: boolean;
    expandedMode?: boolean;
    onSendMessage?: (message: string, references?: Reference[]) => void;
    placeholder?: string;
    availableWorkflows?: string[];
    showInput?: boolean;
    onFileUpload?: (fileKey: string, fileName: string, fileType: string, fileSize: number, fileEmoji: string) => void;
    getSlashCommandSuggestions?: (input: string) => string[];
    onLoadHistory?: () => Promise<string[]>;
    isLoadingHistory?: boolean;
    historyItems?: string[];
    onStartCommand?: (command: string) => void;
    initialValue: string;
    autoScrollEnabled?: boolean;
    onAutoScrollToggle?: (enabled: boolean) => void;
    /** If true, force the black workflow creation UI regardless of status text */
    activeWorkflowMode?: boolean;
    /** Custom renderer for the mentions dropdown. When provided, replaces the default MentionsDropdown entirely. */
    renderMentionsDropdown?: (props: MentionsDropdownRenderProps) => React.ReactNode;
}

export interface AgentStatusBarRef {
    focus: (cursorOffset?: number) => void;
    setValue: (value: string) => void;
    getValue: () => string;
    getCursorOffset: () => number;
    toggleSpeechRecognition: () => void;
    cancelSpeech: () => void;
}

const AgentStatusBar = forwardRef<AgentStatusBarRef, AgentStatusBarProps>(({
    status,
    sessionId,
    onCancel,
    hasMessages,
    onSendMessage,
    placeholder = 'Type your message...',
    availableWorkflows = [],
    onFileUpload,
    getSlashCommandSuggestions,
    onLoadHistory,
    isLoadingHistory = false,
    historyItems = [],
    initialValue,
    autoScrollEnabled = true,
    onAutoScrollToggle,
    activeWorkflowMode,
    renderMentionsDropdown
}, ref) => {
    // Context from provider
    const ctx = useAgentInput();
    const { sendMessage, extractReferences } = ctx;
    const addMessage = ctx.conversation?.addMessage;
    const port = ctx.port;
    const authState = ctx.auth?.authState;
    const displayMode = ctx.viewMode?.displayMode ?? 'chat';
    const setDisplayMode = ctx.viewMode?.setDisplayMode ?? (() => {});

    // Draft persistence key
    const DRAFT_STORAGE_KEY = `chat_draft_${sessionId}`;

    // Core input state - initialize from localStorage if available
    const [message, setMessage] = useState(() => {
        if (initialValue) return initialValue;
        try {
            const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
            return savedDraft || '';
        } catch {
            return '';
        }
    });
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [showAddDropdown, setShowAddDropdown] = useState(false);
    const [dismissedError, setDismissedError] = useState<string | null>(null);

    // History loading state
    const [isLoadingHistoryLocal, setIsLoadingHistoryLocal] = useState(false);
    const [loadedHistoryItems, setLoadedHistoryItems] = useState<string[]>([]);

    // Workflow loading state
    const [hasLoadedWorkflows, setHasLoadedWorkflows] = useState(false);
    const isWorkflowLoadingRef = useRef(false);

    // Refs
    const richInputRef = useRef<RichInputRef>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const domElementsRef = useRef<Map<string, DOMElementData | string>>(new Map());
    const pendingTranscriptRef = useRef<string>('');

    // Real-time data from provider
    const tabs = ctx.tabs?.items ?? [];
    const searchTabs = ctx.tabs?.search ?? (() => []);
    const files = ctx.files?.list() ?? [];
    const searchFiles = ctx.files?.search ?? (() => []);
    const workflows = ctx.workflows?.items ?? [];
    const isLoadingWorkflows = ctx.workflows?.isLoading ?? false;
    const isSearching = ctx.workflows?.isSearching ?? false;
    const fetchWorkflows = ctx.workflows?.fetch ?? (async () => {});

    // History from provider
    const messageHistory = ctx.history?.items ?? [];
    const saveToHistory = ctx.history?.save ?? (() => {});

    // Model selection from provider
    const selectedModel = ctx.model?.selectedId ?? '';
    const showModelDialog = ctx.model?.showDialog ?? false;
    const setShowModelDialog = ctx.model?.setShowDialog ?? (() => {});
    const loadSelectedModel = ctx.model?.loadSelectedModel ?? (() => {});
    const setSelectedModel = ctx.model?.setSelectedId ?? (() => {});

    // Mention suggestions from provider
    const getMentionSuggestions = () => ctx.mentions.getSuggestions({
        message,
        mentionFilter: '',
        messageHistory,
        tabs,
        files,
        workflows: workflows as WorkflowData[],
        availableWorkflows,
        searchTabs,
        searchFiles,
        isSearchingWorkflows: isSearching,
        getSlashCommandSuggestions,
        filterText: ''
    });

    // Input history navigation (bash-style up/down arrow)
    const {
        navigateUp: historyNavigateUp,
        navigateDown: historyNavigateDown,
        reset: resetInputHistory,
        isNavigating: isNavigatingInputHistory
    } = useInputHistory();

    // File upload from provider
    const fileInputRef = ctx.files?.fileInputRef ?? useRef<HTMLInputElement>(null);
    const handlePaste = ctx.files?.handlePaste ?? (() => {});
    const handleFileSelect = ctx.files?.handleFileSelect ?? (() => {});
    const triggerFilePicker = ctx.files?.triggerPicker ?? (() => {});

    // Handle submit
    const handleSubmit = useCallback((manualMessage?: string) => {
        if (!onSendMessage) return;

        let processedMessage = manualMessage?.trim?.() || message.trim();
        if (!processedMessage || processedMessage === '__CANCEL_CONVERSATION__') return;

        const references = extractReferences(processedMessage, {
            domElements: domElementsRef.current,
            availableWorkflows
        });

        saveToHistory(processedMessage);
        onSendMessage(processedMessage, references);

        setMessage('');
        resetInputHistory(); // Reset arrow key history navigation on submit
        domElementsRef.current.clear();
    }, [message, onSendMessage, availableWorkflows, saveToHistory, resetInputHistory]);

    const handleSubmitRef = useRef(handleSubmit);
    handleSubmitRef.current = handleSubmit;

    // Speech recognition
    const handleSpeechAutoSubmit = useCallback(() => {
        const finalMessage = message + pendingTranscriptRef.current;
        if (finalMessage.trim()) {
            handleSubmitRef.current(finalMessage);
            pendingTranscriptRef.current = '';
        }
    }, [message]);

    // Speech from provider (or no-op defaults)
    const speechRecognition = ctx.speech?.recognition ?? {
        state: 'idle' as const,
        isListening: false,
        transcript: '',
        interimTranscript: '',
        autoSubmitCountdown: 0,
        error: null,
        toggleListening: () => {},
        clearTranscript: () => {},
        cancelAutoSubmit: () => {},
        resetError: () => {},
    };

    const speechSynthesis = ctx.speech?.synthesis ?? { cancel: () => {} };

    // Register auto-submit callback with speech recognition provider
    useEffect(() => {
        speechRecognition.setOnAutoSubmit?.(handleSpeechAutoSubmit);
    }, [handleSpeechAutoSubmit, speechRecognition.setOnAutoSubmit]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
        focus: (cursorOffset?: number) => richInputRef.current?.focus(cursorOffset),
        setValue: (value: string) => setMessage(value),
        getValue: () => message,
        getCursorOffset: () => richInputRef.current?.getCursorOffset() ?? -1,
        toggleSpeechRecognition: () => speechRecognition.toggleListening(),
        cancelSpeech: () => speechSynthesis.cancel()
    }));

    // Listen for Alt+Click elements
    useEffect(() => {
        if (!port) return;

        const handleAltClickElement = (request: any) => {
            if (request.type === 'ALT_CLICK_ELEMENT') {
                const { elementData } = request;
                domElementsRef.current.set(elementData.primarySelector, elementData);

                const domReference = JSON.stringify({
                    type: 'dom',
                    selector: elementData.primarySelector,
                    elementData
                });

                setMessage(prev => prev ? (prev.endsWith(' ') ? `${prev}${domReference}` : `${prev} ${domReference}`) :
                    domReference);
                richInputRef.current?.focus();
            }
        };

        port.onMessage.addListener(handleAltClickElement);
        return () => port.onMessage.removeListener(handleAltClickElement);
    }, [port]);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setSelectedDropdownIndex(-1);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Save draft to localStorage when message changes
    useEffect(() => {
        try {
            if (message) {
                localStorage.setItem(DRAFT_STORAGE_KEY, message);
            } else {
                localStorage.removeItem(DRAFT_STORAGE_KEY);
            }
        } catch (e) {
            // Ignore localStorage errors
        }
    }, [message, DRAFT_STORAGE_KEY]);

    // Handle speech transcript
    useEffect(() => {
        if (speechRecognition.transcript) {
            pendingTranscriptRef.current = speechRecognition.transcript;
            const newMessage = message + speechRecognition.transcript;
            speechRecognition.clearTranscript();
            setTimeout(() => handleSubmitRef.current(newMessage), 200);
        }
    }, [speechRecognition.transcript, message, speechRecognition.clearTranscript]);

    // Load history when focused
    useEffect(() => {
        const loadHistory = async () => {
            if (historyItems?.length > 0) {
                setLoadedHistoryItems(historyItems);
                return;
            }
            if (onLoadHistory && !isLoadingHistoryLocal) {
                setIsLoadingHistoryLocal(true);
                try {
                    const loadedItems = await onLoadHistory();
                    setLoadedHistoryItems(loadedItems);
                } catch {
                    setLoadedHistoryItems(messageHistory);
                } finally {
                    setIsLoadingHistoryLocal(false);
                }
            } else if (messageHistory.length > 0) {
                setLoadedHistoryItems(messageHistory);
            }
        };
        if (isInputFocused) loadHistory();
    }, [isInputFocused, onLoadHistory, historyItems, isLoadingHistoryLocal, messageHistory]);

    // Load workflows when focused
    useEffect(() => {
        const loadWorkflows = async () => {
            if (isInputFocused && fetchWorkflows && !isLoadingWorkflows && !hasLoadedWorkflows &&
                !isWorkflowLoadingRef.current) {
                isWorkflowLoadingRef.current = true;
                try {
                    await fetchWorkflows();
                    setHasLoadedWorkflows(true);
                } finally {
                    isWorkflowLoadingRef.current = false;
                }
            }
        };
        loadWorkflows();
    }, [isInputFocused, fetchWorkflows, isLoadingWorkflows, hasLoadedWorkflows]);

    // Reset workflow loading when unfocused
    useEffect(() => {
        if (!isInputFocused) {
            setHasLoadedWorkflows(false);
            isWorkflowLoadingRef.current = false;
        }
    }, [isInputFocused]);

    // Handle mention selection from + button dropdown
    // (@ mentions are handled natively by TipTap's suggestion plugin inside RichInput)
    const selectMention = useCallback((mention: string) => {
        if (mention === '__UPLOAD_FILE__') {
            triggerFilePicker();
            richInputRef.current?.focus();
            return;
        }

        const attrs = mentionToChipAttrs(mention, { tabs, searchFiles: (q) => searchFiles(q) });
        richInputRef.current?.insertChip(attrs.id, attrs.referenceType, attrs.label, attrs.favIconUrl);
    }, [tabs, searchFiles, triggerFilePicker]);

    // Handle key down — only submit and non-mention keyboard shortcuts
    // (@ mention keyboard nav is handled by TipTap's suggestion plugin)
    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Escape' && speechRecognition.autoSubmitCountdown > 0) {
            e.preventDefault();
            speechRecognition.cancelAutoSubmit();
            setMessage('');
            return;
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmitRef.current();
        } else if (e.key === 'Escape') {
            if (showAddDropdown) {
                e.preventDefault();
                setShowAddDropdown(false);
            }
        }
    }, [speechRecognition, showAddDropdown]);

    // Handle input — just sync message state
    // (@ detection is handled by TipTap's suggestion plugin)
    const handleInput = useCallback((value: string, cursorOffset: number) => {
        setMessage(value);
        resetInputHistory();
    }, [resetInputHistory]);

    const handleFocus = () => {
        setIsInputFocused(true);
    };

    const handleBlur = (e: React.FocusEvent) => {
        setIsInputFocused(false);
    };

    // History navigation callbacks for RichInput
    const handleHistoryUp = useCallback((): boolean => {
        // Use loadedHistoryItems or messageHistory
        const history = loadedHistoryItems.length > 0 ? loadedHistoryItems : messageHistory;
        const newMessage = historyNavigateUp(history, message);
        if (newMessage !== null) {
            setMessage(newMessage);
            return true;
        }
        return false;
    }, [loadedHistoryItems, messageHistory, message, historyNavigateUp]);

    const handleHistoryDown = useCallback((): boolean => {
        const history = loadedHistoryItems.length > 0 ? loadedHistoryItems : messageHistory;
        const newMessage = historyNavigateDown(history);
        if (newMessage !== null) {
            setMessage(newMessage);
            return true;
        }
        return false;
    }, [loadedHistoryItems, messageHistory, historyNavigateDown]);

    const removeDOMElement = (selector: string) => {
        const jsonPattern = new RegExp(
            `\\s*\\{[^{}]*"selector"\\s*:\\s*"${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^{}]*\\}\\s*`, 'g');
        let newMessage = message.replace(jsonPattern, ' ').trim();
        if (newMessage === message) {
            const oldPattern = new RegExp(`\\s*@dom:${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'g');
            newMessage = message.replace(oldPattern, ' ').trim();
        }
        setMessage(newMessage);
        domElementsRef.current.delete(selector);
    };

    const mentionSections = getMentionSuggestions();

    return (
        <div ref={scrollContainerRef} className="pb-1 flex flex-col z-10 overflow-visible"
            style={{ scrollbarWidth: 'none' }}>
            <div className="flex-col flex items-center justify-center">
                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="*/*"
                />

                {/* Listening Notification */}
                <ListeningNotification
                    isListening={speechRecognition.state === "listening"}
                    isProcessing={speechRecognition.state === "processing"}
                    interimTranscript={speechRecognition.interimTranscript}
                    autoSubmitCountdown={speechRecognition.autoSubmitCountdown}
                    onCancel={() => speechRecognition.toggleListening()}
                />

                <div
                    className="gap-[1.25rem] flex flex-col items-center w-[95%] max-w-[46.25rem] min-w-[21.75rem] mx-[1rem] overflow-visible">
                    <div className="flex flex-col w-full my-auto mx-auto mb-[0.5rem] overflow-visible">
                        {/* Outer container — adapts to workflow mode */}
                        {(() => {
                            const op = status.operation?.toLowerCase() || '';
                            const isWorkflowActive = activeWorkflowMode || (status.state === 'working' && (
                                op.includes('workflow') ||
                                op.includes('creating') ||
                                op.includes('generating code')
                            ));
                            return (
                                <div className={`rounded-[1.25rem] overflow-visible`} style={{ backgroundColor: isWorkflowActive ? 'var(--ai-surface-workflow-bar)' : 'var(--ai-surface-active)' }}>
                                    {/* Agent Header - always visible */}
                                    <div className={isWorkflowActive ? '' : 'px-[0.5rem] rounded-t-[0.75rem]'}>
                                        <AgentHeader
                                            status={status}
                                            modelName={selectedModel ? selectedModel.replace('claude-', 'Claude ').replace(/-/g, ' ').replace(/\d{8}$/, '').trim() : 'Claude Haiku 4.5'}
                                            activeWorkflowMode={activeWorkflowMode}
                                        />
                                    </div>

                                    {/* Inner white input container */}
                                    <div
                                        ref={containerRef}
                                        className="relative flex flex-col items-stretch rounded-[1.25rem] overflow-visible transition-colors duration-200"
                                        style={{
                                            backgroundColor: 'var(--ai-surface-input-bg)',
                                            border: '1px solid var(--ai-border-subtle)',
                                            boxShadow: 'var(--ai-shadow-md)',
                                        }}
                                    >
                                        {/* Error details - show when there's an error */}
                                        {((status.state === "error" && status.error && status.error !== dismissedError) || speechRecognition.error) && (
                                            <div className="px-[1rem] pt-[0.75rem] pb-[0.5rem]" style={{ borderBottom: '1px solid var(--ai-border-subtle)' }}>
                                                <div className="rounded-[0.375rem] p-[0.5rem] text-[0.75rem] flex items-start justify-between gap-2" style={{ backgroundColor: 'var(--ai-status-error-bg)', border: '1px solid var(--ai-status-error-border)' }}>
                                                    <p className="break-words flex-1" style={{ color: 'var(--ai-status-error)' }}>
                                                        {(status.state === "error" && status.error && status.error !== dismissedError) ? status.error : speechRecognition.error?.message}
                                                    </p>
                                                    <button
                                                        onClick={() => {
                                                            if (speechRecognition.error) speechRecognition.resetError();
                                                            if (status.state === "error" && status.error) setDismissedError(status.error);
                                                        }}
                                                        className="transition-colors flex-shrink-0"
                                                        style={{ color: 'var(--ai-status-error)' }}
                                                        aria-label="Dismiss error"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Input Area */}
                                        <div className="px-[1rem] pt-[1rem] pb-[0.75rem] overflow-visible">
                                            <div className="flex flex-col gap-[0.75rem] overflow-visible">
                                                <div className="relative overflow-visible">
                                                    <RichInput
                                                        ref={richInputRef}
                                                        value={message}
                                                        onChange={handleInput}
                                                        onKeyDown={handleKeyDown}
                                                        onFocus={handleFocus}
                                                        onBlur={handleBlur}
                                                        onPaste={handlePaste}
                                                        placeholder={(() => {
                                                            const op = status.operation?.toLowerCase() || '';
                                                            const isWf = status.state === 'working' && (
                                                                op.includes('workflow') || op.includes('creating') || op.includes('generating code')
                                                            );
                                                            if (isWf) return 'ask for changes';
                                                            return placeholder || 'Type @ for adding tabs or workflows';
                                                        })()}
                                                        placeholderClassName="text-[0.875rem] leading-[1.25rem]"
                                                        className="w-full bg-transparent border-0 focus:outline-none text-[0.875rem] overflow-y-auto theme-transition leading-[1.25rem] min-h-[1.5rem] max-h-[12rem]"
                                                        style={{ color: 'var(--ai-text-primary)', minHeight: "3rem", maxHeight: "12rem", fieldSizing: "content" } as React.CSSProperties}
                                                        domElementsMap={domElementsRef.current}
                                                        onRemoveDOMElement={removeDOMElement}
                                                        onHistoryUp={handleHistoryUp}
                                                        onHistoryDown={handleHistoryDown}
                                                        isNavigatingHistory={isNavigatingInputHistory}
                                                        mentionSections={mentionSections}
                                                        onMentionSelect={selectMention}
                                                        renderMentionsDropdown={renderMentionsDropdown}
                                                    />
                                                </div>

                                                <InputToolbar
                                                    displayMode={displayMode}
                                                    onDisplayModeChange={setDisplayMode}
                                                    showAddDropdown={showAddDropdown}
                                                    onAddDropdownToggle={setShowAddDropdown}
                                                    mentionSections={mentionSections}
                                                    onMentionSelect={selectMention}
                                                    showModelDialog={showModelDialog}
                                                    onModelDialogToggle={setShowModelDialog}
                                                    selectedModel={selectedModel}
                                                    onModelSelect={setSelectedModel}
                                                    loadSelectedModel={loadSelectedModel}
                                                    speechState={speechRecognition.state as 'idle' | 'listening' | 'processing'}
                                                    onMicClick={() => speechRecognition.toggleListening()}
                                                    status={status}
                                                    message={message}
                                                    onCancel={onCancel}
                                                    onSubmit={() => handleSubmitRef.current()}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
});

AgentStatusBar.displayName = 'AgentStatusBar';

export default AgentStatusBar;
