export function initContactModal() {
  if (document.getElementById('contact-modal-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'contact-modal-overlay';
  overlay.className = 'contact-modal-overlay';
  overlay.innerHTML = `
    <div class="contact-modal" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
      <div class="contact-modal-header">
        <h2 id="contact-modal-title" class="contact-modal-title">Contact Us</h2>
        <button class="contact-modal-close" aria-label="Close contact form" type="button">&times;</button>
      </div>
      <form id="contact-form" novalidate>
        <div class="contact-form-group">
          <label class="contact-form-label" for="contact-name">Name</label>
          <input type="text" id="contact-name" class="contact-form-input" placeholder="Your Name" required minlength="2" maxlength="100" autocomplete="name" />
        </div>
        <div class="contact-form-group">
          <label class="contact-form-label" for="contact-email">Email Address</label>
          <input type="email" id="contact-email" class="contact-form-input" placeholder="you@example.com" required autocomplete="email" />
        </div>
        <div class="contact-form-group">
          <label class="contact-form-label" for="contact-type">Topic</label>
          <select id="contact-type" class="contact-form-select" required>
            <option value="General Inquiry">General Inquiry</option>
            <option value="Feedback">Feedback &amp; Suggestions</option>
            <option value="Bug Report">Bug Report</option>
            <option value="Business">Business Talk</option>
          </select>
        </div>
        <div class="contact-form-group">
          <label class="contact-form-label" for="contact-message">Message</label>
          <textarea id="contact-message" class="contact-form-textarea" placeholder="How can we help you?" required minlength="10" maxlength="5000"></textarea>
        </div>
        <button type="submit" id="contact-submit" class="btn-action w-full" style="width:100%" aria-label="Send message">
          <span>Send Message</span>
        </button>
      </form>
      <div id="contact-success" style="display:none;text-align:center;padding:20px 0;" role="status" aria-live="polite">
        <div style="font-size:3rem;margin-bottom:10px;" aria-hidden="true">&#9989;</div>
        <h3 style="color:var(--text);margin-bottom:5px;">Message Sent!</h3>
        <p style="color:var(--muted);font-size:0.9rem;">Thank you for reaching out. We'll get back to you soon.</p>
        <button class="btn-secondary contact-modal-close-success" style="margin-top:15px;padding:8px 16px;" type="button">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const form = document.getElementById('contact-form');
  const successView = document.getElementById('contact-success');
  const closeBtn = overlay.querySelector('.contact-modal-close');
  const closeSuccessBtn = overlay.querySelector('.contact-modal-close-success');

  function openModal(defaultTopic = 'General Inquiry') {
    const typeSelect = document.getElementById('contact-type');
    if (typeSelect) typeSelect.value = defaultTopic;
    form.style.display = 'block';
    successView.style.display = 'none';
    form.reset();
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      const nameInput = document.getElementById('contact-name');
      if (nameInput) nameInput.focus();
    }, 100);
    document.addEventListener('keydown', handleEscape);
  }

  function closeModal() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleEscape);
  }

  function handleEscape(e) {
    if (e.key === 'Escape') closeModal();
  }

  // Open triggers
  document.getElementById('footer-feedback-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    openModal('Feedback');
  });
  document.getElementById('footer-contact-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    openModal('General Inquiry');
  });

  // Close triggers
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  closeBtn?.addEventListener('click', closeModal);
  closeSuccessBtn?.addEventListener('click', closeModal);

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('contact-submit');
    const originalText = submitBtn.innerHTML;

    // Client-side validation
    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const message = document.getElementById('contact-message').value.trim();

    if (name.length < 2) { alert('Please enter your name (at least 2 characters).'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { alert('Please enter a valid email address.'); return; }
    if (message.length < 10) { alert('Please enter a message (at least 10 characters).'); return; }

    const payload = { name, email, type: document.getElementById('contact-type').value, message };

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="loading-spinner" style="width:20px;height:20px;border-width:2px;display:inline-block;vertical-align:middle;"></span> Sending...';

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Submission failed');
      form.style.display = 'none';
      successView.style.display = 'block';
    } catch (err) {
      console.error('Contact form error:', err);
      alert('Could not send message. Please check your connection and try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}
