# Playbook 01 — Technical Gates

**Environment:** Node 22, clean install (`npm ci`), `npm run build`
**Automated equivalent:** `npm run build:ci && npm run test:security`

---

## 1.1 Clean install

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 1.1.1 | `npm ci` succeeds with no missing packages | `npm ci 2>&1` — expect exit 0 | | | |
| 1.1.2 | No lockfile drift | `git diff package-lock.json` after `npm install` — expect empty diff | | | |

---

## 1.2 Build

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 1.2.1 | Build exits 0 | `npm run build` | | | |
| 1.2.2 | No TypeScript / Vite errors in build output | Scan stdout for `error` or `warn` | | | |
| 1.2.3 | `dist/` populated | `ls dist/assets/*.js | wc -l` ≥ 5 | | | |

---

## 1.3 Bundle budgets

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 1.3.1 | CSS total < 945 kB | `npm run perf:budget` | | | |
| 1.3.2 | JS total < 1196 kB | Same run | | | |
| 1.3.3 | CSS+JS total < 2072 kB | Same run | | | |
| 1.3.4 | Largest CSS chunk < 780 kB | Same run | | | |
| 1.3.5 | Largest JS chunk < 250 kB | Same run | | | |

---

## 1.4 Security tests

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 1.4.1 | All Node security tests pass | `npm run test:security` — expect 0 failures | | | |
| 1.4.2 | CSP header present on prod | `curl -sI <prod-url> | grep content-security-policy` | | | |
| 1.4.3 | HSTS header present | `curl -sI <prod-url> | grep strict-transport-security` | | | |
| 1.4.4 | COOP/COEP headers present | `curl -sI <prod-url> | grep cross-origin` | | | |

---

## 1.5 CI workflow

| # | Scenario | Steps | Observe | Verdict | Issue |
|---|----------|-------|---------|---------|-------|
| 1.5.1 | `perf-budget` job uses `npm ci` | `cat .github/workflows/perf-budget.yml | grep "npm"` — expect `npm ci` | | | |
| 1.5.2 | PR check `bundle-budget` is green | GitHub PR checks panel | | | |
