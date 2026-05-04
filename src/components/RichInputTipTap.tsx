import React, { forwardRef, KeyboardEvent, useEffect, useImperativeHandle, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import HardBreak from '@tiptap/extension-hard-break';
import History from '@tiptap/extension-history';
import { useAgentInput } from '../context/AgentInputProvider';
import { ChipMention } from '../extensions/ChipMention';
import { SlashCommand } from '../extensions/SlashCommand';
import { createSuggestion } from '../extensions/suggestion';
import { segmentsToTipTapDoc, tipTapDocToString, computeCursorOffset } from '../utils/tiptapSerializer';
import type { MentionSection, MentionsDropdownRenderProps } from '../types';

interface RichInputProps {
    value: string;
    onChange: (value: string, cursorOffset: number) => void;
    onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void;
    onFocus?: () => void;
    onBlur?: (e: React.FocusEvent) => void;
    onPaste?: (e: React.ClipboardEvent<HTMLDivElement>) => void;
    placeholder?: string;
    placeholderClassName?: string;
    className?: string;
    domElementsMap?: Map<string, any>;
    onRemoveDOMElement?: (selector: string) => void;
    style?: React.CSSProperties;
    onHistoryUp?: () => boolean;
    onHistoryDown?: () => boolean;
    isNavigatingHistory?: boolean;
    mentionSections?: MentionSection[];
    onMentionSelect?: (mention: string) => void;
    renderMentionsDropdown?: (props: MentionsDropdownRenderProps) => React.ReactNode;
    slashCommandSections?: MentionSection[];
    onSlashCommandSelect?: (command: string) => void;
    onMentionQueryChange?: (query: string) => MentionSection[];
}

export interface RichInputRef {
    focus: (cursorOffset?: number) => void;
    blur: () => void;
    getValue: () => string;
    getCursorOffset: () => number;
    insertChip: (raw: string, referenceType: string, displayText: string, favIconUrl?: string | null) => void;
}

const RichInputTipTap = forwardRef<RichInputRef, RichInputProps>(({
    value,
    onChange,
    onKeyDown,
    onFocus,
    onBlur,
    onPaste,
    placeholder = 'Type a message...',
    className = '',
    placeholderClassName = '',
    domElementsMap = new Map(),
    onRemoveDOMElement,
    style,
    onHistoryUp,
    onHistoryDown,
    isNavigatingHistory = false,
    mentionSections = [],
    onMentionSelect,
    renderMentionsDropdown,
    slashCommandSections = [],
    onSlashCommandSelect,
    onMentionQueryChange,
}, ref) => {
    const { parseReferences } = useAgentInput();
    const isUpdatingRef = useRef(false);
    const lastValueRef = useRef(value);

    // Keep mentionSections in a ref so TipTap's suggestion plugin can access latest data
    const mentionSectionsRef = useRef(mentionSections);
    mentionSectionsRef.current = mentionSections;
    const slashCommandSectionsRef = useRef(slashCommandSections);
    slashCommandSectionsRef.current = slashCommandSections;
    const renderMentionsDropdownRef = useRef(renderMentionsDropdown);
    renderMentionsDropdownRef.current = renderMentionsDropdown;
    const onMentionQueryChangeRef = useRef(onMentionQueryChange);
    onMentionQueryChangeRef.current = onMentionQueryChange;

    // If consumer provides renderMentionsDropdown, wrap it as a component for ReactRenderer
    const CustomDropdown = renderMentionsDropdown ? React.useMemo(() => {
        const Wrapper = (props: any) => {
            const keyHandlerRef = React.useRef<((props: { event: globalThis.KeyboardEvent }) => boolean) | null>(null);

            React.useImperativeHandle(props.ref, () => ({
                onKeyDown: (kbProps: { event: globalThis.KeyboardEvent }) => {
                    return keyHandlerRef.current?.(kbProps) ?? false;
                },
            }));

            const renderer = renderMentionsDropdownRef.current;
            if (!renderer) return null;
            return <>{renderer({
                sections: props.sections || [],
                onSelect: (mention: string) => props.command?.({ mention, displayText: mention }),
                flatItems: props.items || [],
                registerKeyHandler: (handler: (props: { event: globalThis.KeyboardEvent }) => boolean) => {
                    keyHandlerRef.current = handler;
                },
            })}</>;
        };
        Wrapper.displayName = 'CustomMentionDropdown';
        return Wrapper;
    }, []) : undefined;

    const editor = useEditor({
        extensions: [
            Document,
            Paragraph,
            Text,
            HardBreak,
            History,
            ChipMention.configure({
                deleteTriggerWithBackspace: true,
                suggestion: createSuggestion({
                    getSections: (query) => {
                        if (onMentionQueryChangeRef.current) return onMentionQueryChangeRef.current(query);
                        return mentionSectionsRef.current;
                    },
                    onSelect: onMentionSelect,
                    renderDropdown: CustomDropdown,
                }),
            }),
            SlashCommand.configure({
                suggestion: createSuggestion({
                    getSections: (_query) => slashCommandSectionsRef.current,
                    onSelect: onSlashCommandSelect,
                    onCommand: ({ editor, range, item }) => {
                        editor.chain().focus()
                            .insertContentAt(range, item.mention + ' ')
                            .run();
                    },
                }),
            }),
        ],
        editorProps: {
            attributes: {
                role: 'textbox',
                'aria-label': 'Message input',
                'aria-multiline': 'true',
                class: className,
                ...(style ? { style: Object.entries(style).map(([k, v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}:${v}`).join(';') } : {}),
            },
            handleKeyDown: (view, event) => {
                // History navigation
                const hasModifier = event.ctrlKey || event.metaKey || event.shiftKey || event.altKey;

                if (!hasModifier && event.key === 'ArrowUp' && onHistoryUp) {
                    const { from } = view.state.selection;
                    if (from <= 1 || (isNavigatingHistory && from >= view.state.doc.content.size - 1)) {
                        if (onHistoryUp()) { event.preventDefault(); return true; }
                    }
                }

                if (!hasModifier && event.key === 'ArrowDown' && onHistoryDown) {
                    const { from } = view.state.selection;
                    if (isNavigatingHistory && from >= view.state.doc.content.size - 1) {
                        if (onHistoryDown()) { event.preventDefault(); return true; }
                    }
                }

                // Forward to parent (Enter to submit, Escape for add dropdown, etc.)
                if (onKeyDown) {
                    const syntheticEvent = {
                        ...event, key: event.key, code: event.code,
                        shiftKey: event.shiftKey, ctrlKey: event.ctrlKey,
                        metaKey: event.metaKey, altKey: event.altKey,
                        preventDefault: () => event.preventDefault(),
                        stopPropagation: () => event.stopPropagation(),
                        defaultPrevented: event.defaultPrevented,
                        nativeEvent: event, currentTarget: event.currentTarget, target: event.target,
                    } as unknown as KeyboardEvent<HTMLDivElement>;
                    onKeyDown(syntheticEvent);
                    if (event.defaultPrevented) return true;
                }

                return false;
            },
            handlePaste: (view, event) => {
                if (onPaste && event.clipboardData?.files?.length) {
                    onPaste(event as unknown as React.ClipboardEvent<HTMLDivElement>);
                    return true;
                }

                const html = event.clipboardData?.getData('text/html') || '';
                const plain = event.clipboardData?.getData('text/plain') || '';
                const text = html ? extractTextFromHTML(html) : plain;
                if (!text) return false;

                const { references, segments } = parseReferences(text, { domElements: domElementsMap });
                if (references.length > 0) {
                    event.preventDefault();
                    const doc = segmentsToTipTapDoc(segments);
                    const inlineContent: any[] = [];
                    if (doc.content) {
                        for (let i = 0; i < doc.content.length; i++) {
                            if (i > 0) inlineContent.push({ type: 'hardBreak' });
                            if (doc.content[i].content) inlineContent.push(...doc.content[i].content!);
                        }
                    }
                    if (inlineContent.length > 0) {
                        editor?.chain().focus().insertContent(inlineContent).run();
                    }
                    return true;
                }

                return false;
            },
        },
        onUpdate: ({ editor }) => {
            if (isUpdatingRef.current) return;
            const doc = editor.getJSON();
            const text = tipTapDocToString(doc);
            const cursorOffset = computeCursorOffset(doc, editor.state.selection.anchor);

            // Detect removed DOM references and notify parent
            if (onRemoveDOMElement && lastValueRef.current !== text) {
                const findDOMRefs = (s: string) => {
                    const refs = new Set<string>();
                    const p = /"type"\s*:\s*"dom"[^}]*"selector"\s*:\s*"([^"]+)"/g;
                    let m; while ((m = p.exec(s)) !== null) refs.add(m[1]);
                    return refs;
                };
                const oldRefs = findDOMRefs(lastValueRef.current);
                const newRefs = findDOMRefs(text);
                for (const r of oldRefs) {
                    if (!newRefs.has(r)) onRemoveDOMElement(r);
                }
            }

            lastValueRef.current = text;
            onChange(text, cursorOffset);
        },
        onFocus: () => { onFocus?.(); },
        onBlur: ({ event }) => { onBlur?.(event as unknown as React.FocusEvent); },
    });

    // Sync value prop → editor content
    useEffect(() => {
        if (!editor || isUpdatingRef.current) return;
        if (lastValueRef.current === value) return;
        lastValueRef.current = value;
        isUpdatingRef.current = true;
        const { segments } = parseReferences(value, { domElements: domElementsMap });
        const doc = segmentsToTipTapDoc(segments);
        editor.commands.setContent(doc);
        isUpdatingRef.current = false;
    }, [editor, value, domElementsMap]);

    useImperativeHandle(ref, () => ({
        focus: (cursorOffset?: number) => {
            if (!editor) return;
            if (cursorOffset !== undefined) {
                if (cursorOffset >= lastValueRef.current.length) editor.commands.focus('end');
                else if (cursorOffset === 0) editor.commands.focus('start');
                else editor.commands.focus();
            } else {
                editor.commands.focus();
            }
        },
        blur: () => { editor?.commands.blur(); },
        getValue: () => {
            if (!editor) return lastValueRef.current;
            return tipTapDOMToString(editor.view.dom as HTMLElement);
        },
        getCursorOffset: () => {
            if (!editor) return 0;
            return computeCursorOffset(editor.getJSON(), editor.state.selection.anchor);
        },
        insertChip: (raw: string, referenceType: string, displayText: string, favIconUrl?: string | null) => {
            if (!editor) return;
            editor.chain().focus().insertContent([
                { type: 'mention', attrs: { id: raw, label: displayText, referenceType, favIconUrl: favIconUrl || null } },
                { type: 'text', text: ' ' },
            ]).run();
        },
    }), [editor]);

    return (
        <div className="relative">
            <EditorContent editor={editor} style={style} />
            {(!value || value === '\n') && placeholder && (
                <div
                    className={`absolute inset-0 pointer-events-none select-none p-[inherit] overflow-hidden whitespace-pre-wrap break-words ${placeholderClassName}`}
                    style={{ color: 'var(--ai-text-placeholder)' }}
                >
                    {placeholder}
                </div>
            )}
        </div>
    );
});

function extractTextFromHTML(html: string): string {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const extract = (node: Node): string => {
        if (node.nodeType === Node.TEXT_NODE) return (node.textContent || '').replace(/[\r\n]+/g, ' ');
        if (node.nodeType !== Node.ELEMENT_NODE) return '';
        const el = node as HTMLElement;
        const tag = el.tagName;
        const isBlock = /^(P|DIV|BR|LI|H[1-6]|TR|BLOCKQUOTE|PRE|HR|DT|DD|FIGCAPTION|HEADER|FOOTER|SECTION|ARTICLE|OL|UL|TABLE|THEAD|TBODY|TFOOT)$/.test(tag);
        if (tag === 'BR') return '\n';
        if (tag === 'HR') return '\n---\n';
        let inner = '';
        for (let i = 0; i < node.childNodes.length; i++) inner += extract(node.childNodes[i]);
        if (tag === 'PRE') inner = el.textContent || '';
        if (isBlock && inner.length > 0) {
            return (inner.startsWith('\n') ? '' : '\n') + inner + (inner.endsWith('\n') ? '' : '\n');
        }
        return inner;
    };
    return extract(doc.body).replace(/^\n+/, '').replace(/\n{3,}/g, '\n\n');
}

function tipTapDOMToString(root: HTMLElement): string {
    const readNode = (node: Node): string => {
        if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
        if (node.nodeType !== Node.ELEMENT_NODE) return '';

        const el = node as HTMLElement;
        if (el.hasAttribute('data-reference')) {
            return el.getAttribute('data-reference') || '';
        }
        if (el.tagName === 'BR') {
            return el.classList.contains('ProseMirror-trailingBreak') ? '' : '\n';
        }

        let text = '';
        for (const child of Array.from(el.childNodes)) {
            text += readNode(child);
        }
        return text;
    };

    let text = '';
    for (const child of Array.from(root.childNodes)) {
        if (text) text += '\n';
        text += readNode(child);
    }
    return text;
}

RichInputTipTap.displayName = 'RichInput';

export default RichInputTipTap;
