import React from 'react';

const LoadingSpinner: React.FC = () => (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 16 16" style={{ color: 'var(--ai-text-muted)' }}>
        <circle
            cx="8"
            cy="8"
            r="6"
            stroke="currentColor"
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

export default LoadingSpinner;
