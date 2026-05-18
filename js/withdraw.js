// withdraw.js – Withdraw Modal, Linked Account, Transaction History

import { supabase } from './config.js';
import { gToast, setEl, maskNum, getProvSvg } from './utils.js';
import { currentUserId } from './auth.js';

let _linked = null;
let _curProv = null;

export function openWithdrawModal() {
  if (!currentUserId) {
    document.getElementById('authModal').classList.add('active');
    import('./auth.js').then(m => m.switchTab?.('login'));
    return;
  }
  document.getElementById('withdrawModal').classList.add('open');
  const bal = document.getElementById('statBalance')?.textContent || '0.00';
  setEl('wdBalShow', bal);
  setEl('wdBalAmt', bal + ' ကျပ်');
  initLinked();
  const tabs = document.querySelectorAll('.wd-tab');
  if (tabs.length > 0) switchWdTab('wd', tabs[0]);
}

export function switchWdTab(tab, el) {
  document.querySelectorAll('.wd-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.wd-content').forEach(c => c.classList.remove('active'));
  if (el) el.classList.add('active');
  const content = document.getElementById('wdTab-' + tab);
  if (content) content.classList.add('active');
  if (tab === 'hist') loadTxHistory();
}

// ============ LINKED ACCOUNT ============

export function initLinked() {
  const s = localStorage.getItem('db_linked');
  if (s) {
    _linked = JSON.parse(s);
    renderLinked();
  }
}

function renderLinked() {
  if (!_linked) return;
  document.getElementById('wdNoAcct').style.display = 'none';
  document.getElementById('wdHasAcct').style.display = 'block';
  document.getElementById('wdLinkedLogo').innerHTML = getProvSvg(_linked.provider, 40);
  setEl('wdLinkedName', (_linked.provider === 'kbz' ? 'KBZ Pay' : 'Wave Money') + ' · ' + _linked.name);
  setEl('wdLinkedNum', maskNum(_linked.number));
  updateLinkTab();
}

function updateLinkTab() {
  if (!_linked) return;
  const isKbz = _linked.provider === 'kbz';
  const itemId = isKbz ? 'kbzItem' : 'waveItem';
  const txtId = isKbz ? 'kbzLinkedTxt' : 'waveLinkedTxt';
  const btnId = isKbz ? 'kbzLinkBtn' : 'waveLinkBtn';
  const otherBtnId = isKbz ? 'waveLinkBtn' : 'kbzLinkBtn';

  const item = document.getElementById(itemId);
  if (item) item.classList.add('linked');
  setEl(txtId, _linked.name + ' · ' + maskNum(_linked.number));

  const btn = document.getElementById(btnId);
  if (btn) {
    btn.textContent = '✓ ချိတ်ပြီး';
    btn.classList.add('linked');
    btn.disabled = true;
  }

  const otherBtn = document.getElementById(otherBtnId);
  if (otherBtn) {
    otherBtn.disabled = true;
    otherBtn.style.opacity = '0.35';
  }

  if (!document.querySelector('#' + itemId + ' .acct-linked-badge')) {
    const badge = document.createElement('div');
    badge.className = 'acct-linked-badge';
    badge.textContent = '✓ ချိတ်ပြီး';
    const itemEl = document.getElementById(itemId);
    if (itemEl) itemEl.prepend(badge);
  }
}

export function openSheet(prov) {
  if (_linked) {
    gToast('⚠️ အကောင် ချိတ်ပြီးသားဖြစ်၍ မပြောင်းနိုင်ပါ');
    return;
  }
  _curProv = prov;
  document.getElementById('acctSheet').classList.add('open');
  setEl('sheetTitle', (prov === 'kbz' ? '💙 KBZ Pay' : '💛 Wave Money') + ' ချိတ်ဆောင်ရန်');
  document.getElementById('sheetProvIcon').innerHTML = getProvSvg(prov, 24);
  document.getElementById('lnkName').value = '';
  document.getElementById('lnkNum').value = '';
}

export function closeSheet() {
  document.getElementById('acctSheet').classList.remove('open');
}

export async function doPaste(id) {
  try {
    const t = await navigator.clipboard.readText();
    document.getElementById(id).value = t;
  } catch {}
}

export async function confirmLink() {
  const name = document.getElementById('lnkName').value.trim();
  const num = document.getElementById('lnkNum').value.trim();
  if (!name) return gToast('နာမည် ထည့်ပါ');
  if (!num || num.length < 9) return gToast('ဖုန်းနံပါတ် မှန်ကန်စွာ ထည့်ပါ');

  _linked = { provider: _curProv, name, number: num };
  localStorage.setItem('db_linked', JSON.stringify(_linked));

  if (currentUserId) {
    supabase.from('users').update({
      withdrawal_method: _curProv === 'kbz' ? 'KBZ Pay' : 'Wave Money',
      withdrawal_account: num,
      withdrawal_name: name
    }).eq('id', currentUserId).then(() => {});
  }

  closeSheet();
  renderLinked();
  updateLinkTab();
  gToast('✅ အကောင် ချိတ်ဆောင်ပြီးပါပြီ!', 'success');
}

