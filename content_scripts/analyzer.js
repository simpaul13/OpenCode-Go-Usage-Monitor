// === DATA EXTRACTION ===

function getMonthlyResetDays() {
  const items = document.querySelectorAll('[data-slot="usage-item"]');

  for (const item of items) {
    const label = item.querySelector('[data-slot="usage-label"]')?.textContent || '';
    if (!label.includes('Monthly')) continue;

    const resetText = item.querySelector('[data-slot="reset-time"]')?.textContent || '';
    const match = resetText.match(/(\d+)\s*days?/i);
    if (match) return parseInt(match[1], 10);
    break;
  }

  const resetEl = document.querySelector('[class*="reset"]');
  if (resetEl) {
    const match = resetEl.textContent.match(/Resets in (\d+)\s*days?/i);
    if (match) return parseInt(match[1], 10);
  }

  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  return lastDay - now.getDate();
}

function getWeeklyResetDays() {
  const items = document.querySelectorAll('[data-slot="usage-item"]');

  for (const item of items) {
    const label = item.querySelector('[data-slot="usage-label"]')?.textContent || '';
    if (!label.includes('Weekly')) continue;

    const text = item.querySelector('[data-slot="reset-time"]')?.textContent || '';
    const days = text.match(/(\d+)\s*days?/i);
    if (days) return Math.max(1, parseInt(days[1], 10));

    const hasHoursOrMinutes = /hours?|minutes?/i.test(text);
    if (hasHoursOrMinutes) return 1;
    break;
  }

  return 7 - new Date().getDay();
}

function parseAllPercents() {
  const result = { rolling: 0, weekly: 0, monthly: 0 };
  const items = document.querySelectorAll('[data-slot="usage-item"]');

  for (const item of items) {
    const valueEl = item.querySelector('[data-slot="usage-value"]');
    const label = item.querySelector('[data-slot="usage-label"]')?.textContent || '';
    if (!valueEl) continue;

    const percent = parseInt(valueEl.textContent, 10);
    if (isNaN(percent)) continue;

    if (label.includes('Rolling') || label.includes('Hourly')) {
      result.rolling = percent;
    } else if (label.includes('Weekly')) {
      result.weekly = percent;
    } else if (label.includes('Monthly')) {
      result.monthly = percent;
    }
  }

  return result;
}
