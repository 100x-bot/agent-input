import React, { useRef } from 'react';
import { Mic, Send, Square, Plus, ChevronDown, AudioLines } from '../icons';
import ChatModeSwitcher from './ChatModeSwitcher';
import type { DisplayMode } from '../types';
import AddButtonDropdown from './AddButtonDropdown';
import ModelSelectorDropdown from './ModelSelectorDropdown';
import type { MentionSection, AgentStatus, AgentInputInteractionEvent } from '../types';

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
    selectedModelName?: string;
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
    onInteractionDiagnostic?: (event: AgentInputInteractionEvent) => void;
}

const TOOLBAR_BTN = "rounded-[0.5rem] w-[2rem] h-[2rem] flex items-center justify-center cursor-pointer transition-colors";
const SEND_CONTROL_BTN = "ai-send-control rounded-[0.625rem] w-[2.75rem] h-[2.75rem] shrink-0 flex items-center justify-center cursor-pointer transition-colors focus-visible:outline-none disabled:cursor-not-allowed";

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
    selectedModelName,
    onModelSelect,
    loadSelectedModel,
    speechState,
    onMicClick,
    status,
    message,
    onCancel,
    onSubmit,
    onInteractionDiagnostic
}) => {
    const isWorking = status.state === "working";
    const hasMessage = message.trim().length > 0;
    const canCancel = Boolean(status.canCancel && onCancel);
    const isActionDisabled = isWorking ? !canCancel : !hasMessage;
    const modelLabel = selectedModelName || selectedModel || 'Select model';
    const pointerActivationRef = useRef<{
        pointerId: number;
        rect: { left: number; right: number; top: number; bottom: number };
    } | null>(null);
    const ignoreNextClickRef = useRef(false);

    const reportPointerInteraction = (type: 'pointerdown' | 'click') => {
        onInteractionDiagnostic?.({
            type,
            action: isWorking ? 'cancel' : 'submit',
            status: status.state,
        });
    };

    const invokeAction = () => {
        if (isWorking) onCancel?.();
        else onSubmit();
    };

    const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        pointerActivationRef.current = {
            pointerId: event.pointerId,
            rect: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom },
        };
        event.currentTarget.setPointerCapture?.(event.pointerId);
        reportPointerInteraction('pointerdown');
    };

    const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
        const activation = pointerActivationRef.current;
        pointerActivationRef.current = null;
        if (!activation || activation.pointerId !== event.pointerId) return;

        const { left, right, top, bottom } = activation.rect;
        const releasedInsideTarget = event.clientX >= left && event.clientX <= right
            && event.clientY >= top && event.clientY <= bottom;
        if (releasedInsideTarget) {
            // Treat a completed pointer gesture as the click. Pointer capture
            // keeps this reliable if TipTap blur causes the toolbar to shift.
            ignoreNextClickRef.current = true;
            setTimeout(() => { ignoreNextClickRef.current = false; }, 0);
            reportPointerInteraction('click');
            invokeAction();
        }
    };

    const handleActionClick = () => {
        if (ignoreNextClickRef.current) {
            ignoreNextClickRef.current = false;
            return;
        }
        reportPointerInteraction('click');
        invokeAction();
    };

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
                        className="rounded-[0.5rem] h-[2rem] min-w-[2rem] max-w-[11rem] px-[0.5rem] flex items-center gap-[0.25rem] cursor-pointer transition-colors"
                        style={{ border: '1px solid var(--ai-border-default)', backgroundColor: 'var(--ai-surface-primary)', color: 'var(--ai-text-secondary)' }}
                        onClick={() => onModelDialogToggle(true)}
                        aria-label="Select a model"
                        title={modelLabel}
                    >
                        <span className="min-w-0 truncate text-[0.75rem] font-[500]">{modelLabel}</span>
                        <ChevronDown className="w-[0.875rem] h-[0.875rem] shrink-0" strokeWidth={1.5} aria-hidden="true" />
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
                        className={SEND_CONTROL_BTN}
                        data-action={isWorking ? 'cancel' : 'send'}
                        onPointerDown={handlePointerDown}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={() => { pointerActivationRef.current = null; }}
                        onClick={handleActionClick}
                        disabled={isActionDisabled}
                        aria-label={isWorking ? "Cancel" : "Send message"}
                        title={isWorking ? "Cancel" : "Send message (Enter)"}
                    >
                        {isWorking ? (
                            <Square
                                className="w-[0.875rem] h-[0.875rem]"
                                style={{ fill: 'currentColor', stroke: 'currentColor' }}
                                strokeWidth={0}
                            />
                        ) : (
                            <Send
                                className="w-[1rem] h-[1rem]"
                                style={{ fill: 'currentColor', stroke: 'currentColor' }}
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
