import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WorkflowStep {
    level: 'L2' | 'L1' | 'L0';
    name: string;
    children?: WorkflowStep[];
}

interface WorkflowReviewProps {
    onClose: () => void;
    onApprove: () => void;
    workflowPlan?: {
        name: string;
        steps: WorkflowStep[];
    };
}

// Level tag component with appropriate colors
function LevelTag({ level }: { level: 'L2' | 'L1' | 'L0' }) {
    const colors = {
        L2: 'bg-[#a7f3d0]', // emerald
        L1: 'bg-[#a5f3fc]', // cyan
        L0: 'bg-[#c7d2fe]', // indigo
    };

    return (
        <div className={`${colors[level]} flex items-center justify-center p-1 rounded w-9 shrink-0`}>
            <span className="text-sm font-medium text-[#0f172a]">{level}</span>
        </div>
    );
}

// Chevron icon with rotation based on expanded state
function ChevronIcon({ expanded, className = '' }: { expanded: boolean; className?: string }) {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className={`text-[#64748b] transition-transform duration-200 ${expanded ? '' : '-rotate-90'} ${className}`}
        >
            <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

// L0 Item component
function L0Item({ step }: { step: WorkflowStep }) {
    return (
        <div className="flex items-center py-1">
            {/* Tree connector line */}
            <div className="flex items-center shrink-0">
                <div className="w-0 h-full flex items-center justify-center">
                    <div className="w-px h-11 bg-[#cbd5e1]" />
                </div>
                <div className="w-4 h-px bg-[#cbd5e1]" />
            </div>
            {/* L0 card */}
            <div className="flex-1 bg-white flex items-center gap-2 p-1 rounded-lg">
                <LevelTag level="L0" />
                <span className="text-sm font-medium text-[#0f172a] truncate">{step.name}</span>
            </div>
        </div>
    );
}

// L1 Item component with expandable L0 children
function L1Item({ step, isLast }: { step: WorkflowStep; isLast: boolean }) {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = step.children && step.children.length > 0;

    return (
        <div className="flex items-start">
            {/* Tree connector */}
            <div className="flex items-start shrink-0">
                <div className="w-0 flex flex-col items-center">
                    <div className={`w-px ${isLast ? 'h-3' : 'h-full'} bg-[#cbd5e1]`} />
                </div>
                <div className="w-4 h-px bg-[#cbd5e1] mt-3" />
            </div>

            <div className="flex-1 flex flex-col">
                {/* L1 Header */}
                <div
                    className={`bg-white border border-[#cbd5e1] flex items-center gap-2 p-1 rounded-lg cursor-pointer ${hasChildren ? 'rounded-b-none' : ''}`}
                    onClick={() => hasChildren && setExpanded(!expanded)}
                >
                    <LevelTag level="L1" />
                    <span className="flex-1 text-sm font-medium text-[#0f172a] truncate">{step.name}</span>
                    {hasChildren && <ChevronIcon expanded={expanded} />}
                </div>

                {/* L0 Children */}
                <AnimatePresence>
                    {hasChildren && expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="bg-[#f1f5f9] border border-t-0 border-[#cbd5e1] rounded-b-lg pl-4 pr-1 overflow-hidden"
                        >
                            {step.children!.map((child, idx) => (
                                <L0Item key={idx} step={child} />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// Collapsible Workflow Group component
function WorkflowGroup({ step, isExpanded, onToggle }: { step: WorkflowStep; isExpanded: boolean; onToggle: () => void }) {
    return (
        <div className="border border-[#cbd5e1] rounded-xl overflow-hidden">
            {/* L2 Header */}
            <div
                className="bg-white flex items-center gap-2 p-2 cursor-pointer border-b border-[#cbd5e1]"
                onClick={onToggle}
            >
                <LevelTag level="L2" />
                <span className="flex-1 text-base font-semibold text-[#0f172a] truncate">{step.name}</span>
                <ChevronIcon expanded={isExpanded} />
            </div>

            {/* Expandable Content */}
            <AnimatePresence>
                {isExpanded && step.children && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white px-4 overflow-hidden"
                    >
                        {step.children.map((child, idx) => (
                            <L1Item
                                key={idx}
                                step={child}
                                isLast={idx === step.children!.length - 1}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function WorkflowReview({ onClose, onApprove, workflowPlan }: WorkflowReviewProps) {
    const [expanded, setExpanded] = useState(true);

    // Parse workflowPlan or use sample data
    const sampleWorkflow: WorkflowStep = workflowPlan && workflowPlan.steps.length > 0
        ? {
            level: 'L2',
            name: workflowPlan.name,
            children: workflowPlan.steps.map(s => ({
                level: s.level as 'L1' | 'L0',
                name: s.name,
                children: s.children?.map(c => ({
                    level: c.level as 'L0',
                    name: c.name,
                })),
            })),
        }
        : {
            level: 'L2',
            name: 'Sample Workflow',
            children: [
                {
                    level: 'L1',
                    name: 'Composed Journey',
                    children: [
                        { level: 'L0', name: 'Click action' },
                        { level: 'L0', name: 'Input action' },
                        { level: 'L0', name: 'Navigation action' },
                    ],
                },
                { level: 'L1', name: 'Another L1 Step' },
                { level: 'L1', name: 'Final L1 Step' },
            ],
        };

    return (
        <>
            <div className="fixed inset-0 z-[200] bg-black/40" onClick={onClose} />
            <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none">
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Review Workflow"
                    className="pointer-events-auto w-full max-w-[360px] h-[680px] max-h-[calc(100vh-32px)] bg-white rounded-[18px] shadow-xl overflow-hidden flex flex-col border border-[#cbd5e1]"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header - Fixed */}
                    <div className="shrink-0 flex items-center justify-between p-[10px] border-b border-[#cbd5e1]">
                        <h2 className="text-lg font-semibold text-black">Review Workflow</h2>
                        <button onClick={onClose} className="bg-[#f5f5f5] p-2 rounded-full hover:bg-[#e5e5e5] transition-colors">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M12 4L4 12M4 4L12 12" stroke="#0A0A0A" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>

                    {/* Scrollable Content Area */}
                    <div className="flex-1 overflow-y-auto min-h-0 p-4">
                        <WorkflowGroup
                            step={sampleWorkflow}
                            isExpanded={expanded}
                            onToggle={() => setExpanded(!expanded)}
                        />
                    </div>

                    {/* Footer - Fixed */}
                    <div className="shrink-0 p-[10px] border-t border-[#cbd5e1] flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-3 text-sm font-medium text-[#0a0a0a] bg-[#f5f5f5] hover:bg-[#e5e5e5] rounded-lg transition-colors shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1)]"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onApprove}
                            className="flex-1 py-3 text-sm font-medium text-white bg-[#16a34a] hover:opacity-90 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
                                <path d="M5.5 8L7 9.5L10.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Approve & Build
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
