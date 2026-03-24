import React from 'react';

export interface ExpandableHistoryProps {
    items: string[];
    isLoading: boolean;
    selectedIndex: number;
    isNavigating: boolean;
    onSelect: (item: string) => void;
}

const ClockIcon = () => (
    <svg className="w-4 h-4 text-theme-text-muted" fill="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_9095_4025)">
            <circle
                cx="7.99967"
                cy="7.99967"
                r="6.66667"
                stroke="#5E5D73"
                strokeWidth="1.14286"
            />
            <path
                d="M8 5.33301V7.99967L9.33333 9.33301"
                stroke="#5E5D73"
                strokeWidth="1.14286"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </g>
        <defs>
            <clipPath id="clip0_9095_4025">
                <rect width="16" height="16" fill="white" />
            </clipPath>
        </defs>
    </svg>
);

const LoadingSpinner = () => (
    <svg className="w-4 h-4 text-theme-text-muted animate-spin" fill="none" viewBox="0 0 16 16">
        <circle
            cx="8"
            cy="8"
            r="6"
            stroke="#5E5D73"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="31.416"
            strokeDashoffset="31.416"
        >
            <animate
                attributeName="stroke-dasharray"
                dur="2s"
                values="0 31.416;15.708 15.708;0 31.416"
                repeatCount="indefinite"
            />
            <animate
                attributeName="stroke-dashoffset"
                dur="2s"
                values="0;-15.708;-31.416"
                repeatCount="indefinite"
            />
        </circle>
    </svg>
);

const ExpandableHistory: React.FC<ExpandableHistoryProps> = ({
    items,
    isLoading,
    selectedIndex,
    isNavigating,
    onSelect
}) => {
    if (items.length === 0 && !isLoading) {
        return null;
    }

    return (
        <div className="px-[24px] pt-[20px] pb-[18px]">
            <h3 className="text-[#5E5D73] mb-2 font-dm-mono text-[12px] font-[400]">
                History
            </h3>
            <div className="flex flex-col items-stretch">
                {/* Loading state */}
                {isLoading && (
                    <div className="flex items-center gap-2 p-2">
                        <div className="w-4 h-4">
                            <LoadingSpinner />
                        </div>
                        <span className="text-sm text-theme-text-muted text-[14px] font-[400]">
                            Loading history...
                        </span>
                    </div>
                )}

                {/* History items */}
                {!isLoading && items.length > 0 && items.map((historyItem, index) => {
                    const isSelected = selectedIndex === index && isNavigating;

                    return (
                        <div
                            key={index}
                            className={`flex items-center gap-2 p-2 rounded-[4px] cursor-pointer transition-colors ${
                                isSelected ? "bg-theme-surface-hover" : "hover:bg-theme-surface-hover"
                            }`}
                            onMouseDown={() => {
                                let commandToUse = historyItem;
                                if (historyItem.startsWith("/") && historyItem.includes(" - ")) {
                                    commandToUse = historyItem.split(" - ")[0].trim();
                                }
                                onSelect(commandToUse);
                            }}
                        >
                            <div className="w-4 h-4">
                                <ClockIcon />
                            </div>
                            <span className="text-sm text-[#5E5D73] line-clamp-1 truncate text-[14px] font-[400]">
                                {historyItem}
                            </span>
                        </div>
                    );
                })}

                {/* Empty state */}
                {!isLoading && items.length === 0 && (
                    <div className="flex items-center gap-2 p-2">
                        <div className="w-4 h-4">
                            <ClockIcon />
                        </div>
                        <span className="text-sm text-theme-text-muted text-[14px] font-[400]">
                            No history available
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExpandableHistory;
