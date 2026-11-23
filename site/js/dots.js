// Ch.10: she is one of many. A crowd of women seen from behind (IL-12).
// Card 0: close on her (red phone). Card 1: the camera pulls back to the whole crowd
// (87,727 complaints to PCSW over five years, reported Mar 2026; the crowd is not drawn to scale).
// Card 2: the nearest twenty; ~17 phones go dark, ~3 stay lit (ActionAid 2022: >85% stayed silent, 14.9% complained).
//
// Performance architecture:
// The static SVG contains 5 repeating <pattern> fills (~35,000 vector shapes) and 295 <use> nodes.
// Animating scale/fill/color inside an SVG <g> forces CPU software re-rasterization on every frame.
// Here we parse the exact artwork from #IL-12 ONCE into 4 crisp GPU-backed <canvas> layers
// (back sea, her, front-20 lit, front-20 final), hide the heavy SVG, and animate ONLY pure HTML
// GPU translate3d/scale and layer opacity — achieving locked 60–120fps scrolling and zooming.
import { scene, activeCard, reduced } from './scroll.js';

const ZOOM = 2.4;

function parseTf(str) {
  let x = 0, y = 0, s = 1;
  if (!str) return [x, y, s];
  const tr = /translate\(\s*([-\d.]+)(?:[\s,]+([-\d.]+))?\s*\)/.exec(str);
  if (tr) { x = +tr[1]; y = tr[2] != null ? +tr[2] : 0; }
  const sc = /scale\(\s*([-\d.]+)\s*\)/.exec(str);
  if (sc) s = +sc[1];
  return [x, y, s];
}

function makePaths() {
  return {
    aBody: new Path2D('M-50 0C-50-44-36-66-13-74L-10-86H10L13-74C36-66 50-44 50 0Z'),
    aHead: new Path2D('M0-82C-21-82-29-101-29-121C-29-142-16-156 0-156C17-156 29-142 29-121C29-101 21-82 0-82Z'),
    bBody: new Path2D('M-52 0C-52-40-42-62-28-76C-36-96-33-152 0-154C33-152 36-96 28-76C42-62 52-40 52 0Z'),
    cVeil: new Path2D('M-27-128C-25-150 25-150 27-128C28-100 22-66 16-40C6-36-6-36-16-40C-22-66-28-100-27-128Z'),
    phRim: new Path2D('M29-130C31-104 22-86 13-77C35-69 49-48 51-14'),
  };
}

function drawFigure(ctx, P, kind, fill, stroke, sw, phoneColor) {
  const hasPhone = kind.endsWith('p');
  const base = hasPhone ? kind.slice(0, -1) : kind;

  if (hasPhone) {
    ctx.fillStyle = fill;
    ctx.fillRect(-48, -2, 96, 802);
    if (stroke && sw > 0) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = sw;
      ctx.strokeRect(-48, -2, 96, 802);
    }
  }

  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = sw;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  if (base === 'cwA') {
    ctx.fill(P.aBody); if (sw > 0) ctx.stroke(P.aBody);
    ctx.fill(P.aHead); if (sw > 0) ctx.stroke(P.aHead);
    ctx.beginPath(); ctx.arc(0, -152, 14, 0, Math.PI * 2);
    ctx.fill(); if (sw > 0) ctx.stroke();
  } else if (base === 'cwB') {
    ctx.fill(P.bBody); if (sw > 0) ctx.stroke(P.bBody);
  } else if (base === 'cwC') {
    ctx.fill(P.aBody); if (sw > 0) ctx.stroke(P.aBody);
    ctx.fill(P.aHead); if (sw > 0) ctx.stroke(P.aHead);
    ctx.save();
    ctx.globalAlpha *= 0.45;
    ctx.fillStyle = '#061718';
    ctx.fill(P.cVeil);
    ctx.restore();
    if (sw > 0) ctx.stroke(P.cVeil);
  }

  if (hasPhone && phoneColor) {
    ctx.save();
    ctx.fillStyle = phoneColor;
    ctx.globalAlpha *= 0.2;
    ctx.beginPath(); ctx.arc(42, -112, 34, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(42, -114);
    ctx.rotate(14 * Math.PI / 180);
    ctx.fillStyle = phoneColor;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-6, -11, 12, 22, 2);
    else ctx.rect(-6, -11, 12, 22);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha *= 0.55;
    ctx.strokeStyle = phoneColor;
    ctx.lineWidth = 2.5;
    ctx.stroke(P.phRim);
    ctx.restore();
  }
}

