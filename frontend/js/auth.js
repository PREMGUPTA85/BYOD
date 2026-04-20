// public/js/auth.js
// Handles login and signup form submissions using fetch (no page reload)
// Redirects user to correct dashboard based on their role after success

// ─── Tab switching logic ─────────────────────────────────────────────────────
function switchTab(tab) {
  const loginForm  = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const tabLogin   = document.getElementById('tab-login');
  const tabSignup  = document.getElementById('tab-signup');

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
  } else {
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    tabSignup.classList.add('active');
    tabLogin.classList.remove('active');
  }
  // Clear any messages when switching tabs
  showMessage('auth-message', '', '');
}

// ─── Helper: show a message in the notification area ────────────────────────
// type: 'success', 'danger', or 'info'
function showMessage(elementId, text, type) {
  const el = document.getElementById(elementId);
  if (!text) { el.innerHTML = ''; return; }
  const icons = { success: '✅', danger: '❌', info: 'ℹ️' };
  el.innerHTML = `<div class="alert alert-${type}">${icons[type] || ''} ${text}</div>`;
}

// ─── LOGIN FORM ───────────────────────────────────────────────────────────────
document.getElementById('login-form').addEventListener('submit', async function (e) {
  e.preventDefault(); // Prevent default form submit (page reload)

  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn      = document.getElementById('login-btn');

  btn.textContent = 'Logging in...';
  btn.disabled = true;

  try {
    // Send POST request to login API
    const res  = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include' // Include cookies in request
    });
    const data = await res.json();

    if (data.success) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      showMessage('auth-message', `Welcome back, ${data.user.name}! Redirecting...`, 'success');
      // Redirect based on role
      setTimeout(() => {
        window.location.href = data.user.role === 'teacher' ? '/teacher.html' : '/student.html';
      }, 800);
    } else {
      // Show error message from server
      const msg = data.errors ? data.errors.map(e => e.msg).join(', ') : data.message;
      showMessage('auth-message', msg, 'danger');
    }
  } catch (err) {
    showMessage('auth-message', 'Connection error. Is the server running?', 'danger');
  } finally {
    btn.textContent = '🔐 Login';
    btn.disabled = false;
  }
});

// ─── SIGNUP FORM ──────────────────────────────────────────────────────────────
document.getElementById('signup-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const name     = document.getElementById('signup-name').value.trim();
  const email    = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const role     = document.getElementById('signup-role').value;
  const btn      = document.getElementById('signup-btn');

  btn.textContent = 'Creating account...';
  btn.disabled = true;

  try {
    const res  = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
      credentials: 'include'
    });
    const data = await res.json();

    if (data.success) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      showMessage('auth-message', 'Account created! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = data.user.role === 'teacher' ? '/teacher.html' : '/student.html';
      }, 900);
    } else {
      const msg = data.errors ? data.errors.map(e => e.msg).join(', ') : data.message;
      showMessage('auth-message', msg, 'danger');
    }
  } catch (err) {
    showMessage('auth-message', 'Connection error. Is the server running?', 'danger');
  } finally {
    btn.textContent = '✅ Create Account';
    btn.disabled = false;
  }
});
