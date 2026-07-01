# Playbook 05 — Audio

**Environment:** `npm run dev`, Chrome latest, real network, speakers/headphones connected
**Automated equivalent:** `npm run test:e2e:audio`

---

## 5.1 Basic playback

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 5.1.1 | Play surah | Open Al-Fatiha → click Play | Audio starts within 2 s | | | |
| 5.1.2 | Pause/Resume | Click Pause, then Play | Audio pauses and resumes at same position | | | |
| 5.1.3 | Space bar toggles playback | Press Space | Play/pause toggles | | | |
| 5.1.4 | Next ayah | Click Next | Next ayah plays | | | |
| 5.1.5 | Previous ayah | Click Prev | Previous ayah plays or seeks to start | | | |
| 5.1.6 | Seek via progress bar | Drag slider to 50% | Audio jumps to midpoint | | | |
| 5.1.7 | Playback speed change | Settings → Speed → 1.5× | Audio plays faster | | | |
| 5.1.8 | Speed persists across ayahs | Change speed, advance ayah | Speed retained | | | |

---

## 5.2 MiniPlayer (persistent bottom bar)

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 5.2.1 | MiniPlayer appears on play | Start playback — bar appears at bottom | | | |
| 5.2.2 | MiniPlayer shows surah + ayah | Label reads "Surah · Ayah N" | | | |
| 5.2.3 | MiniPlayer progress bar updates | Watch thin bar at top of MiniPlayer | Bar fills in sync with audio | | | |
| 5.2.4 | MiniPlayer controls work | Play/Pause/Next/Prev in MiniPlayer | Audio responds | | | |
| 5.2.5 | Dismiss button stops and hides player | Click ✕ in MiniPlayer | Audio stops, bar disappears | | | |
| 5.2.6 | MiniPlayer re-appears on new play | After dismiss, play another ayah | Bar appears again | | | |
| 5.2.7 | MiniPlayer not hidden by iOS home bar | On iPhone (Safari), bar fully visible | Bottom edge clear of home indicator | | | |
| 5.2.8 | Content above MiniPlayer not cropped | Scroll to last ayah — last line readable | No overlap with bottom bar | | | |

---

## 5.3 MediaSession / lock screen controls

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 5.3.1 | Lock screen shows track info | Play → lock phone | Surah name + reciter visible on lock screen | | | |
| 5.3.2 | Lock screen play/pause works | Tap pause on lock screen | Audio pauses | | | |
| 5.3.3 | Headset button toggles playback | Press headset center button | Audio toggles | | | |

---

## 5.4 Reciter selection

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 5.4.1 | Change reciter | Recitations → pick a different reciter → play | New reciter's voice plays | | | |
| 5.4.2 | Warsh reciter plays Warsh audio | Select a Warsh reciter | Warsh pronunciation heard | | | |
| 5.4.3 | Riwaya badge shown on reciter card | Reciter detail page — Warsh/Hafs badge visible | | | |

---

## 5.5 Radio / continuous mode

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 5.5.1 | Radio station plays | Home → Radio → pick station → play | Audio streams | | | |
| 5.5.2 | Auto-advance to next surah | Play to end of surah in continuous mode | Next surah starts automatically | | | |
| 5.5.3 | Thematic station (Juz Amma) plays all surahs in order | Pick Juz Amma station | Surah 78 → 114 play in sequence | | | |
