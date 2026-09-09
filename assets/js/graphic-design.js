(() => {
  const template = document.querySelector('[data-graphic-template]');
  const dialog = document.querySelector('[data-graphic-dialog]');
  const dialogContent = document.querySelector('[data-graphic-dialog-content]');
  const controls = document.querySelector('[data-graphic-controls]');
  if (!template || !dialog || !dialogContent || !controls) return;
  const backButton = document.querySelector('.graphic-header .paintings-back');
  const palmierSection = document.querySelector('.graphic-section--palmier');
  const updateBackButtonBackground = () => { if (!backButton || !palmierSection) return; const button = backButton.getBoundingClientRect(); const section = palmierSection.getBoundingClientRect(); const buttonCenter = button.top + button.height / 2; backButton.classList.toggle('is-over-palmier', buttonCenter >= section.top && buttonCenter <= section.bottom); };
  addEventListener('scroll', updateBackButtonBackground, { passive: true }); addEventListener('resize', updateBackButtonBackground); updateBackButtonBackground();
  let dialogHistory;

  const metadata = {
    'Be Like Us 2020': { title: 'Be Like Us', year: 2020, types: ['Logo', 'Apparel'], description: 'Created after Blue Skies music festival was cancelled in 2020, combining festival bracelets and a rearranged Blue Skies logo. It later became the T-shirt design for the first New Skies festival.' },
    'Jacked Up Shirt': { types: ['Apparel'], description: 'Apparel graphic and merchandise design.' },
    'Lotzah design': { types: ['Branding', 'Logo'], description: 'Identity and logo exploration.' },
    'New Skies 2025': { year: 2025, types: ['Branding', 'Apparel'], description: 'Merchandise and identity system for New Skies 2025.' },
    'SATI LOGO': { title: 'SATI Logo', types: ['Logo'], description: 'Logo and identity design for SATI.' },
    'Wakefield Does Wakefield': { types: ['Branding'], description: 'Campaign identity for Wakefield Does Wakefield.' },
    "WE DON'T CARE Cover Art": { year: 2020, types: ['Cover Art'], description: 'Cover art for “WE DON’T CARE” by Fat Jack and Moxie of Nothin’ But Mental.' },

    'Cocktails menu': { types: ['Menu'], description: 'Cocktail menu design for Palmier.' },
    'Iced drink menu': { types: ['Menu'], description: 'Iced drink menu design for Palmier.' },
    Menu: { types: ['Menu'], description: 'Morning and evening menu designs for Palmier.' },
    'Pastry Tag': { types: ['Branding', 'Product'], description: 'Pastry display tag designed for Palmier.' },
    tea: { title: 'Tea', types: ['Menu', 'Product'], description: 'Tea menu and product graphic for Palmier.' },
    'Wifi Card': { title: 'Wi-Fi Card', types: ['Branding'], description: 'Guest Wi-Fi card designed for Palmier.' },
    'Business Cards': { types: ['Branding'], description: 'Business card design for Palmier.' },

    Explosion: { types: ['Branding'], description: 'Brand illustration for The Hot Sauce Co.' },
    ModernText: { title: 'Modern Text', types: ['Branding'], description: 'Typography exploration for The Hot Sauce Co.' },
    Neon: { types: ['Branding'], description: 'Neon-style brand graphic for The Hot Sauce Co.' },
    Sweater: { types: ['Apparel'], description: 'Apparel design for The Hot Sauce Co.' },
    'Traffic Light': { types: ['Branding'], description: 'Brand campaign graphic for The Hot Sauce Co.' },
    'Which Sauces?': { types: ['Social Media'], description: 'Social campaign graphic for The Hot Sauce Co.' },
    'Black Coffee & Bourbon': { types: ['Product', 'Social Media'], description: 'Sweet and smooth: rich black coffee, smoky bourbon, and the subtle sweetness of smoked cane sugar create a bold, balanced flavour.' },
    Hab_Herb: { title: 'Habanero & Herbs', types: ['Product', 'Social Media'], description: 'A combination of yellow sweet peppers and habaneros with freshly ground herbs and spices creates a subtle, spicy, fresh, and earthy flavour.' },
    Hab_Mango: { title: 'Habanero & Mango', types: ['Product', 'Social Media'], description: 'The original Habanero & Mango sauce pairs tropical sweetness with full-flavoured heat.' },
    Peppers_pickles: { title: 'Peppers & Pickles', types: ['Product', 'Social Media'], description: 'Product campaign design for The Hot Sauce Co.' },
    'Silver&Ghost-02': { title: 'Silver & Ghost', types: ['Product', 'Social Media'], description: 'Product campaign design for The Hot Sauce Co.’s Silver & Ghost sauce.' },
    UrbanRootsRoastedRed: { title: 'Roasted Jalapeño & Red Pepper', types: ['Product', 'Social Media'], description: 'Campaign highlighting Urban Roots London, a non-profit urban agriculture project distributing locally grown produce through community partners.' },
    BrainOnFire: { title: 'Brain on Fire', types: ['Social Media'], description: 'Educational social campaign for The Hot Sauce Co.' },
    CapsaicinGreen: { title: 'Capsaicin', types: ['Social Media'], description: 'Educational social campaign about capsaicin for The Hot Sauce Co.' },
    'High on hot sauce': { title: 'High on Hot Sauce', types: ['Social Media'], description: 'Educational social campaign for The Hot Sauce Co.' },
    HowManyPeopleeat: { title: 'How Many People Eat Hot Sauce?', types: ['Social Media'], description: 'Educational social campaign for The Hot Sauce Co.' },
    Scoville: { types: ['Social Media'], description: 'Educational social campaign about the Scoville scale for The Hot Sauce Co.' },
    VitaminsDarkBlue: { title: 'Vitamins', types: ['Social Media'], description: 'Educational social campaign about vitamins in hot sauce.' }
  };
  const items = window.INFINITE_GALLERY_MEDIA?.items?.filter((item) => item.category === 'graphic-design' && item.title !== 'Explosion') || [];
  const defaultOrder = new Map(items.map((item, index) => [item.id, index]));
  const sectionOf = (item) => item.media[0].src.includes('/THSCO/') ? 'thsco' : item.media[0].src.includes('/Palmier/') ? 'palmier' : 'general';
  const clientFor = (item) => ({ general: 'Independent', thsco: 'The Hot Sauce Co.', palmier: 'Palmier' })[sectionOf(item)];
  const metadataFor = (item) => metadata[item.title] || { types: ['Branding'], description: 'Graphic design project.' };
  const titleFor = (item) => metadataFor(item).title || item.title;
  const siteFor = (item) => sectionOf(item) === 'thsco' ? 'https://thehotsauceco.com' : sectionOf(item) === 'palmier' ? 'https://cafepalmier.ca' : null;
  const mediaElement = (media, title) => { const element = document.createElement(media.type === 'video' ? 'video' : 'img'); if (media.type === 'video') { element.controls = true; element.muted = true; element.playsInline = true; } else { element.alt = title; element.loading = 'eager'; element.decoding = 'async'; } element.src = media.src.split('/').map(encodeURIComponent).join('/'); return element; };
  const screenWhiteBackground = (image) => { if (image.tagName !== 'IMG') return; const screen = () => { try { const canvas = document.createElement('canvas'); canvas.width = canvas.height = 36; const context = canvas.getContext('2d', { willReadFrequently: true }); context.drawImage(image, 0, 0, 36, 36); const pixels = context.getImageData(0, 0, 36, 36).data; let whitePixels = 0; for (let index = 0; index < pixels.length; index += 4) if (pixels[index] > 245 && pixels[index + 1] > 245 && pixels[index + 2] > 245 && pixels[index + 3] > 245) whitePixels += 1; if (whitePixels / 1296 >= 0.12) image.classList.add('white-is-transparent'); } catch { /* Optional screening. */ } }; image.addEventListener('load', screen, { once: true }); if (image.complete) screen(); };
  const highResolutionSource = (media) => media.type === 'image' ? media.src.replace('assets/img/Graphic Design/', 'assets/img/Graphic Design HD/') : null;

  const openViewer = (item, selectedView = 0) => {
    dialog.classList.remove('painting-dialog--palmier-site', 'is-palmier-page-open');
    const collection = items.filter((work) => sectionOf(work) === sectionOf(item));
    const start = collection.indexOf(item); const order = [...collection.slice(start), ...collection.slice(0, start)];
    dialogContent.replaceChildren(); dialog.onkeydown = null;
    order.forEach((work, workIndex) => {
      const details = metadataFor(work); const section = document.createElement('section'); section.className = 'painting-dialog__work'; section.dataset.graphicItem = work.id;
      const stage = document.createElement('div'); stage.className = 'painting-dialog__stage'; const zoom = window.createArtworkZoom(stage);
      const info = document.createElement('div'); info.className = 'painting-dialog__info'; const title = document.createElement('h2'); title.textContent = titleFor(work); info.append(title);
      if (details.year) { const year = document.createElement('p'); year.textContent = details.year; info.append(year); }
      const description = document.createElement('p'); description.textContent = details.description; info.append(description);
      const site = siteFor(work); if (site) { const link = document.createElement('a'); link.className = 'painting-dialog__visit'; link.href = site; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'Visit Site'; info.append(link); }
      let viewIndex = workIndex === 0 ? selectedView : 0;
      const render = () => { const media = work.media[viewIndex]; const element = mediaElement(media, titleFor(work)); screenWhiteBackground(element); zoom.render(element); if (media.type === 'image') { const candidate = highResolutionSource(media); const probe = new Image(); probe.addEventListener('load', () => zoom.setZoomSource(candidate), { once: true }); probe.src = candidate; } };
      render();
      if (work.media.length > 1) { const views = document.createElement('div'); views.className = 'painting-dialog__views'; work.media.forEach((_, index) => { const button = document.createElement('button'); button.type = 'button'; button.textContent = index + 1; button.setAttribute('aria-label', `View ${index + 1}`); if (index === viewIndex) button.setAttribute('aria-current', 'true'); button.addEventListener('click', () => { viewIndex = index; render(); views.querySelectorAll('.painting-dialog__view-number').forEach((view, position) => position === index ? view.setAttribute('aria-current', 'true') : view.removeAttribute('aria-current')); }); button.className = 'painting-dialog__view-number'; views.append(button); }); const viewButtons = [...views.querySelectorAll('.painting-dialog__view-number')]; const selectView = (index) => viewButtons[(index + viewButtons.length) % viewButtons.length].click(); const previous = document.createElement('button'); previous.className = 'painting-dialog__view-arrow painting-dialog__view-arrow--previous'; previous.type = 'button'; previous.setAttribute('aria-label', 'Previous image'); previous.textContent = '‹'; previous.onclick = (event) => { event.stopPropagation(); selectView(viewIndex - 1); }; const next = document.createElement('button'); next.className = 'painting-dialog__view-arrow painting-dialog__view-arrow--next'; next.type = 'button'; next.setAttribute('aria-label', 'Next image'); next.textContent = '›'; next.onclick = (event) => { event.stopPropagation(); selectView(viewIndex + 1); }; stage.append(previous, next); let swipeStart; stage.addEventListener('touchstart', (event) => { swipeStart = event.changedTouches[0]?.clientX; }, { passive: true }); stage.addEventListener('touchend', (event) => { const delta = event.changedTouches[0]?.clientX - swipeStart; if (!stage.classList.contains('is-zoomed') && Math.abs(delta) > 45) selectView(delta < 0 ? viewIndex + 1 : viewIndex - 1); }, { passive: true }); if (workIndex === 0) dialog.onkeydown = (event) => { if (event.key === 'ArrowLeft') { event.preventDefault(); selectView(viewIndex - 1); } if (event.key === 'ArrowRight') { event.preventDefault(); selectView(viewIndex + 1); } }; info.append(views); }
      section.append(stage, info); dialogContent.append(section);
    });
    dialog.showModal(); dialogHistory?.opened(); dialog.scrollTop = 0;
  };

  const openPalmierMenus = (item) => {
    dialog.classList.remove('painting-dialog--palmier-site', 'is-palmier-page-open');
    dialogContent.replaceChildren(); dialog.onkeydown = null;
    const menus = document.createElement('section');
    menus.className = 'palmier-menu-dialog';
    const stage = document.createElement('div');
    stage.className = 'painting-dialog__stage';
    const composite = document.createElement('div');
    composite.className = 'palmier-menu-composite';
    composite.dataset.zoomable = 'true';
    item.media.forEach((menu, index) => { const image = mediaElement(menu, `Palmier menu ${index + 1}`); screenWhiteBackground(image); composite.append(image); });
    window.createArtworkZoom(stage).render(composite);
    menus.append(stage);
    dialogContent.append(menus);
    dialog.showModal(); dialogHistory?.opened(); dialog.scrollTop = 0;
  };

  const openPalmierSite = () => {
    dialog.classList.add('painting-dialog--palmier-site');
    dialog.classList.remove('is-palmier-page-open');
    dialogContent.replaceChildren(); dialog.onkeydown = null;
    const frame = document.createElement('iframe');
    frame.className = 'palmier-site-frame';
    frame.src = 'assets/projects/Menus-2%20Palmier%20Hosted/index.html?v=20260908e';
    frame.title = 'Palmier website preview';
    frame.addEventListener('load', () => { try { frame.contentDocument.documentElement.classList.add('palmier-embedded'); } catch { /* The preview remains usable if iframe access is unavailable. */ } });
    dialogContent.append(frame);
    dialog.showModal(); dialogHistory?.opened(); dialog.scrollTop = 0;
  };
  window.addEventListener('message', (event) => { const frame = dialogContent.querySelector('.palmier-site-frame'); if (!dialog.open || event.source !== frame?.contentWindow) return; if (event.data?.type === 'palmier-close-preview') { closeViewer(); return; } if (event.data?.type === 'palmier-page-opened') dialog.classList.add('is-palmier-page-open'); });

  const selectedFilters = () => ({ client: [...controls.querySelectorAll('input[name="client"]:checked')].map((input) => input.value), type: [...controls.querySelectorAll('input[name="type"]:checked')].map((input) => input.value) });
  const matches = (item, filters) => (!filters.client.length || filters.client.includes(clientFor(item))) && filters.type.every((type) => metadataFor(item).types.includes(type));
  const selectTag = (tag) => { const group = ['Independent', 'The Hot Sauce Co.', 'Palmier'].includes(tag) ? 'client' : 'type'; const input = controls.querySelector(`input[name="${group}"][value="${tag}"]`); if (!input) return; controls.querySelectorAll(`input[name="${group}"]`).forEach((option) => { option.checked = false; }); input.checked = true; controls.querySelector(`[data-filter-menu="${group}"]`).open = true; applyFilters(); };
  const updateMenus = (filters) => { [['client', 'All sections'], ['type', 'All types']].forEach(([group, fallback]) => { const selected = filters[group]; controls.querySelector(`[data-filter-menu="${group}"] summary span`).textContent = selected.length ? selected.join(', ') : fallback; controls.querySelectorAll(`input[name="${group}"]`).forEach((input) => { const candidate = { ...filters, [group]: [...new Set([...selected, input.value])] }; input.disabled = !input.checked && !items.some((item) => matches(item, candidate)); }); }); };
  const cardFor = (item) => { const details = metadataFor(item); const fragment = template.content.cloneNode(true); const card = fragment.querySelector('.painting-card'); if (item.title === 'Wifi Card') card.classList.add('painting-card--wifi-card'); const media = fragment.querySelector('.painting-card__media'); const preview = fragment.querySelector('.painting-card__preview'); const navigation = fragment.querySelector('.painting-card__navigation'); let viewIndex = 0; const render = () => { preview.replaceChildren(); const element = mediaElement(item.media[viewIndex], titleFor(item)); if (item.title === 'Jacked Up Shirt' && element.tagName === 'IMG') element.src = 'assets/img/Graphic Design Thumbnails/Jacked Up Shirt.png'; if (element.tagName === 'VIDEO') { element.controls = false; element.autoplay = true; element.loop = true; } preview.append(element); screenWhiteBackground(element); navigation.querySelectorAll('.painting-card__dot').forEach((dot, index) => { if (index === viewIndex) dot.setAttribute('aria-current', 'true'); else dot.removeAttribute('aria-current'); }); }; render(); media.addEventListener('click', (event) => { if (!event.target.closest('button')) openViewer(item, viewIndex); }); if (item.media.length > 1) { const addArrow = (direction, label) => { const button = document.createElement('button'); button.className = `painting-card__${direction}`; button.type = 'button'; button.setAttribute('aria-label', `${label} view of ${titleFor(item)}`); const icon = document.createElement('img'); icon.src = `assets/img/${direction === 'previous' ? 'leftarrow' : 'rightarrow'}.png`; icon.alt = ''; button.append(icon); button.addEventListener('click', () => { viewIndex = (viewIndex + (direction === 'next' ? 1 : -1) + item.media.length) % item.media.length; render(); }); navigation.append(button); }; addArrow('previous', 'Previous'); const dots = document.createElement('div'); dots.className = 'painting-card__dots'; item.media.forEach((_, index) => { const dot = document.createElement('button'); dot.className = 'painting-card__dot'; dot.type = 'button'; dot.setAttribute('aria-label', `View ${index + 1} of ${item.media.length} for ${titleFor(item)}`); if (index === viewIndex) dot.setAttribute('aria-current', 'true'); dot.addEventListener('click', () => { viewIndex = index; render(); }); dots.append(dot); }); navigation.append(dots); addArrow('next', 'Next'); } fragment.querySelector('.painting-card__title').textContent = titleFor(item); fragment.querySelector('.painting-card__description').textContent = details.description; [clientFor(item), ...details.types].forEach((tag) => { const li = document.createElement('li'); const button = document.createElement('button'); button.type = 'button'; button.textContent = tag; button.addEventListener('click', () => selectTag(tag)); li.append(button); fragment.querySelector('.painting-card__tags').append(li); }); card.dataset.graphicItem = item.id; return { fragment, card }; };
  const palmierMenuCard = (item) => { const { fragment, card } = cardFor(item); const preview = fragment.querySelector('.painting-card__preview'); preview.replaceChildren(); const pair = document.createElement('div'); pair.className = 'palmier-menu-pair'; item.media.forEach((menu, index) => { const button = document.createElement('button'); button.type = 'button'; button.setAttribute('aria-label', `Open Palmier menus, starting with menu ${index + 1}`); button.append(mediaElement(menu, `Palmier menu ${index + 1}`)); button.addEventListener('click', () => openPalmierMenus(item)); pair.append(button); }); preview.append(pair); fragment.querySelector('.painting-card__navigation').replaceChildren(); return { fragment, card }; };
  const palmierSiteCard = () => { const previews = [
    ['Coffee', 'assets/img/Graphic Design/Palmier/Website Videos/coffee.m4v'],
    ['Food', 'assets/img/Graphic Design/Palmier/Website Videos/food.m4v'],
    ['Hours & Location', 'assets/img/Graphic Design/Palmier/Website Videos/hours:location.m4v'],
    ['Cocktails & Iced Drinks', 'assets/img/Graphic Design/Palmier/Website Videos/cocktails:iceddrinks.m4v'],
    ['Coffee Shelf', 'assets/img/Graphic Design/Palmier/Website Videos/cofffeeshelf.m4v']
  ]; const fragment = template.content.cloneNode(true); const media = fragment.querySelector('.painting-card__media'); const preview = fragment.querySelector('.painting-card__preview'); const navigation = fragment.querySelector('.painting-card__navigation'); preview.classList.add('palmier-site-preview'); let viewIndex = 0; const render = () => { preview.replaceChildren(); const [label, src] = previews[viewIndex]; const video = document.createElement('video'); video.src = src.split('/').map(encodeURIComponent).join('/'); video.autoplay = true; video.loop = true; video.muted = true; video.playsInline = true; video.preload = 'metadata'; video.setAttribute('aria-label', `${label} website preview`); preview.append(video); navigation.querySelectorAll('.painting-card__dot').forEach((dot, index) => index === viewIndex ? dot.setAttribute('aria-current', 'true') : dot.removeAttribute('aria-current')); }; const changeView = (next) => { viewIndex = (next + previews.length) % previews.length; render(); }; render(); media.setAttribute('role', 'button'); media.tabIndex = 0; media.setAttribute('aria-label', 'Open Palmier website preview'); media.addEventListener('click', (event) => { if (!event.target.closest('button')) openPalmierSite(); }); media.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openPalmierSite(); } }); const addArrow = (direction, label) => { const button = document.createElement('button'); button.className = `painting-card__${direction}`; button.type = 'button'; button.setAttribute('aria-label', `${label} website preview`); const icon = document.createElement('img'); icon.src = `assets/img/${direction === 'previous' ? 'leftarrow' : 'rightarrow'}.png`; icon.alt = ''; button.append(icon); button.addEventListener('click', () => changeView(viewIndex + (direction === 'next' ? 1 : -1))); navigation.append(button); }; addArrow('previous', 'Previous'); const dots = document.createElement('div'); dots.className = 'painting-card__dots'; previews.forEach(([label], index) => { const dot = document.createElement('button'); dot.className = 'painting-card__dot'; dot.type = 'button'; dot.setAttribute('aria-label', `Show ${label} website preview`); if (index === viewIndex) dot.setAttribute('aria-current', 'true'); dot.addEventListener('click', () => changeView(index)); dots.append(dot); }); navigation.append(dots); addArrow('next', 'Next'); fragment.querySelector('.painting-card__title').textContent = 'Palmier Website'; fragment.querySelector('.painting-card__description').textContent = 'Website design and development for Palmier.'; const tags = fragment.querySelector('.painting-card__tags'); ['Palmier', 'Branding'].forEach((tag) => { const li = document.createElement('li'); const button = document.createElement('button'); button.type = 'button'; button.textContent = tag; button.addEventListener('click', () => selectTag(tag)); li.append(button); tags.append(li); }); return fragment; };

  const renderItems = (visibleItems) => {
    document.querySelectorAll('[data-graphic-grid]').forEach((container) => container.replaceChildren());
    ['general', 'thsco', 'palmier'].forEach((name) => { const sectionItems = visibleItems.filter((item) => sectionOf(item) === name); const grid = document.querySelector(`[data-graphic-grid="${name}"]`); document.querySelector(`[data-graphic-section="${name}"]`).hidden = sectionItems.length === 0; if (name === 'palmier' && (!selectedFilters().type.length || selectedFilters().type.includes('Branding'))) grid.append(palmierSiteCard()); sectionItems.forEach((item) => { const { fragment } = cardFor(item); grid.append(fragment); }); });
  };
  function applyFilters() { const filters = selectedFilters(); const visible = items.filter((item) => matches(item, filters)); const sort = controls.elements.sort.value; if (sort === 'default') visible.sort((a, b) => defaultOrder.get(a.id) - defaultOrder.get(b.id)); if (sort === 'title-asc') visible.sort((a, b) => titleFor(a).localeCompare(titleFor(b))); if (sort === 'title-desc') visible.sort((a, b) => titleFor(b).localeCompare(titleFor(a))); renderItems(visible); updateMenus(filters); }
  controls.querySelectorAll('.paintings-filter').forEach((menu) => menu.addEventListener('toggle', () => { if (menu.open) controls.querySelectorAll('.paintings-filter[open]').forEach((other) => { if (other !== menu) other.open = false; }); }));
  document.addEventListener('pointerdown', (event) => { if (!controls.contains(event.target)) controls.querySelectorAll('.paintings-filter[open]').forEach((menu) => { menu.open = false; }); });
  controls.addEventListener('change', applyFilters); applyFilters();
  const closeViewer = () => { if (dialogHistory?.closeRequested()) return; dialog.close(); };
  dialogHistory = window.setupArtworkDialogHistory(dialog, closeViewer);
  document.querySelector('.painting-dialog__close').addEventListener('click', closeViewer);
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); closeViewer(); });
})();
