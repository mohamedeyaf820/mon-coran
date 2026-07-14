export function getWirdProgress(record = {}, target = 5) {
  const safeTarget = Math.max(1, Number(target) || 5);
  const current = Math.max(0, Number(record.pagesRead) || 0);
  return {
    current,
    target: safeTarget,
    percentage: Math.min(100, Math.round((current / safeTarget) * 100)),
    remaining: Math.max(0, safeTarget - current),
    ayahsRead: Math.max(0, Number(record.ayahsRead) || 0),
    completed: Boolean(record.completed),
  };
}

export function summarizeStudyWeek(wirdHistory = [], readingDates = []) {
  const dates = new Set();
  let pagesRead = 0;
  let ayahsRead = 0;
  let completedDays = 0;
  let sessions = 0;

  wirdHistory.forEach((entry) => {
    if (entry.date) dates.add(entry.date);
    pagesRead += Math.max(0, Number(entry.pagesRead) || 0);
    ayahsRead += Math.max(0, Number(entry.ayahsRead) || 0);
    if (entry.completed) completedDays += 1;
  });
  readingDates.forEach((entry) => {
    if (entry.date) dates.add(entry.date);
    sessions += Math.max(0, Number(entry.sessions) || 0);
  });

  return { pagesRead, ayahsRead, activeDays: dates.size, completedDays, sessions };
}

export function getMemorizationSummary(items = []) {
  const levels = items.map((item) => Math.max(0, Math.min(5, Number(item.level) || 0)));
  const total = levels.reduce((sum, level) => sum + level, 0);
  return {
    verses: levels.length,
    mastered: levels.filter((level) => level === 5).length,
    reviewing: levels.filter((level) => level > 0 && level < 5).length,
    averageLevel: levels.length ? Math.round(total / levels.length) : 0,
  };
}

export function buildQuizQuestions(rules = [], limit = 5) {
  const usableRules = rules.filter((rule) => rule?.id && rule?.nameFr && rule?.description);
  return usableRules.slice(0, Math.max(0, limit)).map((rule, index) => {
    const distractors = usableRules
      .filter((candidate) => candidate.id !== rule.id)
      .slice(index % Math.max(1, usableRules.length - 1), index % Math.max(1, usableRules.length - 1) + 3)
      .map((candidate) => candidate.nameFr);
    const choices = [...new Set([rule.nameFr, ...distractors])].slice(0, 4);
    return {
      id: rule.id,
      prompt: rule.description,
      answer: rule.nameFr,
      choices,
    };
  });
}
