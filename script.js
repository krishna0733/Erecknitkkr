/* =========================================================
   ElectroReck website - script.js
   NOTE: Data localStorage me save hota hai (sirf usi browser me).
   Admin ID/password neeche likha hai = sirf DEMO. Asli security
   ke liye Firebase/backend lagana padega.
   ========================================================= */
const ADMIN_ID = 'admin';
const ADMIN_PASS = 'ereck@2026';            // <- ise apne hisaab se badlo
const EVENT_START = new Date('2026-10-17T10:00:00+05:30'); // ElectroCraft start

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
async function hash(t) {
  if (window.crypto && crypto.subtle) {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
  }
  let h = 0; for (const ch of t) h = (h * 31 + ch.charCodeAt(0)) | 0; return 'x' + h; // fallback
}
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.id); toast.id = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ---------- mobile menu ---------- */
const menuBtn = $('#menuBtn'), navLinks = $('#navLinks');
menuBtn.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', open);
});
$$('#navLinks a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

/* ---------- event filter ---------- */
const filterBtns = $$('.filter-btn'), cards = $$('.card');
filterBtns.forEach(btn => btn.addEventListener('click', () => {
  filterBtns.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const f = btn.dataset.filter; let n = 0;
  cards.forEach(c => { const show = f === 'all' || c.dataset.category === f; c.classList.toggle('hide', !show); if (show) n++; });
  $('#emptyMsg').hidden = n !== 0;
}));

/* ---------- scroll reveal ---------- */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
$$('.reveal').forEach(el => io.observe(el));

/* ---------- countdown ---------- */
const cdEl = $('#countdown');
function tick() {
  const d = EVENT_START - new Date();
  if (d <= 0) { cdEl.innerHTML = '<span class="live">⚡ ElectroCraft is live now (17–20 Oct, E101)</span>'; return; }
  const p = (n, l) => `<div class="cd"><strong>${String(n).padStart(2, '0')}</strong><span>${l}</span></div>`;
  cdEl.innerHTML = '<div class="countdown-label">ELECTROCRAFT STARTS IN</div>' +
    p(Math.floor(d / 864e5), 'DAYS') + p(Math.floor(d % 864e5 / 36e5), 'HOURS') +
    p(Math.floor(d % 36e5 / 6e4), 'MIN') + p(Math.floor(d % 6e4 / 1e3), 'SEC');
}
tick(); setInterval(tick, 1000);

/* ---------- generic modals ---------- */
function openModal(id) { $('#' + id).classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeModals() { $$('.modal.open').forEach(m => m.classList.remove('open')); document.body.style.overflow = ''; }
$$('[data-open]').forEach(b => b.addEventListener('click', () => openModal(b.dataset.open)));
$$('[data-close]').forEach(b => b.addEventListener('click', closeModals));
$$('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) closeModals(); }));
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModals(); });

/* ---------- session ---------- */
const getSession = () => load('ereckSession', null);
function refreshLoginBtn() {
  const s = getSession();
  $('#loginBtn').textContent = s ? (s.role === 'admin' ? 'Admin Dashboard' : 'My Dashboard') : 'Login';
}
function logout() { localStorage.removeItem('ereckSession'); refreshLoginBtn(); closeModals(); toast('Logged out'); }
$('#loginBtn').addEventListener('click', () => {
  navLinks.classList.remove('open');
  getSession() ? openDashboard() : openModal('authModal');
});

/* ---------- registration (section form) ---------- */
const regForm = $('#regForm');
const fields = ['rEvent', 'rName', 'rRoll', 'rEmail', 'rPhone', 'rYear', 'rBranch'];
const rules = {
  rEvent: v => v ? '' : 'Select an event',
  rName: v => v.length >= 3 ? '' : 'Enter your full name',
  rRoll: v => /^[A-Za-z0-9]{5,15}$/.test(v) ? '' : 'Enter a valid roll number',
  rEmail: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Enter a valid email',
  rPhone: v => /^[6-9]\d{9}$/.test(v) ? '' : 'Enter a valid 10-digit mobile number',
  rYear: v => v ? '' : 'Select your year',
  rBranch: v => v.length >= 2 ? '' : 'Enter your branch'
};
function setErr(id, msg) { $(`[data-err="${id}"]`).textContent = msg; $('#' + id).classList.toggle('invalid', !!msg); return !msg; }

// Register buttons: event select me set karo + form tak smooth scroll
$$('.register-btn').forEach(btn => btn.addEventListener('click', () => {
  $('#rEvent').value = btn.dataset.event;
  setErr('rEvent', '');
  $('#regSuccess').hidden = true; regForm.hidden = false;
  prefillFromSession();
  $('#register').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => $('#rName').focus({ preventScroll: true }), 600);
}));
function prefillFromSession() {
  const s = getSession();
  if (s && s.role === 'student') { if (!$('#rName').value) $('#rName').value = s.name; if (!$('#rEmail').value) $('#rEmail').value = s.email; }
}
regForm.addEventListener('submit', e => {
  e.preventDefault();
  let ok = true;
  fields.forEach(id => { if (!setErr(id, rules[id]($('#' + id).value.trim()))) ok = false; });
  if (!ok) return;

  const rec = {
    id: 'ER-' + Date.now().toString(36).toUpperCase(),
    event: $('#rEvent').value, name: $('#rName').value.trim(), roll: $('#rRoll').value.trim(),
    email: $('#rEmail').value.trim().toLowerCase(), phone: $('#rPhone').value.trim(),
    year: $('#rYear').value, branch: $('#rBranch').value.trim(), time: new Date().toLocaleString()
  };
  const list = load('ereckRegistrations', []);
  if (list.some(r => r.email === rec.email && r.event === rec.event)) { setErr('rEmail', 'This email is already registered for this event'); return; }
  list.push(rec); save('ereckRegistrations', list);

  $('#regSuccessMsg').textContent = `Thanks ${rec.name}! You are registered for ${rec.event}. Your registration ID: ${rec.id}`;
  regForm.hidden = true; $('#regSuccess').hidden = false; regForm.reset();
});
$('#regAgain').addEventListener('click', () => { $('#regSuccess').hidden = true; regForm.hidden = false; });

