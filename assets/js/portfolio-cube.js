(() => {
  const cube = document.querySelector('.portfolio-cube__object');
  if (!cube) return;

  // Main cube settings — adjust these values to tune the installation.
  const settings = {
    cubeSize: 230,
    faceChangeIntervals: [3000, 4000, 5000, 2000, 1500, 1000],
    mouseRotationStrength: 24,
    floatAmount: 8,
    floatSpeed: 5.8,
    rotationSpeed: 32,
    rotationSpeedX: 29,
    rotationSpeedZ: 27
  };
  const artworkManifest = window.PORTFOLIO_CUBE_ARTWORK || {};

  // A small, curated pool keeps initial downloads light while drawing from every
  // portfolio section represented by the homepage navigation.
  const artworkPools = {
    paintings: artworkManifest.paintings || [
      'assets/img/paintings/Tathata.png',
      'assets/img/paintings/Taxi Driver.png',
      'assets/img/paintings/Pralaya.png',
      'assets/img/paintings/chef.png',
      'assets/img/paintings/tupac.png',
      'assets/img/paintings/oud.png',
      'assets/img/paintings/Laya-4.png',
      'assets/img/paintings/Avijjā-3.png'
    ],
    graphicDesign: artworkManifest.graphicDesign || [
      'assets/img/Graphic Design/a-01.png',
      'assets/img/Graphic Design/Jacked Up Shirt.png',
      'assets/img/Graphic Design/SATI LOGO.png',
      'assets/img/Graphic Design/Be Like Us 2020.png',
      "assets/img/Graphic Design/WE DON'T CARE Cover Art.png",
      'assets/img/Graphic Design/02-02.png',
      'assets/img/Graphic Design/Lotzah design.png'
    ],
    digital: artworkManifest.digital || [
      'assets/img/Digital Art HD/Barry.png',
      'assets/img/Digital Art HD/FEB23.png',
      'assets/img/Digital Art/105.png',
      'assets/img/Digital Art/106.png',
      'assets/img/Digital Art/107.png',
      'assets/img/Digital Art/Psychedelic 200.png',
      'assets/img/Digital Art/Homage to MF DOOM.png',
      'assets/img/Digital Art HD/March10th.png'
    ],
    photography: [
      'assets/img/Photography/001.png',
      'assets/img/Photography/003.png',
      'assets/img/Photography/005.png',
      'assets/img/Photography/007.png',
      'assets/img/Photography/009.png',
      'assets/img/Photography/011.png',
      'assets/img/Photography/014.png',
      'assets/img/Photography/018.png'
    ],
    writing: artworkManifest.writing || [
      'assets/img/Poetry/2_big.png',
      'assets/img/Poetry/3_full.png',
      'assets/img/Poetry/4.png',
      'assets/img/Poetry/5_1_full.png',
      'assets/img/Poetry/5_2_full.png',
      'assets/img/Poetry/5_3.png',
      'assets/img/Poetry/6.png',
      'assets/img/Poetry/6(bottom).png'
    ],
    video: artworkManifest.video || ['assets/img/Videos/Logo.gif'],
    about: artworkManifest.about || [],
    socialMedia: artworkManifest.socialMedia || []
  };

  // The cube uses dedicated 512px copies so changing an artwork never stalls
  // the page while a full gallery image is decoded.
  Object.keys(artworkPools).forEach((category) => {
    artworkPools[category] = artworkPools[category].map((source) => (
      source.includes('assets/img/cube/') || source.includes('assets/img/Social Icons/') || /\.(mov|mp4|m4v)$/i.test(source)
        ? source
        : source.replace('assets/img/', 'assets/img/cube/')
    ));
  });
  const defaultGraphicDesignExclusions = new Set([
    'assets/img/cube/Graphic Design/Palmier/Menu 1.png',
    'assets/img/cube/Graphic Design/Palmier/Menu 2.png',
    'assets/img/cube/Graphic Design/Palmier/Pastry Tag.png',
    'assets/img/cube/Graphic Design/Palmier/tea.png'
  ]);
  const defaultGraphicDesign = artworkPools.graphicDesign.filter((source) => {
    if (defaultGraphicDesignExclusions.has(source)) return false;
    const isSequencedThscoPiece = /\/THSCO\/(?:Product Slides|spoonfed)\//.test(source);
    return !isSequencedThscoPiece || /\/1\.(?:png|jpe?g)$/i.test(source);
  });
  artworkPools.all = Object.entries(artworkPools)
    .filter(([category]) => category !== 'about' && category !== 'socialMedia')
    .flatMap(([category, sources]) => category === 'graphicDesign' ? defaultGraphicDesign : sources);

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cubeContainer = document.querySelector('.portfolio-cube');
  const float = document.querySelector('.portfolio-cube__float');
  const faces = [...cube.querySelectorAll('.portfolio-cube__face')].map((face) => ({
    element: face,
    media: [...face.querySelectorAll('img, video')],
    visibleMedia: null,
    isPlaybackLocked: false,
    source: null
  }));
  let activePool = 'all';
  let cycleToken = 0;

  const updateCubeSize = () => {
    const size = window.innerWidth <= 700
      ? Math.round(Math.min(window.innerWidth * 0.64, window.innerHeight * 0.32, 260))
      : window.innerWidth <= 900 ? 150 : settings.cubeSize;
    cubeContainer.style.setProperty('--cube-size', `${size}px`);
    cubeContainer.style.setProperty('--cube-depth', `${size / 2}px`);
    cubeContainer.style.setProperty('--cube-shadow-offset', `${Math.round(size * 0.18)}px`);
    cubeContainer.style.setProperty('--cube-shadow-reserve', `${Math.round(size * 0.68)}px`);
    cubeContainer.style.setProperty('--cube-shadow-blur', `${Math.max(14, Math.round(size * 0.09))}px`);
  };

  updateCubeSize();
  cubeContainer.style.setProperty('--cube-float-amount', `${settings.floatAmount}px`);
  cubeContainer.style.setProperty('--cube-float-low', `${settings.floatAmount * 0.45}px`);
  cubeContainer.style.setProperty('--cube-float-high', `${settings.floatAmount * -0.55}px`);
  cubeContainer.style.setProperty('--cube-float-duration', `${settings.floatSpeed}s`);
  window.addEventListener('resize', updateCubeSize, { passive: true });

  const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);

  const chooseArtwork = (pool, count) => {
    const previousSources = new Set(faces.map((face) => face.source));
    const freshPool = pool.filter((source) => !previousSources.has(source));
    const candidates = freshPool.length >= count ? freshPool : pool;
    const selected = shuffle(candidates).slice(0, count);

    while (selected.length < count) selected.push(pool[selected.length % pool.length]);
    return selected;
  };

  const isVideoSource = (source) => /\.(mov|mp4|m4v)$/i.test(source);
  const assetURL = (source) => source.split('/').map(encodeURIComponent).join('/');

  const glowColorCache = new Map();
  let glowRevision = 0;
  const sourceHue = (source) => [...source].reduce((total, character) => total + character.charCodeAt(0), 0) % 360;
  const samplePoints = [[4, 5], [15, 5], [26, 5], [7, 17], [21, 17], [4, 28], [15, 28], [26, 28]];
  const glowPositions = [[14, 18], [37, 10], [63, 14], [85, 22], [22, 45], [50, 38], [78, 48], [10, 72], [33, 82], [58, 68], [86, 78], [47, 94]];
  const makeGlowColor = (red, green, blue, alpha = 0.42) => {
    const high = Math.max(red, green, blue);
    const low = Math.min(red, green, blue);
    if (high - low < 22 || high < 30) return null;
    return `rgb(${Math.round(red * 0.72 + 55)} ${Math.round(green * 0.72 + 55)} ${Math.round(blue * 0.72 + 55)} / ${alpha})`;
  };
  const fallbackPalette = (source) => Array.from({ length: 4 }, (_, index) => `hsl(${(sourceHue(source) + index * 47) % 360} 76% 66% / 0.42)`);
  const samplePalette = (source) => {
    if (glowColorCache.has(source)) return Promise.resolve(glowColorCache.get(source));
    if (isVideoSource(source)) {
      const colors = fallbackPalette(source); glowColorCache.set(source, colors); return Promise.resolve(colors);
    }
    return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 32;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.drawImage(image, 0, 0, 32, 32);
        const pixels = context.getImageData(0, 0, 32, 32).data;
        const colors = samplePoints.map(([sampleX, sampleY]) => {
          let red = 0; let green = 0; let blue = 0; let count = 0;
          for (let y = Math.max(0, sampleY - 2); y <= Math.min(31, sampleY + 2); y += 1) for (let x = Math.max(0, sampleX - 2); x <= Math.min(31, sampleX + 2); x += 1) {
            const pixel = (y * 32 + x) * 4;
            if (pixels[pixel + 3] < 120) continue;
            red += pixels[pixel]; green += pixels[pixel + 1]; blue += pixels[pixel + 2]; count += 1;
          }
          return count ? makeGlowColor(red / count, green / count, blue / count) : null;
        }).filter(Boolean);
        if (!colors.length) colors.push(...fallbackPalette(source));
        glowColorCache.set(source, colors);
        resolve(colors);
      } catch {
        resolve(fallbackPalette(source));
      }
    };
    image.onerror = () => resolve(fallbackPalette(source));
    image.src = assetURL(source);
    });
  };
  const updateGlow = () => {
    const visibleSources = faces.filter((face) => /portfolio-cube__face--(?:front|right|top)/.test(face.element.className) && face.source).map((face) => face.source);
    const revision = ++glowRevision;
    Promise.all(visibleSources.map(samplePalette)).then((palettes) => {
      if (revision !== glowRevision) return;
      const colors = palettes.flat();
      if (!colors.length) colors.push(...fallbackPalette('cube'));
      const spectrum = glowPositions.map(([x, y], index) => `radial-gradient(circle at ${x}% ${y}%, ${colors[index % colors.length] || 'transparent'} 0%, transparent 31%)`).join(', ');
      cubeContainer.style.setProperty('--cube-glow-spectrum', spectrum);
    });
  };

  const preload = (source) => {
    if (isVideoSource(source)) return Promise.resolve();
    return new Promise((resolve) => {
    const image = new Image();
    image.onload = image.onerror = resolve;
    image.src = assetURL(source);
    });
  };

  const replaceFace = async (face, source, initial, token) => {
    if (!initial && face.source === source) return;
    const isVideo = isVideoSource(source);
    const isUncroppedVideo = source.includes('ScreenRecording_08-26-2026 09-53-23_1.mov');
    const compatibleMedia = face.media.filter((element) => isVideo === (element.tagName === 'VIDEO'));
    const nextMedia = compatibleMedia.find((element) => element !== face.visibleMedia) || compatibleMedia[0];

    if (!initial) await preload(source);
    if (token !== cycleToken) return;

    nextMedia.src = assetURL(source);
    nextMedia.classList.toggle('is-uncropped', isUncroppedVideo);
    face.isPlaybackLocked = false;
    if (isVideo) {
      const isAboutVideo = activePool === 'about';
      face.isPlaybackLocked = true;
      nextMedia.loop = isAboutVideo;
      nextMedia.onended = isAboutVideo ? null : () => {
        if (face.source === source) {
          face.isPlaybackLocked = false;
          rotateFace(face);
        }
      };
      nextMedia.load();
      nextMedia.play().catch(() => {});
    }
    face.media.forEach((element) => {
      const isVisible = element === nextMedia;
      element.classList.toggle('is-visible', isVisible);
      if (element.tagName === 'VIDEO' && !isVisible) element.pause();
    });
    face.visibleMedia = nextMedia;
    face.source = source;
    updateGlow();
  };

  const refreshArtwork = async (instant = false) => {
    const token = ++cycleToken;
    cubeContainer.classList.toggle('portfolio-cube--instant', instant);
    cubeContainer.classList.toggle('portfolio-cube--framed', ['paintings', 'digital', 'graphicDesign', 'socialMedia'].includes(activePool));
    cubeContainer.classList.toggle('portfolio-cube--social', activePool === 'socialMedia');
    const pool = artworkPools[activePool] || artworkPools.all;
    const selection = activePool === 'socialMedia' ? pool.slice(0, faces.length) : chooseArtwork(pool, faces.length);
    await Promise.all(faces.map((face, index) => replaceFace(face, selection[index], !face.source, token)));
    if (token === cycleToken && instant) {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => cubeContainer.classList.remove('portfolio-cube--instant'));
      });
    }
  };

  const setActivePool = (category) => {
    const nextPool = category && artworkPools[category] ? category : 'all';
    if (nextPool === activePool) return;
    activePool = nextPool;
    refreshArtwork(true);
  };

  document.addEventListener('portfolio-cube-categorychange', (event) => setActivePool(event.detail.category));

  refreshArtwork();

  // Each face rotates independently, keeping the object from changing as a
  // single synchronized block. Values are intentionally staggered at 3–5 sec.
  const rotateFace = (face) => {
    if (face.isPlaybackLocked || activePool === 'socialMedia') return;
    const pool = artworkPools[activePool] || artworkPools.all;
    const occupiedSources = new Set(faces.map((item) => item.source));
    let candidates = pool.filter((source) => source !== face.source && !occupiedSources.has(source));
    if (!candidates.length) candidates = pool.filter((source) => source !== face.source);
    if (!candidates.length) candidates = pool;
    replaceFace(face, candidates[Math.floor(Math.random() * candidates.length)], false, cycleToken);
  };

  faces.forEach((face, index) => {
    const interval = settings.faceChangeIntervals[index] * (reducedMotion ? 2 : 1);
    window.setInterval(() => rotateFace(face), interval);
  });

  // Preload the compact pool after first paint, so category hovers can switch
  // all six faces at once without waiting on image decoding.
  const preloadArtwork = () => artworkPools.all.forEach((source) => {
    if (isVideoSource(source)) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = assetURL(source);
      return;
    }
    const image = new Image();
    image.src = assetURL(source);
  });
  if (window.innerWidth > 700) {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(preloadArtwork, { timeout: 2000 });
    } else {
      window.setTimeout(preloadArtwork, 600);
    }
  }

  if (reducedMotion) {
    float.classList.add('portfolio-cube__float--reduced-motion');
    cube.style.transform = 'rotateX(-8deg) rotateY(22deg)';
    return;
  }

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;

  if (window.innerWidth > 700) {
    window.addEventListener('pointermove', (event) => {
      targetY = ((event.clientX / window.innerWidth) - 0.5) * settings.mouseRotationStrength * 2;
      targetX = -((event.clientY / window.innerHeight) - 0.5) * settings.mouseRotationStrength * 2;
    }, { passive: true });
  } else {
    let lastScrollPosition = window.scrollY;
    const scrollRotationLimit = settings.mouseRotationStrength;
    window.addEventListener('scroll', () => {
      const scrollChange = window.scrollY - lastScrollPosition;
      lastScrollPosition = window.scrollY;
      targetX = Math.max(-scrollRotationLimit, Math.min(scrollRotationLimit, targetX - scrollChange * 0.16));
      targetY = Math.max(-scrollRotationLimit, Math.min(scrollRotationLimit, targetY + scrollChange * 0.09));
    }, { passive: true });
  }

  const animate = (time) => {
    currentX += (targetX - currentX) * 0.035;
    currentY += (targetY - currentY) * 0.035;
    const driftY = (time / 1000) * settings.rotationSpeed;
    const driftX = (time / 1000) * settings.rotationSpeedX;
    const driftZ = (time / 1000) * settings.rotationSpeedZ;
    cube.style.transform = `rotateX(${-8 + currentX + driftX}deg) rotateY(${22 + currentY + driftY}deg) rotateZ(${driftZ}deg)`;
    window.requestAnimationFrame(animate);
  };

  window.requestAnimationFrame(animate);
})();
