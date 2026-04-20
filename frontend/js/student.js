// public/js/student.js
// All student dashboard logic: load tasks, timer, URL checker, activity log

// ─── Guard: redirect to login if not authenticated ───────────────────────────
async function checkAuth() {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    const data = await res.json();
    if (!data.success || data.user.role !== 'student') {
      window.location.href = '/';
    } else {
      document.getElementById('student-name-display').textContent = data.user.name;
    }
  } catch {
    window.location.href = '/';
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
  try {
    const res  = await fetch('/api/student/dashboard', { credentials: 'include' });
    const data = await res.json();
    const container = document.getElementById('tasks-list');

    if (!data.success || data.tasks.length === 0) {
      container.innerHTML = '<p class="muted">No tasks assigned yet.</p>';
      return;
    }

    // Build an HTML list of task cards
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
  try {
    const res  = await fetch('/api/student/my-logs', { credentials: 'include' });
    const data = await res.json();
    const tbody = document.getElementById('my-logs-body');

    if (!data.success || data.logs.length === 0) {
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
    document.getElementById('my-logs-body').innerHTML =
      '<tr><td colspan="3" class="muted center">Error loading logs.</td></tr>';
  }
}

// ─── Activity Logger (POST /api/student/log) ─────────────────────────────────
document.getElementById('log-btn').addEventListener('click', async () => {
  const action = document.getElementById('log-action').value.trim();
  if (!action) { showMsg('log-message', 'Please enter an action to log.', 'danger'); return; }

  try {
    const res  = await fetch('/api/student/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, details: 'Logged from student dashboard' }),
      credentials: 'include'
    });
    const data = await res.json();
    if (data.success) {
      showMsg('log-message', '✅ Activity logged!', 'success');
      document.getElementById('log-action').value = '';
      loadMyLogs(); // Refresh log table
    } else {
      showMsg('log-message', data.message || 'Failed to log.', 'danger');
    }
  } catch {
    showMsg('log-message', 'Error connecting to server.', 'danger');
  }
});

// ─── URL Checker ─────────────────────────────────────────────────────────────
document.getElementById('check-url-btn').addEventListener('click', async () => {
  const url    = document.getElementById('url-input').value.trim();
  const result = document.getElementById('url-result');

  if (!url) { result.className = 'url-result denied'; result.textContent = 'Please enter a URL.'; return; }

  try {
    const res  = await fetch(`/api/student/check-url?url=${encodeURIComponent(url)}`, { credentials: 'include' });
    const data = await res.json();

    result.className = `url-result ${data.allowed ? 'allowed' : 'denied'}`;
    result.textContent = data.message;
  } catch {
    result.className = 'url-result denied';
    result.textContent = '❌ Could not check URL. Server error.';
  }
});

// ─── Productivity Timer ───────────────────────────────────────────────────────
let seconds = 0;       // Total elapsed seconds
let timerInterval = null; // setInterval handle

// Format seconds → "HH:MM:SS"
function formatTime(secs) {
  const h = Math.floor(secs / 3600).toString().padStart(2, '0');
  const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function updateDisplay() {
  document.getElementById('timer-display').textContent = formatTime(seconds);
}


async function loadFiles() {
  try {
    const res = await fetch('http://byod-44n0.onrender.com/api/student/files', {
      credentials: 'include'
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
        📄 <a href="http://byod-44n0.onrender.com${file.fileUrl}" target="_blank">
          ${file.title}
        </a>
      `;

      container.appendChild(div);
    });

  } catch (err) {
    console.error("Error loading files:", err);
  }
}

// call it



// Start button: start counting every second
document.getElementById('start-timer-btn').addEventListener('click', () => {
  if (timerInterval) return; // Already running
  timerInterval = setInterval(() => {
    seconds++;
    updateDisplay();
  }, 1000);
});

// Pause button: stop counting
document.getElementById('pause-timer-btn').addEventListener('click', () => {
  clearInterval(timerInterval);
  timerInterval = null;
});

// Reset button: stop and reset to zero
document.getElementById('reset-timer-btn').addEventListener('click', () => {
  clearInterval(timerInterval);
  timerInterval = null;
  seconds = 0;
  updateDisplay();
});

// ─── Logout ──────────────────────────────────────────────────────────────────
document.getElementById('logout-btn').addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  window.location.href = '/';
});

// ─── Init: run all loaders when page loads ───────────────────────────────────
checkAuth();
loadTasks();
loadMyLogs();
loadFiles();