/* ---------- login: tabs ---------- */
$$('.tab').forEach(t => t.addEventListener('click', () => {
  $$('.tab').forEach(x => x.classList.remove('active')); t.classList.add('active');
  $('#tab-student').hidden = t.dataset.tab !== 'student';
  $('#tab-admin').hidden = t.dataset.tab !== 'admin';
}));

/* ---------- student login / signup ---------- */
let signup = false;
$('#switchMode').addEventListener('click', () => {
  signup = !signup;
  $('#signupOnly').hidden = !signup;
  $('#studentSubmit').textContent = signup ? 'Create account' : 'Login';
  $('#switchText').textContent = signup ? 'Already have an account?' : 'New here?';
  $('#switchMode').textContent = signup ? 'Login' : 'Create a student account';
  $('#studentErr').textContent = '';
});
$('#studentForm').addEventListener('submit', async e => {
  e.preventDefault();
  const err = $('#studentErr'); err.textContent = '';
  const email = $('#sEmail').value.trim().toLowerCase(), pass = $('#sPass').value, name = $('#sName').value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = 'Enter a valid email'; return; }
  if (pass.length < 6) { err.textContent = 'Password must be at least 6 characters'; return; }
  const users = load('ereckUsers', []);
  const h = await hash(pass);

  if (signup) {
    if (name.length < 3) { err.textContent = 'Enter your full name'; return; }
    if (users.some(u => u.email === email)) { err.textContent = 'Account already exists. Please login.'; return; }
    users.push({ name, email, pass: h }); save('ereckUsers', users);
    save('ereckSession', { role: 'student', name, email });
  } else {
    const u = users.find(u => u.email === email && u.pass === h);
    if (!u) { err.textContent = 'Wrong email or password'; return; }
    save('ereckSession', { role: 'student', name: u.name, email });
  }
  $('#studentForm').reset(); refreshLoginBtn(); closeModals(); toast('Welcome!'); openDashboard();
});

