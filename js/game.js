// games.js – Load Game Grid from Supabase

import { supabase } from './config.js';

export async function loadGamesFromDB() {
  const grid = document.getElementById('gameGrid');
  if (!grid) return;

  const { data: games, error } = await supabase.from('games').select('*');
  if (error || !games || games.length === 0) {
    grid.innerHTML = `<div style="color:var(--muted);font-size:12px;padding:20px;grid-column:span 3;text-align:center;">Games loading...</div>`;
    return;
  }

  grid.innerHTML = '';
  games.forEach((g, idx) => {
    const hue = (idx * 37) % 360;
    const hasImg = g.image_url && !g.image_url.includes('placehold');
    grid.innerHTML += `<div class="game-card" onclick="alert('Launch ${g.name}')">
      ${hasImg ? `<img src="${g.image_url}" class="gc-bg" onerror="this.style.display='none'">` :
        `<div class="gc-bg" style="background:linear-gradient(145deg,hsl(${hue},60%,30%),hsl(${hue+20},70%,20%));"></div><div class="gc-char"><svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="12" cy="12" r="3"/></svg></div>`}
      <div class="gc-label"><span>${g.name}</span></div></div>`;
  });
}
