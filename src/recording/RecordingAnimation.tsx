import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MousePointer, Keyboard, Navigation } from 'lucide-react';

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

    return (
        <div className="flex items-center justify-center w-full h-full">
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
                            <motion.div
                                key={`${colIndex}-${rowIndex}`}
                                className="absolute left-1/2 -translate-x-1/2 text-slate-300 font-mono text-xs opacity-30"
                                animate={{
                                    y: [-30, 280],
                                    opacity: [0, 0.3, 0.3, 0],
                                }}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "linear",
                                    delay: colIndex * 0.2 + rowIndex * 0.6
                                }}
                            >
                                {Math.random() > 0.5 ? '1' : '0'}
                            </motion.div>
                        ))}

                        {/* Data particles */}
                        <motion.div
                            className="absolute left-1/2 -translate-x-1/2 w-1.5 h-4 bg-slate-400 rounded-full"
                            animate={{
                                y: [-20, 280],
                                opacity: [0, 0.6, 0],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "linear",
                                delay: colIndex * 0.15
                            }}
                        />
                    </div>
                ))}

                {/* Central recording indicator */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <motion.div
                        className="relative w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-lg flex items-center justify-center"
                        animate={{
                            boxShadow: [
                                '0 0 25px rgba(239, 68, 68, 0.4)',
                                '0 0 50px rgba(239, 68, 68, 0.6)',
                                '0 0 25px rgba(239, 68, 68, 0.4)',
                            ],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <motion.div
                            className="w-5 h-5 bg-white rounded-full"
                            animate={{
                                scale: [1, 1.3, 1],
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                    </motion.div>

                    {/* Horizontal scanning lines */}
                    {[-1, 0, 1].map((offset, index) => (
                        <motion.div
                            key={index}
                            className="absolute left-1/2 -translate-x-1/2 h-[2px] w-40 bg-gradient-to-r from-transparent via-slate-400 to-transparent"
                            style={{
                                top: `calc(50% + ${offset * 28}px)`,
                            }}
                            animate={{
                                opacity: [0.2, 0.6, 0.2],
                                scaleX: [0.8, 1.2, 0.8],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: index * 0.3
                            }}
                        />
                    ))}
                </div>

                {/* Floating action icons */}
                {icons.map((Icon, index) => {
                    const positions = [
                        { xPercent: 15, startY: -20, endY: 280 },
                        { xPercent: 50, startY: -30, endY: 290 },
                        { xPercent: 85, startY: -25, endY: 285 },
                    ];
                    const pos = positions[index];

                    return (
                        <motion.div
                            key={index}
                            className="absolute bg-white/95 backdrop-blur-sm rounded-lg p-2.5 shadow-md border border-slate-200"
                            style={{
                                left: `${pos.xPercent}%`,
                                transform: 'translateX(-50%)',
                            }}
                            animate={{
                                y: [pos.startY, pos.endY],
                                opacity: [0, 1, 1, 0],
                            }}
                            transition={{
                                duration: 5,
                                repeat: Infinity,
                                ease: "linear",
                                delay: index * 1.6
                            }}
                        >
                            <Icon className="w-6 h-6 text-slate-600" strokeWidth={2} />
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