/* ---------- admin login ---------- */
$('#adminForm').addEventListener('submit', e => {
  e.preventDefault();
  if ($('#aId').value.trim() === ADMIN_ID && $('#aPass').value === ADMIN_PASS) {
    save('ereckSession', { role: 'admin', name: 'Admin', email: '' });
    $('#adminForm').reset(); $('#adminErr').textContent = '';
    refreshLoginBtn(); closeModals(); openDashboard();
  } else { $('#adminErr').textContent = 'Invalid admin ID or password'; }
});

/* ---------- dashboards ---------- */
function regTable(rows, admin) {
  if (!rows.length) return '<p class="muted">No registrations yet.</p>';
  const head = ['ID', 'Event', 'Name', 'Roll', 'Email', 'Phone', 'Year', 'Branch', 'Time'];
  return `<div class="table-wrap"><table><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}${admin ? '<th></th>' : ''}</tr></thead><tbody>` +
    rows.map(r => `<tr><td>${esc(r.id)}</td><td>${esc(r.event)}</td><td>${esc(r.name)}</td><td>${esc(r.roll)}</td><td>${esc(r.email)}</td><td>${esc(r.phone)}</td><td>${esc(r.year)}</td><td>${esc(r.branch)}</td><td>${esc(r.time)}</td>` +
      (admin ? `<td><button class="btn-del" data-del="${esc(r.id)}">Delete</button></td>` : '') + '</tr>').join('') + '</tbody></table></div>';
}
function openDashboard() {
  const s = getSession(); if (!s) return openModal('authModal');
  const all = load('ereckRegistrations', []);
  const body = $('#dashBody');

  if (s.role === 'student') {
    $('#dashTitle').textContent = 'Student Portal';
    const mine = all.filter(r => r.email === s.email);
    body.innerHTML = `<p>Welcome, <b>${esc(s.name)}</b> <span class="muted">(${esc(s.email)})</span></p>
      <div class="stat-row"><div class="stat"><strong>${mine.length}</strong><span>My registrations</span></div></div>
      <h4>My registrations</h4>${regTable(mine, false)}
      <div class="dash-actions"><a class="btn btn-primary" href="#register" id="dashReg">Register for an event</a><button class="btn btn-ghost" id="dashOut">Logout</button></div>`;
    $('#dashReg').addEventListener('click', closeModals);
  } else {
    $('#dashTitle').textContent = 'Admin Portal';
    const events = [...new Set(all.map(r => r.event))];
    body.innerHTML = `<div class="stat-row"><div class="stat"><strong>${all.length}</strong><span>Total registrations</span></div>` +
      events.map(ev => `<div class="stat"><strong>${all.filter(r => r.event === ev).length}</strong><span>${esc(ev)}</span></div>`).join('') + '</div>' +
      regTable(all, true) +
      `<p class="muted" style="margin-top:10px">Demo: ye data sirf isi browser ka hai.</p>
       <div class="dash-actions"><button class="btn btn-primary" id="dashCsv">Download CSV</button><button class="btn btn-ghost" id="dashOut">Logout</button></div>`;
    $$('[data-del]', body).forEach(b => b.addEventListener('click', () => {
      if (!confirm('Delete this registration?')) return;
      save('ereckRegistrations', load('ereckRegistrations', []).filter(r => r.id !== b.dataset.del));
      openDashboard();
    }));
    $('#dashCsv').addEventListener('click', () => downloadCsv(all));
  }
  $('#dashOut').addEventListener('click', logout);
  openModal('dashModal');
}
function downloadCsv(rows) {
  const cols = ['id', 'event', 'name', 'roll', 'email', 'phone', 'year', 'branch', 'time'];
  const cell = v => { v = String(v ?? ''); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; }; // CSV injection safe
  const csv = [cols.join(',')].concat(rows.map(r => cols.map(c => cell(r[c])).join(','))).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = 'electroreck-registrations.csv'; a.click(); URL.revokeObjectURL(a.href);
}
refreshLoginBtn();

