import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';

/**
 * Lightweight extension that hooks the TipTap suggestion plugin with '/' as trigger.
 * No schema node — selected commands are inserted as plain text by the suggestion config.
 */
export const SlashCommand = Extension.create({
    name: 'slashCommand',

    addOptions() {
        return {
            suggestion: {
                char: '/',
                startOfLine: false,
            },
        };
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
                char: '/',
            }),
        ];
    },
});
