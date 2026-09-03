(() => {
  window.createArtworkZoom = (stage) => {
    const minimum = 100;
    const initial = 135;
    const maximum = 225;
    let currentMedia = null;
    let zoomSource = null;
    let controlsVisible = false;
    let slider = null;
    let controls = null;
    let dragStart = null;
    let ignoreNextClick = false;

    const setAmount = (amount) => {
      const zoomed = amount > minimum;
      stage.classList.toggle('is-zoomed', zoomed);
      stage.style.setProperty('--zoom-scale', `${amount}%`);
      stage.setAttribute('aria-label', controlsVisible ? `Artwork zoom: ${amount} percent.` : 'Click to show zoom controls.');
      if (slider) slider.value = amount;
    };

    const showControls = () => {
      if (controlsVisible || currentMedia?.tagName !== 'IMG') return;
      controlsVisible = true;
      stage.dataset.zoomCursor = 'out';
      if (window.matchMedia('(max-width: 720px)').matches) {
        if (zoomSource) currentMedia.src = zoomSource;
        setAmount(175);
        return;
      }
      controls = document.createElement('div');
      controls.className = 'artwork-zoom-controls';
      const label = document.createElement('label');
      label.textContent = 'Zoom';
      slider = document.createElement('input');
      slider.type = 'range'; slider.min = minimum; slider.max = maximum; slider.step = 5; slider.value = initial;
      slider.setAttribute('aria-label', 'Artwork zoom');
      slider.addEventListener('input', () => setAmount(Number(slider.value)));
      controls.addEventListener('click', (event) => event.stopPropagation());
      controls.addEventListener('keydown', (event) => event.stopPropagation());
      label.append(slider); controls.append(label); stage.append(controls);
      if (zoomSource) currentMedia.src = zoomSource;
      setAmount(initial);
    };

    const hideControls = () => {
      controls?.remove();
      controls = null;
      slider = null;
      controlsVisible = false;
      stage.dataset.zoomCursor = 'in';
      setAmount(minimum);
    };

    stage.addEventListener('click', () => {
      if (ignoreNextClick) { ignoreNextClick = false; return; }
      controlsVisible ? hideControls() : showControls();
    });
    stage.addEventListener('pointerdown', (event) => {
      if (!controlsVisible || event.button !== 0) return;
      dragStart = { x: event.clientX, y: event.clientY, left: stage.scrollLeft, top: stage.scrollTop, moved: false };
      stage.classList.add('is-panning');
      stage.setPointerCapture(event.pointerId);
    });
    stage.addEventListener('pointermove', (event) => {
      if (!dragStart) return;
      const dx = event.clientX - dragStart.x;
      const dy = event.clientY - dragStart.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragStart.moved = true;
      stage.scrollLeft = dragStart.left - dx;
      stage.scrollTop = dragStart.top - dy;
    });
    const endDrag = (event) => {
      if (!dragStart) return;
      if (dragStart.moved) ignoreNextClick = true;
      dragStart = null;
      stage.classList.remove('is-panning');
      if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    };
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);
    stage.addEventListener('keydown', (event) => {
      if ((event.key === 'Enter' || event.key === ' ') && !controlsVisible) { event.preventDefault(); showControls(); }
    });

    return {
      render(media, source = media.src) {
        currentMedia = media;
        zoomSource = source;
        controlsVisible = false;
        slider = null;
        controls = null;
        stage.classList.remove('is-zoomed', 'has-zoom');
        stage.style.removeProperty('--zoom-scale');
        const viewArrows = [...stage.querySelectorAll('.painting-dialog__view-arrow')];
        stage.replaceChildren(media, ...viewArrows);
        if (media.tagName === 'IMG') {
          stage.classList.add('has-zoom'); stage.dataset.zoomCursor = 'in'; stage.tabIndex = 0; stage.setAttribute('role', 'button');
          stage.setAttribute('aria-label', 'Click to show zoom controls.');
        } else {
          delete stage.dataset.zoomCursor; stage.removeAttribute('tabindex'); stage.removeAttribute('role'); stage.removeAttribute('aria-label');
        }
      },
      setZoomSource(source) { zoomSource = source; if (controlsVisible && currentMedia) currentMedia.src = source; }
    };
  };
})();
