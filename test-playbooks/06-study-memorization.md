# Playbook 06 — Study & Memorization

**Environment:** `npm run dev`, Chrome latest
**Automated equivalent:** `npm run test:e2e` (memorization.spec.mjs)

---

## 6.1 Memorization mode

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 6.1.1 | Enter memorization mode | Press `M` or toggle in toolbar | Words replaced by blanks | | | |
| 6.1.2 | Reveal words one by one | Click each word / tap reveal | Words uncover sequentially | | | |
| 6.1.3 | Auto-reveal timer starts | Enable auto-reveal, wait | Words reveal at set interval | | | |
| 6.1.4 | Timer clears when all words revealed | Wait until last word uncovered | Timer stops (no more reveals after end) | | | |
| 6.1.5 | Exit memorization mode | Press `M` again | Normal text view restored | | | |
| 6.1.6 | Layout saved and restored on exit | Enter mem mode from Mushaf, exit — Mushaf layout returns | | | |
| 6.1.7 | `_prevMushafLayout` restore guard | Set layout to `''`, enter/exit mem mode | Layout does not reset to `''` if already `''` | | | |

---

## 6.2 Word-by-Word (WbW)

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 6.2.1 | Enable WbW | Press `W` | Each word shows translation below | | | |
| 6.2.2 | WbW skeleton while loading | Enable on long surah — skeleton shows then fills | | | |
| 6.2.3 | WbW disables memorization mode | Enable WbW while in mem mode | Mem mode deactivated (WbW takes over) | | | |
| 6.2.4 | Disable WbW | Press `W` again | Plain text without word translations | | | |

---

## 6.3 Karaoke / word highlighting

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 6.3.1 | Karaoke highlights during playback | Enable WbW + play audio | Currently spoken word highlighted | | | |
| 6.3.2 | Highlight advances word-by-word | Watch during playback | Highlight moves forward only | | | |
| 6.3.3 | Seek snaps highlight | Drag progress bar back | Highlight jumps to correct word | | | |
| 6.3.4 | Karaoke pauses when audio paused | Pause audio | Highlight freezes | | | |
| 6.3.5 | karaokeFollow resets properly | Enable karaokeFollow, change reciter | Follow mode stays enabled | | | |

---

## 6.4 Flashcards

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 6.4.1 | Open flashcards panel | Tools Hub → Flashcards | Panel opens | | | |
| 6.4.2 | Create a flashcard | Add ayah to flashcards | Card saved | | | |
| 6.4.3 | Review flashcards | Start review — front/back flips | | | |

---

## 6.5 Tafsir sidebar

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 6.5.1 | Open Tafsir | Tap Tafsir button on ayah | Sidebar opens with tafsir text | | | |
| 6.5.2 | Language-appropriate tafsir | Set lang FR — French tafsir source shown | | | |
| 6.5.3 | Close Tafsir | Tap ✕ or Escape | Sidebar closes | | | |
