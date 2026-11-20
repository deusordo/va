(() => {
  "use strict";

  const tagline = document.querySelector(".tagline");
  const animated = tagline.querySelector(".tagline-animated");
  const wordSlot = animated.querySelector(".tagline-word");
  const motion = matchMedia("(prefers-reduced-motion: no-preference)");
  const words = ["connect.", "explore.", "solve.", "build."];
  const hold = 2700;
  let index = 0;
  let letters = words[0].length;
  let deleting = true;
  let delay = hold;
  let timer;

  function schedule() {
    clearTimeout(timer);
    if (motion.matches && !document.hidden) timer = setTimeout(advance, delay);
  }

  function updateVisibility() {
    tagline.classList.toggle("tagline-is-paused", document.hidden);
    schedule();
  }

  function advance() {
    const word = words[index];
    letters += deleting ? -1 : 1;
    wordSlot.textContent = word.slice(0, letters);

    if (letters === word.length) {
      deleting = true;
      delay = hold;
    } else if (letters === 0) {
      deleting = false;
      index = (index + 1) % words.length;
      delay = 400;
    } else {
      delay = deleting ? 53 : 95;
    }

    schedule();
  }

  function updateMotion() {
    tagline.classList.toggle("tagline-is-animated", motion.matches);
    animated.hidden = !motion.matches;
    updateVisibility();
  }

  motion.addEventListener("change", updateMotion);
  document.addEventListener("visibilitychange", updateVisibility);
  updateMotion();
})();
