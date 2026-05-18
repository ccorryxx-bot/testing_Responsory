// auth.js – Login, Register, User State

import { supabase, SUPA_KEY } from './config.js';
import { gToast, setEl, fmt } from './utils.js';

export let currentUserId = null;
export let currentAgentId = null;
export let availableSpins = 0;

/**
 * Called after successful login or registration.
 * Updates all UI elements and sets global state.
 */
export function onLoginSuccess(user, refCode, balance = 0, userId = null) {
  if (userId) currentUserId = userId;
  currentAgentId = currentUserId; // agent == user for now

  // Show wallet buttons, hide login button
  const showAuthBtn = document.getElementById('showAuthBtn');
  if (showAuthBtn) showAuthBtn.style.display = 'none';
  const walletBtns = document.getElementById('walletBtns');
  if (walletBtns) walletBtns.style.display = 'flex';

  const phone = user.phone || user.name || '—';
  const agentRefCode = refCode || user.ref_code || '—';
  const shareLink = agentRefCode !== '—' ? `https://diamond-bett.vercel.app/?ref=${agentRefCode}` : '—';
  const today = new Date().toLocaleDateString('en-GB');

  setEl('agentUserPhone', phone);
  setEl('agentPhoneDisplay', phone);
  setEl('agentJoinDate', today);

  const shareLinkInput = document.getElementById('agentShareLinkInput');
  if (shareLinkInput) shareLinkInput.value = shareLink;

  setEl('statBalance', fmt(balance));
  setEl('userLevelNum', '1');

  // Invite tab fields (may be loaded later, so check)
  const invRef = document.getElementById('inv-refcode');
  if (invRef) invRef.textContent = agentRefCode;
  const invLink = document.getElementById('inv-link');
  if (invLink) invLink.value = shareLink;

  // Unlock agent panel
  const agentLocked = document.getElementById('agentLocked');
  const agentUnlocked = document.getElementById('agentUnlocked');
  if (agentLocked) agentLocked.style.display = 'none';
  if (agentUnlocked) agentUnlocked.style.display = 'flex';

  availableSpins = 1;
  setEl('availableSpins', availableSpins);

  const spinBtn = document.getElementById('spinBtn');
  if (spinBtn) spinBtn.disabled = false;
}

/**
 * Login with phone & password. Returns user data or null.
 */
export async function loginUser(phone, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: `${phone}@diamondbett.com`,
    password
  });
  if (error) {
    gToast("Login မအောင်မြင်ပါ: " + error.message);
    return null;
  }
  const { data: ud } = await supabase
    .from('users')
    .select('ref_code,fullname,phone,balance')
    .eq('id', data.user.id)
    .single();
  return { user: ud, userId: data.user.id };
}

/**
 * Register a new user via Edge Function. Returns {success, ref_code, user} or null.
 */
export async function registerUser(phone, password, name, refCode) {
  const resp = await fetch(
    "https://xjqrwcsxiaybpztzestb.supabase.co/functions/v1/register-user",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPA_KEY,
        "Authorization": "Bearer " + SUPA_KEY
      },
      body: JSON.stringify({ phone, password, fullname: name, referrer_code: refCode || null })
    }
  );
  const result = await resp.json();
  if (resp.ok) {
    return { success: true, ref_code: result.ref_code, user: { phone, name, ref_code: result.ref_code } };
  } else {
    gToast("အမှားအယွင်း: " + result.error);
    return null;
  }
        }
