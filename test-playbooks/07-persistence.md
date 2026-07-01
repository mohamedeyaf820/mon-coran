# Playbook 07 — Persistence

**Environment:** `npm run dev`, Chrome DevTools → Application → Storage
**Automated equivalent:** `tests/navigation-storage.test.mjs`, `tests/security-storage.test.mjs`

---

## 7.1 Settings persistence

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 7.1.1 | Language persists | Set lang → AR, reload | App opens in AR | | | |
| 7.1.2 | Theme persists | Set dark theme, reload | Dark theme active | | | |
| 7.1.3 | Font size persists | Increase font size, reload | Larger font retained | | | |
| 7.1.4 | Riwaya persists | Set Warsh, reload | Warsh still selected | | | |
| 7.1.5 | Display mode persists | Set Mushaf mode, reload | Mushaf mode restored | | | |
| 7.1.6 | Reciter persists | Change reciter, reload | Same reciter selected | | | |

---

## 7.2 Reading position

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 7.2.1 | Last surah/ayah saved | Navigate to Al-Imran ayah 50, reload | Reopens at Al-Imran:50 | | | |
| 7.2.2 | URL sync on navigation | Navigate surah/ayah — URL updates | | | |
| 7.2.3 | Deep-link opens correct position | Paste URL with surah/ayah — opens there | | | |
| 7.2.4 | Page number saved in Mushaf mode | Go to page 35, reload | Page 35 restored | | | |

---

## 7.3 Bookmarks

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 7.3.1 | Add bookmark | Tap bookmark on Al-Fatiha:1 | Bookmark saved, star filled | | | |
| 7.3.2 | Bookmark persists | Add bookmark, reload | Bookmark still present | | | |
| 7.3.3 | Open bookmarks panel | Press `B` or sidebar → Bookmarks | Panel shows saved bookmark | | | |
| 7.3.4 | Navigate from bookmark | Click bookmark in panel | Opens at bookmarked ayah | | | |
| 7.3.5 | Remove bookmark | Tap filled star | Bookmark removed, star empty | | | |

---

## 7.4 Reading history

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 7.4.1 | History records navigation | Visit 3 different surahs | History panel shows them in order | | | |
| 7.4.2 | Navigate from history | Click history entry | Opens at that surah | | | |

---

## 7.5 Storage security

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 7.5.1 | No plaintext secrets in localStorage | DevTools → Application → localStorage | No API keys or tokens visible in plain text | | | |
| 7.5.2 | `npm run test:security` passes | Run security tests | 0 failures | | | |
