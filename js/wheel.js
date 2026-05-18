// wheel.js – Lucky Wheel Logic

import { supabase } from './config.js';
import { currentUserId, availableSpins } from './auth.js';
import { gToast, setEl } from './utils.js';

const wheelSlots = [
  { label: '5,000', amount: 5000, color: '#6B1010' },
  { label: '15,000', amount: 15000, color: '#3D0707' },
  { label: '30,000', amount: 30000, color: '#6B1010' },
  { label: '50,000', amount: 50000, color: '#3D0707' },
  { label: '65,000', amount: 65000, color: '#6B1010' },
  { label: '80,000', amount: 80000, color: '#3D0707' },
  { label: 'ဗလာ', amount: 0, color: '#151525' },
  { label: 'ဗလာ', amount: 0, color: '#0D0D18' }
];

const turnoverMult = {
  5000: 5, 15000: 6, 30000: 7, 50000: 10, 65000: 12, 80000: 15
};

let canvas, ctx;
let wheelAngle = 0;
let isSpinning = false;
let animId = null;

function drawWheel(angle) {
  const sz = 260, cx = sz / 2, cy = sz / 2, r = 118, sa = (Math.PI * 2) / 8;
  ctx.clearRect(0, 0, sz, sz);

  // Outer ring
  ctx.beginPath();
  ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
  ctx.strokeStyle = '#C9A227';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Slices
  wheelSlots.forEach((slot, i) => {
    const start = angle + i * sa;
    const end = start + sa;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle = slot.color;
    ctx.fill();
    ctx.strokeStyle = '#C9A227';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + sa / 2);
    ctx.fillStyle = slot.amount === 0 ? '#333' : '#FFD700';
    ctx.font = 'bold 10px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 4;
    ctx.fillText(slot.label, r * 0.62, 0);
    ctx.restore();
  });

  // Center hub
  const cg = ctx.createRadialGradient(cx - 5, cy - 5, 3, cx, cy, 22);
  cg.addColorStop(0, '#FFE55C');
  cg.addColorStop(1, '#8B6014');
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.fillStyle = cg;
  ctx.fill();
  ctx.strokeStyle = '#C9A227';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Arrow indicator
  ctx.beginPath();
  ctx.moveTo(cx, cy - 9);
  ctx.lineTo(cx + 7, cy);
  ctx.lineTo(cx, cy + 9);
  ctx.lineTo(cx - 7, cy);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fill();
}

function spinToSlot(slotIndex, onDone) {
  if (isSpinning) return;
  isSpinning = true;
  const spinBtn = document.getElementById('spinBtn');
  if (spinBtn) spinBtn.disabled = true;

  const idx = (slotIndex - 1) % 8;
  const sa = (Math.PI * 2) / 8;
  const targetBase = (3 * Math.PI / 2) - idx * sa - sa / 2;
  const curMod = ((wheelAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const tgtMod = ((targetBase % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  let diff = tgtMod - curMod;
  if (diff < 0) diff += Math.PI * 2;
  const total = 6 * Math.PI * 2 + diff;
  const end = wheelAngle + total;
  const start = wheelAngle;
  const t0 = performance.now();
  const ease = t => 1 - Math.pow(1 - t, 3);

  function animate(now) {
    const t = Math.min((now - t0) / 5000, 1);
    wheelAngle = start + total * ease(t);
    drawWheel(wheelAngle);
    if (t < 1) {
      animId = requestAnimationFrame(animate);
    } else {
      animId = null;
      wheelAngle = end;
      isSpinning = false;
      if (onDone) onDone();
    }
  }
  animId = requestAnimationFrame(animate);
}

export function initWheel() {
  canvas = document.getElementById('wheelCanvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  drawWheel(0);

  // Spin button event
  const spinBtn = document.getElementById('spinBtn');
  if (spinBtn) {
    spinBtn.disabled = (availableSpins <= 0);
    spinBtn.addEventListener('click', async () => {
      if (!currentUserId) {
        document.getElementById('authModal').classList.add('active');
        import('./ui.js').then(m => m.switchTab?.('login'));
        return;
      }
      if (availableSpins <= 0) {
        gToast("လှည့်ပိုင်ခွင့် မရှိသေးပါ");
        return;
      }

      const { data, error } = await supabase.rpc('spin_lucky_wheel', { p_user_id: currentUserId });
      if (error) {
        gToast(error.message || "Spin မအောင်မြင်ပါ");
        return;
      }

      // Update available spins (live binding)
      availableSpins--;
      setEl('availableSpins', availableSpins);

      const slot = wheelSlots[(data.slot_index - 1) % 8];
      spinToSlot(data.slot_index, () => {
        const overlay = document.getElementById('spinResultOverlay');
        const content = document.getElementById('spinResultContent');
        if (slot.amount === 0) {
          content.innerHTML = `<div class="spin-result-blank">ဗလာ — သင်ကံမကောင်းပါ</div><div class="spin-result-unit" style="margin-bottom:16px;">ထပ်ကြိုးစားပါ</div>`;
        } else {
          const to = slot.amount * (turnoverMult[slot.amount] || 0);
          content.innerHTML = `<div class="spin-result-amount">${slot.amount.toLocaleString()}</div><div class="spin-result-unit">ကျပ် ရရှိသည်</div><div class="spin-result-turnover">Turnover: <strong style="color:var(--gold2);">${to.toLocaleString()} ကျပ်</strong></div>`;
        }
        overlay.classList.add('show');

        // Update history
        const list = document.getElementById('spinHistoryList');
        const now = new Date().toLocaleString('en-GB');
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `<span class="history-date">${now}</span><span class="history-desc">Lucky Wheel</span><span class="history-amount">${slot.amount > 0 ? '+' + slot.amount.toLocaleString() + ' ကျပ်' : 'ဗလာ'}</span>`;
        if (list.querySelector('.history-empty')) list.innerHTML = '';
        list.prepend(item);

        if (availableSpins > 0 && spinBtn) spinBtn.disabled = false;
      });
    });
  }

  // Spin result close button
  const closeBtn = document.getElementById('spinResultClose');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.getElementById('spinResultOverlay').classList.remove('show');
    });
  }
    }
