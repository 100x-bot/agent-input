import React, { useEffect, useImperativeHandle, useState } from 'react';
import type { MentionSection, FlatMentionItem } from '../types';

/**
 * TipTap suggestion dropdown component.
 * Follows TipTap's official pattern: manages selectedIndex internally,
 * exposes onKeyDown via useImperativeHandle, calls props.command() on selection.
 */
interface MentionListProps {
    items: FlatMentionItem[];
    sections: MentionSection[];
    command: (item: any) => void;
    onMentionSelect?: (mention: string) => void;
    ref?: React.Ref<MentionListHandle>;
}

interface MentionListHandle {
    onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

const MentionList = (props: MentionListProps) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
        const item = props.items[index];
        if (!item) return;

        // Special items like file upload
        if (item.mention === '__UPLOAD_FILE__' && props.onMentionSelect) {
            props.onMentionSelect(item.mention);
            return;
        }

        // Call TipTap's command — this replaces @query with the mention node
        props.command(item);
    };

    useEffect(() => setSelectedIndex(0), [props.items]);

    useImperativeHandle(props.ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === 'ArrowUp') {
                setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
                return true;
            }
            if (event.key === 'ArrowDown') {
                setSelectedIndex((selectedIndex + 1) % props.items.length);
                return true;
            }
            if (event.key === 'Enter' || event.key === 'Tab') {
                selectItem(selectedIndex);
                return true;
            }
            return false;
        },
    }));

    const sections = props.sections;
    if (!sections || sections.length === 0) return null;

    // Calculate flat index for each item
    let flatOffset = 0;

    return (
        <div
            role="listbox"
            aria-label="Suggestions"
            className="w-[80vw] max-w-[400px] max-h-80 overflow-y-auto px-3 py-5 rounded-lg"
            style={{
                scrollbarWidth: 'none',
                border: '1px solid var(--ai-border-dropdown)',
                backgroundColor: 'var(--ai-surface-dropdown)',
                boxShadow: 'var(--ai-shadow-dropdown)',
            }}
        >
            {sections.map((section, sectionIndex) => {
                const sectionStart = flatOffset;
                const sectionEl = (
                    <div key={sectionIndex} role="group" aria-label={section.label}>
                        <div
                            className={`text-[12px] font-[400] pb-1 font-dm-mono ${sectionIndex === 0 ? 'pt-0' : 'pt-4'}`}
                            style={{
                                color: 'var(--ai-text-label)',
                                borderBottom: '1px solid var(--ai-border-section)',
                            }}
                        >
                            {section.label}
                        </div>
                        {section.items.map((item, itemIndex) => {
                            const flatIndex = sectionStart + itemIndex;
                            const isSelected = selectedIndex === flatIndex;
                            return (
                                <button
                                    key={itemIndex}
                                    ref={isSelected ? (el) => el?.scrollIntoView({ block: 'nearest' }) : null}
                                    role="option"
                                    aria-selected={isSelected}
                                    className={`w-full px-3 py-1.5 overflow-hidden cursor-pointer flex items-center gap-3 text-left rounded-sm ${itemIndex === 0 ? 'mt-2' : ''}`}
                                    style={{
                                        backgroundColor: isSelected ? 'var(--ai-border-section)' : undefined,
                                        color: 'var(--ai-text-brand)',
                                    }}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        selectItem(flatIndex);
                                    }}
                                >
                                    <div className="flex-1">
                                        <span className="text-[14px] font-[400]">{item.displayText}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                );
                flatOffset += section.items.length;
                return sectionEl;
            })}
        </div>
    );
};

export default MentionList;
