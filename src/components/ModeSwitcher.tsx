import React, { useState, useCallback } from 'react';
import type { ModeConfig } from '../types';

export interface ModeSwitcherProps {
    mode: string;
    onModeChange: (mode: string) => void;
    sessionId: string;
    sendMessage: (message: any) => Promise<any>;
}

const BuilderIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M1.86225 14.1374C2.05752 14.3327 2.37179 14.3327 3.00033 14.3327H9.66699C10.2955 14.3327 10.6098 14.3327 10.8051 14.1374M1.86225 14.1374C1.66699 13.9422 1.66699 13.6279 1.66699 12.9993V6.33268C1.66699 5.70414 1.66699 5.38987 1.86225 5.19461M1.86225 14.1374L5.86225 10.1374M10.8051 14.1374C11.0003 13.9422 11.0003 13.6279 11.0003 12.9993V6.33268C11.0003 5.70414 11.0003 5.38987 10.8051 5.19461M10.8051 14.1374L14.1384 10.8041C14.3337 10.6088 14.3337 10.2946 14.3337 9.66602V2.99935C14.3337 2.37081 14.3337 2.05654 14.1384 1.86128M10.8051 5.19461C10.6098 4.99935 10.2955 4.99935 9.66699 4.99935H3.00033C2.37179 4.99935 2.05752 4.99935 1.86225 5.19461M10.8051 5.19461L14.1384 1.86128M1.86225 5.19461L5.19559 1.86128C5.39085 1.66602 5.70512 1.66602 6.33366 1.66602H13.0003C13.6289 1.66602 13.9431 1.66602 14.1384 1.86128M5.86225 10.1374C6.05752 10.3327 6.37179 10.3327 7.00033 10.3327H9.33366M5.86225 10.1374C5.66699 9.94216 5.66699 9.62789 5.66699 8.99935V6.99935"
            stroke="#292656"
            strokeWidth="1.025"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const NormalIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clipPath="url(#clip0_9246_3134)">
            <path
                d="M14.6663 7.7118C14.6663 11.2339 11.6812 14.0896 7.99967 14.0896C7.5668 14.0902 7.13517 14.0501 6.70995 13.9703C6.40389 13.9128 6.25086 13.8841 6.14403 13.9004C6.03719 13.9167 5.88579 13.9972 5.583 14.1582C4.72643 14.6138 3.72764 14.7746 2.76708 14.596C3.13217 14.1469 3.3815 13.6081 3.49153 13.0305C3.55819 12.6772 3.39301 12.334 3.1456 12.0827C2.0219 10.9417 1.33301 9.40404 1.33301 7.7118C1.33301 4.1897 4.31819 1.33398 7.99967 1.33398C11.6812 1.33398 14.6663 4.1897 14.6663 7.7118Z"
                stroke="#292656"
                strokeWidth="1.16622"
                strokeLinejoin="round"
            />
        </g>
        <defs>
            <clipPath id="clip0_9246_3134">
                <rect width="16" height="16" fill="white"/>
            </clipPath>
        </defs>
    </svg>
);

