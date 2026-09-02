(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const faces = ['front', 'back', 'right', 'left', 'top', 'bottom'];
  const minimumVisibleMs = 2000;
  const minimumIntervalMs = 5 * 60 * 1000;
  const lastShownKey = 'calem-site-loader-last-shown';
  let loader;
  let startedAt = 0;
  let hideTimer;
  let navigationTimer;
  let animationFrame = 0;

  const readLastShownAt = () => {
    try {
      return Number(window.sessionStorage.getItem(lastShownKey)) || 0;
    } catch (error) {
      return 0;
    }
  };

  let lastShownAt = readLastShownAt();

  const canShow = () => Date.now() - lastShownAt >= minimumIntervalMs;

  const rememberShown = () => {
    lastShownAt = Date.now();
    try {
      window.sessionStorage.setItem(lastShownKey, String(lastShownAt));
    } catch (error) {
      // The in-memory timestamp still prevents repeated loaders on this page.
    }
  };

  const createLoader = () => {
    if (loader) return loader;
    loader = document.createElement('div');
    loader.className = 'site-loader';
    loader.setAttribute('role', 'status');
    loader.setAttribute('aria-label', 'Loading page');
    loader.innerHTML = `<div class="site-loader__scene"><div class="site-loader__cube" aria-hidden="true">${faces.map((face) => `<div class="site-loader__face site-loader__face--${face}"></div>`).join('')}</div></div>`;
    document.body.append(loader);
    return loader;
  };

  const startAnimation = () => {
    if (reducedMotion || animationFrame || !loader) return;
    const cube = loader.querySelector('.site-loader__cube');
    const animate = (time) => {
      // Kept in sync with the homepage portfolio cube: X 29, Y 32, Z 27 deg/sec.
      cube.style.transform = `rotateX(${-8 + (time / 1000) * 29}deg) rotateY(${22 + (time / 1000) * 32}deg) rotateZ(${(time / 1000) * 27}deg)`;
      animationFrame = window.requestAnimationFrame(animate);
    };
    animationFrame = window.requestAnimationFrame(animate);
  };

  const show = () => {
    if (!canShow()) return false;
    const overlay = createLoader();
    window.clearTimeout(hideTimer);
    rememberShown();
    startedAt = performance.now();
    document.documentElement.classList.add('site-loader-active');
    overlay.hidden = false;
    overlay.classList.remove('is-hiding');
    startAnimation();
    return true;
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

  document.addEventListener('click', (event) => {
    const anchor = event.target.closest('a[href]');
    if (!isPageNavigation(anchor, event)) return;
    if (!show()) return;
    event.preventDefault();
    window.clearTimeout(navigationTimer);
    navigationTimer = window.setTimeout(() => window.location.assign(anchor.href), minimumVisibleMs);
  }, true);

  window.addEventListener('load', hide, { once: true });
  window.addEventListener('pageshow', hide);
})();
