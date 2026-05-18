// js/ui.js – Updated showPage with active class fix

import { setEl } from './utils.js';
import { loadGamesFromDB } from './games.js';
import { currentUserId, availableSpins } from './auth.js';
import { loadDashboardStats } from './agent.js';
import { updateDailyTimer } from './tasks.js'; // <-- added for tasks page timer

export async function showPage(nav) {
  const container = document.getElementById('pageContainer');
  if (!container) return;

  // Update bottom nav active class
  document.querySelectorAll('.bnav-btn').forEach(b => b.classList.remove('active'));
  const activeBtn = document.querySelector(`.bnav-btn[data-nav="${nav}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  // Show/hide top area
  const topArea = document.getElementById('topArea');
  if (nav === 'tasks' || nav === 'agent') {
    if (topArea) topArea.style.display = 'none';
  } else {
    if (topArea) topArea.style.display = '';
  }

  // Determine which file to load
  let file = '';
  if (nav === 'home') file = 'html/home.html';
  else if (nav === 'tasks') file = 'html/tasks.html';
  else if (nav === 'agent') file = 'html/agent.html';
  else if (nav === 'cs') file = 'html/cs.html';
  else if (nav === 'account') file = 'html/account.html';
  else return;

  try {
    const res = await fetch(file);
    if (!res.ok) throw new Error('Page not found');
    const html = await res.text();
    container.innerHTML = html;

    // ✅ Add active class to the newly loaded page panel
    const pagePanel = container.querySelector('.page-panel');
    if (pagePanel) pagePanel.classList.add('active');

    // Page‑specific initialization
    if (nav === 'home') {
      loadGamesFromDB();
    }
    if (nav === 'tasks') {
      // Start daily timer
      updateDailyTimer();
      setInterval(updateDailyTimer, 1000);

      // Enable spin button if user has spins
      if (currentUserId && availableSpins > 0) {
        const spinBtn = document.getElementById('spinBtn');
        if (spinBtn) spinBtn.disabled = false;
      }
    }
    if (nav === 'agent') {
      if (currentUserId) {
        loadDashboardStats(currentUserId);
      }
    }
  } catch (err) {
    container.innerHTML = '<p style="color:red;padding:20px;">စာမျက်နှာ ဖွင့်မရပါ</p>';
    console.error(err);
  }
}

// ---------- banner, language, category, level modal (unchanged) ----------
export function initBanner() {
  const track = document.getElementById('bannerTrack');
  const dots = document.querySelectorAll('#bannerDots .dot');
  const wrap = document.getElementById('bannerWrap');
  if (!track || !dots.length || !wrap) return;

  let cur = 0;
  let tmr = null;

  const update = () => {
    track.style.transform = `translateX(-${cur * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === cur));
  };
  const go = (n) => {
    cur = ((n % 3) + 3) % 3;
    update();
  };
  const start = () => {
    clearInterval(tmr);
    tmr = setInterval(() => go(cur + 1), 4000);
  };

  dots.forEach(d => d.addEventListener('click', () => {
    go(+d.dataset.i);
    start();
  }));

  let sx = 0;
  wrap.addEventListener('touchstart', e => {
    sx = e.touches[0].clientX;
  }, { passive: true });
  wrap.addEventListener('touchend', e => {
    const d = sx - e.changedTouches[0].clientX;
    if (Math.abs(d) > 40) go(d > 0 ? cur + 1 : cur - 1);
    start();
  }, { passive: true });

  update();
  start();
}

export function initLanguageToggle() {
  const langBtn = document.getElementById('langBtn');
  if (!langBtn) return;
  langBtn.addEventListener('click', () => {
    const label = document.getElementById('langLabel');
    if (!label) return;
    const isEn = label.textContent === 'မြန်မာ';
    setEl('langLabel', isEn ? 'EN' : 'မြန်မာ');
  });
}

