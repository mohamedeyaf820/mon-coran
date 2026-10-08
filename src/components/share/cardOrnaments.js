/**
 * Frames and background motifs of the verse card, drawn from the primitives the
 * SVG sanitiser keeps (path, rect, circle, line, polygon, g): no <pattern>, no
 * <mask>, no <use>, no filter. Every function returns markup for a card of the
 * given size in the colours of one palette, and stays clear of the text column.
 */

const round1 = (value) => Math.round(value * 10) / 10;

/** Points of an eight-pointed star (two overlapping squares), tip radius r. */
export function starPoints(cx, cy, r) {
  const k = r / Math.SQRT2;
  const axis = `${round1(cx - r)},${round1(cy)} ${round1(cx)},${round1(cy - r)} ${round1(cx + r)},${round1(cy)} ${round1(cx)},${round1(cy + r)}`;
  const diagonal = `${round1(cx - k)},${round1(cy - k)} ${round1(cx + k)},${round1(cy - k)} ${round1(cx + k)},${round1(cy + k)} ${round1(cx - k)},${round1(cy + k)}`;
  return { axis, diagonal };
}

function starMarkup(cx, cy, r, fill, stroke, strokeWidth = 2) {
  const { axis, diagonal } = starPoints(cx, cy, r);
  return `<g fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"><polygon points="${axis}"/><polygon points="${diagonal}"/></g>`;
}

/** The same drawing in the four corners: the body is drawn for the top-left one. */
function mirrorToCorners(width, height, body) {
  return `<g>${body}</g>
    <g transform="translate(${width} 0) scale(-1 1)">${body}</g>
    <g transform="translate(0 ${height}) scale(1 -1)">${body}</g>
    <g transform="translate(${width} ${height}) scale(-1 -1)">${body}</g>`;
}

/** Four-pointed sparkle, tip radius r. */
function sparkle(x, y, r) {
  const q = round1(r * 0.18);
  return `M ${round1(x)} ${round1(y - r)} Q ${round1(x + q)} ${round1(y - q)} ${round1(x + r)} ${round1(y)} Q ${round1(x + q)} ${round1(y + q)} ${round1(x)} ${round1(y + r)} Q ${round1(x - q)} ${round1(y + q)} ${round1(x - r)} ${round1(y)} Q ${round1(x - q)} ${round1(y - q)} ${round1(x)} ${round1(y - r)} Z`;
}

/** Crescent: an outer circle with a smaller one bitten out of it. */
function crescent(cx, cy, r, bite = 0.82, shift = 0.34) {
  const innerR = r * bite;
  const innerCx = cx + r * shift;
  // Intersections of the two circles, on the line through the centres.
  const d = innerCx - cx;
  const a = (r * r - innerR * innerR + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, r * r - a * a));
  const x = cx + a;
  return `M ${round1(x)} ${round1(cy - h)} A ${round1(r)} ${round1(r)} 0 1 0 ${round1(x)} ${round1(cy + h)} A ${round1(innerR)} ${round1(innerR)} 0 1 1 ${round1(x)} ${round1(cy - h)} Z`;
}

/** Pointed arch with S-shaped shoulders. `d` insets the outline. */
function ogeePath(width, height, d = 0) {
  const inset = Math.round(width * 0.043);
  const left = inset + d;
  const right = width - inset - d;
  const centre = width / 2;
  const bottom = height - inset - d;
  const spring = inset + width * 0.34 + d * 0.4;
  const apex = inset + 18 + d * 1.5;
  const shoulder = width * 0.17;
  const rise = width * 0.2;
  const crown = width * 0.06;
  return {
    apex: round1(apex),
    spring: round1(spring),
    d: `M ${left} ${bottom} V ${round1(spring)} C ${left} ${round1(spring - rise)} ${round1(centre - shoulder)} ${round1(apex + rise * 0.55)} ${round1(centre - crown)} ${round1(apex + width * 0.04)} L ${centre} ${round1(apex)} L ${round1(centre + crown)} ${round1(apex + width * 0.04)} C ${round1(centre + shoulder)} ${round1(apex + rise * 0.55)} ${right} ${round1(spring - rise)} ${right} ${round1(spring)} V ${bottom} Z`,
  };
}

