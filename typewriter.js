(() => {
  "use strict";

  const tagline = document.querySelector(".tagline");
  const animated = tagline.querySelector(".tagline-animated");
  const wordSlot = animated.querySelector(".tagline-word");
  const motion = matchMedia("(prefers-reduced-motion: no-preference)");
  const words = ["talk.", "connect.", "explore.", "collaborate.", "build.", "create.", "solve.", "improve."];
  let index = 0;
  let letters = words[0].length;
  let deleting = true;
  let delay = 2200;
  let timer;

  function schedule() {
    clearTimeout(timer);
    if (motion.matches && !document.hidden) timer = setTimeout(advance, delay);
  }

  function advance() {
    const word = words[index];
    letters += deleting ? -1 : 1;
    wordSlot.textContent = word.slice(0, letters);

    if (letters === word.length) {
      deleting = true;
      delay = 2200;
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
    schedule();
  }

  motion.addEventListener("change", updateMotion);
  document.addEventListener("visibilitychange", schedule);
  updateMotion();
})();
