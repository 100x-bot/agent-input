import React from 'react';
import { ReactRenderer } from '@tiptap/react';
import type { SuggestionOptions, SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion';
import MentionList from '../components/MentionList';
import type { MentionSection, FlatMentionItem } from '../types';
import { mentionToChipAttrs } from '../utils/mentionUtils';

export interface SuggestionConfig {
    getSections: (query: string) => MentionSection[];
    onSelect?: (mention: string) => void;
    /** Custom dropdown component — if provided, used instead of default MentionList */
    renderDropdown?: React.ComponentType<any>;
    /** Override how a selected item is inserted. Default: insert as mention chip. */
    onCommand?: (params: { editor: any; range: any; item: FlatMentionItem }) => void;
}

/**
 * Creates suggestion options following TipTap's official ReactRenderer pattern.
 * The MentionList component manages selectedIndex internally and exposes
 * onKeyDown via useImperativeHandle — exactly like the official TipTap example.
 */
export function createSuggestion(config: SuggestionConfig): Omit<SuggestionOptions, 'editor'> {
    return {
        items: ({ query }: { query: string }) => {
            const sections = config.getSections(query);
            // Flatten sections to items — getSections already filters by query
            const flat: FlatMentionItem[] = [];
            for (const section of sections) {
                for (const item of section.items) {
                    flat.push({ ...item, sectionLabel: section.label });
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
                            sections: filterSections(config.getSections(props.query), props.query),
                            onMentionSelect: config.onSelect,
                        },
                        editor: props.editor,
                    });

                    if (!props.clientRect) return;

                    // Position the dropdown — use editor left edge so it stays visible
                    const rect = props.clientRect();
                    const editorRect = props.editor.view.dom.getBoundingClientRect();
                    if (rect && component.element) {
                        component.element.style.position = 'fixed';
                        component.element.style.zIndex = '50';
                        component.element.style.left = `${editorRect.left}px`;
                        component.element.style.bottom = `${window.innerHeight - rect.top + 4}px`;
                    }

                    document.body.appendChild(component.element);
                },

                onUpdate: (props: SuggestionProps) => {
                    component?.updateProps({
                        ...props,
                        sections: filterSections(config.getSections(props.query), props.query),
                        onMentionSelect: config.onSelect,
                    });

                    if (!props.clientRect || !component?.element) return;

                    const rect = props.clientRect();
                    const editorRect = props.editor.view.dom.getBoundingClientRect();
                    if (rect) {
                        component.element.style.left = `${editorRect.left}px`;
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
                    config.getSections('');
                    component?.element?.remove();
                    component?.destroy();
                    component = null;
                },
            };
        },

        command: ({ editor, range, props }: { editor: any; range: any; props: any }) => {
            const item = props as FlatMentionItem;

            if (config.onCommand) {
                config.onCommand({ editor, range, item });
            } else {
                // Default: insert as mention chip
                const attrs = mentionToChipAttrs(item.mention);
                attrs.label = item.displayText || attrs.label;

                editor.chain().focus()
                    .insertContentAt(range, [
                        { type: 'mention', attrs },
                        { type: 'text', text: ' ' },
                    ])
                    .run();
            }
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