// ============ WITHDRAW REQUEST ============

export async function doWithdraw() {
  if (!currentUserId || !_linked) return;
  const amount = parseFloat(document.getElementById('wdAmtInput').value);
  if (!amount || amount <= 0) return gToast('💵 ပမာဏ ထည့်ပါ');
  const btn = document.getElementById('wdSubmitBtn');
  btn.disabled = true;
  btn.textContent = '⏳ စစ်ဆေးနေသည်...';
  try {
    const [uRes, sRes] = await Promise.all([
      supabase.from('users').select('balance,remaining_turnover').eq('id', currentUserId).single(),
      supabase.from('site_settings').select('min_withdrawal,max_withdrawal').eq('id', 1).single()
    ]);
    if (uRes.error || sRes.error) throw new Error('ဒေတာ ဆွဲမရပါ');
    const tv = parseFloat(uRes.data?.remaining_turnover || 0);
    const bal = parseFloat(uRes.data?.balance || 0);
    const min = parseFloat(sRes.data?.min_withdrawal || 10000);
    const max = parseFloat(sRes.data?.max_withdrawal || 1000000);
    if (tv > 0) {
      setEl('tvAmtVal', tv.toLocaleString());
      document.getElementById('tvModal').classList.add('open');
      document.getElementById('wdTvBar').style.display = 'block';
      setEl('wdTvAmt', tv.toLocaleString() + ' ကျပ်');
      resetWdBtn();
      return;
    }
    if (amount < min) { gToast(`❌ အနည်းဆုံး ${min.toLocaleString()} ကျပ်`); resetWdBtn(); return; }
    if (amount > max) { gToast(`❌ အများဆုံး ${max.toLocaleString()} ကျပ်`); resetWdBtn(); return; }
    if (amount > bal) { gToast('❌ Balance မလုံလောက်ပါ'); resetWdBtn(); return; }

    const { error: txErr } = await supabase.from('transactions').insert([{
      user_id: currentUserId,
      type: 'withdrawal',
      amount,
      payment_method: _linked.provider === 'kbz' ? 'KBZ Pay' : 'Wave Money',
      payment_details: _linked.number,
      status: 'pending'
    }]);
    if (txErr) throw txErr;

    document.getElementById('withdrawModal').classList.remove('open');
    gToast('🎉 ငွေထုတ်တောင်းဆိုမှု အောင်မြင်ပါသည်!\nဒိုင်မှ မိနစ် ၃၀ အတွင်း ဆက်သွယ်ပါမည်', 'success');
  } catch (e) {
    gToast('❌ ' + (e.message || 'ထပ်စမ်းပါ'));
    resetWdBtn();
  }
}

export function resetWdBtn() {
  const btn = document.getElementById('wdSubmitBtn');
  if (btn) {
    btn.disabled = false;
    btn.textContent = '🏦 ငွေထုတ်တောင်းဆိုမည်';
  }
}

// ============ TRANSACTION HISTORY ============

export async function loadTxHistory() {
  if (!currentUserId) return;
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', currentUserId)
    .order('created_at', { ascending: false })
    .limit(25);
  const list = document.getElementById('txList');
  const empty = document.getElementById('txEmpty');
  if (error || !data || !data.length) {
    if (empty) empty.style.display = 'flex';
    return;
  }
  if (empty) empty.style.display = 'none';
  list.innerHTML = data.map(tx => {
    const isDep = tx.type === 'deposit';
    const date = new Date(tx.created_at).toLocaleDateString('en-GB');
    const sc = tx.status === 'approved' ? 'approved' : tx.status === 'rejected' ? 'rejected' : 'pending';
    const stxt = sc === 'approved' ? '✅ အတည်ပြုပြီး' : sc === 'rejected' ? '❌ ငြင်းပယ်ပြီး' : '⏳ စောင့်ဆိုင်း';
    const color = isDep ? '#22c55e' : '#ef4444';
    return `<div class="tx-item">
      <div class="tx-ico ${isDep ? 'dep' : 'wd'}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5">${isDep ? '<path d="M12 5v14M5 12l7 7 7-7"/>' : '<path d="M12 19V5M5 12l7-7 7 7"/>'}</svg></div>
      <div class="tx-info"><div class="tx-type">${isDep ? '💰 ငွေသွင်း' : '🏦 ငွေထုတ်'}</div><div class="tx-date">${date} · ${tx.payment_method || '—'}</div><div class="tx-badge ${sc}">${stxt}</div></div>
      <div class="tx-amount" style="color:${color}">${isDep ? '+' : '-'}${parseFloat(tx.amount).toLocaleString()}<div style="font-size:9px;color:#555;font-weight:400;margin-top:2px;">ကျပ်</div></div>
    </div>`;
  }).join('');
}
