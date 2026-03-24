import React, { useState } from 'react';
import { ChevronDown, Check, Hammer, MessageSquare } from '../icons';
import type { DisplayMode } from '../types';

export interface ChatModeSwitcherProps {
    mode: DisplayMode;
    onModeChange: (mode: DisplayMode) => void;
}

const MODES = [
    {
        id: 'chat' as DisplayMode,
        label: 'Chat',
        icon: MessageSquare,
        description: 'Standard chat interface'
    },
    {
        id: 'log' as DisplayMode,
        label: 'Build',
        icon: Hammer,
        description: 'View build logs and details'
    },
];

const ChatModeSwitcher: React.FC<ChatModeSwitcherProps> = ({
    mode,
    onModeChange,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const currentMode = MODES.find(m => m.id === mode) || MODES[0];
    const Icon = currentMode.icon;

    return (
        <div className="relative">
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-[0.375rem] px-[0.625rem] py-[0.375rem] rounded-[0.5rem] transition-colors cursor-pointer"
                style={{ ['--hover-bg' as string]: 'var(--ai-surface-secondary)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ai-surface-secondary)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                aria-label={`View mode: ${currentMode.label}`}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <span className="text-[0.875rem] font-[500] leading-[1.25rem]" style={{ color: 'var(--ai-text-secondary)' }}>
                    {currentMode.label}
                </span>
                <ChevronDown
                    className={`w-[0.875rem] h-[0.875rem] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    style={{ color: 'var(--ai-text-muted)' }}
                    strokeWidth={2}
                />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Menu */}
                    <div
                        role="listbox"
                        aria-label="View mode"
                        className="absolute bottom-full left-0 mb-[0.5rem] z-50 rounded-lg overflow-hidden min-w-[140px] shadow-lg"
                        style={{ backgroundColor: 'var(--ai-surface-primary)', border: '1px solid var(--ai-border-subtle)' }}
                    >
                        <div className="py-[0.25rem]">
                            {MODES.map((m) => {
                                const ModeIcon = m.icon;
                                const isActive = mode === m.id;
                                return (
                                    <button
                                        key={m.id}
                                        role="option"
                                        aria-selected={isActive}
                                        onClick={() => {
                                            onModeChange(m.id);
                                            setIsOpen(false);
                                        }}
                                        className="w-full flex items-center justify-between px-[0.75rem] py-[0.5rem] transition-colors cursor-pointer text-left gap-2"
                                        style={isActive ? { backgroundColor: 'var(--ai-surface-secondary)' } : undefined}
                                        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--ai-surface-secondary)'; }}
                                        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = ''; }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <ModeIcon className="w-[1rem] h-[1rem]" style={{ color: isActive ? 'var(--ai-status-working)' : 'var(--ai-text-muted)' }} strokeWidth={2} />
                                            <span className={`text-[0.875rem] ${isActive ? 'font-[600]' : 'font-[400]'}`} style={{ color: isActive ? 'var(--ai-text-primary)' : 'var(--ai-text-tertiary)' }}>
                                                {m.label}
                                            </span>
                                        </div>
                                        {isActive && (
                                            <Check className="w-[0.875rem] h-[0.875rem]" style={{ color: 'var(--ai-status-working)' }} strokeWidth={2.5} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ChatModeSwitcher;
