// public/js/teacher.js
// All teacher/admin panel logic: load students, logs, restrictions, tasks, send announcements

// ─── Guard: redirect to login if not teacher ─────────────────────────────────
async function checkAuth() {
  try {
    const res  = await fetch('/api/auth/me', { credentials: 'include' });
    const data = await res.json();
    if (!data.success || data.user.role !== 'teacher') {
      window.location.href = '/';
    } else {
      document.getElementById('teacher-name-display').textContent = data.user.name;
    }
  } catch {
    window.location.href = '/';
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
    const res  = await fetch('/api/teacher/students', { credentials: 'include' });
    const data = await res.json();
    const tbody = document.getElementById('students-body');
    const taskSelect = document.getElementById('task-assign');
    const fileAssign = document.getElementById('file-assign');

    // Update stat
    document.getElementById('stat-students').textContent = data.students ? data.students.length : 0;

    if (!data.success || data.students.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="muted center">No students registered yet.</td></tr>';
      return;
    }

    tbody.innerHTML = data.students.map(s => `
      <tr>
        <td>${s.name}</td>
        <td class="muted">${s.email}</td>
        <td class="muted">${new Date(s.createdAt).toLocaleDateString()}</td>
      </tr>
    `).join('');

    // Populate task assignment dropdown with individual students
   data.students.forEach(s => {
  // For task dropdown
  const opt1 = document.createElement('option');
  opt1.value = s._id;
  opt1.textContent = s.name;
  taskSelect.appendChild(opt1);

  // For file upload dropdown
  const opt2 = document.createElement('option');
  opt2.value = s.name;   // important (matches your backend)
  opt2.textContent = s.name;
  fileAssign.appendChild(opt2);
});
  } catch {
    document.getElementById('students-body').innerHTML =
      '<tr><td colspan="3" class="muted center">Error loading students.</td></tr>';
  }
}

// ─── Load File Logs (via ReadStream on server) ────────────────────────────────
async function loadFileLogs() {
  try {
    const res  = await fetch('/api/teacher/logs', { credentials: 'include' });
    const data = await res.json();
    const box  = document.getElementById('log-box');
    box.textContent = data.logs || 'No logs found.';
    // Scroll to bottom (latest entries)
    box.scrollTop = box.scrollHeight;
  } catch {
    document.getElementById('log-box').textContent = 'Error loading log file.';
  }
}

// Refresh logs button
document.getElementById('refresh-logs-btn').addEventListener('click', loadFileLogs);

// ─── Load DB Logs from MongoDB ────────────────────────────────────────────────
async function loadDbLogs(filter = '') {
  try {
    const url  = `/api/teacher/logs/db${filter ? `?student=${encodeURIComponent(filter)}` : ''}`;
    const res  = await fetch(url, { credentials: 'include' });
    const data = await res.json();
    const tbody = document.getElementById('db-logs-body');

    // Update stat
    document.getElementById('stat-logs').textContent = data.logs ? data.logs.length : 0;

    if (!data.success || data.logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="muted center">No activity logs found.</td></tr>';
      return;
    }

    tbody.innerHTML = data.logs.map(log => `
      <tr>
        <td>${log.userName}</td>
        <td>${log.action}</td>
        <td class="muted">${log.details || '—'}</td>
        <td class="muted" style="white-space:nowrap;">${new Date(log.timestamp).toLocaleString()}</td>
      </tr>
    `).join('');
  } catch {
    document.getElementById('db-logs-body').innerHTML =
      '<tr><td colspan="4" class="muted center">Error loading DB logs.</td></tr>';
  }
}

// Filter DB logs by student name
document.getElementById('filter-logs-btn').addEventListener('click', () => {
  const filter = document.getElementById('log-filter').value.trim();
  loadDbLogs(filter);
});

// ─── Load Restrictions ────────────────────────────────────────────────────────
async function loadRestrictions() {
  try {
    const res  = await fetch('/api/teacher/restrictions', { credentials: 'include' });
    const data = await res.json();
    const tbody = document.getElementById('restrictions-body');

    document.getElementById('stat-restrictions').textContent = data.restrictions ? data.restrictions.length : 0;

    if (!data.success || data.restrictions.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="muted center">No URLs blocked yet.</td></tr>';
      return;
    }

    tbody.innerHTML = data.restrictions.map(r => `
      <tr>
        <td><span class="badge badge-danger">🚫 ${r.url}</span></td>
        <td class="muted">${r.addedBy}</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="removeRestriction('${r._id}')">Remove</button>
        </td>
      </tr>
    `).join('');
  } catch {
    document.getElementById('restrictions-body').innerHTML =
      '<tr><td colspan="3" class="muted center">Error loading restrictions.</td></tr>';
  }
}

