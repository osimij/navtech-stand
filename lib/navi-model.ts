// Navi in three dimensions: the original porcelain companion rebuilt as geometry so it can turn, breathe, look and
// react in real light. Proportions follow the approved sheet (public/mascot/navi.png): a gumdrop body widest in its
// lower third, a sky-blue underside, large glossy navy eyes with twin catchlights, fine arched brows and mitten arms.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { NaviPose } from './navi-rig';

const DEPTH = .9;          // front-to-back flattening of the pebble
const BOTTOM = -.94;       // lowest point of the body
const FLOOR = -1.1;        // Navi hovers a little above its own shadow
export const BODY_HEIGHT = 1 - BOTTOM;
export const VIEW_HEIGHT = 4.4; // world units covered by the canvas height at the body plane

const INK = '#1a2550';

// Surface of revolution, sampled bottom to top.
const profile = (() => {
  const points: THREE.Vector2[] = [], n = 2.35, steps = 120;
  let max = 0;
  for (let i = 0; i <= steps; i++) {
    const t = -Math.PI / 2 + Math.PI * i / steps, c = Math.cos(t), s = Math.sin(t);
    let r = Math.pow(Math.abs(c), 2 / n), y = Math.sign(s) * Math.pow(Math.abs(s), 2 / n);
    r *= 1 - .1 * y;                   // egg: fuller below, softer dome above
    if (y < 0) y *= -BOTTOM;           // a slightly flatter base
    points.push(new THREE.Vector2(r, y)); max = Math.max(max, r);
  }
  for (const p of points) p.x *= .95 / max;
  points[0].x = 0; points[points.length - 1].x = 0;
  return points;
})();

function radiusAt(y: number) {
  if (y <= profile[0].y) return 0;
  for (let i = 1; i < profile.length; i++) {
    const a = profile[i - 1], b = profile[i];
    if (y <= b.y) return a.x + (b.x - a.x) * (y - a.y) / (b.y - a.y);
  }
  return 0;
}
/** The front surface point of the body at (x, y). */
export function surfacePoint(x: number, y: number, lift = 0) {
  const r = radiusAt(y), z = DEPTH * Math.sqrt(Math.max(0, r * r - x * x));
  const n = surfaceNormal(x, y);
  return new THREE.Vector3(x, y, z).addScaledVector(n, lift);
}
export function surfaceNormal(x: number, y: number) {
  const r = radiusAt(y), dr = (radiusAt(y + .002) - radiusAt(y - .002)) / .004;
  const z = DEPTH * Math.sqrt(Math.max(0, r * r - x * x));
  return new THREE.Vector3(2 * x, -2 * r * dr, 2 * z / (DEPTH * DEPTH)).normalize();
}
function onSurface(object: THREE.Object3D, x: number, y: number, lift = 0) {
  object.position.copy(surfacePoint(x, y, lift));
  object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), surfaceNormal(x, y));
}

const linear = (hex: string) => new THREE.Color(hex);
function paint(geometry: THREE.BufferGeometry, color: (p: THREE.Vector3) => THREE.Color) {
  const pos = geometry.getAttribute('position'), colors = new Float32Array(pos.count * 3), p = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) { p.fromBufferAttribute(pos, i); const c = color(p); colors.set([c.r, c.g, c.b], i * 3); }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geometry;
}
const mix = (a: THREE.Color, b: THREE.Color, t: number) => a.clone().lerp(b, Math.min(1, Math.max(0, t)));
const smooth = (a: number, b: number, v: number) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

