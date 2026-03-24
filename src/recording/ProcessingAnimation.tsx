import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Zap, Sparkles, Cog } from 'lucide-react';

export default function ProcessingAnimation() {
    return (
        <div className="relative w-full h-[280px] overflow-hidden rounded-[16px]">
            {/* Central processing orb */}
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.div className="relative">
                    {/* Pulsing glow */}
                    <motion.div
                        className="absolute rounded-full bg-purple-400"
                        style={{
                            width: '100px',
                            height: '100px',
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            filter: 'blur(20px)',
                        }}
                        animate={{
                            opacity: [0.3, 0.6, 0.3],
                            scale: [1, 1.2, 1],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />

                    {/* Center core */}
                    <motion.div
                        className="relative rounded-full bg-gradient-to-br from-purple-500 via-violet-500 to-purple-600 shadow-2xl flex items-center justify-center"
                        style={{
                            width: '90px',
                            height: '90px',
                        }}
                        animate={{
                            boxShadow: [
                                '0 0 20px rgba(147, 51, 234, 0.5)',
                                '0 0 40px rgba(147, 51, 234, 0.8)',
                                '0 0 20px rgba(147, 51, 234, 0.5)',
                            ],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <motion.div
                            animate={{
                                rotate: 360,
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                        >
                            <Cpu className="w-10 h-10 text-white" strokeWidth={1.5} />
                        </motion.div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Processing stage indicators */}
            {[
                { icon: Zap, angle: 0, color: 'text-yellow-500', delay: 0 },
                { icon: Sparkles, angle: 120, color: 'text-pink-500', delay: 0.3 },
                { icon: Cog, angle: 240, color: 'text-blue-500', delay: 0.6 },
            ].map((item, index) => {
                const Icon = item.icon;
                const radius = 110;
                const x = Math.cos((item.angle * Math.PI) / 180) * radius;
                const y = Math.sin((item.angle * Math.PI) / 180) * radius;

                return (
                    <motion.div
                        key={index}
                        className="absolute"
                        style={{
                            left: '50%',
                            top: '50%',
                        }}
                        animate={{
                            x: [0, x, 0],
                            y: [0, y, 0],
                            scale: [0, 1, 0],
                            opacity: [0, 1, 0],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: item.delay,
                        }}
                    >
                        <div className="bg-white rounded-full p-3 shadow-xl">
                            <Icon className={`w-6 h-6 ${item.color}`} />
                        </div>
                    </motion.div>
                );
            })}

            {/* Data stream particles */}
            {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 30) * (Math.PI / 180);
                const startRadius = 55;
                const endRadius = 140;

                return (
                    <motion.div
                        key={`stream-${i}`}
                        className="absolute rounded-full"
                        style={{
                            width: '6px',
                            height: '6px',
                            left: '50%',
                            top: '50%',
                            background: i % 3 === 0 ? '#ec4899' : i % 3 === 1 ? '#ef4444' : '#f97316',
                        }}
                        animate={{
                            x: [
                                Math.cos(angle) * startRadius,
                                Math.cos(angle) * endRadius,
                            ],
                            y: [
                                Math.sin(angle) * startRadius,
                                Math.sin(angle) * endRadius,
                            ],
                            opacity: [1, 0],
                            scale: [1, 0.5],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeOut",
                            delay: i * 0.15,
                            repeatDelay: 0.5,
                        }}
                    />
                );
            })}

            {/* Rotating segments */}
            {[0, 1, 2, 3].map((i) => (
                <motion.div
                    key={`segment-${i}`}
                    className="absolute"
                    style={{
                        width: '140px',
                        height: '140px',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                    }}
                >
                    <svg width="140" height="140" viewBox="0 0 140 140">
                        <motion.path
                            d={`M 70 70 L ${70 + 60 * Math.cos((i * 90) * Math.PI / 180)} ${70 + 60 * Math.sin((i * 90) * Math.PI / 180)} A 60 60 0 0 1 ${70 + 60 * Math.cos((i * 90 + 30) * Math.PI / 180)} ${70 + 60 * Math.sin((i * 90 + 30) * Math.PI / 180)} Z`}
                            fill="rgb(196, 181, 253)"
                            opacity="0.3"
                            animate={{
                                rotate: 360,
                            }}
                            transition={{
                                duration: 10,
                                repeat: Infinity,
                                ease: "linear",
                                delay: i * 0.5,
                            }}
                            style={{
                                transformOrigin: '70px 70px',
                            }}
                        />
                    </svg>
                </motion.div>
            ))}

            {/* Progress wave effect */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                <defs>
                    <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgb(147, 51, 234)" stopOpacity="0" />
                        <stop offset="50%" stopColor="rgb(147, 51, 234)" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="rgb(147, 51, 234)" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {[0, 1, 2].map((i) => (
                    <motion.circle
                        key={`wave-${i}`}
                        cx="50%"
                        cy="50%"
                        r="20"
                        stroke="url(#waveGradient)"
                        strokeWidth="3"
                        fill="none"
                        initial={{ r: 20, opacity: 0 }}
                        animate={{
                            r: [20, 100, 20],
                            opacity: [0, 0.6, 0],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeOut",
                            delay: i * 1,
                        }}
                    />
                ))}
            </svg>

            {/* Hexagonal grid background */}
            <div className="absolute inset-0 opacity-5">
                <svg width="100%" height="100%">
                    <defs>
                        <pattern id="hexPattern" width="30" height="26" patternUnits="userSpaceOnUse" patternTransform="scale(1.5)">
                            <path
                                d="M15,0 L30,7.5 L30,22.5 L15,30 L0,22.5 L0,7.5 Z"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="0.5"
                                className="text-purple-500"
                            />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#hexPattern)" />
                </svg>
            </div>
        </div>
    );
}
