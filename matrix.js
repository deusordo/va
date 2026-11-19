(() => {
  "use strict";

  const trail = document.querySelector(".matrix-trail");
  const enabled = matchMedia("(any-pointer: fine) and (any-hover: hover) and (prefers-reduced-motion: no-preference)");
  const grid = 19;
  const offsets = [[1, 0], [1, 1], [0, -1]];
  let lastCell = "";
  let lastTime = -Infinity;

  function clearTrail() {
    trail.replaceChildren();
    lastCell = "";
    lastTime = -Infinity;
  }

  window.addEventListener("pointermove", event => {
    if (!enabled.matches || event.pointerType !== "mouse" || event.target.closest(".contact-panel, button")) return;

    const column = Math.floor(event.clientX / grid);
    const row = Math.floor(event.clientY / grid);
    const cell = `${column},${row}`;
    if (lastCell === cell || event.timeStamp - lastTime < 45) return;

    lastCell = cell;
    lastTime = event.timeStamp;
    const digits = offsets.map(([x, y], index) => {
      const digit = document.createElement("span");
      digit.textContent = String(Math.floor(Math.random() * 10));
      digit.style.left = `${(column + x) * grid}px`;
      digit.style.top = `${(row + y) * grid}px`;
      digit.style.animationDelay = `${index * 25}ms`;
      return digit;
    });
    trail.append(...digits);
  }, { passive: true });

  trail.addEventListener("animationend", event => event.target.remove());
  enabled.addEventListener("change", clearTrail);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearTrail();
  });
})();
