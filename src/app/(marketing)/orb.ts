/* ============================================================
   The Arena — WebGL point-cloud orb
   - Earth-shaped point cloud built from a uniform Fibonacci
     sphere, with per-vertex land/ocean flags sampled from a
     specular Earth map (water = bright, land = dark).
   - Additive blending + soft gaussian dot texture: overlapping
     dot halos accumulate to fill in continents and create the
     silhouette halo.
   - Markers rendered as a separate Points buffer; tooltip
     driven by a raycast against that buffer.
   ============================================================ */

import * as THREE from "three";

export type MarkerLocation = readonly [lat: number, lon: number, label: string];

export const MARKER_LOCATIONS: readonly MarkerLocation[] = [
  [26.93, -80.09, "Jupiter, FL"],
  [30.52, -87.90, "Fairhope, AL"],
  [30.27, -97.74, "Austin, TX"],
];

const TEX_URL =
  "https://threejs.org/examples/textures/planets/earth_specular_2048.jpg";

// Tuning — see prior conversation for derivation of each value.
const N_CANDIDATES = 60_000;
const RADIUS = 1.45;
const POINT_SIZE = 0.026;
const ROT_SPEED_Y = 0.0010;
const DRAG_SENSITIVITY = 0.006;
const STAR_COUNT = 320;
const MARKER_SIZE = 0.045;

const OCEAN_BRIGHTNESS = 0.16;
const LAND_BRIGHTNESS = 0.70;
const LAND_SIZE_BOOST = 0.55;
const RIM_POWER = 1.6;
const RIM_BOOST = 0.55;

const BREATH_PERIOD = 7.0; // seconds per cycle
const BREATH_AMPLITUDE = 0.05; // ±5% brightness

/* Marker hover animation — hovered pin scales and brightens, all others
   ease back to idle. Driven via a per-vertex BufferAttribute updated in tick(). */
const MARKER_HOVER_SIZE_BOOST = 0.9;
const MARKER_HOVER_BRIGHT_BOOST = 0.5;
const MARKER_HOVER_LERP = 0.2;

/** Initialize the orb on `canvas`, drive the `tooltipEl` on hover.
 *  Returns a cleanup function — call it on unmount. */
