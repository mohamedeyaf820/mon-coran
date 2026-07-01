# Playbook 08 — PWA & Security

**Environment:** Production build (`npm run build && npm run preview`), Chrome DevTools
**Automated equivalent:** `npm run test:security`

---

## 8.1 PWA install

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 8.1.1 | Install prompt appears | Open on Chrome Android / Desktop after 30 s | "Add to Home Screen" prompt shown | | | |
| 8.1.2 | Installed app opens standalone | Install, open from launcher | No browser chrome, correct theme | | | |
| 8.1.3 | PWA update banner appears | Deploy new version, open old install | "Update available" banner shown | | | |
| 8.1.4 | Update banner text is translated | Set lang AR, trigger update banner | Banner text in Arabic | | | |

---

## 8.2 Offline support

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 8.2.1 | App shell loads offline | Visit once, DevTools → Network → Offline, reload | App shell renders | | | |
| 8.2.2 | Offline page shown for uncached routes | Go offline, visit uncached surah | Friendly offline page shown | | | |
| 8.2.3 | Offline page text is translated | Set lang FR, go offline | Offline page in French | | | |
| 8.2.4 | Service worker fetch timeout | Slow-3G + offline: resource times out | SW falls back gracefully, no hang > 10 s | | | |

---

## 8.3 HTTP security headers

| # | Scenario | Command | Expected value | Observe | Verdict | Issue |
|---|----------|---------|----------------|---------|---------|-------|
| 8.3.1 | CSP present | `curl -sI <prod> \| grep content-security` | Non-empty | | | |
| 8.3.2 | HSTS present | `curl -sI <prod> \| grep strict-transport` | `max-age=...` | | | |
| 8.3.3 | COOP present | `curl -sI <prod> \| grep cross-origin-opener` | `same-origin` | | | |
| 8.3.4 | X-Frame-Options | `curl -sI <prod> \| grep x-frame` | `DENY` or `SAMEORIGIN` | | | |
| 8.3.5 | No unsafe-inline in script-src | Inspect CSP value | No `unsafe-inline` in script-src | | | |

---

## 8.4 Content Security Policy

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 8.4.1 | No CSP violations in console | Open app, DevTools Console | No `Content Security Policy` errors | | | |
| 8.4.2 | Audio CDN allowed | Play audio — no CSP block | Audio loads without CSP violation | | | |
| 8.4.3 | QCF font CDN allowed | Load Mushaf — QCF font renders | No CSP font-src violation | | | |
| 8.4.4 | No perplexity.ai in CSP | `npm run csp:prod` | `frontend-cdn.perplexity.ai` absent | | | |

---

## 8.5 HTTPS / mixed content

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 8.5.1 | No mixed content warnings | Open prod, DevTools Console → filter "mixed" | No mixed-content warnings | | | |
| 8.5.2 | All API calls use HTTPS | DevTools Network — filter by protocol | All requests HTTPS | | | |
