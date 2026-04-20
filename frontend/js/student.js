// public/js/student.js
const API_BASE = 'https://byod-44n0.onrender.com/api';

// ─── Guard: redirect to login if not authenticated ───────────────────────────
async function checkAuth() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  // Instant local check
  if (!token || !user || user.role !== 'student') {
    window.location.href = 'index.html';
    return;
  }

  // Set name display immediately
  const nameDisplay = document.getElementById('student-name-display');
  if (nameDisplay) nameDisplay.textContent = user.name;

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success) {
      localStorage.clear();
      window.location.href = 'index.html';
    }
  } catch (err) {
    console.warn("Auth server unreachable, using local session.");
  }
}

// ─── Helper: show small inline message ──────────────────────────────────────
function showMsg(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = text
    ? `<div class="alert alert-${type}" style="padding:0.4rem 0.7rem;font-size:0.8rem;">${text}</div>`
    : '';
}

// ─── Load Assigned Tasks ─────────────────────────────────────────────────────
async function loadTasks() {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_BASE}/student/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const container = document.getElementById('tasks-list');

    if (!container) return;

    if (!data.success || !data.tasks || data.tasks.length === 0) {
      container.innerHTML = '<p class="muted">No tasks assigned yet.</p>';
      return;
    }

    container.innerHTML = data.tasks.map(task => `
      <div style="border:1px solid var(--border);border-radius:8px;padding:0.75rem;margin-bottom:0.5rem;background:var(--surface2);">
        <div style="font-weight:600;margin-bottom:0.25rem;">📌 ${task.title}</div>
        <div class="muted" style="font-size:0.8rem;">${task.description || 'No description.'}</div>
        ${task.dueDate ? `<div class="muted" style="font-size:0.75rem;margin-top:0.3rem;">📅 Due: ${task.dueDate}</div>` : ''}
        <span class="badge badge-${task.status === 'completed' ? 'success' : task.status === 'in-progress' ? 'warning' : 'muted'}" style="margin-top:0.4rem;">
          ${task.status}
        </span>
      </div>
    `).join('');
  } catch (err) {
    document.getElementById('tasks-list').innerHTML = '<p class="muted">Failed to load tasks.</p>';
  }
}

// ─── Load My Activity Logs ───────────────────────────────────────────────────
async function loadMyLogs() {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_BASE}/student/my-logs`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const tbody = document.getElementById('my-logs-body');

    if (!tbody) return;

    if (!data.success || !data.logs || data.logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="muted center">No activity logged yet.</td></tr>';
      return;
    }

    tbody.innerHTML = data.logs.map(log => `
      <tr>
        <td>${log.action}</td>
        <td class="muted">${log.details || '—'}</td>
        <td class="muted" style="white-space:nowrap;">${new Date(log.timestamp).toLocaleTimeString()}</td>
      </tr>
    `).join('');
  } catch {
    document.getElementById('my-logs-body').innerHTML = '<tr><td colspan="3" class="muted center">Error loading logs.</td></tr>';
  }
}

// ─── Activity Logger ─────────────────────────────────────────────────────────
const logBtn = document.getElementById('log-btn');
if (logBtn) {
  logBtn.addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    const action = document.getElementById('log-action').value.trim();
    if (!action) { showMsg('log-message', 'Please enter an action to log.', 'danger'); return; }

    try {
      const res = await fetch(`${API_BASE}/student/log`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action, details: 'Logged from student dashboard' })
      });
      const data = await res.json();
      if (data.success) {
        showMsg('log-message', '✅ Activity logged!', 'success');
        document.getElementById('log-action').value = '';
        loadMyLogs();
      }
    } catch {
      showMsg('log-message', 'Error connecting to server.', 'danger');
    }
  });
}

// ─── URL Checker ─────────────────────────────────────────────────────────────
const checkUrlBtn = document.getElementById('check-url-btn');
if (checkUrlBtn) {
  checkUrlBtn.addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    const url = document.getElementById('url-input').value.trim();
    const result = document.getElementById('url-result');

    if (!url) { result.className = 'url-result denied'; result.textContent = 'Please enter a URL.'; return; }

    try {
      const res = await fetch(`${API_BASE}/student/check-url?url=${encodeURIComponent(url)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      result.className = `url-result ${data.allowed ? 'allowed' : 'denied'}`;
      result.textContent = data.message;
    } catch {
      result.className = 'url-result denied';
      result.textContent = '❌ Could not check URL.';
    }
  });
}

// ─── Load Assigned Files ─────────────────────────────────────────────────────
async function loadFiles() {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_BASE}/student/files`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const container = document.getElementById('files-container');

    if (!container) return;
    container.innerHTML = '';

    if (!data.files || data.files.length === 0) {
      container.innerHTML = "<p class='muted'>No files available</p>";
      return;
    }

    data.files.forEach(file => {
      const div = document.createElement('div');
      div.style.marginBottom = "8px";
      div.innerHTML = `
        📄 <a href="https://byod-44n0.onrender.com${file.fileUrl}" target="_blank">
          ${file.title}
        </a>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    console.error("Error loading files:", err);
  }
}

// ─── Timer Logic ─────────────────────────────────────────────────────────────
let seconds = 0;
let timerInterval = null;

function formatTime(secs) {
  const h = Math.floor(secs / 3600).toString().padStart(2, '0');
  const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

const timerDisplay = document.getElementById('timer-display');
const startBtn = document.getElementById('start-timer-btn');
const pauseBtn = document.getElementById('pause-timer-btn');
const resetBtn = document.getElementById('reset-timer-btn');

if (startBtn) {
  startBtn.addEventListener('click', () => {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
      seconds++;
      if (timerDisplay) timerDisplay.textContent = formatTime(seconds);
    }, 1000);
  });
}

if (pauseBtn) {
  pauseBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    timerInterval = null;
  });
}

if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    timerInterval = null;
    seconds = 0;
    if (timerDisplay) timerDisplay.textContent = formatTime(0);
  });
}

// ─── Logout ──────────────────────────────────────────────────────────────────
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/auth/logout`, { 
      method: 'POST', 
      headers: { 'Authorization': `Bearer ${token}` } 
    });
    localStorage.clear();
    window.location.href = 'index.html';
  });
}

// ─── Init ────────────────────────────────────────────────────────────────────
checkAuth();
loadTasks();
loadMyLogs();
loadFiles();