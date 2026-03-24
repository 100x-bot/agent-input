import { useState, useCallback } from 'react';

export interface UseInputHistoryReturn {
    historyIndex: number;
    draftMessage: string;
    navigateUp: (history: string[], currentMessage: string) => string | null;
    navigateDown: (history: string[]) => string | null;
    reset: () => void;
    isNavigating: boolean;
}

export function useInputHistory(): UseInputHistoryReturn {
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [draftMessage, setDraftMessage] = useState('');

    const navigateUp = useCallback((history: string[], currentMessage: string): string | null => {
        if (history.length === 0) return null;

        if (historyIndex === -1) {
            setDraftMessage(currentMessage);
            setHistoryIndex(0);
            return history[0];
        }

        if (historyIndex >= history.length - 1) {
            return null;
        }

        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        return history[newIndex];
    }, [historyIndex]);

    const navigateDown = useCallback((history: string[]): string | null => {
        if (historyIndex === -1) return null;

        if (historyIndex === 0) {
            setHistoryIndex(-1);
            return draftMessage;
        }

        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        return history[newIndex];
    }, [historyIndex, draftMessage]);

    const reset = useCallback(() => {
        setHistoryIndex(-1);
        setDraftMessage('');
    }, []);

    return {
        historyIndex,
        draftMessage,
        navigateUp,
        navigateDown,
        reset,
        isNavigating: historyIndex >= 0
    };
}
