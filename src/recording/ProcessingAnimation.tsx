import React, { useState, useEffect } from 'react';
import { Cpu } from '../icons';

export default function ProcessingAnimation() {
    const [shouldReduceMotion, setShouldReduceMotion] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        setShouldReduceMotion(mq.matches);
        const handler = (e: MediaQueryListEvent) => setShouldReduceMotion(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    return (
        <div className="relative w-full h-[280px] overflow-hidden rounded-[16px] flex items-center justify-center"
            style={{ backgroundColor: 'var(--ai-surface-tertiary)' }}>
            {/* Central processing indicator */}
            <div className="relative flex items-center justify-center">
                {/* Pulsing rings */}
                {!shouldReduceMotion && (
                    <>
                        <div
                            className="absolute rounded-full"
                            style={{
                                width: '100px',
                                height: '100px',
                                border: '2px solid var(--ai-status-working)',
                                animation: 'ai-pulse-ring 2.5s ease-in-out infinite',
                            }}
                        />
                        <div
                            className="absolute rounded-full"
                            style={{
                                width: '80px',
                                height: '80px',
                                border: '2px solid var(--ai-status-working)',
                                animation: 'ai-pulse-ring 2.5s ease-in-out 0.8s infinite',
                            }}
                        />
                    </>
                )}

                {/* Center orb */}
                <div
                    className="relative rounded-full flex items-center justify-center"
                    style={{
                        width: '64px',
                        height: '64px',
                        backgroundColor: 'var(--ai-status-working)',
                    }}
                >
                    <div style={shouldReduceMotion ? undefined : { animation: 'ai-rotate 4s linear infinite' }}>
                        <Cpu className="w-7 h-7" style={{ color: 'var(--ai-text-on-dark)' }} strokeWidth={1.5} />
                    </div>
                </div>
            </div>

            {/* Subtle dot grid background */}
            <div className="absolute inset-0 opacity-[0.04]" aria-hidden="true">
                <svg width="100%" height="100%">
                    <defs>
                        <pattern id="dotGrid" width="24" height="24" patternUnits="userSpaceOnUse">
                            <circle cx="2" cy="2" r="1" fill="currentColor" style={{ color: 'var(--ai-text-primary)' }} />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#dotGrid)" />
                </svg>
            </div>

            <style>{`
                @keyframes ai-pulse-ring {
                    0% { transform: scale(1); opacity: 0.2; }
                    50% { transform: scale(1.3); opacity: 0.05; }
                    100% { transform: scale(1); opacity: 0.2; }
                }
                @keyframes ai-rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
