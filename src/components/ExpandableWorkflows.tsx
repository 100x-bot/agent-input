import React from 'react';
import type { WorkflowData } from '../types';
import LoadingSpinner from './LoadingSpinner';

export interface ExpandableWorkflowsProps {
    workflows: WorkflowData[];
    isLoading: boolean;
    selectedIndex: number;
    historyOffset: number; // Number of history items to offset the index
    isNavigating: boolean;
    onSelect: (workflow: WorkflowData) => void;
}

const WorkflowIcon = () => (
    <svg className="w-4 h-4 text-theme-text-muted" fill="none" viewBox="0 0 16 16">
        <path
            d="M9.33366 12.9997H8.66699C6.78137 12.9997 5.83857 12.9997 5.25278 12.4139C4.66699 11.8281 4.66699 10.8853 4.66699 8.99967V7.66634M4.66699 5.33301V7.66634M4.66699 7.66634H9.33366"
            stroke="#535460"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M9.33301 7.66667C9.33301 6.88099 9.33301 6.48816 9.56732 6.24408C9.80164 6 10.1788 6 10.933 6H11.733C12.4873 6 12.8644 6 13.0987 6.24408C13.333 6.48816 13.333 6.88099 13.333 7.66667C13.333 8.45234 13.333 8.84518 13.0987 9.08926C12.8644 9.33333 12.4873 9.33333 11.733 9.33333H10.933C10.1788 9.33333 9.80164 9.33333 9.56732 9.08926C9.33301 8.84518 9.33301 8.45234 9.33301 7.66667Z"
            stroke="#535460"
        />
        <path
            d="M9.33301 12.9997C9.33301 12.214 9.33301 11.8212 9.56732 11.5771C9.80164 11.333 10.1788 11.333 10.933 11.333H11.733C12.4873 11.333 12.8644 11.333 13.0987 11.5771C13.333 11.8212 13.333 12.214 13.333 12.9997C13.333 13.7853 13.333 14.1782 13.0987 14.4223C12.8644 14.6663 12.4873 14.6663 11.733 14.6663H10.933C10.1788 14.6663 9.80164 14.6663 9.56732 14.4223C9.33301 14.1782 9.33301 13.7853 9.33301 12.9997Z"
            stroke="#535460"
        />
        <path
            d="M3.52381 1.33301H5.80952C7.19254 1.33301 7.33333 2.07296 7.33333 3.33301C7.33333 4.59306 7.19254 5.33301 5.80952 5.33301H3.52381C2.1408 5.33301 2 4.59306 2 3.33301C2 2.07296 2.1408 1.33301 3.52381 1.33301Z"
            stroke="#535460"
        />
    </svg>
);

const ExpandableWorkflows: React.FC<ExpandableWorkflowsProps> = ({
    workflows,
    isLoading,
    selectedIndex,
    historyOffset,
    isNavigating,
    onSelect
}) => {
    if (workflows.length === 0 && !isLoading) {
        return null;
    }

    return (
        <div className="px-[24px] pt-[20px] pb-[18px]" style={{ color: 'var(--ai-text-muted)' }}>
            <h3 className="mb-2 font-dm-mono text-[12px] font-[400]">
                Workflows
            </h3>
            <div className="flex flex-col items-stretch">
                {/* Loading state */}
                {isLoading && (
                    <div className="flex items-center gap-2 p-2">
                        <div className="w-4 h-4">
                            <LoadingSpinner />
                        </div>
                        <span className="text-sm text-inherit text-[14px] font-[400]">
                            Loading workflows...
                        </span>
                    </div>
                )}

                {/* Workflow items */}
                {!isLoading && workflows.length > 0 && workflows.map((workflow, index) => {
                    // Calculate absolute index (history items come first)
                    const absoluteIndex = historyOffset + index;
                    const isSelected = selectedIndex === absoluteIndex && isNavigating;

                    return (
                        <div
                            key={workflow.name || index}
                            className={`flex items-center gap-2 p-2 rounded-[4px] cursor-pointer transition-colors ${
                                isSelected ? "bg-theme-surface-hover" : "hover:bg-theme-surface-hover"
                            }`}
                            onClick={() => onSelect(workflow)}
                        >
                            <div className="w-4 h-4">
                                <WorkflowIcon />
                            </div>
                            <span className="text-sm text-inherit line-clamp-1 truncate text-[14px] font-[400]">
                                {workflow.name}
                            </span>
                        </div>
                    );
                })}

                {/* Empty state */}
                {!isLoading && workflows.length === 0 && (
                    <div className="flex items-center gap-2 p-2">
                        <div className="w-4 h-4">
                            <WorkflowIcon />
                        </div>
                        <span className="text-sm text-theme-text-muted text-[14px] font-[400]">
                            No workflows available
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExpandableWorkflows;
