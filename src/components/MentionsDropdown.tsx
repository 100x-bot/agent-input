import React, { forwardRef } from 'react';
import type { MentionSection } from '../types';

export interface MentionsDropdownProps {
    sections: MentionSection[];
    selectedIndex: number;
    onSelect: (mention: string) => void;
}

const MentionsDropdown = forwardRef<HTMLDivElement, MentionsDropdownProps>(({
    sections,
    selectedIndex,
    onSelect
}, ref) => {
    // Calculate total items for flat index mapping
    const calculateFlatIndex = (sectionIndex: number, itemIndex: number): number => {
        let flatIndex = 0;
        for (let i = 0; i < sectionIndex; i++) {
            flatIndex += sections[i].items.length;
        }
        return flatIndex + itemIndex;
    };

    if (sections.length === 0) {
        return null;
    }

    return (
        <div
            ref={ref}
            role="listbox"
            aria-label="Suggestions"
            className="absolute bottom-full w-[80vw] max-w-[400px] left-0 mb-1 max-h-80 overflow-y-auto z-[900] px-3 py-5 rounded-lg"
            style={{
                scrollbarWidth: "none",
                border: '1px solid var(--ai-border-dropdown)',
                backgroundColor: 'var(--ai-surface-dropdown)',
                boxShadow: 'var(--ai-shadow-dropdown)',
            }}
        >
            {sections.map((section, sectionIndex) => (
                <div key={sectionIndex} role="group" aria-label={section.label}>
                    <div
                        className={`text-[12px] font-[400] pb-1 font-dm-mono ${sectionIndex === 0 ? "pt-0" : "pt-4"}`}
                        style={{
                            color: 'var(--ai-text-label)',
                            borderBottom: '1px solid var(--ai-border-section)',
                        }}>
                        {section.label}
                    </div>
                    {section.items.map((item, itemIndex) => {
                        const flatIndex = calculateFlatIndex(sectionIndex, itemIndex);
                        const isSelected = selectedIndex === flatIndex;

                        return (
                            <button
                                key={itemIndex}
                                ref={isSelected ? (el) => {
                                    if (el) {
                                        el.scrollIntoView({ block: 'nearest' });
                                    }
                                } : null}
                                role="option"
                                aria-selected={isSelected}
                                className={`w-full px-3 py-1.5 overflow-hidden cursor-pointer flex items-center gap-3 text-left rounded-sm ${itemIndex === 0 ? "mt-2" : ""}`}
                                style={{
                                    backgroundColor: isSelected ? 'var(--ai-border-section)' : undefined,
                                    color: 'var(--ai-text-brand)',
                                }}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    onSelect(item.mention);
                                }}
                            >
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
    );
});

MentionsDropdown.displayName = 'MentionsDropdown';

export default MentionsDropdown;
