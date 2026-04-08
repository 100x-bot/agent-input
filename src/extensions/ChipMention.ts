import { Mention } from '@tiptap/extension-mention';
import { mergeAttributes } from '@tiptap/core';
import { renderChipHTML } from './renderChipHTML';

/**
 * Extended Mention node with custom attributes and pixel-identical chip rendering.
 * Uses TipTap's Mention extension which is already atom:true, inline:true,
 * handles backspace, and has the suggestion plugin built in.
 */
export const ChipMention = Mention.extend({
    addAttributes() {
        return {
            // id = the raw JSON reference string (e.g., '{"type":"file","fileKey":"f1",...}')
            id: {
                default: null,
                parseHTML: element => element.getAttribute('data-id'),
                renderHTML: attributes => ({ 'data-id': attributes.id }),
            },
            label: {
                default: null,
                parseHTML: element => element.getAttribute('data-label'),
                renderHTML: attributes => ({ 'data-label': attributes.label }),
            },
            referenceType: {
                default: 'file',
                parseHTML: element => element.getAttribute('data-reference-type'),
                renderHTML: attributes => ({ 'data-reference-type': attributes.referenceType }),
            },
            favIconUrl: {
                default: null,
                parseHTML: element => element.getAttribute('data-favicon-url'),
                renderHTML: attributes => attributes.favIconUrl ? { 'data-favicon-url': attributes.favIconUrl } : {},
            },
        };
    },

    parseHTML() {
        return [
            { tag: `span[data-type="${this.name}"]` },
            { tag: 'span[data-reference]' }, // backwards compat with old chips
        ];
    },

    renderHTML({ node, HTMLAttributes }) {
        return [
            'span',
            mergeAttributes(
                { 'data-type': this.name },
                { 'data-reference': node.attrs.id },
                { contenteditable: 'false' },
                { class: 'inline-block align-middle group select-none' },
                HTMLAttributes,
            ),
            node.attrs.label || '',
        ];
    },

    addNodeView() {
        return ({ node, editor, getPos }) => {
            const dom = document.createElement('span');
            dom.setAttribute('data-type', 'mention');
            dom.setAttribute('data-reference', node.attrs.id || '');
            dom.contentEditable = 'false';
            dom.className = 'inline-block align-middle group select-none';

            const displayText = node.attrs.label || '';
            const referenceType = node.attrs.referenceType || 'file';
            const favIconUrl = node.attrs.favIconUrl || null;

            dom.innerHTML = renderChipHTML({
                reference: node.attrs.id || '',
                referenceType,
                displayText,
                favIconUrl,
            });

            const removeBtn = dom.querySelector('[data-remove="true"]');
            if (removeBtn) {
                removeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const pos = getPos();
                    if (typeof pos === 'number') {
                        editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize });
                    }
                });
            }

            return { dom };
        };
    },
});
