# Mushaf Plus Security and Privacy Notes

Status: production guidance, not a marketing promise.

## Local Data Model

Mushaf Plus is currently a client-side app. User data such as settings, reading position, bookmarks and notes is stored locally in browser storage or IndexedDB.

Local browser storage is convenient, but it is not a secure vault. Anyone with access to the browser profile or device may be able to inspect or export stored data.

## Encryption Guidance

- Do not describe local encryption as end-to-end encryption unless a user-controlled secret is required.
- A bundled or generated device key protects only against casual inspection, not against someone who controls the browser environment.
- A future protected mode should use a passphrase supplied by the user, derive a key with a modern KDF, and clearly explain recovery limits.
- On encryption failure, data should not silently fall back to plaintext for private notes.

## CSP and External Domains

The deployable CSP must stay centralized through `scripts/cspPolicy.mjs`, then mirrored into deployment files. Adding a new domain should answer three questions:

- What feature needs this domain?
- Can the feature work with a narrower path or a safer first-party proxy?
- Is the domain controlled content or user-uploaded content?

Avoid broad allowlists for user-content platforms unless the feature genuinely requires them.

## SVG and HTML Sanitizing

Sanitizers should reject executable or externally loading SVG features by default, including scripts, event handlers, foreign content, external references and style-based imports.

Security tests should cover both allowed benign markup and dangerous examples.

## User-Facing Copy

Security copy should be precise:

- Prefer "stored on this device" over "fully private" unless the claim is technically guaranteed.
- Explain what clearing browser data will remove.
- Explain that offline downloads may consume device storage.

## Release Checklist

- `npm audit --audit-level=moderate`
- `npm run test:security`
- `npm run build:ci`
- Review CSP diff when `scripts/cspPolicy.mjs`, `netlify.toml`, `vercel.json`, or external media URLs change.
