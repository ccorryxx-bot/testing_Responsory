/* ============================================
   NovaBETT Assistant - JavaScript Application
   ============================================ */

// ============ CONFIGURATION ============
const CONFIG = {
  ADMIN_PASSWORD: 'admin123', // Change this to a secure password
  FIREBASE_CONFIG: {
    apiKey: "AIzaSyC67B7s8iUUPaR_2JHFpXraSovtD6z77io",
    authDomain: "my-project-groq.firebaseapp.com",
    projectId: "my-project-groq",
    storageBucket: "my-project-groq.firebasestorage.app",
    messagingSenderId: "370359365720",
    appId: "1:370359365720:web:18567f9f241f7f4d499a2d"
  },
  WORKER_URL: 'https://api.example.com/chat', // Replace with actual worker URL
  MAX_MESSAGE_LENGTH: 2000,
  TYPING_DELAY: 1000,
  MESSAGE_ANIMATION_DELAY: 300
};

// ============ STATE MANAGEMENT ============
const STATE = {
  isAdminLoggedIn: false,
  currentChatId: null,
  messages: [],
  isTyping: false,
  sidebarOpen: false,
  knowledgeBase: '',
  chatLogs: []
};

// ============ DOM ELEMENTS ============
const DOM = {
  // Header
  menuToggle: document.getElementById('menuToggle'),
  settingsBtn: document.getElementById('settingsBtn'),
  
  // Chat
  chatMessages: document.getElementById('chatMessages'),
  messageInput: document.getElementById('messageInput'),
  sendBtn: document.getElementById('sendBtn'),
  attachBtn: document.getElementById('attachBtn'),
  suggestedActions: document.getElementById('suggestedActions'),
  
  // Sidebar
  sidebar: document.getElementById('sidebar'),
  closeSidebar: document.getElementById('closeSidebar'),
  newChatBtn: document.getElementById('newChatBtn'),
  chatHistoryBtn: document.getElementById('chatHistoryBtn'),
  faqBtn: document.getElementById('faqBtn'),
  contactBtn: document.getElementById('contactBtn'),
  adminBtn: document.getElementById('adminBtn'),
  
  // Overlay
  overlay: document.getElementById('overlay'),
  
  // Admin Modal
  adminModal: document.getElementById('adminModal'),
  closeAdminModal: document.getElementById('closeAdminModal'),
  adminLoginForm: document.getElementById('adminLoginForm'),
  adminPanel: document.getElementById('adminPanel'),
  adminPassword: document.getElementById('adminPassword'),
  adminLoginBtn: document.getElementById('adminLoginBtn'),
  adminError: document.getElementById('adminError'),
  togglePasswordBtn: document.getElementById('togglePasswordBtn'),
  
  // Admin Tabs
  adminTabs: document.querySelectorAll('.admin-tab-btn'),
  adminTabContents: document.querySelectorAll('.admin-tab'),
  
  // Knowledge Base
  kbContent: document.getElementById('kbContent'),
  saveKbBtn: document.getElementById('saveKbBtn'),
  kbMessage: document.getElementById('kbMessage'),
  
  // Chat Logs
  logsContainer: document.getElementById('logsContainer'),
  exportLogsBtn: document.getElementById('exportLogsBtn'),
  
  // Settings
  workerUrl: document.getElementById('workerUrl'),
  firebaseConfig: document.getElementById('firebaseConfig'),
  saveSettingsBtn: document.getElementById('saveSettingsBtn'),
  settingsMessage: document.getElementById('settingsMessage'),
  logoutBtn: document.getElementById('logoutBtn'),
  
  // Toast
  toast: document.getElementById('toast')
};

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  setupEventListeners();
  loadStoredData();
  initializeFirebase();
});

function initializeApp() {
  // Set initial message
  const welcomeMessage = {
    id: generateId(),
    sender: 'bot',
    text: 'Welcome to NovaBETT Assistant! I\'m here to help you with any questions about your gaming account, deposits, promotions, and more. How can I assist you today?',
    timestamp: new Date(),
    read: true
  };
  STATE.messages.push(welcomeMessage);
  renderMessage(welcomeMessage);
}