/* =========================================================
   Animated circuit background (canvas)
   ========================================================= */
(function () {
  const c = $('#circuit'), ctx = c.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const G = 48; let W, H, paths, pulses;

  function build() {
    W = c.width = innerWidth; H = c.height = innerHeight;
    const n = Math.min(34, Math.floor(W * H / 38000) + 8);
    const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]];
    paths = [];
    for (let i = 0; i < n; i++) {
      let x = Math.round(Math.random() * W / G) * G, y = Math.round(Math.random() * H / G) * G;
      let d = Math.floor(Math.random() * 4);
      const pts = [[x, y]];
      for (let s = 0, segs = 3 + Math.floor(Math.random() * 4); s < segs; s++) {
        const len = (1 + Math.floor(Math.random() * 4)) * G;
        x += dirs[d][0] * len; y += dirs[d][1] * len; pts.push([x, y]);
        d = (d + (Math.random() < .5 ? 1 : 3)) % 4;           // 90 degree turn
      }
      let total = 0; const cum = [0];
      for (let k = 1; k < pts.length; k++) { total += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); cum.push(total); }
      paths.push({ pts, cum, total });
    }
    pulses = paths.map(p => ({ p, pos: Math.random() * p.total, v: 60 + Math.random() * 90 }));
  }
  function at(p, d) {
    let k = 1; while (k < p.cum.length - 1 && p.cum[k] < d) k++;
    const f = (d - p.cum[k - 1]) / (p.cum[k] - p.cum[k - 1] || 1);
    return [p.pts[k - 1][0] + (p.pts[k][0] - p.pts[k - 1][0]) * f, p.pts[k - 1][1] + (p.pts[k][1] - p.pts[k - 1][1]) * f];
  }
  function draw(dt) {
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 2; ctx.lineJoin = 'round';
    paths.forEach(p => {
      ctx.strokeStyle = 'rgba(245,197,24,.10)'; ctx.beginPath();
      p.pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke();
      [p.pts[0], p.pts[p.pts.length - 1]].forEach(q => {          // via / solder pads
        ctx.beginPath(); ctx.arc(q[0], q[1], 5, 0, 7); ctx.strokeStyle = 'rgba(245,197,24,.28)'; ctx.stroke();
        ctx.beginPath(); ctx.arc(q[0], q[1], 1.8, 0, 7); ctx.fillStyle = 'rgba(245,197,24,.5)'; ctx.fill();
      });
    });
    pulses.forEach(u => {
      u.pos = (u.pos + u.v * dt) % u.p.total;
      const [x, y] = at(u.p, u.pos), [tx, ty] = at(u.p, Math.max(0, u.pos - 40));
      const g = ctx.createLinearGradient(tx, ty, x, y);
      g.addColorStop(0, 'rgba(0,229,255,0)'); g.addColorStop(1, 'rgba(0,229,255,.9)');
      ctx.strokeStyle = g; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(x, y); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fillStyle = '#7df3ff'; ctx.shadowColor = '#00e5ff'; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0;
    });
  }
  let last = performance.now();
  function loop(t) { const dt = Math.min(.05, (t - last) / 1000); last = t; draw(dt); requestAnimationFrame(loop); }
  build();
  if (reduce) draw(0); else requestAnimationFrame(loop);
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { build(); if (reduce) draw(0); }, 200); });
})();
