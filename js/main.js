// main.js – App Entry Point (replaces app.js)

import './config.js';           // Side‑effect: initializes supabase
import { bindGlobalEvents } from './eventListeners.js';
import { showPage, initLevelModal } from './ui.js';
import { initWheel } from './wheel.js';
import { initTasks } from './tasks.js';
import { initLinked } from './withdraw.js';
import { currentUserId } from './auth.js';
import { loadDashboardStats } from './agent.js';

// Expose needed functions globally for inline HTML onclick attributes
import { shareVia, gToast, switchTab } from './utils.js';
window.shareVia = shareVia;
window.gToast = gToast;
window.switchTab = switchTab;

document.addEventListener('DOMContentLoaded', () => {
  try {
    // 1. Bind all DOM events (buttons, modals, navigation)
    bindGlobalEvents();

    // 2. UI initializations
    initLevelModal(); // Agent level modal (always present)

    // 3. Start with home page
    showPage('home');

    // 4. If user already logged in (e.g., session restore), load their dashboard
    if (currentUserId) {
      loadDashboardStats(currentUserId).catch(e => console.error('Stats failed:', e));
      initLinked();
    }

    // 5. Wheel and tasks initializations when tasks page loads
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
