// js/main.js – Entry Point with Global Function Exposures

import './config.js';           // side‑effect: initialises supabase
import { bindGlobalEvents } from './eventListeners.js';
import { showPage, initLevelModal } from './ui.js';
import { initWheel } from './wheel.js';
import { initTasks } from './tasks.js';
import { initLinked } from './withdraw.js';
import { currentUserId } from './auth.js';
import { loadDashboardStats } from './agent.js';

// ---------- Expose needed functions globally for inline HTML onclick attributes ----------
import { shareVia, gToast, switchTab, toggleEye } from './utils.js';
import { openDepositModal, pickAmt, goStep2, submitSlip, cpText, cpVal, pickBonus, onAmtType, slipMove } from './deposit.js';
import { openWithdrawModal, switchWdTab, openSheet, closeSheet, doPaste, confirmLink, doWithdraw } from './withdraw.js';

window.shareVia = shareVia;
window.gToast = gToast;
window.switchTab = switchTab;
window.toggleEye = toggleEye;
window.openDepositModal = openDepositModal;
window.pickAmt = pickAmt;
window.goStep2 = goStep2;
window.submitSlip = submitSlip;
window.cpText = cpText;
window.cpVal = cpVal;
window.pickBonus = pickBonus;
window.onAmtType = onAmtType;
window.slipMove = slipMove;
window.openWithdrawModal = openWithdrawModal;
window.switchWdTab = switchWdTab;
window.openSheet = openSheet;
window.closeSheet = closeSheet;
window.doPaste = doPaste;
window.confirmLink = confirmLink;
window.doWithdraw = doWithdraw;

document.addEventListener('DOMContentLoaded', () => {
  try {
    // 1. Bind all DOM events (buttons, modals, navigation)
    bindGlobalEvents();

    // 2. UI initializations
    initLevelModal();

    // 3. Start with home page
    showPage('home');

    // 4. If user already logged in, load dashboard stats
    if (currentUserId) {
      loadDashboardStats(currentUserId).catch(e => console.error('Stats failed:', e));
      initLinked();
    }

    // 5. Wheel and tasks initialisations when tasks page loads
    const pageContainer = document.getElementById('pageContainer');
    if (pageContainer) {
      const observer = new MutationObserver(() => {
        const tasksPage = document.getElementById('tasksPage');
        if (tasksPage && !window._tasksInitDone) {
          window._tasksInitDone = true;
          initWheel();
          initTasks();
        }
      });
      observer.observe(pageContainer, { childList: true, subtree: false });
    }

  } catch (err) {
    console.error('App initialization error:', err);
  }
});
