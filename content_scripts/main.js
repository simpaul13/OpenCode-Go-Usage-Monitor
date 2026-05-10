// === ORCHESTRATOR ===

function computeAll() {
  const percents = parseAllPercents();
  const monthlyResetDays = getMonthlyResetDays();
  const weeklyResetDays = getWeeklyResetDays();
  const monthlyAnalysis = analyzeBurnRate(percents.monthly, monthlyResetDays);
  const dailyAnalysis = analyzeDailyPacing(monthlyAnalysis);
  const weeklyAnalysis = analyzeWeeklyLimit(percents.weekly, weeklyResetDays);
  const rollingAnalysis = analyzeRollingLimit(percents.rolling);
  const monthlyStatus = getMonthlyStatus(monthlyAnalysis);
  const dailyStatus = getDailyStatus(dailyAnalysis);
  const weeklyStatus = getWeeklyStatus(percents.weekly);
  const rollingStatus = getRollingStatus(percents.rolling);

  return {
    percents,
    monthlyAnalysis,
    dailyAnalysis,
    weeklyAnalysis,
    rollingAnalysis,
    monthlyStatus,
    dailyStatus,
    weeklyStatus,
    rollingStatus,
    overallStatus: getOverallStatus(monthlyStatus, dailyStatus, weeklyStatus, rollingStatus)
  };
}

function run() {
  const data = computeAll();
  if (!data) return;

  addDailyUsageItem(data.dailyAnalysis);
  renameRollingToHourly();
  reorderUsageItems();
  addBadges(data);
  addSummaryCard(data);
}

setTimeout(run, 500);

const observer = new MutationObserver(() => setTimeout(run, 100));
setTimeout(() => {
  const el = document.querySelector('[data-slot="usage"]');
  if (el) observer.observe(el, { childList: true, subtree: true, characterData: true });
}, 1000);
