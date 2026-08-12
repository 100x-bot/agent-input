# Product

## Register

product

## Users

React developers integrating an AI-agent input surface into an application. They need a dependable, reusable component for composing messages, inserting structured references, selecting models, and controlling agent workflows without rebuilding these interactions themselves.

## Product Purpose

Provide a production-ready agent chat input bar whose rich-text, mention, speech, file, workflow, history, and model-selection behaviors can be connected to a host application's data layer. Success means the component feels native to the host, preserves user input and focus, and gives exactly one interaction clear ownership at a time.

## Brand Personality

Focused, restrained, dependable. The component should feel familiar to users of polished developer tools and should disappear into the task instead of drawing attention to itself.

## Anti-references

Avoid ornamental SaaS styling, surprising custom interaction patterns, competing overlays, ambiguous keyboard ownership, and visual choices that prevent the component from inheriting a host application's identity.

## Design Principles

- Keep the user in flow through predictable focus and keyboard behavior.
- Make interaction ownership explicit: one active menu, dialog, or suggestion surface at a time.
- Prefer familiar controls and semantics over novel affordances.
- Integrate cleanly through stable APIs, theme tokens, and host-provided data.
- Treat loading, empty, error, and asynchronous states as first-class behavior.

## Accessibility & Inclusion

Target WCAG AA. Support complete keyboard navigation, semantic roles and labels, visible and predictable focus, sufficient contrast, screen-reader-friendly status messaging, and reduced-motion preferences.