// Porcelain with a soft rim of light. The rim takes the page's ambient colour, so Navi is lit by the room it is in.
// On the body, a soft occlusion ring around each eye opening seats the eyes in the face instead of on it.
type Socket = { center: THREE.Vector3; radius: THREE.Vector2 };
function porcelain(rim: { value: THREE.Color }, sockets: Socket[] = []) {
  const material = new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness: .36, clearcoat: .55, clearcoatRoughness: .28,
    sheen: .6, sheenRoughness: .45, sheenColor: linear('#e4ecff'), envMapIntensity: .95,
  });
  material.onBeforeCompile = shader => {
    shader.uniforms.naviRim = rim;
    const occlusion = sockets.map(({ center: c, radius: r }) => `naviSocket(vNaviP, vec2(${c.x.toFixed(4)}, ${c.y.toFixed(4)}), vec2(${r.x.toFixed(4)}, ${r.y.toFixed(4)}))`).join(' * ');
    if (sockets.length) {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vNaviP;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvNaviP = position;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>
          varying vec3 vNaviP;
          float naviSocket(vec3 p, vec2 c, vec2 r) {
            vec2 e = (p.xy - c) / r;
            float q = length(e), ring = exp(-pow(max(q - .96, 0.0) / .26, 2.0)) * step(.9, q);
            return 1.0 - ring * (.1 + .12 * smoothstep(-.2, .8, e.y)) * step(0.0, p.z);
          }`)
        .replace('#include <color_fragment>', `#include <color_fragment>\ndiffuseColor.rgb *= ${occlusion};`);
    }
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 naviRim;')
      .replace('#include <opaque_fragment>', `
        float naviFacing = clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
        outgoingLight += naviRim * pow(1.0 - naviFacing, 2.6);
        #include <opaque_fragment>`);
  };
  return material;
}

