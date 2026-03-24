import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Cpu } from 'lucide-react';

export default function ProcessingAnimation() {
    const shouldReduceMotion = useReducedMotion();
    return (
        <div className="relative w-full h-[280px] overflow-hidden rounded-[16px] flex items-center justify-center"
            style={{ backgroundColor: 'var(--ai-surface-tertiary)' }}>
            {/* Central processing indicator */}
            <div className="relative flex items-center justify-center">
                {/* Pulsing ring */}
                {!shouldReduceMotion && (
                    <>
                        <motion.div
                            className="absolute rounded-full"
                            style={{
                                width: '100px',
                                height: '100px',
                                border: '2px solid var(--ai-status-working)',
                                opacity: 0.2,
                            }}
                            animate={{
                                scale: [1, 1.3, 1],
                                opacity: [0.2, 0.05, 0.2],
                            }}
                            transition={{
                                duration: 2.5,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                        <motion.div
                            className="absolute rounded-full"
                            style={{
                                width: '80px',
                                height: '80px',
                                border: '2px solid var(--ai-status-working)',
                                opacity: 0.15,
                            }}
                            animate={{
                                scale: [1, 1.4, 1],
                                opacity: [0.15, 0.03, 0.15],
                            }}
                            transition={{
                                duration: 2.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 0.8,
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
                    <motion.div
                        animate={shouldReduceMotion ? undefined : { rotate: 360 }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    >
                        <Cpu className="w-7 h-7" style={{ color: 'var(--ai-text-on-dark)' }} strokeWidth={1.5} />
                    </motion.div>
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
        </div>
    );
}
