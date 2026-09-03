(() => {
  const grid = document.querySelector('[data-digital-grid]');
  const template = document.querySelector('[data-digital-template]');
  const dialog = document.querySelector('[data-digital-dialog]');
  const dialogContent = document.querySelector('[data-digital-dialog-content]');
  const controls = document.querySelector('[data-digital-controls]');
  if (!grid || !template || !dialog || !dialogContent || !controls) return;
  let dialogHistory;

  const mediumByTitle = {
    'Kalyāṇa-mittatā': ['Apple Keynote'], Adam: ['Apple Keynote'], Exit: ['Apple Keynote'],
    'COVID 19 MASK FIG. 1.': ['Adobe Photoshop'],
    Fibonacci: ['Adobe Illustrator', 'Apple Keynote'], Tao: ['Adobe Illustrator'], Caesarea: ['Adobe Illustrator'],
    Ubhaya: ['Adobe Illustrator'], Colouring: ['Adobe Illustrator'], 'No tree, it is said': ['Adobe Illustrator'],
    Anatta: ['Adobe Illustrator'], Eden: ['Adobe Illustrator'], ABIOSES: ['Adobe Illustrator'], Barry: ['Adobe Illustrator'],
    'Gary Barwin Birthday Card 2026': ['Adobe Illustrator'], Citta: ['Adobe Illustrator'], 'COVID 19 Tree': ['Adobe Illustrator']
  };
  const preferredTitles = ['Anatta', 'Barry', 'Citta', 'ABIOSES', 'Caesarea', 'Ubhaya', 'Exit', 'Homage to MF DOOM'];
  const preferredOrder = new Map(preferredTitles.map((title, index) => [title, index]));
  const yearByTitle = {
    'Kalyāṇa-mittatā': 2018, 'Lysergic Juddering': 2018, Adam: 2019, Exit: 2019,
    'COVID 19 MASK FIG. 1.': 2019, 'COVID 19 Tree': 2019, 'Homage to MF DOOM': 2020,
    Fibonacci: 2021, Anatta: 2023, Eden: 2023, ABIOSES: 2024, Barry: 2024, Citta: 2024,
    'Gary Barwin Birthday Card 2026': 2026
  };
  const allItems = (window.INFINITE_GALLERY_MEDIA?.items?.filter((item) => item.category === 'digital') || []).sort((left, right) => (
    (preferredOrder.get(left.title) ?? Number.POSITIVE_INFINITY) - (preferredOrder.get(right.title) ?? Number.POSITIVE_INFINITY)
  ));
  const tagsFor = (item) => mediumByTitle[item.title] || [];
  const mediaElement = (media, title) => {
    const element = document.createElement(media.type === 'video' ? 'video' : 'img');
    if (media.type === 'video') { element.controls = true; element.muted = true; element.playsInline = true; }
    else { element.alt = title; element.loading = 'eager'; element.decoding = 'async'; }
    element.src = media.src;
    return element;
  };
  const screenWhiteBackground = (image) => {
    if (image.tagName !== 'IMG') return;
    const screen = () => {
      try {
        const canvas = document.createElement('canvas'); canvas.width = canvas.height = 36;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.drawImage(image, 0, 0, 36, 36);
        const pixels = context.getImageData(0, 0, 36, 36).data; let whitePixels = 0;
        for (let index = 0; index < pixels.length; index += 4) if (pixels[index] > 245 && pixels[index + 1] > 245 && pixels[index + 2] > 245 && pixels[index + 3] > 245) whitePixels += 1;
        if (whitePixels / 1296 >= 0.12) image.classList.add('white-is-transparent');
      } catch {}
    };
    image.addEventListener('load', screen, { once: true });
    if (image.complete) screen();
  };
  const openViewer = (item, selectedView = 0) => {
    const start = allItems.indexOf(item); const order = [...allItems.slice(start), ...allItems.slice(0, start)]; dialogContent.replaceChildren(); dialog.onkeydown = null;
    order.forEach((work, workIndex) => {
      const section = document.createElement('section'); section.className = 'painting-dialog__work'; section.dataset.digitalItem = work.id;
      const stage = document.createElement('div'); stage.className = 'painting-dialog__stage'; const info = document.createElement('div'); info.className = 'painting-dialog__info'; const heading = document.createElement('h2'); heading.textContent = work.title; info.append(heading);
      let viewIndex = workIndex === 0 ? selectedView : 0;
      const zoom = window.createArtworkZoom(stage);
      const render = () => { const media = mediaElement(work.media[viewIndex], work.title); screenWhiteBackground(media); zoom.render(media); };
      render();
      if (work.media.length > 1) { const views = document.createElement('div'); views.className = 'painting-dialog__views'; work.media.forEach((_, index) => { const button = document.createElement('button'); button.textContent = index + 1; if (index === viewIndex) button.setAttribute('aria-current', 'true'); button.addEventListener('click', () => { viewIndex = index; render(); views.querySelectorAll('.painting-dialog__view-number').forEach((view, position) => position === index ? view.setAttribute('aria-current', 'true') : view.removeAttribute('aria-current')); }); button.className = 'painting-dialog__view-number'; views.append(button); }); const viewButtons = [...views.querySelectorAll('.painting-dialog__view-number')]; const selectView = (index) => viewButtons[(index + viewButtons.length) % viewButtons.length].click(); const previous = document.createElement('button'); previous.className = 'painting-dialog__view-arrow painting-dialog__view-arrow--previous'; previous.type = 'button'; previous.setAttribute('aria-label', 'Previous image'); previous.textContent = '‹'; previous.onclick = (event) => { event.stopPropagation(); selectView(viewIndex - 1); }; const next = document.createElement('button'); next.className = 'painting-dialog__view-arrow painting-dialog__view-arrow--next'; next.type = 'button'; next.setAttribute('aria-label', 'Next image'); next.textContent = '›'; next.onclick = (event) => { event.stopPropagation(); selectView(viewIndex + 1); }; stage.append(previous, next); let swipeStart; stage.addEventListener('touchstart', (event) => { swipeStart = event.changedTouches[0]?.clientX; }, { passive: true }); stage.addEventListener('touchend', (event) => { const delta = event.changedTouches[0]?.clientX - swipeStart; if (!stage.classList.contains('is-zoomed') && Math.abs(delta) > 45) selectView(delta < 0 ? viewIndex + 1 : viewIndex - 1); }, { passive: true }); if (workIndex === 0) dialog.onkeydown = (event) => { if (event.key === 'ArrowLeft') { event.preventDefault(); selectView(viewIndex - 1); } if (event.key === 'ArrowRight') { event.preventDefault(); selectView(viewIndex + 1); } }; info.append(views); }
      section.append(stage, info); dialogContent.append(section);
    }); dialog.showModal(); dialogHistory?.opened(); dialog.scrollTop = 0;
  };
  const selectMedium = (tag) => { controls.querySelectorAll('input[name="medium"]').forEach((input) => { input.checked = input.value === tag; }); applyFilters(); };
  const renderItems = (items) => {
    grid.replaceChildren();
    items.forEach((item) => {
      const fragment = template.content.cloneNode(true); const card = fragment.querySelector('.painting-card'); const media = fragment.querySelector('.painting-card__media'); const preview = fragment.querySelector('.painting-card__preview'); const fullscreen = fragment.querySelector('.painting-card__fullscreen'); let viewIndex = 0;
      const render = () => { preview.replaceChildren(); const element = mediaElement(item.media[viewIndex], item.title); if (element.tagName === 'VIDEO') { element.controls = false; element.autoplay = true; element.loop = true; } preview.append(element); screenWhiteBackground(element); };
      render(); fullscreen.addEventListener('click', () => openViewer(item, viewIndex)); media.addEventListener('click', (event) => { if (!event.target.closest('button')) openViewer(item, viewIndex); });
      if (item.media.length > 1) ['previous', 'next'].forEach((direction) => { const button = document.createElement('button'); button.className = `painting-card__${direction}`; button.type = 'button'; const icon = document.createElement('img'); icon.src = `assets/img/${direction === 'previous' ? 'leftarrow' : 'rightarrow'}.png`; icon.alt = ''; button.append(icon); button.addEventListener('click', () => { viewIndex = (viewIndex + (direction === 'next' ? 1 : -1) + item.media.length) % item.media.length; render(); }); media.append(button); });
      fragment.querySelector('.painting-card__title').textContent = item.title;
      tagsFor(item).forEach((tag) => { const li = document.createElement('li'); const button = document.createElement('button'); button.type = 'button'; button.textContent = tag; button.addEventListener('click', () => selectMedium(tag)); li.append(button); fragment.querySelector('.painting-card__tags').append(li); });
      card.dataset.digitalItem = item.id; grid.append(fragment);
    });
  };
  const updateFilter = (selected) => { controls.querySelector('[data-filter-menu="medium"] summary span').textContent = selected.length ? selected.join(', ') : 'All media'; };
  const applyFilters = () => {
    const selected = [...controls.querySelectorAll('input[name="medium"]:checked')].map((input) => input.value);
    const visible = allItems.filter((item) => selected.every((tag) => tagsFor(item).includes(tag)));
    if (controls.elements.sort.value === 'title') visible.sort((left, right) => left.title.localeCompare(right.title));
    if (controls.elements.sort.value === 'date-desc') visible.sort((left, right) => (
      (yearByTitle[right.title] ?? -Infinity) - (yearByTitle[left.title] ?? -Infinity)
    ));
    if (controls.elements.sort.value === 'date-asc') visible.sort((left, right) => (
      (yearByTitle[left.title] ?? Infinity) - (yearByTitle[right.title] ?? Infinity)
    ));
    renderItems(visible); updateFilter(selected);
  };
  controls.querySelectorAll('.paintings-filter').forEach((menu) => menu.addEventListener('toggle', () => { if (menu.open) controls.querySelectorAll('.paintings-filter[open]').forEach((other) => { if (other !== menu) other.open = false; }); }));
  document.addEventListener('pointerdown', (event) => { if (!controls.contains(event.target)) controls.querySelectorAll('.paintings-filter[open]').forEach((menu) => { menu.open = false; }); });
  controls.addEventListener('change', applyFilters); applyFilters();
  const closeViewer = () => { if (dialogHistory?.closeRequested()) return; dialog.close(); };
  dialogHistory = window.setupArtworkDialogHistory(dialog, closeViewer);
  document.querySelector('.painting-dialog__close').addEventListener('click', closeViewer); dialog.addEventListener('cancel', (event) => { event.preventDefault(); closeViewer(); });
})();
