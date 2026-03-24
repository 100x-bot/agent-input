import React from 'react';
import { Mic, Send, Square, Plus, Brain, AudioLines } from '../icons';
import ChatModeSwitcher from './ChatModeSwitcher';
import type { DisplayMode } from '../types';
import AddButtonDropdown from './AddButtonDropdown';
import ModelSelectorDropdown from './ModelSelectorDropdown';
import type { MentionSection, AgentStatus } from '../types';

export interface InputToolbarProps {
    // Chat/Log mode switcher props
    displayMode: DisplayMode;
    onDisplayModeChange: (mode: DisplayMode) => void;

    // Add button props
    showAddDropdown: boolean;
    onAddDropdownToggle: (show: boolean) => void;
    mentionSections: MentionSection[];
    onMentionSelect: (mention: string) => void;

    // Model selector props
    showModelDialog: boolean;
    onModelDialogToggle: (show: boolean) => void;
    selectedModel: string;
    onModelSelect: (modelId: string) => void;
    loadSelectedModel: () => void;

    // Speech recognition props
    speechState: 'idle' | 'listening' | 'processing';
    onMicClick: () => void;

    // Send button props
    status: AgentStatus;
    message: string;
    onCancel?: () => void;
    onSubmit: () => void;
}

const TOOLBAR_BTN = "rounded-[0.5rem] w-[2rem] h-[2rem] flex items-center justify-center cursor-pointer transition-colors";

const InputToolbar: React.FC<InputToolbarProps> = ({
    displayMode,
    onDisplayModeChange,
    showAddDropdown,
    onAddDropdownToggle,
    mentionSections,
    onMentionSelect,
    showModelDialog,
    onModelDialogToggle,
    selectedModel,
    onModelSelect,
    loadSelectedModel,
    speechState,
    onMicClick,
    status,
    message,
    onCancel,
    onSubmit
}) => {
    const isWorking = status.state === "working";
    const hasMessage = message.trim().length > 0;
    const canSubmit = isWorking ? (status.canCancel && onCancel) : hasMessage;

    return (
        <div className="flex items-center justify-between">
            {/* Left Group: Add, Model, Chat Mode Switcher */}
            <div className="flex items-center gap-[0.25rem]">
                <AddButtonDropdown
                    isOpen={showAddDropdown}
                    onClose={() => onAddDropdownToggle(false)}
                    onToggle={() => onAddDropdownToggle(!showAddDropdown)}
                    sections={mentionSections}
                    onSelect={onMentionSelect}
                />

                {/* Model selection button */}
                <div className="relative group">
                    <button
                        className={TOOLBAR_BTN}
                        style={{ border: '1px solid var(--ai-border-default)', backgroundColor: 'var(--ai-surface-primary)', color: 'var(--ai-text-secondary)' }}
                        onClick={() => onModelDialogToggle(true)}
                        aria-label="Select a model"
                    >
                        <Brain className="w-[1rem] h-[1rem]" strokeWidth={1.5} />
                    </button>
                    <ModelSelectorDropdown
                        isOpen={showModelDialog}
                        onClose={() => onModelDialogToggle(false)}
                        onModelSelect={(modelId) => {
                            onModelSelect(modelId);
                            loadSelectedModel();
                        }}
                    />
                    {!showModelDialog && (
                        <div className="absolute left-1/2 -translate-x-1/2 mt-[0.25rem] z-50 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200">
                            <div className="text-[0.75rem] rounded-[0.25rem] px-[0.75rem] py-[0.25rem] whitespace-nowrap font-[500]" style={{ backgroundColor: 'var(--ai-surface-tooltip)', color: 'var(--ai-text-on-dark)' }}>
                                Select a model
                            </div>
                        </div>
                    )}
                </div>

                <ChatModeSwitcher
                    mode={displayMode}
                    onModeChange={onDisplayModeChange}
                />
            </div>

            {/* Right Group: Mic, Send */}
            <div className="flex items-center gap-[0.25rem]">
                {!isWorking && (!hasMessage || speechState !== 'idle') && (
                    <div className="relative group">
                        <button
                            className={TOOLBAR_BTN}
                            style={speechState === "listening" || speechState === "processing"
                                ? { border: '1px solid var(--ai-button-primary-bg)', backgroundColor: 'var(--ai-button-primary-bg)', color: 'var(--ai-text-on-dark)' }
                                : { border: '1px solid var(--ai-border-default)', backgroundColor: 'var(--ai-surface-primary)', color: 'var(--ai-text-secondary)' }
                            }
                            onClick={onMicClick}
                            aria-label={speechState === "listening" ? "Stop listening" : speechState === "processing" ? "Processing speech" : "Speak to type"}
                        >
                            {speechState === "listening" || speechState === "processing" ? (
                                <AudioLines className="w-[1rem] h-[1rem]" strokeWidth={1.5} />
                            ) : (
                                <Mic className="w-[1rem] h-[1rem]" strokeWidth={1.5} />
                            )}
                        </button>
                        <div
                            className="absolute right-0 mt-[0.25rem] z-50 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200"
                            style={{ top: "100%" }}
                        >
                            <div className="text-[0.75rem] rounded-[0.25rem] px-[0.75rem] py-[0.25rem] whitespace-nowrap font-[500]" style={{ backgroundColor: 'var(--ai-surface-tooltip)', color: 'var(--ai-text-on-dark)' }}>
                                Speak to type
                            </div>
                        </div>
                    </div>
                )}

                {(hasMessage || isWorking) && (
                    <button
                        className={`${TOOLBAR_BTN} disabled:cursor-not-allowed`}
                        style={{
                            backgroundColor: isWorking ? 'var(--ai-surface-active)' : 'var(--ai-button-primary-bg)',
                        }}
                        onClick={isWorking ? onCancel : onSubmit}
                        disabled={!canSubmit && !isWorking}
                        aria-label={isWorking ? "Cancel" : "Send message"}
                        title={isWorking ? "Cancel" : "Send message (Enter)"}
                    >
                        {isWorking ? (
                            <Square
                                className="w-[0.875rem] h-[0.875rem]"
                                style={{ fill: 'var(--ai-text-primary)', stroke: 'var(--ai-text-primary)' }}
                                strokeWidth={0}
                            />
                        ) : (
                            <Send
                                className="w-[1rem] h-[1rem]"
                                style={{ fill: 'var(--ai-text-on-dark)', stroke: 'var(--ai-text-on-dark)' }}
                                strokeWidth={1.5}
                            />
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

export default InputToolbar;
