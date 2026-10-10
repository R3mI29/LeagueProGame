// Art procédural du skin MSI : affiche "verre brisé" en SVG, injectée en background CSS.
// Change MSI_SEED pour obtenir un autre impact / d'autres fissures.
export const MSI_SEED = 3;

const W = 420, H = 600;
const INK = '#0a0a0a', RED = '#E6192B', YELLOW = '#FFEA00', PAPER = '#efece4';
const TAU = Math.PI * 2;

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const svgUrl = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
const f = (n) => n.toFixed(1);
const poly = (pts, dx = 0, dy = 0) => pts.map(([x, y]) => `${f(x + dx)},${f(y + dy)}`).join(' ');

/* ---------- Éclat de peinture : blob organique + pointes ---------- */
function splat(rand, cx, cy, rx, ry) {
  const ph = [rand() * TAU, rand() * TAU, rand() * TAU];
  const base = (t) => 84 + 14 * Math.sin(2 * t + ph[0]) + 9 * Math.sin(5 * t + ph[1]) + 5 * Math.sin(9 * t + ph[2]);

  const n = 8 + Math.floor(rand() * 3);
  const spikes = Array.from({ length: n }, (_, i) => ({
    t: (i / n) * TAU + (rand() - 0.5) * 0.5,
    h: 55 + rand() * 105,
    w: 0.10 + rand() * 0.10,
  }));

  // angles réguliers + sommet exact de chaque pointe (sinon une pointe fine peut être "ratée")
  const angles = Array.from({ length: 56 }, (_, i) => (i / 56) * TAU);
  spikes.forEach(s => angles.push(((s.t % TAU) + TAU) % TAU));
  angles.sort((a, b) => a - b);

  const radius = (t) => {
    let r = base(t);
    for (const s of spikes) {
      const d = Math.abs((((t - s.t + Math.PI) % TAU) + TAU) % TAU - Math.PI);
      if (d < s.w) r += s.h * Math.pow(1 - d / s.w, 1.6);
    }
    return r;
  };

  const pts = angles.map(t => {
    const r = radius(t) * (0.97 + rand() * 0.06);
    return [cx + Math.cos(t) * r * rx, cy + Math.sin(t) * r * ry];
  });
  const edge = (t, k = 1) => [cx + Math.cos(t) * base(t) * k * rx, cy + Math.sin(t) * base(t) * k * ry];
  return { pts, spikes, edge, cx, cy, rx, ry };
}

/* ---------- Fissures effilées (épaisses à la racine, pointues au bout) ---------- */
function walk(rand, [x, y], angle, len, segs) {
  const pts = [[x, y]];
  const step = len / segs;
  for (let i = 0; i < segs; i++) {
    angle += (rand() - 0.5) * 0.7;
    const s = step * (0.7 + rand() * 0.6);
    x += Math.cos(angle) * s;
    y += Math.sin(angle) * s;
    pts.push([x, y]);
  }
  return { pts, angle };
}

function taper(pts, w0) {
  const L = [], R = [];
  pts.forEach((p, i) => {
    const q = pts[Math.min(i + 1, pts.length - 1)], o = pts[Math.max(i - 1, 0)];
    const dx = q[0] - o[0], dy = q[1] - o[1], n = Math.hypot(dx, dy) || 1;
    const w = (w0 * (1 - i / (pts.length - 1))) / 2;
    L.push([p[0] - (dy / n) * w, p[1] + (dx / n) * w]);
    R.push([p[0] + (dy / n) * w, p[1] - (dx / n) * w]);
  });
  return [...L, ...R.reverse()];
}

function cracks(rand, s) {
  const out = [], mains = [];
  const count = 11;
  for (let i = 0; i < count; i++) {
    const t = (i / count) * TAU + (rand() - 0.5) * 0.3;
    const { pts } = walk(rand, s.edge(t, 0.98), t, 230 + rand() * 330, 4 + Math.floor(rand() * 3));
    mains.push(pts);
    out.push(taper(pts, 3.2 + rand() * 3));

    // branche sur un coude
    if (rand() > 0.35) {
      const k = 1 + Math.floor(rand() * (pts.length - 2));
      const dir = Math.atan2(pts[k + 1][1] - pts[k][1], pts[k + 1][0] - pts[k][0]);
      const b = walk(rand, pts[k], dir + (rand() > 0.5 ? 1 : -1) * (0.5 + rand() * 0.6), 60 + rand() * 90, 2 + Math.floor(rand() * 2));
      out.push(taper(b.pts, 1.8 + rand() * 1.2));
    }
  }
  // toile : anneaux fins entre fissures voisines
  let web = '';
  [2, 3].forEach(k => {
    for (let i = 0; i < mains.length; i++) {
      const a = mains[i][k], b = mains[(i + 1) % mains.length][k];
      if (!a || !b || rand() < 0.3) continue;
      if (Math.hypot(a[0] - b[0], a[1] - b[1]) > 190) continue;
      web += `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}"/>`;
    }
  });
  return { shards: out, web };
}

