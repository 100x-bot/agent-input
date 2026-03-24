import React from 'react';
import { MousePointer, Keyboard, Navigation } from '../icons';
import ProcessingAnimation from './ProcessingAnimation';
import RecordingIllustration from './RecordingIllustration';
import RecordingAnimation from './RecordingAnimation';
import WorkflowReview from '../workflow/WorkflowReview';

interface RecordingExplainerDialogProps {
    isOpen: boolean;
    isRecording: boolean;
    isProcessing?: boolean;
    isReview?: boolean;
    onClose: () => void;
    onConfirm: () => void;
    onStopRecording: () => void;
    onApprove?: () => void;
    processingState?: {
        step: number;
        totalSteps: number;
        currentAction: string;
        progress: number;
    };
    recordingStats?: {
        clicks: number;
        inputs: number;
        navigations: number;
        total: number;
    };
    workflowPlan?: {
        name: string;
        steps: Array<{
            level: 'L2' | 'L1' | 'L0';
            name: string;
            children?: Array<{ level: 'L1' | 'L0'; name: string; avatar?: string }>;
        }>;
    };
}

// Processing step labels from reference
const PROCESSING_STEPS = [
    { label: 'Retrieving recording', description: 'Getting metadata & event stream' },
    { label: 'Analyzing events', description: 'Identifying types & timeline' },
    { label: 'Finding patterns', description: 'User actions & state changes' },
    { label: 'Decomposing workflow', description: 'L0 → L1 → L2' },
    { label: 'Picking selectors', description: 'Stable IDs & fallbacks' },
    { label: 'Defining verification', description: 'Checkpoints & validations' },
    { label: 'Finalizing architecture', description: 'Hierarchy & dependencies' },
    { label: 'Implementing workflow', description: 'Creating & testing workflows' },
];

