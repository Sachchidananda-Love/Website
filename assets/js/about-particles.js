(() => {
  const stage = document.querySelector('.about-particle-stage');
  const figure = stage;
  const canvas = stage?.querySelector('.about-particle-stage__canvas');
  if (!stage || !canvas) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const useFallback = () => {
    figure.classList.add('is-fallback');
    figure.classList.remove('is-webgl');
  };

  if (!window.THREE || !window.WebGLRenderingContext) {
    useFallback();
    return;
  }

  const THREE = window.THREE;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      depth: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false
    });
  } catch (error) {
    useFallback();
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 30);
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);

  const isCoarse = window.matchMedia('(pointer: coarse)').matches;
  const memory = navigator.deviceMemory || 8;
  const lowPower = memory <= 4 || navigator.hardwareConcurrency <= 4;
  const particleCount = reducedMotion
    ? (isCoarse ? 4200 : 6200)
    : lowPower ? (isCoarse ? 4800 : 7000) : (isCoarse ? 7200 : 12800);
  const ambientCount = Math.round(particleCount * (isCoarse ? 0.025 : 0.055));
  const bodyCount = particleCount - ambientCount;

  const positions = new Float32Array(particleCount * 3);
  const targets = new Float32Array(particleCount * 3);
  const velocities = new Float32Array(particleCount * 3);
  const starts = new Float32Array(particleCount * 3);
  const seeds = new Float32Array(particleCount);
  const sizes = new Float32Array(particleCount);
  const edges = new Float32Array(particleCount);
  const ambient = new Float32Array(particleCount);

  let randomState = 0x9e3779b9;
  const random = () => {
    randomState |= 0;
    randomState = (randomState + 0x6d2b79f5) | 0;
    let value = randomState;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const range = (min, max) => min + (max - min) * random();
  const mix = (start, end, amount) => start + (end - start) * amount;

  const randomDirection = () => {
    let x;
    let y;
    let z;
    let lengthSquared;
    do {
      x = range(-1, 1);
      y = range(-1, 1);
      z = range(-1, 1);
      lengthSquared = x * x + y * y + z * z;
    } while (!lengthSquared || lengthSquared > 1);
    const inverseLength = 1 / Math.sqrt(lengthSquared);
    return [x * inverseLength, y * inverseLength, z * inverseLength];
  };

  const radialAmount = () => (
    random() < 0.78
      ? 0.72 + 0.28 * Math.pow(random(), 0.42)
      : Math.cbrt(random()) * 0.86
  );

  const ellipsoid = (center, radii) => {
    const direction = randomDirection();
    const radius = radialAmount();
    return {
      x: center[0] + direction[0] * radii[0] * radius,
      y: center[1] + direction[1] * radii[1] * radius,
      z: center[2] + direction[2] * radii[2] * radius,
      edge: Math.max(0, (radius - 0.58) / 0.42)
    };
  };

  const segment = (start, end, startRadius, endRadius, depthScale = 0.82) => {
    const t = random();
    const centerX = mix(start[0], end[0], t);
    const centerY = mix(start[1], end[1], t);
    const centerZ = mix(start[2], end[2], t);
    const axisX = end[0] - start[0];
    const axisY = end[1] - start[1];
    const axisLength = Math.hypot(axisX, axisY) || 1;
    const normalX = -axisY / axisLength;
    const normalY = axisX / axisLength;
    const angle = random() * Math.PI * 2;
    const radius = radialAmount();
    const width = mix(startRadius, endRadius, t);
    const planar = Math.cos(angle) * width * radius;
    return {
      x: centerX + normalX * planar,
      y: centerY + normalY * planar,
      z: centerZ + Math.sin(angle) * width * depthScale * radius,
      edge: Math.max(0, (radius - 0.58) / 0.42)
    };
  };

  const torso = () => {
    const t = random();
    const y = mix(0.28, 1.82, t);
    const shoulder = Math.exp(-Math.pow((t - 0.82) / 0.24, 2));
    const chest = Math.exp(-Math.pow((t - 0.57) / 0.4, 2));
    const width = 0.41 + shoulder * 0.27 + chest * 0.1;
    const depth = 0.24 + chest * 0.09;
    const angle = random() * Math.PI * 2;
    const radius = radialAmount();
    return {
      x: Math.cos(angle) * width * radius,
      y,
      z: Math.sin(angle) * depth * radius - 0.015,
      edge: Math.max(0, (radius - 0.58) / 0.42)
    };
  };

  const bodySamplers = [
    [0.245, torso],
    [0.085, () => ellipsoid([0, 2.48, 0], [0.35, 0.48, 0.34])],
    [0.025, () => ellipsoid([0, 1.96, 0], [0.19, 0.25, 0.19])],
    [0.055, () => ellipsoid([0, 1.66, 0], [0.73, 0.27, 0.31])],
    [0.075, () => ellipsoid([0, 0.05, 0], [0.49, 0.44, 0.31])],
    [0.062, () => segment([-0.62, 1.61, 0], [-0.82, 0.67, 0.015], 0.205, 0.15)],
    [0.062, () => segment([0.62, 1.61, 0], [0.79, 0.65, -0.01], 0.205, 0.15)],
    [0.052, () => segment([-0.82, 0.67, 0.015], [-0.76, -0.25, 0.07], 0.155, 0.105)],
    [0.052, () => segment([0.79, 0.65, -0.01], [0.72, -0.28, 0.06], 0.155, 0.105)],
    [0.018, () => ellipsoid([-0.75, -0.39, 0.08], [0.13, 0.25, 0.12])],
    [0.018, () => ellipsoid([0.71, -0.42, 0.07], [0.13, 0.25, 0.12])],
    [0.072, () => segment([-0.28, -0.16, 0], [-0.34, -1.43, 0.015], 0.265, 0.205, 0.9)],
    [0.072, () => segment([0.28, -0.16, 0], [0.35, -1.43, -0.015], 0.265, 0.205, 0.9)],
    [0.058, () => segment([-0.34, -1.43, 0.015], [-0.31, -2.55, 0.035], 0.205, 0.135, 0.86)],
    [0.058, () => segment([0.35, -1.43, -0.015], [0.32, -2.55, 0.025], 0.205, 0.135, 0.86)],
    [0.023, () => ellipsoid([-0.31, -2.69, 0.16], [0.2, 0.12, 0.39])],
    [0.023, () => ellipsoid([0.32, -2.69, 0.15], [0.2, 0.12, 0.39])]
  ];
  const totalWeight = bodySamplers.reduce((sum, [weight]) => sum + weight, 0);

  const sampleBody = () => {
    let choice = random() * totalWeight;
    for (const [weight, sampler] of bodySamplers) {
      choice -= weight;
      if (choice <= 0) return sampler();
    }
    return torso();
  };

  for (let index = 0; index < bodyCount; index += 1) {
    const point = sampleBody();
    const offset = index * 3;
    targets[offset] = point.x;
    targets[offset + 1] = point.y;
    targets[offset + 2] = point.z;
    positions[offset] = point.x;
    positions[offset + 1] = point.y;
    positions[offset + 2] = point.z;
    starts[offset] = point.x + range(-1.45, 1.45) * (0.7 + point.edge);
    starts[offset + 1] = point.y + range(-1.8, 1.8) * (0.8 + point.edge * 0.6);
    starts[offset + 2] = point.z + range(-1.5, 1.5);
    seeds[index] = random();
    sizes[index] = range(2.2, 6.4) * (1 + point.edge * 0.22);
    edges[index] = point.edge;
  }

  for (let index = bodyCount; index < particleCount; index += 1) {
    const offset = index * 3;
    const x = range(-4.7, 1.2);
    const y = range(-2.9, 3.1);
    const z = range(-1.1, 0.55);
    targets[offset] = positions[offset] = x;
    targets[offset + 1] = positions[offset + 1] = y;
    targets[offset + 2] = positions[offset + 2] = z;
    starts[offset] = x + range(-0.65, 0.65);
    starts[offset + 1] = y + range(-0.8, 0.8);
    starts[offset + 2] = z + range(-0.7, 0.7);
    seeds[index] = random();
    sizes[index] = range(1.6, 4.1);
    edges[index] = range(0.72, 1);
    ambient[index] = 1;
  }

  const geometry = new THREE.BufferGeometry();
  const positionAttribute = new THREE.BufferAttribute(positions, 3);
  positionAttribute.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('position', positionAttribute);
  geometry.setAttribute('aOrigin', new THREE.BufferAttribute(targets, 3));
  geometry.setAttribute('aStart', new THREE.BufferAttribute(starts, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aEdge', new THREE.BufferAttribute(edges, 1));
  geometry.setAttribute('aAmbient', new THREE.BufferAttribute(ambient, 1));

  const uniforms = {
    uTime: { value: 0 },
    uFormation: { value: reducedMotion ? 1 : 0 },
    uPixelRatio: { value: 1 },
    uMotion: { value: reducedMotion ? 0 : 1 }
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    vertexShader: `
      uniform float uTime;
      uniform float uFormation;
      uniform float uPixelRatio;
      uniform float uMotion;
      attribute vec3 aOrigin;
      attribute vec3 aStart;
      attribute float aSeed;
      attribute float aSize;
      attribute float aEdge;
      attribute float aAmbient;
      varying float vAlpha;
      varying float vSeed;
      varying float vDepth;

      void main() {
        float sequence = smoothstep(aSeed * 0.27, 0.48 + aSeed * 0.22, uFormation);
        vec3 formed = mix(aStart, position, sequence);
        float waveA = sin(aOrigin.y * 1.72 + uTime * 0.43 + aSeed * 9.7);
        float waveB = cos(aOrigin.x * 2.14 - uTime * 0.31 + aSeed * 15.3);
        float waveC = sin((aOrigin.x + aOrigin.y) * 1.36 + uTime * 0.27 + aSeed * 5.1);
        float driftAmount = (0.006 + aEdge * 0.021 + aAmbient * 0.016) * uMotion;
        formed += vec3(waveA, waveB, waveC) * driftAmount;

        float torsoMask = smoothstep(-0.15, 1.75, aOrigin.y) * (1.0 - smoothstep(1.8, 2.18, aOrigin.y));
        float breath = sin(uTime * 0.88) * 0.012 * torsoMask * uMotion;
        formed.x *= 1.0 + breath;
        formed.z += breath * 1.45;
        formed.x += sin(uTime * 0.29 + aOrigin.y * 0.74) * 0.008 * (aOrigin.y + 2.9) * uMotion;

        vec4 viewPosition = modelViewMatrix * vec4(formed, 1.0);
        gl_Position = projectionMatrix * viewPosition;
        gl_PointSize = aSize * uPixelRatio * mix(0.42, 1.0, sequence) * (1.0 + formed.z * 0.055);

        float dissolveWave = 0.54 + 0.46 * sin(uTime * 0.58 + aSeed * 26.0 + aOrigin.y * 2.7);
        float dissolve = mix(1.0, smoothstep(0.08, 0.62, dissolveWave), aEdge * 0.82 * uMotion);
        float bodyAlpha = mix(0.72, 0.29, aEdge);
        vAlpha = mix(bodyAlpha, 0.095, aAmbient) * dissolve * sequence;
        vSeed = aSeed;
        vDepth = clamp((formed.z + 1.1) / 2.1, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      varying float vSeed;
      varying float vDepth;

      void main() {
        float distanceToCenter = length(gl_PointCoord - vec2(0.5));
        if (distanceToCenter > 0.5) discard;
        float haze = smoothstep(0.5, 0.04, distanceToCenter);
        float core = smoothstep(0.2, 0.0, distanceToCenter);
        vec3 graphite = vec3(0.105, 0.112, 0.13);
        vec3 blue = vec3(0.29, 0.35, 0.48);
        vec3 violet = vec3(0.42, 0.36, 0.5);
        vec3 color = mix(graphite, mix(blue, violet, vSeed), 0.28 + vDepth * 0.28);
        color = mix(color, vec3(0.72, 0.76, 0.86), core * 0.24);
        gl_FragColor = vec4(color, vAlpha * haze * haze);
      }
    `
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);

  renderer.setClearColor(0x000000, 0);
  renderer.outputEncoding = THREE.sRGBEncoding;
  figure.classList.add('is-webgl');

  const raycaster = new THREE.Raycaster();
  const pointerNdc = new THREE.Vector2(4, 4);
  const localRay = new THREE.Ray();
  const inverseMatrix = new THREE.Matrix4();
  const pointer = {
    active: false,
    intensity: 0,
    speed: 0,
    lastX: 0,
    lastY: 0,
    lastTime: performance.now(),
    type: 'mouse'
  };
  const scroll = {
    lastY: window.scrollY,
    impulse: 0
  };
  let raf = 0;
  let previousTime = performance.now();
  const startedAt = previousTime;
  let destroyed = false;
  let suspended = false;

  const render = () => renderer.render(scene, camera);

  const resize = () => {
    if (destroyed) return;
    const rect = figure.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    const viewHeight = 6.5;
    const viewWidth = viewHeight * (width / height);
    camera.left = -viewWidth / 2;
    camera.right = viewWidth / 2;
    camera.top = viewHeight / 2;
    camera.bottom = -viewHeight / 2;
    camera.updateProjectionMatrix();
    points.position.x = 0;
    points.scale.setScalar(0.96);
    points.updateMatrixWorld(true);

    const pixelRatioCap = isCoarse ? 1.35 : 1.65;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, pixelRatioCap);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    uniforms.uPixelRatio.value = pixelRatio;
    if (reducedMotion) render();
  };

  const updatePointer = (event, forceActive = false) => {
    if (reducedMotion || destroyed) return;
    const rect = figure.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const now = performance.now();
    const elapsed = Math.max(8, now - pointer.lastTime);
    const movement = Math.hypot(event.clientX - pointer.lastX, event.clientY - pointer.lastY);
    pointer.speed = Math.min(1, movement / elapsed / 0.72);
    pointer.lastX = event.clientX;
    pointer.lastY = event.clientY;
    pointer.lastTime = now;
    pointer.type = event.pointerType || 'mouse';
    pointer.active = forceActive || pointer.type !== 'touch';
    pointer.intensity = pointer.type === 'touch' ? 0.34 : 0.72 + pointer.speed * 0.58;
    pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointerNdc, camera);
    inverseMatrix.copy(points.matrixWorld).invert();
    localRay.copy(raycaster.ray).applyMatrix4(inverseMatrix);
  };

  const handlePointerMove = (event) => {
    if (event.pointerType === 'touch' && !pointer.active) return;
    updatePointer(event, pointer.active);
  };
  const handlePointerDown = (event) => updatePointer(event, true);
  const releasePointer = () => { pointer.active = false; };
  const handlePointerLeave = () => {
    if (pointer.type !== 'touch') pointer.active = false;
  };

  const simulate = (delta, elapsed) => {
    const deltaScale = Math.min(2, delta * 60);
    const springBase = 0.016 * deltaScale;
    const drag = Math.pow(0.91, deltaScale);
    const radius = pointer.type === 'touch' ? 0.48 : 0.64;
    const radiusSquared = radius * radius;
    const pointerForce = pointer.intensity * (pointer.type === 'touch' ? 0.021 : 0.036) * deltaScale;
    const rayOrigin = localRay.origin;
    const rayDirection = localRay.direction;
    const floatStrength = 0.00052 * deltaScale;
    const scrollForce = scroll.impulse * 0.0038 * deltaScale;
    const scatterForce = Math.abs(scroll.impulse) * 0.007 * deltaScale;

    for (let index = 0; index < particleCount; index += 1) {
      const offset = index * 3;
      const organicSpring = springBase * (0.82 + seeds[index] * 0.42);
      velocities[offset] += (targets[offset] - positions[offset]) * organicSpring;
      velocities[offset + 1] += (targets[offset + 1] - positions[offset + 1]) * organicSpring;
      velocities[offset + 2] += (targets[offset + 2] - positions[offset + 2]) * organicSpring;

      // Give each point its own slow, bounded path so the silhouette feels buoyant.
      const phase = seeds[index] * Math.PI * 2;
      velocities[offset] += Math.sin(elapsed * (0.78 + seeds[index] * 0.32) + phase) * floatStrength;
      velocities[offset + 1] += Math.cos(elapsed * (0.66 + seeds[index] * 0.27) + phase * 1.7) * floatStrength;
      velocities[offset + 2] += Math.sin(elapsed * (0.57 + seeds[index] * 0.23) + phase * 2.3) * floatStrength * 0.7;

      // Scroll motion sends every point out along a seeded path, biased by scroll direction.
      if (scrollForce) {
        const scrollDirection = Math.sign(scroll.impulse);
        const scatterX = targets[offset] * 0.26 + Math.sin(phase * 11.3) * 0.9;
        const scatterY = targets[offset + 1] * 0.12 + Math.cos(phase * 17.9) * 0.58 + scrollDirection * 0.48;
        const scatterZ = targets[offset + 2] * 0.3 + Math.sin(phase * 23.7) * 0.72;
        const inverseScatterLength = 1 / (Math.hypot(scatterX, scatterY, scatterZ) || 1);
        velocities[offset] += scatterX * inverseScatterLength * scatterForce;
        velocities[offset + 1] += scatterY * inverseScatterLength * scatterForce;
        velocities[offset + 2] += scatterZ * inverseScatterLength * scatterForce;
        velocities[offset] += (seeds[index] - 0.5) * scrollForce * 0.46;
        velocities[offset + 1] += scrollForce;
        velocities[offset + 2] += (((seeds[index] * 11.73) % 1) - 0.5) * scrollForce * 0.32;
      }

      if (pointer.intensity > 0.012 && !ambient[index]) {
        const toX = positions[offset] - rayOrigin.x;
        const toY = positions[offset + 1] - rayOrigin.y;
        const toZ = positions[offset + 2] - rayOrigin.z;
        const rayDistance = toX * rayDirection.x + toY * rayDirection.y + toZ * rayDirection.z;
        const closestX = rayOrigin.x + rayDirection.x * rayDistance;
        const closestY = rayOrigin.y + rayDirection.y * rayDistance;
        const closestZ = rayOrigin.z + rayDirection.z * rayDistance;
        let awayX = positions[offset] - closestX;
        let awayY = positions[offset + 1] - closestY;
        let awayZ = positions[offset + 2] - closestZ;
        const distanceSquared = awayX * awayX + awayY * awayY + awayZ * awayZ;

        if (distanceSquared < radiusSquared) {
          const distance = Math.sqrt(distanceSquared) || 0.0001;
          const falloff = 1 - distance / radius;
          const force = falloff * falloff * pointerForce;
          if (distanceSquared < 0.000001) {
            awayX = seeds[index] - 0.5;
            awayY = ((seeds[index] * 7.31) % 1) - 0.5;
            awayZ = ((seeds[index] * 13.17) % 1) - 0.5;
          }
          const inverseDistance = 1 / (Math.hypot(awayX, awayY, awayZ) || 1);
          velocities[offset] += awayX * inverseDistance * force;
          velocities[offset + 1] += awayY * inverseDistance * force;
          velocities[offset + 2] += awayZ * inverseDistance * force;
        }
      }

      velocities[offset] *= drag;
      velocities[offset + 1] *= drag;
      velocities[offset + 2] *= drag;
      positions[offset] += velocities[offset] * deltaScale;
      positions[offset + 1] += velocities[offset + 1] * deltaScale;
      positions[offset + 2] += velocities[offset + 2] * deltaScale;
    }

    if (pointer.active) pointer.intensity *= Math.pow(0.972, deltaScale);
    else pointer.intensity *= Math.pow(0.9, deltaScale);
    scroll.impulse *= Math.pow(0.78, deltaScale);
    positionAttribute.needsUpdate = true;
  };

  const animate = (time) => {
    raf = 0;
    if (destroyed || suspended || document.hidden) return;
    const delta = Math.min(0.034, Math.max(0.001, (time - previousTime) / 1000));
    previousTime = time;
    const elapsed = (time - startedAt) / 1000;
    uniforms.uTime.value = elapsed;
    uniforms.uFormation.value = Math.min(1, Math.max(0, (elapsed - 0.08) / 1.95));
    simulate(delta, elapsed);
    render();
    raf = window.requestAnimationFrame(animate);
  };

  const resume = () => {
    if (destroyed || reducedMotion || raf || document.hidden) return;
    suspended = false;
    previousTime = performance.now();
    raf = window.requestAnimationFrame(animate);
  };

  const pause = () => {
    suspended = true;
    if (raf) window.cancelAnimationFrame(raf);
    raf = 0;
  };

  const handleVisibility = () => {
    if (document.hidden) pause();
    else resume();
  };

  const handlePageShow = () => {
    suspended = false;
    resume();
  };

  const handleScroll = () => {
    const currentY = window.scrollY;
    const distance = currentY - scroll.lastY;
    scroll.lastY = currentY;
    // Clamp abrupt jumps (such as anchor navigation) to keep the response gentle.
    scroll.impulse = Math.max(-0.7, Math.min(0.7, scroll.impulse + distance * 0.006));
  };

  function handlePageHide(event) {
    if (event.persisted) pause();
    else destroy();
  }

  function handleContextLost(event) {
    event.preventDefault();
    destroy();
    useFallback();
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    pause();
    window.removeEventListener('resize', resize);
    window.removeEventListener('scroll', handleScroll);
    window.removeEventListener('pagehide', handlePageHide);
    window.removeEventListener('pageshow', handlePageShow);
    document.removeEventListener('visibilitychange', handleVisibility);
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerdown', handlePointerDown);
    window.removeEventListener('pointerup', releasePointer);
    window.removeEventListener('pointercancel', releasePointer);
    window.removeEventListener('pointerleave', handlePointerLeave);
    window.removeEventListener('blur', releasePointer);
    canvas.removeEventListener('webglcontextlost', handleContextLost);
    scene.remove(points);
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  }

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('pagehide', handlePageHide);
  window.addEventListener('pageshow', handlePageShow);
  document.addEventListener('visibilitychange', handleVisibility);
  window.addEventListener('pointermove', handlePointerMove, { passive: true });
  window.addEventListener('pointerdown', handlePointerDown, { passive: true });
  window.addEventListener('pointerup', releasePointer, { passive: true });
  window.addEventListener('pointercancel', releasePointer, { passive: true });
  window.addEventListener('pointerleave', handlePointerLeave, { passive: true });
  window.addEventListener('blur', releasePointer);
  canvas.addEventListener('webglcontextlost', handleContextLost, false);

  resize();
  if (reducedMotion) {
    uniforms.uTime.value = 0.35;
    render();
  } else {
    resume();
  }
})();