function setupEventListeners() {
  // Header
  DOM.menuToggle.addEventListener('click', toggleSidebar);
  DOM.settingsBtn.addEventListener('click', openAdminModal);
  
  // Chat
  DOM.sendBtn.addEventListener('click', handleSendMessage);
  DOM.messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });
  DOM.attachBtn.addEventListener('click', handleFileAttach);
  
  // Suggested Actions
  document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      handleSuggestedAction(action);
    });
  });
  
  // Sidebar
  DOM.closeSidebar.addEventListener('click', closeSidebar);
  DOM.newChatBtn.addEventListener('click', startNewChat);
  DOM.chatHistoryBtn.addEventListener('click', showChatHistory);
  DOM.faqBtn.addEventListener('click', showFAQ);
  DOM.contactBtn.addEventListener('click', showContact);
  DOM.adminBtn.addEventListener('click', openAdminModal);
  
  // Overlay
  DOM.overlay.addEventListener('click', closeAllModals);
  
  // Admin Modal
  DOM.closeAdminModal.addEventListener('click', closeAdminModal);
  DOM.adminLoginBtn.addEventListener('click', handleAdminLogin);
  DOM.togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
  DOM.logoutBtn.addEventListener('click', handleAdminLogout);
  
  // Admin Tabs
  DOM.adminTabs.forEach(tab => {
    tab.addEventListener('click', () => switchAdminTab(tab.dataset.tab));
  });
  
  // Knowledge Base
  DOM.saveKbBtn.addEventListener('click', saveKnowledgeBase);
  
  // Chat Logs
  DOM.exportLogsBtn.addEventListener('click', exportChatLogs);
  
  // Settings
  DOM.saveSettingsBtn.addEventListener('click', saveSettings);
}

// ============ SIDEBAR FUNCTIONS ============
function toggleSidebar() {
  if (STATE.sidebarOpen) {
    closeSidebar();
  } else {
    openSidebar();
  }
}

function openSidebar() {
  STATE.sidebarOpen = true;
  DOM.sidebar.classList.add('open');
  DOM.overlay.classList.add('visible');
}

function closeSidebar() {
  STATE.sidebarOpen = false;
  DOM.sidebar.classList.remove('open');
  DOM.overlay.classList.remove('visible');
}

// ============ CHAT FUNCTIONS ============
function handleSendMessage() {
  const message = DOM.messageInput.value.trim();
  
  if (!message) return;
  if (message.length > CONFIG.MAX_MESSAGE_LENGTH) {
    showToast('Message is too long', 'error');
    return;
  }
  
  // Add user message
  const userMessage = {
    id: generateId(),
    sender: 'user',
    text: message,
    timestamp: new Date(),
    read: true
  };
  
  STATE.messages.push(userMessage);
  renderMessage(userMessage);
  DOM.messageInput.value = '';
  
  // Log chat
  logChat(message, '');
  
  // Show typing indicator
  showTypingIndicator();
  
  // Send to API
  sendMessageToAPI(message);
}

function sendMessageToAPI(message) {
  // Simulate API call - replace with actual API endpoint
  setTimeout(() => {
    const botResponse = generateBotResponse(message);
    
    const botMessage = {
      id: generateId(),
      sender: 'bot',
      text: botResponse,
      timestamp: new Date(),
      read: false
    };
    
    STATE.messages.push(botMessage);
    removeTypingIndicator();
    renderMessage(botMessage);
    
    // Log chat
    logChat(message, botResponse);
  }, CONFIG.TYPING_DELAY);
}

