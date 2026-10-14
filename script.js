// ---------- Mobile menu ----------
const menuBtn = document.getElementById('menuBtn');
const navLinks = document.getElementById('navLinks');

menuBtn.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', open);
});
navLinks.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => navLinks.classList.remove('open'))
);

// ---------- Event filter ----------
const filterBtns = document.querySelectorAll('.filter-btn');
const cards = document.querySelectorAll('.card');
const emptyMsg = document.getElementById('emptyMsg');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.filter;
    let visible = 0;
    cards.forEach(card => {
      const show = filter === 'all' || card.dataset.category === filter;
      card.classList.toggle('hide', !show);
      if (show) visible++;
    });
    emptyMsg.hidden = visible !== 0;
  });
});

// ---------- Modal ----------
const modal = document.getElementById('modal');
const form = document.getElementById('regForm');
const success = document.getElementById('success');
const eventInput = document.getElementById('eventName');
const modalTitle = document.getElementById('modalTitle');

function openModal(eventName) {
  clearErrors();                             // pehle form reset
  eventInput.value = eventName;              // phir auto-fill (dynamic part)
  modalTitle.textContent = 'Register: ' + eventName;
  form.hidden = false;
  success.hidden = true;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  document.getElementById('fullName').focus();
}

function closeModal() {
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

document.querySelectorAll('.register-btn').forEach(btn =>
  btn.addEventListener('click', () => openModal(btn.dataset.event))
);
document.getElementById('closeBtn').addEventListener('click', closeModal);
document.getElementById('doneBtn').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); }); // bahar click
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ---------- Validation ----------
function setError(id, errId, msg) {
  document.getElementById(errId).textContent = msg;
  document.getElementById(id).classList.toggle('invalid', !!msg);
  return !msg;
}
function clearErrors() {
  form.reset();
  ['fullName', 'email', 'phone', 'year'].forEach(id =>
    document.getElementById(id).classList.remove('invalid'));
  document.querySelectorAll('.error').forEach(e => (e.textContent = ''));
}

function validate() {
  const name = document.getElementById('fullName').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const year = document.getElementById('year').value;

  const r1 = setError('fullName', 'nameErr', name.length < 3 ? 'Name kam se kam 3 letters ka ho' : '');
  const r2 = setError('email', 'emailErr', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Valid email daalo');
  const r3 = setError('phone', 'phoneErr', /^[6-9]\d{9}$/.test(phone) ? '' : '10-digit valid mobile number daalo');
  const r4 = setError('year', 'yearErr', year ? '' : 'Year select karo');
  return r1 && r2 && r3 && r4;
}

// ---------- Submit + localStorage ----------
form.addEventListener('submit', e => {
  e.preventDefault();
  if (!validate()) return;

  const data = {
    event: eventInput.value,
    name: document.getElementById('fullName').value.trim(),
    email: document.getElementById('email').value.trim().toLowerCase(),
    phone: document.getElementById('phone').value.trim(),
    year: document.getElementById('year').value,
    time: new Date().toLocaleString()
  };

  let list = [];
  try { list = JSON.parse(localStorage.getItem('ereckRegistrations')) || []; } catch (err) {}

  // same email se same event dobara register na ho
  if (list.some(r => r.email === data.email && r.event === data.event)) {
    setError('email', 'emailErr', 'Is email se is event me pehle se registration hai');
    return;
  }

  list.push(data);
  localStorage.setItem('ereckRegistrations', JSON.stringify(list));

  document.getElementById('successMsg').textContent =
    `Thanks ${data.name}! You are registered for ${data.event}.`;
  form.hidden = true;
  success.hidden = false;
});