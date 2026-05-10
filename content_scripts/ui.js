// === TOOLTIPS ===

function buildTooltip(type, percent, data) {
  if (type === 'daily') {
    const d = data.dailyAnalysis;
    const sign = d.headroomPerDay >= 0 ? '+' : '';

    const monthlyItem = [...document.querySelectorAll('[data-slot="usage-item"]')].find(item =>
      item.querySelector('[data-slot="usage-label"]')?.textContent.includes('Monthly')
    );
    const resetText = monthlyItem?.querySelector('[data-slot="reset-time"]')?.textContent || '';

    return `Daily burn: ${d.burnPerDay}%/day · Safe max: ${d.safePerDay}%/day · Headroom: ${sign}${d.headroomPerDay}%/day — ${resetText}`;
  }
  if (type === 'monthly') {
    const m = data.monthlyAnalysis;
    if (m.willRunOut) {
      const short = Math.max(0, m.daysRemaining - m.daysUntilEmpty);
      return `Burning ${m.burnRatePerDay}% per day. At this pace, monthly quota will hit 100% in ${m.daysUntilEmpty} days. Reset is still ${m.daysRemaining} days away. You will run out ${short} day(s) before reset. To survive, stay under ${m.safeBudget}% per day.`;
    }
    return `On pace — burning ${m.burnRatePerDay}% per day. Projected to use ${m.projectedEnd}% by reset. Safe monthly budget: ${m.safeBudget}% per day.`;
  }
  if (type === 'rolling') {
    const r = data.rollingAnalysis;
    return `${r.percentUsed}% of your 5-hour window used. ${r.percentLeft}% left. Max safe pace: ${r.safePerHour}% per hour.`;
  }
  if (type === 'weekly') {
    const w = data.weeklyAnalysis;
    return `${w.percentUsed}% of this week's limit used. ${w.percentLeft}% left. Max safe pace: ${w.safePerDay}% per day for ${w.daysRemaining} day(s).`;
  }
  return '';
}

// === DOM HELPERS ===

function getUsageContainer() {
  return document.querySelector('[data-slot="usage"]');
}

