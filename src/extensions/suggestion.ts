import React from 'react';
import { ReactRenderer } from '@tiptap/react';
import type { SuggestionOptions, SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion';
import { PluginKey } from '@tiptap/pm/state';
import MentionList from '../components/MentionList';
import type { MentionSection, FlatMentionItem } from '../types';
import { mentionToChipAttrs } from '../utils/mentionUtils';

export const mentionSuggestionPluginKey = new PluginKey('agentInputMentionSuggestion');
export const slashSuggestionPluginKey = new PluginKey('agentInputSlashSuggestion');

export interface SuggestionRendererController {
    refresh: () => void;
}

export interface SuggestionConfig {
    pluginKey: PluginKey;
    getSections: (query: string) => MentionSection[];
    controllerRef?: React.MutableRefObject<SuggestionRendererController | null>;
    shouldShow?: SuggestionOptions['shouldShow'];
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
    const flattenSections = (sections: MentionSection[]): FlatMentionItem[] => {
        const flat: FlatMentionItem[] = [];
        for (const section of sections) {
            for (const item of section.items) {
                flat.push({ ...item, sectionLabel: section.label });
            }
        }
        return flat;
    };

    return {
        pluginKey: config.pluginKey,
        shouldShow: config.shouldShow,
        items: ({ query }: { query: string }) => {
            return flattenSections(config.getSections(query));
        },

        render: () => {
            let component: ReactRenderer | null = null;
            let currentProps: SuggestionProps | null = null;
            let renderedSectionsSignature = '';

            const updateComponent = (props: SuggestionProps) => {
                const sections = config.getSections(props.query);
                const sectionsSignature = JSON.stringify(sections);
                if (sectionsSignature === renderedSectionsSignature) return;

                renderedSectionsSignature = sectionsSignature;
                component?.updateProps({
                    ...props,
                    items: flattenSections(sections),
                    sections,
                    onMentionSelect: config.onSelect,
                });
            };

            const controller: SuggestionRendererController = {
                refresh: () => {
                    if (currentProps && component) updateComponent(currentProps);
                },
            };

            return {
                onStart: (props: SuggestionProps) => {
                    if (config.controllerRef) config.controllerRef.current = controller;
                    currentProps = props;
                    const sections = config.getSections(props.query);
                    renderedSectionsSignature = JSON.stringify(sections);
                    const DropdownComponent = config.renderDropdown || MentionList;
                    component = new ReactRenderer(DropdownComponent, {
                        props: {
                            ...props,
                            items: flattenSections(sections),
                            sections,
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
                        component.element.style.zIndex = 'var(--ai-layer-suggestion, 50)';
                        component.element.style.left = `${editorRect.left}px`;
                        component.element.style.bottom = `${window.innerHeight - rect.top + 4}px`;
                    }

                    document.body.appendChild(component.element);
                },

                onUpdate: (props: SuggestionProps) => {
                    currentProps = props;
                    renderedSectionsSignature = '';
                    updateComponent(props);

                    if (!props.clientRect || !component?.element) return;

                    const rect = props.clientRect();
                    const editorRect = props.editor.view.dom.getBoundingClientRect();
                    if (rect) {
                        component.element.style.left = `${editorRect.left}px`;
                        component.element.style.bottom = `${window.innerHeight - rect.top + 4}px`;
                    }
                },

                onKeyDown: (props: SuggestionKeyDownProps) => {
                    // Delegate to MentionList's onKeyDown
                    // Returning false for Escape lets TipTap deactivate the plugin and
                    // invoke onExit instead of only removing the rendered dropdown.
                    return (component?.ref as any)?.onKeyDown(props) ?? false;
                },

                onExit: () => {
                    config.getSections('');
                    component?.element?.remove();
                    component?.destroy();
                    component = null;
                    currentProps = null;
                    renderedSectionsSignature = '';
                    if (config.controllerRef?.current === controller) {
                        config.controllerRef.current = null;
                    }
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
