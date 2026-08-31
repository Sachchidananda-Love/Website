(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const files = ['1', '2', '3', '4', '5', '6'];
  const faces = ['front', 'back', 'right', 'left', 'top', 'bottom'];
  const minimumVisibleMs = 2000;
  let loader;
  let startedAt = 0;
  let hideTimer;
  let navigationTimer;

  const createLoader = () => {
    if (loader) return loader;
    loader = document.createElement('div');
    loader.className = 'site-loader';
    loader.setAttribute('role', 'status');
    loader.setAttribute('aria-label', 'Loading page');
    loader.innerHTML = `<div class="site-loader__scene"><div class="site-loader__cube">${faces.map((face, index) => `<div class="site-loader__face site-loader__face--${face}"><video src="assets/img/Loading/${files[index]}.mp4" muted autoplay loop playsinline preload="auto"></video></div>`).join('')}</div></div>`;
    document.body.append(loader);
    return loader;
  };

  const show = () => {
    const overlay = createLoader();
    window.clearTimeout(hideTimer);
    startedAt = performance.now();
    document.documentElement.classList.add('site-loader-active');
    overlay.hidden = false;
    overlay.classList.remove('is-hiding');
    overlay.querySelectorAll('video').forEach((video) => video.play().catch(() => {}));
  };

  const hide = () => {
    if (!loader) return;
    const wait = Math.max(0, minimumVisibleMs - (performance.now() - startedAt));
    window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => {
      loader.classList.add('is-hiding');
      document.documentElement.classList.remove('site-loader-active');
    }, wait);
  };

  const isPageNavigation = (anchor, event) => {
    if (!anchor || anchor.target || anchor.hasAttribute('download') || event.defaultPrevented) return false;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    const destination = new URL(anchor.href, window.location.href);
    return destination.origin === window.location.origin
      && destination.pathname !== window.location.pathname;
  };

  show();

  if (!reducedMotion) {
    const cube = loader.querySelector('.site-loader__cube');
    const animate = (time) => {
      // Kept in sync with the homepage portfolio cube: X 29, Y 32, Z 27 deg/sec.
      cube.style.transform = `rotateX(${-8 + (time / 1000) * 29}deg) rotateY(${22 + (time / 1000) * 32}deg) rotateZ(${(time / 1000) * 27}deg)`;
      window.requestAnimationFrame(animate);
    };
    window.requestAnimationFrame(animate);
  }

  document.addEventListener('click', (event) => {
    const anchor = event.target.closest('a[href]');
    if (!isPageNavigation(anchor, event)) return;
    event.preventDefault();
    show();
    window.clearTimeout(navigationTimer);
    navigationTimer = window.setTimeout(() => window.location.assign(anchor.href), minimumVisibleMs);
  }, true);

  window.addEventListener('load', hide, { once: true });
  window.addEventListener('pageshow', hide);
})();
