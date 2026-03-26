import type { TabData } from '../types';

export interface ChipAttrs {
    id: string;
    label: string;
    referenceType: string;
    favIconUrl: string | null;
}

/**
 * Convert a mention string (like "@tab:123 - Tab Title" or "@file:key - Display")
 * to chip attributes. Also handles raw JSON mention strings.
 *
 * Shared between AgentStatusBar (+ button) and suggestion.ts (@ trigger).
 */
export function mentionToChipAttrs(
    mention: string,
    context?: { tabs?: TabData[]; searchFiles?: (q: string) => any[] }
): ChipAttrs {
    let actualMention = mention;

    // Convert @type:value format to JSON
    if (mention.startsWith('@tab:')) {
        const tabId = mention.replace('@tab:', '').split(' - ')[0];
        const tab = context?.tabs?.find(t => t.id?.toString() === tabId);
        const tabTitle = tab?.title || `Tab ${tabId}`;
        actualMention = JSON.stringify({
            type: 'tab', tabId, tabTitle, displayText: tabTitle, favIconUrl: tab?.favIconUrl
        });
    } else if (mention.startsWith('@workflow:')) {
        const parts = mention.split(' - ');
        const workflowName = parts[0].replace('@workflow:', '');
        const displayName = parts[1] || workflowName;
        actualMention = JSON.stringify({
            type: 'workflow', workflowName, displayText: displayName
        });
    } else if (mention.startsWith('@file:')) {
        const parts = mention.split(' - ');
        const fileKey = parts[0].replace('@file:', '');
        const richDisplay = parts.slice(1).join(' - ');
        const file = context?.searchFiles?.('')?.find((f: any) => f.key === fileKey);
        actualMention = JSON.stringify({
            type: 'file', fileKey, filename: file?.metadata?.filename || fileKey,
            displayText: richDisplay, metadata: file?.metadata, mimeType: file?.mimeType || file?.type
        });
    } else if (mention.includes(' - ')) {
        actualMention = mention.split(' - ')[0];
    }

    // Parse JSON to extract attributes
    let referenceType = 'file';
    let displayText = '';
    let favIconUrl: string | null = null;
    try {
        const parsed = JSON.parse(actualMention);
        referenceType = parsed.type || 'file';
        displayText = parsed.displayText || parsed.tabTitle || parsed.workflowName || parsed.fileKey || '';
        favIconUrl = parsed.favIconUrl || null;
    } catch {
        const match = actualMention.match(/^@(\w+):(.+)/);
        if (match) { referenceType = match[1]; displayText = match[2]; }
    }

    return { id: actualMention, label: displayText, referenceType, favIconUrl };
}