// The eyeball: iris, pupil, limbal ring and sclera drawn procedurally. The iris sits a little behind the cornea, so
// it shifts with the viewing angle (parallax), and the upper lid and the socket shade the ball where they meet it.
function eyeball(uniforms: Record<string, THREE.IUniform>) {
  const material = new THREE.MeshPhysicalMaterial({ roughness: .62, envMapIntensity: .08, specularIntensity: .15, clearcoat: 0 });
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vEyeP;\nvarying vec3 vEyeV;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvEyeP = position;\nvEyeV = (inverse(modelViewMatrix) * vec4(0.0, 0.0, 0.0, 1.0)).xyz - position;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vEyeP; varying vec3 vEyeV;
        uniform mat3 uGaze; uniform float uLid; uniform float uLower; uniform float uPupil;
        uniform vec3 uPupilColor, uInner, uOuter, uGlow, uLimbus, uSclera, uScleraShade;
        float naviEyeShade;
        vec3 naviEye() {
          vec3 n = normalize(vEyeP), v = normalize(vEyeV);
          vec2 d = n.xy - v.xy / max(v.z, .4) * .1 * step(0.0, n.z);
          float R = .86, r = length(d) / R, a = atan(d.y, d.x);
          float fib = sin(a * 41.0 + sin(a * 7.0) * 1.8) * .5 + sin(a * 23.0 + 2.1 + r * 7.0) * .35 + sin(a * 67.0 + r * 3.0) * .15;
          vec3 iris = mix(uInner, uOuter, smoothstep(.3, .95, r));
          iris = mix(iris, uGlow, smoothstep(.1, -.85, d.y / R) * smoothstep(.45, .92, r) * .66);
          iris *= 1.0 + .2 * fib * smoothstep(.44, .6, r) * (1.0 - smoothstep(.86, .97, r));
          iris += uOuter * .5 * exp(-pow((r - .5) / .05, 2.0)) * (.7 + .3 * fib);
          iris = mix(uPupilColor, iris, smoothstep(uPupil - .025, uPupil + .03, r));
          iris = mix(iris, uLimbus, smoothstep(.8, .97, r));
          vec3 ps = uGaze * n;
          vec3 white = mix(uScleraShade, uSclera, smoothstep(.3, .85, ps.z));
          vec3 color = mix(iris, white, n.z > 0.0 ? smoothstep(.97, 1.04, r) : 1.0);
          float below = -(ps.y * cos(uLid) + ps.z * sin(uLid));
          float above = ps.y * cos(uLower) + ps.z * sin(uLower);
          naviEyeShade = mix(.42, 1.0, smoothstep(0.0, .5, below)) * mix(.75, 1.0, smoothstep(0.0, .25, above)) * mix(.7, 1.0, smoothstep(.12, .5, ps.z));
          return color;
        }`)
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb = naviEye();')
      .replace('#include <opaque_fragment>', 'outgoingLight *= naviEyeShade;\n#include <opaque_fragment>');
  };
  return material;
}

// A small photo studio that exists only in Navi's eyes: a rounded softbox up and to the right (where the key light
// is), a narrow strip light low on the left and a dim graded room. The eyes reflect this, so catchlights are crisp,
// designed shapes that bend over the cornea, not painted dots.
function eyeStudio(pmrem: THREE.PMREMGenerator) {
  const scene = new THREE.Scene();
  const dome = new THREE.Mesh(paint(new THREE.SphereGeometry(20, 48, 24), p => {
    const y = p.y / 20;
    return y > 0 ? mix(linear('#5d667c'), linear('#2a3040'), smooth(.1, .9, y)) : mix(linear('#5d667c'), linear('#181b24'), smooth(0, -.5, y));
  }), new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide }));
  scene.add(dome);
  // Each light is a diffuser: brightest in its core, falling off toward softly rounded edges.
  const textures: THREE.Texture[] = [];
  const panel = (direction: THREE.Vector3, width: number, height: number, radius: number, intensity: number) => {
    const canvas = document.createElement('canvas'), px = 256, py = Math.round(px * height / width), pad = 14;
    canvas.width = px + pad * 2; canvas.height = py + pad * 2;
    const ctx = canvas.getContext('2d')!, r = radius / width * px;
    const glow = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, px * .62);
    glow.addColorStop(0, '#ffffff'); glow.addColorStop(.55, '#f1f1f1'); glow.addColorStop(1, '#9a9a9a');
    ctx.filter = 'blur(4px)'; ctx.fillStyle = glow;
    ctx.beginPath(); ctx.roundRect(pad, pad, px, py, r); ctx.fill();
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; textures.push(texture);
    const light = new THREE.Mesh(new THREE.PlaneGeometry(width * canvas.width / px, height * canvas.height / py),
      new THREE.MeshBasicMaterial({ map: texture, color: new THREE.Color(1, 1, 1).multiplyScalar(intensity), transparent: true, side: THREE.DoubleSide }));
    light.position.copy(direction.clone().normalize().multiplyScalar(8)); light.lookAt(0, 0, 0);
    scene.add(light);
  };
  panel(new THREE.Vector3(.18, .37, .91), 6.9, 3.5, 1.45, 46);  // key softbox
  panel(new THREE.Vector3(-.36, -.36, .86), 2.8, .9, .45, 14);  // fill strip
  const texture = pmrem.fromScene(scene, 0, .1, 60).texture;
  scene.traverse(object => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); (object.material as THREE.Material).dispose(); } });
  textures.forEach(texture => texture.dispose());
  return texture;
}

// The tear film: the whole visible eye is wet and reflects the eye studio, so a catchlight holds its place while the
// iris moves beneath it. Reflections use the normal of a rounder eye (the ball is a flattened oval, which would smear
// them) and fade under the upper lid, which shades them.
function cornea(studio: THREE.Texture, uniforms: Record<string, THREE.IUniform>) {
  const material = new THREE.MeshPhysicalMaterial({
    color: '#000000', roughness: .06, ior: 1.4, envMap: studio, envMapIntensity: 1,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vCorneaN;\nvarying vec3 vCorneaP;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        mat3 corneaRotation = mat3(modelViewMatrix);
        corneaRotation[0] = normalize(corneaRotation[0]); corneaRotation[1] = normalize(corneaRotation[1]); corneaRotation[2] = normalize(corneaRotation[2]);
        vCorneaN = corneaRotation * normalize(vec3(position.xy * .4, position.z));
        vCorneaP = position;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vCorneaN;\nvarying vec3 vCorneaP;\nuniform float uLid;')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = normalize(vCorneaN);')
      .replace('#include <opaque_fragment>', `
        vec3 corneaS = normalize(vCorneaP);
        float corneaBelow = -(corneaS.y * cos(uLid) + corneaS.z * sin(uLid));
        outgoingLight = reflectedLight.indirectSpecular * mix(.18, 1.0, smoothstep(0.0, .42, corneaBelow));
        #include <opaque_fragment>`);
  };
  return material;
}

