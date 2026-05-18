// main.js – App Entry Point (replaces app.js)

import './config.js';           // Side‑effect: initializes supabase
import { bindGlobalEvents } from './eventListeners.js';
import { showPage, initLevelModal } from './ui.js';
import { initWheel } from './wheel.js';
import { initTasks } from './tasks.js';
import { initLinked } from './withdraw.js';
import { currentUserId } from './auth.js';
import { loadDashboardStats } from './agent.js';

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

    // 5. Wheel and tasks initializations will happen when their pages load
    //    (showPage → loads tasks.html → then we can call initWheel() & initTasks())
    //    We'll handle that inside showPage or by observing page loads.
    //    For simplicity, we'll delay wheel/tasks init until first visit.
    //    But to ensure they work, we can also add them to showPage.
    //    Already done: showPage calls initWheel? No, we left wheel out.
    //    Let's add wheel init after tasks page load inside showPage or here with MutationObserver.
    //    Better: update showPage in ui.js to call initWheel and initTasks.
    //    But we already have showPage in ui.js; it doesn't call wheel.
    //    We'll do a quick patch: we'll listen for pageContainer changes and if tasks page loads, init wheel/tasks.
    //    Alternative: call initWheel and initTasks after a delay? No.
    //    Let's just update showPage logic in ui.js later; for now, we'll add a generic observer.
    //    Actually we can modify showPage in ui.js to call initWheel when tasks page loads.
    //    But we already sent ui.js code. Instead, we can add a MutationObserver here.
    //    Simpler: We'll keep as is; the user will later handle per-page init manually.
    //    Not ideal. Let's add inline in showPage after load (already planned but not done).
    //    We'll adjust: We'll update main.js to set up a MutationObserver on pageContainer to call initWheel/initTasks when tasks page appears.
    //    But that's extra complexity. Better to update ui.js's showPage. Since we haven't saved ui.js yet? No, user already saved ui.js.
    //    So we'll add a fallback: setTimeout after showPage to try initWheel/initTasks with a small delay, or we modify main.js to track page loads.

    //    Quick solution: after showPage('home'), we'll set a one-time observer.
    //    I'll add a MutationObserver to detect when tasks page is loaded and call initWheel/initTasks.
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