function generateBotResponse(userMessage) {
  const responses = {
    account: 'To manage your account, please log in to your NovaBETT dashboard. You can update your profile, change password, and view account settings there.',
    deposit: 'We accept various payment methods including credit cards, e-wallets, and bank transfers. Visit the Deposit section for detailed instructions.',
    promotions: 'Check out our latest promotions! We offer welcome bonuses, daily rewards, and special tournaments. Visit the Promotions page for more details.',
    faq: 'Our FAQ section covers common questions about accounts, deposits, withdrawals, and gameplay. Visit the FAQ page for more information.',
    default: 'Thank you for your question! Our support team will assist you shortly. Is there anything else I can help you with?'
  };
  
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('account')) return responses.account;
  if (lowerMessage.includes('deposit') || lowerMessage.includes('payment')) return responses.deposit;
  if (lowerMessage.includes('promotion') || lowerMessage.includes('bonus')) return responses.promotions;
  if (lowerMessage.includes('faq') || lowerMessage.includes('question')) return responses.faq;
  
  return responses.default;
}

function renderMessage(message) {
  const messageGroup = document.createElement('div');
  messageGroup.className = `message-group message-${message.sender}`;
  messageGroup.id = `message-${message.id}`;
  
  if (message.sender === 'bot') {
    messageGroup.innerHTML = `
      <div class="message-avatar">
        <svg class="icon" viewBox="0 0 48 48">
          <use href="icons.svg#icon-logo"></use>
        </svg>
      </div>
      <div class="message-content">
        <div class="message-bubble">${escapeHtml(message.text)}</div>
        <div class="message-meta">
          <time class="message-time">${formatTime(message.timestamp)}</time>
        </div>
      </div>
    `;
  } else {
    messageGroup.innerHTML = `
      <div class="message-content">
        <div class="message-bubble">${escapeHtml(message.text)}</div>
        <div class="message-meta">
          <time class="message-time">${formatTime(message.timestamp)}</time>
        </div>
      </div>
    `;
  }
  
  DOM.chatMessages.appendChild(messageGroup);
  DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
}

function showTypingIndicator() {
  STATE.isTyping = true;
  const typingDiv = document.createElement('div');
  typingDiv.className = 'message-group message-bot';
  typingDiv.id = 'typing-indicator';
  typingDiv.innerHTML = `
    <div class="message-avatar">
      <svg class="icon" viewBox="0 0 48 48">
        <use href="icons.svg#icon-logo"></use>
      </svg>
    </div>
    <div class="message-content">
      <div class="message-bubble">
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    </div>
  `;
  DOM.chatMessages.appendChild(typingDiv);
  DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
}

