import { toolCategories } from '../core/toolsConfig.js';

export function renderHomePage(container, toolsList) {
  try {
    const categoriesHtml = toolCategories.map(
      (c) => `<button class="category-tab${c.id === 'all' ? ' active' : ''}" data-cat="${c.id}" type="button" role="tab" aria-selected="${c.id === 'all' ? 'true' : 'false'}">${c.label}</button>`
    ).join('');

    const toolsHtml = toolsList.map((t, i) => `
      <a href="/${t.id}-pdf" class="tool-card" data-cat="${t.cat}" data-title="${t.title.toLowerCase()}" data-desc="${t.desc.toLowerCase()}"
         aria-label="${t.title}: ${t.desc}" role="listitem" style="animation-delay: ${i * 0.05}s;">
        <div class="tool-icon-wrapper" aria-hidden="true">${t.icon}</div>
        <div class="tool-info">
          <div class="tool-title-row">
            <h3>${t.title}</h3>
            <span class="category-badge" aria-label="Category ${t.cat}">${t.cat}</span>
          </div>
          <p>${t.desc}</p>
        </div>
      </a>
    `).join('');

    container.innerHTML = `
      <header class="hero" role="banner">
        <div class="hero-badge" aria-hidden="true">&#10024; 100% Free &amp; Secure</div>
        <h1>The Ultimate <span class="text-gradient">PDF Tools</span> Collection</h1>
        <p>Merge, split, compress, and edit PDFs directly in your browser. <strong>No server uploads. No registration.</strong></p>
        <div class="trust-indicators">
          <span>&#128274; Local Processing</span>
          <span>&#9889; Lightning Fast</span>
          <span>&#127793; Privacy First</span>
        </div>
      </header>

      <section class="tools-section" id="tools-section" aria-labelledby="tools-heading">
        <div class="section-header">
          <h2 class="section-title" id="tools-heading">Popular Tools</h2>
          <div class="search-container">
            <input type="text" id="tool-search" placeholder="Search tools (e.g. merge, split)..." aria-label="Search tools" autocomplete="off" />
            <span class="search-icon" aria-hidden="true">&#128269;</span>
          </div>
        </div>
        <div class="category-tabs" role="tablist" aria-label="Tool categories">
          ${categoriesHtml}
        </div>
        <div class="tools-grid" id="tools-grid" role="list">
          ${toolsHtml}
        </div>
      </section>

      <section class="how-it-works" aria-labelledby="how-heading">
        <h2 class="section-title" id="how-heading" style="text-align: center;">How PDFMinty Works</h2>
        <p style="color: var(--muted); margin-bottom: 3rem; text-align: center;">Three simple steps to manage your documents</p>
        <div class="steps-grid">
          <div class="step-card">
            <div class="step-number" aria-hidden="true">1</div>
            <h3>Select Files</h3>
            <p style="color: var(--muted);">Choose your PDF files. Files are stored temporarily in your browser only.</p>
          </div>
          <div class="step-card">
            <div class="step-number" aria-hidden="true">2</div>
            <h3>Process Locally</h3>
            <p style="color: var(--muted);">Our browser engine handles everything. Files are never sent to any server.</p>
          </div>
          <div class="step-card">
            <div class="step-number" aria-hidden="true">3</div>
            <h3>Download &amp; Clean</h3>
            <p style="color: var(--muted);">Get your processed PDF instantly. Temporary data auto-clears after one hour.</p>
          </div>
        </div>
      </section>

      <section class="features-section" aria-labelledby="features-heading">
        <div class="features-header">
          <h2 id="features-heading">Why Choose PDFMinty?</h2>
          <p>Professional grade tools without the premium price tag.</p>
        </div>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon" aria-hidden="true">&#128274;&#128274;</div>
            <h3>100% Private</h3>
            <p>Your files never leave your device. All processing happens locally.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon" aria-hidden="true">&#9889;</div>
            <h3>Lightning Fast</h3>
            <p>No uploads or downloads to wait for. Get results instantly.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon" aria-hidden="true">&#127775;</div>
            <h3>Completely Free</h3>
            <p>No hidden fees, no subscriptions, no watermarks.</p>
          </div>
        </div>
      </section>

      <section class="faq-section" aria-labelledby="faq-heading">
        <h2 class="section-title" id="faq-heading" style="text-align: center;">Frequently Asked Questions</h2>
        <div class="faq-item">
          <button class="faq-question" type="button" aria-expanded="false">
            Are my files safe? <span class="faq-icon" aria-hidden="true">&#9662;</span>
          </button>
          <div class="faq-answer" hidden>
            <p>All processing is done locally in your browser. Your files are never uploaded to any server.</p>
          </div>
        </div>
        <div class="faq-item">
          <button class="faq-question" type="button" aria-expanded="false">
            Is it really free? <span class="faq-icon" aria-hidden="true">&#9662;</span>
          </button>
          <div class="faq-answer" hidden>
            <p>Absolutely. No hidden costs, no subscriptions, no limits.</p>
          </div>
        </div>
        <div class="faq-item">
          <button class="faq-question" type="button" aria-expanded="false">
            Do I need to install anything? <span class="faq-icon" aria-hidden="true">&#9662;</span>
          </button>
          <div class="faq-answer" hidden>
            <p>No. PDFMinty works directly in any modern browser on computer, tablet, or smartphone.</p>
          </div>
        </div>
        <div class="faq-item">
          <button class="faq-question" type="button" aria-expanded="false">
            Does it work offline? <span class="faq-icon" aria-hidden="true">&#9662;</span>
          </button>
          <div class="faq-answer" hidden>
            <p>Once loaded, most tools work offline. Install as a PWA for the best offline experience.</p>
          </div>
        </div>
      </section>

      <section class="bottom-cta" aria-label="Call to action">
        <h2>Ready to Mint Your PDF?</h2>
        <p>Experience the fastest and most secure PDF tools today.</p>
        <button id="cta-get-started" class="btn-cta-white" type="button" aria-label="Get started with PDF tools">Get Started Now</button>
      </section>
    `;

    // CTA scroll
    const ctaBtn = document.getElementById('cta-get-started');
    if (ctaBtn) {
      ctaBtn.addEventListener('click', () => {
        const ts = document.getElementById('tools-section');
        if (ts) ts.scrollIntoView({ behavior: 'smooth' });
      });
    }

    // Search functionality
    const searchInput = document.getElementById('tool-search');
    const toolsGrid = document.getElementById('tools-grid');
    if (searchInput && toolsGrid) {
      const cards = toolsGrid.querySelectorAll('.tool-card');
      const filterTools = () => {
        const query = searchInput.value.toLowerCase();
        const activeTab = document.querySelector('.category-tab.active');
        const activeCat = activeTab ? activeTab.getAttribute('data-cat') : 'all';
        cards.forEach((card) => {
          const title = card.getAttribute('data-title') || '';
          const desc = card.getAttribute('data-desc') || '';
          const cat = card.getAttribute('data-cat') || '';
          const matches = (title.includes(query) || desc.includes(query)) &&
            (activeCat === 'all' || cat === activeCat);
          card.style.display = matches ? 'flex' : 'none';
        });
      };
      searchInput.addEventListener('input', filterTools);
    }

    // Category tabs
    const tabs = document.querySelectorAll('.category-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        if (searchInput) searchInput.dispatchEvent(new Event('input'));
      });
    });

    // FAQ accordion
    document.querySelectorAll('.faq-question').forEach((q) => {
      q.addEventListener('click', () => {
        const item = q.closest('.faq-item');
        const answer = item?.querySelector('.faq-answer');
        const isOpen = q.getAttribute('aria-expanded') === 'true';
        // Close all
        document.querySelectorAll('.faq-question').forEach((qq) => {
          qq.setAttribute('aria-expanded', 'false');
          const aa = qq.closest('.faq-item')?.querySelector('.faq-answer');
          if (aa) aa.hidden = true;
        });
        // Open clicked if was closed
        if (!isOpen) {
          q.setAttribute('aria-expanded', 'true');
          if (answer) answer.hidden = false;
        }
      });
    });
  } catch (err) {
    console.error('HomePage render error:', err);
    container.innerHTML = '<div role="alert" style="padding:2rem;text-align:center;color:var(--danger)"><h2>Failed to load page</h2><p>Please refresh and try again.</p></div>';
  }
}
