/* ============================================================
   Nutridash â€” grÃ¡ficos SVG sin dependencias
   ============================================================ */
(function () {
  const ND = (window.ND = window.ND || {});
  const C = (ND.charts = {});

  function points(values, w, h, pad) {
    const max = Math.max.apply(null, values);
    const min = Math.min.apply(null, values);
    const span = max - min || 1;
    const innerW = w - pad.l - pad.r;
    const innerH = h - pad.t - pad.b;
    return values.map((v, i) => ({
      x: pad.l + (i / Math.max(1, values.length - 1)) * innerW,
      y: pad.t + innerH - ((v - min) / span) * innerH,
      v
    }));
  }

  function smooth(pts) {
    if (!pts.length) return '';
    let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  }

  C.sparkline = function (values, color, w, h) {
    w = w || 88; h = h || 30;
    const pad = { l: 2, r: 2, t: 4, b: 4 };
    const pts = points(values, w, h, pad);
    const line = smooth(pts);
    const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${h - pad.b} L${pts[0].x.toFixed(1)},${h - pad.b} Z`;
    const id = 'sp' + Math.random().toString(36).slice(2, 8);
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">
      <defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".24"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
      <path d="${area}" fill="url(#${id})"/>
      <path d="${line}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="${pts[pts.length - 1].x.toFixed(1)}" cy="${pts[pts.length - 1].y.toFixed(1)}" r="2.4" fill="${color}"/>
    </svg>`;
  };

  C.area = function (values, labels, opts) {
    opts = opts || {};
    const w = 760, h = opts.height || 230;
    const pad = { l: 40, r: 16, t: 16, b: 30 };
    const series = opts.compare || null;
    const all = series ? values.concat(series) : values;
    const max = Math.max.apply(null, all) * 1.15;
    const innerW = w - pad.l - pad.r;
    const innerH = h - pad.t - pad.b;
    const inner = values.map((v, i) => ({ x: pad.l + (i / Math.max(1, values.length - 1)) * innerW, y: pad.t + innerH - (v / max) * innerH, v }));
    const line = smooth(inner);
    const area = `${line} L${inner[inner.length - 1].x.toFixed(1)},${pad.t + innerH} L${inner[0].x.toFixed(1)},${pad.t + innerH} Z`;
    const id = 'ar' + Math.random().toString(36).slice(2, 8);
    const color = opts.color || '#1d7a51';

    let grid = '';
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (innerH / 4) * i;
      const val = Math.round(max - (max / 4) * i);
      grid += `<line x1="${pad.l}" y1="${y}" x2="${w - pad.r}" y2="${y}" stroke="#eee8db" stroke-width="1" stroke-dasharray="${i === 4 ? '0' : '3 5'}"/>`;
      grid += `<text x="${pad.l - 9}" y="${y + 3.5}" text-anchor="end" font-size="9" fill="#858f88" font-family="Inter, sans-serif">${val}</text>`;
    }

    let xLabels = '';
    labels.forEach((label, i) => {
      const x = pad.l + (i / Math.max(1, labels.length - 1)) * innerW;
      xLabels += `<text x="${x}" y="${h - 8}" text-anchor="middle" font-size="9" fill="#858f88" font-family="Inter, sans-serif">${label}</text>`;
    });

    let dots = '';
    inner.forEach((p) => {
      dots += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="7" fill="transparent"><title>${p.v}</title></circle>`;
      dots += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.6" fill="#fff" stroke="${color}" stroke-width="2"/>`;
    });

    let compare = '';
    if (series) {
      const cpts = series.map((v, i) => ({ x: pad.l + (i / Math.max(1, series.length - 1)) * innerW, y: pad.t + innerH - (v / max) * innerH }));
      compare = `<path d="${smooth(cpts)}" fill="none" stroke="#c9bda6" stroke-width="1.6" stroke-dasharray="4 5" stroke-linecap="round"/>`;
    }

    return `<svg viewBox="0 0 ${w} ${h}" width="100%" role="img" aria-label="Serie de consultas entrantes">
      <defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".26"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
      ${grid}${xLabels}
      <path d="${area}" fill="url(#${id})"/>
      ${compare}
      <path d="${line}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round"/>
      ${dots}
    </svg>`;
  };

  C.bars = function (values, labels, opts) {
    opts = opts || {};
    const w = 520, h = opts.height || 190;
    const pad = { l: 12, r: 8, t: 14, b: 26 };
    const max = Math.max.apply(null, values) * 1.08;
    const innerW = w - pad.l - pad.r;
    const innerH = h - pad.t - pad.b;
    const gap = 12;
    const bw = (innerW - gap * (values.length - 1)) / values.length;
    let out = '';
    values.forEach((v, i) => {
      const bh = (v / max) * innerH;
      const x = pad.l + i * (bw + gap);
      const y = pad.t + innerH - bh;
      const last = i === values.length - 1;
      const color = last ? (opts.highlight || '#1d7a51') : '#dcd3c1';
      out += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="6" fill="${color}"><title>${ND.money(v)}</title></rect>`;
      out += `<text x="${(x + bw / 2).toFixed(1)}" y="${h - 8}" text-anchor="middle" font-size="9" fill="#858f88" font-family="Inter, sans-serif">${labels[i]}</text>`;
      if (last) out += `<text x="${(x + bw / 2).toFixed(1)}" y="${(y - 7).toFixed(1)}" text-anchor="middle" font-size="9" font-weight="600" fill="#1d7a51" font-family="Inter, sans-serif">${ND.money(v, true)}</text>`;
    });
    return `<svg viewBox="0 0 ${w} ${h}" width="100%" role="img" aria-label="Ingresos por mes">${out}</svg>`;
  };

  C.donut = function (segments, opts) {
    opts = opts || {};
    const size = opts.size || 168;
    const thickness = opts.thickness || 18;
    const r = (size - thickness) / 2;
    const c = 2 * Math.PI * r;
    const total = segments.reduce((s, x) => s + x.value, 0) || 1;
    let offset = 0;
    let rings = '';
    segments.forEach((seg) => {
      const len = (seg.value / total) * c;
      rings += `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${seg.color}" stroke-width="${thickness}"
        stroke-dasharray="${Math.max(0, len - 2.5)} ${c - Math.max(0, len - 2.5)}" stroke-dashoffset="${-offset}"
        stroke-linecap="round" transform="rotate(-90 ${size / 2} ${size / 2})"><title>${seg.label}: ${seg.value}</title></circle>`;
      offset += len;
    });
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${opts.label || 'DistribuciÃ³n'}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#f1ece1" stroke-width="${thickness}"/>
      ${rings}
      <text x="${size / 2}" y="${size / 2 - 4}" text-anchor="middle" font-size="26" font-weight="600" fill="#14231d" font-family="Inter, sans-serif">${opts.centerTop || total}</text>
      <text x="${size / 2}" y="${size / 2 + 15}" text-anchor="middle" font-size="9" letter-spacing="1.2" fill="#858f88" font-family="Inter, sans-serif">${(opts.centerSub || 'CONSULTAS').toUpperCase()}</text>
    </svg>`;
  };

  C.hbars = function (rows) {
    const max = Math.max.apply(null, rows.map((r) => r.value)) || 1;
    return rows.map((r) => `<div class="channel-row">
      <div class="channel-name">${r.icon || ''}${r.label}</div>
      <div class="channel-bar"><span style="width:${Math.round((r.value / max) * 100)}%;background:${r.color}"></span></div>
      <div class="channel-val"><strong>${r.display != null ? r.display : r.value}</strong>${r.suffix ? ' ' + r.suffix : ''}</div>
    </div>`).join('');
  };
})();
