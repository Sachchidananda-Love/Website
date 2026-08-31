(() => {
  const grid = document.querySelector('[data-paintings-grid]');
  const template = document.querySelector('[data-painting-template]');
  const dialog = document.querySelector('[data-painting-dialog]');
  const dialogContent = document.querySelector('[data-painting-dialog-content]');
  const controls = document.querySelector('[data-paintings-controls]');
  if (!grid || !template || !dialog || !dialogContent || !controls) return;

  // Metadata transcribed from “Descriptions Website”. Each key mirrors the
  // asset group name, keeping asset additions and editorial copy independent.
  const works = {
    'AR': { details: '8.5 × 11 in · Spray paint, circuit board, wire', tags: ['Spray Paint'] },
    'Attenborough': { details: '16 × 20 in · Spray paint', description: 'David Attenborough.', tags: ['Spray Paint', 'People'] },
    'Avijjā': { details: '9 × 12 in · $185 · Spray paint, ink', tags: ['Spray Paint', 'Ink', 'For Sale'] },
    'blå': { title: 'blå', details: '8 × 10 in · Spray paint, surgical masks', tags: ['Spray Paint', 'People'] },
    'chef': { title: 'Chef', details: '16 × 20 in · Spray paint, vinyl', tags: ['Spray Paint', 'Vinyl'] },
    'Dvaita Vedanta': { details: '16 × 20 in', tags: ['Spray Paint', 'Vinyl', 'Nature', 'Abstract'] },
    'Før tanken': { details: '20 × 16 in · Spray paint', tags: ['Spray Paint', 'Abstract'] },
    'fragmentation': { title: 'Fragmentation', details: '18 × 24 in · $1,500 · Spray paint, glass, wire', tags: ['Spray Paint', 'Glass', 'People', 'For Sale'] },
    'her': { title: 'Her', details: '16 × 20 in · Spray paint', tags: ['Spray Paint', 'People'] },
    'Herfra': { details: '20 × 20 in · $250 · Spray paint, vinyl', tags: ['Spray Paint', 'Vinyl', 'Abstract', 'For Sale'] },
    'Idaṃ': { details: '18 × 24 in · Spray paint, vinyl', tags: ['Spray Paint', 'Vinyl', 'Nature', 'Abstract'] },
    'International-communication': { title: 'International Communication', details: '12 × 36 in · $270 · Spray paint', tags: ['Spray Paint', 'People', 'For Sale'] },
    "It's Nooni": { details: '12 × 16 in · Spray paint', tags: ['Spray Paint'] },
    'Kalyāṇa-mittatā': { title: 'Kalyāṇa-mittatā', details: '16 × 20 in · Spray paint, ink', tags: ['Spray Paint', 'Ink', 'People', 'Nature', 'Tendrils'] },
    'knust': { title: 'Knust', details: '16 × 20 in · $1,100 · Spray paint, glass, wire', tags: ['Spray Paint', 'Glass', 'People', 'For Sale'] },
    'Laya': { details: '18 × 24 in · Spray paint, vinyl', tags: ['Spray Paint', 'Vinyl', 'Nature', 'Abstract'] },
    'Lysergic Scrawl': { details: '2018 · 15 × 17 cm', description: 'Drawn when on LSD.', tags: ['Psychedelic'] },
    'nāga': { title: 'nāga', details: '8 × 10 in · Spray paint, ink', tags: ['Spray Paint', 'Ink', 'Nature', 'Abstract', 'Tendrils'] },
    'Neither': { details: '16 × 20 in · $130 · Spray paint, ink', tags: ['Spray Paint', 'Ink', 'Abstract', 'For Sale'] },
    'octagons': { title: 'Octagons', details: '12 × 16 in · $120 · Acrylic', tags: ['Acrylic', 'Nature', 'For Sale'] },
    'oud': { title: 'Oud', details: '9 × 12 in · Spray paint', tags: ['Spray Paint', 'Abstract', 'People'] },
    'Pralaya': { details: '36 × 48 in · Spray paint', tags: ['Spray Paint', 'Nature', 'Abstract'] },
    'Ram Dass': { details: '16 × 20 in · Spray paint, mirror', description: 'Ram Dass.', tags: ['Spray Paint', 'Glass', 'People'] },
    'Rūpa': { title: 'Rūpa', details: '16 × 12 in · Spray paint, vinyl', tags: ['Spray Paint', 'Vinyl'] },
    'Sabhāva': { title: 'Sabhāva', details: '28 × 22 × 4 in · $3,200 · Spray paint, glass, wood', tags: ['Spray Paint', 'Glass', 'People', 'For Sale'] },
    'Sāṃkhya': { title: 'Sāṃkhya', details: '36 × 48 in', tags: ['Spray Paint', 'Vinyl', 'Abstract'] },
    'Stillhet': { details: '30 × 22 in · Spray paint', tags: ['Spray Paint', 'Nature', 'Abstract'] },
    'Tathata': { title: 'Tathata', details: '2020 · 20 × 27 cm', description: 'A visual representation of psychedelic experiences induced by nitrous oxide and LSD.', tags: ['Psychedelic'] },
    'Tathā': { title: 'Tathā', details: '20 × 20 in · $320 · Spray paint, ink, vinyl', tags: ['Spray Paint', 'Ink', 'Vinyl', 'People', 'For Sale'] },
    'Taxi Driver': { details: '16 × 20 in · Spray paint', description: 'Taxi Driver.', tags: ['Spray Paint', 'People'] },
    'tupac': { title: 'Tupac', details: '12 × 16 in · Spray paint', description: 'Tupac Shakur.', tags: ['Spray Paint', 'People'] },
    'Painting.720': { title: 'Painting process', details: 'Process video', tags: [] }
  };
  const items = window.INFINITE_GALLERY_MEDIA?.items?.filter((item) => item.category === 'paintings') || [];
  const numericSize = (item) => {
    const details = metadataFor(item).details || '';
    const match = details.match(/(\d+(?:\.\d+)?)\s*×\s*(\d+(?:\.\d+)?)/);
    if (!match) return Number.POSITIVE_INFINITY;
    const unitScale = /cm/i.test(details) ? 1 / 2.54 : 1;
    return Number(match[1]) * Number(match[2]) * unitScale * unitScale;
  };
  const numericPrice = (item) => Number((metadataFor(item).details || '').match(/\$([\d,]+)/)?.[1]?.replace(',', '') || Number.POSITIVE_INFINITY);
  const mediaElement = (media, title) => {
    const element = document.createElement(media.type === 'video' ? 'video' : 'img');
    if (media.type === 'video') { element.controls = true; element.muted = true; element.playsInline = true; element.preload = 'metadata'; }
    else {
      element.alt = title;
      // The full grid is the page's primary content. Eager loading prevents
      // browsers from withholding every thumbnail while the grid is laid out.
      element.loading = 'eager';
      element.decoding = 'async';
    }
    element.src = media.src;
    return element;
  };
  const screenWhiteBackground = (image, container) => {
    if (image.tagName !== 'IMG') return;
    const screen = () => {
      try {
        const canvas = document.createElement('canvas'); canvas.width = canvas.height = 36;
        const context = canvas.getContext('2d', { willReadFrequently: true }); context.drawImage(image, 0, 0, 36, 36);
        const pixels = context.getImageData(0, 0, 36, 36).data; let whitePixels = 0;
        for (let index = 0; index < pixels.length; index += 4) if (pixels[index] > 245 && pixels[index + 1] > 245 && pixels[index + 2] > 245 && pixels[index + 3] > 245) whitePixels += 1;
        if (whitePixels / 1296 >= 0.12) image.classList.add('white-is-transparent');
      } catch { /* Canvas screening is optional; the artwork still displays normally. */ }
    };
    image.addEventListener('load', screen, { once: true }); if (image.complete) screen();
  };
  const metadataFor = (item) => works[item.title] || { details: 'Documentation pending', tags: [] };
  const hdAliases = {
    'assets/img/paintings/her-1.png': 'assets/img/paintings HD/her.png',
    'assets/img/paintings/knust-1.png': 'assets/img/paintings HD/knust.png',
    'assets/img/paintings/fragmentation-1.png': 'assets/img/paintings HD/fragmentation.png',
    'assets/img/paintings/Før tanken.png': 'assets/img/paintings HD/Før tanken.JPG',
    "assets/img/paintings/It's Nooni-2.png": "assets/img/paintings HD/It-s Nooni-2.png"
  };
  const highResolutionSource = (media) => {
    if (media.type !== 'image') return null;
    return hdAliases[media.src] || media.src.replace('assets/img/paintings/', 'assets/img/paintings HD/');
  };
  const openDialog = (item, currentIndex = 0) => {
    dialogContent.replaceChildren();
    const selectedIndex = items.indexOf(item);
    const viewingOrder = [...items.slice(selectedIndex), ...items.slice(0, selectedIndex)];
    viewingOrder.forEach((work, workIndex) => {
      const metadata = metadataFor(work);
      const section = document.createElement('section'); section.className = 'painting-dialog__work'; section.dataset.galleryItem = work.id;
      const stage = document.createElement('div'); stage.className = 'painting-dialog__stage';
      const info = document.createElement('div'); info.className = 'painting-dialog__info';
      const heading = document.createElement('h2'); heading.textContent = metadata.title || work.title;
      const details = document.createElement('p'); details.textContent = metadata.details || '';
      info.append(heading, details);
      if (metadata.description) { const description = document.createElement('p'); description.textContent = metadata.description; info.append(description); }
      let activeIndex = workIndex === 0 ? currentIndex : 0;
      let zoom;
      const renderMedia = (index) => {
        activeIndex = index;
        stage.classList.remove('is-zoomed');
        stage.replaceChildren();
        stage.append(mediaElement(work.media[activeIndex], metadata.title || work.title));
        if (zoom) stage.append(zoom);
      };
      renderMedia(activeIndex);
      const hdSource = highResolutionSource(work.media[activeIndex]);
      if (work.media[activeIndex].type === 'image') {
        stage.classList.add('has-zoom');
        let zoomSource = work.media[activeIndex].src;
        zoom = document.createElement('button');
        zoom.className = 'painting-dialog__zoom'; zoom.type = 'button'; zoom.setAttribute('aria-label', 'Zoom in');
        zoom.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.25"></circle><path d="m15.2 15.2 5 5M10.5 7.5v6M7.5 10.5h6"></path></svg>';
        zoom.addEventListener('click', (event) => {
          event.stopPropagation();
          const zoomed = !stage.classList.contains('is-zoomed');
          stage.classList.toggle('is-zoomed', zoomed);
          zoom.setAttribute('aria-label', zoomed ? 'Zoom out' : 'Zoom in');
          if (zoomed) { stage.replaceChildren(); const image = mediaElement({ ...work.media[activeIndex], src: zoomSource }, metadata.title || work.title); stage.append(image, zoom); }
          else renderMedia(activeIndex);
        });
        stage.addEventListener('click', () => zoom.click());
        if (hdSource) {
        const probe = new Image();
        probe.addEventListener('load', () => {
          zoomSource = hdSource;
        }, { once: true });
        probe.src = hdSource;
        }
      }
      if (work.media.length > 1) {
        const views = document.createElement('div'); views.className = 'painting-dialog__views';
        work.media.forEach((_, viewIndex) => { const button = document.createElement('button'); button.textContent = viewIndex + 1; button.setAttribute('aria-label', `View ${viewIndex + 1}`); if (viewIndex === activeIndex) button.setAttribute('aria-current', 'true'); button.addEventListener('click', () => { renderMedia(viewIndex); views.querySelectorAll('button').forEach((viewButton, buttonIndex) => { if (buttonIndex === viewIndex) viewButton.setAttribute('aria-current', 'true'); else viewButton.removeAttribute('aria-current'); }); }); views.append(button); });
        info.append(views);
      }
      section.append(stage, info);
      dialogContent.append(section);
    });
    dialog.showModal();
    dialog.scrollTop = 0;
  };
  const renderItems = (visibleItems) => {
    grid.replaceChildren();
    visibleItems.forEach((item) => {
    const metadata = metadataFor(item);
    const fragment = template.content.cloneNode(true);
    const card = fragment.querySelector('.painting-card');
    const media = fragment.querySelector('.painting-card__media');
    const previewContainer = fragment.querySelector('.painting-card__preview');
    const fullscreenButton = fragment.querySelector('.painting-card__fullscreen');
    const title = metadata.title || item.title;
    let previewIndex = 0;
    const showPreview = () => {
      previewContainer.replaceChildren();
      const preview = mediaElement(item.media[previewIndex], title);
      if (preview.tagName === 'VIDEO') { preview.controls = false; preview.autoplay = true; preview.loop = true; }
      previewContainer.append(preview);
      screenWhiteBackground(preview, media);
    };
    showPreview();
    fullscreenButton.setAttribute('aria-label', `Open ${title} fullscreen`);
    fullscreenButton.addEventListener('click', () => openDialog(item, previewIndex));
    media.addEventListener('click', (event) => {
      if (!event.target.closest('button')) openDialog(item, previewIndex);
    });
    if (item.media.length > 1) {
      const addArrow = (direction, asset, label) => {
        const arrow = document.createElement('button');
        arrow.className = `painting-card__${direction}`;
        arrow.type = 'button';
        arrow.setAttribute('aria-label', `${label} view of ${title}`);
        const icon = document.createElement('img'); icon.src = asset; icon.alt = '';
        arrow.append(icon);
        arrow.addEventListener('click', () => { previewIndex = (previewIndex + (direction === 'next' ? 1 : -1) + item.media.length) % item.media.length; showPreview(); });
        media.append(arrow);
      };
      addArrow('previous', 'assets/img/leftarrow.png', 'Previous');
      addArrow('next', 'assets/img/rightarrow.png', 'Next');
    }
    fragment.querySelector('.painting-card__title').textContent = title;
    fragment.querySelector('.painting-card__details').textContent = metadata.details || '';
    fragment.querySelector('.painting-card__description').textContent = metadata.description || '';
    metadata.tags.forEach((tag) => { const li = document.createElement('li'); const button = document.createElement('button'); button.type = 'button'; button.textContent = tag; button.addEventListener('click', () => selectTag(tag)); li.append(button); fragment.querySelector('.painting-card__tags').append(li); });
    card.dataset.title = title;
    card.dataset.galleryItem = item.id;
      grid.append(fragment);
    });
  };
  const filterGroups = ['availability', 'medium', 'subject'];
  const selectedFilters = () => Object.fromEntries(filterGroups.map((group) => [group, [...controls.querySelectorAll(`input[name="${group}"]:checked`)].map((input) => input.value)]));
  const matchesSelections = (item, selections) => filterGroups.every((group) => selections[group].every((tag) => metadataFor(item).tags.includes(tag)));
  const updateFilterMenus = (selections) => {
    filterGroups.forEach((group) => {
      const selected = selections[group];
      const summary = controls.querySelector(`[data-filter-menu="${group}"] summary span`);
      const labels = [...controls.querySelectorAll(`input[name="${group}"]`)];
      summary.textContent = selected.length ? selected.join(', ') : group === 'availability' ? 'All works' : `All ${group === 'medium' ? 'media' : 'subjects'}`;
      labels.forEach((input) => {
        const candidate = { ...selections, [group]: [...new Set([...selected, input.value])] };
        input.disabled = !input.checked && !items.some((item) => matchesSelections(item, candidate));
      });
    });
  };
  const applyFilters = () => {
    const selections = selectedFilters();
    const visibleItems = items.filter((item) => matchesSelections(item, selections));
    const sort = controls.elements.sort.value;
    const sortBy = (metric, direction) => visibleItems.sort((left, right) => {
      const leftValue = metric(left);
      const rightValue = metric(right);
      if (!Number.isFinite(leftValue) && !Number.isFinite(rightValue)) return 0;
      if (!Number.isFinite(leftValue)) return 1;
      if (!Number.isFinite(rightValue)) return -1;
      return direction * (leftValue - rightValue);
    });
    if (sort === 'size-asc') sortBy(numericSize, 1);
    if (sort === 'size-desc') sortBy(numericSize, -1);
    if (sort === 'price-asc') sortBy(numericPrice, 1);
    if (sort === 'price-desc') sortBy(numericPrice, -1);
    renderItems(visibleItems);
    updateFilterMenus(selections);
  };
  const filterGroupForTag = (tag) => ({ 'For Sale': 'availability', 'Spray Paint': 'medium', Ink: 'medium', Vinyl: 'medium', Glass: 'medium', Acrylic: 'medium', People: 'subject', Nature: 'subject', Abstract: 'subject', Tendrils: 'subject', Psychedelic: 'subject' })[tag];
  const selectTag = (tag) => {
    const group = filterGroupForTag(tag);
    if (!group) return;
    const input = controls.querySelector(`input[name="${group}"][value="${tag}"]`);
    if (!input) return;
    controls.querySelectorAll(`input[name="${group}"]`).forEach((option) => { option.checked = false; });
    input.checked = true;
    controls.querySelector(`[data-filter-menu="${group}"]`).open = true;
    applyFilters();
  };
  controls.querySelectorAll('.paintings-filter').forEach((menu) => {
    menu.addEventListener('toggle', () => {
      if (!menu.open) return;
      controls.querySelectorAll('.paintings-filter[open]').forEach((otherMenu) => { if (otherMenu !== menu) otherMenu.open = false; });
    });
  });
  document.addEventListener('pointerdown', (event) => {
    if (controls.contains(event.target)) return;
    controls.querySelectorAll('.paintings-filter[open]').forEach((menu) => { menu.open = false; });
  });
  controls.addEventListener('change', applyFilters);
  applyFilters();
  const closeViewer = () => {
    const sections = [...dialogContent.querySelectorAll('[data-gallery-item]')];
    const lastViewed = sections.reduce((closest, section) => {
      const rect = section.getBoundingClientRect();
      const visibleHeight = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
      return !closest || visibleHeight > closest.visibleHeight ? { id: section.dataset.galleryItem, visibleHeight } : closest;
    }, null);
    dialog.close();
    const destination = lastViewed && grid.querySelector(`[data-gallery-item="${lastViewed.id}"]`);
    if (destination) window.requestAnimationFrame(() => destination.scrollIntoView({ block: 'center', behavior: 'auto' }));
  };
  document.querySelector('.painting-dialog__close').addEventListener('click', closeViewer);
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); closeViewer(); });
  dialog.addEventListener('click', (event) => { if (event.target === dialog) closeViewer(); });
})();
