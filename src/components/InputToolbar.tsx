import React from 'react';
import { Mic, Globe, Send, Square, Plus, Brain, AudioLines } from 'lucide-react';
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
                {/* Add button */}
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
                        className="border border-[#cbd5e1] bg-white rounded-[0.5rem] w-[2rem] h-[2rem] flex items-center justify-center text-[#1e293b] cursor-pointer hover:bg-[#f1f5f9] transition-colors"
                        onClick={() => onModelDialogToggle(true)}
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
                            <div className="bg-[#2C2949] text-white text-[0.75rem] rounded-[0.25rem] px-[0.75rem] py-[0.25rem] whitespace-nowrap font-[500]">
                                Select a model
                            </div>
                        </div>
                    )}
                </div>

                {/* Chat/Log Mode switcher */}
                <ChatModeSwitcher
                    mode={displayMode}
                    onModeChange={onDisplayModeChange}
                />
            </div>

            {/* Right Group: Mic, Send (only when has message or working) */}
            <div className="flex items-center gap-[0.25rem]">
                {/* Mic button - Hide when working (Stop button takes precedence) or when typing (Send button takes precedence) */}
                {!isWorking && (!hasMessage || speechState !== 'idle') && (
                    <div className="relative group">
                        <button
                            className={`border rounded-[0.5rem] w-[2rem] h-[2rem] flex items-center justify-center cursor-pointer transition-colors ${speechState === "listening" || speechState === "processing"
                                ? 'border-[#0f172a] bg-[#0f172a] hover:bg-[#1e293b]'
                                : 'border-[#cbd5e1] bg-white hover:bg-[#f1f5f9]'
                                }`}
                            onClick={onMicClick}
                        >
                            {speechState === "listening" || speechState === "processing" ? (
                                <AudioLines
                                    className="w-[1rem] h-[1rem] text-white"
                                    strokeWidth={1.5}
                                />
                            ) : (
                                <Mic
                                    className="w-[1rem] h-[1rem] text-[#1e293b]"
                                    strokeWidth={1.5}
                                />
                            )}
                        </button>
                        <div
                            className="absolute right-0 mt-[0.25rem] z-50 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200"
                            style={{ top: "100%" }}
                        >
                            <div className="bg-[#2C2949] text-white text-[0.75rem] rounded-[0.25rem] px-[0.75rem] py-[0.25rem] whitespace-nowrap font-[500]">
                                Speak to type
                            </div>
                        </div>
                    </div>
                )}

                {/* Send button - only show when has message or is working */}
                {(hasMessage || isWorking) && (
                    <button
                        className={`rounded-[0.5rem] w-[2rem] h-[2rem] cursor-pointer flex items-center justify-center disabled:cursor-not-allowed transition-colors
                            ${isWorking
                                ? 'bg-[#e2e8f0] hover:bg-[#cbd5e1]'
                                : 'bg-[#0f172a] hover:bg-[#1e293b] disabled:bg-[#e2e8f0] disabled:border disabled:border-[#cbd5e1]'
                            }`}
                        onClick={isWorking ? onCancel : onSubmit}
                        disabled={!canSubmit && !isWorking}
                        title={isWorking ? "Cancel" : "Send message (Enter)"}
                    >
                        {isWorking ? (
                            <Square
                                className="w-[0.875rem] h-[0.875rem]"
                                fill="#0f172a"
                                stroke="#0f172a"
                                strokeWidth={0}
                            />
                        ) : (
                            <Send
                                className="w-[1rem] h-[1rem]"
                                fill="#fff"
                                stroke="#fff"
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
