# Playbook 03 — Quran Reading

**Environment:** `npm run dev`, Chrome latest, Arabic system font available
**Automated equivalent:** `npm run test:e2e:reading`

---

## 3.1 Display modes

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 3.1.1 | Surah (list) mode | Open Al-Baqarah — ayah list renders, Arabic text visible | | | |
| 3.1.2 | Page (Mushaf) mode | Switch to page mode — Mushaf page renders | | | |
| 3.1.3 | Juz mode | Switch to Juz mode — Juz 1 renders | | | |
| 3.1.4 | Page-turn animation plays | Switch page in Mushaf mode — slide/fade animation visible | | | |
| 3.1.5 | Mode persists on reload | Set Mushaf mode, reload — mode retained | | | |

---

## 3.2 Riwaya switching (Hafs ↔ Warsh)

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 3.2.1 | Switch to Warsh | Settings → Riwaya → Warsh — text reloads | | | |
| 3.2.2 | Warsh banner shown | WarshNotice badge visible at top | | | |
| 3.2.3 | Switch back to Hafs | Riwaya → Hafs — banner disappears | | | |
| 3.2.4 | Riwaya switch ≤ 1 s on warm cache | Second switch is fast (data cached) | | | |
| 3.2.5 | Toggle in reading toolbar shows current state | Toolbar riwaya badge reflects current riwaya, not target | | | |

---

## 3.3 Tajweed

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 3.3.1 | Enable Tajweed colors | Press `J` or toggle in toolbar | Words colored by rule | | | |
| 3.3.2 | Waqf signs highlighted | Al-Baqarah ayah 1 — waqf ۖ sign visible | | | |
| 3.3.3 | Disable Tajweed | Press `J` again | Colors removed, plain Arabic | | | |

---

## 3.4 Translation

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 3.4.1 | Show translation | Press `T` | Translation line appears below each ayah | | | |
| 3.4.2 | Language follows app language | Set lang to AR — translation in Arabic | | | |
| 3.4.3 | Hide translation | Press `T` again | Translation removed | | | |

---

## 3.5 Arabic font controls

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 3.5.1 | Font size increase | Settings → Font size slider → drag up | Text grows proportionally | | | |
| 3.5.2 | Font family switch | Settings → Font → QCF4 | QCF Mushaf font renders | | | |
| 3.5.3 | Font choice persists | Change font, reload | Font retained | | | |

---

## 3.6 Ayah actions

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 3.6.1 | Bookmark ayah | Tap bookmark icon on ayah | Star fills, toast appears | | | |
| 3.6.2 | Share ayah image | Tap share → Share Image | AyahSharePanel opens | | | |
| 3.6.3 | Copy ayah text | Tap copy | Clipboard receives Arabic text | | | |
