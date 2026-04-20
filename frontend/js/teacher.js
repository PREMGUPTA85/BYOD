// public/js/teacher.js
// All teacher/admin panel logic: load students, logs, restrictions, tasks, send announcements

// 1. Define your Backend URL
const API_BASE = 'https://byod-44n0.onrender.com/api';

// 2. Initialize Socket.IO (Ensure the CDN is in your teacher.html)
const socket = io('https://byod-44n0.onrender.com', {
  transports: ['websocket'], // Force WebSocket only to stop 404 polling errors
  upgrade: false,
  withCredentials: true
});

socket.on('connect', () => {
  console.log('Successfully connected to Render Socket server:', socket.id);
});

socket.on('connect_error', (err) => {
  console.error('Socket Connection Error:', err.message);
});

// ─── Guard: redirect to login if not teacher ─────────────────────────────────
// public/js/teacher.js

async function checkAuth() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  // 1. Instant local check to stop the redirect loop
  if (!token || !user || user.role !== 'teacher') {
    window.location.href = 'index.html';
    return;
  }

  // 2. Verify with the server using the Token
  try {
    const res = await fetch('https://byod-44n0.onrender.com/api/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`, // CRITICAL: Send the token here
        'Content-Type': 'application/json'
      }
    });
    
    const data = await res.json();
    if (!data.success) {
      localStorage.clear();
      window.location.href = 'index.html';
    } else {
      document.getElementById('teacher-name-display').textContent = data.user.name;
    }
  } catch (err) {
    console.error("Auth server unreachable, staying on page.");
  }
}
// ─── Helper: inline message ──────────────────────────────────────────────────
function showMsg(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = text
    ? `<div class="alert alert-${type}" style="padding:0.4rem 0.7rem;font-size:0.8rem;">${text}</div>`
    : '';
  if (text) setTimeout(() => { el.innerHTML = ''; }, 4000);
}

// ─── Load All Students ────────────────────────────────────────────────────────
async function loadStudents() {
  try {
    const res = await fetch(`${API_BASE}/teacher/students`, { credentials: 'include' });
    const data = await res.json();
    const tbody = document.getElementById('students-body');
    const taskSelect = document.getElementById('task-assign');
    const fileAssign = document.getElementById('file-assign');

    if (document.getElementById('stat-students')) {
      document.getElementById('stat-students').textContent = data.students ? data.students.length : 0;
    }

    if (!data.success || !data.students || data.students.length === 0) {
      if (tbody) tbody.innerHTML = '<tr><td colspan="3" class="muted center">No students registered yet.</td></tr>';
      return;
    }

    if (tbody) {
      tbody.innerHTML = data.students.map(s => `
        <tr>
          <td>${s.name}</td>
          <td class="muted">${s.email}</td>
          <td class="muted">${new Date(s.createdAt).toLocaleDateString()}</td>
        </tr>
      `).join('');
    }

    // Populate dropdowns
    data.students.forEach(s => {
      if (taskSelect) {
        const opt1 = document.createElement('option');
        opt1.value = s._id;
        opt1.textContent = s.name;
        taskSelect.appendChild(opt1);
      }
      if (fileAssign) {
        const opt2 = document.createElement('option');
        opt2.value = s.name;
        opt2.textContent = s.name;
        fileAssign.appendChild(opt2);
      }
    });
  } catch (err) {
    console.error("Failed to load students", err);
  }
}