/**
 * Frames beyond the original six. Returns "" for an id it does not draw, so the
 * caller keeps its own frames first.
 */
export function buildExtraGeometry(width, height, preset, geometry) {
  const inset = Math.round(width * 0.043);
  const accent = preset.accent;
  const center = width / 2;

  if (geometry === "zellige") {
    // Tilework border: a double rule, an eight-pointed star set in every corner
    // and on the middle of each side, and a short chain of lozenges leaving each
    // corner (the zellij frame of a Maghrebi door).
    const reach = Math.round(width * 0.048);
    const cornerAt = inset + reach * 0.62;
    const lozenge = (x, y, size) => `M ${round1(x)} ${round1(y - size)} l ${size} ${size} l ${-size} ${size} l ${-size} ${-size} z`;
    const chain = [];
    for (let step = 0; step < 4; step += 1) {
      const offset = reach * 1.3 + step * 34;
      const size = 7 - step;
      chain.push(
        lozenge(inset + offset, inset, size),
        lozenge(inset, inset + offset, size),
        lozenge(width - inset - offset, inset, size),
        lozenge(width - inset, inset + offset, size),
        lozenge(inset + offset, height - inset, size),
        lozenge(inset, height - inset - offset, size),
        lozenge(width - inset - offset, height - inset, size),
        lozenge(width - inset, height - inset - offset, size),
      );
    }
    const medallion = (x, y, r) =>
      `${starMarkup(x, y, r, preset.background, accent, 2.2)}<circle cx="${x}" cy="${y}" r="${round1(r * 0.52)}" fill="none" stroke="${accent}" stroke-width="1.4" opacity="0.7"/><circle cx="${x}" cy="${y}" r="${round1(r * 0.17)}" fill="${accent}" opacity="0.9"/>`;
    return `
    <rect x="${inset}" y="${inset}" width="${width - inset * 2}" height="${height - inset * 2}" rx="4" fill="none" stroke="${accent}" stroke-width="2.4" opacity="0.88"/>
    <rect x="${inset + 14}" y="${inset + 14}" width="${width - (inset + 14) * 2}" height="${height - (inset + 14) * 2}" rx="2" fill="none" stroke="${accent}" stroke-width="1" opacity="0.4"/>
    <path d="${chain.join(" ")}" fill="${accent}" opacity="0.7"/>
    ${medallion(cornerAt, cornerAt, reach)}${medallion(width - cornerAt, cornerAt, reach)}${medallion(cornerAt, height - cornerAt, reach)}${medallion(width - cornerAt, height - cornerAt, reach)}
    ${medallion(center, inset, 17)}${medallion(center, height - inset, 17)}${medallion(inset, height / 2, 17)}${medallion(width - inset, height / 2, 17)}
  `;
  }

  if (geometry === "ribbon") {
    // Plaque: a broad band with cut corners and a hairline inside it.
    const cut = Math.round(width * 0.05);
    const band = (offset) => {
      const x0 = inset + offset;
      const y0 = inset + offset;
      const x1 = width - inset - offset;
      const y1 = height - inset - offset;
      const c = cut - offset * 0.4;
      return `M ${x0 + c} ${y0} H ${x1 - c} L ${x1} ${y0 + c} V ${y1 - c} L ${x1 - c} ${y1} H ${x0 + c} L ${x0} ${y1 - c} V ${y0 + c} Z`;
    };
    const studs = [
      [inset + cut * 0.42, inset + cut * 0.42],
      [width - inset - cut * 0.42, inset + cut * 0.42],
      [inset + cut * 0.42, height - inset - cut * 0.42],
      [width - inset - cut * 0.42, height - inset - cut * 0.42],
    ]
      .map(([x, y]) => `<circle cx="${round1(x)}" cy="${round1(y)}" r="4.5" fill="${preset.background}"/>`)
      .join("");
    return `
    <path d="${band(0)}" fill="none" stroke="${accent}" stroke-width="12" stroke-linejoin="round" opacity="0.9"/>
    <path d="${band(15)}" fill="none" stroke="${accent}" stroke-width="1.4" opacity="0.55"/>
    <path d="${band(26)}" fill="none" stroke="${accent}" stroke-width="1" opacity="0.28"/>
    ${studs}
  `;
  }

  if (geometry === "scrolls") {
    // Ottoman corners: a thin rounded frame, and in each corner a volute with
    // two leaves, as in the margins of an illuminated manuscript.
    const o = inset + 14;
    const arm = 150;
    const corner = `
      <path d="M ${o + arm} ${o} C ${o + 56} ${o} ${o} ${o + 56} ${o} ${o + arm}" fill="none" stroke="${accent}" stroke-width="2.6" opacity="0.92"/>
      <path d="M ${o + 44} ${o + 44} C ${o + 44} ${o + 24} ${o + 76} ${o + 22} ${o + 82} ${o + 44} C ${o + 88} ${o + 66} ${o + 58} ${o + 76} ${o + 48} ${o + 62} C ${o + 40} ${o + 52} ${o + 50} ${o + 42} ${o + 60} ${o + 48}" fill="none" stroke="${accent}" stroke-width="2.2" opacity="0.92"/>
      <circle cx="${o + 58}" cy="${o + 49}" r="3.2" fill="${accent}"/>
      <path d="M ${o + 96} ${o + 14} C ${o + 118} ${o + 6} ${o + 140} ${o + 14} ${o + 152} ${o + 30} C ${o + 130} ${o + 38} ${o + 108} ${o + 34} ${o + 96} ${o + 14} Z" fill="${accent}" opacity="0.8"/>
      <path d="M ${o + 14} ${o + 96} C ${o + 6} ${o + 118} ${o + 14} ${o + 140} ${o + 30} ${o + 152} C ${o + 38} ${o + 130} ${o + 34} ${o + 108} ${o + 14} ${o + 96} Z" fill="${accent}" opacity="0.8"/>
      <circle cx="${o + 96}" cy="${o + 70}" r="2.6" fill="${accent}" opacity="0.8"/>
      <circle cx="${o + 70}" cy="${o + 96}" r="2.6" fill="${accent}" opacity="0.8"/>`;
    const edges = [
      `M ${o + arm} ${o} H ${width - o - arm}`,
      `M ${o + arm} ${height - o} H ${width - o - arm}`,
      `M ${o} ${o + arm} V ${height - o - arm}`,
      `M ${width - o} ${o + arm} V ${height - o - arm}`,
    ].join(" ");
    return `
    <path d="${edges}" fill="none" stroke="${accent}" stroke-width="1.6" opacity="0.5"/>
    ${mirrorToCorners(width, height, corner)}
  `;
  }

  if (geometry === "ogee") {
    // Pointed arch with S-shaped shoulders, a finial at the apex, and a second
    // line inside it. The header sits under the apex, the spandrels keep the motif.
    const outer = ogeePath(width, height, 0);
    const inner = ogeePath(width, height, 20);
    return `
    <path d="${outer.d}" fill="${preset.surface}" fill-opacity="0.55" stroke="${accent}" stroke-width="2.6" stroke-opacity="0.92" stroke-linejoin="round"/>
    <path d="${inner.d}" fill="none" stroke="${accent}" stroke-width="1.2" opacity="0.42" stroke-linejoin="round"/>
    ${starMarkup(center, outer.apex - 4, 14, preset.background, accent, 2)}
    <circle cx="${inset + 10}" cy="${outer.spring}" r="5" fill="${accent}" opacity="0.8"/>
    <circle cx="${width - inset - 10}" cy="${outer.spring}" r="5" fill="${accent}" opacity="0.8"/>
  `;
  }

  return "";
}

