// deposit.js – Deposit Modal & Actions

import { supabase } from './config.js';
import { gToast, setEl, maskNum, getProvSvg } from './utils.js';
import { currentUserId } from './auth.js';

let _dMethod = null;
let _dAmt = 0;
let _dBonus = true;
let _cdTimer = null;

export function openDepositModal() {
  if (!currentUserId) {
    document.getElementById('authModal').classList.add('active');
    import('./auth.js').then(m => m.switchTab?.('login'));
    return;
  }
  document.getElementById('depositModal').classList.add('open');
  document.getElementById('depStep1').style.display = 'block';
  document.getElementById('depStep2').style.display = 'none';
  const bal = document.getElementById('statBalance')?.textContent || '0.00';
  setEl('depBalShow', bal);
  fetchDepMethods();
}

export async function fetchDepMethods() {
  const grid = document.getElementById('depMethodGrid');
  grid.innerHTML = '<div style="grid-column:span 2;padding:20px;text-align:center;"><div class="md-spin" style="margin:0 auto;"></div></div>';
  const { data, error } = await supabase
    .from('payment_methods')
    .select('id,provider_name,account_name,account_number,is_recommended')
    .eq('is_active', true);
  if (error || !data || !data.length) {
    grid.innerHTML = '<div style="grid-column:span 2;text-align:center;color:#555;font-size:12px;padding:20px;">ငွေသွင်းနည်းလမ်း မရှိသေးပါ</div>';
    return;
  }
  window._depMethods = data; // keep for pickMethod
  grid.innerHTML = data.map((m, i) => `
    <div class="pm-card" onclick="window._pickDepMethod(this,${i})">
      ${m.is_recommended ? '<div class="pm-badge">ဦးစားပေး</div>' : ''}
      <div class="pm-logo">${getProvSvg(m.provider_name, 40)}</div>
      <div class="pm-info"><div class="pm-name">${m.provider_name}</div><div class="pm-num">${maskNum(m.account_number)}</div></div>
      <span class="pm-check">✓</span>
    </div>
  `).join('');
}

// Global access for inline onclick
window._pickDepMethod = function (el, idx) {
  _dMethod = window._depMethods[idx];
  document.querySelectorAll('#depMethodGrid .pm-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
};

export function pickAmt(el, amt) {
  _dAmt = amt;
  document.querySelectorAll('.amt-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  const input = document.getElementById('depAmtInput');
  if (input) input.value = amt;
  updatePreview();
}

export function onAmtType(val) {
  _dAmt = parseFloat(val) || 0;
  document.querySelectorAll('.amt-btn').forEach(b => b.classList.remove('selected'));
  updatePreview();
}

export function pickBonus(yes) {
  _dBonus = yes;
  document.getElementById('bOptYes').classList.toggle('selected', yes);
  document.getElementById('bOptNo').classList.toggle('selected', !yes);
  document.getElementById('depPreview').style.display = yes ? 'block' : 'none';
  updatePreview();
}

function updatePreview() {
  const bonus = _dBonus ? _dAmt : 0;
  setEl('pvDep', _dAmt.toLocaleString() + ' ကျပ်');
  setEl('pvBonus', '+ ' + bonus.toLocaleString() + ' ကျပ်');
  setEl('pvTotal', (_dAmt + bonus).toLocaleString() + ' ကျပ်');
}

export function goStep2() {
  if (!_dMethod) return gToast('💳 ငွေပေးချေနည်းလမ်း ရွေးပါ');
  if (!_dAmt || _dAmt < 3000) return gToast('💵 အနည်းဆုံး 3,000 ကျပ် ထည့်ပါ');
  document.getElementById('depStep1').style.display = 'none';
  document.getElementById('depStep2').style.display = 'block';
  document.getElementById('dep2Logo').innerHTML = getProvSvg(_dMethod.provider_name, 40);
  setEl('dep2Name', _dMethod.provider_name);
  setEl('dep2Phone', _dMethod.account_number);
  setEl('dep2Amt', _dAmt.toLocaleString() + ' ကျပ်');
  const ord = 'DEP-' + Date.now().toString().slice(-8);
  window._depOrd = ord;
  setEl('dep2Order', ord);
  document.querySelectorAll('.slip-box').forEach(b => b.value = '');
  startCd(30 * 60);
}

function startCd(sec) {
  clearInterval(_cdTimer);
  const el = document.getElementById('depCd');
  let rem = sec;
  const tick = () => {
    const m = Math.floor(rem / 60), s = rem % 60;
    el.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    if (rem <= 0) {
      clearInterval(_cdTimer);
      el.closest('.countdown-badge').style.background = '#444';
    }
    rem--;
  };
  tick();
  _cdTimer = setInterval(tick, 1000);
}

export function slipMove(el, idx) {
  const boxes = document.querySelectorAll('.slip-box');
  if (el.value && idx < boxes.length - 1) boxes[idx + 1].focus();
}

export function cpText(id) {
  navigator.clipboard.writeText(document.getElementById(id).textContent).then(() => gToast('ကော်ပီ ✅'));
}

export function cpVal(val) {
  if (!val) return;
  navigator.clipboard.writeText(String(val)).then(() => gToast('ကော်ပီ ✅'));
}

export async function submitSlip() {
  const boxes = document.querySelectorAll('.slip-box');
  const slip = Array.from(boxes).map(b => b.value.trim()).join('');
  if (slip.length < 5) return gToast('📝 Slip ၅ လုံး ထည့်ပါ');
  const btn = document.getElementById('dep2Btn');
  btn.disabled = true;
  btn.textContent = '⏳ တင်နေသည်...';
  try {
    const { error } = await supabase.from('transactions').insert([{
      user_id: currentUserId,
      type: 'deposit',
      amount: _dAmt,
      payment_method: _dMethod.provider_name,
      payment_details: slip,
      bonus_opted: _dBonus,
      status: 'pending',
      reference: window._depOrd || null
    }]);
    if (error) throw error;
    clearInterval(_cdTimer);
    document.getElementById('depositModal').classList.remove('open');
    gToast('🎉 ငွေသွင်း အောင်မြင်ပါသည်!\nမိနစ် 5–10 အတွင်း Wallet ထဲ ရောက်ပါမည်', 'success');
  } catch (e) {
    gToast('❌ ' + (e.message || 'ထပ်စမ်းပါ'));
    btn.disabled = false;
    btn.textContent = '✅ ငွေသွင်းပြီး အတည်ပြုမည်';
  }
}
