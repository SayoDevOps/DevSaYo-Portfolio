/*  1. HAMBURGER MENU */

const ham = document.getElementById('hamburger');
const mob = document.getElementById('mobileMenu');

ham.addEventListener('click', () => {
  ham.classList.toggle('open');
  mob.classList.toggle('open');
  document.body.style.overflow = mob.classList.contains('open') ? 'hidden' : '';
});

mob.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    ham.classList.remove('open');
    mob.classList.remove('open');
    document.body.style.overflow = '';
  });
});


/* 2. KEYBOARD ACCESSIBILITY — PROJECT ROWS */

document.querySelectorAll('.proj-row').forEach(row => {
  row.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') row.click();
  });
});


/* 3. ACTIVE NAV LINK ON SCROLL */

const sections = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.nav-center a');

window.addEventListener('scroll', () => {
  let current = '';

  sections.forEach(section => {
    if (window.scrollY >= section.offsetTop - 220) {
      current = section.id;
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === '#' + current) {
      link.classList.add('active');
    }
  });
}, { passive: true });


/* 4. SCROLL REVEAL */

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.07 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));


/* 5. RATE LIMITING  (max 3 sends / hour) */

function canSend() {
  try {
    const KEY  = 'ds_form_times';
    const now  = Date.now();
    const hour = 3_600_000;

    const times = JSON.parse(localStorage.getItem(KEY) || '[]')
      .filter(t => now - t < hour);

    if (times.length >= 3) return false;

    times.push(now);
    localStorage.setItem(KEY, JSON.stringify(times));
    return true;
  } catch {
    // If localStorage is blocked, allow submission
    return true;
  }
}


/* 6. INPUT SANITIZER */

const esc = str => str.replace(/[<>"'&]/g, char => ({
  '<':  '&lt;',
  '>':  '&gt;',
  '"':  '&quot;',
  "'":  '&#39;',
  '&':  '&amp;',
}[char]));


/* 7. FORM STATUS HELPER */

function showStatus(type, message) {
  const el = document.getElementById('fStatus');
  el.className   = 'f-status ' + type;
  el.style.display = 'flex';
  el.textContent = message;
}


/* 8. CONTACT FORM SUBMIT */

document.getElementById('cForm').addEventListener('submit', async e => {
  e.preventDefault();

  // Check
  if (document.getElementById('hp_n').value.trim() !== '') return;

  // Rate limit check
  if (!canSend()) {
    showStatus('err', '⚠ Too many submissions. Please try again later.');
    return;
  }

  // Collect and validate fields
  const name    = esc(document.getElementById('c_name').value.trim());
  const email   = document.getElementById('c_email').value.trim();
  const company = esc(document.getElementById('c_company').value.trim());
  const message = esc(document.getElementById('c_msg').value.trim());

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!name || name.length < 2) {
    showStatus('err', '✕ Please enter your name.');
    return;
  }

  if (!emailRegex.test(email)) {
    showStatus('err', '✕ Please enter a valid email address.');
    return;
  }

  if (!message || message.length < 10) {
    showStatus('err', '✕ Please describe your project (min 10 characters).');
    return;
  }

  // Show loading state
  const btn = document.getElementById('sendBtn');
  btn.classList.add('loading');
  btn.disabled = true;

  try {
    const response = await fetch('https://formspree.io/f/xvzvjrra', {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept':       'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        company,
        message,
        _replyto: email,
      }),
    });

    if (response.ok) {
      showStatus('ok', "✓ Message sent! I'll reply within 24 hours.");
      document.getElementById('cForm').reset();
    } else {
      throw new Error('Server error');
    }

  } catch {
    // Fallback — open mailto if Formspree fails
    const subject = encodeURIComponent('Project inquiry from ' + name);
    const body    = encodeURIComponent(
      'Name: '    + name    + '\n' +
      'Email: '   + email   + '\n' +
      'Message: ' + message
    );

    window.location.href = `mailto:folahantestimony572@gmail.com?subject=${subject}&body=${body}`;
    showStatus('ok', '✓ Opening your email client...');

  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
});
