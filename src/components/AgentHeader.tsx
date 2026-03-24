import React from "react";
import {
    Loader2,
    AlertTriangle,
    AlertCircle,
    ExternalLink,
    X,
    FileText,
    Zap,
    MoreHorizontal,
    Hammer,
    AppWindow,
    ScanText,
    Settings
} from "lucide-react";
import { AgentStatus } from "../types";

export interface AgentHeaderProps {
    status: AgentStatus;
    modelName?: string;
    onCancel?: () => void;
    /** If true, force the black workflow creation UI regardless of status text */
    activeWorkflowMode?: boolean;
}

// Status configurations based on Figma design
type StatusConfig = {
    icon: React.ReactNode;
    text: string;
    textColor: string;
    iconColor: string;
    bgColor?: string;
};

const AgentHeader: React.FC<AgentHeaderProps> = ({
    status,
    modelName = "Claude Haiku 4.5",
    onCancel,
    activeWorkflowMode,
}) => {
    const getStatusConfig = (): StatusConfig => {
        // Default/Idle state - Agent is ready
        if (status.state === "idle") {
            return {
                icon: (
                    <div className="relative w-[1rem] h-[1rem] flex items-center justify-center">
                        {/* Outer ring with glow effect */}
                        <div className="absolute inset-0 rounded-full bg-[#0EA15F] opacity-20" />
                        {/* Inner solid dot */}
                        <div className="w-[0.4375rem] h-[0.4375rem] rounded-full bg-[#0EA15F]" />
                    </div>
                ),
                text: "Agent is ready",
                textColor: "text-[#0f172a]",
                iconColor: "#0EA15F",
            };
        }

        // Error states
        if (status.state === "error") {
            return {
                icon: <AlertTriangle className="w-[0.875rem] h-[0.875rem] text-[#DC2626]" strokeWidth={2} />,
                text: "Agent encountered an error",
                textColor: "text-[#DC2626]",
                iconColor: "#DC2626",
            };
        }

        // Working state - check for specific operations
        if (status.state === "working") {
            const operation = status.operation?.toLowerCase() || "";
            const currentTool = status.currentTool?.toLowerCase() || "";

            // Executing tool call
            if (currentTool || operation.includes("tool")) {
                const toolCount = status.details?.iteration || 1;
                return {
                    icon: <Hammer className="w-[0.875rem] h-[0.875rem] text-[#3870FF]" strokeWidth={2} />,
                    text: `Executing ${toolCount} Tool call`,
                    textColor: "text-[#3870FF]",
                    iconColor: "#3870FF",
                };
            }

            // Opening tab
            if (operation.includes("opening") || operation.includes("open tab")) {
                return {
                    icon: <AppWindow className="w-[0.875rem] h-[0.875rem] text-[#3870FF]" strokeWidth={2} />,
                    text: "Opening Tab",
                    textColor: "text-[#3870FF]",
                    iconColor: "#3870FF",
                };
            }

            // Closing tab
            if (operation.includes("closing") || operation.includes("close tab")) {
                return {
                    icon: <X className="w-[0.875rem] h-[0.875rem] text-[#3870FF]" strokeWidth={2} />,
                    text: "Closing Tab",
                    textColor: "text-[#3870FF]",
                    iconColor: "#3870FF",
                };
            }

            // Reading page
            if (operation.includes("reading") || operation.includes("read")) {
                return {
                    icon: <ScanText className="w-[0.875rem] h-[0.875rem] text-[#3870FF]" strokeWidth={2} />,
                    text: "Reading Page",
                    textColor: "text-[#3870FF]",
                    iconColor: "#3870FF",
                };
            }

            // Executing workflow
            if (operation.includes("workflow") || operation.includes("executing")) {
                const workflowName = status.subtaskTitle || "Workflow";
                return {
                    icon: <Zap className="w-[0.875rem] h-[0.875rem] text-[#3870FF]" strokeWidth={2} />,
                    text: `Executing: ${workflowName}`,
                    textColor: "text-[#3870FF]",
                    iconColor: "#3870FF",
                };
            }

            // Recalling memory
            if (operation.includes("memory") || operation.includes("recalling")) {
                return {
                    icon: <Settings className="w-[0.875rem] h-[0.875rem] text-[#3870FF] animate-spin-slow" strokeWidth={2} />,
                    text: "Recalling memory",
                    textColor: "text-[#3870FF]",
                    iconColor: "#3870FF",
                };
            }

            // Processing next step (default working state)
            return {
                icon: <MoreHorizontal className="w-[0.875rem] h-[0.875rem] text-[#3870FF] animate-pulse" strokeWidth={2} />,
                text: status.operation || "Processing next step",
                textColor: "text-[#3870FF]",
                iconColor: "#3870FF",
            };
        }

        // Waiting for human
        if (status.state === "waiting_for_human") {
            return {
                icon: <AlertCircle className="w-[0.875rem] h-[0.875rem] text-[#F59E0B]" strokeWidth={2} />,
                text: "Waiting for input",
                textColor: "text-[#F59E0B]",
                iconColor: "#F59E0B",
            };
        }

        // Default fallback
        return {
            icon: (
                <div className="relative w-[1rem] h-[1rem] flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-[#0EA15F] opacity-20" />
                    <div className="w-[0.4375rem] h-[0.4375rem] rounded-full bg-[#0EA15F]" />
                </div>
            ),
            text: "Agent Connected",
            textColor: "text-[#0f172a]",
            iconColor: "#0EA15F",
        };
    };

    const statusConfig = getStatusConfig();

    // Detect workflow-creation mode from operation text OR explicit prop
    const operation = status.operation?.toLowerCase() || '';
    const isWorkflowMode = activeWorkflowMode || (status.state === 'working' && (
        operation.includes('workflow') ||
        operation.includes('creating') ||
        operation.includes('generating code')
    ));

    // Friendly label for workflow mode
    const workflowLabel = (() => {
        if (!isWorkflowMode) return '';
        if (operation.includes('validating')) return 'Validating Workflow';
        if (operation.includes('generating')) return 'Creating Workflow';
        if (operation.includes('saving')) return 'Saving Workflow';
        return 'Creating Workflow';
    })();

    // Step counter from status details
    const step = status.details?.step as number | undefined;
    const totalSteps = status.details?.totalSteps as number | undefined;
    const stepText = step && totalSteps ? `Step ${step}/${totalSteps}` : null;

    // Duration display
    const durationText = (() => {
        if (!status.duration) return null;
        const d = status.duration;
        if (d < 60) return `~${Math.ceil(d)}s`;
        const mins = Math.floor(d / 60);
        const secs = Math.floor(d % 60);
        return `~${mins}:${secs.toString().padStart(2, '0')}`;
    })();

    // Calculate right content for default pill mode
    const getRightContent = () => {
        if (status.state === "working") {
            if (status.currentTool) {
                return <span className="text-[#3870FF]">{status.currentTool}</span>;
            }
        }
        if (modelName) {
            return <span className="text-[#64748b]">{modelName}</span>;
        }
        return null;
    };

    const rightContent = getRightContent();

    // ── Black bar mode (workflow creation header) ─────────────────
    if (isWorkflowMode) {
        return (
            <div
                className="flex items-center justify-between w-full px-4 py-2.5 rounded-t-[1rem]"
                style={{ backgroundColor: '#0f172a' }}
                data-workflow-mode="true"
            >
                {/* Left: spinner + label */}
                <div className="flex items-center gap-2 min-w-0">
                    <Loader2 className="w-3.5 h-3.5 text-white animate-spin flex-shrink-0" strokeWidth={2} />
                    <span className="text-[13px] font-medium text-white truncate">
                        {workflowLabel}
                    </span>
                </div>

                {/* Right: step counter + duration */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    {stepText && (
                        <span className="text-[12px] font-medium text-[#94a3b8]">
                            {stepText}
                        </span>
                    )}
                    {durationText && (
                        <span className="text-[12px] font-medium text-[#94a3b8]">
                            {durationText}
                        </span>
                    )}
                </div>
            </div>
        );
    }

    // ── Default pill badge mode ─────────────────────────────────────
    return (
        <div className="flex items-center justify-between w-full px-[0.5rem] py-[0.25rem]">
            {/* Left side: Status badge */}
            <div
                className="inline-flex items-center gap-[0.25rem] px-[0.5rem] py-[0.25rem] bg-white border border-[#cbd5e1] rounded-full"
                style={{ boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)" }}
            >
                {statusConfig.icon}
                <span className={`text-[0.75rem] font-[500] leading-[1rem] ${statusConfig.textColor}`}>
                    {statusConfig.text}
                </span>
            </div>

            {/* Right side: Dynamic content */}

        </div>
    );
};

export default AgentHeader;
