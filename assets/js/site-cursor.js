(() => {
  if (document.querySelector('.title-page')) return;
  if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;
  const cursorPath = document.currentScript?.dataset.cursorPath || 'assets/img/cursor/';
  const cursor = document.createElement('img');
  cursor.className = 'site-cursor';
  cursor.src = `${cursorPath}cursor_1.png`;
  cursor.alt = '';
  cursor.setAttribute('aria-hidden', 'true');
  document.body.append(cursor);

  const normalCursor = `${cursorPath}cursor_1.png`;
  const hoverCursor = `${cursorPath}cursorhover_1.png`;
  new Image().src = hoverCursor;
  const placeCursorInTopLayer = () => {
    const openDialog = [...document.querySelectorAll('dialog[open]')].at(-1);
    const host = openDialog || document.body;
    if (cursor.parentElement !== host) host.append(cursor);
  };
  document.addEventListener('toggle', (event) => {
    if (event.target.matches?.('dialog')) window.requestAnimationFrame(placeCursorInTopLayer);
  }, true);
  placeCursorInTopLayer();
  const moveCursor = (event) => {
    placeCursorInTopLayer();
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
    cursor.src = event.target.closest('a, button, input, select, summary, [role="button"], [role="link"], [role="slider"], [data-lang-switcher], .tile, .large-button, .section-dropdown, .language-switcher, .painting-card__media, .painting-dialog__stage, .gallery-artwork, .gallery-artwork__surface') ? hoverCursor : normalCursor;
    cursor.classList.add('site-cursor--visible');
  };
  document.addEventListener('pointermove', moveCursor, { passive: true });
  document.addEventListener('mousemove', moveCursor, { passive: true });
})();
