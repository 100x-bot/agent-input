import React, { useState, useEffect } from 'react';
import { MousePointer, Keyboard, Navigation } from '../icons';

function useReducedMotion(): boolean {
    const [reduced, setReduced] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });

    useEffect(() => {
        const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
        const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, []);

    return reduced;
}

const keyframes = `
@keyframes ra-stream-down {
    0% { transform: translateX(-50%) translateY(-30px); opacity: 0; }
    10% { opacity: 0.3; }
    90% { opacity: 0.3; }
    100% { transform: translateX(-50%) translateY(280px); opacity: 0; }
}
@keyframes ra-particle-down {
    0% { transform: translateX(-50%) translateY(-20px); opacity: 0; }
    50% { opacity: 0.6; }
    100% { transform: translateX(-50%) translateY(280px); opacity: 0; }
}
@keyframes ra-glow-pulse {
    0%, 100% { box-shadow: 0 0 25px rgba(239, 68, 68, 0.4); }
    50% { box-shadow: 0 0 50px rgba(239, 68, 68, 0.6); }
}
@keyframes ra-dot-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.3); }
}
@keyframes ra-scan-line {
    0%, 100% { opacity: 0.2; transform: translateX(-50%) scaleX(0.8); }
    50% { opacity: 0.6; transform: translateX(-50%) scaleX(1.2); }
}
@keyframes ra-icon-float {
    0% { opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { opacity: 0; }
}
@keyframes ra-icon-translate {
    0% { transform: translateX(-50%) translateY(var(--ra-start-y)); }
    100% { transform: translateX(-50%) translateY(var(--ra-end-y)); }
}
`;

// Recording Animation Component (Data Stream style from reference)
export default function RecordingAnimation() {
    const shouldReduceMotion = useReducedMotion();

    if (shouldReduceMotion) {
        return (
            <div className="flex items-center justify-center w-full h-full" style={{ backgroundColor: 'var(--ai-surface-tertiary)' }}>
                <div className="flex items-center gap-4">
                    <MousePointer className="w-5 h-5" style={{ color: 'var(--ai-text-muted)' }} />
                    <Keyboard className="w-5 h-5" style={{ color: 'var(--ai-text-muted)' }} />
                    <Navigation className="w-5 h-5" style={{ color: 'var(--ai-text-muted)' }} />
                </div>
            </div>
        );
    }

    const dataColumns = 10;
    const icons = [MousePointer, Keyboard, Navigation];
    const iconPositions = [
        { xPercent: 15, startY: -20, endY: 280 },
        { xPercent: 50, startY: -30, endY: 290 },
        { xPercent: 85, startY: -25, endY: 285 },
    ];

    return (
        <div className="flex items-center justify-center w-full h-full">
            <style>{keyframes}</style>
            <div className="relative w-full h-full overflow-hidden rounded-lg bg-slate-50">
                {/* Data stream columns */}
                {Array.from({ length: dataColumns }).map((_, colIndex) => (
                    <div
                        key={colIndex}
                        className="absolute top-0 bottom-0"
                        style={{
                            left: `${(colIndex / dataColumns) * 100}%`,
                            width: `${100 / dataColumns}%`,
                        }}
                    >
                        {/* Binary digits streaming down */}
                        {[0, 1, 2, 3, 4, 5, 6].map((rowIndex) => (
                            <div
                                key={`${colIndex}-${rowIndex}`}
                                className="absolute left-1/2 text-slate-300 font-mono text-xs"
                                style={{
                                    animation: `ra-stream-down 4s linear ${colIndex * 0.2 + rowIndex * 0.6}s infinite`,
                                    opacity: 0,
                                }}
                            >
                                {Math.random() > 0.5 ? '1' : '0'}
                            </div>
                        ))}

                        {/* Data particles */}
                        <div
                            className="absolute left-1/2 w-1.5 h-4 bg-slate-400 rounded-full"
                            style={{
                                animation: `ra-particle-down 3s linear ${colIndex * 0.15}s infinite`,
                                opacity: 0,
                            }}
                        />
                    </div>
                ))}

                {/* Central recording indicator */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <div
                        className="relative w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-lg flex items-center justify-center"
                        style={{
                            animation: 'ra-glow-pulse 2s ease-in-out infinite',
                        }}
                    >
                        <div
                            className="w-5 h-5 bg-white rounded-full"
                            style={{
                                animation: 'ra-dot-pulse 1.5s ease-in-out infinite',
                            }}
                        />
                    </div>

                    {/* Horizontal scanning lines */}
                    {[-1, 0, 1].map((offset, index) => (
                        <div
                            key={index}
                            className="absolute left-1/2 h-[2px] w-40 bg-gradient-to-r from-transparent via-slate-400 to-transparent"
                            style={{
                                top: `calc(50% + ${offset * 28}px)`,
                                animation: `ra-scan-line 2s ease-in-out ${index * 0.3}s infinite`,
                            }}
                        />
                    ))}
                </div>

                {/* Floating action icons */}
                {icons.map((Icon, index) => {
                    const pos = iconPositions[index];

                    return (
                        <div
                            key={index}
                            className="absolute bg-white/95 backdrop-blur-sm rounded-lg p-2.5 shadow-md border border-slate-200"
                            style={{
                                left: `${pos.xPercent}%`,
                                ['--ra-start-y' as string]: `${pos.startY}px`,
                                ['--ra-end-y' as string]: `${pos.endY}px`,
                                animation: `ra-icon-float 5s linear ${index * 1.6}s infinite, ra-icon-translate 5s linear ${index * 1.6}s infinite`,
                                opacity: 0,
                            }}
                        >
                            <Icon className="w-6 h-6 text-slate-600" strokeWidth={2} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
