// Navi's toqi: the four-cornered black-and-white skullcap of northern Tajikistan (toqii chusti), made to measure for
// Navi's head. A soft band hugs the head and squares off as it rises into four quilted panels that meet at a point.
// Each panel carries a white bodom (almond) and the band a row of arches over small peppers, all in raised chain
// stitch. The embroidery is drawn once into one small atlas: colour, plus relief and roughness packed together, so
// the whole cap is a single mesh and material that stays light on modest GPUs.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

type Point = [number, number];
type Row = { rho: number; y: number; n: number };

export type ToqiFit = {
  /** Body radius at a height, before the front-to-back flattening. */
  radiusAt: (y: number) => number;
  /** Front-to-back flattening of the body. */
  depth: number;
  /** The page's ambient rim light, shared with the porcelain. */
  rim: { value: THREE.Color };
  anisotropy: number;
};

/** Height at which the band sits on the head. The porcelain darkens softly just below it. */
export const TOQI_RIM = .58;
const BAND = .23;           // band height up to the crease
const RISE = .36;           // crown height above the crease
const SQUARE = 4;           // superellipse exponent of the squared-off band top
const APEX_SQUARE = 6;      // the ridges sharpen toward the apex
const DOME = 1.5;           // above 1, the panels bulge a little, as a cap filled by a head does
const FILLET = .032;        // softness of the crease between band and crown
const COLS = 16;            // columns per face
const ATLAS = 512;
const FACE = Math.PI / 2;

const FABRIC = '#111217', THREAD = '#f4f2ec', THREAD_SHADE = '#b3b1a9';

const smooth = (a: number, b: number, v: number) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
/** Distance to a rounded square (superellipse) of unit half-width in the direction phi; faces front, back and sides. */
const squircle = (phi: number, n: number) => Math.pow(Math.pow(Math.abs(Math.sin(phi)), n) + Math.pow(Math.abs(Math.cos(phi)), n), -1 / n);
/** Column angles across one face, a little denser toward the corners where the surface turns fastest. */
const column = (face: number, j: number) => { const t = -1 + 2 * j / COLS; return face * FACE + FACE / 2 * (.45 * t + .55 * Math.sin(t * Math.PI / 2)); };

// The cap's profile from the rim to the apex, as rows of (half-width, height, squareness).
function profile(radiusAt: (y: number) => number) {
  const rim = radiusAt(TOQI_RIM) + .004, top = TOQI_RIM + BAND, rhoTop = rim * .985;
  const band = (t: number): Row => ({ rho: rim + (rhoTop - rim) * t, y: TOQI_RIM + BAND * t, n: 2 + (SQUARE - 2) * smooth(0, 1, t) });
  const crown = (s: number): Row => ({ rho: rhoTop * s, y: top + RISE * (1 - Math.pow(s, DOME)), n: APEX_SQUARE + (SQUARE - APEX_SQUARE) * s });
  const tA = 1 - FILLET / BAND, sB = 1 - FILLET / rhoTop, A = band(tA), B = crown(sB);
  const rows: Row[] = [];
  for (let i = 0; i <= 8; i++) rows.push(band(tA * i / 8));
  for (let i = 1; i < 6; i++) {
    const u = i / 6, a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u;
    rows.push({ rho: a * A.rho + b * rhoTop + c * B.rho, y: a * A.y + b * top + c * B.y, n: a * A.n + b * SQUARE + c * B.n });
  }
  const crease = 8 + 3;
  for (let i = 0; i <= 16; i++) rows.push(crown(sB * Math.pow(1 - i / 16, 1.25)));
  // Distance along the profile, measured down the middle of a face.
  const along = [0];
  for (let i = 1; i < rows.length; i++) along.push(along[i - 1] + Math.hypot(rows[i].rho - rows[i - 1].rho, rows[i].y - rows[i - 1].y));
  return { rows, crease, along, rhoTop };
}

