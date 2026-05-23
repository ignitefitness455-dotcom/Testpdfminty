export function initThemeAndScroll() {
  // Back to Top
  const btt = document.getElementById('back-to-top');
  if (btt) {
    window.addEventListener('scroll', () => {
      btt.classList.toggle('visible', window.scrollY > 300);
    }, { passive: true });
    btt.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Privacy banner hide on scroll
  window.addEventListener('scroll', () => {
    const banner = document.querySelector('.privacy-banner');
    if (banner) {
      banner.classList.toggle('hidden-banner', window.scrollY > 20);
    }
  }, { passive: true });

  // Theme Toggle
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    let currentTheme = localStorage.getItem('theme') || 'light';
    themeToggle.innerHTML = currentTheme === 'dark' ? '&#127769;' : '&#9728;&#65039;';

    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      const theme = isDark ? 'dark' : 'light';
      localStorage.setItem('theme', theme);
      themeToggle.innerHTML = isDark ? '&#127769;' : '&#9728;&#65039;';

      // Fixed CRITICAL-8: Debounced confetti (once per session max)
      if (typeof window.confettiDebounced === 'function') {
        window.confettiDebounced({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.8 },
          colors: isDark ? ['#6366f1', '#0ea5e9'] : ['#6366f1', '#f59e0b'],
        });
      }
    });
  }
}
