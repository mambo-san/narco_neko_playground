
// ===== Helpers =====
const KEY = 'roadmap-checks-v12';



const HOVER_STYLE_ID = 'roadmap-hover-styles';
function injectHoverStyles() {
    if (document.getElementById(HOVER_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = HOVER_STYLE_ID;
    style.textContent = `
#yearsPanel details > summary { 
  cursor: pointer;
  padding: 8px 10px;
  border-radius: 8px;
  transition: background-color .15s ease, color .15s ease, box-shadow .15s ease;
}
#yearsPanel details > summary:hover { 
  background: var(--year-hover-bg, #f0f7ff);
  color: var(--year-hover-fg, #0b5cab);
  box-shadow: 0 0 0 2px rgba(11,92,171,.15) inset;
}
#yearsPanel details[open] > summary { 
  background: var(--year-open-bg, #f6fbff);
}
#yearsPanel .year-label { 
  font-weight: 700; 
  margin-right: .35rem; 
}
#yearsPanel details > summary:hover .year-label { 
  text-decoration: underline; 
}
#yearsPanel details > summary:focus-visible {
  outline: 2px solid #0b5cab;
  outline-offset: 2px;
}
        `;
    document.head.appendChild(style);
}

// ===== Animations =====
function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

async function crossfadeSwap(showEl, hideEl) {
    if (!showEl || !hideEl) return;
    if (prefersReducedMotion()) {
        hideEl.style.display = 'none';
        hideEl.hidden = true;
        showEl.hidden = false;
        showEl.style.display = 'block';
        return;
    }
    // Prepare elements
    showEl.hidden = false;
    showEl.style.display = 'block';
    showEl.style.opacity = '0';
    showEl.style.transform = 'translateY(4px)';
    // Fade out old
    const fadeOut = hideEl.animate(
        [{ opacity: 1, transform: 'translateY(0px)' }, { opacity: 0, transform: 'translateY(-4px)' }],
        { duration: 0, easing: 'ease-out' }
    );
    try { await fadeOut.finished; } catch (e) { }
    hideEl.style.display = 'none';
    hideEl.hidden = true;
    // Fade in new
    const fadeIn = showEl.animate(
        [{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'translateY(0px)' }],
        { duration: 240, easing: 'ease-out' }
    );
    try { await fadeIn.finished; } catch (e) { }
    showEl.style.opacity = '';
    showEl.style.transform = '';
}

// Smooth open/close for <details>
function setupDetailsAccordionAnimations(rootEl) {
    const root = rootEl || document;
    root.addEventListener('click', (ev) => {
        const summary = ev.target.closest('#yearsPanel details > summary');
        if (!summary) return;
        const details = summary.parentElement;
        // custom animate; prevent default toggle
        ev.preventDefault();
        if (details.dataset.animating === '1') return;
        const content = summary.nextElementSibling;
        if (!content) return;

        const reduce = prefersReducedMotion();

        if (!details.open) {
            // Opening
            details.dataset.animating = '1';
            details.open = true;
            if (reduce) { details.dataset.animating = ''; return; }
            const start = 0;
            const end = content.scrollHeight;
            content.style.overflow = 'hidden';
            content.style.height = start + 'px';
            content.style.opacity = '0';
            const anim = content.animate(
                [{ height: start + 'px', opacity: 0 }, { height: end + 'px', opacity: 1 }],
                { duration: 240, easing: 'ease-out' }
            );
            anim.onfinish = () => {
                content.style.height = '';
                content.style.opacity = '';
                content.style.overflow = '';
                details.dataset.animating = '';
            };
            anim.oncancel = anim.onfinish;
        } else {
            // Closing
            details.dataset.animating = '1';
            if (reduce) { details.open = false; details.dataset.animating = ''; return; }
            const start = content.offsetHeight;
            const end = 0;
            content.style.overflow = 'hidden';
            const anim = content.animate(
                [{ height: start + 'px', opacity: 1 }, { height: end + 'px', opacity: 0 }],
                { duration: 150, easing: 'ease-in' }
            );
            anim.onfinish = () => {
                details.open = false;
                content.style.height = '';
                content.style.overflow = '';
                details.dataset.animating = '';
            };
            anim.oncancel = anim.onfinish;
        }
    }, { capture: true });
}

function buildYearSection(yearData) {
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.classList.add('year-summary');
    summary.innerHTML = `<span class="year-label">${yearData.year}年</span> ${yearData.title}`;
    details.appendChild(summary);

    const content = document.createElement('div');
    content.className = 'content';

    // toolbar
    const btns = document.createElement('div');
    btns.className = 'btns';
    btns.style.margin = '6px 0 10px 0';
    const toggle = document.createElement('button');
    toggle.className = 'toggleView';
    toggle.dataset.year = String(yearData.year);
    toggle.textContent = 'チャート表示';
    btns.appendChild(toggle);
    content.appendChild(btns);

    // table & gantt wrappers
    const ytable = document.createElement('div'); ytable.className = 'ytable'; ytable.id = `ytable-${yearData.year}`;
    const ygantt = document.createElement('div'); ygantt.className = 'ygantt'; ygantt.id = `ygantt-${yearData.year}`; ygantt.hidden = true;
    ygantt.innerHTML = '<div class="grid head"></div><div class="grid body"></div>';

    content.appendChild(ytable);
    content.appendChild(ygantt);

    // build default view (table)
    buildSectionTableFromData(ytable, yearData.tasks);

    details.appendChild(content);
    return details;
}

function buildSectionTableFromData(tableWrap, tasks) {
    if (!tableWrap || tableWrap.dataset.built) return;
    const tbl = document.createElement('table');
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th class="col-check">✓</th><th class="col-task">タスク</th><th class="col-deliv">成果物</th><th class="col-period">期間</th></tr>';
    const tbody = document.createElement('tbody');

    const state = JSON.parse(localStorage.getItem(KEY) || '{ }');

    tasks.forEach(t => {
        const tr = document.createElement('tr');
        const tdCheck = document.createElement('td'); tdCheck.className = 'col-check';
        const mirror = document.createElement('input'); mirror.type = 'checkbox'; mirror.checked = !!state[t.id]; mirror.title = `開始: ${t.start} / 期限: ${t.end}`;
        mirror.addEventListener('change', () => {
            state[t.id] = mirror.checked; localStorage.setItem(KEY, JSON.stringify(state));
            // reflect in gantt if built
            const bar = document.querySelector(`.ygantt .bar[data-id="${t.id}"]`);
            if (bar) bar.classList.toggle('done', mirror.checked);
        });
        tdCheck.appendChild(mirror);

        const tdTask = document.createElement('td'); tdTask.className = 'col-task'; tdTask.textContent = t.label;
        const tdDeliv = document.createElement('td'); tdDeliv.className = 'col-deliv'; tdDeliv.textContent = t.deliverable || '';
        const tdPeriod = document.createElement('td'); tdPeriod.className = 'col-period'; tdPeriod.textContent = `開始: ${t.start} / 期限: ${t.end}`;
        tr.append(tdCheck, tdTask, tdDeliv, tdPeriod); tbody.appendChild(tr);
    });
    tbl.append(thead, tbody); tableWrap.appendChild(tbl); tableWrap.dataset.built = '1';
}

function buildSectionGanttFromData(sectionEl, tasks) {
    const wrap = sectionEl.querySelector('.ygantt');
    const head = wrap.querySelector('.head');
    const body = wrap.querySelector('.body');
    head.innerHTML = ''; body.innerHTML = '';
    const months = Array.from({ length: 12 }, (_, i) => `${i + 1}月`);
    months.forEach(m => {
        const c = document.createElement('div');
        c.className = 'cell';
        c.textContent = m;     // show month label
        head.appendChild(c);
    });

    const state = JSON.parse(localStorage.getItem(KEY) || '{ }');

    const toIndex = (dateStr) => { const [, M] = dateStr.split('-').map(Number); return Math.max(0, Math.min(11, (M || 1) - 1)); };

    const tasksSorted = [...tasks].sort((a, b) => new Date(a.start) - new Date(b.start));

    tasksSorted.forEach(t => {
        for (let i = 0; i < 12; i++) { const c = document.createElement('div'); c.className = 'cell'; body.appendChild(c); } // row bg
        const s = toIndex(t.start), e = toIndex(t.end); const span = (e - s) + 1;
        const cell = document.createElement('div'); cell.className = 'cell'; cell.style.gridColumn = `${s + 1} / span ${span}`;
        const bar = document.createElement('div'); bar.className = 'bar' + (t.warn ? ' warn' : ''); bar.dataset.id = t.id; bar.title = `開始: ${t.start} / 期限: ${t.end}`; bar.textContent = t.label;
        bar.classList.toggle('done', !!state[t.id]);
        cell.appendChild(bar); body.appendChild(cell);
    });
    wrap.hidden = false;
}

// ===== Boot =====
(function init() {
    const yearsPanel = document.getElementById('yearsPanel');
    injectHoverStyles();
    const container = document.createElement('div');

    // Inject years
    (window.roadmapData || []).forEach(y => {
        const sec = buildYearSection(y);
        container.appendChild(sec);
    });
    yearsPanel.appendChild(container);

    // toggle handlers

    yearsPanel.addEventListener('click', async (e) => {
        const btn = e.target.closest('.toggleView');
        if (!btn) return;
        const section = btn.closest('.content');
        const chart = section?.querySelector('.ygantt');
        const table = section?.querySelector('.ytable');
        if (!section || !chart || !table) return;

        const yearData = (window.roadmapData.find(y => String(y.year) === btn.dataset.year) || {});
        if (chart.hidden || chart.style.display === 'none') {
            // Ensure chart is built once
            buildSectionGanttFromData(section, yearData.tasks || []);
            crossfadeSwap(chart, table);
            btn.textContent = 'チェックリスト表示';
        } else {
            crossfadeSwap(table, chart);
            btn.textContent = 'チャート表示';
        }
    });
    // quick controls
    const detailsEls = () => [...yearsPanel.querySelectorAll('details')];
    document.getElementById('expandYears').onclick = () => detailsEls().forEach(d => d.open = true);
    document.getElementById('collapseYears').onclick = () => detailsEls().forEach(d => d.open = false);


    // sticky shadow toggle
    (function () {
        const header = document.querySelector('#yearsPanel > header');
        const panel = document.getElementById('yearsPanel');
        if (!header || !panel) return;
        const onScroll = () => { const stuck = window.scrollY > panel.offsetTop; header.classList.toggle('stuck', stuck); };
        window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    })();
})();

// init accordion animations
setupDetailsAccordionAnimations(document);