function surface(rows: Row[], depth: number) {
  const point = (i: number, phi: number, out = new THREE.Vector3()) => {
    const row = rows[i], r = row.rho * squircle(phi, row.n);
    return out.set(r * Math.sin(phi), row.y, r * Math.cos(phi) * depth);
  };
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), d = new THREE.Vector3();
  const normal = (i: number, phi: number, out = new THREE.Vector3()) => {
    const across = point(i, phi + 1e-3, a).sub(point(i, phi - 1e-3, b));
    const up = point(Math.min(rows.length - 1, i + 1), phi, c).sub(point(Math.max(0, i - 1), phi, d));
    out.crossVectors(across, up);
    return out.lengthSq() < 1e-12 ? out.set(0, 1, 0) : out.normalize();
  };
  return { point, normal };
}

// One sheet of the cap between two profile rows, four faces side by side. Faces keep their own seam vertices so each
// can carry a whole motif; normals come from the continuous surface, so the seams don't show in the shading.
function sheet(rows: Row[], depth: number, from: number, to: number, uv: (i: number, j: number, face: number, phi: number, row: THREE.Vector3[]) => Point) {
  const { point, normal } = surface(rows, depth);
  const perRow = 4 * (COLS + 1), count = (to - from + 1) * perRow;
  const positions = new Float32Array(count * 3), normals = new Float32Array(count * 3), uvs = new Float32Array(count * 2);
  const index: number[] = [], n = new THREE.Vector3();
  for (let i = from; i <= to; i++) {
    for (let face = 0; face < 4; face++) {
      const row = Array.from({ length: COLS + 1 }, (_, j) => point(i, column(face, j)));
      row.forEach((p, j) => {
        const phi = column(face, j), k = (i - from) * perRow + face * (COLS + 1) + j;
        positions.set([p.x, p.y, p.z], k * 3);
        normals.set(normal(i, phi, n).toArray(), k * 3);
        uvs.set(uv(i, j, face, phi, row), k * 2);
        if (i < to && j < COLS) { const up = k + perRow; index.push(k, k + 1, up + 1, k, up + 1, up); }
      });
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(index);
  return geometry;
}

// Embroidery. Three layers share one atlas layout: colour, relief (for the bump map) and roughness (silk thread is
// glossier than the cotton ground). Each region is drawn in cap units with y up.
type Layers = { color: CanvasRenderingContext2D; relief: CanvasRenderingContext2D; rough: CanvasRenderingContext2D };

function layers(): Layers {
  const layer = (fill: string) => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = ATLAS;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.fillStyle = fill; ctx.fillRect(0, 0, ATLAS, ATLAS);
    return ctx;
  };
  return { color: layer(FABRIC), relief: layer('#7a7a7a'), rough: layer('#e2e2e2') };
}

/** A region of the atlas: x from x0 over width, y from 0 over height, its bottom edge at pixel row `bottom`. */
function hoop(l: Layers, scale: number, x0: number, width: number, height: number, bottom: number, quilt: number): Layers {
  for (const ctx of [l.color, l.relief, l.rough]) {
    ctx.restore(); ctx.save();
    ctx.beginPath(); ctx.rect(0, bottom - height * scale, width * scale, height * scale); ctx.clip();
    ctx.setTransform(scale, 0, 0, -scale, -x0 * scale, bottom);
    ctx.globalCompositeOperation = 'source-over';
  }
  // Quilting: fine parallel channels stitched through the cotton, as on every chusti cap.
  const lines = Math.round(width / quilt);
  for (let i = 0; i <= lines; i++) {
    const x = x0 + i * width / lines;
    for (const [ctx, style, w] of [[l.relief, '#4e4e4e', 1.2], [l.color, '#0a0b0e', .9]] as const) {
      ctx.strokeStyle = style; ctx.lineWidth = w / scale;
      ctx.beginPath(); ctx.moveTo(x, -1); ctx.lineTo(x, height + 1); ctx.stroke();
    }
  }
  return l;
}

/** Points along a polyline at equal spacing. */
function resample(points: Point[], step: number) {
  const out: Point[] = [points[0]];
  let carry = 0;
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1], [bx, by] = points[i], len = Math.hypot(bx - ax, by - ay);
    let at = step - carry;
    while (at <= len) { out.push([ax + (bx - ax) * at / len, ay + (by - ay) * at / len]); at += step; }
    carry = len - (at - step);
  }
  const last = points[points.length - 1], tail = out[out.length - 1];
  if (Math.hypot(last[0] - tail[0], last[1] - tail[1]) > step * .35) out.push(last);
  return out;
}

