(() => {
  "use strict";

  const portrait = document.querySelector(".portrait-wrap img");
  const enabled = matchMedia("(any-pointer: fine) and (any-hover: hover) and (prefers-reduced-motion: no-preference)");
  const sourceSize = 1254;
  const patchWidth = 88;
  const patchHeight = 40;
  // Pupil centers and eye openings measured in pixels in portrait.jpg.
  const eyeCenters = [[532, 426], [714, 427]];
  let eyes;
  let pointer;
  let frame = 0;
  let lastTime = 0;
  let gazeX = 0;
  let gazeY = 0;

  function makeEye(centerX, centerY) {
    const left = centerX - patchWidth / 2;
    const top = centerY - patchHeight / 2;
    const canvas = document.createElement("canvas");
    canvas.className = "portrait-eye";
    canvas.setAttribute("aria-hidden", "true");
    canvas.hidden = true;
    canvas.width = patchWidth;
    canvas.height = patchHeight;
    Object.assign(canvas.style, {
      position: "absolute",
      left: `${100 * left / sourceSize}%`,
      top: `${100 * top / sourceSize}%`,
      width: `${100 * patchWidth / sourceSize}%`,
      height: `${100 * patchHeight / sourceSize}%`
    });

    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(portrait, left, top, patchWidth, patchHeight, 0, 0, patchWidth, patchHeight);
    const original = context.getImageData(0, 0, patchWidth, patchHeight).data;
    const output = context.createImageData(patchWidth, patchHeight);
    const weights = new Float32Array(patchWidth * patchHeight);

    for (let y = 0; y < patchHeight; y++) {
      for (let x = 0; x < patchWidth; x++) {
        const distance = ((x - patchWidth / 2) / 37) ** 2 + ((y - patchHeight / 2) / 15) ** 2;
        const edge = Math.min(1, Math.max(0, (1 - distance) / 0.6));
        const weight = edge * edge * (3 - 2 * edge);
        const pixel = y * patchWidth + x;
        weights[pixel] = weight;
        output.data[pixel * 4 + 3] = Math.min(255, weight * 950);
      }
    }

    return { canvas, context, original, output, weights };
  }

  function paintEye({ canvas, context, original, output, weights }) {
    for (let y = 0; y < patchHeight; y++) {
      for (let x = 0; x < patchWidth; x++) {
        const pixel = y * patchWidth + x;
        const weight = weights[pixel];
        if (!weight) continue;

        // Move the pupils and blend back to the source pixels at the eyelid.
        const sampleX = x - gazeX * weight;
        const sampleY = y - gazeY * weight;
        const left = Math.floor(sampleX);
        const top = Math.floor(sampleY);
        const horizontal = sampleX - left;
        const vertical = sampleY - top;
        const upper = (top * patchWidth + left) * 4;
        const lower = upper + patchWidth * 4;
        for (let channel = 0; channel < 3; channel++) {
          const upperColor = original[upper + channel] * (1 - horizontal) + original[upper + channel + 4] * horizontal;
          const lowerColor = original[lower + channel] * (1 - horizontal) + original[lower + channel + 4] * horizontal;
          output.data[pixel * 4 + channel] = upperColor * (1 - vertical) + lowerColor * vertical;
        }
      }
    }
    context.putImageData(output, 0, 0);
    canvas.hidden = false;
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(animate);
  }

  function animate(now) {
    frame = 0;
    const elapsed = lastTime ? Math.min(50, now - lastTime) : 16;
    lastTime = now;
    const bounds = portrait.getBoundingClientRect();
    let targetX = 0;
    let targetY = 0;

    if (pointer && bounds.width && bounds.bottom > 0 && bounds.top < innerHeight) {
      const [leftEye, rightEye] = eyeCenters;
      const centerX = bounds.left + (leftEye[0] + rightEye[0]) / 2 / sourceSize * bounds.width;
      const centerY = bounds.top + (leftEye[1] + rightEye[1]) / 2 / sourceSize * bounds.height;
      const range = bounds.width * 0.23;
      targetX = 8 * Math.tanh((pointer.x - centerX) / range);
      targetY = 3.5 * Math.tanh((pointer.y - centerY) / range);
    }

    const remaining = Math.hypot(targetX - gazeX, targetY - gazeY);
    const ease = remaining < 0.06 ? 1 : 1 - Math.exp(-elapsed / 84);
    gazeX += (targetX - gazeX) * ease;
    gazeY += (targetY - gazeY) * ease;
    for (const eye of eyes) {
      if (Math.hypot(gazeX, gazeY) < 0.06) eye.canvas.hidden = true;
      else paintEye(eye);
    }

    if (ease < 1) schedule();
    else lastTime = 0;
  }

  function centerEyes() {
    if (!pointer) return;
    pointer = null;
    schedule();
  }

  function reset() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    pointer = null;
    gazeX = 0;
    gazeY = 0;
    for (const eye of eyes ?? []) eye.canvas.hidden = true;
  }

  window.addEventListener("pointermove", event => {
    if (!enabled.matches || event.pointerType !== "mouse" ||
        portrait.naturalWidth !== sourceSize || portrait.naturalHeight !== sourceSize) return;

    if (!eyes) {
      const prepared = eyeCenters.map(center => makeEye(...center));
      if (prepared.some(eye => !eye)) return;
      eyes = prepared;
      portrait.after(...eyes.map(eye => eye.canvas));
    }
    pointer = { x: event.clientX, y: event.clientY };
    schedule();
  }, { passive: true });

  function updatePosition() {
    if (pointer) schedule();
  }

  window.addEventListener("scroll", updatePosition, { passive: true });
  window.addEventListener("resize", updatePosition, { passive: true });
  document.documentElement.addEventListener("pointerleave", centerEyes);
  window.addEventListener("blur", centerEyes);
  enabled.addEventListener("change", reset);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) reset();
  });
})();
