import { useState, useCallback, KeyboardEvent } from 'react';

interface UseDropdownNavigationProps {
    itemsLength: number;
    onSelect?: (index: number) => void;
    onClose?: () => void;
    isOpen: boolean;
}

export const useDropdownNavigation = ({
    itemsLength,
    onSelect,
    onClose,
    isOpen
}: UseDropdownNavigationProps) => {
    const [selectedIndex, setSelectedIndex] = useState<number>(-1);

    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLElement>) => {
        if (!isOpen) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => (prev >= itemsLength - 1 ? 0 : prev + 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => (prev <= 0 ? itemsLength - 1 : prev - 1));
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && onSelect) {
                    onSelect(selectedIndex);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setSelectedIndex(-1);
                if (onClose) onClose();
                break;
            case 'Tab':
                break;
        }
    }, [isOpen, itemsLength, selectedIndex, onSelect, onClose]);

    const resetIndex = useCallback(() => setSelectedIndex(-1), []);

    return {
        selectedIndex,
        setSelectedIndex,
        handleKeyDown,
        resetIndex
    };
};