/** Chain stitch: a line of small linked loops of silk, each slightly raised and glossy. */
function chain(e: Layers, points: Point[], width: number) {
  const links = resample(points, width * 1.3);
  for (let i = 1; i < links.length; i++) {
    const [ax, ay] = links[i - 1], [bx, by] = links[i];
    const angle = Math.atan2(by - ay, bx - ax), len = Math.hypot(bx - ax, by - ay), rx = len * .68, ry = width * .5;
    for (const ctx of [e.color, e.relief, e.rough]) { ctx.save(); ctx.translate((ax + bx) / 2, (ay + by) / 2); ctx.rotate(angle); }
    // Colour: the loop of thread, with a shaded eye where the next link passes through.
    e.color.fillStyle = THREAD; e.color.beginPath(); e.color.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); e.color.fill();
    e.color.strokeStyle = THREAD_SHADE; e.color.lineWidth = ry * .3;
    e.color.beginPath(); e.color.ellipse(rx * .12, 0, rx * .4, ry * .3, 0, 0, Math.PI * 2); e.color.stroke();
    // Relief: a rounded bump per link.
    const bump = e.relief.createRadialGradient(0, 0, 0, 0, 0, rx);
    bump.addColorStop(0, '#ffffff'); bump.addColorStop(.7, '#d4d4d4'); bump.addColorStop(1, '#8a8a8a');
    e.relief.globalCompositeOperation = 'lighten'; e.relief.fillStyle = bump;
    e.relief.beginPath(); e.relief.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); e.relief.fill();
    e.rough.fillStyle = '#6e6e6e'; e.rough.beginPath(); e.rough.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); e.rough.fill();
    for (const ctx of [e.color, e.relief, e.rough]) ctx.restore();
  }
}

/** A French knot: a small raised dot of thread. */
function knot(e: Layers, [x, y]: Point, radius: number) {
  e.color.fillStyle = THREAD; e.color.beginPath(); e.color.arc(x, y, radius, 0, Math.PI * 2); e.color.fill();
  e.color.strokeStyle = THREAD_SHADE; e.color.lineWidth = radius * .3; e.color.beginPath(); e.color.arc(x, y, radius * .45, 0, Math.PI * 2); e.color.stroke();
  const bump = e.relief.createRadialGradient(x, y, 0, x, y, radius);
  bump.addColorStop(0, '#ffffff'); bump.addColorStop(1, '#8a8a8a');
  e.relief.globalCompositeOperation = 'lighten'; e.relief.fillStyle = bump; e.relief.beginPath(); e.relief.arc(x, y, radius, 0, Math.PI * 2); e.relief.fill();
  e.rough.fillStyle = '#6e6e6e'; e.rough.beginPath(); e.rough.arc(x, y, radius, 0, Math.PI * 2); e.rough.fill();
}

const range = (count: number, f: (t: number) => Point) => Array.from({ length: count + 1 }, (_, i) => f(i / count));
/** A narrow loop from a base point to a tip, bulging by `width` to each side: a petal, leaf or pepper. */
const loop = ([bx, by]: Point, [tx, ty]: Point, width: number) => range(18, u => {
  const a = Math.PI * 2 * u, r = (1 - Math.cos(a)) / 2, len = Math.hypot(tx - bx, ty - by) || 1, w = Math.sin(a) * width;
  return [bx + (tx - bx) * r - (ty - by) / len * w, by + (ty - by) * r + (tx - bx) / len * w];
});

// The band of one face: a line along the hem, arches over it, and under each arch three small peppers (kalampir).
function drawBand(e: Layers, width: number) {
  const base = .034, stitch = .0135, arches = 4, foot = base + .016, rise = .125;
  chain(e, [[-.01, base], [width + .01, base]], stitch);
  for (let k = 0; k < arches; k++) {
    const x0 = width * k / arches, x1 = width * (k + 1) / arches, cx = (x0 + x1) / 2, half = (x1 - x0) / 2;
    chain(e, range(36, t => { const a = Math.PI * (1 - t); return [cx + Math.cos(a) * half * .95, foot + Math.sin(a) * rise]; }), stitch);
    [-.46, 0, .46].forEach((offset, i) => {
      const x = cx + offset * half, tall = i === 1 ? .074 : .054;
      chain(e, loop([x, base + .014], [x + offset * .03, base + .014 + tall], .013), stitch * .75);
    });
    knot(e, [x0, foot + rise * .62], .011);
  }
  knot(e, [width, foot + rise * .62], .011);
}