/**
 * Background motifs beyond the original five. `veil` is the radial gradient the
 * caller defines, which calms the middle of the card where the Quran text sits.
 */
export function buildExtraMotif(width, height, preset, motif) {
  const accent = preset.accent;
  const veil = `<rect width="${width}" height="${height}" fill="url(#veil)"/>`;

  if (motif === "flowers") {
    // Flower of life: circles of one radius whose centres sit on a triangular grid.
    const radius = Math.round(width / 6.4);
    const rowStep = radius * 0.866;
    const rings = [];
    for (let row = -1; row * rowStep < height + radius; row += 1) {
      for (let col = -1; col * radius < width + radius * 2; col += 1) {
        const cx = col * radius + (row % 2 ? radius / 2 : 0);
        rings.push(`<circle cx="${round1(cx)}" cy="${round1(row * rowStep)}" r="${radius}"/>`);
      }
    }
    return `<g fill="none" stroke="${accent}" stroke-width="1.5" opacity="0.16">${rings.join("")}</g>${veil}`;
  }

  if (motif === "arabesque") {
    // Vine scrolls: an S-shaped stem with a curl at each end and two leaves,
    // repeated on a brick grid.
    const unit = Math.round(width / 3.6);
    const half = unit / 2;
    const vine = (cx, cy, flip) => {
      const f = flip ? -1 : 1;
      const x0 = cx - half;
      const x1 = cx + half;
      return `<path d="M ${round1(x0)} ${round1(cy)} C ${round1(cx - half * 0.4)} ${round1(cy - unit * 0.34 * f)} ${round1(cx + half * 0.4)} ${round1(cy + unit * 0.34 * f)} ${round1(x1)} ${round1(cy)}"/>
        <path d="M ${round1(x1)} ${round1(cy)} c ${round1(unit * 0.07)} ${round1(-unit * 0.12 * f)} ${round1(unit * 0.2)} ${round1(-unit * 0.06 * f)} ${round1(unit * 0.12)} ${round1(unit * 0.05 * f)} c ${round1(-unit * 0.05)} ${round1(unit * 0.07 * f)} ${round1(-unit * 0.14)} ${round1(unit * 0.02 * f)} ${round1(-unit * 0.08)} ${round1(-unit * 0.03 * f)}"/>
        <path d="M ${round1(x0)} ${round1(cy)} c ${round1(-unit * 0.07)} ${round1(unit * 0.12 * f)} ${round1(-unit * 0.2)} ${round1(unit * 0.06 * f)} ${round1(-unit * 0.12)} ${round1(-unit * 0.05 * f)} c ${round1(unit * 0.05)} ${round1(-unit * 0.07 * f)} ${round1(unit * 0.14)} ${round1(-unit * 0.02 * f)} ${round1(unit * 0.08)} ${round1(unit * 0.03 * f)}"/>
        <path d="M ${round1(cx - unit * 0.1)} ${round1(cy - unit * 0.02 * f)} c ${round1(unit * 0.02)} ${round1(-unit * 0.14 * f)} ${round1(unit * 0.12)} ${round1(-unit * 0.2 * f)} ${round1(unit * 0.2)} ${round1(-unit * 0.15 * f)} c ${round1(-unit * 0.03)} ${round1(unit * 0.12 * f)} ${round1(-unit * 0.12)} ${round1(unit * 0.18 * f)} ${round1(-unit * 0.2)} ${round1(unit * 0.15 * f)} z" fill="${accent}" fill-opacity="0.5"/>`;
    };
    const vines = [];
    for (let row = 0; row * unit * 0.62 < height + unit; row += 1) {
      for (let col = -1; col * unit < width + unit; col += 1) {
        vines.push(vine(col * unit + (row % 2 ? 0 : half) + half, row * unit * 0.62, row % 2 === 1));
      }
    }
    return `<g fill="none" stroke="${accent}" stroke-width="1.6" stroke-linecap="round" opacity="0.2">${vines.join("")}</g>${veil}`;
  }

  if (motif === "skyline") {
    // A mosque on the horizon: a bulb dome between two minarets and two small
    // domes, a crescent and a few stars in the sky. Silhouette only.
    const sky = width / 1080;
    const s = sky * 0.78;
    const cx = width / 2;
    const ground = Math.round(height * 0.915);
    const minaret = (x, top) => `
      <path d="M ${round1(x - 17 * s)} ${ground} V ${round1(top + 78 * s)} H ${round1(x - 24 * s)} V ${round1(top + 62 * s)} H ${round1(x + 24 * s)} V ${round1(top + 78 * s)} H ${round1(x + 17 * s)} V ${ground} Z"/>
      <path d="M ${round1(x - 18 * s)} ${round1(top + 62 * s)} Q ${round1(x - 18 * s)} ${round1(top + 20 * s)} ${round1(x)} ${round1(top - 12 * s)} Q ${round1(x + 18 * s)} ${round1(top + 20 * s)} ${round1(x + 18 * s)} ${round1(top + 62 * s)} Z"/>
      <path d="M ${round1(x)} ${round1(top - 12 * s)} V ${round1(top - 36 * s)}" stroke="${accent}" stroke-width="3" fill="none"/>`;
    const smallDome = (x, r) => `<path d="M ${round1(x - r)} ${ground} V ${round1(ground - r * 0.35)} A ${round1(r)} ${round1(r)} 0 0 1 ${round1(x + r)} ${round1(ground - r * 0.35)} V ${ground} Z"/>`;
    const bulb = `<path d="M ${round1(cx - 150 * s)} ${ground} V ${round1(ground - 90 * s)} C ${round1(cx - 150 * s)} ${round1(ground - 250 * s)} ${round1(cx - 40 * s)} ${round1(ground - 270 * s)} ${cx} ${round1(ground - 360 * s)} C ${round1(cx + 40 * s)} ${round1(ground - 270 * s)} ${round1(cx + 150 * s)} ${round1(ground - 250 * s)} ${round1(cx + 150 * s)} ${round1(ground - 90 * s)} V ${ground} Z"/>
      <path d="M ${cx} ${round1(ground - 360 * s)} V ${round1(ground - 400 * s)}" stroke="${accent}" stroke-width="3" fill="none"/>`;
    const stars = [
      [0.14, 0.1, 9], [0.27, 0.06, 6], [0.7, 0.07, 7], [0.9, 0.2, 8], [0.08, 0.26, 6], [0.93, 0.34, 6],
    ]
      .map(([x, y, r]) => `<path d="${sparkle(width * x, height * y, r * sky * 1.4)}"/>`)
      .join("");
    return `
    <g fill="${accent}" opacity="0.15">
      <rect x="0" y="${ground}" width="${width}" height="${height - ground}"/>
      ${bulb}${minaret(cx - 330 * s, ground - 330 * s)}${minaret(cx + 330 * s, ground - 330 * s)}${smallDome(cx - 220 * s, 62 * s)}${smallDome(cx + 220 * s, 62 * s)}
      <rect x="${round1(cx - 250 * s)}" y="${round1(ground - 60 * s)}" width="${round1(500 * s)}" height="${round1(60 * s)}"/>
    </g>
    <g fill="${accent}" opacity="0.5">
      <path d="${crescent(width * 0.82, height * 0.12, 44 * sky)}"/>
      ${stars}
    </g>`;
  }

  if (motif === "night") {
    // A crescent and a scatter of sparkles, kept to the margins of the card.
    const s = width / 1080;
    const marks = [];
    for (let index = 0; index < 34; index += 1) {
      const x = ((Math.sin(index * 12.9898) * 43758.5453) % 1 + 1) % 1;
      const y = ((Math.sin(index * 78.233) * 24634.6345) % 1 + 1) % 1;
      const dx = (x - 0.5) / 0.5;
      const dy = (y - 0.5) / 0.46;
      if (dx * dx + dy * dy < 0.62) continue; // the text column stays clear
      const r = (4 + ((index * 7) % 9)) * s;
      marks.push(
        index % 3 === 0
          ? `<circle cx="${round1(x * width)}" cy="${round1(y * height)}" r="${round1(r * 0.34)}"/>`
          : `<path d="${sparkle(x * width, y * height, r * 1.5)}"/>`,
      );
    }
    return `
    <g fill="${accent}" opacity="0.5">${marks.join("")}</g>
    <path d="${crescent(width * 0.87, height * 0.1, 46 * s)}" fill="${accent}" opacity="0.66"/>
    <circle cx="${round1(width * 0.87)}" cy="${round1(height * 0.1)}" r="${round1(86 * s)}" fill="${accent}" opacity="0.06"/>`;
  }

  return "";
}
