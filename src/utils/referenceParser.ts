import type {
  Reference,
  DOMReference,
  FileReference,
  WorkflowReference,
  TabReference,
  SimpleReference,
  DOMElementData,
  ContentSegment,
} from '../types';
import FreeTextJsonParser from 'free-text-json-parser';

// Initialize parser instance
const jsonParser = new FreeTextJsonParser();

// Main parser function
export function parseReferences(
  text: string,
  metadata?: {
    domElements?: Map<string, DOMElementData | string>;
    availableWorkflows?: string[];
  }
): {
  references: Reference[];
  segments: ContentSegment[];
} {
  const references: Reference[] = [];
  const segments: ContentSegment[] = [];

  // Extract JSON objects using free-text-json-parser
  const parseResult = jsonParser.parseStructured(text);
  const elements = parseResult.elements || [];

  for (const item of elements) {
    if (item.type === 'text') {
      // Process text segments for @references
      const textContent = item.value;
      const referencePattern = /@(dom|file|workflow|tab|page|selection|screenshot)(?::([^\s]+))?/g;
      let textLastIndex = 0;
      let match;

      while ((match = referencePattern.exec(textContent)) !== null) {
        // Add text before the @reference
        if (match.index > textLastIndex) {
          segments.push({
            type: 'text',
            content: textContent.substring(textLastIndex, match.index),
          });
        }

        const raw = match[0];
        const refType = match[1];
        const refValue = match[2] || '';
        let reference: Reference | null = null;

        switch (refType) {
          case 'dom': {
            if (refValue) {
              const elementData = metadata?.domElements?.get(refValue);
              reference = {
                type: 'dom',
                raw,
                selector: refValue,
                displayText: truncateSelector(refValue),
                elementData: typeof elementData === 'string' ? undefined : elementData,
              } as DOMReference;
            }
            break;
          }

          case 'file': {
            if (refValue) {
              reference = {
                type: 'file',
                raw,
                fileKey: refValue,
                displayText: extractFileName(refValue),
                fileName: refValue.split('/').pop() || refValue,
              } as FileReference;
            }
            break;
          }

          case 'workflow': {
            if (refValue) {
              reference = {
                type: 'workflow',
                raw,
                workflowName: refValue,
                displayText: refValue,
              } as WorkflowReference;
            }
            break;
          }

          case 'tab': {
            const tabId = refValue || 'current';
            reference = {
              type: 'tab',
              raw,
              tabId,
              displayText: tabId === 'current' ? 'Current Tab' : tabId === 'all' ? 'All Tabs' : `Tab ${tabId}`,
            } as TabReference;
            break;
          }

          case 'page':
          case 'selection':
          case 'screenshot': {
            reference = {
              type: refType as 'page' | 'selection' | 'screenshot',
              raw,
              displayText: refType.charAt(0).toUpperCase() + refType.slice(1),
            } as SimpleReference;
            break;
          }
        }

        if (reference) {
          references.push(reference);
          segments.push({
            type: 'reference',
            content: raw,
            reference,
          });
        }

        textLastIndex = match.index + match[0].length;
      }

      // Add remaining text after last @reference
      if (textLastIndex < textContent.length) {
        segments.push({
          type: 'text',
          content: textContent.substring(textLastIndex),
        });
      }
    } else if (item.type === 'json') {
      const jsonData = item.value;

      if (jsonData && typeof jsonData === 'object' && jsonData.type === 'dom') {
        const raw = JSON.stringify(jsonData);
        const reference: DOMReference = {
          type: 'dom',
          raw,
          selector: jsonData.selector || jsonData.primarySelector || 'unknown',
          displayText: truncateSelector(jsonData.selector || jsonData.primarySelector || 'unknown'),
          elementData: jsonData.elementData || jsonData,
        };
        references.push(reference);
        segments.push({ type: 'reference', content: raw, reference });
      } else if (jsonData && typeof jsonData === 'object' && jsonData.type === 'tab') {
        const raw = JSON.stringify(jsonData);
        const reference: TabReference = {
          type: 'tab',
          raw,
          tabId: jsonData.tabId || 'unknown',
          tabTitle: jsonData.tabTitle,
          displayText: jsonData.displayText || jsonData.tabTitle || `Tab ${jsonData.tabId}`,
          favIconUrl: jsonData.favIconUrl,
        };
        references.push(reference);
        segments.push({ type: 'reference', content: raw, reference });
      } else if (jsonData && typeof jsonData === 'object' && jsonData.type === 'workflow') {
        const raw = JSON.stringify(jsonData);
        const reference: WorkflowReference = {
          type: 'workflow',
          raw,
          workflowName: jsonData.workflowName || 'unknown',
          displayText: jsonData.displayText || jsonData.workflowName || 'Unknown Workflow',
        };
        references.push(reference);
        segments.push({ type: 'reference', content: raw, reference });
      } else if (jsonData && typeof jsonData === 'object' && jsonData.type === 'file') {
        const raw = JSON.stringify(jsonData);
        const reference: FileReference = {
          type: 'file',
          raw,
          fileKey: jsonData.fileKey || 'unknown',
          displayText: extractFileName(jsonData.displayText || jsonData.fileKey || 'Unknown File'),
          fileName: jsonData.filename,
          mimeType: jsonData.mimeType,
          metadata: jsonData.metadata,
        };
        references.push(reference);
        segments.push({ type: 'reference', content: raw, reference });
      } else {
        // Non-reference JSON, treat as text
        segments.push({
          type: 'text',
          content: JSON.stringify(jsonData),
        });
      }
    }
  }

  // FreeTextJsonParser strips whitespace at JSON boundaries (spaces, newlines).
  // Reconstruct any dropped characters by matching segments against the original text.
  const reconstructed = segments.map(s => s.type === 'reference' && s.reference ? s.reference.raw : s.content || '').join('');
  if (reconstructed !== text && reconstructed.length < text.length) {
    const fixedSegments: ContentSegment[] = [];
    let pos = 0;
    for (const seg of segments) {
      const segContent = seg.type === 'reference' && seg.reference ? seg.reference.raw : seg.content || '';
      const idx = text.indexOf(segContent, pos);
      if (idx > pos) {
        // Gap found — add missing text
        fixedSegments.push({ type: 'text', content: text.substring(pos, idx) });
      }
      fixedSegments.push(seg);
      pos = (idx >= 0 ? idx : pos) + segContent.length;
    }
    if (pos < text.length) {
      fixedSegments.push({ type: 'text', content: text.substring(pos) });
    }
    return { references, segments: fixedSegments };
  }

  return { references, segments };
}

// Extract just the references from text
export function extractReferences(
  text: string,
  metadata?: { domElements?: Map<string, DOMElementData | string>; availableWorkflows?: string[] }
): Reference[] {
  const { references } = parseReferences(text, metadata);
  return references;
}

// Helper to extract filename from a path
function extractFileName(path: string): string {
  const name = path.split('/').pop() || path;
  return name.length > 20 ? name.slice(0, 17) + '...' : name;
}

// Helper to truncate selector for display
function truncateSelector(selector: string, maxLength: number = 20): string {
  if (!selector) return 'unknown';
  if (selector.length <= maxLength) return selector;

  if (selector.startsWith('#')) {
    return `#${selector.slice(1, 10)}...${selector.slice(-5)}`;
  } else if (selector.startsWith('.')) {
    const firstClass = selector.split('.')[1]?.split(' ')[0];
    if (firstClass && firstClass.length > 15) {
      return `.${firstClass.slice(0, 12)}...`;
    }
    return selector.length > maxLength ? `${selector.slice(0, maxLength - 3)}...` : selector;
  }

  return selector.length > maxLength ? `${selector.slice(0, maxLength - 3)}...` : selector;
}
