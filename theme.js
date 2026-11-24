(() => {
  const root = document.documentElement;
  const preference = matchMedia('(prefers-color-scheme: dark)');
  const key = 'nuterra-color-theme';
  let choice;
  try { choice = localStorage.getItem(key); } catch { /* Storage can be disabled. */ }
  const current = () => ['light', 'dark'].includes(choice) ? choice : preference.matches ? 'dark' : 'light';
  root.dataset.theme = current();

  document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('[data-theme-toggle]');
    if (!button) return;
    const label = button.querySelector('[data-theme-label]');
    const meta = document.querySelector('meta[name="theme-color"]');
    function update() {
      const mode = current();
      root.dataset.theme = mode;
      label.textContent = mode === 'dark' ? 'Light mode' : 'Dark mode';
      if (meta) meta.content = getComputedStyle(root).backgroundColor;
    }
    button.addEventListener('click', () => {
      choice = current() === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(key, choice); } catch { /* Apply for this page. */ }
      update();
    });
    preference.addEventListener('change', update);
    addEventListener('storage', event => {
      if (event.key !== key && event.key !== null) return;
      choice = event.newValue;
      update();
    });
    update();
    button.hidden = false;
  });
})();
