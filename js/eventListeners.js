// eventListeners.js – Global DOM Event Binding

import { showPage } from './ui.js';
import { switchTab, gToast } from './utils.js';
import { openDepositModal } from './deposit.js';
import { openWithdrawModal, initLinked, switchWdTab, closeSheet, doWithdraw, confirmLink, openSheet, doPaste } from './withdraw.js';
import { loginUser, registerUser, onLoginSuccess, currentUserId } from './auth.js';
import { loadMyData, loadDownline } from './agent.js';
import { loadDashboardStats } from './agent.js';
import { initWheel } from './wheel.js';
import { initTasks } from './tasks.js';
import { initBanner, initLanguageToggle, initCategorySidebar, initLevelModal } from './ui.js';

export function bindGlobalEvents() {
  // ============ Bottom Navigation ============
  document.querySelectorAll('.bnav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      showPage(btn.dataset.nav);
    });
  });

  // ============ Top Area Buttons ============
  const showAuthBtn = document.getElementById('showAuthBtn');
  if (showAuthBtn) {
    showAuthBtn.addEventListener('click', () => {
      document.getElementById('authModal').classList.add('active');
      switchTab('login');
    });
  }

  document.querySelectorAll('.wallet-btn.deposit').forEach(btn => {
    btn.addEventListener('click', openDepositModal);
  });
  document.querySelectorAll('.wallet-btn.withdraw').forEach(btn => {
    btn.addEventListener('click', openWithdrawModal);
  });

  const agentLoginBtn = document.getElementById('agentLoginBtn');
  if (agentLoginBtn) {
    agentLoginBtn.addEventListener('click', () => {
      document.getElementById('authModal').classList.add('active');
      switchTab('login');
    });
  }

  // ============ Auth Modal ============
  const authModal = document.getElementById('authModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', () => authModal.classList.remove('active'));
  }
  if (authModal) {
    authModal.addEventListener('click', e => {
      if (e.target === authModal) authModal.classList.remove('active');
    });
  }

  // Tab switching inside auth modal
  const tabRegister = document.getElementById('tabRegister');
  const tabLogin = document.getElementById('tabLogin');
  if (tabRegister) tabRegister.addEventListener('click', () => switchTab('register'));
  if (tabLogin) tabLogin.addEventListener('click', () => switchTab('login'));

  // Login button
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      const phone = document.getElementById('loginPhone').value.trim();
      const password = document.getElementById('loginPassword').value.trim();
      if (!phone || !password) return gToast("Phone & Password ဖြည့်ပါ");
      const result = await loginUser(phone, password);
      if (result) {
        const { user, userId } = result;
        authModal.classList.remove('active');
        onLoginSuccess(user, user?.ref_code, user?.balance, userId);
      }
    });
  }

  // Register button
  const registerBtn = document.getElementById('registerBtn');
  if (registerBtn) {
    registerBtn.addEventListener('click', async () => {
      const phone = document.getElementById('regPhone').value.trim();
      const password = document.getElementById('regPassword').value.trim();
      const name = document.getElementById('regName').value.trim();
      const refCode = document.getElementById('referrer_code_input').value.trim();
      const checked = document.getElementById('ageCheck').checked;
      if (!phone || !password || !name) return gToast("အချက်အလက်များ ပြည့်စုံစွာ ဖြည့်ပါ");
      if (!checked) return gToast("အသက် 18+ သတ်မှတ်ချက်ကို ဝန်ခံပါ");
      const result = await registerUser(phone, password, name, refCode);
      if (result && result.success) {
        authModal.classList.remove('active');
        onLoginSuccess(result.user, result.ref_code, 0, null);
      }
    });
  }

  // ============ Deposit Modal ============
  const depCloseBtn = document.getElementById('depCloseBtn');
  if (depCloseBtn) {
    depCloseBtn.addEventListener('click', () => {
      clearInterval(window._cdTimer);
      document.getElementById('depositModal').classList.remove('open');
    });
  }

  // ============ Withdraw Modal ============
  const wdCloseBtn = document.getElementById('wdCloseBtn');
  if (wdCloseBtn) {
    wdCloseBtn.addEventListener('click', () => {
      document.getElementById('withdrawModal').classList.remove('open');
    });
  }

  // Withdraw tab switching (delegated)
  document.addEventListener('click', e => {
    const tab = e.target.closest('.wd-tab');
    if (tab) {
      const tabName = tab.textContent.includes('ငွေထုတ်') ? 'wd' :
                      tab.textContent.includes('အကောင်ချိတ်') ? 'link' : 'hist';
      switchWdTab(tabName, tab);
    }
  });

  // Withdraw submit button (delegated because it's inside a dynamic tab? Actually always present)
  const wdSubmitBtn = document.getElementById('wdSubmitBtn');
  if (wdSubmitBtn) {
    wdSubmitBtn.addEventListener('click', doWithdraw);
  }

  // ============ Account Link Sheet ============
  const acctSheetX = document.querySelector('.acct-sheet-x');
  if (acctSheetX) acctSheetX.addEventListener('click', closeSheet);

  const confirmLinkBtn = document.querySelector('.acct-confirm');
  if (confirmLinkBtn) confirmLinkBtn.addEventListener('click', confirmLink);

  // ============ Agent Level Modal ============
  initLevelModal(); // It sets up its own events

  // ============ Spin Result Overlay ============
  const spinResultClose = document.getElementById('spinResultClose');
  if (spinResultClose) {
    spinResultClose.addEventListener('click', () => {
      document.getElementById('spinResultOverlay').classList.remove('show');
    });
  }

  // ============ Turnover Block Modal ============
  const tvCloseBtn = document.querySelector('.tv-close-btn');
  if (tvCloseBtn) {
    tvCloseBtn.addEventListener('click', () => {
      document.getElementById('tvModal').classList.remove('open');
    });
  }

  // ============ Downline Date Modal ============
  const dlBackdrop = document.getElementById('dlBackdrop');
  const dlDateModal = document.getElementById('dlDateModal');

  const openDl = () => {
    dlBackdrop.classList.add('show');
    dlDateModal.classList.add('show');
  };
  const closeDl = () => {
    dlBackdrop.classList.remove('show');
    dlDateModal.classList.remove('show');
  };
  const closeRole = () => {
    const dropdown = document.getElementById('dlRoleDropdown');
    if (dropdown) dropdown.style.display = 'none';
  };

  const dlDateBtn = document.getElementById('dlDateBtn');
  if (dlDateBtn) dlDateBtn.addEventListener('click', openDl);

  const dlDateCancel = document.getElementById('dlDateCancel');
  if (dlDateCancel) dlDateCancel.addEventListener('click', closeDl);

  if (dlBackdrop) {
    dlBackdrop.addEventListener('click', () => {
      closeDl();
      closeRole();
    });
  }

  const dlDateConfirm = document.getElementById('dlDateConfirm');
  if (dlDateConfirm) {
    dlDateConfirm.addEventListener('click', () => {
      const ap = dlDateModal.querySelector('.dl-period-btn.active');
      if (ap) {
        document.getElementById('dlDateLabel').textContent = ap.textContent;
      }
      closeDl();
      loadDownline();
    });
  }

  // Period buttons inside dl modal
  dlDateModal.querySelectorAll('.dl-period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      dlDateModal.querySelectorAll('.dl-period-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Role dropdown
  const dlRoleBtn = document.getElementById('dlRoleBtn');
  if (dlRoleBtn) {
    dlRoleBtn.addEventListener('click', e => {
      e.stopPropagation();
      const dd = document.getElementById('dlRoleDropdown');
      dd.style.display = dd.style.display === 'block' ? 'none' : 'block';
    });
  }

  const dlRoleDropdown = document.getElementById('dlRoleDropdown');
  if (dlRoleDropdown) {
    dlRoleDropdown.querySelectorAll('.dl-role-option').forEach(opt => {
      opt.addEventListener('click', () => {
        dlRoleDropdown.querySelectorAll('.dl-role-option').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        const t = opt.textContent;
        const label = document.getElementById('dlRoleLabel');
        if (label) label.textContent = t.length > 8 ? t.substring(0, 8) + '…' : t;
        closeRole();
        loadDownline();
      });
    });
  }

  // Click outside to close role dropdown
  document.addEventListener('click', () => closeRole());

  // Search toggle
  const dlSearchToggle = document.getElementById('dlSearchToggle');
  if (dlSearchToggle) {
    dlSearchToggle.addEventListener('click', () => {
      const bar = document.getElementById('dlSearchBar');
      bar.style.display = bar.style.display === 'block' ? 'none' : 'block';
      if (bar.style.display === 'block') document.getElementById('dlSearchInput').focus();
    });
  }

  const dlSearchSubmit = document.getElementById('dlSearchSubmit');
  if (dlSearchSubmit) {
    dlSearchSubmit.addEventListener('click', () => {
      loadDownline(document.getElementById('dlSearchInput').value.trim());
    });
  }

  // ============ Agent Tab Bar (delegated) ============
  document.addEventListener('click', e => {
    const atab = e.target.closest('.atab');
    if (!atab) return;
    const tabName = atab.dataset.atab;
    // Update active classes
    document.querySelectorAll('.atab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.atab-content').forEach(c => c.classList.remove('active'));
    atab.classList.add('active');
    const target = document.getElementById('atab-' + tabName);
    if (target) target.classList.add('active');

    if (tabName === 'mydata' && currentUserId) {
      const period = document.querySelector('.time-pill.active')?.dataset.period || 'today';
      loadMyData(currentUserId, period);
    }
    if (tabName === 'downline' && currentUserId) {
      loadDownline();
    }
  });

  // ============ Time Pills (delegated) ============
  document.addEventListener('click', e => {
    const pill = e.target.closest('.time-pill');
    if (!pill || !currentUserId) return;
    document.querySelectorAll('.time-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    loadMyData(currentUserId, pill.dataset.period);
  });

  // ============ Copy / Share buttons (Agent panel) ============
  const agentCopyLinkBtn = document.getElementById('agentCopyLinkBtn');
  if (agentCopyLinkBtn) {
    agentCopyLinkBtn.addEventListener('click', () => {
      const input = document.getElementById('agentShareLinkInput');
      if (input && input.value && input.value !== '—') {
        navigator.clipboard.writeText(input.value).then(() => gToast("Link ကူးယူပြီးပါပြီ! ✅"));
      }
    });
  }

  const copyPhoneBtn = document.getElementById('copyPhoneBtn');
  if (copyPhoneBtn) {
    copyPhoneBtn.addEventListener('click', () => {
      const phone = document.getElementById('agentPhoneDisplay')?.textContent;
      if (phone) navigator.clipboard.writeText(phone).then(() => gToast("ကူးယူပြီးပါပြီ! ✅"));
    });
  }

  const shareNativeBtn = document.getElementById('shareNativeBtn');
  if (shareNativeBtn) {
    shareNativeBtn.addEventListener('click', async () => {
      const link = document.getElementById('agentShareLinkInput')?.value;
      if (!link || link === '—') return;
      if (navigator.share) {
        await navigator.share({ title: 'Diamond-BETT', url: link });
      } else {
        gToast("Share မရပါ");
      }
    });
  }

  // ============ Language Toggle ============
  initLanguageToggle();

  // ============ Banner ============
  initBanner();

  // ============ Category Sidebar ============
  initCategorySidebar();

  // ============ Wheel Init (requires canvas) ============
  // Canvas is inside index.html tasks page? Actually canvas is inside tasks.html which loads later.
  // We'll call initWheel after tasks page loads via showPage. So no need here.

  // ============ Tasks Init ============
  // Will be called after tasks page loads.

  // ============ Commission Countdown ============
  const countEl = document.getElementById('commissionCountdown');
  if (countEl) {
    const tick = () => {
      const now = new Date(), next = new Date();
      next.setHours(24, 0, 0, 0);
      const d = next - now;
      const h = String(Math.floor(d / 3600000)).padStart(2, '0');
      const m = String(Math.floor((d % 3600000) / 60000)).padStart(2, '0');
      const s = String(Math.floor((d % 60000) / 1000)).padStart(2, '0');
      countEl.textContent = `(နောက်ခြေချချိန်: ${h}:${m}:${s})`;
    };
    tick();
    setInterval(tick, 1000);
  }

  // ============ Referrer Code from URL ============
  const urlParams = new URLSearchParams(window.location.search);
  const invitedBy = urlParams.get('ref');
  if (invitedBy) {
    const refInput = document.getElementById('referrer_code_input');
    if (refInput) {
      refInput.value = invitedBy;
      refInput.readOnly = true;
    }
    // Optionally pre‑open register tab
    switchTab('register');
    document.getElementById('authModal').classList.add('active');
  }

  // ============ Initialize Linked Account ============
  initLinked();
  }
