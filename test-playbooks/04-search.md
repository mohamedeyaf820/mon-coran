# Playbook 04 — Search

**Environment:** `npm run dev`, Chrome latest
**Automated equivalent:** none (manual only)

---

## 4.1 Surah/ayah search

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 4.1.1 | Open search via shortcut | Press `/` | Search modal opens, input focused | | | |
| 4.1.2 | Search by surah number | Type `2` | Al-Baqarah appears in results | | | |
| 4.1.3 | Search by surah name (FR) | Type `vache` | Al-Baqarah appears | | | |
| 4.1.4 | Search by surah name (AR) | Type `البقرة` | Al-Baqarah appears | | | |
| 4.1.5 | Search by surah name (EN) | Type `cow` | Al-Baqarah appears | | | |
| 4.1.6 | Arabic diacritic-insensitive search | Type `بقرة` (no shadda) | Al-Baqarah still matches | | | |
| 4.1.7 | Navigate to result | Click result | Reader opens at that surah | | | |
| 4.1.8 | Keyboard navigation in results | ↑/↓ keys move highlight, Enter navigates | | | |

---

## 4.2 Reciter search

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 4.2.1 | Search reciter by name | Recitations tab → search field → type `abdel` | Matching reciters shown | | | |
| 4.2.2 | Filter by riwaya | Filter Warsh only | Only Warsh reciters listed | | | |
| 4.2.3 | Empty search shows all | Clear search field | All reciters visible | | | |
| 4.2.4 | No-results state | Type gibberish | Empty state message shown (translated) | | | |

---

## 4.3 Search modal accessibility

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 4.3.1 | Screen reader announces result count | Open with NVDA/VoiceOver — type query | Live region announces count | | | |
| 4.3.2 | Focus trap in modal | Tab past last result | Focus wraps back to input | | | |
| 4.3.3 | Escape closes modal | Press Escape | Modal closes, focus returns to trigger | | | |
