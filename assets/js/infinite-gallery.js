(() => {
  const manifest = window.INFINITE_GALLERY_MEDIA;
  const viewport = document.querySelector('[data-gallery-viewport]');
  const plane = document.querySelector('[data-gallery-plane]');
  const status = document.querySelector('[data-gallery-status]');
  const hint = document.querySelector('.gallery-hint');
  const filterHost = document.querySelector('[data-gallery-filters]');
  const surpriseButton = document.querySelector('[data-gallery-surprise]');
  const count = document.querySelector('[data-gallery-count]');
  const dialog = document.querySelector('[data-gallery-dialog]');
  const dialogContent = document.querySelector('[data-gallery-dialog-content]');
  if (!manifest?.items?.length || !viewport || !plane) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const mobileLayout = window.innerWidth <= 700;
  const videoAutoplayEnabled = !reducedMotion && !navigator.connection?.saveData;
  const maximumPlayingVideos = mobileLayout ? 2 : 4;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const galleryScale = 4 / 3;
  const pressedKeys = new Set();
  const camera = { x: 0, y: 0, velocityX: 0, velocityY: 0 };
  const placed = [];
  let repeatWidth = 1;
  let repeatHeight = 1;
  let playbackSyncFrame = null;
  let syncVisibleVideos = () => {};
  let dragging = false;
  let dragStarted = false;
  let dragPointerId = null;
  let dragOriginArtwork = null;
  let dragDistance = 0;
  let suppressArtworkClickUntil = 0;
  let dragVelocity = { x: 0, y: 0 };
  let previousPointer = { x: 0, y: 0, time: performance.now() };
  let previousFrameTime = performance.now();
  let cameraTarget = null;
  let featuredArtwork = null;

  if (count) count.textContent = `${manifest.itemCount || manifest.items.length} works · endless field`;

  const dismissHint = () => {
    if (!hint || hint.classList.contains('is-dismissed')) return;
    hint.classList.add('is-dismissed');
    try { window.sessionStorage.setItem('infinite-gallery-discovered', 'true'); } catch {}
  };
  try {
    if (window.sessionStorage.getItem('infinite-gallery-discovered')) hint?.classList.add('is-dismissed');
  } catch {}
  window.setTimeout(() => hint?.classList.add('is-dismissed'), 5200);

  const hashString = (value) => {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  };
  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
  const mediaAspect = (media) => (
    media.width > 0 && media.height > 0 ? media.width / media.height : 4 / 3
  );
  const paintingDefinitions = {
    AR: { details: '8.5 × 11 in · Spray paint, circuit board, wire' }, Attenborough: { details: '16 × 20 in · Spray paint', description: 'David Attenborough.' }, 'Avijjā': { details: '9 × 12 in · $185 · Spray paint, ink' }, 'blå': { title: 'blå', details: '8 × 10 in · Spray paint, surgical masks' }, chef: { title: 'Chef', details: '16 × 20 in · Spray paint, vinyl' }, 'Dvaita Vedanta': { details: '16 × 20 in · Spray paint, vinyl' }, 'Før tanken': { details: '20 × 16 in · Spray paint' }, fragmentation: { title: 'Fragmentation', details: '18 × 24 in · $1,500 · Spray paint, glass, wire' }, her: { title: 'Her', details: '16 × 20 in · Spray paint' }, Herfra: { details: '20 × 20 in · $250 · Spray paint, vinyl' }, 'Idaṃ': { details: '18 × 24 in · Spray paint, vinyl' }, 'International-communication': { title: 'International Communication', details: '12 × 36 in · $270 · Spray paint' }, "It's Nooni": { details: '12 × 16 in · Spray paint' }, 'Kalyāṇa-mittatā': { title: 'Kalyāṇa-mittatā', details: '16 × 20 in · Spray paint, ink' }, knust: { title: 'Knust', details: '16 × 20 in · $1,100 · Spray paint, glass, wire' }, Laya: { details: '18 × 24 in · Spray paint, vinyl' }, 'Lysergic Scrawl': { details: '2018 · 15 × 17 cm', description: 'Drawn when on LSD.' }, 'nāga': { title: 'nāga', details: '8 × 10 in · Spray paint, ink' }, Neither: { details: '16 × 20 in · $130 · Spray paint, ink' }, octagons: { title: 'Octagons', details: '12 × 16 in · $120 · Acrylic' }, oud: { title: 'Oud', details: '9 × 12 in · Spray paint' }, Pralaya: { details: '36 × 48 in · Spray paint' }, 'Ram Dass': { details: '16 × 20 in · Spray paint, mirror', description: 'Ram Dass.' }, 'Rūpa': { title: 'Rūpa', details: '16 × 12 in · Spray paint, vinyl' }, 'Sabhāva': { title: 'Sabhāva', details: '28 × 22 × 4 in · $3,200 · Spray paint, glass, wood' }, 'Sāṃkhya': { title: 'Sāṃkhya', details: '36 × 48 in · Spray paint, vinyl' }, Stillhet: { details: '30 × 22 in · Spray paint' }, Tathata: { details: '2020 · 20 × 27 cm', description: 'A visual representation of psychedelic experiences induced by nitrous oxide and LSD.' }, 'Tathā': { title: 'Tathā', details: '20 × 20 in · $320 · Spray paint, ink, vinyl' }, 'Taxi Driver': { details: '16 × 20 in · Spray paint', description: 'Taxi Driver.' }, tupac: { title: 'Tupac', details: '12 × 16 in · Spray paint', description: 'Tupac Shakur.' }, 'Painting.720': { title: 'Painting process', details: 'Process video' }
  };
  const categoryLinks = { paintings: ['Paintings.html', 'paintings'], digital: ['Digital.html', 'Digital'], 'graphic-design': ['Graphic%20Design.html', 'Graphic Design'], photography: ['Photography.html', 'Photography'], videos: ['Video.html', 'Video'] };
  const displaySource = (source) => source.split('/').map(encodeURIComponent).join('/');
  const definitionFor = (item) => item.category === 'paintings' ? paintingDefinitions[item.title] || {} : {};
  const dialogMediaElement = (media, title) => {
    const element = document.createElement(media.type === 'video' ? 'video' : 'img');
    if (media.type === 'video') { element.controls = true; element.playsInline = true; element.preload = 'metadata'; }
    else { element.alt = title; element.decoding = 'async'; }
    element.src = displaySource(media.src);
    return element;
  };
  const openArtworkDialog = (item, initialIndex = 0) => {
    if (!dialog || !dialogContent) return;
    const definition = definitionFor(item); const title = definition.title || item.title; let mediaIndex = initialIndex;
    const work = document.createElement('article'); work.className = 'gallery-dialog__work';
    const stage = document.createElement('div'); stage.className = 'gallery-dialog__stage';
    const info = document.createElement('div'); info.className = 'gallery-dialog__info';
    const heading = document.createElement('h2'); heading.textContent = title;
    const collection = document.createElement('p'); collection.className = 'gallery-dialog__collection'; collection.textContent = item.collection;
    info.append(heading, collection);
    if (definition.details) { const details = document.createElement('p'); details.textContent = definition.details; info.append(details); }
    if (definition.description) { const description = document.createElement('p'); description.textContent = definition.description; info.append(description); }
    const zoom = window.createArtworkZoom(stage);
    const render = () => zoom.render(dialogMediaElement(item.media[mediaIndex], title));
    render();
    if (item.media.length > 1) {
      const views = document.createElement('div'); views.className = 'gallery-dialog__views';
      item.media.forEach((_, index) => { const button = document.createElement('button'); button.type = 'button'; button.textContent = index + 1; if (index === mediaIndex) button.setAttribute('aria-current', 'true'); button.addEventListener('click', () => { mediaIndex = index; render(); views.querySelectorAll('button').forEach((view, position) => position === index ? view.setAttribute('aria-current', 'true') : view.removeAttribute('aria-current')); }); views.append(button); });
      info.append(views);
    }
    const [href, label] = categoryLinks[item.category] || ['index.html', item.collection]; const more = document.createElement('a'); more.className = 'gallery-dialog__more'; more.href = href; more.textContent = item.category === 'paintings' ? 'See more paintings' : `See more in ${label}`; info.append(more);
    work.append(stage, info); dialogContent.replaceChildren(work); dialog.showModal();
  };
  if (dialog) {
    dialog.querySelector('.gallery-dialog__close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('cancel', (event) => { event.preventDefault(); dialog.close(); });
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  }

  const artworkSize = (item) => {
    const baseWidth = (mobileLayout ? 205 : 280) * galleryScale;
    const aspect = mediaAspect(item.media[0]);
    // Panoramas and other particularly short works need more horizontal
    // presence to hold their own among taller pieces.
    const width = baseWidth * (aspect >= 1.6 ? 2 : 1);
    return { width, height: width / aspect };
  };

  const overlapsExisting = (candidate) => placed.some((other) => {
    const horizontalGap = Math.abs(candidate.x - other.x);
    const verticalGap = Math.abs(candidate.y - other.y);
    const padding = (mobileLayout ? 36 : 54) * 0.75;
    return horizontalGap < (candidate.width + other.width) / 2 + padding
      && verticalGap < (candidate.height + other.height) / 2 + padding;
  });

  const placeArtwork = (item, index) => {
    const size = artworkSize(item);
    const seed = hashString(`${item.category}:${item.title}`);
    if (index === 0) return { ...size, x: 0, y: 0, rotation: 0 };

    const clusterSize = 5;
    const clusterIndex = Math.floor(index / clusterSize);
    const localIndex = index % clusterSize;
    const seedOffset = ((seed % 997) / 997 - 0.5);
    const clusterAngle = clusterIndex * goldenAngle + seedOffset * 0.34;
    const isolatedOffset = index % 19 === 0 ? (mobileLayout ? 180 : 260) * galleryScale : 0;
    const clusterRadius = Math.sqrt(clusterIndex) * (mobileLayout ? 260 : 360) * galleryScale + isolatedOffset;
    const clusterX = Math.cos(clusterAngle) * clusterRadius * 1.1;
    const clusterY = Math.sin(clusterAngle) * clusterRadius * 0.86;

    for (let attempt = 0; attempt < 220; attempt += 1) {
      const localAngle = localIndex * goldenAngle + seedOffset * 0.8 + attempt * 0.31;
      const localRadius = localIndex === 0
        ? attempt * (mobileLayout ? 10 : 13) * galleryScale
        : ((mobileLayout ? 145 : 205) + ((seed >>> 9) % 38) + attempt * (mobileLayout ? 9 : 12)) * galleryScale;
      const candidate = {
        ...size,
        x: clusterX + Math.cos(localAngle) * localRadius,
        y: clusterY + Math.sin(localAngle) * localRadius * 0.88,
        rotation: ((seed % 17) - 8) / 14
      };
      if (!overlapsExisting(candidate)) return candidate;
    }

    let fallbackStep = index;
    while (true) {
      const fallback = {
        ...size,
        x: Math.cos(fallbackStep * goldenAngle) * fallbackStep * (mobileLayout ? 48 : 64) * galleryScale,
        y: Math.sin(fallbackStep * goldenAngle) * fallbackStep * (mobileLayout ? 40 : 52) * galleryScale,
        rotation: 0
      };
      if (!overlapsExisting(fallback)) return fallback;
      fallbackStep += 1;
    }
  };

  const createMediaElement = (media, item) => {
    const element = document.createElement(media.type === 'video' ? 'video' : 'img');
    element.className = 'gallery-artwork__media';
    if (media.type === 'video') {
      element.muted = true;
      element.loop = true;
      element.playsInline = true;
      element.preload = 'metadata';
      element.setAttribute('aria-label', `${item.title} video preview`);
    } else {
      element.alt = item.title;
      element.loading = 'lazy';
      element.decoding = 'async';
      element.draggable = false;
    }
    return element;
  };

  const setUnavailable = (stage, unavailable) => stage.classList.toggle('is-unavailable', unavailable);
  const showMedia = (artwork, mediaIndex, announce = false) => {
    if (artwork.transitioning) return;
    const { item, stage } = artwork;
    const normalizedIndex = (mediaIndex + item.media.length) % item.media.length;
    const media = item.media[normalizedIndex];
    const previous = stage.querySelector('.gallery-artwork__media.is-current');
    const next = createMediaElement(media, item);
    artwork.transitioning = true;
    artwork.article.setAttribute('aria-busy', 'true');
    setUnavailable(stage, false);
    stage.classList.toggle('is-loading', !previous);
    stage.append(next);

    let revealed = false;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      artwork.mediaIndex = normalizedIndex;
      artwork.userPausedVideo = false;
      artwork.article.setAttribute('aria-busy', 'false');
      stage.classList.remove('is-loading');
      next.setAttribute('aria-hidden', 'false');
      window.requestAnimationFrame(() => {
        next.classList.add('is-current');
        if (previous) {
          previous.setAttribute('aria-hidden', 'true');
          previous.classList.remove('is-current');
        }
        artwork.transitioning = false;
        if (next.tagName === 'VIDEO') syncVisibleVideos();
      });
      if (previous) {
        if (previous.tagName === 'VIDEO') previous.pause();
        window.setTimeout(() => previous.remove(), reducedMotion ? 0 : 210);
      }
    };
    next.addEventListener(media.type === 'video' ? 'loadedmetadata' : 'load', reveal, { once: true });
    next.addEventListener('error', () => {
      next.remove();
      artwork.transitioning = false;
      artwork.article.setAttribute('aria-busy', 'false');
      stage.classList.remove('is-loading');
      setUnavailable(stage, !previous);
      if (previous) previous.classList.add('is-current');
      if (announce) status.textContent = `${item.title}: preview unavailable`;
    }, { once: true });
    next.src = displaySource(media.src);
    if (media.type === 'image' && next.complete) reveal();
    if (media.type === 'video' && next.readyState >= 1) reveal();

    const updateAccessiblePosition = () => {
      artwork.article.setAttribute(
        'aria-label',
        `${item.title}, ${item.collection}${item.media.length > 1 ? `, view ${normalizedIndex + 1} of ${item.media.length}` : ''}`
      );
      if (announce) status.textContent = `${item.title}: view ${normalizedIndex + 1} of ${item.media.length}`;
    };
    if (revealed) updateAccessiblePosition();
    else next.addEventListener(media.type === 'video' ? 'loadedmetadata' : 'load', updateAccessiblePosition, { once: true });
  };

  const loadArtwork = (artwork) => {
    if (artwork.loaded) return;
    artwork.loaded = true;
    showMedia(artwork, artwork.mediaIndex);
  };

  const createArtwork = (item, index) => {
    const position = placeArtwork(item, index);
    placed.push(position);

    const article = document.createElement('article');
    article.className = 'gallery-artwork';
    article.tabIndex = 0;
    article.dataset.galleryItem = item.id;
    article.dataset.category = item.category;
    article.setAttribute(
      'aria-label',
      `${item.title}, ${item.collection}${item.media.length > 1 ? `, view 1 of ${item.media.length}` : ''}`
    );
    article.style.left = `${position.x}px`;
    article.style.top = `${position.y}px`;
    article.style.setProperty('--artwork-width', `${position.width}px`);
    article.style.setProperty('--artwork-height', `${position.height}px`);
    article.style.setProperty('--artwork-rotation', `${position.rotation}deg`);
    article.style.setProperty('--artwork-rest-scale', '1');
    article.style.setProperty('--artwork-hover-scale', '1.015');

    const surface = document.createElement('div');
    surface.className = 'gallery-artwork__surface';
    const stage = document.createElement('div');
    stage.className = 'gallery-artwork__stage';
    surface.append(stage);

    const caption = document.createElement('div');
    caption.className = 'gallery-artwork__caption';
    const captionTitle = document.createElement('span');
    captionTitle.className = 'gallery-artwork__caption-title';
    captionTitle.textContent = definitionFor(item).title || item.title;
    const captionCollection = document.createElement('span');
    captionCollection.className = 'gallery-artwork__caption-collection';
    captionCollection.textContent = item.collection;
    caption.append(captionTitle, captionCollection);
    surface.append(caption);
    article.append(surface);

    const artwork = {
      item,
      article,
      surface,
      stage,
      position,
      mediaIndex: 0,
      loaded: false,
      transitioning: false,
      visibleForPlayback: false,
      userPausedVideo: false,
      renderX: position.x,
      renderY: position.y
    };
    if (item.media.length > 1) {
      const previousButton = document.createElement('button');
      previousButton.className = 'gallery-artwork__arrow gallery-artwork__arrow--previous';
      previousButton.type = 'button';
      previousButton.setAttribute('aria-label', `Previous view of ${item.title}`);
      const previousIcon = document.createElement('img'); previousIcon.src = 'assets/img/leftarrow.png'; previousIcon.alt = ''; previousButton.append(previousIcon);

      const nextButton = document.createElement('button');
      nextButton.className = 'gallery-artwork__arrow gallery-artwork__arrow--next';
      nextButton.type = 'button';
      nextButton.setAttribute('aria-label', `Next view of ${item.title}`);
      const nextIcon = document.createElement('img'); nextIcon.src = 'assets/img/rightarrow.png'; nextIcon.alt = ''; nextButton.append(nextIcon);

      [previousButton, nextButton].forEach((button) => {
        button.addEventListener('pointerdown', (event) => event.stopPropagation());
      });
      previousButton.addEventListener('click', (event) => {
        event.stopPropagation();
        loadArtwork(artwork);
        showMedia(artwork, artwork.mediaIndex - 1, true);
      });
      nextButton.addEventListener('click', (event) => {
        event.stopPropagation();
        loadArtwork(artwork);
        showMedia(artwork, artwork.mediaIndex + 1, true);
      });
      surface.append(previousButton, nextButton);
    }

    if (finePointer && !reducedMotion) {
      article.addEventListener('pointermove', (event) => {
        const rect = article.getBoundingClientRect();
        const horizontal = clamp((event.clientX - rect.left) / rect.width - 0.5, -0.5, 0.5);
        const vertical = clamp((event.clientY - rect.top) / rect.height - 0.5, -0.5, 0.5);
        surface.style.setProperty('--tilt-x', `${(-vertical * 6).toFixed(3)}deg`);
        surface.style.setProperty('--tilt-y', `${(horizontal * 6).toFixed(3)}deg`);
        surface.style.setProperty('--shine-x', `${((horizontal + 0.5) * 100).toFixed(1)}%`);
        surface.style.setProperty('--shine-y', `${((vertical + 0.5) * 100).toFixed(1)}%`);
      });
    }
    article.addEventListener('pointerenter', () => syncVisibleVideos());
    article.addEventListener('pointerleave', () => {
      surface.style.setProperty('--tilt-x', '0deg');
      surface.style.setProperty('--tilt-y', '0deg');
      syncVisibleVideos();
    });
    article.addEventListener('focusin', () => syncVisibleVideos());
    article.addEventListener('focusout', () => syncVisibleVideos());
    surface.addEventListener('click', (event) => {
      if (event.target.closest('button')) return;
      if (performance.now() < suppressArtworkClickUntil) {
        event.preventDefault();
        return;
      }
      openArtworkDialog(item, artwork.mediaIndex);
    });
    article.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openArtworkDialog(item, artwork.mediaIndex); } });

    plane.append(article);
    return artwork;
  };

  const categoryBuckets = new Map();
  manifest.items.forEach((item) => {
    if (!categoryBuckets.has(item.category)) categoryBuckets.set(item.category, []);
    categoryBuckets.get(item.category).push(item);
  });
  categoryBuckets.forEach((items) => items.sort((left, right) => {
    const difference = hashString(`layout:${left.id}:${left.title}`) - hashString(`layout:${right.id}:${right.title}`);
    return difference || left.id.localeCompare(right.id);
  }));
  const categoryOrder = [...categoryBuckets.keys()].sort((left, right) => hashString(left) - hashString(right));
  const layoutItems = [];
  let categoryRound = 0;
  while (layoutItems.length < manifest.items.length) {
    for (let offset = 0; offset < categoryOrder.length; offset += 1) {
      const category = categoryOrder[(categoryRound + offset) % categoryOrder.length];
      const nextItem = categoryBuckets.get(category).shift();
      if (nextItem) layoutItems.push(nextItem);
    }
    categoryRound = (categoryRound + 2) % categoryOrder.length;
  }
  let entryMedia = null;
  try {
    entryMedia = window.sessionStorage.getItem('infinite-gallery-entry-media');
    window.sessionStorage.removeItem('infinite-gallery-entry-media');
  } catch {}
  const artworks = layoutItems.map(createArtwork);

  const cancelCameraFlight = () => { cameraTarget = null; };
  const closestArtwork = (candidates) => candidates.reduce((closest, artwork) => {
    const rect = artwork.article.getBoundingClientRect();
    const distance = Math.hypot(
      rect.left + rect.width / 2 - window.innerWidth / 2,
      rect.top + rect.height / 2 - window.innerHeight / 2
    );
    return !closest || distance < closest.distance ? { artwork, distance } : closest;
  }, null)?.artwork;
  const flyToArtwork = (artwork) => {
    if (!artwork) return;
    const rect = artwork.article.getBoundingClientRect();
    cameraTarget = {
      x: camera.x - (rect.left + rect.width / 2 - window.innerWidth / 2),
      y: camera.y - (rect.top + rect.height / 2 - window.innerHeight / 2),
      artwork
    };
    camera.velocityX = 0;
    camera.velocityY = 0;
    dismissHint();
  };

  let activeCategory = 'all';
  const setCategory = (category) => {
    cancelCameraFlight();
    activeCategory = category;
    const candidates = artworks.filter((artwork) => category === 'all' || artwork.item.category === category);
    artworks.forEach((artwork) => {
      const visible = candidates.includes(artwork);
      artwork.article.classList.toggle('is-filtered-out', !visible);
      artwork.article.tabIndex = visible ? 0 : -1;
    });
    filterHost?.querySelectorAll('button').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.category === category));
    });
    if (category !== 'all') flyToArtwork(closestArtwork(candidates));
    status.textContent = category === 'all'
      ? `Showing all ${artworks.length} works`
      : `Showing ${candidates.length} works from ${candidates[0]?.item.collection || category}`;
  };

  if (filterHost) {
    const categories = [{ id: 'all', label: 'all' }, ...manifest.collections];
    categories.forEach((category) => {
      const button = document.createElement('button');
      button.className = 'gallery-filter';
      button.type = 'button';
      button.dataset.category = category.id;
      button.textContent = category.label;
      button.setAttribute('aria-pressed', String(category.id === 'all'));
      button.addEventListener('click', () => setCategory(category.id));
      filterHost.append(button);
    });
  }

  surpriseButton?.addEventListener('click', () => {
    const candidates = artworks.filter((artwork) => activeCategory === 'all' || artwork.item.category === activeCategory);
    if (!candidates.length) return;
    let next = candidates[Math.floor(Math.random() * candidates.length)];
    if (next === featuredArtwork && candidates.length > 1) {
      next = candidates[(candidates.indexOf(next) + 1) % candidates.length];
    }
    flyToArtwork(next);
    status.textContent = `Moving to ${definitionFor(next.item).title || next.item.title}`;
  });
  const entryArtwork = entryMedia
    ? artworks.find((artwork) => artwork.item.media.some((media) => media.src === entryMedia))
    : null;
  if (entryArtwork) {
    camera.x = -entryArtwork.position.x;
    camera.y = -entryArtwork.position.y;
  }
  const firstPlaced = placed[0];
  const layoutBounds = placed.slice(1).reduce((result, item) => ({
    minX: Math.min(result.minX, item.x - item.width / 2),
    maxX: Math.max(result.maxX, item.x + item.width / 2),
    minY: Math.min(result.minY, item.y - item.height / 2),
    maxY: Math.max(result.maxY, item.y + item.height / 2)
  }), {
    minX: firstPlaced.x - firstPlaced.width / 2,
    maxX: firstPlaced.x + firstPlaced.width / 2,
    minY: firstPlaced.y - firstPlaced.height / 2,
    maxY: firstPlaced.y + firstPlaced.height / 2
  });
  const repeatGutter = (mobileLayout ? 18 : 27) * galleryScale;
  repeatWidth = Math.max(
    layoutBounds.maxX - layoutBounds.minX + repeatGutter * 2,
    window.innerWidth + repeatGutter * 2
  );
  repeatHeight = Math.max(
    layoutBounds.maxY - layoutBounds.minY + repeatGutter * 2,
    window.innerHeight + repeatGutter * 2
  );

  const nearestPeriodicPosition = (position, cameraOffset, span) => (
    position + Math.round((-cameraOffset - position) / span) * span
  );
  // Move each work to its nearest periodic copy. The jump happens well outside
  // the viewport, so the curated plane can repeat without cloning 111 media nodes.
  const updateWrappedArtworkPositions = () => {
    artworks.forEach((artwork) => {
      const renderX = nearestPeriodicPosition(artwork.position.x, camera.x, repeatWidth);
      const renderY = nearestPeriodicPosition(artwork.position.y, camera.y, repeatHeight);
      if (renderX !== artwork.renderX) {
        artwork.renderX = renderX;
        artwork.article.style.left = `${renderX}px`;
      }
      if (renderY !== artwork.renderY) {
        artwork.renderY = renderY;
        artwork.article.style.top = `${renderY}px`;
      }
    });
  };
  const normalizeCamera = () => {
    if (Math.abs(camera.x) > repeatWidth * 4) camera.x %= repeatWidth;
    if (Math.abs(camera.y) > repeatHeight * 4) camera.y %= repeatHeight;
  };

  syncVisibleVideos = () => {
    if (playbackSyncFrame !== null) return;
    playbackSyncFrame = window.requestAnimationFrame(() => {
      playbackSyncFrame = null;
      const candidates = [];
      artworks.forEach((artwork) => {
        const video = artwork.stage.querySelector('video.is-current');
        if (!video) return;
        const manuallyRelevant = artwork.article.matches(':hover, :focus-within');
        const shouldBeCandidate = document.visibilityState === 'visible'
          && artwork.visibleForPlayback
          && !artwork.userPausedVideo
          && (videoAutoplayEnabled || manuallyRelevant);
        if (!shouldBeCandidate) {
          video.pause();
          return;
        }
        const rect = artwork.article.getBoundingClientRect();
        candidates.push({
          video,
          distance: Math.hypot(
            rect.left + rect.width / 2 - window.innerWidth / 2,
            rect.top + rect.height / 2 - window.innerHeight / 2
          )
        });
      });
      // Keep visible videos alive, but cap simultaneous decodes on busy views.
      candidates.sort((left, right) => left.distance - right.distance);
      candidates.forEach(({ video }, index) => {
        if (index < maximumPlayingVideos) video.play().catch(() => {});
        else video.pause();
      });
    });
  };

  const artworkByElement = new WeakMap(artworks.map((artwork) => [artwork.article, artwork]));
  const loadingObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const artwork = artworkByElement.get(entry.target);
      if (!artwork) return;
      if (entry.isIntersecting) loadArtwork(artwork);
    });
  }, { root: viewport, rootMargin: '700px', threshold: 0.01 });
  const playbackObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const artwork = artworkByElement.get(entry.target);
      if (artwork) artwork.visibleForPlayback = entry.isIntersecting;
    });
    syncVisibleVideos();
  }, { root: viewport, rootMargin: '80px', threshold: 0.04 });
  artworks.forEach((artwork) => {
    loadingObserver.observe(artwork.article);
    playbackObserver.observe(artwork.article);
  });
  updateWrappedArtworkPositions();

  const stopDragging = (event) => {
    if (!dragging || (event && event.pointerId !== dragPointerId)) return;
    const velocityFactor = performance.now() - previousPointer.time > 70 ? 0.12 : 0.48;
    camera.velocityX = !dragStarted || reducedMotion ? 0 : clamp(dragVelocity.x, -1.45, 1.45) * velocityFactor;
    camera.velocityY = !dragStarted || reducedMotion ? 0 : clamp(dragVelocity.y, -1.45, 1.45) * velocityFactor;
    const releasedPointerId = dragPointerId;
    if (dragStarted && dragOriginArtwork) suppressArtworkClickUntil = performance.now() + 420;
    dragging = false;
    dragStarted = false;
    dragPointerId = null;
    dragOriginArtwork = null;
    dragDistance = 0;
    viewport.classList.remove('is-dragging');
    if (releasedPointerId !== null && viewport.hasPointerCapture(releasedPointerId)) viewport.releasePointerCapture(releasedPointerId);
  };

  viewport.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0 || event.target.closest('button, a')) return;
    cancelCameraFlight();
    dragging = true;
    dragStarted = !event.target.closest('.gallery-artwork');
    dragPointerId = event.pointerId;
    dragOriginArtwork = event.target.closest('.gallery-artwork');
    dragDistance = 0;
    dragVelocity = { x: 0, y: 0 };
    camera.velocityX = 0;
    camera.velocityY = 0;
    previousPointer = { x: event.clientX, y: event.clientY, time: performance.now() };
    if (dragStarted) {
      dismissHint();
      viewport.classList.add('is-dragging');
      viewport.setPointerCapture(event.pointerId);
    }
    viewport.focus({ preventScroll: true });
  });
  viewport.addEventListener('pointermove', (event) => {
    if (finePointer) {
      viewport.style.setProperty('--pointer-x', `${event.clientX}px`);
      viewport.style.setProperty('--pointer-y', `${event.clientY}px`);
    }
    if (!dragging || event.pointerId !== dragPointerId) return;
    const now = performance.now();
    const elapsed = clamp(now - previousPointer.time, 8, 42);
    const deltaX = event.clientX - previousPointer.x;
    const deltaY = event.clientY - previousPointer.y;
    dragDistance += Math.hypot(deltaX, deltaY);
    if (!dragStarted && dragDistance < 7) {
      previousPointer = { x: event.clientX, y: event.clientY, time: now };
      return;
    }
    if (!dragStarted) {
      dragStarted = true;
      dismissHint();
      viewport.classList.add('is-dragging');
      viewport.setPointerCapture(event.pointerId);
    }
    camera.x += deltaX;
    camera.y += deltaY;
    dragVelocity.x = dragVelocity.x * 0.58 + (deltaX / elapsed) * 0.42;
    dragVelocity.y = dragVelocity.y * 0.58 + (deltaY / elapsed) * 0.42;
    previousPointer = { x: event.clientX, y: event.clientY, time: now };
  });
  viewport.addEventListener('pointerup', stopDragging);
  viewport.addEventListener('pointercancel', stopDragging);
  viewport.addEventListener('lostpointercapture', stopDragging);

  viewport.addEventListener('wheel', (event) => {
    event.preventDefault();
    cancelCameraFlight();
    dismissHint();
    const deltaScale = event.deltaMode === WheelEvent.DOM_DELTA_LINE
      ? 16
      : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? window.innerHeight : 1;
    camera.x -= clamp(event.deltaX * deltaScale, -180, 180);
    camera.y -= clamp(event.deltaY * deltaScale, -180, 180);
    camera.velocityX = 0;
    camera.velocityY = 0;
  }, { passive: false });

  document.addEventListener('keydown', (event) => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    if (event.target.closest('button, a')) return;
    event.preventDefault();
    cancelCameraFlight();
    dismissHint();
    pressedKeys.add(event.key);
  });
  document.addEventListener('keyup', (event) => pressedKeys.delete(event.key));
  window.addEventListener('blur', () => {
    pressedKeys.clear();
    camera.velocityX = 0;
    camera.velocityY = 0;
  });

  const animate = (time) => {
    const delta = Math.min(34, time - previousFrameTime);
    previousFrameTime = time;
    if (!dragging && cameraTarget) {
      const response = reducedMotion ? 1 : 1 - Math.exp(-delta / 180);
      camera.x += (cameraTarget.x - camera.x) * response;
      camera.y += (cameraTarget.y - camera.y) * response;
      if (Math.hypot(cameraTarget.x - camera.x, cameraTarget.y - camera.y) < 0.7) {
        camera.x = cameraTarget.x;
        camera.y = cameraTarget.y;
        featuredArtwork?.article.classList.remove('is-featured');
        featuredArtwork = cameraTarget.artwork;
        featuredArtwork.article.classList.remove('is-featured');
        void featuredArtwork.article.offsetWidth;
        featuredArtwork.article.classList.add('is-featured');
        cameraTarget = null;
      }
    } else if (!dragging) {
      let directionX = (pressedKeys.has('ArrowLeft') ? 1 : 0) - (pressedKeys.has('ArrowRight') ? 1 : 0);
      let directionY = (pressedKeys.has('ArrowUp') ? 1 : 0) - (pressedKeys.has('ArrowDown') ? 1 : 0);
      const directionLength = Math.hypot(directionX, directionY);
      if (directionLength > 0) {
        directionX /= directionLength;
        directionY /= directionLength;
        const keyboardVelocity = mobileLayout ? 0.42 : 0.56;
        const response = reducedMotion ? 1 : 1 - Math.exp(-delta / 68);
        camera.velocityX += (directionX * keyboardVelocity - camera.velocityX) * response;
        camera.velocityY += (directionY * keyboardVelocity - camera.velocityY) * response;
      } else {
        const damping = reducedMotion ? 0 : Math.exp(-delta / 92);
        camera.velocityX *= damping;
        camera.velocityY *= damping;
        if (Math.abs(camera.velocityX) < 0.003) camera.velocityX = 0;
        if (Math.abs(camera.velocityY) < 0.003) camera.velocityY = 0;
      }
      camera.x += camera.velocityX * delta;
      camera.y += camera.velocityY * delta;
    }
    normalizeCamera();
    updateWrappedArtworkPositions();
    plane.style.transform = `translate3d(${window.innerWidth / 2 + camera.x}px, ${window.innerHeight / 2 + camera.y}px, 0)`;
    window.requestAnimationFrame(animate);
  };
  window.requestAnimationFrame(animate);
  window.addEventListener('resize', () => {
    updateWrappedArtworkPositions();
    syncVisibleVideos();
  }, { passive: true });

  const backLink = document.querySelector('.gallery-back');
  backLink.addEventListener('click', (event) => {
    if (reducedMotion) return;
    event.preventDefault();
    document.body.classList.add('is-leaving');
    window.setTimeout(() => {
      if (document.referrer.startsWith(window.location.origin) && window.history.length > 1) window.history.back();
      else window.location.href = backLink.href;
    }, 220);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      syncVisibleVideos();
      return;
    }
    artworks.forEach((artwork) => artwork.stage.querySelector('video')?.pause());
  });

  window.addEventListener('pagehide', () => {
    artworks.forEach((artwork) => {
      const video = artwork.stage.querySelector('video');
      if (video) video.pause();
    });
  });
})();
