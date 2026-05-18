// utils.js – Global Helper Functions

export function gToast(msg, type = 'normal') {
  const t = document.getElementById('gToast');
  if (!t) return;
  t.textContent = msg;
  t.className = type === 'success' ? 'show success' : 'show';
  clearTimeout(window._gt);
  window._gt = setTimeout(() => t.classList.remove('show', 'success'), type === 'success' ? 4000 : 2500);
}

export function shareVia(platform) {
  const linkInput = document.getElementById('agentShareLinkInput');
  const link = linkInput?.value;
  if (!link || link === '—') return gToast('Login ဝင်ပြီးမှ Share လုပ်ပါ');
  const text = encodeURIComponent(`Diamond-BETT မှ ဖိတ်ကြားပါသည်! ${link}`);
  const urls = {
    telegram: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${text}`,
    viber: `viber://forward?text=${text}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
    whatsapp: `https://wa.me/?text=${text}`
  };
  if (urls[platform]) window.open(urls[platform], '_blank');
}

export function switchTab(tab) {
  const registerForm = document.getElementById('registerForm');
  const loginForm = document.getElementById('loginForm');
  const tabRegister = document.getElementById('tabRegister');
  const tabLogin = document.getElementById('tabLogin');
  if (registerForm) registerForm.style.display = tab === 'register' ? 'block' : 'none';
  if (loginForm) loginForm.style.display = tab === 'login' ? 'block' : 'none';
  if (tabRegister) tabRegister.classList.toggle('active', tab === 'register');
  if (tabLogin) tabLogin.classList.toggle('active', tab === 'login');
}

export function toggleEye(id, btn) {
  const inp = document.getElementById(id);
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
  btn.style.color = inp.type === 'text' ? '#f5c518' : 'rgba(255,255,255,.5)';
}

export function fmt(v, d = 2) {
  const n = parseFloat(v);
  return isNaN(n) ? '0.00' : n.toFixed(d);
}

export function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

export function maskNum(n) {
  if (!n || n.length < 4) return n;
  return '****' + n.slice(-4);
}

export function kbzSvg(sz = 40) {
  return `<svg width="${sz}" height="${sz}" viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="#003087"/><rect x="4" y="4" width="40" height="40" rx="9" fill="#0a3fa0" opacity=".4"/><text x="24" y="21" text-anchor="middle" fill="white" font-size="10.5" font-weight="900" letter-spacing="1" font-family="'Segoe UI',Arial,sans-serif">KBZ</text><text x="24" y="31" text-anchor="middle" fill="#FFD700" font-size="9.5" font-weight="700" font-family="'Segoe UI',Arial,sans-serif">Pay</text><rect x="13" y="35" width="22" height="2.5" rx="1.25" fill="#FFD700" opacity=".6"/></svg>`;
}

export function waveSvg(sz = 40) {
  return `<svg width="${sz}" height="${sz}" viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="#FFAB00"/><circle cx="24" cy="21" r="12" fill="none" stroke="#0091D0" stroke-width="4.5"/><path d="M12 21 Q18 13 24 21 Q30 29 36 21" fill="none" stroke="#0091D0" stroke-width="4" stroke-linecap="round"/><text x="24" y="41" text-anchor="middle" fill="#003087" font-size="8" font-weight="900" font-family="'Segoe UI',Arial,sans-serif">Wave</text></svg>`;
}

export function getProvSvg(provName, sz = 40) {
  return provName.toLowerCase().includes('kbz') ? kbzSvg(sz) : waveSvg(sz);
}
