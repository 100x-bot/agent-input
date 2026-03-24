import React from "react";
import {
    Loader2,
    AlertTriangle,
    AlertCircle,
    X,
    Zap,
    MoreHorizontal,
    Hammer,
    AppWindow,
    ScanText,
    Settings
} from "../icons";
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
    color: string; // CSS variable reference
};

const STATUS_ICON_SIZE = "w-[0.875rem] h-[0.875rem]";

const ReadyDot = ({ color }: { color: string }) => (
    <div className="relative w-[1rem] h-[1rem] flex items-center justify-center">
        <div className="absolute inset-0 rounded-full opacity-20" style={{ backgroundColor: color }} />
        <div className="w-[0.4375rem] h-[0.4375rem] rounded-full" style={{ backgroundColor: color }} />
    </div>
);

const AgentHeader: React.FC<AgentHeaderProps> = ({
    status,
    modelName = "Claude Haiku 4.5",
    onCancel,
    activeWorkflowMode,
}) => {
    const getStatusConfig = (): StatusConfig => {
        if (status.state === "idle") {
            return {
                icon: <ReadyDot color="var(--ai-status-ready)" />,
                text: "Agent is ready",
                color: "var(--ai-text-primary)",
            };
        }

        if (status.state === "error") {
            return {
                icon: <AlertTriangle className={STATUS_ICON_SIZE} style={{ color: 'var(--ai-status-error)' }} strokeWidth={2} />,
                text: "Agent encountered an error",
                color: "var(--ai-status-error)",
            };
        }

        if (status.state === "working") {
            const operation = status.operation?.toLowerCase() || "";
            const currentTool = status.currentTool?.toLowerCase() || "";
            const workingColor = "var(--ai-status-working)";

            if (currentTool || operation.includes("tool")) {
                const toolCount = status.details?.iteration || 1;
                return {
                    icon: <Hammer className={STATUS_ICON_SIZE} style={{ color: workingColor }} strokeWidth={2} />,
                    text: `Executing ${toolCount} Tool call`,
                    color: workingColor,
                };
            }

            if (operation.includes("opening") || operation.includes("open tab")) {
                return {
                    icon: <AppWindow className={STATUS_ICON_SIZE} style={{ color: workingColor }} strokeWidth={2} />,
                    text: "Opening Tab",
                    color: workingColor,
                };
            }

            if (operation.includes("closing") || operation.includes("close tab")) {
                return {
                    icon: <X className={STATUS_ICON_SIZE} style={{ color: workingColor }} strokeWidth={2} />,
                    text: "Closing Tab",
                    color: workingColor,
                };
            }

            if (operation.includes("reading") || operation.includes("read")) {
                return {
                    icon: <ScanText className={STATUS_ICON_SIZE} style={{ color: workingColor }} strokeWidth={2} />,
                    text: "Reading Page",
                    color: workingColor,
                };
            }

            if (operation.includes("workflow") || operation.includes("executing")) {
                const workflowName = status.subtaskTitle || "Workflow";
                return {
                    icon: <Zap className={STATUS_ICON_SIZE} style={{ color: workingColor }} strokeWidth={2} />,
                    text: `Executing: ${workflowName}`,
                    color: workingColor,
                };
            }

            if (operation.includes("memory") || operation.includes("recalling")) {
                return {
                    icon: <Settings className={`${STATUS_ICON_SIZE} animate-spin-slow`} style={{ color: workingColor }} strokeWidth={2} />,
                    text: "Recalling memory",
                    color: workingColor,
                };
            }

            return {
                icon: <MoreHorizontal className={`${STATUS_ICON_SIZE} animate-pulse`} style={{ color: workingColor }} strokeWidth={2} />,
                text: status.operation || "Processing next step",
                color: workingColor,
            };
        }

        if (status.state === "waiting_for_human") {
            return {
                icon: <AlertCircle className={STATUS_ICON_SIZE} style={{ color: 'var(--ai-status-warning)' }} strokeWidth={2} />,
                text: "Waiting for input",
                color: "var(--ai-status-warning)",
            };
        }

        return {
            icon: <ReadyDot color="var(--ai-status-ready)" />,
            text: "Agent Connected",
            color: "var(--ai-text-primary)",
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

    // ── Black bar mode (workflow creation header) ─────────────────
    if (isWorkflowMode) {
        return (
            <div
                className="flex items-center justify-between w-full px-4 py-2.5 rounded-t-[1rem]"
                style={{ backgroundColor: 'var(--ai-surface-workflow-bar)' }}
                data-workflow-mode="true"
            >
                <div className="flex items-center gap-2 min-w-0">
                    <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" style={{ color: 'var(--ai-text-on-dark)' }} strokeWidth={2} />
                    <span className="text-[13px] font-medium truncate" style={{ color: 'var(--ai-text-on-dark)' }}>
                        {workflowLabel}
                    </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                    {stepText && (
                        <span className="text-[12px] font-medium" style={{ color: 'var(--ai-text-placeholder)' }}>
                            {stepText}
                        </span>
                    )}
                    {durationText && (
                        <span className="text-[12px] font-medium" style={{ color: 'var(--ai-text-placeholder)' }}>
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
            <div
                className="inline-flex items-center gap-[0.25rem] px-[0.5rem] py-[0.25rem] rounded-full"
                style={{ backgroundColor: 'var(--ai-surface-primary)', border: '1px solid var(--ai-border-default)', boxShadow: 'var(--ai-shadow-sm)' }}
            >
                {statusConfig.icon}
                <span className="text-[0.75rem] font-[500] leading-[1rem]" style={{ color: statusConfig.color }}>
                    {statusConfig.text}
                </span>
            </div>
        </div>
    );
};

export default AgentHeader;
