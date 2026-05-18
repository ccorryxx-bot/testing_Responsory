// tasks.js – Tasks Page Timer, Bonus Code

import { supabase } from './config.js';
import { gToast, setEl } from './utils.js';
import { currentUserId } from './auth.js';

/**
 * Update the daily reset timer (HH:MM:SS).
 */
export function updateDailyTimer() {
  const now = new Date();
  const next = new Date();
  next.setHours(24, 0, 0, 0);
  const diff = next - now;
  const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
  const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
  const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
  setEl('task1Timer', `${h}:${m}:${s}`);
}

/**
 * Bonus code claim handler.
 */
export async function claimBonusCode() {
  const input = document.getElementById('bonusCodeInput');
  if (!input) return;
  const code = input.value.trim();
  if (!code) {
    gToast("Bonus Code ထည့်ပါ");
    return;
  }
  if (!currentUserId) {
    document.getElementById('authModal').classList.add('active');
    import('./ui.js').then(m => m.switchTab?.('login'));
    return;
  }
  const { data: bonusAmount, error } = await supabase.rpc('claim_bonus_code', {
    p_user_id: currentUserId,
    p_code: code.toUpperCase()
  });
  if (error) {
    gToast(error.message || "Code မမှန်ပါ");
    return;
  }
  gToast(`အောင်မြင်ပါသည်! Bonus ${bonusAmount} ကျပ် ထည့်သွင်းပေးပြီး`, 'success');
  input.value = '';
}

/**
 * Initialize tasks page event listeners.
 */
export function initTasks() {
  // Bonus code button
  const bonusBtn = document.getElementById('bonusCodeBtn');
  if (bonusBtn) {
    bonusBtn.addEventListener('click', claimBonusCode);
  }

  // Start the daily timer (if element exists)
  updateDailyTimer();
  setInterval(updateDailyTimer, 1000);
}
