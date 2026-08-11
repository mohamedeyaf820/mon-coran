# Interaction patterns

Canonical behavior lives in the current component implementation and tests. Use these patterns only after verifying the owning code.

## Modals and sheets

- Prefer inline disclosure for lightweight context; use a modal for a bounded task that must interrupt the current surface.
- Avoid nested modals. Close or replace the parent surface while preserving a clear return path.
- Use the existing UI/Radix primitives, portal when fixed or transformed ancestors can trap layering, trap focus, close with Escape when safe, and restore focus to the trigger.
- Keep long content scrollable without hiding the title or primary action.

## Choice controls

- Show two or three short static choices directly when space permits; use tabs only when they switch peer content views.
- Use toggles for immediate binary preferences, not navigation or multi-step actions.
- Expose advanced reading/audio controls progressively so the default path stays calm.

## Feedback and recovery

- Use inline feedback near the affected object for validation and recoverable local errors.
- Use toasts for brief outcomes that do not require a decision. Do not rely on a toast for critical or destructive consequences.
- Keep already loaded content usable during background refresh when safe.

## Destructive actions

- Match confirmation strength to impact.
- Name the data and scope that will be removed.
- Preserve undo or recovery when the system can honestly support it.
- Do not label an action reversible if local data is immediately and permanently erased.
