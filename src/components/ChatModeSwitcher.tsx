import React, { useState } from 'react';
import { ChevronDown, Check, Hammer, MessageSquare } from 'lucide-react';
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
                className="flex items-center gap-[0.375rem] px-[0.625rem] py-[0.375rem] rounded-[0.5rem]  hover:bg-[#e2e8f0] transition-colors cursor-pointer"
                title="Switch View Mode"
            >
                <span className="text-[0.875rem] font-[500] text-[#1e293b] leading-[1.25rem]">
                    {currentMode.label}
                </span>
                <ChevronDown
                    className={`w-[0.875rem] h-[0.875rem] text-[#64748b] transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
                        className="absolute bottom-full left-0 mb-[0.5rem] z-50 bg-white rounded-lg border border-[#e2e8f0] overflow-hidden min-w-[140px] shadow-lg"
                    >
                        <div className="py-[0.25rem]">
                            {MODES.map((m) => {
                                const ModeIcon = m.icon;
                                const isActive = mode === m.id;
                                return (
                                    <button
                                        key={m.id}
                                        onClick={() => {
                                            onModeChange(m.id);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-[0.75rem] py-[0.5rem] transition-colors cursor-pointer text-left gap-2 ${isActive ? 'bg-[#f8fafc]' : 'hover:bg-[#f8fafc]'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <ModeIcon className={`w-[1rem] h-[1rem] ${isActive ? 'text-[#3b82f6]' : 'text-[#64748b]'}`} strokeWidth={2} />
                                            <span className={`text-[0.875rem] ${isActive ? 'font-[600] text-[#0f172a]' : 'font-[400] text-[#334155]'}`}>
                                                {m.label}
                                            </span>
                                        </div>
                                        {isActive && (
                                            <Check className="w-[0.875rem] h-[0.875rem] text-[#3b82f6]" strokeWidth={2.5} />
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
