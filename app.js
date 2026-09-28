const COLORS = { 2024: '#1f6b96', 2025: '#e87522', 2026: '#1f7a37' };
const fmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
const pct = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 });

let model;

const $ = id => document.getElementById(id);
const formatDate = iso => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));

function comparableGrowth(year) {
  const current = model.monthly.filter(r => r.year === year);
  const lastMonth = Math.max(...current.map(r => r.month));
  const prior = model.monthly.filter(r => r.year === year - 1 && r.month <= lastMonth);
  if (prior.length !== lastMonth) return null;
  const currentNet = current.reduce((s, r) => s + r.net_sales, 0);
  const priorNet = prior.reduce((s, r) => s + r.net_sales, 0);
  return currentNet / priorNet - 1;
}

function renderKpis(year) {
  const total = model.year_totals[String(year)];
  const source = model.sources.find(s => s.role_year === year && s.coverage_end.endsWith(year === 2026 ? '08-31' : '12-31')) || model.sources.find(s => s.role_year === year);
  const growth = comparableGrowth(year);
  $('net-sales').textContent = compact.format(total.net_sales);
  $('yoy').textContent = growth === null ? 'n/a' : pct.format(growth);
  $('yoy-note').textContent = growth === null ? 'Prior-year coverage incomplete' : 'Same months vs prior year';
  $('documents').textContent = fmt.format(total.invoices);
  $('customers').textContent = fmt.format(total.active_customers);
  $('average').textContent = fmt.format(total.net_sales / total.invoices);
  $('discount').textContent = pct.format(total.discount_rate);
  $('coverage').textContent = `Coverage through ${formatDate(source.coverage_end)}`;
  $('group-year').textContent = `${year}`;
}

function svgEl(name, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', name);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

function renderTrend() {
  const holder = $('trend-chart');
  holder.innerHTML = '';
  const width = Math.max(holder.clientWidth, 620), height = Math.max(holder.clientHeight, 300);
  const margin = { top: 18, right: 22, bottom: 42, left: 70 };
  const plotW = width - margin.left - margin.right, plotH = height - margin.top - margin.bottom;
  const max = Math.max(...model.monthly.map(r => r.net_sales)) * 1.12;
  const svg = svgEl('svg', { viewBox: `0 0 ${width} ${height}`, 'aria-hidden': 'true' });
  const x = month => margin.left + ((month - 1) / 11) * plotW;
  const y = value => margin.top + plotH - (value / max) * plotH;

  for (let i = 0; i <= 4; i++) {
    const value = (max / 4) * i;
    const yy = y(value);
    svg.appendChild(svgEl('line', { x1: margin.left, x2: width - margin.right, y1: yy, y2: yy, class: 'gridline' }));
    const label = svgEl('text', { x: margin.left - 10, y: yy + 4, 'text-anchor': 'end', class: 'axis-label' });
    label.textContent = compact.format(value);
    svg.appendChild(label);
  }
  model.month_names.forEach((m, i) => {
    const label = svgEl('text', { x: x(i + 1), y: height - 13, 'text-anchor': 'middle', class: 'axis-label' });
    label.textContent = m;
    svg.appendChild(label);
  });
  [2024, 2025, 2026].forEach(year => {
    const rows = model.monthly.filter(r => r.year === year).sort((a,b) => a.month-b.month);
    if (!rows.length) return;
    let d = '';
    rows.forEach((r, i) => { d += `${i === 0 ? 'M' : 'L'}${x(r.month)},${y(r.net_sales)} `; });
    svg.appendChild(svgEl('path', { d, class: 'trend-line', stroke: COLORS[year] }));
    rows.forEach(r => svg.appendChild(svgEl('circle', { cx: x(r.month), cy: y(r.net_sales), r: 4, class: 'point', fill: COLORS[year] })));
  });
  holder.appendChild(svg);
  $('legend').innerHTML = [2024, 2025, 2026].map(y => `<span><i style="background:${COLORS[y]}"></i>${y}</span>`).join('');
}

function renderBars(year) {
  const rows = model.rankings.item_group[String(year)].slice(0, 10);
  const max = rows[0]?.net_sales || 1;
  $('group-chart').innerHTML = rows.map(r => `
    <div class="bar-row">
      <div class="bar-label">${escapeHtml(r.name)}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.max(2, (r.net_sales/max)*100)}%"></div></div>
      <div class="bar-value">${compact.format(r.net_sales)}</div>
    </div>`).join('');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function renderTable(id, rows, total) {
  $(id).innerHTML = rows.slice(0, 10).map((r, i) => `<tr><td>${i+1}</td><td>${escapeHtml(r.name)}</td><td>${fmt.format(r.net_sales)}</td><td>${pct.format(r.net_sales/total)}</td></tr>`).join('');
}

function renderYear(year) {
  renderKpis(year);
  renderBars(year);
  const total = model.year_totals[String(year)].net_sales;
  renderTable('customer-rows', model.rankings.customer[String(year)], total);
  renderTable('product-rows', model.rankings.product[String(year)], total);
}

async function init() {
  const response = await fetch('dashboard-data.json');
  if (!response.ok) throw new Error('Dashboard data could not be loaded.');
  model = await response.json();
  renderTrend();
  renderYear(Number($('year-select').value));
  $('year-select').addEventListener('change', event => renderYear(Number(event.target.value)));
  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(renderTrend, 140); });
}

init().catch(error => {
  document.querySelector('main').innerHTML = `<section class="panel" style="padding:24px"><h1>Dashboard unavailable</h1><p>${escapeHtml(error.message)}</p></section>`;
});