function removeTypingIndicator() {
  STATE.isTyping = false;
  const typingIndicator = document.getElementById('typing-indicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

function handleSuggestedAction(action) {
  const actions = {
    account: 'I need help with my account',
    deposit: 'How do I deposit funds?',
    promotions: 'Tell me about current promotions',
    faq: 'Show me frequently asked questions'
  };
  
  DOM.messageInput.value = actions[action] || '';
  handleSendMessage();
}

function handleFileAttach() {
  // Placeholder for file attachment functionality
  showToast('File attachment coming soon', 'info');
}

// ============ ADMIN FUNCTIONS ============
function openAdminModal() {
  DOM.adminModal.classList.add('open');
  DOM.overlay.classList.add('visible');
}

function closeAdminModal() {
  DOM.adminModal.classList.remove('open');
  DOM.overlay.classList.remove('visible');
}

function handleAdminLogin() {
  const password = DOM.adminPassword.value;
  
  if (password === CONFIG.ADMIN_PASSWORD) {
    STATE.isAdminLoggedIn = true;
    DOM.adminLoginForm.style.display = 'none';
    DOM.adminPanel.style.display = 'block';
    DOM.adminPassword.value = '';
    showToast('Admin access granted', 'success');
    loadKnowledgeBase();
    loadChatLogs();
  } else {
    DOM.adminError.textContent = 'Invalid password. Please try again.';
    DOM.adminError.classList.add('show');
    setTimeout(() => {
      DOM.adminError.classList.remove('show');
    }, 3000);
  }
}

function handleAdminLogout() {
  STATE.isAdminLoggedIn = false;
  DOM.adminLoginForm.style.display = 'block';
  DOM.adminPanel.style.display = 'none';
  DOM.adminPassword.value = '';
  showToast('Admin access revoked', 'info');
}

function togglePasswordVisibility() {
  if (DOM.adminPassword.type === 'password') {
    DOM.adminPassword.type = 'text';
  } else {
    DOM.adminPassword.type = 'password';
  }
}

function switchAdminTab(tabName) {
  // Hide all tabs
  DOM.adminTabContents.forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Remove active class from all buttons
  DOM.adminTabs.forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Show selected tab
  const selectedTab = document.getElementById(`${tabName}-tab`);
  if (selectedTab) {
    selectedTab.classList.add('active');
  }
  
  // Add active class to clicked button
  const clickedBtn = document.querySelector(`[data-tab="${tabName}"]`);
  if (clickedBtn) {
    clickedBtn.classList.add('active');
  }
}

function loadKnowledgeBase() {
  const stored = localStorage.getItem('novabett_kb');
  if (stored) {
    DOM.kbContent.value = stored;
    STATE.knowledgeBase = stored;
  }
}

function saveKnowledgeBase() {
  const content = DOM.kbContent.value;
  localStorage.setItem('novabett_kb', content);
  STATE.knowledgeBase = content;
  
  DOM.kbMessage.textContent = 'Knowledge base saved successfully!';
  DOM.kbMessage.classList.add('show');
  setTimeout(() => {
    DOM.kbMessage.classList.remove('show');
  }, 3000);
  
  showToast('Knowledge base updated', 'success');
}

function loadChatLogs() {
  const logs = JSON.parse(localStorage.getItem('novabett_logs') || '[]');
  STATE.chatLogs = logs;
  
  if (logs.length === 0) {
    DOM.logsContainer.innerHTML = '<p class="logs-empty">No chat logs available</p>';
    return;
  }
  
  DOM.logsContainer.innerHTML = logs.map(log => `
    <div class="log-item">
      <div class="log-user">User: ${escapeHtml(log.user)}</div>
      <div class="log-message">${escapeHtml(log.bot)}</div>
      <div class="log-time">${formatTime(new Date(log.timestamp))}</div>
    </div>
  `).join('');
}

function exportChatLogs() {
  const logs = JSON.parse(localStorage.getItem('novabett_logs') || '[]');
  
  if (logs.length === 0) {
    showToast('No logs to export', 'warning');
    return;
  }
  
  const csv = convertLogsToCSV(logs);
  downloadFile(csv, 'novabett-chat-logs.csv', 'text/csv');
  showToast('Chat logs exported', 'success');
}

function convertLogsToCSV(logs) {
  let csv = 'User Message,Bot Response,Timestamp\n';
  
  logs.forEach(log => {
    const userMsg = `"${log.user.replace(/"/g, '""')}"`;
    const botMsg = `"${log.bot.replace(/"/g, '""')}"`;
    const timestamp = new Date(log.timestamp).toLocaleString();
    csv += `${userMsg},${botMsg},"${timestamp}"\n`;
  });
  
  return csv;
}

function saveSettings() {
  const workerUrl = DOM.workerUrl.value;
  const firebaseConfig = DOM.firebaseConfig.value;
  
  if (!workerUrl || !firebaseConfig) {
    showToast('Please fill in all fields', 'error');
    return;
  }
  
  try {
    JSON.parse(firebaseConfig);
  } catch (e) {
    showToast('Invalid Firebase config JSON', 'error');
    return;
  }
  
  localStorage.setItem('novabett_worker_url', workerUrl);
  localStorage.setItem('novabett_firebase_config', firebaseConfig);
  
  CONFIG.WORKER_URL = workerUrl;
  
  DOM.settingsMessage.textContent = 'Settings saved successfully!';
  DOM.settingsMessage.classList.add('show');
  setTimeout(() => {
    DOM.settingsMessage.classList.remove('show');
  }, 3000);
  
  showToast('Settings updated', 'success');
}

// ============ SIDEBAR NAVIGATION ============
function startNewChat() {
  STATE.currentChatId = generateId();
  STATE.messages = [];
  DOM.chatMessages.innerHTML = '';
  initializeApp();
  closeSidebar();
  showToast('New chat started', 'success');
}

function showChatHistory() {
  showToast('Chat history feature coming soon', 'info');
  closeSidebar();
}

function showFAQ() {
  const faqMessage = {
    id: generateId(),
    sender: 'bot',
    text: `**Frequently Asked Questions**

**Q: How do I create an account?**
A: Visit our website and click "Sign Up". Fill in your details and verify your email.

**Q: What payment methods do you accept?**
A: We accept credit cards, e-wallets, and bank transfers.

**Q: How long does withdrawal take?**
A: Withdrawals typically process within 24-48 hours.

**Q: Is my account secure?**
A: Yes, we use 256-bit SSL encryption and follow industry security standards.

For more questions, contact our support team.`,
    timestamp: new Date(),
    read: false
  };
  
  STATE.messages.push(faqMessage);
  renderMessage(faqMessage);
  closeSidebar();
}

function showContact() {
  const contactMessage = {
    id: generateId(),
    sender: 'bot',
    text: `**Contact Us**

📧 Email: support@novabett.com
💬 Live Chat: Available 24/7
📞 Phone: +1-800-NOVABETT
🌐 Website: www.novabett.com

Our support team is ready to help you!`,
    timestamp: new Date(),
    read: false
  };
  
  STATE.messages.push(contactMessage);
  renderMessage(contactMessage);
  closeSidebar();
}

// ============ FIREBASE FUNCTIONS ============
function initializeFirebase() {
  // Check if Firebase is available
  if (typeof firebase === 'undefined') {
    console.warn('Firebase SDK not loaded');
    return;
  }
  
  try {
    firebase.initializeApp(CONFIG.FIREBASE_CONFIG);
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.warn('Firebase already initialized or error:', error);
  }
}

function logChat(userMessage, botResponse) {
  const logEntry = {
    user: userMessage,
    bot: botResponse,
    timestamp: new Date().toISOString()
  };
  
  // Store in localStorage
  const logs = JSON.parse(localStorage.getItem('novabett_logs') || '[]');
  logs.push(logEntry);
  localStorage.setItem('novabett_logs', JSON.stringify(logs));
  
  // Try to save to Firebase if available
  if (typeof firebase !== 'undefined' && firebase.firestore) {
    try {
      const db = firebase.firestore();
      db.collection('chats').add(logEntry).catch(err => {
        console.warn('Firebase write failed:', err);
      });
    } catch (error) {
      console.warn('Firebase not available:', error);
    }
  }
}

// ============ UTILITY FUNCTIONS ============
function closeAllModals() {
  closeAdminModal();
  closeSidebar();
}

function generateId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function formatTime(date) {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString();
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function showToast(message, type = 'info') {
  DOM.toast.textContent = message;
  DOM.toast.className = `toast show ${type}`;
  
  setTimeout(() => {
    DOM.toast.classList.remove('show');
  }, 3000);
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

function loadStoredData() {
  const workerUrl = localStorage.getItem('novabett_worker_url');
  const firebaseConfig = localStorage.getItem('novabett_firebase_config');
  
  if (workerUrl) {
    DOM.workerUrl.value = workerUrl;
    CONFIG.WORKER_URL = workerUrl;
  }
  
  if (firebaseConfig) {
    DOM.firebaseConfig.value = firebaseConfig;
  }
}

// ============ KEYBOARD SHORTCUTS ============
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + K to focus message input
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    DOM.messageInput.focus();
  }
  
  // Escape to close modals
  if (e.key === 'Escape') {
    closeAllModals();
  }
});

// ============ PERFORMANCE & CLEANUP ============
window.addEventListener('beforeunload', () => {
  // Save state before unload
  sessionStorage.setItem('novabett_state', JSON.stringify(STATE));
});

// Handle visibility change
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // App is hidden
  } else {
    // App is visible
    console.log('NovaBETT Assistant is now visible');
  }
});

console.log('NovaBETT Assistant initialized successfully');