// ─── Load DB Logs from MongoDB ────────────────────────────────────────────────
async function loadDbLogs(filter = '') {
  try {
    const url = `${API_BASE}/teacher/logs/db${filter ? `?student=${encodeURIComponent(filter)}` : ''}`;
    const res = await fetch(url, { credentials: 'include' });
    const data = await res.json();
    const tbody = document.getElementById('db-logs-body');

    if (document.getElementById('stat-logs')) {
      document.getElementById('stat-logs').textContent = data.logs ? data.logs.length : 0;
    }

    if (!data.success || !data.logs || data.logs.length === 0) {
      if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="muted center">No activity logs found.</td></tr>';
      return;
    }

    if (tbody) {
      tbody.innerHTML = data.logs.map(log => `
        <tr>
          <td>${log.userName}</td>
          <td>${log.action}</td>
          <td class="muted">${log.details || '—'}</td>
          <td class="muted" style="white-space:nowrap;">${new Date(log.timestamp).toLocaleString()}</td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error("Error loading logs", err);
  }
}

// Filter DB logs
const filterBtn = document.getElementById('filter-logs-btn');
if (filterBtn) {
  filterBtn.addEventListener('click', () => {
    const filter = document.getElementById('log-filter').value.trim();
    loadDbLogs(filter);
  });
}

// ─── Load Restrictions ────────────────────────────────────────────────────────
async function loadRestrictions() {
  try {
    const res = await fetch(`${API_BASE}/teacher/restrictions`, { credentials: 'include' });
    const data = await res.json();
    const tbody = document.getElementById('restrictions-body');

    if (document.getElementById('stat-restrictions')) {
      document.getElementById('stat-restrictions').textContent = data.restrictions ? data.restrictions.length : 0;
    }

    if (!data.success || !data.restrictions || data.restrictions.length === 0) {
      if (tbody) tbody.innerHTML = '<tr><td colspan="3" class="muted center">No URLs blocked yet.</td></tr>';
      return;
    }

    if (tbody) {
      tbody.innerHTML = data.restrictions.map(r => `
        <tr>
          <td><span class="badge badge-danger">🚫 ${r.url}</span></td>
          <td class="muted">${r.addedBy || 'Teacher'}</td>
          <td>
            <button class="btn btn-danger btn-sm" onclick="removeRestriction('${r._id}')">Remove</button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error("Error loading restrictions", err);
  }
}

// Add a blocked URL
const addRestrictBtn = document.getElementById('add-restriction-btn');
if (addRestrictBtn) {
  addRestrictBtn.addEventListener('click', async () => {
    const urlInput = document.getElementById('restriction-url');
    const url = urlInput.value.trim();
    if (!url) { showMsg('restriction-message', 'Please enter a URL to block.', 'danger'); return; }

    try {
      const res = await fetch(`${API_BASE}/teacher/restrictions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        showMsg('restriction-message', `✅ ${data.restriction.url} is now blocked.`, 'success');
        urlInput.value = '';
        loadRestrictions();
      } else {
        showMsg('restriction-message', data.message || 'Failed to add restriction.', 'danger');
      }
    } catch (err) {
      showMsg('restriction-message', 'Server error.', 'danger');
    }
  });
}

// Remove a blocked URL
window.removeRestriction = async function(id) {
  try {
    const res = await fetch(`${API_BASE}/teacher/restrictions/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    const data = await res.json();
    if (data.success) loadRestrictions();
  } catch (err) {
    alert('Failed to remove restriction.');
  }
};

// ─── Assign Task ──────────────────────────────────────────────────────────────
const taskForm = document.getElementById('task-form');
if (taskForm) {
  taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('task-title').value.trim();
    const description = document.getElementById('task-desc').value.trim();
    const assignedTo = document.getElementById('task-assign').value;
    const dueDate = document.getElementById('task-due').value;

    try {
      const res = await fetch(`${API_BASE}/teacher/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, assignedTo, dueDate }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        showMsg('task-message', `✅ Task assigned!`, 'success');
        taskForm.reset();
      } else {
        showMsg('task-message', data.message || 'Failed to assign task.', 'danger');
      }
    } catch (err) {
      showMsg('task-message', 'Server error.', 'danger');
    }
  });
}

// ─── Send Announcement ────────────────────────────────────────────────────────
const annBtn = document.getElementById('send-announcement-btn');
if (annBtn) {
  annBtn.addEventListener('click', () => {
    const text = document.getElementById('announcement-text').value.trim();
    if (!text) { showMsg('ann-message', 'Please type a message.', 'danger'); return; }

    const teacherName = document.getElementById('teacher-name-display').textContent;

    socket.emit('announcement', {
      message: text,
      from: teacherName
    });

    showMsg('ann-message', '✅ Announcement sent!', 'success');
    document.getElementById('announcement-text').value = '';
  });
}

// ─── Logout ──────────────────────────────────────────────────────────────────
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
    window.location.href = '/index.html';
  });
}

// ─── File Upload ─────────────────────────────────────────────────────────────
window.uploadFile = async function() {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];
  const title = document.getElementById('file-title').value;
  const assignedTo = document.getElementById('file-assign').value;

  if (!file) { alert("Please select a file"); return; }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);
  formData.append('assignedTo', assignedTo);

  try {
    const res = await fetch(`${API_BASE}/teacher/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });
    const data = await res.json();
    const msgEl = document.getElementById('upload-message');
    if (msgEl) msgEl.innerText = data.message || "Upload successful ✅";
    fileInput.value = '';
  } catch (err) {
    alert("Upload failed.");
  }
};

// ─── Init ─────────────────────────────────────────────────────────────────────
checkAuth();
loadStudents();
loadDbLogs();
loadRestrictions();