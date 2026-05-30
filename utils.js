// utils.js — shared utilities, loaded as a plain script (no module)

let _tt;

function toast(msg, type = 'ok') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${type} show`;
  clearTimeout(_tt);
  _tt = setTimeout(() => el.classList.remove('show'), 3000);
}

async function signOut() {
  localStorage.removeItem('ai_chat_history');
  localStorage.removeItem('ai_draft');
  if (db) await db.auth.signOut();
  window.location.href = 'login.html';
}

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function fmtDate(ds) {
  if (!ds) return '';
  const d = new Date(ds + 'T12:00:00');
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getFullYear()).slice(2)}`;
}

function painColor(s) {
  if (s === null || s === undefined) return 'var(--text-tertiary)';
  if (s <= 3) return 'var(--success)';
  if (s <= 5) return 'var(--warning)';
  if (s <= 7) return 'rgba(242,130,60,1)';
  return 'var(--danger)';
}

async function getConfig() {
  const cached = sessionStorage.getItem('app_config');
  if (cached) return JSON.parse(cached);
  const r = await fetch('/api/config');
  if (!r.ok) throw new Error('Config-tjeneste svarte ' + r.status);
  const cfg = await r.json();
  if (cfg.error) throw new Error(cfg.error);
  sessionStorage.setItem('app_config', JSON.stringify(cfg));
  return cfg;
}
