import React from 'react';
import { ReactRenderer } from '@tiptap/react';
import type { SuggestionOptions, SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion';
import MentionList from '../components/MentionList';
import type { MentionSection, FlatMentionItem } from '../types';
import { mentionToChipAttrs } from '../utils/mentionUtils';

export interface SuggestionConfig {
    getSections: () => MentionSection[];
    onSelect?: (mention: string) => void;
    /** Custom dropdown component — if provided, used instead of default MentionList */
    renderDropdown?: React.ComponentType<any>;
}

/**
 * Creates suggestion options following TipTap's official ReactRenderer pattern.
 * The MentionList component manages selectedIndex internally and exposes
 * onKeyDown via useImperativeHandle — exactly like the official TipTap example.
 */
export function createSuggestion(config: SuggestionConfig): Omit<SuggestionOptions, 'editor'> {
    return {
        items: ({ query }: { query: string }) => {
            const sections = config.getSections();
            const q = query.toLowerCase();

            // Flatten sections to items, filtered by query
            const flat: FlatMentionItem[] = [];
            for (const section of sections) {
                for (const item of section.items) {
                    if (!q || item.displayText.toLowerCase().includes(q) || item.mention.toLowerCase().includes(q)) {
                        flat.push({ ...item, sectionLabel: section.label });
                    }
                }
            }
            return flat;
        },

        render: () => {
            let component: ReactRenderer | null = null;

            return {
                onStart: (props: SuggestionProps) => {
                    const DropdownComponent = config.renderDropdown || MentionList;
                    component = new ReactRenderer(DropdownComponent, {
                        props: {
                            ...props,
                            sections: filterSections(config.getSections(), props.query),
                            onMentionSelect: config.onSelect,
                        },
                        editor: props.editor,
                    });

                    if (!props.clientRect) return;

                    // Position the dropdown
                    const rect = props.clientRect();
                    if (rect && component.element) {
                        component.element.style.position = 'fixed';
                        component.element.style.zIndex = '50';
                        component.element.style.left = `${rect.left}px`;
                        component.element.style.bottom = `${window.innerHeight - rect.top + 4}px`;
                    }

                    document.body.appendChild(component.element);
                },

                onUpdate: (props: SuggestionProps) => {
                    component?.updateProps({
                        ...props,
                        sections: filterSections(config.getSections(), props.query),
                        onMentionSelect: config.onSelect,
                    });

                    if (!props.clientRect || !component?.element) return;

                    const rect = props.clientRect();
                    if (rect) {
                        component.element.style.left = `${rect.left}px`;
                        component.element.style.bottom = `${window.innerHeight - rect.top + 4}px`;
                    }
                },

                onKeyDown: (props: SuggestionKeyDownProps) => {
                    if (props.event.key === 'Escape') {
                        component?.element?.remove();
                        component?.destroy();
                        component = null;
                        return true;
                    }

                    // Delegate to MentionList's onKeyDown
                    return (component?.ref as any)?.onKeyDown(props) ?? false;
                },

                onExit: () => {
                    component?.element?.remove();
                    component?.destroy();
                    component = null;
                },
            };
        },

        command: ({ editor, range, props }: { editor: any; range: any; props: any }) => {
            const item = props as FlatMentionItem;
            // Use mentionToChipAttrs for JSON conversion, but override label
            // with the item's displayText which is already correct
            const attrs = mentionToChipAttrs(item.mention);
            attrs.label = item.displayText || attrs.label;

            editor.chain().focus()
                .insertContentAt(range, [
                    { type: 'mention', attrs },
                    { type: 'text', text: ' ' },
                ])
                .run();
        },
    };
}

function filterSections(sections: MentionSection[], query: string): MentionSection[] {
    if (!query) return sections;
    const q = query.toLowerCase();
    return sections
        .map(s => ({
            ...s,
            items: s.items.filter(i =>
                i.displayText.toLowerCase().includes(q) ||
                i.mention.toLowerCase().includes(q)
            ),
        }))
        .filter(s => s.items.length > 0);
}
