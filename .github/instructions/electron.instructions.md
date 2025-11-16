---
applyTo: "**/*.js,**/*.ts,**/electron/**"
excludeAgent: "code-review"
---
# Electron & Chrome Debugging Area Instructions

- Use Chrome DevTools protocol via remote interface (CDP) for tab selection and injection.
- Respect Content Security Policy by enabling `Page.setBypassCSP({ enabled: true })` before `Runtime.evaluate`.
- Log with concise, user-facing status messages: ✓ success, ▲ skipped, ✗ error.
- On startup, wait up to ~30 seconds and retry once per second to detect active debugging.
