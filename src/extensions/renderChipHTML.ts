import { getReferenceColorClasses, getReferenceIcon } from '../types';
import type { Reference } from '../types';

export interface ChipAttrs {
  reference: string;      // Raw JSON string
  referenceType: string;  // 'file' | 'tab' | 'workflow' | 'dom' | etc.
  displayText: string;
  favIconUrl?: string | null;
}

/**
 * Render chip inner HTML — pixel-identical to the original RichInput chip rendering.
 * Two variants: file chips (Figma design) and default chips (colored pill).
 */
export function renderChipHTML(attrs: ChipAttrs): string {
  const { referenceType, displayText, favIconUrl } = attrs;

  let iconElement = '';
  if (favIconUrl) {
    iconElement = `<img src="${favIconUrl}" class="w-4 h-4 flex-shrink-0" alt="" style="display: inline-block;" onerror="this.style.display='none';" />`;
  } else {
    const icon = getReferenceIcon(referenceType as Reference['type']);
    iconElement = `<span class="text-[10px]">${icon}</span>`;
  }

  if (referenceType === 'file') {
    return `
      <span class="inline-flex items-center h-[32px] pl-[8px] pr-[4px] bg-white border border-[#cbd5e1] rounded-[8px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)] mx-[2px] my-[2px] transition-all cursor-pointer hover:border-[#94a3b8]">
          <span class="flex items-center justify-center w-[16px] h-[16px] mr-[4px] text-[#1e293b]">
              ${iconElement}
          </span>
          <span class="text-[14px] font-dm-sans leading-[20px] text-[#1e293b] font-[400] tracking-[0px] mr-[4px] max-w-[200px] truncate pointer-events-none">
              ${displayText}
          </span>

          <!-- Remove Button (Visible on Hover) -->
          <span class="remove-btn w-[16px] h-[16px] flex items-center justify-center rounded-sm hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200" data-remove="true">
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg" class="pointer-events-none">
                  <path d="M1 1L7 7M7 1L1 7" stroke="#64748B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
          </span>
      </span>
    `;
  }

  const colorClasses = getReferenceColorClasses(referenceType as Reference['type']);
  return `
    <span class="inline-flex items-center gap-1 px-2 ${colorClasses} rounded-[6px] text-xs font-medium mx-0.5 max-[440px]:max-w-[300px]">
        <span class="flex-shrink-0">${iconElement}</span>
        <span class="truncate flex-1 min-w-0 leading-[22.4px] text-[#2C2949] font-[400] text-[16px]">${displayText}</span>
    </span>
  `;
}