// The bodom as a brush stroke: a spine that runs out from the round belly and curls back on itself, the brush tapering
// to a fine point. The outline is the envelope of the brush along the spine, so the belly stays round and the tail
// leaves it smoothly. Local units: the belly has radius 1 and sits at the origin.
function bodom() {
  const length = 3.4, steps = 120, spine: { p: Point; t: Point; w: number; dw: number }[] = [];
  let x = 0, y = 0;
  for (let i = 0; i <= steps; i++) {
    const u = i / steps, heading = 2.75 * Math.pow(u, 2.3);
    spine.push({ p: [x, y], t: [Math.cos(heading), Math.sin(heading)], w: Math.pow(1 - u, 1.7), dw: -1.7 * Math.pow(1 - u, .7) / length });
    x += Math.cos(heading) * length / steps; y += Math.sin(heading) * length / steps;
  }
  /** A point at `u` along the spine, `offset` of the local width toward the inside of the curl (negative: outside). */
  const at = (u: number, offset = 0): Point => {
    const k = spine[Math.round(Math.min(1, Math.max(0, u)) * steps)];
    return [k.p[0] - k.t[1] * k.w * offset, k.p[1] + k.t[0] * k.w * offset];
  };
  const edge = (k: typeof spine[number], side: number): Point => {
    const along = -k.dw, across = Math.sqrt(Math.max(0, 1 - along * along)) * side;
    return [k.p[0] + k.w * (along * k.t[0] - across * k.t[1]), k.p[1] + k.w * (along * k.t[1] + across * k.t[0])];
  };
  const start = Math.atan2(edge(spine[0], 1)[1], edge(spine[0], 1)[0]);
  const outline: Point[] = [
    ...spine.map(k => edge(k, 1)),
    ...spine.slice().reverse().map(k => edge(k, -1)),
    ...range(36, t => { const a = -start - (Math.PI * 2 - 2 * start) * t; return [Math.cos(a), Math.sin(a)]; }),
  ];
  return { outline, at };
}

// One crown panel (x across the face, y up the slope from the crease): a bodom lying across the panel, its belly to
// one side and its tail curling up, filled with a sprig of loops and a zigzag, with a small flower above.
function drawPanel(e: Layers, half: number, slope: number) {
  const size = .27 * half, origin: Point = [-.28 * half, .28 * slope], turn = -.05;
  const place = ([x, y]: Point): Point => {
    const c = Math.cos(turn), s = Math.sin(turn);
    return [origin[0] + size * (c * x - s * y), origin[1] + size * (s * x + c * y)];
  };
  const { outline, at } = bodom();
  chain(e, outline.map(place), .02);
  // Sprig: a vein from the belly toward the tail, with paired leaf loops near the belly.
  chain(e, range(40, t => at(.02 + t * .72, .06)).map(place), .013);
  for (let k = 0; k < 4; k++) {
    const u = .04 + k * .07, reach = .62 - k * .1;
    for (const dir of [1, -1]) chain(e, loop(at(u, .06), at(u + .06, .06 + dir * reach), .1).map(place), .01);
  }
  // Zigzag along the outer edge.
  const teeth = 6;
  chain(e, range(teeth * 2, t => at(.12 + .42 * t, -(Math.round(t * teeth * 2) % 2 ? .42 : .74))).map(place), .011);
  // A small six-petalled flower above the belly.
  const flower: Point = [-.16 * half, .66 * slope], petal = .055 * half;
  for (let k = 0; k < 6; k++) {
    const a = Math.PI / 3 * k + .2;
    chain(e, loop(flower, [flower[0] + Math.cos(a) * petal, flower[1] + Math.sin(a) * petal], petal * .26), .008);
  }
  knot(e, flower, .008);
}