export function initCategorySidebar() {
  document.querySelectorAll('.cat-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.cat-item').forEach(el => el.classList.remove('active'));
      item.classList.add('active');
      // Future: filter games by category
    });
  });
}

export function initLevelModal() {
  const agentLevels = [
    { lv: 1, req: 0 }, { lv: 2, req: 100 }, { lv: 3, req: 300 }, { lv: 4, req: 500 },
    { lv: 5, req: 800 }, { lv: 6, req: 1000 }, { lv: 7, req: 10000 }, { lv: 8, req: 30000 },
    { lv: 9, req: 50000 }, { lv: 10, req: 80000 }, { lv: 11, req: 100000 }, { lv: 12, req: 1000000 },
    { lv: 13, req: 3000000 }, { lv: 14, req: 5000000 }, { lv: 15, req: 8000000 },
    { lv: 16, req: 10000000 }, { lv: 17, req: 100000000 }, { lv: 18, req: 300000000 },
    { lv: 19, req: 500000000 }, { lv: 20, req: 800000000 }
  ];

  function getLevelColor(lv) {
    if (lv <= 2) return { a: '#CD7F32', b: '#8B4513' };
    if (lv <= 4) return { a: '#A8A9AD', b: '#606060' };
    if (lv <= 6) return { a: '#FFD700', b: '#B8860B' };
    if (lv <= 8) return { a: '#4169E1', b: '#1E3A8A' };
    if (lv <= 10) return { a: '#A855F7', b: '#6B21A8' };
    if (lv <= 14) return { a: '#F97316', b: '#C2410C' };
    if (lv <= 16) return { a: '#06B6D4', b: '#0E7490' };
    if (lv <= 18) return { a: '#C084FC', b: '#7E22CE' };
    return { a: '#EF4444', b: '#991B1B' };
  }

  function buildLevelModal() {
    const body = document.getElementById('levelModalBody');
    if (!body) return;
    const userLv = parseInt(document.getElementById('userLevelNum')?.textContent || '1');
    body.innerHTML = agentLevels.map(({ lv, req }) => {
      const { a, b } = getLevelColor(lv);
      const isCurrent = lv === userLv;
      const svg = `<svg width="36" height="36" viewBox="0 0 36 36"><defs><linearGradient id="g${lv}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${a}"/><stop offset="100%" stop-color="${b}"/></linearGradient></defs><polygon points="18,2 32,10 32,26 18,34 4,26 4,10" fill="url(#g${lv})" opacity=".25" stroke="${a}" stroke-width="1.5"/><polygon points="18,6 28,12 28,24 18,30 8,24 8,12" fill="url(#g${lv})" opacity=".6"/><text x="18" y="22" text-anchor="middle" fill="white" font-size="${lv>=10?9:11}" font-weight="900" font-family="sans-serif">${lv}</text></svg>`;
      return `<div class="level-row${isCurrent ? ' current-level' : ''}"><div class="level-badge-icon">${svg}</div><div class="level-row-name" style="color:${isCurrent ? 'var(--accent)' : '#fff'}">LV${lv}${isCurrent ? ' ✓' : ''}</div><div class="level-row-req" style="color:${a}">${req === 0 ? '0.00' : req.toLocaleString() + '.00'}</div></div>`;
    }).join('');
  }

  const levelBtn = document.getElementById('levelBtn');
  const levelModal = document.getElementById('levelModal');
  const levelModalClose = document.getElementById('levelModalClose');

  if (levelBtn && levelModal) {
    levelBtn.addEventListener('click', () => {
      buildLevelModal();
      levelModal.classList.add('show');
    });
  }
  if (levelModalClose) {
    levelModalClose.addEventListener('click', () => {
      levelModal?.classList.remove('show');
    });
  }
  if (levelModal) {
    levelModal.addEventListener('click', e => {
      if (e.target === levelModal) levelModal.classList.remove('show');
    });
  }
}
