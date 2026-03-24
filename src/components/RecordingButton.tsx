import React from 'react';
import type { RecordingState, RecordingButtonContent } from '../types';

export interface RecordingButtonProps {
    recordingState: RecordingState;
    disabled: boolean;
    onClick: () => void;
    buttonContent: RecordingButtonContent;
}

const RecordingButton: React.FC<RecordingButtonProps> = ({
    recordingState,
    disabled,
    onClick,
    buttonContent
}) => {
    const { recordingTitle, recordingButtonLabel, recordingButtonIcon } = buttonContent;

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={recordingTitle}
            className="group flex h-8 items-center gap-2 px-2 bg-white rounded-lg border border-[#cbd5e1] justify-center cursor-pointer hover:bg-[#f8fafc] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm active:scale-95"
        >
            <div className="flex-shrink-0">
                {recordingButtonIcon}
            </div>
            <span className="text-sm font-medium text-[#1e293b] whitespace-nowrap group-hover:text-[#0f172a]">
                {recordingButtonLabel}
            </span>
        </button>
    );
};

export default RecordingButton;
