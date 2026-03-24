# CLAUDE.md

## Project Overview

`@100xbot/agent-input` is a standalone React component library that provides an AI agent chat input bar. It was extracted from the 100xbot browser extension to be reusable across different host applications.

## Architecture

The library uses a single React context (`AgentInputProvider`) for dependency injection. Host applications provide an `AgentInputConfig` object that bridges their data layer (messaging, files, tabs, workflows, speech, model selection, etc.) into the component tree.

### Entry Points

- `@100xbot/agent-input` — Main components, hooks, types
- `@100xbot/agent-input/recording` — Recording dialog and animation components
- `@100xbot/agent-input/workflow` — Workflow review component

### Key Files

- `src/context/AgentInputProvider.tsx` — Context provider and `AgentInputConfig` interface (single source of truth for the config shape)
- `src/components/AgentStatusBar.tsx` — Main component (~740 lines, forwardRef)
- `src/types.ts` — All shared types
- `src/index.ts` — Main entry point exports
- `src/recording.ts` — Recording entry point
- `src/workflow.ts` — Workflow entry point

## Build

```bash
npm run build    # tsup → dist/ (ESM + CJS + DTS)
npm run dev      # tsup --watch
```

Build output: `dist/index.mjs`, `dist/index.cjs`, `dist/index.d.ts` (and recording/workflow variants), plus `dist/styles.css` (pre-compiled Tailwind + design tokens).

## Styles

The library ships a pre-compiled CSS bundle. Consumers just import it — **no Tailwind required**:

```tsx
import '@100xbot/agent-input/styles.css';
```

The CSS includes all utility classes used by components, design tokens (CSS custom properties `--ai-*`), and dark mode support (add `.dark` class to a parent element).

Source styling uses Tailwind utility classes in `src/`, compiled at build time via `@tailwindcss/cli` into `dist/styles.css`. The build input is `src/styles.build.css`.

## Development Rules

- Never run linting or type checking commands
- This is a library — no application entry point, no dev server
- Source styling uses Tailwind CSS utility classes but consumers get pre-compiled CSS
- Peer dependencies: `react`, `react-dom`, `lucide-react`, `framer-motion` — never bundle these
- No runtime dependencies — everything comes through the context config
- Keep `AgentInputConfig` as the single contract between library and host app
- Types in `src/types.ts` are the canonical type definitions — do not duplicate them

## Publishing

```bash
npm version patch  # or minor/major
npm run build
npm publish
```

Package is `@100xbot/agent-input` on npm, public access.

## Design Context

### Users
Mixed audience of technical and non-technical users interacting with an AI agent chat interface. Users range from developers automating browser tasks to business professionals creating workflows. The interface should balance power with accessibility — never intimidating, never dumbed-down.

### Brand Personality
**Warm & Approachable** — friendly, inviting, human. Three words: *helpful, clear, trustworthy*.

### Aesthetic Direction
- **Visual tone:** Clean and warm, inspired by Notion/Slack's approachability with Linear/Vercel's polish
- **References:** ChatGPT/Claude.ai, Linear/Vercel, Slack/Notion
- **Theme:** Support both light and dark modes, host app controls which is active
- **Colors:** Muted, professional palette. Avoid neon/saturated hues and gradients. Slate grays with status colors (green=ready, blue=working, red=error, amber=waiting). Brand navy `#292656`.
- **Motion:** Framer Motion for meaningful transitions — purposeful, not decorative

### Design Principles
1. **Clarity over cleverness** — Every element should communicate its purpose immediately
2. **Warm minimalism** — Strip away the unnecessary, keep enough warmth (rounded corners, soft shadows, gentle transitions)
3. **Transparent agency** — The agent's state should always be visible and honest
4. **Accessible by default** — WCAG AA compliance
5. **Adaptive, not duplicated** — Single design system adapting to light/dark via CSS variables or Tailwind dark mode
