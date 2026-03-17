---
name: AGENTS
description: Registry of custom agents for the Mon Coran project. Lists all available agents and their specializations.
---

# Mon Coran Custom Agents

This directory contains specialized agents for different aspects of the Mon Coran project. Each agent is optimized for a specific role.

## Available Agents

### 1. **ProductEngineer** 
📁 [product-engineer.agent.md](product-engineer.agent.md)

**Specialization:** Fullstack product development combining design, security, and business logic  
**Use when:**
- Building new features end-to-end
- Designing UI/UX with Tailwind CSS
- Reviewing for security vulnerabilities
- Architecting complex application flows
- Optimizing user experience

**Key Skills:**
- UI/UX design and design systems
- React component architecture
- Feature implementation and business logic
- Security audits and data protection
- Performance optimization

---

### 2. **CodeReviewer**
📁 [code-reviewer.agent.md](code-reviewer.agent.md)

**Specialization:** Comprehensive code review with automatic fixing across all domains  
**Use when:**
- Auditing files for quality and consistency
- Fixing design/display issues
- Correcting security vulnerabilities
- Resolving bugs and errors
- Refactoring and cleaning up code
- Running full codebase quality checks

**Key Skills:**
- Design consistency (Tailwind, theming, responsive)
- Security fixes (XSS, injection, data exposure)
- Accessibility and UX improvements
- Performance optimization
- Code quality and style consistency

---

## Quick Decision Tree

```
📋 What do you need?

├─ ✨ Build a new feature
│  └─→ Use ProductEngineer
│
├─ 🔍 Review and fix code quality
│  └─→ Use CodeReviewer
│
├─ 🎨 Design UI improvements
│  └─→ Use ProductEngineer (Designer mode)
│
├─ 🔒 Audit for security risks
│  └─→ Use CodeReviewer (Security)
│       OR ProductEngineer (Security specialized)
│
└─ 🐛 Fix bugs and errors
   └─→ Use CodeReviewer
```

---

## How to Use These Agents

In VS Code Chat:
1. Type `/` to see agent suggestions
2. Select the agent matching your task
3. Describe what you need

**Example commands:**

```
@ProductEngineer Design a new bookmark panel with Tailwind
@CodeReviewer Audit AudioPlayer.jsx for all issues and fix them
@ProductEngineer Implement word-by-word Qur'an playback sync
@CodeReviewer Check src/services for security vulnerabilities
```

---

## Agent Characteristics

| Agent | Focus | Scope | Tool Use |
|-------|-------|-------|----------|
| **ProductEngineer** | Creation & Architecture | Feature design, build, improve | Full access |
| **CodeReviewer** | Quality & Compliance | Audit, fix, refactor | Full access (fix-focused) |

---

## Settings & Configuration

All agents inherit the workspace and project context from:
- `.vscode/settings.json`
- `tailwind.config.js`
- `vite.config.js`
- `package.json` (dependencies, scripts)

---

## For Contributors

To add a new agent:
1. Create a `[name].agent.md` file in `.github/agents/`
2. Include YAML frontmatter with `name`, `description`
3. Document the agent's specialization, use cases, and scope
4. Update this AGENTS.md file with a new section

---

## Project Context

These agents work within the Mon Coran project:
- **React + Vite + Tailwind CSS** tech stack
- **Qur'anic content** (74 surahs, 6,236 verses)
- **Multi-language support** (Arabic, English, French; RTL support)
- **Audio playback** (Warsh variant, multiple reciters)
- **User features** (bookmarks, khatma tracking, memorization, notes, playlists)
- **Service-oriented architecture** (API calls, storage, audio management)

---

## Questions?

- **agent-customization** skill: Guidelines for creating/updating agents
- **ProductEngineer**: Full-featured development and design
- **CodeReviewer**: Comprehensive auditing and fixing