/* ---------- Gouttes projetées (éclats pointés vers l'extérieur) ---------- */
function drops(rand, s) {
  let out = '';
  for (let i = 0; i < 16; i++) {
    const t = rand() * TAU;
    const r0 = 120 * Math.max(s.rx, s.ry) * (0.9 + rand() * 0.7);
    const x = s.cx + Math.cos(t) * r0 * (s.rx / Math.max(s.rx, s.ry)) * 1.05;
    const y = s.cy + Math.sin(t) * r0 * (s.ry / Math.max(s.rx, s.ry)) * 1.05;
    if (x < 8 || x > W - 8 || y < 8 || y > 250) continue;
    const len = 8 + rand() * 20, wd = 2.5 + rand() * 4;
    const tip = [x + Math.cos(t) * len, y + Math.sin(t) * len];
    const nx = -Math.sin(t) * wd, ny = Math.cos(t) * wd;
    out += `<polygon points="${poly([tip, [x + nx, y + ny], [x - Math.cos(t) * 3, y - Math.sin(t) * 3], [x - nx, y - ny]])}" fill="${rand() > 0.8 ? INK : RED}"/>`;
  }
  return out;
}

/* ---------- Trame de points (demi-teinte) ---------- */
function halftone(cx, cy, reach, cell, maxR) {
  let out = '';
  for (let row = 0, y = 0; y <= H; y += cell * 0.866, row++) {
    const off = (row % 2) * cell / 2;
    for (let x = -cell; x <= W + cell; x += cell) {
      const px = x + off, k = 1 - Math.hypot(px - cx, y - cy) / reach;
      if (k <= 0.12) continue;
      out += `<circle cx="${Math.round(px)}" cy="${Math.round(y)}" r="${f(maxR * Math.pow(k, 0.9))}"/>`;
    }
  }
  return out;
}

export function buildMsiArt(seed = MSI_SEED) {
  const rand = rng(seed);
  const s = splat(rand, W / 2, 98, 1.3, 0.72);
  const c = cracks(rand, s);

  // Surligneur calé sur la ligne « MOYENNE » (y ≈ 150 à 177 px depuis le haut du panneau)
  const hl = '24,151 120,148 220,150 320,146 402,147 407,153 401,159 406,165 400,171 404,175 '
           + '310,178 214,174 110,178 20,176 15,170 21,164 14,158 20,152';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`
    // trame de demi-teinte dans le coin bas droit
    + `<g fill="${INK}" opacity="0.9">${halftone(W, H, 235, 13, 3.4)}</g>`
    // éclats noirs / rouges dans les coins
    + `<polygon points="352,0 420,0 420,68" fill="${INK}"/><polygon points="388,0 420,0 420,32" fill="${RED}"/>`
    + `<polygon points="0,540 0,600 72,600" fill="${INK}"/><polygon points="0,572 0,600 34,600" fill="${RED}"/>`
    // toile + gouttes
    + `<g stroke="${INK}" stroke-width="0.9" opacity="0.8">${c.web}</g>`
    + drops(rand, s)
    // impact : ombre noire décalée puis éclat rouge
    + `<polygon points="${poly(s.pts, 9, 9)}" fill="${INK}"/>`
    + `<polygon points="${poly(s.pts)}" fill="${RED}"/>`
    // fissures par-dessus
    + `<g fill="${INK}">${c.shards.map(p => `<polygon points="${poly(p)}"/>`).join('')}</g>`
    // surligneur
    + `<polygon points="${hl}" fill="${YELLOW}"/>`
    + `</svg>`;
}

export const MSI_PAPER = PAPER;
export const MSI_ART = svgUrl(buildMsiArt());