type Eye = { ball: THREE.Group; pivot: THREE.Group; upper: THREE.Group; lower: THREE.Group; closed: THREE.Mesh; uniforms: { uGaze: { value: THREE.Matrix3 }; uLid: { value: number }; uLower: { value: number }; uPupil: { value: number } } };

export function createNaviModel(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, .035).texture;
  scene.environmentIntensity = .85;
  room.dispose();

  const center = (BOTTOM + 1) / 2, fov = 24;
  const distance = VIEW_HEIGHT / 2 / Math.tan(THREE.MathUtils.degToRad(fov / 2));
  const camera = new THREE.PerspectiveCamera(fov, 1, 1, distance * 3);
  camera.position.set(0, center + .75, distance);
  camera.lookAt(0, center, 0);

  const key = new THREE.DirectionalLight('#ffffff', 1.55); key.position.set(2.6, 5, 6);
  const fill = new THREE.HemisphereLight('#ffffff', '#b7cbf5', .55);
  const back = new THREE.DirectionalLight('#d9e5ff', 1.1); back.position.set(3.5, 3, -4);
  scene.add(key, fill, back);

  const rim = { value: linear('#f3dccf').multiplyScalar(.35) };
  const EYE_X = .33, EYE_Y = .14, EYE_SINK = -.03, EYE_SCALE = new THREE.Vector3(.152, .198, .09);
  const sockets = [-1, 1].map(side => ({ center: surfacePoint(side * EYE_X, EYE_Y), radius: new THREE.Vector2(EYE_SCALE.x * .93, EYE_SCALE.y * .93) }));
  const skin = porcelain(rim, sockets), plain = porcelain(rim);
  const ink = new THREE.MeshPhysicalMaterial({ color: INK, roughness: .35, clearcoat: .6, clearcoatRoughness: .3 });
  const disposables: { dispose(): void }[] = [skin, plain, ink, pmrem];

  // Hierarchy: root (translation) → tilt (rotation about the chest) → squash (scale from the base) → content.
  const root = new THREE.Group(), tilt = new THREE.Group(), squash = new THREE.Group(), content = new THREE.Group();
  const TILT = -.25;
  tilt.position.y = TILT; squash.position.y = BOTTOM - TILT; content.position.y = -BOTTOM;
  root.add(tilt); tilt.add(squash); squash.add(content); scene.add(root);

  // Body.
  const white = linear("#f8f9fc"), blue = linear("#abcaf3"), deep = linear("#8db6ee");
  const bodyGeometry = new THREE.LatheGeometry(profile, 128);
  bodyGeometry.scale(1, 1, DEPTH);
  paint(bodyGeometry, p => mix(mix(white, blue, smooth(.2, -.7, p.y)), deep, smooth(-.55, -.95, p.y) * .7));
  const body = new THREE.Mesh(bodyGeometry, skin);
  content.add(body);
  disposables.push(bodyGeometry);

  const arc = (width: number, height: number, radius: number) => {
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-width / 2, -height / 2, 0), new THREE.Vector3(0, height * 1.5, 0), new THREE.Vector3(width / 2, -height / 2, 0));
    return mergeCaps(new THREE.TubeGeometry(curve, 28, radius, 10, false), new THREE.SphereGeometry(radius, 10, 8), curve);
  };

  // Eyes. Each sits in a socket group on the surface; inside a scaled group the ball turns with the gaze (so the iris
  // slides across an oval and the body hides the rest) while the lids stay with the face and blink over it.
  const studio = eyeStudio(pmrem);
  const ballGeometry = new THREE.SphereGeometry(1, 72, 48);
  // Tear film: a thin shell over the front of the ball, fixed to the socket.
  const corneaGeometry = new THREE.SphereGeometry(1.012, 72, 32, 0, Math.PI * 2, 0, 1.4).rotateX(Math.PI / 2);
  const lidWhite = (p: THREE.Vector3) => mix(white, linear('#eef1f8'), smooth(.4, -.2, p.z));
  const upperLidGeometry = paint(new THREE.SphereGeometry(1.075, 64, 20, 0, Math.PI * 2, 0, Math.PI / 2), lidWhite);
  const lowerLidGeometry = paint(new THREE.SphereGeometry(1.07, 64, 20, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), lidWhite);
  const lashCurve = new THREE.CatmullRomCurve3(Array.from({ length: 13 }, (_, i) => { const t = Math.PI * (.17 + .66 * i / 12); return new THREE.Vector3(Math.cos(t) * 1.08, 0, Math.sin(t) * 1.08); }));
  const lashGeometry = mergeCaps(new THREE.TubeGeometry(lashCurve, 48, .028, 8, false), new THREE.SphereGeometry(.028, 8, 6), lashCurve);
  const closedGeometry = arc(.21, .075, .02);
  const eyeColors = {
    uPupilColor: { value: linear('#02041a') }, uInner: { value: linear('#07103a') }, uOuter: { value: linear('#11255f') },
    uGlow: { value: linear('#3f6dd8') }, uLimbus: { value: linear('#040820') }, uSclera: { value: linear('#eef1f7') }, uScleraShade: { value: linear('#a3aecb') },
  };
  disposables.push(ballGeometry, corneaGeometry, upperLidGeometry, lowerLidGeometry, lashGeometry, closedGeometry, studio);

  const eyes: Eye[] = [-1, 1].map(side => {
    const group = new THREE.Group(); onSurface(group, side * EYE_X, EYE_Y, EYE_SINK);
    const ball = new THREE.Group(); ball.scale.copy(EYE_SCALE);
    const uniforms = { ...eyeColors, uGaze: { value: new THREE.Matrix3() }, uLid: { value: -.8 }, uLower: { value: .9 }, uPupil: { value: .42 } };
    const ballMaterial = eyeball(uniforms);
    const pivot = new THREE.Group();
    const corneaMaterial = cornea(studio, { uLid: uniforms.uLid });
    const corneaMesh = new THREE.Mesh(corneaGeometry, corneaMaterial); corneaMesh.renderOrder = 2;
    pivot.add(new THREE.Mesh(ballGeometry, ballMaterial));
    const upper = new THREE.Group(), lower = new THREE.Group();
    upper.add(new THREE.Mesh(upperLidGeometry, plain), new THREE.Mesh(lashGeometry, ink));
    lower.add(new THREE.Mesh(lowerLidGeometry, plain));
    ball.add(pivot, corneaMesh, upper, lower);
    const closed = new THREE.Mesh(closedGeometry, ink); closed.position.z = .075; closed.visible = false;
    group.add(ball, closed); content.add(group);
    disposables.push(ballMaterial, corneaMaterial);
    return { ball, pivot, upper, lower, closed, uniforms };
  });

  // Brows.
  const browGeometry = arc(.17, .032, .0125);
  disposables.push(browGeometry);
  const brows = [-1, 1].map(side => { const brow = new THREE.Mesh(browGeometry, ink); content.add(brow); return { brow, side }; });

  // Mouth: a live strip between an upper and a lower lip curve, laid onto the body surface every frame it changes.
  const SEG = 28, MOUTH_Y = -.1;
  const strip = (color: string, lift: number) => {
    const geometry = new THREE.BufferGeometry(), positions = new Float32Array((SEG + 1) * 2 * 3), index: number[] = [];
    for (let i = 0; i < SEG; i++) { const a = i * 2, b = a + 1, c = a + 2, d = a + 3; index.push(a, b, c, b, d, c); }
    geometry.setIndex(index); geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.MeshBasicMaterial({ color, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const mesh = new THREE.Mesh(geometry, material); mesh.frustumCulled = false; content.add(mesh);
    disposables.push(geometry, material);
    return { mesh, positions, material, lift };
  };
  const mouthFill = strip(INK, .006), tongue = strip('#ef8088', .009);
  const mouthNavy = linear(INK), mouthInside = linear('#2a1733');
  let mouthKey = '';
  function layMouth(rawOpen: number, rawSmile: number, rawWidth: number) {
    const safe = (v: number, lo: number, hi: number, fallback: number) => Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback;
    const open = safe(rawOpen, 0, .9, 0), smile = safe(rawSmile, -.6, 1, .55), width = safe(rawWidth, .6, 1.3, 1);
    const k = `${open.toFixed(3)}|${smile.toFixed(3)}|${width.toFixed(3)}`;
    if (k === mouthKey) return; mouthKey = k;
    const half = .125 * width * (1 - open * .18);
    const upper = (t: number) => smile * .05 * (t * t - .35) + open * .018 * (1 - t * t);
    const lower = (t: number) => upper(t) - .017 * Math.sqrt(Math.max(0, 1 - Math.pow(t, 4))) - .004 - open * .13 * Math.pow(Math.max(0, 1 - t * t), .75);
    const tongueTop = (t: number) => lower(t) + Math.max(0, open - .08) * .075 * Math.max(0, 1 - Math.pow(t / .68, 2));
    const write = (target: ReturnType<typeof strip>, top: (t: number) => number, bottom: (t: number) => number) => {
      for (let i = 0; i <= SEG; i++) {
        const t = -1 + 2 * i / SEG, x = t * half;
        for (const [row, y] of [[0, top(t)], [1, bottom(t)]] as const) {
          const p = surfacePoint(x, MOUTH_Y + y, target.lift);
          target.positions.set([p.x, p.y, p.z], (i * 2 + row) * 3);
        }
      }
      target.mesh.geometry.getAttribute('position').needsUpdate = true;
    };
    write(mouthFill, upper, lower);
    write(tongue, tongueTop, lower);
    tongue.mesh.visible = open > .1;
    mouthFill.material.color.copy(mix(mouthNavy, mouthInside, smooth(.04, .25, open)));
  }

  // Arms: soft teardrops hung from the shoulders.
  const armProfile: THREE.Vector2[] = [];
  for (let i = 0; i <= 32; i++) { const t = -Math.PI / 2 + Math.PI * i / 32, y = Math.sin(t); armProfile.push(new THREE.Vector2(Math.cos(t) * (1 - .22 * y), y)); }
  armProfile[0].x = 0; armProfile[32].x = 0;
  const armGeometry = new THREE.LatheGeometry(armProfile, 40).scale(.165, .275, .155).translate(0, -.21, 0);
  paint(armGeometry, p => mix(white, blue, smooth(-.05, -.42, p.y) * .55));
  disposables.push(armGeometry);
  const SHOULDER_Y = -.2;
  const arms = [-1, 1].map(side => {
    const pivot = new THREE.Group();
    pivot.position.set(side * (radiusAt(SHOULDER_Y) * .88 + .02), SHOULDER_Y, .3);
    pivot.add(new THREE.Mesh(armGeometry, skin));
    content.add(pivot);
    return { pivot, side };
  });

  // A soft contact shadow on an implied floor.
  const shadowCanvas = document.createElement('canvas'); shadowCanvas.width = shadowCanvas.height = 128;
  const ctx = shadowCanvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(44,56,96,.55)'); gradient.addColorStop(.45, 'rgba(44,56,96,.22)'); gradient.addColorStop(1, 'rgba(44,56,96,0)');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 128, 128);
  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false, opacity: .5 });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), shadowMaterial);
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = FLOOR; shadow.renderOrder = -1;
  scene.add(shadow);
  disposables.push(shadowTexture, shadowMaterial, shadow.geometry);

  function apply(pose: NaviPose) {
    root.position.set(pose.x, pose.y, 0);
    tilt.rotation.set(pose.pitch, pose.yaw + pose.spin, pose.roll, 'YXZ');
    squash.scale.set(pose.sx, pose.sy, pose.sx);

    eyes.forEach((eye, i) => {
      // Joy closes the eyes into arcs outright; everything else is the lids: blinks, winks, and the upper lid
      // following the gaze down, as real lids do.
      const joyful = pose.happy > .55, open = Math.max(0, Math.min(1, i ? pose.eyeOpenR : pose.eyeOpenL));
      const pitch = pose.eyePitch, shut = 1 - open;
      eye.pivot.rotation.set(pitch, pose.eyeYaw, 0, 'YXZ');
      eye.pivot.updateMatrix(); eye.uniforms.uGaze.value.setFromMatrix4(eye.pivot.matrix);
      const upperOpen = -.95 + Math.max(-.1, pitch * .55) + pose.happy * .25, lowerOpen = .95 + pitch * .2 - pose.happy * .2;
      const lid = upperOpen + (.43 - upperOpen) * shut, lowerLid = lowerOpen + (.38 - lowerOpen) * shut;
      eye.upper.rotation.x = lid; eye.lower.rotation.x = lowerLid;
      eye.uniforms.uLid.value = lid; eye.uniforms.uLower.value = lowerLid;
      eye.uniforms.uPupil.value = .4 + .06 * Math.max(0, Math.min(1, (pose.browL + pose.browR) / 2));
      eye.ball.visible = !joyful; eye.closed.visible = joyful;
      eye.closed.scale.set(1, .4 + .7 * Math.min(1, pose.happy * 1.4), 1);
    });

    brows.forEach(({ brow, side }) => {
      const raise = side < 0 ? pose.browL : pose.browR, tiltInner = side < 0 ? pose.tiltL : pose.tiltR;
      onSurface(brow, side * .37, .45 + raise * .065, .004);
      brow.rotateZ(side * (-.08) + (side < 0 ? 1 : -1) * tiltInner * .45);
    });

    layMouth(pose.open, pose.smile, pose.width);

    arms.forEach(({ pivot, side }) => {
      const lift = side < 0 ? pose.armLLift : pose.armRLift, forward = side < 0 ? pose.armLFwd : pose.armRFwd;
      pivot.rotation.set(-forward, 0, side * (.3 + lift), 'XYZ');
    });

    const height = Math.max(0, pose.y);
    shadow.scale.setScalar(1 - Math.min(.45, height * .6));
    shadowMaterial.opacity = .5 * (1 - Math.min(.7, height * 1.2));
  }

  let size = 0, ratio = 0;
  return {
    /** CSS size of the square canvas and the device pixel ratio to draw it at. */
    resize(cssSize: number, pixelRatio: number) {
      if (cssSize === size && pixelRatio === ratio) return;
      size = cssSize; ratio = pixelRatio;
      renderer.setPixelRatio(pixelRatio); renderer.setSize(cssSize, cssSize, false);
    },
    setRim(color: string, strength = .35) { rim.value.set(color).multiplyScalar(strength); },
    render(pose: NaviPose) { apply(pose); renderer.render(scene, camera); },
    dispose() {
      disposables.forEach(item => item.dispose());
      scene.environment?.dispose();
      renderer.dispose();
    },
  };
}

// Tubes are open at the ends; round them off with small spheres for a drawn, brush-like line.
function mergeCaps(tube: THREE.TubeGeometry, cap: THREE.SphereGeometry, curve: THREE.Curve<THREE.Vector3>) {
  const parts = [tube.toNonIndexed(), cap.clone().translate(...curve.getPoint(0).toArray()).toNonIndexed(), cap.clone().translate(...curve.getPoint(1).toArray()).toNonIndexed()];
  const count = parts.reduce((n, g) => n + g.getAttribute('position').count, 0);
  const position = new Float32Array(count * 3), normal = new Float32Array(count * 3);
  let offset = 0;
  for (const g of parts) {
    position.set(g.getAttribute('position').array as Float32Array, offset * 3);
    normal.set(g.getAttribute('normal').array as Float32Array, offset * 3);
    offset += g.getAttribute('position').count; g.dispose();
  }
  tube.dispose(); cap.dispose();
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(position, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normal, 3));
  return merged;
}

export type NaviModel = ReturnType<typeof createNaviModel>;
