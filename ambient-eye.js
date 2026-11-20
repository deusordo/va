(() => {
  "use strict";

  const canvas = document.querySelector(".ambient-eye");
  const context = canvas.getContext("2d");
  if (!context) return;

  const portrait = document.querySelector(".portrait-wrap");
  const heading = document.querySelector("#page-title");
  const about = document.querySelector(".about-me");
  const panel = document.querySelector("#contact-panel");
  const motion = matchMedia("(prefers-reduced-motion: no-preference) and (any-pointer: fine) and (any-hover: hover)");
  const width = 64;
  const height = 38;
  const gap = 18;
  let pointer;
  let timer;
  let frame;

  const random = (min, max) => min + (max - min) * Math.random();
  const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

  function stop() {
    clearTimeout(timer);
    cancelAnimationFrame(frame);
    timer = frame = undefined;
    pointer = undefined;
    canvas.style.opacity = "0";
  }

  function queue(delay) {
    if (timer === undefined && frame === undefined) timer = setTimeout(appear, delay);
  }

  function openSpace() {
    const image = portrait.getBoundingClientRect();
    const left = gap;
    const right = Math.min(innerWidth, image.left) - width - gap;
    if (left >= right) return [];

    return [
      { left, right, top: gap, bottom: heading.getBoundingClientRect().top - height - gap },
      { left, right, top: about.getBoundingClientRect().bottom + gap, bottom: innerHeight - height - gap }
    ].filter(area => area.top <= area.bottom);
  }

  function drawEye(openness, lookX, lookY) {
    context.clearRect(0, 0, width, height);
    context.save();
    context.translate(width / 2, height / 2);
    context.scale(1, openness);
    context.beginPath();
    context.moveTo(-29, 0);
    context.bezierCurveTo(-13, -20, 13, -20, 29, 0);
    context.bezierCurveTo(13, 20, -13, 20, -29, 0);
    context.closePath();
    context.stroke();
    context.beginPath();
    context.arc(lookX, lookY, 7, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  }

  function appear() {
    timer = undefined;
    const areas = openSpace();
    if (!pointer || !areas.length) return;
    const area = areas[Math.floor(random(0, areas.length))];
    let x = random(area.left, area.right);
    let y = random(area.top, area.bottom);
    const offsetX = random(-80, 80);
    const offsetY = random(-50, 50);
    const duration = random(2900, 4200);
    const start = performance.now();
    let previous = start;
    const scale = Math.min(devicePixelRatio, 2);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
    context.strokeStyle = "#eeeef4";
    context.lineWidth = 1.8;
    context.lineJoin = "round";

    function drift(now) {
      const elapsed = now - start;
      if (elapsed >= duration) {
        canvas.style.opacity = "0";
        frame = undefined;
        queue(random(4900, 10300));
        return;
      }

      const ease = 1 - Math.exp(-(now - previous) / 310);
      previous = now;
      const aimX = clamp(pointer.x - width / 2 + offsetX, area.left, area.right);
      const aimY = clamp(pointer.y - height / 2 + offsetY, area.top, area.bottom);
      x += (aimX - x) * ease;
      y += (aimY - y) * ease;
      canvas.style.transform = `translate(${x}px, ${y}px)`;
      canvas.style.opacity = String(.48 * Math.min(elapsed / 430, (duration - elapsed) / 700, 1));
      const lookX = 6 * Math.tanh((pointer.x - x - width / 2) / 150);
      const lookY = 3 * Math.tanh((pointer.y - y - height / 2) / 150);
      drawEye(Math.max(.05, Math.min(elapsed / 380, 1)), lookX, lookY);
      frame = requestAnimationFrame(drift);
    }

    frame = requestAnimationFrame(drift);
  }

  window.addEventListener("pointermove", event => {
    if (!motion.matches || event.pointerType !== "mouse" || document.hidden || !panel.hidden) return;
    pointer = { x: event.clientX, y: event.clientY };
    if (timer === undefined && frame === undefined) queue(random(1400, 2900));
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", stop);
  window.addEventListener("blur", stop);
  window.addEventListener("resize", stop);
  window.addEventListener("scroll", stop, { passive: true });
  document.addEventListener("visibilitychange", stop);
  motion.addEventListener("change", stop);
  about.addEventListener("toggle", stop);
  new MutationObserver(() => { if (!panel.hidden) stop(); }).observe(panel, {
    attributes: true,
    attributeFilter: ["hidden"]
  });
})();
