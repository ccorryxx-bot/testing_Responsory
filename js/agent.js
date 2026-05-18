// agent.js – Agent Dashboard, MyData, Downline

import { supabase } from './config.js';
import { fmt, setEl } from './utils.js';
import { currentAgentId } from './auth.js';

/**
 * Load top dashboard stats for a given user.
 */
export async function loadDashboardStats(userId) {
  const { data, error } = await supabase
    .from('agent_dashboard_stats')
    .select('today_commission,direct_members,received,bonus,yesterday_commission,salary')
    .eq('agent_id', userId)
    .eq('period', 'today')
    .single();
  if (error || !data) return;

  setEl('statCommission', fmt(data.today_commission));
  setEl('statInvited', data.direct_members ?? 0);
  setEl('walletReceived', fmt(data.received));
  setEl('walletBonus', fmt(data.bonus));
  setEl('walletYesterday', fmt(data.yesterday_commission));
  setEl('walletSalary', fmt(data.salary));

  const ticker = document.getElementById('agentTickerText');
  if (ticker) {
    const t = ` &rsaquo; Agent ကော်မရှင်: ${fmt(data.today_commission)} &nbsp;&nbsp;&nbsp; &rsaquo; Diamond-BETT Affiliate &nbsp;&nbsp;&nbsp;`;
    ticker.innerHTML = t + t;
  }
}

/**
 * Load detailed "My Data" for an agent based on selected period.
 */
export async function loadMyData(agentId, period = 'today') {
  const loading = document.getElementById('mdLoading');
  if (loading) loading.style.display = 'flex';

  const { data, error } = await supabase
    .from('agent_dashboard_stats')
    .select('*')
    .eq('agent_id', agentId)
    .eq('period', period)
    .single();

  if (loading) loading.style.display = 'none';
  if (error || !data) return;

  const map = {
    'md-total-commission': fmt(data.total_commission),
    'md-direct-bet': fmt(data.direct_bet_amount),
    'md-sub-bet': fmt(data.sub_bet_amount),
    'md-total-members': data.total_members ?? 0,
    'md-direct-members': data.direct_members ?? 0,
    'md-sub-members': data.sub_members ?? 0,
    'md-direct-performance': fmt(data.direct_performance),
    'md-sub-performance': fmt(data.sub_performance),
    'md-total-performance': fmt(data.total_performance),
    'md-direct-savings': fmt(data.direct_savings),
    'md-direct-withdraw': fmt(data.direct_withdraw_savings),
    'md-direct-total-savings': fmt(data.direct_total_savings),
    'md-effective-bets': fmt(data.effective_bets),
    'md-level-savings': fmt(data.level_savings),
    'md-direct-commission': fmt(data.direct_commission),
    'md-sub-commission': fmt(data.sub_commission),
    'md-total-commission2': fmt(data.total_commission),
    'md-bonus': fmt(data.bonus),
    'md-received': fmt(data.received),
    'md-salary': fmt(data.salary),
    'md-promo-savings': fmt(data.promotion_savings),
    'md-achievement-savings': fmt(data.achievement_savings),
    'md-direct-income-commission': fmt(data.direct_commission),
    'md-sub-income-commission': fmt(data.sub_commission),
    'md-total-income-commission': fmt(data.total_commission),
  };
  Object.entries(map).forEach(([id, val]) => setEl(id, val));
}

/**
 * Load downline table data. Optional search filter.
 */
export async function loadDownline(searchId = '') {
  if (!currentAgentId) return;

  const { data, error } = await supabase.rpc('get_agent_subordinates', { p_agent_id: currentAgentId });
  const empty = document.getElementById('dlEmpty');
  const tableWrap = document.getElementById('dlTableWrap');
  const tbody = document.getElementById('dlTableBody');

  if (error || !data || data.length === 0) {
    if (empty) empty.style.display = 'flex';
    if (tableWrap) tableWrap.style.display = 'none';
    return;
  }

  let rows = data;
  if (searchId) {
    rows = rows.filter(r => String(r.id || '').includes(searchId) || String(r.phone || '').includes(searchId));
  }
  if (rows.length === 0) {
    if (empty) empty.style.display = 'flex';
    if (tableWrap) tableWrap.style.display = 'none';
    return;
  }

  if (empty) empty.style.display = 'none';
  if (tableWrap) tableWrap.style.display = 'block';

  tbody.innerHTML = rows.map(r => `
    <tr>
      <td>${r.phone || r.id || '—'}</td>
      <td><span class="dl-level-badge">Lv ${r.level || 1}</span></td>
      <td style="font-size:10px;">${r.joined_at ? new Date(r.joined_at).toLocaleDateString('en-GB') : '—'}</td>
      <td>${fmt(r.bet_amount)}</td>
      <td>${fmt(r.deposit_amount)}</td>
    </tr>
  `).join('');
    }
