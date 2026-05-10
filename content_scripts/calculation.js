// === MATH / ANALYSIS ===

function analyzeBurnRate(monthlyPercent, resetDays) {
  const total = 30;
  const remaining = Math.max(0, resetDays);
  const elapsed = Math.max(1, total - remaining);
  const used = Math.min(100, Math.max(0, monthlyPercent));
  const left = Math.max(0, 100 - used);
  const rawRate = used / elapsed;
  const projectedEnd = Math.round(rawRate * total);

  let daysUntilEmpty = 999;
  if (left <= 0) daysUntilEmpty = 0;
  else if (rawRate > 0) daysUntilEmpty = Math.ceil(left / rawRate);

  const willRunOut = daysUntilEmpty < remaining;

  return {
    totalCycleDays: total,
    daysElapsed: elapsed,
    daysRemaining: remaining,
    burnRatePerDay: +rawRate.toFixed(1),
    rawBurnRatePerDay: rawRate,
    projectedEnd,
    willRunOut,
    daysUntilEmpty,
    safeBudget: +(remaining > 0 ? left / remaining : left).toFixed(1),
    rawSafeBudget: remaining > 0 ? left / remaining : left,
    percentUsed: used,
    percentLeft: left
  };
}

function analyzeDailyPacing(monthly) {
  const headroomPerDay = +(monthly.safeBudget - monthly.burnRatePerDay).toFixed(1);

  return {
    burnPerDay: monthly.burnRatePerDay,
    safePerDay: monthly.safeBudget,
    headroomPerDay,
    isOverDailyPace: headroomPerDay < 0
  };
}

function analyzeWeeklyLimit(weeklyPercent, weeklyResetDays) {
  const used = Math.min(100, Math.max(0, weeklyPercent));
  const left = Math.max(0, 100 - used);

  return {
    daysRemaining: weeklyResetDays,
    percentUsed: used,
    percentLeft: left,
    safePerDay: +(weeklyResetDays > 0 ? left / weeklyResetDays : left).toFixed(1)
  };
}

function analyzeRollingLimit(rollingPercent) {
  const used = Math.min(100, Math.max(0, rollingPercent));
  const left = Math.max(0, 100 - used);

  return {
    rollingWindowHours: 5,
    percentUsed: used,
    percentLeft: left,
    safePerHour: +(left / 5).toFixed(1)
  };
}

// === STATUS HELPERS ===

const COLORS = { green: '#22c55e', yellow: '#f59e0b', red: '#f87171' };
const LABELS = { green: 'Good', yellow: 'Slow down', red: 'Stop now' };

function statusColor(s) { return COLORS[s]; }
function statusLabel(s) { return LABELS[s]; }

function getMonthlyStatus(a) {
  if (!a.willRunOut) return 'green';
  return a.projectedEnd - 100 >= 30 ? 'red' : 'yellow';
}

function getDailyStatus(d) {
  if (d.safePerDay <= 0) return 'red';

  const ratio = d.burnPerDay / d.safePerDay;
  if (ratio >= 1) return 'red';
  if (ratio >= 0.75) return 'yellow';
  return 'green';
}

function getRollingStatus(p) {
  if (p >= 80) return 'red';
  if (p >= 60) return 'yellow';
  return 'green';
}

function getWeeklyStatus(p) {
  if (p >= 80) return 'red';
  if (p >= 55) return 'yellow';
  return 'green';
}

function getOverallStatus(...statuses) {
  const rank = { green: 0, yellow: 1, red: 2 };
  return statuses.reduce((worst, s) => rank[s] > rank[worst] ? s : worst, 'green');
}
