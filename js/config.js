// config.js – Supabase Init & Global Constants

export const SUPA_URL = "https://xjqrwcsxiaybpztzestb.supabase.co";
export const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."; // မူရင်း Key အတိုင်းထည့်ပါ

export let supabase = null;
try {
  if (window.supabase) {
    supabase = window.supabase.createClient(SUPA_URL, SUPA_KEY);
  }
} catch (e) {
  console.error('Supabase SDK failed to load:', e);
}
