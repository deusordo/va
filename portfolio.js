const portfolioPills = document.querySelector('.portfolio-pills');

if (portfolioPills) {
  const buttons = Array.from(portfolioPills.querySelectorAll('button[aria-controls]'));
  const panels = buttons.map(button => document.getElementById(button.getAttribute('aria-controls')));

  if (panels.length && panels.every(Boolean)) {
    let activeButton = null;

    function selectPanel(button) {
      activeButton = button;
      buttons.forEach((pill, index) => {
        const expanded = pill === activeButton;
        pill.setAttribute('aria-expanded', String(expanded));
        panels[index].hidden = !expanded;
      });
    }

    selectPanel(null);
    portfolioPills.hidden = false;

    buttons.forEach(button => {
      button.addEventListener('click', () => {
        selectPanel(button === activeButton ? null : button);
      });
    });
  }
}