const RecordingExplainerDialog: React.FC<RecordingExplainerDialogProps> = ({
    isOpen,
    isRecording,
    isProcessing = false,
    isReview = false,
    onClose,
    onConfirm,
    onStopRecording,
    onApprove,
    processingState = { step: 1, totalSteps: 8, currentAction: 'Retrieving recording', progress: 0 },
    recordingStats = { clicks: 0, inputs: 0, navigations: 0, total: 0 },
    workflowPlan = { name: 'Workflow Name', steps: [] }
}) => {
    if (!isOpen) return null;

    const currentStepIndex = Math.min(processingState.step - 1, PROCESSING_STEPS.length - 1);
    const currentStep = PROCESSING_STEPS[currentStepIndex];

    // Processing view
    if (isProcessing) {
        return (
            <>
                <div className="fixed inset-0 z-[200] bg-black/40" onClick={onClose} />
                <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Processing Recording"
                        className="pointer-events-auto w-full max-w-[360px] h-[680px] max-h-[calc(100vh-32px)] bg-white rounded-[16px] shadow-xl overflow-hidden flex flex-col border border-[#cbd5e1]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header - Fixed */}
                        <div className="shrink-0 flex items-center gap-4 p-[10px] border-b border-[#cbd5e1]">
                            <h2 className="flex-1 text-lg font-semibold text-black">Processing Recording...</h2>
                            <button onClick={onClose} className="bg-[#f5f5f5] p-2 rounded-full hover:bg-[#e5e5e5] transition-colors">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M12 4L4 12M4 4L12 12" stroke="#0A0A0A" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>

                        {/* Scrollable Content Area */}
                        <div className="flex-1 overflow-y-auto min-h-0">
                            <div className="p-4 flex flex-col gap-4">
                                {/* Animation Area */}
                                <div className="bg-white h-[328px] rounded-3xl overflow-hidden flex-shrink-0">
                                    <ProcessingAnimation />
                                </div>

                                {/* Recorded Action Summary Card */}
                                <div className="bg-white rounded-xl p-2">
                                    <div className="flex flex-col gap-4">
                                        <p className="text-sm font-medium text-[#0f172a]">Recorded action Summary</p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 flex items-center gap-3">
                                                <div className="flex items-center gap-1">
                                                    <MousePointer className="w-4 h-4 text-[#334155]" />
                                                    <span className="text-xs font-medium text-[#334155]"> Clicks</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Keyboard className="w-4 h-4 text-[#334155]" />
                                                    <span className="text-xs font-medium text-[#334155]"> Input</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Navigation className="w-4 h-4 text-[#334155]" />
                                                    <span className="text-xs font-medium text-[#334155]"> Navigation</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Processing Workflow Status Card */}
                                <div className="bg-white rounded-xl p-2">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-start justify-between">
                                            <p className="text-sm font-medium text-[#0f172a]">Processing Workflow</p>
                                            <div
                                                key={processingState.step}
                                                className="bg-[rgba(56,112,255,0.1)] px-2 py-1 rounded-full"
                                                style={{ animation: 'ai-fade-in 0.3s ease-out' }}
                                            >
                                                <span className="text-xs font-medium text-[#3870ff]">Step {processingState.step}/{processingState.totalSteps}</span>
                                            </div>
                                        </div>
                                        <div
                                            key={`step-${processingState.step}`}
                                            className="flex flex-col gap-1"
                                            style={{ animation: 'ai-slide-in 0.3s ease-out' }}
                                        >
                                            <p className="text-sm font-semibold text-[#0f172a]">{currentStep.label}</p>
                                            <p className="text-xs text-[#64748b]">{currentStep.description}</p>
                                        </div>
                                        {/* Progress bar */}
                                        <div className="w-full bg-[#f1f5f9] h-1 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#3870ff]"
                                                style={{
                                                    width: `${(processingState.step / processingState.totalSteps) * 100}%`,
                                                    transition: 'width 0.5s ease-out',
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer - Fixed */}
                        <div className="shrink-0 p-[10px] border-t border-[#cbd5e1]">
                            <button onClick={onClose} className="w-full h-11 bg-white border border-[#cbd5e1] rounded-lg shadow-sm text-sm font-medium text-[#0f172a] hover:bg-[#f5f5f5] transition-colors">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
                <style>{`
                    @keyframes ai-fade-in {
                        from { opacity: 0; transform: translateY(-5px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes ai-slide-in {
                        from { opacity: 0; transform: translateX(20px); }
                        to { opacity: 1; transform: translateX(0); }
                    }
                `}</style>
            </>
        );
    }

    // Review Workflow Plan view
    if (isReview) {
        return (
            <WorkflowReview
                onClose={onClose}
                onApprove={onApprove!}
                workflowPlan={workflowPlan}
            />
        );
    }

    // Recording in progress view
    if (isRecording) {
        return (
            <>
                <div className="fixed inset-0 z-[200] bg-black/40" onClick={onClose} />
                <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Recording in progress"
                        className="pointer-events-auto w-full max-w-[360px] h-[680px] max-h-[calc(100vh-32px)] bg-white rounded-[16px] shadow-xl overflow-hidden flex flex-col border border-[#cbd5e1]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header - Fixed */}
                        <div className="shrink-0 flex items-center gap-4 p-[10px] border-b border-[#cbd5e1]">
                            <div className="flex-1 flex items-center gap-2">
                                <div
                                    className="relative w-6 h-6"
                                    style={{ animation: 'ai-dot-pulse 1.5s ease-in-out infinite' }}
                                >
                                    <div
                                        className="absolute inset-0 rounded-full bg-[#fef2f2]"
                                        style={{ animation: 'ai-dot-pulse-opacity 1.5s ease-in-out infinite' }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                                    </div>
                                </div>
                                <h2 className="text-lg font-semibold text-black">Recording in progress...</h2>
                            </div>
                            <button onClick={onClose} className="bg-[#f5f5f5] p-2 rounded-full hover:bg-[#e5e5e5] transition-colors">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M12 4L4 12M4 4L12 12" stroke="#0A0A0A" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>

                        {/* Scrollable Content Area */}
                        <div className="flex-1 overflow-y-auto min-h-0">
                            <div className="p-4 flex flex-col gap-4">
                                {/* Recording Animation */}
                                <div className="bg-[#f1f5f9] h-[328px] rounded-3xl overflow-hidden flex-shrink-0">
                                    <RecordingAnimation />
                                </div>

                                {/* Tip */}
                                <div className="p-3 bg-[#f0f9ff] rounded-lg flex gap-2 items-center h-16">
                                    <svg className="flex-shrink-0 w-6 h-6 text-[#0ea5e9]" fill="none" viewBox="0 0 24 24">
                                        <path d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M6 6h.008v.008H6V6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <p className="text-sm font-medium text-[#0ea5e9] leading-5">
                                        Tip: Keep actions focused on a single task for better workflow quality
                                    </p>
                                </div>

                                {/* Action Summary Card */}
                                <div className="bg-[#f1f5f9] rounded-xl p-2">
                                    <div className="flex flex-col gap-4">
                                        <p className="text-sm font-medium text-[#0f172a]">Recording your actions...</p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 flex items-center gap-3">
                                                <div
                                                    className="flex items-center gap-1"
                                                    style={{ animation: 'ai-bounce 0.3s ease-out' }}
                                                >
                                                    <MousePointer className="w-4 h-4 text-[#334155]" />
                                                    <span className="text-xs font-medium text-[#334155]">Clicks</span>
                                                </div>
                                                <div
                                                    className="flex items-center gap-1"
                                                    style={{ animation: 'ai-bounce 0.3s ease-out' }}
                                                >
                                                    <Keyboard className="w-4 h-4 text-[#334155]" />
                                                    <span className="text-xs font-medium text-[#334155]"> Input</span>
                                                </div>
                                                <div
                                                    className="flex items-center gap-1"
                                                    style={{ animation: 'ai-bounce 0.3s ease-out' }}
                                                >
                                                    <Navigation className="w-4 h-4 text-[#334155]" />
                                                    <span className="text-xs font-medium text-[#334155]"> Navigation</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer - Fixed */}
                        <div className="shrink-0 p-[10px] border-t border-[#cbd5e1] flex gap-2">
                            <button
                                onClick={onClose}
                                className="h-11 px-4 text-sm font-medium text-[#0a0a0a] bg-[#f5f5f5] hover:bg-[#e5e5e5] rounded-lg transition-colors shadow-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onStopRecording}
                                className="flex-1 h-11 text-xs font-medium text-white bg-[#dc2626] hover:bg-[#b91c1c] rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
                                    <rect x="6" y="6" width="4" height="4" fill="currentColor" />
                                </svg>
                                Stop Recording Actions
                            </button>
                        </div>
                    </div>
                </div>
                <style>{`
                    @keyframes ai-dot-pulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.2); }
                    }
                    @keyframes ai-dot-pulse-opacity {
                        0%, 100% { opacity: 0.3; }
                        50% { opacity: 0.6; }
                    }
                    @keyframes ai-bounce {
                        0% { transform: scale(1); }
                        50% { transform: scale(1.15); }
                        100% { transform: scale(1); }
                    }
                `}</style>
            </>
        );
    }

    // Pre-recording explainer view
    return (
        <>
            <div className="fixed inset-0 z-[200] bg-black/40" onClick={onClose} />
            <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none">
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Record a new workflow"
                    className="pointer-events-auto w-full max-w-[360px] h-[680px] max-h-[calc(100vh-32px)] bg-white rounded-[16px] shadow-xl overflow-hidden flex flex-col border border-[#cbd5e1]"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header - Fixed */}
                    <div className="shrink-0 flex items-center gap-2 p-[10px] border-b border-[#cbd5e1]">
                        <button onClick={onClose} className="p-1.5 rounded-md hover:bg-[#f1f5f9] transition-colors">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M12.5 15L7.5 10L12.5 5" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        <h2 className="flex-1 text-lg font-semibold text-black text-center">Record a new workflow</h2>
                        <button onClick={onClose} className="p-1.5 rounded-md hover:bg-[#f1f5f9] transition-colors">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M12 4L4 12M4 4L12 12" stroke="#0A0A0A" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>

                    {/* Scrollable Content Area */}
                    <div className="flex-1 overflow-y-auto min-h-0">
                        <div className="p-4 flex flex-col gap-4">
                            {/* Illustration */}
                            <div className="bg-[#f1f5f9] h-[280px] rounded-3xl overflow-hidden flex-shrink-0">
                                <RecordingIllustration />
                            </div>

                            {/* Steps */}
                            <div className="flex flex-col gap-5">
                                {/* Step 1 */}
                                <div className="flex gap-2">
                                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#e2e8f0] text-[#0f172a] flex items-center justify-center text-xs font-medium">1</div>
                                    <div className="flex flex-col gap-[2px]">
                                        <p className="text-sm font-semibold text-[#1e293b] leading-5">Perform your actions</p>
                                        <p className="text-sm text-[#334155] leading-5">Click, type and navigate as you normally would. All interactions are captured</p>
                                    </div>
                                </div>

                                {/* Step 2 */}
                                <div className="flex gap-2">
                                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#e2e8f0] text-[#0f172a] flex items-center justify-center text-xs font-medium">2</div>
                                    <div className="flex flex-col gap-[2px]">
                                        <p className="text-sm font-semibold text-[#1e293b] leading-5">Click "Stop Recording"</p>
                                        <p className="text-sm text-[#334155] leading-5">When you're done, click the button again to stop the recording</p>
                                    </div>
                                </div>

                                {/* Step 3 */}
                                <div className="flex gap-2">
                                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#e2e8f0] text-[#0f172a] flex items-center justify-center text-xs font-medium">3</div>
                                    <div className="flex flex-col gap-[2px]">
                                        <p className="text-sm font-semibold text-[#1e293b] leading-5">Workflows are generated</p>
                                        <p className="text-sm text-[#334155] leading-5">100x Bot analyzes your actions and creates reusable workflows you can run anytime</p>
                                    </div>
                                </div>
                            </div>

                            {/* Tip */}
                            <div className="p-3 bg-[#f0f9ff] rounded-lg flex gap-2 items-center h-16">
                                <svg className="flex-shrink-0 w-6 h-6 text-[#0ea5e9]" fill="none" viewBox="0 0 24 24">
                                    <path d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M6 6h.008v.008H6V6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <p className="text-sm font-medium text-[#0ea5e9] leading-5">
                                    Tip: Keep actions focused on a single task for better workflow quality
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer - Fixed */}
                    <div className="shrink-0 p-[10px] border-t border-[#cbd5e1]">
                        <button
                            onClick={onConfirm}
                            className="w-full h-11 py-3 text-xs font-medium text-[#f8fafc] bg-[#020617] hover:bg-[#1e293b] rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <MousePointer className="w-4 h-4" />
                            Start Recording Actions
                        </button>
                    </div>
                </div>
            </div >
        </>
    );
};

export default RecordingExplainerDialog;
