import React, { useEffect } from 'react';
import { Mic, X } from 'lucide-react';

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
    <div
      role="status"
      aria-live="polite"
      className="fixed top-20 right-5 z-50 transition-all duration-300 ease-out"
      style={{
        transform: shouldShow ? 'translateX(0)' : 'translateX(100%)',
        opacity: shouldShow ? 1 : 0,
      }}
    >
      <div
        className="rounded-xl overflow-hidden min-w-[280px]"
        style={{
          backgroundColor: 'var(--ai-surface-primary)',
          border: '1px solid var(--ai-border-default)',
          boxShadow: 'var(--ai-shadow-md)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Mic indicator */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--ai-surface-tertiary)' }}
            >
              <Mic
                className="w-4 h-4"
                style={{ color: 'var(--ai-status-working)' }}
              />
            </div>

            {/* Status text + sound bars */}
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-medium"
                style={{ color: 'var(--ai-text-primary)' }}
              >
                {isProcessing ? 'Processing...' : 'Listening'}
              </span>

              {/* Sound wave bars */}
              <div className="flex items-center gap-0.5" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-0.5 rounded-full"
                    style={{
                      height: isProcessing ? '12px' : '8px',
                      backgroundColor: 'var(--ai-status-working)',
                      animation: `ai-sound-wave 1.${i + 2}s ease-in-out infinite`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Cancel button */}
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--ai-text-muted)' }}
              aria-label="Stop listening (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Interim transcript */}
        {interimTranscript && (
          <div
            className="mx-4 mb-3 rounded-lg px-3 py-2"
            style={{
              backgroundColor: 'var(--ai-surface-tertiary)',
            }}
          >
            <div
              className="text-xs mb-0.5 font-medium"
              style={{ color: 'var(--ai-text-muted)' }}
            >
              Transcript
            </div>
            <div
              className="text-sm font-medium"
              style={{ color: 'var(--ai-text-primary)' }}
            >
              {interimTranscript}
              <span
                className="inline-block w-0.5 h-3.5 ml-0.5 animate-pulse rounded-full"
                style={{ backgroundColor: 'var(--ai-status-working)' }}
                aria-hidden="true"
              />
            </div>
          </div>
        )}

        {/* Auto-submit countdown */}
        {autoSubmitCountdown !== undefined && autoSubmitCountdown > 0 && (
          <div
            className="mx-4 mb-3 rounded-lg px-3 py-2 flex items-center gap-3"
            style={{
              backgroundColor: 'var(--ai-surface-tertiary)',
            }}
          >
            {/* Countdown number */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
              style={{
                backgroundColor: 'var(--ai-status-working)',
                color: 'var(--ai-text-on-dark)',
              }}
            >
              {autoSubmitCountdown}
            </div>
            <div className="flex-1">
              <div
                className="text-xs font-medium"
                style={{ color: 'var(--ai-text-primary)' }}
              >
                Auto-submitting soon
              </div>
              <div
                className="text-xs"
                style={{ color: 'var(--ai-text-muted)' }}
              >
                Press Esc to cancel
              </div>
            </div>
          </div>
        )}

        {/* Tip */}
        <div
          className="text-xs text-center px-4 pb-3"
          style={{ color: 'var(--ai-text-muted)' }}
        >
          Say "wait" or "no" at the end to cancel input
        </div>
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes ai-sound-wave {
          0%, 100% { transform: scaleY(0.5); opacity: 0.5; }
          50% { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ListeningNotification;
