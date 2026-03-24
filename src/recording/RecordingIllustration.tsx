import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MousePointer2, Type, Navigation2, Globe } from 'lucide-react';

// Recording Illustration Component (from reference)
export default function RecordingIllustration() {
    const shouldReduceMotion = useReducedMotion();
    return (
        <div className="flex items-center justify-center w-full h-full relative overflow-hidden">
            {/* Background grid */}
            <div className="absolute inset-0 opacity-10">
                <div className="w-full h-full" style={{
                    backgroundImage: 'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }} />
            </div>

            {/* Browser window mockup */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative w-[240px] h-[180px] bg-white rounded-lg shadow-xl border border-slate-200"
            >
                {/* Browser header */}
                <div className="h-8 bg-slate-100 rounded-t-lg border-b border-slate-200 flex items-center px-3 gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>

                {/* Browser content */}
                <div className="p-4 space-y-3">
                    {/* Animated cursor clicking */}
                    <motion.div
                        animate={shouldReduceMotion ? undefined : {
                            x: [0, 40, 40, 80, 80, 0],
                            y: [0, 0, 30, 30, 60, 60],
                        }}
                        transition={{
                            duration: 6,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute top-16 left-8"
                    >
                        <MousePointer2 className="w-5 h-5 text-blue-600" />
                    </motion.div>

                    {/* Elements being clicked */}
                    <motion.div
                        animate={{
                            scale: [1, 1, 1.05, 1, 1, 1],
                            backgroundColor: ['#f1f5f9', '#f1f5f9', '#dbeafe', '#f1f5f9', '#f1f5f9', '#f1f5f9']
                        }}
                        transition={{
                            duration: 6,
                            repeat: Infinity,
                            times: [0, 0.15, 0.2, 0.25, 0.9, 1]
                        }}
                        className="h-6 w-32 rounded bg-slate-100"
                    />

                    <motion.div
                        animate={{
                            scale: [1, 1, 1, 1.05, 1, 1],
                            backgroundColor: ['#f1f5f9', '#f1f5f9', '#f1f5f9', '#dbeafe', '#f1f5f9', '#f1f5f9']
                        }}
                        transition={{
                            duration: 6,
                            repeat: Infinity,
                            times: [0, 0.3, 0.35, 0.4, 0.45, 1]
                        }}
                        className="h-6 w-24 rounded bg-slate-100"
                    />

                    <motion.div
                        animate={{
                            scale: [1, 1, 1, 1, 1.05, 1],
                            backgroundColor: ['#f1f5f9', '#f1f5f9', '#f1f5f9', '#f1f5f9', '#dbeafe', '#f1f5f9']
                        }}
                        transition={{
                            duration: 6,
                            repeat: Infinity,
                            times: [0, 0.6, 0.65, 0.7, 0.75, 1]
                        }}
                        className="h-6 w-28 rounded bg-slate-100"
                    />
                </div>

                {/* Recording indicator */}
                <motion.div
                    animate={shouldReduceMotion ? undefined : { opacity: [1, 0.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute top-2 right-2 flex items-center gap-1.5 bg-red-50 px-2 py-1 rounded-full"
                >
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-[10px] font-medium text-red-700">REC</span>
                </motion.div>
            </motion.div>

            {/* Action icons floating */}
            <motion.div
                animate={{
                    y: [-10, 10, -10],
                    rotate: [0, 5, 0, -5, 0]
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute bottom-8 left-8 p-2 bg-green-100 rounded-lg"
            >
                <Type className="w-6 h-6 text-green-600" />
            </motion.div>

            <motion.div
                animate={{
                    y: [10, -10, 10],
                    rotate: [0, -5, 0, 5, 0]
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                }}
                className="absolute top-12 right-8 p-2 bg-purple-100 rounded-lg"
            >
                <Navigation2 className="w-6 h-6 text-purple-600" />
            </motion.div>

            <motion.div
                animate={{
                    y: [-5, 5, -5],
                    rotate: [0, 3, 0, -3, 0]
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                }}
                className="absolute bottom-12 right-12 p-2 bg-sky-100 rounded-lg"
            >
                <Globe className="w-6 h-6 text-sky-600" />
            </motion.div>
        </div>
    );
}
