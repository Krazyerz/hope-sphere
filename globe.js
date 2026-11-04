/* ---------- Cartoon globe ----------
   Land is painted once onto a flat map texture (longitude x latitude). Each frame,
   every pixel of the sphere looks up its own spot on that map, so the green can
   never leak or stretch across the globe when it rotates. */
const globe = (() => {
  const cv = $("globe"), ctx = cv.getContext("2d"), S = 260, dpr = Math.min(devicePixelRatio || 1, 2);
  cv.width = cv.height = S * dpr; ctx.scale(dpr, dpr);
  const slow = matchMedia("(prefers-reduced-motion: reduce)").matches ? .2 : 1;
  const INK = "#1c2742", TILT = -.4, cT = Math.cos(TILT), sT = Math.sin(TILT);
  const land = [
    [[-168,66],[-140,70],[-95,72],[-80,63],[-62,58],[-55,48],[-70,43],[-76,35],[-81,25],[-97,26],[-97,18],[-87,21],[-83,10],[-78,8],[-92,14],[-105,20],[-115,30],[-124,40],[-125,49],[-135,58],[-165,60]],
    [[-78,8],[-62,10],[-50,0],[-35,-6],[-40,-22],[-48,-28],[-58,-38],[-66,-46],[-72,-54],[-75,-45],[-71,-30],[-70,-18],[-81,-5]],
    [[-10,36],[-9,43],[-2,48],[5,53],[10,58],[25,70],[60,70],[100,77],[140,72],[180,66],[160,58],[142,52],[135,35],[122,30],[122,22],[108,20],[105,10],[100,2],[98,16],[88,22],[80,10],[73,20],[58,25],[48,30],[36,36],[27,37],[20,40],[12,38],[3,43]],
    [[-17,15],[-10,35],[10,37],[32,31],[43,12],[51,12],[40,-5],[40,-16],[33,-27],[20,-35],[14,-22],[9,-1],[-8,4]],
    [[114,-22],[130,-12],[142,-11],[153,-26],[147,-39],[135,-34],[115,-34]]
  ];
  // 1. paint the flat map once
  const TW = 1024, TH = 512, tex = document.createElement("canvas");
  tex.width = TW; tex.height = TH;
  const tc = tex.getContext("2d");
  tc.beginPath();
  land.forEach(poly => { poly.forEach((p, i) => { const x = (p[0] + 180) / 360 * TW, y = (90 - p[1]) / 180 * TH; i ? tc.lineTo(x, y) : tc.moveTo(x, y); }); tc.closePath(); });
  tc.fillStyle = "#9cc08a"; tc.fill();
  tc.lineWidth = 6; tc.lineJoin = "round"; tc.strokeStyle = INK; tc.stroke();
  const td = tc.getImageData(0, 0, TW, TH).data;
  // 2. precompute, for every pixel of the sphere, where it sits on the map
  const R = 78, c = S / 2, D = R * 4, half = D / 2;          // drawn at 2x then scaled down for smooth edges
  const gc = document.createElement("canvas"); gc.width = gc.height = D;
  const gx = gc.getContext("2d"), img = gx.createImageData(D, D), d = img.data;
  const idx = [], base = new Float32Array(D * D), row = new Int16Array(D * D), shade = new Float32Array(D * D);
  for (let j = 0; j < D; j++) for (let i = 0; i < D; i++) {
    const nx = (i + .5 - half) / half, ny = -(j + .5 - half) / half, r2 = nx * nx + ny * ny;
    if (r2 > 1) continue;
    const z = Math.sqrt(1 - r2), y = ny * cT + z * sT, zz = -ny * sT + z * cT, k = j * D + i;
    base[k] = Math.atan2(nx, zz);
    row[k] = Math.min(TH - 1, Math.max(0, Math.floor((.5 - Math.asin(y) / Math.PI) * TH)));
    shade[k] = (nx * .6 - ny * .4 > .4) ? .84 : 1;
    idx.push(k);
  }
  const OC = [111, 168, 199];
  let rings = [];
  function envelope(x, y, s) {
    ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.fillStyle = "#f6eedb"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.roundRect(x - s, y - s * .68, s * 2, s * 1.36, 3); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - s, y - s * .68); ctx.lineTo(x, y + s * .1); ctx.lineTo(x + s, y - s * .68); ctx.stroke();
  }
  const flights = [];
  let bursts = [], slowFn = () => [], glowObj = {}, lastRot = 0;
  const unit = p => { const [la, lo] = geo(p).map(v => v * Math.PI / 180); return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)]; };
  function place(v, h, rot) {                 // point on the map -> screen position (z > 0 means facing us)
    const cr = Math.cos(rot), sr = Math.sin(rot), x = v[0] * cr + v[2] * sr, z0 = -v[0] * sr + v[2] * cr;
    return { x: c + x * R * h, y: c - (v[1] * cT - z0 * sT) * R * h, z: v[1] * sT + z0 * cT };
  }
  function arc(A, B, u) {                     // great-circle path that rises above the surface mid-flight
    const om = Math.acos(Math.min(1, A[0] * B[0] + A[1] * B[1] + A[2] * B[2])) || .001, s = Math.sin(om);
    const k1 = Math.sin((1 - u) * om) / s, k2 = Math.sin(u * om) / s;
    return { v: [0, 1, 2].map(i => A[i] * k1 + B[i] * k2), h: 1 + (.1 + .3 * om / Math.PI) * Math.sin(Math.PI * u) };
  }
  function items(ms) {
    const out = [];
    flights.forEach(f => {
      const u = (ms - f.t0) / f.dur;
      if (u >= 1) { f.dead = true; return; }
      if (u >= 0) out.push({ A: f.A, B: f.B, u, size: f.ambient ? 6 : 10, al: f.ambient ? .5 : 1, trail: true });
    });
    slowFn().forEach(m => out.push({ A: unit(m.from), B: unit(m.to), u: Math.min(.98, Math.max(0, m.u)), size: 8, al: .95, trail: false }));
    return out;
  }
  function pass(front, its, rot) {            // far-side pass is drawn before the globe, near-side after
    its.forEach(it => [0, .025, .05, .075, .1].slice(0, it.trail ? 5 : 1).forEach((d, k) => {
      if (it.u - d < 0) return;
      const a = arc(it.A, it.B, it.u - d), p = place(a.v, a.h, rot);
      if ((p.z >= 0) !== front) return;
      ctx.globalAlpha = it.al * (1 - k * .18);
      if (k === 0) envelope(p.x, p.y, it.size);
      else { ctx.fillStyle = "#e9b872"; ctx.beginPath(); ctx.arc(p.x, p.y, 2.4 - k * .35, 0, 6.283); ctx.fill(); }
    }));
    ctx.globalAlpha = 1;
  }
  function dots(rot, ms) {                    // soft glow for every country that has sent letters
    for (const name in glowObj) {
      const p = place(unit(name), 1, rot); if (p.z < .05) continue;
      const k = Math.min(glowObj[name], 14), r = (5 + k * .9) * (.55 + .45 * p.z), pulse = .75 + .25 * Math.sin(ms / 700 + p.x);
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      g.addColorStop(0, "rgba(255,226,160," + ((.5 + k * .03) * pulse).toFixed(2) + ")"); g.addColorStop(1, "rgba(233,184,114,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.283); ctx.fill();
    }
  }
  function draw(ms) {
    const rot = ms / 1000 * slow * .3, off = rot / (2 * Math.PI); lastRot = rot;
    ctx.clearRect(0, 0, S, S);
    const its = items(ms);
    pass(false, its, rot);
    for (let n = 0; n < idx.length; n++) {
      const k = idx[n];
      let u = base[k] / 6.283185 + .5 - off; u -= Math.floor(u);
      const ti = (row[k] * TW + ((u * TW) | 0)) * 4, a = td[ti + 3] / 255, s = shade[k], o = k * 4;
      d[o] = (OC[0] * (1 - a) + td[ti] * a) * s;
      d[o + 1] = (OC[1] * (1 - a) + td[ti + 1] * a) * s;
      d[o + 2] = (OC[2] * (1 - a) + td[ti + 2] * a) * s;
      d[o + 3] = 255;
    }
    gx.putImageData(img, 0, 0);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(gc, c - R, c - R, R * 2, R * 2);
    ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(c, c, R, 0, 6.283); ctx.stroke();
    ctx.lineWidth = 3.5; ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(c, c, R * .8, Math.PI * 1.08, Math.PI * 1.3); ctx.stroke();
    dots(rot, ms);
    pass(true, its, rot);
    bursts = bursts.filter(b => (b.t += .02) < 1);
    bursts.forEach(b => { const p = place(b.p, 1, rot); if (p.z < 0) return; ctx.strokeStyle = "rgba(233,184,114," + (1 - b.t) + ")"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, 4 + b.t * 24, 0, 6.283); ctx.stroke(); });
    rings = rings.filter(r => (r.t += .012) < 1);
    rings.forEach(r => { ctx.strokeStyle = "rgba(233,184,114," + (1 - r.t) + ")"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(c, c, R * (1.08 + r.t * .4), 0, 6.283); ctx.stroke(); });
    for (let i = flights.length - 1; i >= 0; i--) if (flights[i].dead) {
      const f = flights.splice(i, 1)[0];
      if (!f.ambient) bursts.push({ p: f.B, t: 0 });
      if (f.done) f.done();
    }
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
  return {
    pulse() { rings.push({ t: 0 }); },
    fly(from, to, o = {}) { flights.push({ A: unit(from), B: unit(to), t0: performance.now(), dur: o.dur || 5000, ambient: !!o.ambient, done: o.done }); },
    center() { return [Math.asin(sT) * 180 / Math.PI, -lastRot * 180 / Math.PI]; },   // the spot facing the viewer
    setSlow(fn) { slowFn = fn; }, setGlow(o) { glowObj = o; }
  };
})();
