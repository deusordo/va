const portfolioPills = document.querySelector('.portfolio-pills');

if (portfolioPills) {
  const buttons = Array.from(portfolioPills.querySelectorAll('button[aria-controls]'));
  const panels = buttons.map(button => document.getElementById(button.getAttribute('aria-controls')));

  if (panels.length && panels.every(Boolean)) {
    const [connectionsButton] = buttons;
    const [connectionsPanel] = panels;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const visitKey = 'va-connections-introduced';
    let activeButton = null;
    let introCancelled = false;
    let introObserver;
    let collapseTimer;

    function selectPanel(button) {
      activeButton = button;
      buttons.forEach((pill, index) => {
        const expanded = pill === activeButton;
        pill.setAttribute('aria-expanded', String(expanded));
        panels[index].hidden = !expanded;
      });
    }

    function cancelIntro() {
      introCancelled = true;
      introObserver?.disconnect();
      window.clearTimeout(collapseTimer);
    }

    function showIntro() {
      introObserver?.disconnect();
      if (introCancelled || reducedMotion.matches) return;

      try {
        if (sessionStorage.getItem(visitKey)) return;
        sessionStorage.setItem(visitKey, '1');
      } catch {
        // The introduction still runs once on this page if storage is unavailable.
      }

      selectPanel(connectionsButton);
      collapseTimer = window.setTimeout(() => selectPanel(null), 4000);
    }

    selectPanel(null);
    portfolioPills.hidden = false;

    buttons.forEach(button => {
      button.addEventListener('click', () => {
        cancelIntro();
        selectPanel(button === activeButton ? null : button);
      });
    });
    portfolioPills.addEventListener('focusin', cancelIntro);
    connectionsPanel.addEventListener('focusin', cancelIntro);
    connectionsPanel.addEventListener('pointerenter', cancelIntro);
    connectionsPanel.addEventListener('pointerdown', cancelIntro);
    reducedMotion.addEventListener('change', cancelIntro);

    if (!reducedMotion.matches && 'IntersectionObserver' in window) {
      introObserver = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.intersectionRatio >= .6)) showIntro();
      }, { threshold: .6 });
      introObserver.observe(portfolioPills);
    } else {
      showIntro();
    }
  }
}