function timeUntilMidnight() {
  const now = new Date();
  const ms = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h} hours, ${m} minutes`;
}

function addDailyUsageItem(daily) {
  const container = getUsageContainer();
  if (!container) return;
  container.querySelector('.oc-daily-usage-item')?.remove();

  const el = document.createElement('div');
  el.className = 'oc-daily-usage-item';
  el.setAttribute('data-slot', 'usage-item');
  el.innerHTML = `
    <div data-slot="usage-header">
      <span data-slot="usage-label">Daily Usage</span>
      <span data-slot="usage-value">${daily.burnPerDay}%</span>
    </div>
    <div data-slot="progress">
      <div data-slot="progress-bar" style="width:0%"></div>
    </div>
    <span data-slot="reset-time">Reset in ${timeUntilMidnight()}</span>`;
  container.appendChild(el);
}

function renameRollingToHourly() {
  document.querySelectorAll('[data-slot="usage-item"]').forEach(item => {
    const span = item.querySelector('[data-slot="usage-label"]');
    if (span && span.textContent === 'Rolling Usage') span.textContent = 'Hourly Usage';
  });
}

function reorderUsageItems() {
  const container = getUsageContainer();
  if (!container) return;
  const order = ['Hourly Usage', 'Daily Usage', 'Weekly Usage', 'Monthly Usage'];
  const items = [...container.querySelectorAll('[data-slot="usage-item"]')];
  for (const label of order) {
    const found = items.find(i =>
      i.querySelector('[data-slot="usage-label"]')?.textContent === label
    );
    if (found) container.appendChild(found);
  }
}

// === BADGES ===

function addBadges(data) {
  document.querySelectorAll('.oc-badge-wrap').forEach(el => el.remove());

  document.querySelectorAll('[data-slot="usage-item"]').forEach(item => {
    const valEl = item.querySelector('[data-slot="usage-value"]');
    const label = item.querySelector('[data-slot="usage-label"]')?.textContent || '';
    if (!valEl) return;
    const percent = parseInt(valEl.textContent, 10);
    if (isNaN(percent)) return;

    let type, status, tooltip, progressPct;

    if (label.includes('Hourly') || label.includes('Rolling')) {
      type = 'rolling'; status = data.rollingStatus;
      progressPct = percent;
    } else if (label.includes('Daily')) {
      type = 'daily'; status = data.dailyStatus;
      progressPct = data.dailyAnalysis.safePerDay > 0
        ? Math.min(100, Math.round((data.dailyAnalysis.burnPerDay / data.dailyAnalysis.safePerDay) * 100))
        : 100;
    } else if (label.includes('Weekly')) {
      type = 'weekly'; status = data.weeklyStatus;
      progressPct = percent;
    } else if (label.includes('Monthly')) {
      type = 'monthly'; status = data.monthlyStatus;
      progressPct = percent;
    } else return;

    tooltip = buildTooltip(type, percent, data);

    const progressDiv = item.querySelector('[data-slot="progress"]');
    if (!progressDiv) return;

    const color = statusColor(status);

    const wrap = document.createElement('div');
    wrap.className = 'oc-badge-wrap';
    wrap.style.cssText = 'display:flex;align-items:center;gap:10px;margin-top:5px;';

    const clone = progressDiv.cloneNode(true);
    const bar = clone.querySelector('[data-slot="progress-bar"]');
    if (bar) {
      bar.style.width = `${progressPct}%`;
      if (status !== 'green') bar.style.backgroundColor = color;
    }

    const pill = document.createElement('span');
    pill.title = tooltip;
    pill.style.cssText = `display:inline-flex;align-items:center;gap:5px;padding:2px 8px 2px 6px;border-radius:999px;font-size:11px;font-weight:600;font-family:system-ui,-apple-system,sans-serif;white-space:nowrap;cursor:help;color:${color};background:${color}1a;border:1px solid ${color}40;line-height:1.6`;
    pill.innerHTML = `<span style="width:6px;height:6px;border-radius:50%;background:${color};display:inline-block;flex-shrink:0"></span>${statusLabel(status)}`;

    progressDiv.parentNode.insertBefore(wrap, progressDiv);
    wrap.appendChild(clone);
    wrap.appendChild(pill);
    progressDiv.remove();
  });
}

// === SECTION BUILDER (for summary card) ===

function cardSection(title, statusColor, statusLabelText, value1, label1, value2, label2, footer) {
  const c = statusColor;
  return `
    <div style="padding:14px;border-radius:12px;background:${c}10;border:1px solid ${c}30">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <span style="font-size:12px;color:${c};font-weight:700">${title}</span>
        <span style="font-size:11px;color:${c};background:${c}1f;padding:3px 7px;border-radius:999px">${statusLabelText}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div><div style="font-size:11px;color:rgba(255,255,255,0.42)">${label1}</div><div style="font-size:22px;font-weight:800;color:white">${value1}</div></div>
        <div><div style="font-size:11px;color:rgba(255,255,255,0.42)">${label2}</div><div style="font-size:22px;font-weight:800;color:${c}">${value2}</div></div>
      </div>
      ${footer ? `<div style="margin-top:10px;font-size:11px;color:rgba(255,255,255,0.45)">${footer}</div>` : ''}
    </div>`;
}

// === SUMMARY CARD ===

function addSummaryCard(data) {
  const section = getUsageContainer()?.closest('section');
  if (!section || section.querySelector('.oc-summary-card')) return;

  const { dailyAnalysis: d, monthlyAnalysis: m, weeklyAnalysis: w, rollingAnalysis: r } = data;
  const { percents: p, dailyStatus, monthlyStatus, weeklyStatus, rollingStatus, overallStatus } = data;

  const accent = statusColor(overallStatus);
  const isDanger = overallStatus === 'red';
  const isWarning = overallStatus === 'yellow';
  const monthlyColor = statusColor(monthlyStatus);

  const verdictText = m.willRunOut
    ? `Will run out ${Math.max(0, m.daysRemaining - m.daysUntilEmpty)}d before reset`
    : 'Safe until reset';

  const verdictSubtext = m.willRunOut
    ? `Reduce monthly usage to ${m.safeBudget}%/day to reach reset.`
    : `Projected monthly usage: ${m.projectedEnd}% by reset.`;

  const forecastColor = m.projectedEnd > 100 ? '#f87171' : '#22c55e';
  const headroomColor = d.headroomPerDay >= 0 ? '#22c55e' : '#f87171';
  const headroomSign = d.headroomPerDay >= 0 ? `+${d.headroomPerDay}` : `${d.headroomPerDay}`;

  const card = document.createElement('div');
  card.className = 'oc-summary-card';
  card.style.cssText = 'margin-top:16px;border-radius:14px;border:1px solid rgba(255,255,255,0.08);background:rgba(18,18,20,0.96);font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overflow:hidden;box-shadow:0 12px 30px rgba(0,0,0,0.18)';
  card.innerHTML = `
    <div style="height:3px;background:${accent}"></div>
    <div style="padding:18px;display:flex;flex-direction:column;gap:18px">

      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px">
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span style="width:9px;height:9px;border-radius:999px;background:${accent};box-shadow:0 0 0 4px ${accent}22"></span>
            <span style="font-size:14px;font-weight:700;color:${accent}">${verdictText}</span>
          </div>
          <div style="font-size:12px;color:rgba(255,255,255,0.55)">${verdictSubtext}</div>
        </div>
        <div style="text-align:right;font-size:12px;color:rgba(255,255,255,0.5);white-space:nowrap">
          <div><strong style="color:rgba(255,255,255,0.85)">${m.daysRemaining}d</strong> left</div>
          <div>${m.daysElapsed}d used</div>
        </div>
      </div>

      <div style="padding:14px;border-radius:12px;background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.07)">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:10px">
          <div>
            <div style="font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.04em">Monthly forecast</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:2px">${p.monthly}% used · ${m.percentLeft}% remaining</div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px">
              <span style="font-size:11px;color:rgba(255,255,255,0.62);background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);padding:4px 8px;border-radius:999px">Daily burn: ${d.burnPerDay}%/day</span>
              <span style="font-size:11px;color:#22c55e;background:#22c55e12;border:1px solid #22c55e30;padding:4px 8px;border-radius:999px">Daily safe max: ${d.safePerDay}%/day</span>
              <span style="font-size:11px;color:${headroomColor};background:${headroomColor}12;border:1px solid ${headroomColor}30;padding:4px 8px;border-radius:999px">Daily headroom: ${headroomSign}%/day</span>
            </div>
          </div>
          <div style="font-size:22px;font-weight:800;color:${forecastColor};white-space:nowrap">${m.projectedEnd}%</div>
        </div>
        <div style="height:9px;border-radius:999px;background:rgba(255,255,255,0.08);overflow:hidden;position:relative">
          <div style="position:absolute;left:0;top:0;height:100%;width:${Math.min(100, p.monthly)}%;background:${monthlyColor};border-radius:999px"></div>
          <div style="position:absolute;left:${Math.min(100, m.projectedEnd)}%;top:-3px;width:2px;height:15px;background:${forecastColor};opacity:0.9"></div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:11px;color:rgba(255,255,255,0.38)">
          <span>Current: ${p.monthly}%</span>
          <span>Projected reset usage: ${m.projectedEnd}%</span>
          <span>Limit: 100%</span>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px">
        ${cardSection('Daily', statusColor(dailyStatus), statusLabel(dailyStatus), `${d.burnPerDay}%`, 'Burn', `${d.safePerDay}%`, 'Safe max', `Headroom: ${headroomSign}%/day`)}
        ${cardSection('Monthly', statusColor(monthlyStatus), statusLabel(monthlyStatus), `${p.monthly}%`, 'Used', `${m.percentLeft}%`, 'Left', `Projected: ${m.projectedEnd}% by reset`)}
        ${cardSection('Weekly', statusColor(weeklyStatus), statusLabel(weeklyStatus), `${w.percentLeft}%`, 'Left', `${w.safePerDay}%`, 'Max / day', `${w.daysRemaining}d until weekly reset`)}
        ${cardSection('Hourly (5h)', statusColor(rollingStatus), statusLabel(rollingStatus), `${r.percentLeft}%`, 'Left', `${r.safePerHour}%`, 'Max / hr', 'Use slowly inside rolling window')}
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border-radius:12px;background:${accent}10;border:1px solid ${accent}25">
        <div>
          <div style="font-size:12px;font-weight:700;color:${accent};margin-bottom:2px">${isDanger ? 'Action needed' : isWarning ? 'Use carefully' : 'Current pace okay'}</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.55)">To max monthly safely, keep daily under ${d.safePerDay}%/day, weekly under ${w.safePerDay}%/day, and rolling under ${r.safePerHour}%/hr.</div>
        </div>
        <div style="font-size:12px;font-weight:800;color:${accent};white-space:nowrap">${statusLabel(overallStatus)}</div>
      </div>
    </div>`;

  getUsageContainer().insertAdjacentElement('afterend', card);
}
