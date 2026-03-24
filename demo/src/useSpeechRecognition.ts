import { useState, useRef, useCallback, useEffect } from 'react';

interface SpeechRecognitionState {
  state: 'idle' | 'listening' | 'processing';
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  autoSubmitCountdown: number;
  error: { message: string } | null;
  toggleListening: () => void;
  clearTranscript: () => void;
  cancelAutoSubmit: () => void;
  resetError: () => void;
  setOnAutoSubmit?: (cb: () => void) => void;
}

// Browser speech recognition type
interface BrowserSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

function getSpeechRecognitionConstructor(): (new () => BrowserSpeechRecognition) | null {
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function useSpeechRecognition(): SpeechRecognitionState {
  const [state, setState] = useState<'idle' | 'listening' | 'processing'>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<{ message: string } | null>(null);
  const [autoSubmitCountdown, setAutoSubmitCountdown] = useState(0);

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const autoSubmitCallbackRef = useRef<(() => void) | null>(null);
  const autoSubmitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAutoSubmitTimer = useCallback(() => {
    if (autoSubmitTimerRef.current) {
      clearInterval(autoSubmitTimerRef.current);
      autoSubmitTimerRef.current = null;
    }
    setAutoSubmitCountdown(0);
  }, []);

  const startAutoSubmitCountdown = useCallback(() => {
    clearAutoSubmitTimer();
    let count = 3;
    setAutoSubmitCountdown(count);
    autoSubmitTimerRef.current = setInterval(() => {
      count--;
      setAutoSubmitCountdown(count);
      if (count <= 0) {
        clearAutoSubmitTimer();
        autoSubmitCallbackRef.current?.();
      }
    }, 1000);
  }, [clearAutoSubmitTimer]);

  const toggleListening = useCallback(() => {
    const SpeechRecognition = getSpeechRecognitionConstructor();

    if (!SpeechRecognition) {
      setError({ message: 'Speech recognition is not supported in this browser.' });
      return;
    }

    if (state === 'listening' || state === 'processing') {
      // Stop
      recognitionRef.current?.abort();
      recognitionRef.current = null;
      setState('idle');
      setInterimTranscript('');
      clearAutoSubmitTimer();
      return;
    }

    // Start
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setState('listening');
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      setInterimTranscript(interim);

      if (final) {
        // Check for cancel phrases
        const lower = final.toLowerCase().trim();
        if (lower.endsWith('wait') || lower.endsWith('no') || lower === 'cancel') {
          recognitionRef.current?.abort();
          recognitionRef.current = null;
          setState('idle');
          setInterimTranscript('');
          clearAutoSubmitTimer();
          return;
        }

        setTranscript(final);
        setState('processing');
        setInterimTranscript('');
        startAutoSubmitCountdown();
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'aborted') {
        setError({ message: `Speech error: ${event.error}` });
      }
      setState('idle');
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      if (state === 'listening') {
        setState('idle');
      }
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [state, clearAutoSubmitTimer, startAutoSubmitCountdown]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      clearAutoSubmitTimer();
    };
  }, [clearAutoSubmitTimer]);

  return {
    state,
    isListening: state === 'listening',
    transcript,
    interimTranscript,
    autoSubmitCountdown,
    error,
    toggleListening,
    clearTranscript: () => setTranscript(''),
    cancelAutoSubmit: () => {
      clearAutoSubmitTimer();
      setState('idle');
    },
    resetError: () => setError(null),
    setOnAutoSubmit: (cb: () => void) => {
      autoSubmitCallbackRef.current = cb;
    },
  };
}
