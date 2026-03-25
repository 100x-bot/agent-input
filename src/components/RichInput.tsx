import React, { forwardRef, KeyboardEvent, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useAgentInput } from '../context/AgentInputProvider';
import type { ContentSegment } from '../types';
import { getReferenceColorClasses, getReferenceIcon } from '../types';

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
    domElementsMap?: Map<string, any>; // Changed to any to support both string and DOMElementData
    onRemoveDOMElement?: (selector: string) => void;
    style?: React.CSSProperties;
    // History navigation callbacks - return true if handled
    onHistoryUp?: () => boolean;
    onHistoryDown?: () => boolean;
    // Whether currently navigating history (allows up/down from any cursor position)
    isNavigatingHistory?: boolean;
}

export interface RichInputRef {
    focus: (cursorOffset?: number) => void;
    blur: () => void;
    getCursorOffset: () => number;
}

const RichInput = forwardRef<RichInputRef, RichInputProps>(({
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
    isNavigatingHistory = false
}, ref) => {
    const { parseReferences } = useAgentInput();
    const contentEditableRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const isUpdatingRef = useRef(false);
    const isComposingRef = useRef(false);
    const pendingCursorOffsetRef = useRef<number | null>(null);
    const lastCursorOffsetRef = useRef<number>(-1);
    const forceRerenderRef = useRef(false);

    // Parse value to extract all reference types and text segments
    const parseContent = (text: string): ContentSegment[] => {
        const { segments } = parseReferences(text, { domElements: domElementsMap });
        return segments;
    };

    // Extract text content from the contentEditable div
    const extractTextContent = (element: HTMLDivElement): string => {
        let text = '';
        const nodes = element.childNodes;

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];

            if (node.nodeType === Node.TEXT_NODE) {
                text += node.textContent || '';
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement;

                // Skip placeholder span
                if (el.getAttribute('data-placeholder') === 'true') {
                    continue;
                }

                // Check if it's a reference chip
                if (el.hasAttribute('data-reference')) {
                    const referenceRaw = el.getAttribute('data-reference');
                    if (referenceRaw) {
                        text += referenceRaw;
                    }
                } else if (el.tagName === 'BR') {
                    text += '\n';
                } else if (el.tagName === 'DIV' || el.tagName === 'P') {
                    // Handle block elements
                    if (text && !text.endsWith('\n')) {
                        text += '\n';
                    }
                    text += extractTextContent(el as HTMLDivElement);
                } else {
                    // For other elements, recursively extract text
                    text += extractTextContent(el as HTMLDivElement);
                }
            }
        }

        return text;
    };

    // Compute text offset up to a given DOM node+offset, counting BRs and references consistently with extractTextContent
    const computeTextOffset = (container: HTMLElement, targetNode: Node, targetOffset: number): number => {
        let offset = 0;
        let found = false;

        const walk = (parent: Node): boolean => {
            for (let i = 0; i < parent.childNodes.length; i++) {
                if (found) return true;
                const child = parent.childNodes[i];

                // Check if the target is a direct child reference (e.g. cursor between child nodes)
                if (parent === targetNode && i === targetOffset) {
                    found = true;
                    return true;
                }

                if (child === targetNode) {
                    if (child.nodeType === Node.TEXT_NODE) {
                        offset += targetOffset;
                        found = true;
                        return true;
                    }
                    // Element node targeted directly — count up to targetOffset children
                    for (let j = 0; j < targetOffset && j < child.childNodes.length; j++) {
                        walk(child);
                        if (found) return true;
                    }
                    found = true;
                    return true;
                }

                if (child.nodeType === Node.TEXT_NODE) {
                    if (child === targetNode) {
                        offset += targetOffset;
                        found = true;
                        return true;
                    }
                    offset += (child.textContent || '').length;
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    const el = child as HTMLElement;
                    if (el.getAttribute('data-placeholder') === 'true') {
                        continue;
                    }
                    if (el.hasAttribute('data-reference')) {
                        offset += (el.getAttribute('data-reference') || '').length;
                    } else if (el.tagName === 'BR') {
                        offset += 1; // \n
                    } else if (el.tagName === 'DIV' || el.tagName === 'P') {
                        // Block element adds newline prefix (same as extractTextContent)
                        if (offset > 0) {
                            const textSoFar = value.substring(0, offset);
                            if (!textSoFar.endsWith('\n')) {
                                offset += 1;
                            }
                        }
                        if (walk(el)) return true;
                    } else {
                        if (walk(el)) return true;
                    }
                }
            }
            // Check if target is at the end of parent's children
            if (parent === targetNode && parent.childNodes.length === targetOffset) {
                found = true;
                return true;
            }
            return false;
        };

        walk(container);
        return offset;
    };

    // Find DOM reference selectors in a text string
    const findDOMReferences = (text: string): Set<string> => {
        const refs = new Set<string>();
        const jsonPattern = /"type"\s*:\s*"dom"[^}]*"selector"\s*:\s*"([^"]+)"/g;
        let match;
        while ((match = jsonPattern.exec(text)) !== null) {
            refs.add(match[1]);
        }
        const legacyPattern = /@dom:(\S+)/g;
        while ((match = legacyPattern.exec(text)) !== null) {
            refs.add(match[1]);
        }
        return refs;
    };

    const getCurrentCursorOffset = (): number => {
        const el = contentEditableRef.current;
        if (!el) return lastCursorOffsetRef.current;
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return lastCursorOffsetRef.current;
        try {
            const range = selection.getRangeAt(0);
            if (!el.contains(range.endContainer)) return lastCursorOffsetRef.current;
            return computeTextOffset(el, range.endContainer, range.endOffset);
        } catch {
            return lastCursorOffsetRef.current;
        }
    };

    // Handle input changes
    const handleInput = () => {
        if (!contentEditableRef.current || isUpdatingRef.current || isComposingRef.current) return;

        // Sanitize DOM: check if browser corrupted chip elements
        // (e.g., text nodes moved inside chip spans, or chip inner structure modified)
        const chips = contentEditableRef.current.querySelectorAll('[data-reference]');
        let domCorrupted = false;
        for (let i = 0; i < chips.length; i++) {
            const chip = chips[i];
            // Check if chip's contentEditable was lost (browser can strip it)
            if (chip.getAttribute('contenteditable') !== 'false') {
                domCorrupted = true;
                break;
            }
            // Check if text nodes leaked into chip as direct children that shouldn't be there
            // (chip should only have its inner span structure, not stray text)
            const parent = chip.parentNode;
            if (parent) {
                const prevSib = chip.previousSibling;
                const nextSib = chip.nextSibling;
                // If a text node is immediately inside the chip element (not inside its inner spans),
                // the browser has corrupted the DOM
                for (let j = 0; j < chip.childNodes.length; j++) {
                    const child = chip.childNodes[j];
                    if (child.nodeType === Node.TEXT_NODE && (child.textContent || '').trim().length > 0) {
                        // Text node directly inside chip wrapper = corruption
                        domCorrupted = true;
                        break;
                    }
                }
                if (domCorrupted) break;
            }
        }

        if (domCorrupted) {
            // Force a full re-render to fix the DOM
            forceRerenderRef.current = true;
        }

        const newValue = extractTextContent(contentEditableRef.current);

        // Detect removed DOM references and notify parent
        if (onRemoveDOMElement && value !== newValue) {
            const oldRefs = findDOMReferences(value);
            const newRefs = findDOMReferences(newValue);
            for (const ref of oldRefs) {
                if (!newRefs.has(ref)) {
                    onRemoveDOMElement(ref);
                }
            }
        }

        onChange(newValue, getCurrentCursorOffset());
    };

    // Check if cursor is at the very start of the input
    const isCursorAtStart = (): boolean => {
        if (!contentEditableRef.current) return false;

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return false;

        const range = selection.getRangeAt(0);
        if (!range.collapsed) return false; // Has selection, not just cursor

        // Calculate position from start of content
        const preRange = range.cloneRange();
        preRange.selectNodeContents(contentEditableRef.current);
        preRange.setEnd(range.startContainer, range.startOffset);
        return preRange.toString().length === 0;
    };

    // Check if cursor is at the very end of the input
    const isCursorAtEnd = (): boolean => {
        if (!contentEditableRef.current) return false;

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return false;

        const range = selection.getRangeAt(0);
        if (!range.collapsed) return false; // Has selection, not just cursor

        // Calculate position from cursor to end of content
        const postRange = range.cloneRange();
        postRange.selectNodeContents(contentEditableRef.current);
        postRange.setStart(range.endContainer, range.endOffset);
        return postRange.toString().length === 0;
    };

    // Handle keyboard events
    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        // Handle arrow key history navigation BEFORE parent handler
        // Only intercept if no modifier keys are pressed
        const hasModifier = e.ctrlKey || e.metaKey || e.shiftKey || e.altKey;

        if (!hasModifier && e.key === 'ArrowUp' && onHistoryUp) {
            // Navigate history if:
            // 1. Cursor is at start (to begin navigation), OR
            // 2. Already navigating AND cursor is at end (where it lands after history switch)
            if (isCursorAtStart() || (isNavigatingHistory && isCursorAtEnd())) {
                const handled = onHistoryUp();
                if (handled) {
                    // Place cursor at end of newly loaded history item
                    pendingCursorOffsetRef.current = Infinity;
                    e.preventDefault();
                    return;
                }
            }
        }

        if (!hasModifier && e.key === 'ArrowDown' && onHistoryDown) {
            // History down works when navigating AND cursor is at end
            if (isNavigatingHistory && isCursorAtEnd()) {
                const handled = onHistoryDown();
                if (handled) {
                    // Place cursor at end of restored content
                    pendingCursorOffsetRef.current = Infinity;
                    e.preventDefault();
                    return;
                }
            }
        }

        // Let parent handle special keys
        if (onKeyDown) {
            onKeyDown(e);
        }

        // Handle backspace at chip boundary
        if (e.key === 'Backspace' && !e.defaultPrevented) {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0 && contentEditableRef.current) {
                const range = selection.getRangeAt(0);
                if (range.collapsed) {
                    const container = range.startContainer;
                    let prevElement: Element | null = null;

                    if (container.nodeType === Node.TEXT_NODE && range.startOffset === 0) {
                        // Cursor at start of a text node — check previous sibling
                        prevElement = (container.previousSibling as Element);
                        // Skip over <br> elements to find a chip
                        if (prevElement && (prevElement as HTMLElement).tagName === 'BR') {
                            prevElement = (prevElement.previousSibling as Element);
                        }
                    } else if (container.nodeType === Node.ELEMENT_NODE && range.startOffset > 0) {
                        // Cursor between child nodes of the container — check previous child
                        prevElement = container.childNodes[range.startOffset - 1] as Element;
                        // Skip over <br> elements to find a chip
                        if (prevElement && (prevElement as HTMLElement).tagName === 'BR' && range.startOffset > 1) {
                            prevElement = container.childNodes[range.startOffset - 2] as Element;
                        }
                    }

                    // If previous element is a chip, remove it
                    if (prevElement && prevElement.hasAttribute?.('data-reference')) {
                        e.preventDefault();
                        const referenceRaw = prevElement.getAttribute('data-reference');
                        if (referenceRaw) {
                            // Compute chip's text offset before removing it
                            const parent = prevElement.parentNode!;
                            const chipIndex = Array.from(parent.childNodes).indexOf(prevElement as ChildNode);
                            const chipTextOffset = computeTextOffset(contentEditableRef.current, parent, chipIndex);

                            // Position-aware removal
                            const idx = value.indexOf(referenceRaw, Math.max(0, chipTextOffset - 1));
                            const removeStart = idx >= 0 ? idx : value.indexOf(referenceRaw);
                            const newValue = value.substring(0, removeStart) + value.substring(removeStart + referenceRaw.length);

                            // Set cursor to where chip was
                            pendingCursorOffsetRef.current = removeStart;

                            // Notify DOM element removal if applicable
                            try {
                                const jsonData = JSON.parse(referenceRaw);
                                if (jsonData.type === 'dom' && onRemoveDOMElement) {
                                    onRemoveDOMElement(jsonData.selector);
                                }
                            } catch {
                                if (referenceRaw.startsWith('@dom:') && onRemoveDOMElement) {
                                    onRemoveDOMElement(referenceRaw.slice(5));
                                }
                            }

                            onChange(newValue, removeStart);
                            return;
                        }
                    }

                    // Prevent browser from corrupting DOM around chips:
                    // When deleting the last character of a text node between two chips (or between
                    // a chip and another non-editable element), the browser inserts a spurious <br>
                    // and may corrupt chip DOM. Intercept and handle manually via the value string.
                    if (container.nodeType === Node.TEXT_NODE && range.startOffset === 1 && (container.textContent || '').length === 1) {
                        const prev = container.previousSibling;
                        const next = container.nextSibling;
                        const prevIsChip = prev && (prev as HTMLElement).hasAttribute?.('data-reference');
                        const nextIsChip = next && (next as HTMLElement).hasAttribute?.('data-reference');
                        if (prevIsChip || nextIsChip) {
                            e.preventDefault();
                            const cursorOffset = getCurrentCursorOffset();
                            const newValue = value.substring(0, cursorOffset - 1) + value.substring(cursorOffset);
                            pendingCursorOffsetRef.current = cursorOffset - 1;
                            onChange(newValue, cursorOffset - 1);
                            return;
                        }
                    }
                }
            }
        }
    };

    // Walk DOM tree to find the node+offset for a given text offset
    const findCursorPosition = (container: HTMLElement, targetOffset: number): { node: Node, offset: number } => {
        let remaining = targetOffset;

        const walk = (parent: Node): { node: Node, offset: number } | null => {
            for (let i = 0; i < parent.childNodes.length; i++) {
                const child = parent.childNodes[i];

                if (child.nodeType === Node.TEXT_NODE) {
                    const len = (child.textContent || '').length;
                    if (remaining <= len) {
                        return { node: child, offset: remaining };
                    }
                    remaining -= len;
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    const el = child as HTMLElement;
                    if (el.hasAttribute('data-reference')) {
                        const refLen = (el.getAttribute('data-reference') || '').length;
                        if (remaining <= refLen) {
                            // Place cursor after this chip
                            return { node: parent, offset: i + 1 };
                        }
                        remaining -= refLen;
                    } else if (el.tagName === 'BR') {
                        if (remaining <= 1) {
                            return { node: parent, offset: i + 1 };
                        }
                        remaining -= 1;
                    } else {
                        const result = walk(el);
                        if (result) return result;
                    }
                }
            }
            return null;
        };

        const result = walk(container);
        if (result) return result;
        // Fallback: end of container
        return { node: container, offset: container.childNodes.length };
    };

    // Update content when value changes
    useEffect(() => {
        if (!contentEditableRef.current || isUpdatingRef.current) return;

        // Get current content to compare
        const currentContent = extractTextContent(contentEditableRef.current);

        // Parse segments and check if DOM chip count matches expected references
        const segments = parseContent(value);
        const expectedRefCount = segments.filter(s => s.type === 'reference').length;
        const actualRefCount = contentEditableRef.current.querySelectorAll('[data-reference]').length;
        const refCountMismatch = expectedRefCount !== actualRefCount;

        if (currentContent !== value || refCountMismatch || forceRerenderRef.current) {
            forceRerenderRef.current = false;
            isUpdatingRef.current = true;

            // Save cursor position
            const selection = window.getSelection();
            let cursorOffset = 0;

            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                if (contentEditableRef.current.contains(range.endContainer)) {
                    cursorOffset = computeTextOffset(contentEditableRef.current, range.endContainer, range.endOffset);
                }
            }

            // Render content (segments already parsed above)
            const container = contentEditableRef.current;
            container.innerHTML = '';

            segments.forEach((segment, index) => {
                if (segment.type === 'reference' && segment.reference) {
                    // Create chip element for any reference type
                    const chipWrapper = document.createElement('span');
                    chipWrapper.setAttribute('data-reference', segment.reference.raw);

                    // Store enhanced data if available (for DOM references)
                    if (segment.reference.type === 'dom') {
                        const domRef = segment.reference as any;
                        // elementData should already be in the reference from JSON parsing
                        if (domRef.elementData && typeof domRef.elementData === 'object') {
                            chipWrapper.setAttribute('data-element-json', JSON.stringify(domRef.elementData));
                        }
                    }

                    chipWrapper.contentEditable = 'false';
                    chipWrapper.className = 'inline-block align-middle group select-none'; // Added group and select-none

                    const colorClasses = getReferenceColorClasses(segment.reference.type);

                    // Check if reference has a favicon URL (for tabs)
                    const favIconUrl = (segment.reference as any).favIconUrl;
                    let iconElement = '';

                    if (favIconUrl) {
                        iconElement = `<img src="${favIconUrl}" class="w-4 h-4 flex-shrink-0" alt="" style="display: inline-block;" onerror="this.style.display='none';" />`;
                    } else {
                        const icon = getReferenceIcon(segment.reference.type);
                        iconElement = `<span class="text-[10px]">${icon}</span>`;
                    }

                    // Figma Design Implementation for File Inputs
                    if (segment.reference.type === 'file') {
                        chipWrapper.innerHTML = `
                        <span class="inline-flex items-center h-[32px] pl-[8px] pr-[4px] bg-white border border-[#cbd5e1] rounded-[8px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)] mx-[2px] my-[2px] transition-all cursor-pointer hover:border-[#94a3b8]">
                            <span class="flex items-center justify-center w-[16px] h-[16px] mr-[4px] text-[#1e293b]">
                                ${iconElement}
                            </span>
                            <span class="text-[14px] font-dm-sans leading-[20px] text-[#1e293b] font-[400] tracking-[0px] mr-[4px] max-w-[200px] truncate pointer-events-none">
                                ${segment.reference.displayText}
                            </span>
                            
                            <!-- Remove Button (Visible on Hover) -->
                            <span class="remove-btn w-[16px] h-[16px] flex items-center justify-center rounded-sm hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200" data-remove="true">
                                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg" class="pointer-events-none">
                                    <path d="M1 1L7 7M7 1L1 7" stroke="#64748B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </span>
                        </span>
                        `;
                    } else {
                        // Default style for other references
                        chipWrapper.innerHTML = `
                            <span class="inline-flex items-center gap-1 px-2 ${colorClasses} rounded-[6px] text-xs font-medium mx-0.5 max-[440px]:max-w-[300px]">
                                <span class="flex-shrink-0">${iconElement}</span>
                                <span class="truncate flex-1 min-w-0 leading-[22.4px] text-[#2C2949] font-[400] text-[16px]">${segment.reference.displayText}</span>
                            </span>
                        `;
                    }
                    container.appendChild(chipWrapper);
                } else if (segment.content) {
                    // Add text content
                    const lines = segment.content.split('\n');
                    lines.forEach((line, lineIndex) => {
                        if (lineIndex > 0) {
                            container.appendChild(document.createElement('br'));
                        }
                        if (line) {
                            const textNode = document.createTextNode(line);
                            container.appendChild(textNode);
                        }
                    });
                }
            });

            // No need to add placeholder span anymore - using CSS instead

            // Restore cursor position if focused
            if (contentEditableRef.current && (document.activeElement === contentEditableRef.current || pendingCursorOffsetRef.current !== null) && selection) {
                // Pending cursor offset from focus(offset) takes priority
                const targetOffset = pendingCursorOffsetRef.current !== null ? pendingCursorOffsetRef.current : cursorOffset;
                pendingCursorOffsetRef.current = null;

                try {
                    const range = document.createRange();
                    if (targetOffset >= value.length) {
                        // At or past end, stay at end
                        range.selectNodeContents(contentEditableRef.current);
                        range.collapse(false);
                    } else {
                        // Restore to calculated position
                        const pos = findCursorPosition(contentEditableRef.current, targetOffset);
                        range.setStart(pos.node, pos.offset);
                        range.collapse(true);
                    }
                    selection.removeAllRanges();
                    selection.addRange(range);
                } catch (e) {
                    // Fallback: place cursor at end
                    try {
                        const range = document.createRange();
                        range.selectNodeContents(contentEditableRef.current);
                        range.collapse(false);
                        selection.removeAllRanges();
                        selection.addRange(range);
                    } catch (_) { /* give up */ }
                }
            }

            queueMicrotask(() => {
                isUpdatingRef.current = false;
            });
        }
    }, [value, domElementsMap]);

    // Expose methods through ref
    useImperativeHandle(ref, () => ({
        focus: (cursorOffset?: number) => {
            const el = contentEditableRef.current;
            if (!el) return;
            if (cursorOffset !== undefined) {
                // Store for the useEffect to apply after DOM rebuild
                pendingCursorOffsetRef.current = cursorOffset;
            }
            el.focus();
            const selection = window.getSelection();
            if (selection) {
                if (cursorOffset !== undefined) {
                    // Try to set now — useEffect will correct after re-render
                    try {
                        const pos = findCursorPosition(el, cursorOffset);
                        const range = document.createRange();
                        range.setStart(pos.node, pos.offset);
                        range.collapse(true);
                        selection.removeAllRanges();
                        selection.addRange(range);
                    } catch {
                        // DOM not ready yet, useEffect will handle it
                    }
                } else {
                    const range = document.createRange();
                    range.selectNodeContents(el);
                    range.collapse(false);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            }
        },
        blur: () => {
            contentEditableRef.current?.blur();
        },
        getCursorOffset: () => {
            return getCurrentCursorOffset();
        }
    }));


    const handleFocus = () => {
        setIsFocused(true);
        // Don't clear placeholder anymore - let it stay visible
        if (onFocus) {
            onFocus();
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
        // Save cursor offset before focus leaves
        const el = contentEditableRef.current;
        if (el) {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                if (el.contains(range.endContainer)) {
                    lastCursorOffsetRef.current = computeTextOffset(el, range.endContainer, range.endOffset);
                }
            }
        }
        setIsFocused(false);
        if (onBlur) {
            onBlur(e);
        }
    };

    // Extract text from HTML clipboard data, converting block elements to newlines
    const extractTextFromHTML = (html: string): string => {
        const doc = new DOMParser().parseFromString(html, 'text/html');

        const extract = (node: Node): string => {
            if (node.nodeType === Node.TEXT_NODE) {
                return (node.textContent || '').replace(/[\r\n]+/g, ' ');
            }
            if (node.nodeType !== Node.ELEMENT_NODE) return '';

            const el = node as HTMLElement;
            const tag = el.tagName;

            const isBlock = /^(P|DIV|BR|LI|H[1-6]|TR|BLOCKQUOTE|PRE|HR|DT|DD|FIGCAPTION|HEADER|FOOTER|SECTION|ARTICLE|OL|UL|TABLE|THEAD|TBODY|TFOOT)$/.test(tag);

            if (tag === 'BR') return '\n';
            if (tag === 'HR') return '\n---\n';

            let inner = '';
            for (let i = 0; i < node.childNodes.length; i++) {
                inner += extract(node.childNodes[i]);
            }

            if (tag === 'PRE') {
                inner = el.textContent || '';
            }

            if (isBlock && inner.length > 0) {
                const prefix = inner.startsWith('\n') ? '' : '\n';
                const suffix = inner.endsWith('\n') ? '' : '\n';
                return prefix + inner + suffix;
            }

            return inner;
        };

        return extract(doc.body).replace(/^\n+/, '').replace(/\n{3,}/g, '\n\n');
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        // Check for files first
        if (onPaste && e.clipboardData?.files?.length > 0) {
            onPaste(e);
            return;
        }

        // Try HTML first for rich text (preserves paragraph structure from web pages),
        // fall back to plain text
        const html = e.clipboardData.getData('text/html');
        const plain = e.clipboardData.getData('text/plain');
        const text = html ? extractTextFromHTML(html) : plain;

        if (text) {
            e.preventDefault();
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                range.deleteContents();

                // Split on newlines and insert text nodes + <br> elements
                // (a single text node with \n doesn't render line breaks in contentEditable)
                const lines = text.split('\n');
                const fragment = document.createDocumentFragment();
                lines.forEach((line, i) => {
                    if (i > 0) {
                        fragment.appendChild(document.createElement('br'));
                    }
                    if (line) {
                        fragment.appendChild(document.createTextNode(line));
                    }
                });

                const lastChild = fragment.lastChild;
                range.insertNode(fragment);

                if (lastChild) {
                    range.setStartAfter(lastChild);
                    range.collapse(true);
                }
                sel.removeAllRanges();
                sel.addRange(range);
            }
            // If pasted text contains any references, force a DOM re-render
            // so the useEffect converts them into chips
            const { references } = parseReferences(text, { domElements: domElementsMap });
            if (references.length > 0) {
                forceRerenderRef.current = true;
            }
            handleInput();
        }
    };

    // Extract text from a DocumentFragment or Element, preserving reference raw text
    const extractTextFromNodes = (container: Node): string => {
        let text = '';
        for (let i = 0; i < container.childNodes.length; i++) {
            const node = container.childNodes[i];
            if (node.nodeType === Node.TEXT_NODE) {
                text += node.textContent || '';
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement;
                if (el.hasAttribute('data-reference')) {
                    text += el.getAttribute('data-reference') || '';
                } else if (el.tagName === 'BR') {
                    text += '\n';
                } else {
                    text += extractTextFromNodes(el);
                }
            }
        }
        return text;
    };

    // Handle copy/cut to include chip reference text
    const handleCopy = (e: React.ClipboardEvent<HTMLDivElement>) => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

        const range = selection.getRangeAt(0);
        const fragment = range.cloneContents();
        const text = extractTextFromNodes(fragment);

        e.preventDefault();
        e.clipboardData.setData('text/plain', text);
    };

    const handleCut = (e: React.ClipboardEvent<HTMLDivElement>) => {
        handleCopy(e);
        // Delete the selected content
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            selection.getRangeAt(0).deleteContents();
            handleInput();
        }
    };

    // Handle click on remove button
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        const removeBtn = target.closest('[data-remove="true"]');

        if (removeBtn) {
            e.preventDefault();
            e.stopPropagation();

            const chipWrapper = target.closest('[data-reference]');
            if (chipWrapper && chipWrapper.getAttribute('data-reference')) {
                const referenceRaw = chipWrapper.getAttribute('data-reference');
                if (referenceRaw) {
                    // Remove the reference from value
                    const removeIdx = value.indexOf(referenceRaw);
                    const newValue = value.replace(referenceRaw, '');
                    onChange(newValue, removeIdx >= 0 ? removeIdx : newValue.length);

                    // Focus back on input
                    setTimeout(() => {
                        contentEditableRef.current?.focus();
                    }, 0);
                }
            }
        }
    };

    return (<div className="relative">
        <div
            ref={contentEditableRef}
            contentEditable
            suppressContentEditableWarning
            className={className}
            style={style}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onPaste={handlePaste}
            onCopy={handleCopy}
            onCut={handleCut}
            onClick={handleClick}
            onCompositionStart={() => { isComposingRef.current = true; }}
            onCompositionEnd={() => { isComposingRef.current = false; handleInput(); }}
            role="textbox"
            aria-label="Message input"
            aria-multiline="true"
        />
        {/* Placeholder overlay */}
        {(!value || value === '\n') && placeholder && (
            <div
                className={`absolute inset-0 pointer-events-none select-none p-[inherit] overflow-hidden whitespace-pre-wrap break-words ${placeholderClassName}`}
                style={{ color: 'var(--ai-text-placeholder)' }}
            >
                {placeholder}
            </div>
        )}
    </div>);
});

RichInput.displayName = 'RichInput';

export default RichInput;
