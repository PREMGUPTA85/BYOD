// public/js/socket-client.js
// Shared Socket.IO client used by both student.html and teacher.html
// Creates a global `socket` variable that other scripts can use

// Connect to Socket.IO server (auto-detects current host)
const socket = io();

// ─── For Student pages ────────────────────────────────────────────────────────
// Listen for 'announcement' events from teacher and display them
socket.on('announcement', (data) => {
  // Show banner at the top of the page
  const banner = document.getElementById('announcement-banner');
  const bannerText = document.getElementById('announcement-text');
  if (banner && bannerText) {
    bannerText.textContent = `${data.from}: ${data.message}`;
    banner.classList.remove('hidden');
    // Hide banner after 10 seconds
    setTimeout(() => banner.classList.add('hidden'), 10000);
  }

  // Also add to the announcements feed card
  const list = document.getElementById('announcement-list');
  if (list) {
    // Remove the "waiting" placeholder if it's there
    const placeholder = list.querySelector('p.muted');
    if (placeholder) placeholder.remove();

    // Add new announcement item at the top
    const item = document.createElement('div');
    item.className = 'announcement-item';
    item.innerHTML = `<strong>${data.from}:</strong> ${data.message}
      <div class="ann-time">${data.time}</div>`;
    list.prepend(item);
  }
});

// ─── For Teacher pages ────────────────────────────────────────────────────────
// Listen for echo of sent announcements (teacher sees their own messages in the sent list)
socket.on('announcement', (data) => {
  const sentList = document.getElementById('sent-announcements');
  if (!sentList) return;

  const placeholder = sentList.querySelector('p.muted');
  if (placeholder) placeholder.remove();

  const item = document.createElement('div');
  item.className = 'announcement-item';
  item.style.borderLeftColor = 'var(--success)';
  item.innerHTML = `${data.message} <div class="ann-time">${data.time}</div>`;
  sentList.prepend(item);
});
