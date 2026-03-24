import React, { useMemo, useRef, useEffect } from 'react';
import { Plus } from '../icons';
import type { MentionSection } from '../types';
import { useDropdownNavigation } from '../hooks/useDropdownNavigation';

export interface AddButtonDropdownProps {
    isOpen: boolean;
    onClose: () => void;
    sections: MentionSection[];
    onSelect: (mention: string) => void;
    onToggle: () => void;
}

const AddButtonDropdown: React.FC<AddButtonDropdownProps> = ({
    isOpen,
    onClose,
    sections,
    onSelect,
    onToggle
}) => {
    // Flatten items for navigation index
    const allItems = useMemo(() => {
        return sections.flatMap(section => section.items);
    }, [sections]);

    const {
        selectedIndex,
        handleKeyDown,
        setSelectedIndex
    } = useDropdownNavigation({
        itemsLength: allItems.length,
        onSelect: (index) => {
            const item = allItems[index];
            if (item) {
                onSelect(item.mention);
                onClose();
            }
        },
        onClose,
        isOpen
    });

    // Reset selection when opened
    useEffect(() => {
        if (isOpen) {
            setSelectedIndex(0);
        }
    }, [isOpen, setSelectedIndex]);

    // Calculate flat index helper
    const calculateFlatIndex = (sectionIndex: number, itemIndex: number): number => {
        let flatIndex = 0;
        for (let i = 0; i < sectionIndex; i++) {
            flatIndex += sections[i].items.length;
        }
        return flatIndex + itemIndex;
    };

    return (
        <div className="relative group" onKeyDown={handleKeyDown}>
            <button
                onClick={onToggle}
                className="rounded-[0.5rem] w-[2rem] h-[2rem] flex items-center justify-center cursor-pointer transition-colors"
                style={{ border: '1px solid var(--ai-border-default)', backgroundColor: 'var(--ai-surface-primary)', color: 'var(--ai-text-secondary)' }}
                aria-label="Add a tab, workflow or file"
                aria-expanded={isOpen}
            >
                <Plus className="w-[1rem] h-[1rem]" strokeWidth={1.5} />
            </button>

            {/* Tooltip */}
            <div className="absolute bottom-full left-0 mb-2 z-50 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200">
                <div className="text-[0.75rem] rounded-[0.25rem] px-[0.75rem] py-[0.25rem] whitespace-nowrap font-[500]" style={{ backgroundColor: 'var(--ai-surface-tooltip)', color: 'var(--ai-text-on-dark)' }}>
                    Add a tab, workflow or file
                </div>
            </div>

            {/* Dropdown */}
            {isOpen && sections.length > 0 && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={onClose}
                    />

                    <div className="absolute bottom-full left-1/2 -translate-x-1/3 ml-20 mb-1 z-50 rounded-lg w-[300px] overflow-hidden" role="listbox" aria-label="Add items" style={{ border: '1px solid var(--ai-border-dropdown)', backgroundColor: 'var(--ai-surface-dropdown)' }}>
                        <div
                            className="py-4 px-3 overflow-y-auto overflow-hidden max-h-[240px]"
                            style={{
                                scrollbarWidth: "none",
                                boxShadow: "var(--ai-shadow-dropdown)",
                            }}
                        >
                            {sections.map((section, sectionIndex) => (
                                <div key={sectionIndex}>
                                    <div className={`text-[12px] font-[400] pb-1 font-dm-mono ${sectionIndex === 0 ? "pt-0" : "pt-4"}`} style={{ color: 'var(--ai-text-label)', borderBottom: '1px solid var(--ai-border-section)' }}>
                                        {section.label}
                                    </div>
                                    {section.items.map((item, itemIndex) => {
                                        const flatIndex = calculateFlatIndex(sectionIndex, itemIndex);
                                        const isSelected = selectedIndex === flatIndex;

                                        return (
                                            <button
                                                key={itemIndex}
                                                role="option"
                                                aria-selected={isSelected}
                                                ref={isSelected ? (el) => {
                                                    if (el) {
                                                        el.scrollIntoView({ block: 'nearest' });
                                                    }
                                                } : null}
                                                onClick={() => {
                                                    onSelect(item.mention);
                                                    onClose();
                                                }}
                                                className={`w-full px-3 py-1.5 cursor-pointer flex items-center gap-3 text-left rounded-sm ${itemIndex === 0 ? "mt-2" : ""}`}
                                                style={{ color: 'var(--ai-text-brand)', backgroundColor: isSelected ? 'var(--ai-border-section)' : undefined }}
                                            >
                                                {item.favIconUrl ? (
                                                    <img
                                                        src={item.favIconUrl}
                                                        className="w-4 h-4 flex-shrink-0"
                                                        alt=""
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = "none";
                                                        }}
                                                    />
                                                ) : (
                                                    <span className="text-[14px]">
                                                        {item.icon}
                                                    </span>
                                                )}
                                                <div className="flex-1">
                                                    <span className="text-[14px] font-[400]">
                                                        {item.displayText}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AddButtonDropdown;
