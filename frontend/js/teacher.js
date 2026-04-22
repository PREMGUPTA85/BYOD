// public/js/teacher.js

// ─── HELPER: BASE URL DETECTION ─────────────────────────────────────────────
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE = 'https://byod-44n0.onrender.com/api';

const SOCKET_URL = 'https://byod-44n0.onrender.com';

// Initialize Socket.IO
const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  withCredentials: true
});

// ─── Guard: Authentication ───────────────────────────────────────────────────
async function checkAuth() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token || !user || user.role !== 'teacher') {
    window.location.href = 'index.html';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
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
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_BASE}/teacher/students`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    window.allStudents = data.students || [];

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
    if (taskSelect) taskSelect.innerHTML = '<option value="all">All Students</option>';
    if (fileAssign) fileAssign.innerHTML = '<option value="all">All Students</option>';
    
    data.students.forEach(s => {
      if (taskSelect) {
        const opt1 = document.createElement('option');
        opt1.value = s._id;
        opt1.textContent = s.name;
        taskSelect.appendChild(opt1);
      }
      if (fileAssign) {
        const opt2 = document.createElement('option');
        opt2.value = s._id;
        opt2.textContent = s.name;
        fileAssign.appendChild(opt2);
      }
    });
  } catch (err) {
    console.error("Failed to load students", err);
  }
}

// ─── Load DB Logs ────────────────────────────────────────────────────────────
async function loadDbLogs(filter = '') {
  const token = localStorage.getItem('token');
  try {
    const url = `${API_BASE}/teacher/logs/db${filter ? `?student=${encodeURIComponent(filter)}` : ''}`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
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
          <td class="muted">${new Date(log.timestamp).toLocaleString()}</td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error("Error loading logs", err);
  }
}

// ─── Clear DB Logs ───────────────────────────────────────────────────────────
document.getElementById('clear-db-logs-btn')?.addEventListener('click', async () => {
  if (!confirm('Are you sure you want to delete ALL activity logs? This cannot be undone.')) return;
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_BASE}/teacher/logs`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      loadDbLogs();
    }
  } catch (err) {
    console.error('Error clearing logs', err);
  }
});

// ─── Load Text Logs ────────────────────────────────────────────────────────────
async function loadTextLogs() {
  const token = localStorage.getItem('token');
  const logBox = document.getElementById('log-box');
  if (!logBox) return;

  logBox.textContent = 'Loading logs...';

  try {
    const res = await fetch(`${API_BASE}/teacher/logs`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      logBox.textContent = data.logs || 'No logs found.';
    } else {
      logBox.textContent = 'Failed to load logs.';
    }
  } catch (err) {
    console.error("Error loading text logs", err);
    logBox.textContent = 'Error connecting to server.';
  }
}

document.getElementById('refresh-logs-btn')?.addEventListener('click', loadTextLogs);

// Download Logs
document.getElementById('download-logs-link')?.addEventListener('click', async (e) => {
  e.preventDefault();
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_BASE}/teacher/logs/download`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to download logs');
    
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'activity.log.gz';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    alert('Download failed.');
  }
});

// ─── Load Tasks ────────────────────────────────────────────────────────────
async function loadTasks() {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_BASE}/teacher/tasks`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    
    if (document.getElementById('stat-tasks')) {
      document.getElementById('stat-tasks').textContent = data.tasks ? data.tasks.length : 0;
    }

    const tbody = document.getElementById('task-overview-body');
    if (tbody) {
      if (!data.tasks || data.tasks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="muted center">No tasks assigned yet.</td></tr>';
        return;
      }

      // Helper to get name from ID
      const getName = (id) => {
        if (id === 'all') return 'All Students';
        const st = window.allStudents?.find(s => s._id === id);
        return st ? st.name : 'Unknown';
      };

      tbody.innerHTML = data.tasks.map(t => {
        const assigned = getName(t.assignedTo);
        const completed = t.completedBy && t.completedBy.length > 0 
          ? t.completedBy.map(id => `<span class="badge badge-success">${getName(id)}</span>`).join(' ')
          : '<span class="muted">None yet</span>';

        return `
          <tr>
            <td><strong>${t.title}</strong><br><small class="muted">Due: ${t.dueDate || 'N/A'}</small></td>
            <td>${assigned}</td>
            <td>${completed}</td>
            <td><button class="btn" style="background:#dc3545; color:white; padding:0.2rem 0.5rem; font-size:0.75rem;" onclick="deleteTask('${t._id}')">🗑️</button></td>
          </tr>
        `;
      }).join('');
    }
  } catch (err) {
    console.error("Error loading tasks", err);
  }
}

window.deleteTask = async function(taskId) {
  if (!confirm('Are you sure you want to delete this task?')) return;
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_BASE}/teacher/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      loadTasks();
    }
  } catch (err) {
    console.error('Error deleting task', err);
  }
};