// Add a blocked URL
document.getElementById('add-restriction-btn').addEventListener('click', async () => {
  const url = document.getElementById('restriction-url').value.trim();
  if (!url) { showMsg('restriction-message', 'Please enter a URL to block.', 'danger'); return; }

  try {
    const res  = await fetch('/api/teacher/restrictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      credentials: 'include'
    });
    const data = await res.json();
    if (data.success) {
      showMsg('restriction-message', `✅ ${data.restriction.url} is now blocked.`, 'success');
      document.getElementById('restriction-url').value = '';
      loadRestrictions();
    } else {
      showMsg('restriction-message', data.message || 'Failed.', 'danger');
    }
  } catch {
    showMsg('restriction-message', 'Server error.', 'danger');
  }
});

// Remove a blocked URL
async function removeRestriction(id) {
  try {
    const res  = await fetch(`/api/teacher/restrictions/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    const data = await res.json();
    if (data.success) loadRestrictions();
  } catch {
    alert('Failed to remove restriction.');
  }
}

// ─── Load Tasks ───────────────────────────────────────────────────────────────
async function loadTasks() {
  try {
    const res  = await fetch('/api/teacher/tasks', { credentials: 'include' });
    const data = await res.json();
    document.getElementById('stat-tasks').textContent = data.tasks ? data.tasks.length : 0;
  } catch { /* silent */ }
}

// Assign Task
document.getElementById('task-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title      = document.getElementById('task-title').value.trim();
  const description = document.getElementById('task-desc').value.trim();
  const assignedTo = document.getElementById('task-assign').value;
  const dueDate    = document.getElementById('task-due').value;

  try {
    const res  = await fetch('/api/teacher/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, assignedTo, dueDate }),
      credentials: 'include'
    });
    const data = await res.json();
    if (data.success) {
      showMsg('task-message', `✅ Task "${data.task.title}" assigned!`, 'success');
      document.getElementById('task-form').reset();
      loadTasks();
    } else {
      const msg = data.errors ? data.errors.map(e => e.msg).join(', ') : data.message;
      showMsg('task-message', msg, 'danger');
    }
  } catch {
    showMsg('task-message', 'Server error.', 'danger');
  }
});

// ─── Send Announcement via Socket.IO ─────────────────────────────────────────
document.getElementById('send-announcement-btn').addEventListener('click', () => {
  const text = document.getElementById('announcement-text').value.trim();
  if (!text) { showMsg('ann-message', 'Please type a message.', 'danger'); return; }

  const teacherName = document.getElementById('teacher-name-display').textContent;

  // Emit to server — server broadcasts to all connected clients
  socket.emit('announcement', {
    message: text,
    from: teacherName
  });

  showMsg('ann-message', '✅ Announcement sent to all students!', 'success');
  document.getElementById('announcement-text').value = '';
});

// ─── Logout ──────────────────────────────────────────────────────────────────
document.getElementById('logout-btn').addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  window.location.href = '/';
});



async function uploadFile() {
  console.log("UPLOAD CLICKED");

  const file = document.getElementById('fileInput').files[0];
  const title = document.getElementById('file-title').value;
  const assignedTo = document.getElementById('file-assign').value;

  if (!file) {
    alert("Please select a file");
    return;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);
  formData.append('assignedTo', assignedTo);

  const res = await fetch('http://localhost:3000/api/teacher/upload', {
    method: 'POST',
    body: formData,
    credentials: 'include'
  });

  const data = await res.json();
  console.log("UPLOAD RESPONSE:", data);

  document.getElementById('upload-message').innerText =
    data.message || "Upload successful ✅";
}

// ─── Init ─────────────────────────────────────────────────────────────────────
checkAuth();
loadStudents();
loadFileLogs();
loadDbLogs();
loadRestrictions();
loadTasks();