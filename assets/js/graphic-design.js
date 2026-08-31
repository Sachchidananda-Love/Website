(() => {
  const template = document.querySelector('[data-graphic-template]');
  const dialog = document.querySelector('[data-graphic-dialog]');
  const dialogContent = document.querySelector('[data-graphic-dialog-content]');
  if (!template || !dialog || !dialogContent) return;
  const items = window.INFINITE_GALLERY_MEDIA?.items?.filter((item) => item.category === 'graphic-design') || [];
  const sectionOf = (item) => item.media[0].src.includes('/THSCO/') ? 'thsco' : item.media[0].src.includes('/Palmier/') ? 'palmier' : 'general';
  const mediaElement = (media, title) => { const element = document.createElement(media.type === 'video' ? 'video' : 'img'); if (media.type === 'video') { element.controls = true; element.muted = true; element.playsInline = true; } else { element.alt = title; element.loading = 'eager'; element.decoding = 'async'; } element.src = media.src.split('/').map(encodeURIComponent).join('/'); return element; };
  const screenWhiteBackground = (image) => { if (image.tagName !== 'IMG') return; const screen = () => { try { const canvas = document.createElement('canvas'); canvas.width = canvas.height = 36; const context = canvas.getContext('2d', { willReadFrequently: true }); context.drawImage(image, 0, 0, 36, 36); const pixels = context.getImageData(0, 0, 36, 36).data; let whitePixels = 0; for (let index = 0; index < pixels.length; index += 4) if (pixels[index] > 245 && pixels[index + 1] > 245 && pixels[index + 2] > 245 && pixels[index + 3] > 245) whitePixels += 1; if (whitePixels / 1296 >= 0.12) image.classList.add('white-is-transparent'); } catch {} }; image.addEventListener('load', screen, { once: true }); if (image.complete) screen(); };
  const highResolutionSource = (media) => media.type === 'image' ? media.src.replace('assets/img/Graphic Design/', 'assets/img/Graphic Design HD/') : null;
  const openViewer = (item, selectedView = 0) => {
    const collection = items.filter((work) => sectionOf(work) === sectionOf(item));
    const start = collection.indexOf(item); const order = [...collection.slice(start), ...collection.slice(0, start)];
    dialogContent.replaceChildren();
    order.forEach((work, workIndex) => {
      const section = document.createElement('section'); section.className = 'painting-dialog__work'; section.dataset.graphicItem = work.id;
      const stage = document.createElement('div'); stage.className = 'painting-dialog__stage';
      const info = document.createElement('div'); info.className = 'painting-dialog__info'; const title = document.createElement('h2'); title.textContent = work.title; info.append(title);
      let viewIndex = workIndex === 0 ? selectedView : 0; let hdSource = null;
      const render = () => { stage.classList.remove('is-zoomed'); stage.replaceChildren(mediaElement(work.media[viewIndex], work.title)); };
      render();
      if (work.media[viewIndex].type === 'image') { const candidate = highResolutionSource(work.media[viewIndex]); const probe = new Image(); probe.addEventListener('load', () => { hdSource = candidate; stage.classList.add('has-zoom'); }, { once: true }); probe.src = candidate; stage.addEventListener('click', () => { if (!hdSource) return; const zoomed = !stage.classList.contains('is-zoomed'); stage.classList.toggle('is-zoomed', zoomed); if (zoomed) { stage.replaceChildren(mediaElement({ ...work.media[viewIndex], src: hdSource }, work.title)); } else render(); }); }
      if (work.media.length > 1) { const views = document.createElement('div'); views.className = 'painting-dialog__views'; work.media.forEach((_, index) => { const button = document.createElement('button'); button.textContent = index + 1; if (index === viewIndex) button.setAttribute('aria-current', 'true'); button.addEventListener('click', () => { viewIndex = index; hdSource = null; render(); views.querySelectorAll('button').forEach((view, position) => position === index ? view.setAttribute('aria-current', 'true') : view.removeAttribute('aria-current')); }); views.append(button); }); info.append(views); }
      section.append(stage, info); dialogContent.append(section);
    });
    dialog.showModal(); dialog.scrollTop = 0;
  };
  ['general', 'thsco', 'palmier'].forEach((sectionName) => {
    const grid = document.querySelector(`[data-graphic-grid="${sectionName}"]`);
    items.filter((item) => sectionOf(item) === sectionName).forEach((item) => {
      const fragment = template.content.cloneNode(true); const media = fragment.querySelector('.painting-card__media'); const preview = fragment.querySelector('.painting-card__preview'); const fullscreen = fragment.querySelector('.painting-card__fullscreen'); let viewIndex = 0;
      const render = () => { preview.replaceChildren(); const element = mediaElement(item.media[viewIndex], item.title); if (element.tagName === 'VIDEO') { element.controls = false; element.autoplay = true; element.loop = true; } preview.append(element); screenWhiteBackground(element); };
      render(); fullscreen.addEventListener('click', () => openViewer(item, viewIndex)); media.addEventListener('click', (event) => { if (!event.target.closest('button')) openViewer(item, viewIndex); });
      if (item.media.length > 1) ['previous', 'next'].forEach((direction) => { const button = document.createElement('button'); button.className = `painting-card__${direction}`; button.type = 'button'; const icon = document.createElement('img'); icon.src = `assets/img/${direction === 'previous' ? 'leftarrow' : 'rightarrow'}.png`; icon.alt = ''; button.append(icon); button.addEventListener('click', () => { viewIndex = (viewIndex + (direction === 'next' ? 1 : -1) + item.media.length) % item.media.length; render(); }); media.append(button); });
      fragment.querySelector('.painting-card__title').textContent = item.title; fragment.querySelector('.painting-card').dataset.graphicItem = item.id;
      if (sectionName === 'palmier' && item.title === 'Menu') {
        const menus = document.querySelector('[data-palmier-menus]');
        item.media.forEach((menu, index) => { const button = document.createElement('button'); button.type = 'button'; button.setAttribute('aria-label', `Open Palmier menu ${index + 1}`); const image = mediaElement(menu, `Palmier menu ${index + 1}`); button.append(image); button.addEventListener('click', () => openViewer(item, index)); menus.append(button); });
      } else if (sectionName === 'palmier') {
        const sideName = ['Cocktails menu', 'Iced drink menu', 'Pastry Tag'].includes(item.title) ? 'left' : 'right';
        document.querySelector(`[data-palmier-side="${sideName}"]`).append(fragment);
      } else grid.append(fragment);
    });
  });
  document.querySelector('.painting-dialog__close').addEventListener('click', () => dialog.close());
})();