// ─── Load Restrictions ────────────────────────────────────────────────────────
async function loadRestrictions() {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_BASE}/teacher/restrictions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const tbody = document.getElementById('restrictions-body');

    if (!data.success || !data.restrictions) {
      if (data.message === 'Invalid token.') {
        alert('Session expired. Please log out and log back in.');
        window.location.href = '/index.html';
      }
      return;
    }

    if (document.getElementById('stat-restrictions')) {
      document.getElementById('stat-restrictions').textContent = data.restrictions.length;
    }

    if (tbody) {
      if (data.restrictions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="muted center">No URLs are currently restricted.</td></tr>';
        return;
      }
      tbody.innerHTML = data.restrictions.map(r => `
        <tr>
          <td><span class="badge badge-danger">🚫 ${r.url}</span></td>
          <td class="muted">${r.addedBy || 'Teacher'}</td>
          <td><button class="btn btn-danger btn-sm" onclick="removeRestriction('${r._id}')">Remove</button></td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error("Error loading restrictions", err);
  }
}

// Add Restriction
document.getElementById('add-restriction-btn')?.addEventListener('click', async () => {
  const token = localStorage.getItem('token');
  const urlInput = document.getElementById('restriction-url');
  const url = urlInput.value.trim();
  if (!url) return;

  try {
    const res = await fetch(`${API_BASE}/teacher/restrictions`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ url })
    });
    const data = await res.json();
    if (data.success) {
      urlInput.value = '';
      loadRestrictions();
    }
  } catch (err) {
    showMsg('restriction-message', 'Server error.', 'danger');
  }
});

// Remove Restriction
window.removeRestriction = async function(id) {
  const token = localStorage.getItem('token');
  try {
    await fetch(`${API_BASE}/teacher/restrictions/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    loadRestrictions();
  } catch (err) {
    alert('Failed to remove restriction.');
  }
};

// ─── Assign Task ──────────────────────────────────────────────────────────────
document.getElementById('task-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const token = localStorage.getItem('token');
  
  const payload = {
    title: document.getElementById('task-title').value.trim(),
    description: document.getElementById('task-desc').value.trim(),
    assignedTo: document.getElementById('task-assign').value,
    dueDate: document.getElementById('task-due').value
  };

  try {
    const res = await fetch(`${API_BASE}/teacher/tasks`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(payload),
    });
    
    const data = await res.json();
    if (data.success) {
      showMsg('task-message', `✅ Task assigned!`, 'success');
      document.getElementById('task-form').reset();
      loadTasks();
    }
  } catch (err) {
    showMsg('task-message', 'Server error.', 'danger');
  }
});

// ─── Send Announcement ────────────────────────────────────────────────────────
async function loadTeacherAnnouncements() {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_BASE}/teacher/announcements`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const list = document.getElementById('sent-announcements');
    
    if (list && data.success && data.announcements.length > 0) {
      list.innerHTML = '';
      data.announcements.forEach(a => {
        const time = new Date(a.createdAt).toLocaleTimeString();
        const div = document.createElement('div');
        div.style = "padding: 0.5rem; border-bottom: 1px solid var(--border);";
        div.innerHTML = `<strong>You:</strong> ${a.message} <br><small class="muted">${time}</small>`;
        list.appendChild(div);
      });
    }
  } catch (err) {
    console.error("Failed to load teacher announcements", err);
  }
}

document.getElementById('send-announcement-btn')?.addEventListener('click', () => {
  const text = document.getElementById('announcement-text').value.trim();
  if (!text) return;

  const teacherName = document.getElementById('teacher-name-display').textContent;
  socket.emit('announcement', { message: text, from: teacherName });

  showMsg('ann-message', '✅ Announcement sent!', 'success');
  document.getElementById('announcement-text').value = '';

  const list = document.getElementById('sent-announcements');
  if (list) {
    const muted = list.querySelector('.muted');
    if (muted) muted.remove();
    
    const time = new Date().toLocaleTimeString();
    const div = document.createElement('div');
    div.style = "padding: 0.5rem; border-bottom: 1px solid var(--border);";
    div.innerHTML = `<strong>You:</strong> ${text} <br><small class="muted">${time}</small>`;
    list.insertBefore(div, list.firstChild);
  }
});

// ─── Upload Study Material ────────────────────────────────────────────────────
document.getElementById('upload-file-btn')?.addEventListener('click', async () => {
  const uploadBtn = document.getElementById('upload-file-btn');
  const fileInput = document.getElementById('fileInput');
  const titleInput = document.getElementById('file-title');
  const assignSelect = document.getElementById('file-assign');
  const file = fileInput.files[0];
  const title = titleInput.value.trim();
  const assignedTo = assignSelect.value;
  const token = localStorage.getItem('token');

  if (!file) {
    showMsg('upload-message', 'Please select a file.', 'danger');
    return;
  }

  // Show loading state
  uploadBtn.disabled = true;
  const originalBtnText = uploadBtn.textContent;
  uploadBtn.textContent = 'Uploading... Please wait';
  showMsg('upload-message', 'Starting upload...', 'warning');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);
  formData.append('assignedTo', assignedTo);

  try {
    const res = await fetch(`${API_BASE}/teacher/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await res.json();
    if (data.success || res.ok) {
      showMsg('upload-message', '✅ File uploaded successfully!', 'success');
      fileInput.value = '';
      titleInput.value = '';
    } else {
      showMsg('upload-message', data.message || 'Upload failed.', 'danger');
    }
  } catch (err) {
    console.error('Upload Error:', err);
    showMsg('upload-message', 'Server error.', 'danger');
  } finally {
    // Restore button state
    uploadBtn.disabled = false;
    uploadBtn.textContent = originalBtnText;
  }
});

// ─── Logout ──────────────────────────────────────────────────────────────────
document.getElementById('logout-btn')?.addEventListener('click', () => {
  localStorage.clear();
  window.location.href = 'index.html';
});

// ─── Init ─────────────────────────────────────────────────────────────────────
async function init() {
  await checkAuth();
  await loadStudents(); // Wait for students to load so tasks can resolve their names
  loadDbLogs();
  loadTextLogs();
  loadRestrictions();
  loadTasks();
  loadTeacherAnnouncements();
}

init();