function extractArtwork(svg) {
  // Parse <pattern> definitions once
  const patterns = {};
  svg.querySelectorAll('defs > pattern').forEach((pat) => {
    const id = pat.id;
    const g = pat.querySelector('g');
    const items = [];
    pat.querySelectorAll('use').forEach((u) => {
      const href = (u.getAttribute('href') || u.getAttribute('xlink:href') || '').replace('#', '');
      const [x, y, s] = parseTf(u.getAttribute('transform'));
      items.push([href, x, y, s]);
    });
    patterns[id] = {
      x: +(pat.getAttribute('x') || 0),
      y: +(pat.getAttribute('y') || 0),
      w: +(pat.getAttribute('width') || 100),
      h: +(pat.getAttribute('height') || 100),
      fill: g ? g.getAttribute('fill') : '#163F41',
      stroke: g ? g.getAttribute('stroke') : '#0A2223',
      sw: g ? +(g.getAttribute('stroke-width') || 2) : 2,
      color: g ? g.getAttribute('color') : '#24605C',
      items,
    };
  });

  // Parse .cr-back rects & direct rows
  const backRects = [];
  const backRows = [];
  const crBack = svg.querySelector('.cr-back');
  if (crBack) {
    Array.prototype.forEach.call(crBack.children, (ch) => {
      const tag = ch.tagName.toLowerCase();
      if (tag === 'rect') {
        const m = /url\(#([^)]+)\)/.exec(ch.getAttribute('fill') || '');
        if (m) {
          backRects.push({
            pat: m[1],
            x: +ch.getAttribute('x'),
            y: +ch.getAttribute('y'),
            w: +ch.getAttribute('width'),
            h: +ch.getAttribute('height'),
            opacity: +(ch.getAttribute('opacity') || 1),
          });
        }
      } else if (tag === 'g') {
        const items = [];
        ch.querySelectorAll('use').forEach((u) => {
          const href = (u.getAttribute('href') || '').replace('#', '');
          const [x, y, s] = parseTf(u.getAttribute('transform'));
          items.push([href, x, y, s]);
        });
        backRows.push({
          fill: ch.getAttribute('fill') || '#195254',
          color: ch.getAttribute('color') || '#387c71',
          stroke: ch.getAttribute('stroke') || '#0A2223',
          sw: +(ch.getAttribute('stroke-width') || 2),
          items,
        });
      }
    });
  }

  // Parse .cr-r2 (split her vs others)
  const r2Others = [];
  let herItem = null;
  const crR2 = svg.querySelector('.cr-r2');
  if (crR2) {
    Array.prototype.forEach.call(crR2.children, (ch) => {
      const u = ch.querySelector('use');
      if (!u) return;
      const href = (u.getAttribute('href') || '').replace('#', '');
      const [x, y, s] = parseTf(ch.getAttribute('transform'));
      if (ch.classList.contains('her')) herItem = [href, x, y, s];
      else r2Others.push([href, x, y, s]);
    });
  }

  // Parse .cr-front (split .cx vs .tw-q / .tw-c)
  const frontCx = [];
  const frontTw = [];
  const crFront = svg.querySelector('.cr-front');
  if (crFront) {
    Array.prototype.forEach.call(crFront.children, (ch) => {
      const u = ch.querySelector('use');
      if (!u) return;
      const href = (u.getAttribute('href') || '').replace('#', '');
      const [x, y, s] = parseTf(ch.getAttribute('transform'));
      if (ch.classList.contains('tw')) {
        frontTw.push([href, x, y, s, ch.classList.contains('tw-c')]);
      } else {
        frontCx.push([href, x, y, s]);
      }
    });
  }

  return { patterns, backRects, backRows, r2Others, herItem, frontCx, frontTw };
}

function makeCanvas(cls, parent) {
  const c = document.createElement('canvas');
  c.className = 'crowd__layer ' + cls;
  parent.appendChild(c);
  return c;
}

function sizeLayer(c, bx0, by0, bw, bh, k, pxPerUnit) {
  const pw = Math.max(1, Math.round(bw * pxPerUnit));
  const ph = Math.max(1, Math.round(bh * pxPerUnit));
  c.width = pw;
  c.height = ph;
  c.style.left = (bx0 * k).toFixed(1) + 'px';
  c.style.top = (by0 * k).toFixed(1) + 'px';
  c.style.width = (bw * k).toFixed(1) + 'px';
  c.style.height = (bh * k).toFixed(1) + 'px';
  const ctx = c.getContext('2d');
  ctx.setTransform(pw / bw, 0, 0, ph / bh, -bx0 * (pw / bw), -by0 * (ph / bh));
  return ctx;
}

export function initDots() {
  const fig = document.querySelector('.crowd');
  if (!fig) return;
  const svg = fig.querySelector('svg');
  const cam = svg && svg.querySelector('.crowd__cam');
  const her = svg && svg.querySelector('.her');
  if (!cam || !her) return;

  // Keep static SVG fallback for reduced-motion or browsers without Path2D
  if (reduced || typeof window.Path2D !== 'function') {
    if (!reduced) fig.classList.add('crowd--live');
    return;
  }

  const P = makePaths();
  const art = extractArtwork(svg);
  const herPt = art.herItem
    ? [art.herItem[1], art.herItem[2] - 110 * art.herItem[3]]
    : [521, 760];

  // Build lightweight GPU-composited HTML stage
  const gpu = document.createElement('div');
  gpu.className = 'crowd__gpu';
  gpu.setAttribute('aria-hidden', 'true');
  const stage = document.createElement('div');
  stage.className = 'crowd__stage';
  gpu.appendChild(stage);

  const cBack = makeCanvas('crowd__layer--back', stage);
  const cHer = makeCanvas('crowd__layer--her', stage);
  const cTwLit = makeCanvas('crowd__layer--tw-lit', stage);
  const cTwEnd = makeCanvas('crowd__layer--tw-end', stage);

  const lbox = document.createElement('div');
  lbox.className = 'crowd__lbox';
  lbox.innerHTML =
    '<p class="crowd__lbig">Of every 20 harassed online,<br>~17 stay silent</p>' +
    '<p class="crowd__lsmall">~3 complain</p>';
  stage.appendChild(lbox);

  fig.appendChild(gpu);
  fig.classList.add('crowd--live', 'crowd--gpu');

  let state = -1;
  let k = 1, offX = 0, offY = 0, viewW = 0, viewH = 0, bakedW = 0;

  function drawItems(ctx, items, fill, stroke, sw, phoneColor) {
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      ctx.save();
      ctx.translate(it[1], it[2]);
      ctx.scale(it[3], it[3]);
      drawFigure(ctx, P, it[0], fill, stroke, sw, phoneColor);
      ctx.restore();
    }
  }

  function bake() {
    const r = fig.getBoundingClientRect();
    if (!r.width || !r.height) return;
    viewW = r.width;
    viewH = r.height;
    bakedW = window.innerWidth;
    k = Math.min(viewW, viewH) / 1000;
    offX = viewW - 1000 * k;
    offY = viewH - 1000 * k;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // 1. Background sea: bake ONLY the visible viewBox window (never waste off-screen pixels)
    const minX = Math.max(-1560, Math.floor(-offX / k) - 100);
    const maxX = 1060;
    const minY = Math.max(-1720, Math.floor(-offY / k) - 120);
    const maxY = 1140;
    const bw = maxX - minX;
    const bh = maxY - minY;
    // Cap backing texture cleanly to keep GPU upload & memory lightweight on mobile
    const backScale = Math.min(k * Math.min(dpr, 1.5), 2048 / Math.max(bw, bh));
    const bCtx = sizeLayer(cBack, minX, minY, bw, bh, k, backScale);

    // Paint the 5 tiled pattern regions once via createPattern (0.5ms instead of 35,000 SVG nodes!)
    const tileCache = {};
    for (let i = 0; i < art.backRects.length; i++) {
      const br = art.backRects[i];
      if (br.y + br.h < minY || br.y > maxY || br.x + br.w < minX || br.x > maxX) continue;
      const pat = art.patterns[br.pat];
      if (!pat) continue;
      let tile = tileCache[br.pat];
      if (!tile) {
        const ts = Math.max(0.5, Math.min(1.5, backScale * 1.25));
        const tc = document.createElement('canvas');
        tc.width = Math.max(1, Math.round(pat.w * ts));
        tc.height = Math.max(1, Math.round(pat.h * ts));
        const tctx = tc.getContext('2d');
        tctx.scale(tc.width / pat.w, tc.height / pat.h);
        // Draw items + wrap copies along edges so silhouettes spanning tile boundaries never clip
        for (let oy = -1; oy <= 1; oy++) {
          for (let ox = -1; ox <= 1; ox++) {
            tctx.save();
            tctx.translate(ox * pat.w, oy * pat.h);
            drawItems(tctx, pat.items, pat.fill, pat.stroke, pat.sw, pat.color);
            tctx.restore();
          }
        }
        tile = { canvas: tc, sx: pat.w / tc.width, sy: pat.h / tc.height, pat };
        tileCache[br.pat] = tile;
      }
      const pFill = bCtx.createPattern(tile.canvas, 'repeat');
      if (pFill) {
        bCtx.save();
        bCtx.globalAlpha = br.opacity;
        bCtx.translate(pat.x, pat.y);
        bCtx.scale(tile.sx, tile.sy);
        bCtx.fillStyle = pFill;
        const rx = Math.max(br.x, minX);
        const ry = Math.max(br.y, minY);
        const rw = Math.min(br.x + br.w, maxX) - rx;
        const rh = Math.min(br.y + br.h, maxY) - ry;
        if (rw > 0 && rh > 0) {
          bCtx.fillRect((rx - pat.x) / tile.sx, (ry - pat.y) / tile.sy, rw / tile.sx, rh / tile.sy);
        }
        bCtx.restore();
      }
    }

    // Paint mid-ground rows, r2 (except her), and front .cx
    for (let i = 0; i < art.backRows.length; i++) {
      const row = art.backRows[i];
      drawItems(bCtx, row.items, row.fill, row.stroke, row.sw, row.color);
    }
    drawItems(bCtx, art.r2Others, '#163F41', '#0A2223', 3, '#5FAF9B');
    drawItems(bCtx, art.frontCx, '#0E2C2E', '#0A2223', 3, '#8DD8C2');

    // 2. Her layer: tiny high-res texture so she stays Retina-crisp even at 2.4x zoom!
    if (art.herItem) {
      const hx = art.herItem[1], hy = art.herItem[2];
      const herScale = Math.min(k * dpr * ZOOM, 3.2);
      const hCtx = sizeLayer(cHer, hx - 90, hy - 190, 180, 340, k, herScale);
      drawItems(hCtx, [art.herItem], '#1B4648', '#0A2223', 3, '#E0564B');
    }

    // 3 & 4. The nearest 20 foreground women: lit state vs at-2 end state (pure GPU opacity crossfade!)
    // Extends to y=2050 so body columns never clip at the bottom when lifted on tall mobile screens.
    const twScale = Math.min(k * dpr * 1.35, 1600 / 1330);
    const litCtx = sizeLayer(cTwLit, -20, 720, 1080, 1330, k, twScale);
    const endCtx = sizeLayer(cTwEnd, -20, 720, 1080, 1330, k, twScale);
    drawItems(litCtx, art.frontTw, '#0E2C2E', '#0A2223', 3, '#8DD8C2');
    for (let i = 0; i < art.frontTw.length; i++) {
      const it = art.frontTw[i];
      const isComplain = it[4];
      endCtx.save();
      endCtx.translate(it[1], it[2]);
      endCtx.scale(it[3], it[3]);
      drawFigure(
        endCtx, P, it[0],
        isComplain ? '#246E72' : '#4A6260',
        '#0A2223', 3,
        isComplain ? '#B9F0E0' : '#33504F'
      );
      endCtx.restore();
    }

    // Position crisp HTML text label inside stage coordinates (matches viewBox x=500, y=640..750)
    lbox.style.left = '0px';
    lbox.style.width = (1000 * k).toFixed(1) + 'px';
    lbox.style.top = (588 * k).toFixed(1) + 'px';
    lbox.querySelector('.crowd__lbig').style.fontSize = (50 * k).toFixed(2) + 'px';
    lbox.querySelector('.crowd__lsmall').style.fontSize = (33 * k).toFixed(2) + 'px';

    applyCamera(false);
  }

  function applyCamera(animate) {
    if (!viewW || !viewH) return;
    const wide = viewW >= 900;
    const tall = viewH > viewW * 1.2;
    let tx = 0, ty = 0, z = 1;

    if (state === 2) {
      if (wide) {
        const ax0 = (viewW * 0.44 - offX) / k, ax1 = (viewW * 0.98 - offX) / k;
        const ay0 = (viewH * 0.1 - offY) / k, ay1 = (viewH * 0.97 - offY) / k;
        z = Math.min((ax1 - ax0) / 1040, (ay1 - ay0) / 370);
        tx = (ax0 + ax1) / 2 - z * 500;
        ty = (ay0 + ay1) / 2 - z * 775;
      } else {
        const lift = tall ? 600 - (0.17 * viewH - offY) / k : 110;
        tx = 0; ty = -lift; z = 1;
      }
    } else if (state === 1) {
      z = tall ? 1.6 : 1;
      tx = z === 1 ? 0 : 500 - z * 500;
      ty = z === 1 ? 0 : 1000 - z * 1000;
    } else {
      const sx = wide ? viewW * 0.71 : viewW * 0.5;
      const sy = wide ? viewH * 0.55 : viewH * 0.62;
      tx = (sx - offX) / k - ZOOM * herPt[0];
      ty = (sy - offY) / k - ZOOM * herPt[1];
      z = ZOOM;
    }

    const px = offX + tx * k;
    const py = offY + ty * k;
    if (!animate) stage.style.transition = 'none';
    stage.style.transform = 'translate3d(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px,0) scale(' + z.toFixed(4) + ')';
    if (!animate) {
      // Flush initial transform before enabling smooth GPU transitions
      void stage.offsetWidth;
      stage.style.transition = '';
    }
  }

  bake();

  scene('dots', (p, el) => {
    const a = activeCard(el);
    const s = a >= 2 ? 2 : a >= 1 ? 1 : 0;
    if (s === state) return;
    const first = state === -1;
    state = s;
    fig.classList.remove('at-0', 'at-1', 'at-2');
    fig.classList.add('at-' + s);
    window.__crowd = s;
    applyCamera(!first);
  });

  // Only re-bake when viewport width actually changes (ignores mobile URL-bar height slides!)
  let rz = 0;
  window.addEventListener('resize', () => {
    if (window.innerWidth === bakedW) return;
    cancelAnimationFrame(rz);
    rz = requestAnimationFrame(bake);
  }, { passive: true });
}
