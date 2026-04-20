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

// public/js/auth.js

// ─── HELPER: SHOW MESSAGES ──────────────────────────────────────────────────
function showMessage(elementId, text, type) {
  const el = document.getElementById(elementId);
  if (!el) return;
  if (!text) { el.innerHTML = ''; return; }
  
  const icons = { success: '✅', danger: '❌', info: 'ℹ️' };
  el.className = `alert alert-${type}`; // Ensure you have these CSS classes
  el.innerHTML = `${icons[type] || ''} ${text}`;
}

// ─── LOGIN FORM LOGIC ───────────────────────────────────────────────────────
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const btn      = document.getElementById('login-btn');

    btn.textContent = 'Logging in...';
    btn.disabled = true;

    try {
      const res = await fetch('https://byod-44n0.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include' 
      });
      
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        showMessage('auth-message', `Welcome back, ${data.user.name}!`, 'success');
        
        // Redirect based on role
        setTimeout(() => {
          window.location.href = data.user.role === 'teacher' ? '/teacher.html' : '/student.html';
        }, 800);
      } else {
        showMessage('auth-message', data.message || 'Invalid credentials', 'danger');
      }
    } catch (err) {
      showMessage('auth-message', 'Server connection failed. Try again later.', 'danger');
    } finally {
      btn.textContent = '🔐 Login';
      btn.disabled = false;
    }
  });
}

// ─── SIGNUP FORM LOGIC ──────────────────────────────────────────────────────
const signupForm = document.getElementById('signup-form');
if (signupForm) {
  signupForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const name     = document.getElementById('signup-name').value.trim();
    const email    = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const role     = document.getElementById('signup-role').value;
    const btn      = document.getElementById('signup-btn');

    btn.textContent = 'Creating account...';
    btn.disabled = true;

    try {
      const res = await fetch('https://byod-44n0.onrender.com/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
        credentials: 'include'
      });
      
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        showMessage('auth-message', 'Account created successfully!', 'success');
        
        setTimeout(() => {
          window.location.href = data.user.role === 'teacher' ? '/teacher.html' : '/student.html';
        }, 1000);
      } else {
        const errorMsg = data.errors ? data.errors.map(e => e.msg).join(', ') : data.message;
        showMessage('auth-message', errorMsg, 'danger');
      }
    } catch (err) {
      showMessage('auth-message', 'Could not connect to registration server.', 'danger');
    } finally {
      btn.textContent = '✅ Create Account';
      btn.disabled = false;
    }
  });
}