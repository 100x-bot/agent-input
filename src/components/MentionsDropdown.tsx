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
            className="absolute bottom-full w-[80vw] max-w-[400px] left-0 mb-1 border-1 border-[#ECEEF2] bg-[#FBFBF9] max-h-80 overflow-y-auto z-[900] px-3 py-5 rounded-lg"
            style={{
                scrollbarWidth: "none",
                boxShadow: "0 2px 8px 1px rgba(0, 0, 0, 0.10)",
            }}
        >
            {sections.map((section, sectionIndex) => (
                <div key={sectionIndex}>
                    <div
                        className={`text-[12px] font-[400] pb-1 font-dm-mono text-[#9D9DA7] border-b border-[#F0F1F4] ${sectionIndex === 0 ? "pt-0" : "pt-4"
                            }`}>
                        {section.label}
                    </div>
                    {section.items.map((item, itemIndex) => {
                        const flatIndex = calculateFlatIndex(sectionIndex, itemIndex);
                        const isSelected = selectedIndex === flatIndex;

                        return (
                            <div
                                key={itemIndex}
                                ref={isSelected ? (el) => {
                                    if (el) {
                                        el.scrollIntoView({ block: 'nearest' });
                                    }
                                } : null}
                                className={`px-3 py-1.5 overflow-hidden cursor-pointer flex items-center gap-3 ${isSelected
                                    ? "bg-[#F0F1F4]"
                                    : "hover:bg-[#F0F1F4] text-[#2C2949]"
                                    } ${itemIndex === 0 ? "mt-2" : ""}`}
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
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
});

MentionsDropdown.displayName = 'MentionsDropdown';

export default MentionsDropdown;
