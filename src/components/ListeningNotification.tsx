import React, { useEffect } from 'react';
import { useAgentInput } from '../context/AgentInputProvider';

interface ListeningNotificationProps {
  isListening: boolean;
  isProcessing: boolean;
  interimTranscript?: string;
  autoSubmitCountdown?: number;
  onCancel?: () => void;
}

const ListeningNotification: React.FC<ListeningNotificationProps> = ({
  isListening,
  isProcessing,
  interimTranscript,
  autoSubmitCountdown,
  onCancel
}) => {
  const { theme } = useAgentInput();
  const currentTheme = theme?.currentTheme ?? { name: 'light' };
  const shouldShow = isListening || isProcessing;

  // Handle Escape key to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && shouldShow && onCancel) {
        e.preventDefault();
        onCancel();
      }
    };

    if (shouldShow) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [shouldShow, onCancel]);

  if (!shouldShow) return null;

  return (
    <div className={`
      fixed top-20 right-5 z-[9999]
      transition-all duration-500 ease-out
      ${shouldShow ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'}
    `}>
      <div className="relative">
        {/* Animated gradient border */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 opacity-75 blur-sm animate-pulse"></div>
        
        {/* Glass container */}
        <div 
          className="relative rounded-2xl p-[2px] overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(59, 130, 246, 0.3) 50%, rgba(6, 182, 212, 0.3) 100%)',
          }}
        >
          <div 
            className="relative rounded-2xl px-6 py-3"
            style={{
              background: currentTheme.name === 'night'
                ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(20, 20, 20, 0.9) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)',
              backdropFilter: 'blur(40px) saturate(200%)',
              WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              boxShadow: currentTheme.name === 'night'
                ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
                : '0 25px 50px -12px rgba(0, 0, 0, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.9)',
              minWidth: '320px',
            }}
          >
            {/* Header row with status and cancel */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                {/* Premium microphone orb */}
                <div className="relative">
                  {/* Ripple effect container */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="absolute w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-30 animate-ping"></div>
                    <div className="absolute w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-20 animate-ping animation-delay-200"></div>
                    <div className="absolute w-5 h-5 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-10 animate-ping animation-delay-400"></div>
                  </div>
                  
                  {/* Glass orb container */}
                  <div className="relative w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      background: currentTheme.name === 'night'
                        ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)'
                        : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                      backdropFilter: 'blur(10px)',
                      boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.2), 0 4px 12px rgba(59, 130, 246, 0.2)',
                    }}
                  >
                    <svg 
                      className="w-4 h-4 relative z-10" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                      style={{
                        color: currentTheme.name === 'night' ? 'white' : 'rgb(30, 64, 175)',
                        filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))',
                      }}
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  </div>
                </div>
                
                {/* Status text with gradient */}
                <div className="flex items-center gap-2">
                  <span 
                    className="text-sm font-semibold tracking-wide"
                    style={{
                      background: isProcessing 
                        ? 'linear-gradient(90deg, #8b5cf6, #3b82f6, #06b6d4, #8b5cf6)'
                        : 'linear-gradient(90deg, #3b82f6, #06b6d4, #3b82f6)',
                      backgroundSize: isProcessing ? '300% 100%' : '200% 100%',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      animation: isProcessing ? 'gradient-shift 2s linear infinite' : 'gradient-shift 3s linear infinite',
                    }}
                  >
                    {isProcessing ? 'Processing your voice' : 'Listening to you'}
                  </span>
                  
                  {/* Sound wave bars */}
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-gradient-to-t from-blue-400 to-purple-400 rounded-full"
                        style={{
                          height: isProcessing ? '14px' : '8px',
                          animation: `sound-wave 1.${i + 2}s ease-in-out infinite`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Premium cancel button */}
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="relative p-2 rounded-xl group"
                  style={{
                    background: currentTheme.name === 'night'
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(0, 0, 0, 0.05)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid',
                    borderColor: currentTheme.name === 'night'
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(0, 0, 0, 0.1)',
                  }}
                  title="Stop listening (Esc)"
                >
                  <svg 
                    className="w-4 h-4 transition-all group-hover:scale-110 group-hover:rotate-90" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                    style={{
                      color: currentTheme.name === 'night' 
                        ? 'rgba(255, 255, 255, 0.8)'
                        : 'rgba(0, 0, 0, 0.7)',
                    }}
                  >
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* Interim transcript without typewriter effect */}
            {interimTranscript && (
              <div 
                className="rounded-xl px-3 py-2 mb-2"
                style={{
                  background: currentTheme.name === 'night'
                    ? 'rgba(59, 130, 246, 0.1)'
                    : 'rgba(59, 130, 246, 0.05)',
                  border: '1px solid',
                  borderColor: currentTheme.name === 'night'
                    ? 'rgba(59, 130, 246, 0.2)'
                    : 'rgba(59, 130, 246, 0.1)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div 
                  className="text-xs mb-1 font-medium"
                  style={{
                    color: currentTheme.name === 'night' 
                      ? 'rgba(255, 255, 255, 0.6)' 
                      : 'rgba(0, 0, 0, 0.6)',
                  }}
                >
                  Transcript
                </div>
                <div 
                  className="text-sm font-medium"
                  style={{
                    color: currentTheme.name === 'night' 
                      ? 'rgba(255, 255, 255, 0.9)' 
                      : 'rgba(0, 0, 0, 0.9)',
                  }}
                >
                  {interimTranscript}
                  <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
                </div>
              </div>
            )}
            
            {/* Premium auto-submit countdown */}
            {autoSubmitCountdown !== undefined && autoSubmitCountdown > 0 && (
              <div 
                className="rounded-xl px-3 py-2 flex items-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
                  border: '1px solid',
                  borderColor: 'rgba(16, 185, 129, 0.2)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                {/* Circular progress */}
                <div className="relative w-8 h-8">
                  <svg className="transform -rotate-90 w-8 h-8">
                    <circle
                      cx="16"
                      cy="16"
                      r="12"
                      stroke="rgba(16, 185, 129, 0.2)"
                      strokeWidth="3"
                      fill="none"
                    />
                    <circle
                      cx="16"
                      cy="16"
                      r="12"
                      stroke="url(#gradient)"
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray={`${100 - (autoSubmitCountdown * 33)} 100`}
                      strokeLinecap="round"
                      className="transition-all duration-100"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span 
                      className="text-xs font-bold"
                      style={{
                        color: currentTheme.name === 'night' 
                          ? 'rgba(255, 255, 255, 0.9)' 
                          : 'rgba(0, 0, 0, 0.9)',
                      }}
                    >
                      {autoSubmitCountdown}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="text-xs font-semibold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                    Auto-submitting soon
                  </div>
                  <div 
                    className="text-xs"
                    style={{
                      color: currentTheme.name === 'night' 
                        ? 'rgba(255, 255, 255, 0.6)' 
                        : 'rgba(0, 0, 0, 0.6)',
                    }}
                  >
                    Press Esc to cancel
                  </div>
                </div>
              </div>
            )}
            
            {/* Voice cancellation tip */}
            <div className="text-xs text-center text-theme-text-muted mt-1 theme-transition">
              Say "wait" or "no" at the end to cancel input
            </div>
          </div>
        </div>
      </div>
      
      {/* Animation keyframes */}
      <style>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        
        @keyframes sound-wave {
          0%, 100% { 
            transform: scaleY(0.5);
            opacity: 0.5;
          }
          50% { 
            transform: scaleY(1);
            opacity: 1;
          }
        }
        
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        
        .animation-delay-400 {
          animation-delay: 400ms;
        }
      `}</style>
    </div>
  );
};

export default ListeningNotification;