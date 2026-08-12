export const SEL = {
  input: '[role="textbox"][aria-label="Message input"]',
  chip: '[data-reference]',
  chipRemoveBtn: '[data-remove="true"]',
  mentionsDropdown: '[role="listbox"][aria-label="Suggestions"]',
  mentionOption: '[role="option"]',
  addButton: '[aria-label="Add a tab, workflow or file"]',
  modelButton: '[aria-label="Select a model"]',
  modelDropdown: '[role="listbox"][aria-label="Select model"]',
  sendButton: '[aria-label="Send message"]',
  stateRadio: (name: string) => `[role="radio"][aria-checked]`,
} as const;
