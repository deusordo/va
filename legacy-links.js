(() => {
  const route = document.currentScript.dataset.details;
  const anchors = new Set(document.currentScript.dataset.anchors.split(" "));
  function followOldLink() {
    let anchor;
    try {
      anchor = decodeURIComponent(location.hash.slice(1));
    } catch {
      return;
    }
    if (!anchors.has(anchor)) return;
    const target = new URL(route, location.href);
    target.search = location.search;
    target.hash = anchor;
    location.replace(target);
  }
  followOldLink();
  window.addEventListener("hashchange", followOldLink);
})();