const ChevronIcon = () => (
    <svg width="9" height="5" viewBox="0 0 9 5" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M8.5 4.49997C8.5 4.49997 5.55404 0.500009 4.49997 0.5C3.44589 0.499991 0.5 4.5 0.5 4.5"
            stroke="#292656"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const CheckIcon = () => (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M0.800781 5.70078L4.55078 9.20078L12.8008 0.800781"
            stroke="#188554"
            strokeWidth="1.6022"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const MODES: ModeConfig[] = [
    {
        id: "builder",
        name: "Build",
        description: "Create, test workflows",
        tooltip: "Builder Mode gives the AI full access to browser tools and context so you can design, edit, and test automations from scratch. Perfect for building new workflows or refining existing ones with maximum flexibility.\n\n(Uses more tools → richer control, higher precision.)",
        icon: <BuilderIcon />
    },
    {
        id: "normal",
        name: "Normal",
        description: "Run, use workflows",
        tooltip: "Normal Mode focuses on speed and efficiency. The AI works only with your saved workflows, avoiding unnecessary DOM exploration making runs faster, cheaper, and more reliable for routine tasks.\n\n(Uses fewer tools → lower cost, higher stability.)",
        icon: <NormalIcon />
    }
];

const ModeSwitcher: React.FC<ModeSwitcherProps> = ({
    mode,
    onModeChange,
    sessionId,
    sendMessage
}) => {
    const [showModeDropdown, setShowModeDropdown] = useState(false);
    const [hoveredMode, setHoveredMode] = useState<string | null>(null);

    const currentMode = MODES.find((m) => m.id === mode) || MODES[1];

    const handleModeSelect = useCallback(async (newModeId: string) => {
        try {
            await sendMessage({
                type: 'agent',
                namespace: 'agent',
                method: 'setSessionMode',
                sessionId: sessionId,
                params: [sessionId, newModeId]
            });
            onModeChange(newModeId);
        } catch (error) {
            console.error('[ModeSwitcher] Failed to update session mode:', error);
        }
        setShowModeDropdown(false);
    }, [sendMessage, sessionId, onModeChange]);

    return (
        <div className="relative">
            <button
                className="bg-[#F5F5F5] hover:bg-[#EEEEEE] rounded-[4px] px-3 py-2 cursor-pointer flex items-center gap-2 text-[#2C2949] transition-colors"
                onClick={() => setShowModeDropdown(!showModeDropdown)}
            >
                <div className="flex items-center gap-1">
                    <span className="w-4 h-4 flex items-center justify-center text-[#2C2C4A]">
                        {currentMode.icon}
                    </span>
                    <span className="text-[14px] font-[400] font-dm-mono">
                        {currentMode.name}
                    </span>
                </div>
                <span className="w-4 h-4 flex items-center justify-center">
                    <ChevronIcon />
                </span>
            </button>

            {showModeDropdown && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowModeDropdown(false)}
                    />

                    <div className="absolute bottom-full left-0 mb-1 z-50">
                        <div className="bg-[#FBFBF9] rounded-[8px] shadow-lg border border-[#ECEEF2] w-[310px]">
                            <div className="px-6 pt-5 pb-1 border-b border-[#F0F1F4]">
                                <span className="text-xs font-medium font-dm-mono text-[#9D9DA7]">
                                    Switch modes
                                </span>
                            </div>

                            <div className="px-3 pt-2 pb-4">
                                {MODES.map((m) => {
                                    const isSelected = m.id === mode;

                                    return (
                                        <button
                                            key={m.id}
                                            onClick={() => handleModeSelect(m.id)}
                                            onMouseEnter={() => setHoveredMode(m.id)}
                                            onMouseLeave={() => setHoveredMode(null)}
                                            className={`relative w-full rounded-[4px] cursor-pointer px-3 py-2 flex items-center justify-between gap-2 transition-colors ${
                                                isSelected ? "bg-[#F0F1F4]" : "hover:bg-[#F0F1F4]"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-[#292656] w-4 h-4 flex items-center justify-center">
                                                    {m.icon}
                                                </span>
                                                <div className="flex-1 text-left">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[13px] font-[400] text-[#2C2C4A]">
                                                            {m.name}
                                                        </span>
                                                        <span className="text-[13px] font-dm-mono text-[#837F99]">
                                                            {m.description}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {isSelected && <CheckIcon />}

                                            {/* Tooltip */}
                                            {hoveredMode === m.id && (
                                                <div className="absolute text-left bottom-full md:bottom-0 left-0 mb-2 bg-[#2C2949] text-white text-[11px] rounded-[12px] px-3 py-2 w-[228px] shadow-sm z-[60] whitespace-pre-line pointer-events-none md:left-full md:ml-2 md:mb-0">
                                                    {m.tooltip}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ModeSwitcher;
