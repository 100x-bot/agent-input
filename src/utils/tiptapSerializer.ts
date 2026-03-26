import type { JSONContent } from '@tiptap/core';
import type { ContentSegment } from '../types';

/**
 * Convert parsed segments (from parseReferences) into a TipTap-compatible JSON document.
 */
export function segmentsToTipTapDoc(segments: ContentSegment[]): JSONContent {
  const content: JSONContent[] = [];
  let currentParagraph: JSONContent[] = [];

  const flushParagraph = () => {
    content.push({
      type: 'paragraph',
      content: currentParagraph.length > 0 ? currentParagraph : undefined,
    });
    currentParagraph = [];
  };

  for (const segment of segments) {
    if (segment.type === 'reference' && segment.reference) {
      currentParagraph.push({
        type: 'mention',
        attrs: {
          id: segment.reference.raw,
          label: segment.reference.displayText,
          referenceType: segment.reference.type,
          favIconUrl: (segment.reference as any).favIconUrl || null,
        },
      });
    } else if (segment.content) {
      const lines = segment.content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (i > 0) flushParagraph();
        if (lines[i]) {
          currentParagraph.push({ type: 'text', text: lines[i] });
        }
      }
    }
  }

  flushParagraph();

  return { type: 'doc', content };
}

/**
 * Convert TipTap JSON document back to the string format with embedded JSON references.
 */
export function tipTapDocToString(doc: JSONContent): string {
  if (!doc.content) return '';

  const parts: string[] = [];

  for (let i = 0; i < doc.content.length; i++) {
    const node = doc.content[i];
    if (i > 0) parts.push('\n');

    if (node.type === 'paragraph' && node.content) {
      for (const child of node.content) {
        if (child.type === 'text') {
          parts.push(child.text || '');
        } else if (child.type === 'mention') {
          parts.push(child.attrs?.id || '');
        } else if (child.type === 'hardBreak') {
          parts.push('\n');
        }
      }
    }
  }

  return parts.join('');
}

/**
 * Compute text offset from TipTap editor state.
 */
export function computeCursorOffset(doc: JSONContent, anchorPos: number): number {
  let textOffset = 0;
  let tiptapPos = 0;

  if (!doc.content) return 0;

  for (let i = 0; i < doc.content.length; i++) {
    const para = doc.content[i];
    tiptapPos += 1; // opening <paragraph>

    if (i > 0) {
      if (anchorPos <= tiptapPos) return textOffset;
      textOffset += 1; // \n between paragraphs
    }

    if (para.content) {
      for (const child of para.content) {
        if (child.type === 'text') {
          const len = (child.text || '').length;
          if (anchorPos <= tiptapPos + len) {
            return textOffset + (anchorPos - tiptapPos);
          }
          tiptapPos += len;
          textOffset += len;
        } else if (child.type === 'mention') {
          const refLen = (child.attrs?.id || '').length;
          tiptapPos += 1; // atom node = 1 position
          if (anchorPos <= tiptapPos) {
            return textOffset + refLen;
          }
          textOffset += refLen;
        } else if (child.type === 'hardBreak') {
          tiptapPos += 1;
          if (anchorPos <= tiptapPos) {
            return textOffset + 1;
          }
          textOffset += 1;
        }
      }
    }

    tiptapPos += 1; // closing </paragraph>
  }

  return textOffset;
}