export async function initOrb(
  canvas: HTMLCanvasElement,
  tooltipEl: HTMLDivElement,
): Promise<() => void> {
  /* ---------- THREE setup ---------- */
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 5);
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  /* ---------- Sample land/sea mask ---------- */
  const earthMask = await loadEarthMask(TEX_URL);

  const positions = new Float32Array(N_CANDIDATES * 3);
  const landFlags = new Float32Array(N_CANDIDATES);
  for (let i = 0; i < N_CANDIDATES; i++) {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / N_CANDIDATES);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const dx = Math.cos(theta) * Math.sin(phi);
    const dy = Math.sin(theta) * Math.sin(phi);
    const dz = Math.cos(phi);

    positions[3 * i] = dx * RADIUS;
    positions[3 * i + 1] = dy * RADIUS;
    positions[3 * i + 2] = dz * RADIUS;

    const lat = Math.asin(dy);
    /* See latLonToVec3 — atan2(-z, x) so the visible +z hemisphere shows
       western longitudes (Americas) in standard map orientation. */
    const lon = Math.atan2(-dz, dx);
    const u = lon / (2 * Math.PI) + 0.5;
    const v = lat / Math.PI + 0.5;
    const px = earthMask.sample(u, v);
    const lum = (px.r + px.g + px.b) / 3;
    landFlags[i] = lum < 100 ? 1.0 : 0.0;
  }

  const dotsGeom = new THREE.BufferGeometry();
  dotsGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  dotsGeom.setAttribute("aLand", new THREE.BufferAttribute(landFlags, 1));

  const dotsTexture = makeSoftDotTexture();
  const dotsMat = new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: dotsTexture },
      uPointSize: { value: POINT_SIZE },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uOceanBrightness: { value: OCEAN_BRIGHTNESS },
      uLandBrightness: { value: LAND_BRIGHTNESS },
      uLandSizeBoost: { value: LAND_SIZE_BOOST },
      uRimPower: { value: RIM_POWER },
      uRimBoost: { value: RIM_BOOST },
      uBreath: { value: 1.0 },
      uColor: { value: new THREE.Color(0xf5efe0) },
    },
    vertexShader: /* glsl */ `
      attribute float aLand;
      varying float vBrightness;

      uniform float uPointSize;
      uniform float uPixelRatio;
      uniform float uOceanBrightness;
      uniform float uLandBrightness;
      uniform float uLandSizeBoost;
      uniform float uRimPower;
      uniform float uRimBoost;
      uniform float uBreath;

      void main() {
        vec4 worldPos4 = modelMatrix * vec4(position, 1.0);
        vec3 worldPos  = worldPos4.xyz;
        vec3 worldN    = normalize(worldPos);
        vec3 viewDir   = normalize(cameraPosition - worldPos);
        float ndotv = dot(viewDir, worldN);
        float front = smoothstep(-0.05, 0.10, ndotv);
        float rim = pow(1.0 - clamp(ndotv, 0.0, 1.0), uRimPower);

        float baseBrightness = mix(uOceanBrightness, uLandBrightness, aLand);
        vBrightness = (baseBrightness + rim * uRimBoost) * front * uBreath;

        vec4 mvPosition = viewMatrix * worldPos4;
        gl_Position = projectionMatrix * mvPosition;
        float sizeMul = 1.0 + uLandSizeBoost * aLand;
        gl_PointSize = uPointSize * sizeMul * uPixelRatio * (300.0 / -mvPosition.z);
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vBrightness;
      uniform sampler2D uMap;
      uniform vec3 uColor;

      void main() {
        if (vBrightness < 0.01) discard;
        vec4 tex = texture2D(uMap, gl_PointCoord);
        if (tex.a < 0.01) discard;
        vec3 col = uColor * vBrightness * tex.a;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const dots = new THREE.Points(dotsGeom, dotsMat);

  /* ---------- Markers ---------- */
  const markerDirs = MARKER_LOCATIONS.map(([la, lo]) => latLonToVec3(la, lo));
  const NM = markerDirs.length;
  const markerPositions = new Float32Array(NM * 3);
  const MARKER_R = RADIUS * 1.012;
  for (let m = 0; m < NM; m++) {
    const md = markerDirs[m];
    markerPositions[3 * m] = md.x * MARKER_R;
    markerPositions[3 * m + 1] = md.y * MARKER_R;
    markerPositions[3 * m + 2] = md.z * MARKER_R;
  }
  /* Per-marker hover progress (0 = idle, 1 = hovered). Lerped in tick() and
     written back to the buffer attribute; the marker shader reads it to
     scale size and brightness. */
  const markerHoverProgress = new Float32Array(NM);
  const markerGeom = new THREE.BufferGeometry();
  markerGeom.setAttribute(
    "position",
    new THREE.BufferAttribute(markerPositions, 3),
  );
  markerGeom.setAttribute(
    "aHover",
    new THREE.BufferAttribute(markerHoverProgress, 1),
  );
  const markerTex = makeCircleTexture();
  const markerMat = new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: markerTex },
      uSize: { value: MARKER_SIZE },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uHoverSizeBoost: { value: MARKER_HOVER_SIZE_BOOST },
      uHoverBrightBoost: { value: MARKER_HOVER_BRIGHT_BOOST },
      uColor: { value: new THREE.Color(0xffd040) },
    },
    vertexShader: /* glsl */ `
      attribute float aHover;
      varying float vHover;

      uniform float uSize;
      uniform float uPixelRatio;
      uniform float uHoverSizeBoost;

      void main() {
        vHover = aHover;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        float sizeMul = 1.0 + aHover * uHoverSizeBoost;
        gl_PointSize = uSize * sizeMul * uPixelRatio * (300.0 / -mvPosition.z);
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vHover;
      uniform sampler2D uMap;
      uniform vec3 uColor;
      uniform float uHoverBrightBoost;

      void main() {
        vec4 tex = texture2D(uMap, gl_PointCoord);
        if (tex.a < 0.05) discard;
        float brightness = 1.0 + vHover * uHoverBrightBoost;
        gl_FragColor = vec4(uColor * brightness, tex.a);
      }
    `,
    transparent: true,
    depthWrite: false,
  });
  const markerPoints = new THREE.Points(markerGeom, markerMat);

  const orbGroup = new THREE.Group();
  orbGroup.add(dots);
  orbGroup.add(markerPoints);
  scene.add(orbGroup);

  const stars = makeStarfield(STAR_COUNT);
  scene.add(stars);

  /* ---------- Drag-to-rotate ---------- */
  let isDragging = false;
  let dragLastX = 0;
  let dragLastY = 0;
  canvas.style.cursor = "grab";

  const onPointerDown = (e: PointerEvent) => {
    isDragging = true;
    dragLastX = e.clientX;
    dragLastY = e.clientY;
    canvas.style.cursor = "grabbing";
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* not all pointers support capture */
    }
  };
  const onPointerMoveDrag = (e: PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragLastX;
    const dy = e.clientY - dragLastY;
    orbGroup.rotation.y += dx * DRAG_SENSITIVITY;
    orbGroup.rotation.x += dy * DRAG_SENSITIVITY;
    dragLastX = e.clientX;
    dragLastY = e.clientY;
  };
  const onPointerUp = (e: PointerEvent) => {
    if (!isDragging) return;
    isDragging = false;
    canvas.style.cursor = "grab";
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {
      /* see above */
    }
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMoveDrag);
  window.addEventListener("pointerup", onPointerUp);

  /* ---------- Marker hover tooltip ---------- */
  const raycaster = new THREE.Raycaster();
  if (raycaster.params.Points) {
    raycaster.params.Points.threshold = 0.08;
  }
  const mouseNDC = new THREE.Vector2();
  const tmpWorld = new THREE.Vector3();
  const tmpToCam = new THREE.Vector3();
  const tmpNormal = new THREE.Vector3();

  /* Index of the currently hovered marker (-1 = none). Drives the per-marker
     animation in tick(). */
  let hoveredMarkerIdx = -1;

  function setTooltipVisible(visible: boolean) {
    tooltipEl.style.opacity = visible ? "1" : "0";
  }

  function updateHover(clientX: number, clientY: number) {
    if (isDragging) {
      setTooltipVisible(false);
      hoveredMarkerIdx = -1;
      return;
    }
    const rect = canvas.getBoundingClientRect();
    mouseNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouseNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouseNDC, camera);
    const hits = raycaster.intersectObject(markerPoints);

    for (const hit of hits) {
      const idx = hit.index;
      if (idx == null) continue;
      tmpWorld.fromBufferAttribute(
        markerGeom.attributes.position as THREE.BufferAttribute,
        idx,
      );
      markerPoints.localToWorld(tmpWorld);
      tmpNormal.copy(tmpWorld).normalize();
      tmpToCam.subVectors(camera.position, tmpWorld).normalize();
      if (tmpNormal.dot(tmpToCam) > 0.1) {
        hoveredMarkerIdx = idx;
        tooltipEl.textContent = MARKER_LOCATIONS[idx][2] ?? "";
        tooltipEl.style.left = `${clientX}px`;
        tooltipEl.style.top = `${clientY}px`;
        setTooltipVisible(true);
        return;
      }
    }
    hoveredMarkerIdx = -1;
    setTooltipVisible(false);
  }

  const onHoverPointerMove = (e: PointerEvent) =>
    updateHover(e.clientX, e.clientY);
  const onPointerLeave = () => {
    setTooltipVisible(false);
    hoveredMarkerIdx = -1;
  };
  canvas.addEventListener("pointermove", onHoverPointerMove);
  canvas.addEventListener("pointerleave", onPointerLeave);

  /* ---------- Animation loop ---------- */
  const breathOmega = (2 * Math.PI) / BREATH_PERIOD;
  let rafId = 0;
  let disposed = false;
  function tick() {
    if (disposed) return;
    rafId = requestAnimationFrame(tick);
    if (!isDragging) {
      orbGroup.rotation.y += ROT_SPEED_Y;
    }
    const t = performance.now() / 1000;
    dotsMat.uniforms.uBreath.value =
      1.0 + Math.sin(t * breathOmega) * BREATH_AMPLITUDE;

    /* Lerp each marker's hover progress toward target — the hovered one
       eases toward 1, all others toward 0. Cross-fades cleanly when the
       cursor moves between pins. */
    let hoverDirty = false;
    for (let i = 0; i < NM; i++) {
      const target = i === hoveredMarkerIdx && !isDragging ? 1.0 : 0.0;
      const curr = markerHoverProgress[i];
      const next = curr + (target - curr) * MARKER_HOVER_LERP;
      if (Math.abs(next - curr) > 0.0001) {
        markerHoverProgress[i] = next;
        hoverDirty = true;
      }
    }
    if (hoverDirty) {
      (markerGeom.attributes.aHover as THREE.BufferAttribute).needsUpdate =
        true;
    }

    renderer.render(scene, camera);
  }

  function onResize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    dotsMat.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
  }
  window.addEventListener("resize", onResize);
  onResize();
  tick();

  /* ---------- Cleanup ---------- */
  return () => {
    disposed = true;
    cancelAnimationFrame(rafId);
    canvas.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointermove", onPointerMoveDrag);
    window.removeEventListener("pointerup", onPointerUp);
    canvas.removeEventListener("pointermove", onHoverPointerMove);
    canvas.removeEventListener("pointerleave", onPointerLeave);
    window.removeEventListener("resize", onResize);

    dotsGeom.dispose();
    dotsMat.dispose();
    dotsTexture.dispose();
    markerGeom.dispose();
    markerMat.dispose();
    markerTex.dispose();
    const starGeom = stars.geometry;
    const starMat = stars.material as THREE.Material;
    starGeom.dispose();
    starMat.dispose();
    renderer.dispose();
  };
}

/* ---------- Helpers ---------- */

interface EarthMask {
  sample(u: number, v: number): { r: number; g: number; b: number };
}

async function loadEarthMask(url: string): Promise<EarthMask> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const W = img.width;
      const H = img.height;
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const ctx = c.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D context unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, W, H).data;
      resolve({
        sample(u, v) {
          const x = Math.min(W - 1, Math.max(0, Math.floor(u * W)));
          const y = Math.min(H - 1, Math.max(0, Math.floor((1 - v) * H)));
          const i = (y * W + x) * 4;
          return { r: data[i], g: data[i + 1], b: data[i + 2] };
        },
      });
    };
    img.onerror = (e) => reject(e);
    img.src = url;
  });
}

/** Lat/lon → unit vector. Convention matches the earth-mask sampler
 *  (lon = atan2(-z, x)) so the +z hemisphere shows the Americas in
 *  standard map orientation (west on observer's left, east on right). */
function latLonToVec3(
  lat: number,
  lon: number,
): { x: number; y: number; z: number } {
  const latR = (lat * Math.PI) / 180;
  const lonR = (lon * Math.PI) / 180;
  return {
    x: Math.cos(latR) * Math.cos(lonR),
    y: Math.sin(latR),
    z: -Math.cos(latR) * Math.sin(lonR),
  };
}

function makeStarfield(count: number): THREE.Points {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = Math.random() * 2 - 1;
    const phi = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const r = 6 + Math.random() * 3;
    positions[3 * i] = r * s * Math.cos(phi);
    positions[3 * i + 1] = r * s * Math.sin(phi);
    positions[3 * i + 2] = r * u;
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.012,
    transparent: true,
    opacity: 0.55,
    sizeAttenuation: true,
    depthWrite: false,
  });
  return new THREE.Points(geom, mat);
}

/** Soft gaussian-ish dot for the main orb particles. Paired with additive
 *  blending so neighbouring dot halos overlap and fill in. */
function makeSoftDotTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0.0, "rgba(255,255,255,1.00)");
  g.addColorStop(0.18, "rgba(255,255,255,0.78)");
  g.addColorStop(0.4, "rgba(255,255,255,0.36)");
  g.addColorStop(0.7, "rgba(255,255,255,0.08)");
  g.addColorStop(1.0, "rgba(255,255,255,0.00)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

/** Crisper texture for marker pins so they read as distinct points. */
function makeCircleTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1.0)");
  g.addColorStop(0.62, "rgba(255,255,255,1.0)");
  g.addColorStop(0.85, "rgba(255,255,255,0.4)");
  g.addColorStop(1, "rgba(255,255,255,0.0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}
