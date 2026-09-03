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

    stage.addEventListener('click', () => controlsVisible ? hideControls() : showControls());
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
        stage.replaceChildren(media);
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