function fabric(rim: { value: THREE.Color }, map: THREE.Texture, detail: THREE.Texture) {
  const material = new THREE.MeshPhysicalMaterial({
    map, bumpMap: detail, roughnessMap: detail, roughness: 1, bumpScale: 2,
    sheen: 1, sheenColor: '#4b515f', sheenRoughness: .42, specularIntensity: .5, envMapIntensity: .6,
  });
  material.onBeforeCompile = shader => {
    shader.uniforms.naviRim = rim;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 naviRim;')
      .replace('#include <opaque_fragment>', `
        float toqiFacing = clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
        outgoingLight += naviRim * .3 * pow(1.0 - toqiFacing, 4.0);
        #include <opaque_fragment>`);
  };
  material.customProgramCacheKey = () => 'navi-toqi';
  return material;
}

export function createToqi({ radiusAt, depth, rim, anisotropy }: ToqiFit) {
  const { rows, crease, along, rhoTop } = profile(radiusAt);
  const { point } = surface(rows, 1);
  const mid = Math.round(crease / 2);
  const faceLength = Array.from({ length: COLS }, (_, j) => point(mid, column(0, j + 1)).distanceTo(point(mid, column(0, j)))).reduce((a, b) => a + b, 0);
  const bandHeight = along[crease], slope = along[along.length - 1] - along[crease];
  const half = rhoTop * squircle(FACE / 2, SQUARE) * Math.sin(FACE / 2);

  // Atlas: the crown panel on top, the band strip along the bottom, one scale for both so stitches match.
  const scale = Math.min(ATLAS / (2 * half), ATLAS / faceLength, (ATLAS - 24) / (slope + bandHeight));
  const l = layers(), quilt = faceLength / 40;
  drawPanel(hoop(l, scale, -half, 2 * half, slope, slope * scale, quilt), half, slope);
  drawBand(hoop(l, scale, 0, faceLength, bandHeight, ATLAS, quilt), faceLength);
  for (const ctx of [l.color, l.relief, l.rough]) ctx.restore();
  // A little tooth in the weave.
  const relief = l.relief.getImageData(0, 0, ATLAS, ATLAS), rough = l.rough.getImageData(0, 0, ATLAS, ATLAS);
  for (let i = 0; i < relief.data.length; i += 4) {
    relief.data[i] = Math.min(255, relief.data[i] + (Math.random() - .5) * 10);
    relief.data[i + 1] = rough.data[i + 1]; relief.data[i + 2] = 0; relief.data[i + 3] = 255;
  }
  l.relief.putImageData(relief, 0, 0);
  const map = new THREE.CanvasTexture(l.color.canvas), detail = new THREE.CanvasTexture(l.relief.canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = detail.anisotropy = anisotropy;

  const u = (x: number) => x * scale / ATLAS, v = (y: number) => y * scale / ATLAS;
  // Band: u follows the face's actual length, v rises to the crease.
  const band = sheet(rows, depth, 0, crease, (i, j, _face, _phi, row) => {
    let covered = 0, total = 0;
    for (let k = 1; k < row.length; k++) { const d = row[k].distanceTo(row[k - 1]); total += d; if (k <= j) covered += d; }
    return [u(faceLength * covered / total), v(along[i])];
  });
  // Crown: each panel is mapped flat across the face, so the bodom keeps its drawn proportions.
  const crown = sheet(rows, depth, crease, rows.length - 1, (i, _j, face, phi) => {
    const row = rows[i], across = row.rho * squircle(phi, row.n) * Math.sin(phi - face * FACE);
    return [u(half + across), 1 - v(slope - (along[i] - along[crease]))];
  });
  // The hem: a soft rolled binding around the rim, in plain cloth (a blank corner of the atlas).
  const hem = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 64 }, (_, j) => {
    const phi = Math.PI * 2 * j / 64, r = rows[0].rho + .006;
    return new THREE.Vector3(r * Math.sin(phi), rows[0].y + .004, r * Math.cos(phi) * depth);
  }), true), 80, .014, 6, true);
  const hemUv = hem.getAttribute('uv');
  for (let i = 0; i < hemUv.count; i++) hemUv.setXY(i, .012, .988);
  const geometry = mergeGeometries([band, crown, hem])!;
  [band, crown, hem].forEach(g => g.dispose());

  const material = fabric(rim, map, detail);
  const mesh = new THREE.Mesh(geometry, material);
  return { mesh, dispose: () => [geometry, material, map, detail].forEach(item => item.dispose()) };
}
