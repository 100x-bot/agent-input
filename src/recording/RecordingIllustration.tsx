import React, { useState, useEffect } from 'react';
import { MousePointer2, Type, Navigation2, Globe } from '../icons';

function useReducedMotion() {
    const [shouldReduceMotion, setShouldReduceMotion] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        setShouldReduceMotion(mq.matches);
        const handler = (e: MediaQueryListEvent) => setShouldReduceMotion(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);
    return shouldReduceMotion;
}

// Recording Illustration Component (from reference)
export default function RecordingIllustration() {
    const shouldReduceMotion = useReducedMotion();
    const animStyle = (animation: string) => shouldReduceMotion ? undefined : { animation };

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
            <div
                style={animStyle('ai-fade-in 0.5s ease-out')}
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
                    <div
                        style={animStyle('ai-cursor-move 6s ease-in-out infinite')}
                        className="absolute top-16 left-8"
                    >
                        <MousePointer2 className="w-5 h-5 text-blue-600" />
                    </div>

                    {/* Elements being clicked */}
                    <div
                        style={animStyle('ai-highlight-1 6s ease-in-out infinite')}
                        className="h-6 w-32 rounded bg-slate-100"
                    />

                    <div
                        style={animStyle('ai-highlight-2 6s ease-in-out infinite')}
                        className="h-6 w-24 rounded bg-slate-100"
                    />

                    <div
                        style={animStyle('ai-highlight-3 6s ease-in-out infinite')}
                        className="h-6 w-28 rounded bg-slate-100"
                    />
                </div>

                {/* Recording indicator */}
                <div
                    style={animStyle('ai-blink 2s infinite')}
                    className="absolute top-2 right-2 flex items-center gap-1.5 bg-red-50 px-2 py-1 rounded-full"
                >
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-[10px] font-medium text-red-700">REC</span>
                </div>
            </div>

            {/* Action icons floating */}
            <div
                style={animStyle('ai-float 4s ease-in-out infinite')}
                className="absolute bottom-8 left-8 p-2 bg-green-100 rounded-lg"
            >
                <Type className="w-6 h-6 text-green-600" />
            </div>

            <div
                style={animStyle('ai-float 4s ease-in-out infinite 0.5s')}
                className="absolute top-12 right-8 p-2 bg-purple-100 rounded-lg"
            >
                <Navigation2 className="w-6 h-6 text-purple-600" />
            </div>

            <div
                style={animStyle('ai-float 4s ease-in-out infinite 1s')}
                className="absolute bottom-12 right-12 p-2 bg-sky-100 rounded-lg"
            >
                <Globe className="w-6 h-6 text-sky-600" />
            </div>

            <style>{`
                @keyframes ai-fade-in {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes ai-cursor-move {
                    0% { transform: translate(0px, 0px); }
                    16.6% { transform: translate(40px, 0px); }
                    33.3% { transform: translate(40px, 30px); }
                    50% { transform: translate(80px, 30px); }
                    66.6% { transform: translate(80px, 60px); }
                    100% { transform: translate(0px, 60px); }
                }
                @keyframes ai-highlight-1 {
                    0%, 15% { transform: scale(1); background-color: #f1f5f9; }
                    20% { transform: scale(1.05); background-color: #dbeafe; }
                    25%, 100% { transform: scale(1); background-color: #f1f5f9; }
                }
                @keyframes ai-highlight-2 {
                    0%, 35% { transform: scale(1); background-color: #f1f5f9; }
                    40% { transform: scale(1.05); background-color: #dbeafe; }
                    45%, 100% { transform: scale(1); background-color: #f1f5f9; }
                }
                @keyframes ai-highlight-3 {
                    0%, 65% { transform: scale(1); background-color: #f1f5f9; }
                    75% { transform: scale(1.05); background-color: #dbeafe; }
                    80%, 100% { transform: scale(1); background-color: #f1f5f9; }
                }
                @keyframes ai-blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
                @keyframes ai-float {
                    0%, 100% { transform: translateY(-10px) rotate(0deg); }
                    25% { transform: translateY(0px) rotate(5deg); }
                    50% { transform: translateY(10px) rotate(0deg); }
                    75% { transform: translateY(0px) rotate(-5deg); }
                }
            `}</style>
        </div>
    );
}
