(() => {
  const elements = [...document.querySelectorAll('.social-orbit')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const proximity = 105;
  let pointer = null;
  let previousTime = 0;
  const random = (minimum, maximum) => minimum + Math.random() * (maximum - minimum);
  const sizeOf = (item) => item.element.getBoundingClientRect().width;
  const items = elements.map((element) => ({ element, x: 0, y: 0, vx: 0, vy: 0 }));

  const placeItems = () => {
    const centerX = innerWidth / 2;
    const centerY = innerHeight / 2;
    items.forEach((item, index) => {
      const size = sizeOf(item) || 50;
      const angle = (Math.PI * 2 * index) / items.length + random(-0.45, 0.45);
      const distance = random(Math.min(innerWidth, innerHeight) * 0.12, Math.min(innerWidth, innerHeight) * 0.28);
      item.x = Math.max(8, Math.min(innerWidth - size - 8, centerX + Math.cos(angle) * distance - size / 2));
      item.y = Math.max(8, Math.min(innerHeight - size - 8, centerY + Math.sin(angle) * distance - size / 2));
      const speed = random(28, 54);
      const direction = random(0, Math.PI * 2);
      item.vx = Math.cos(direction) * speed;
      item.vy = Math.sin(direction) * speed;
      item.element.style.left = `${item.x}px`;
      item.element.style.top = `${item.y}px`;
    });
  };

  const updateCursorEffect = () => {
    if (!pointer) return;
    items.forEach((item) => {
      const size = sizeOf(item);
      const deltaX = pointer.x - (item.x + size / 2);
      const deltaY = pointer.y - (item.y + size / 2);
      const distance = Math.hypot(deltaX, deltaY);
      item.element.classList.toggle('is-near', distance < proximity);
      if (!reducedMotion) {
        const strength = Math.max(0, 1 - distance / 420) * 8;
        item.element.style.setProperty('--offset-x', `${Math.round(deltaX / Math.max(distance, 1) * strength)}px`);
        item.element.style.setProperty('--offset-y', `${Math.round(deltaY / Math.max(distance, 1) * strength)}px`);
      }
    });
  };

  const bounce = (first, second) => {
    const firstSize = sizeOf(first); const secondSize = sizeOf(second);
    const firstX = first.x + firstSize / 2; const firstY = first.y + firstSize / 2;
    const secondX = second.x + secondSize / 2; const secondY = second.y + secondSize / 2;
    let deltaX = secondX - firstX; let deltaY = secondY - firstY;
    let distance = Math.hypot(deltaX, deltaY); const minimum = (firstSize + secondSize) / 2 + 6;
    if (distance >= minimum) return;
    if (!distance) { deltaX = 1; deltaY = 0; distance = 1; }
    const normalX = deltaX / distance; const normalY = deltaY / distance; const overlap = (minimum - distance) / 2;
    first.x -= normalX * overlap; first.y -= normalY * overlap; second.x += normalX * overlap; second.y += normalY * overlap;
    const velocity = (first.vx - second.vx) * normalX + (first.vy - second.vy) * normalY;
    if (velocity <= 0) return;
    first.vx += -velocity * normalX; first.vy += -velocity * normalY; second.vx -= -velocity * normalX; second.vy -= -velocity * normalY;
  };

  const animate = (time) => {
    const elapsed = Math.min((time - previousTime) / 1000 || 0, 0.04); previousTime = time;
    if (!reducedMotion) {
      items.forEach((item) => {
        const size = sizeOf(item); item.x += item.vx * elapsed; item.y += item.vy * elapsed;
        if (item.x <= 0 || item.x >= innerWidth - size) { item.x = Math.max(0, Math.min(innerWidth - size, item.x)); item.vx *= -1; }
        if (item.y <= 0 || item.y >= innerHeight - size) { item.y = Math.max(0, Math.min(innerHeight - size, item.y)); item.vy *= -1; }
      });
      for (let first = 0; first < items.length; first += 1) for (let second = first + 1; second < items.length; second += 1) bounce(items[first], items[second]);
      items.forEach((item) => { item.element.style.left = `${item.x}px`; item.element.style.top = `${item.y}px`; });
    }
    updateCursorEffect(); window.requestAnimationFrame(animate);
  };

  placeItems();
  addEventListener('resize', placeItems, { passive: true });
  addEventListener('pointermove', (event) => { pointer = { x: event.clientX, y: event.clientY }; }, { passive: true });
  addEventListener('pointerleave', () => { pointer = null; elements.forEach((element) => element.classList.remove('is-near')); });
  requestAnimationFrame(animate);
})();
