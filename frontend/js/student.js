// public/js/student.js
const API_BASE = 'https://byod-44n0.onrender.com/api';

// Initialize Socket.io (Ensure CDN is in student.html)
const socket = io('https://byod-44n0.onrender.com', {
  transports: ['websocket'],
  withCredentials: true
});

// ─── Guard: Authentication ───────────────────────────────────────────────────
async function checkAuth() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token || !user || user.role !== 'student') {
    window.location.href = 'index.html';
    return;
  }

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

// ─── Real-Time Listeners (Socket.io) ──────────────────────────────────────────
socket.on('announcement', (data) => {
  // You can replace this with a nice toast/notification UI
  alert(`📢 Announcement from ${data.from}:\n${data.message}`);
});

socket.on('new-restriction', (data) => {
  const result = document.getElementById('url-result');
  if (result) {
    result.className = 'url-result denied';
    result.textContent = `🚫 New block added: ${data.url}`;
  }
});

// ─── Helper: UI Messages ─────────────────────────────────────────────────────
function showMsg(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = text
    ? `<div class="alert alert-${type}" style="padding:0.4rem 0.7rem;font-size:0.8rem;">${text}</div>`
    : '';
  if (text) setTimeout(() => { el.innerHTML = ''; }, 4000);
}

// ─── Data Loaders ────────────────────────────────────────────────────────────
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
      <div class="task-card" style="border:1px solid var(--border);border-radius:8px;padding:0.75rem;margin-bottom:0.5rem;background:var(--surface2);">
        <div style="font-weight:600;margin-bottom:0.25rem;">📌 ${task.title}</div>
        <div class="muted" style="font-size:0.8rem;">${task.description || 'No description.'}</div>
        ${task.dueDate ? `<div class="muted" style="font-size:0.75rem;margin-top:0.3rem;">📅 Due: ${task.dueDate}</div>` : ''}
        <div style="margin-top:0.5rem;">
          <span class="badge badge-${task.status === 'completed' ? 'success' : task.status === 'in-progress' ? 'warning' : 'muted'}">
            ${task.status}
          </span>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error("Failed to load tasks");
  }
}

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
  } catch (err) {
    console.error("Failed to load logs");
  }
}

async function loadFiles() {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_BASE}/student/files`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const container = document.getElementById('files-container');
    if (!container) return;

    if (!data.files || data.files.length === 0) {
      container.innerHTML = "<p class='muted'>No files available</p>";
      return;
    }

    container.innerHTML = data.files.map(file => `
      <div class="file-item" style="margin-bottom:8px; padding: 5px; border-bottom: 1px hideen var(--border);">
        📄 <a href="https://byod-44n0.onrender.com${file.fileUrl}" target="_blank" style="text-decoration:none; color:var(--primary);">
          ${file.title}
        </a>
      </div>
    `).join('');
  } catch (err) {
    console.error("Error loading files");
  }
}

// ─── Interactive Logic ───────────────────────────────────────────────────────

// Log Activity
document.getElementById('log-btn')?.addEventListener('click', async () => {
  const token = localStorage.getItem('token');
  const actionEl = document.getElementById('log-action');
  const action = actionEl?.value.trim();
  if (!action) { showMsg('log-message', 'Please enter an action.', 'danger'); return; }

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
      actionEl.value = '';
      loadMyLogs();
    }
  } catch (err) {
    showMsg('log-message', 'Connection error.', 'danger');
  }
});

// URL Checker
document.getElementById('check-url-btn')?.addEventListener('click', async () => {
  const token = localStorage.getItem('token');
  const inputEl = document.getElementById('url-input');
  const result = document.getElementById('url-result');
  const url = inputEl?.value.trim();

  if (!url || !result) return;

  result.textContent = 'Checking...';
  
  try {
    const res = await fetch(`${API_BASE}/student/check-url?url=${encodeURIComponent(url)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    result.className = `url-result ${data.allowed ? 'allowed' : 'denied'}`;
    result.textContent = data.message;
  } catch (err) {
    result.className = 'url-result denied';
    result.textContent = '❌ Error checking URL.';
  }
});

// Productivity Timer
let seconds = 0;
let timerInterval = null;

const timerDisplay = document.getElementById('timer-display');
const updateTimerUI = () => {
  if (timerDisplay) {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    timerDisplay.textContent = `${h}:${m}:${s}`;
  }
};

document.getElementById('start-timer-btn')?.addEventListener('click', () => {
  if (timerInterval) return;
  timerInterval = setInterval(() => { seconds++; updateTimerUI(); }, 1000);
});

document.getElementById('pause-timer-btn')?.addEventListener('click', () => {
  clearInterval(timerInterval);
  timerInterval = null;
});

document.getElementById('reset-timer-btn')?.addEventListener('click', () => {
  clearInterval(timerInterval);
  timerInterval = null;
  seconds = 0;
  updateTimerUI();
});

// Logout
document.getElementById('logout-btn')?.addEventListener('click', async () => {
  const token = localStorage.getItem('token');
  // Optional: notify server of logout
  await fetch(`${API_BASE}/auth/logout`, { 
    method: 'POST', 
    headers: { 'Authorization': `Bearer ${token}` } 
  }).catch(() => {});

  localStorage.clear();
  window.location.href = 'index.html';
});

// ─── Initialization ──────────────────────────────────────────────────────────
checkAuth();
loadTasks();
loadMyLogs();
loadFiles();