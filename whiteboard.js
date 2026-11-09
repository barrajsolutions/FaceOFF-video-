/* Whiteboard animation style: a hand draws doodles, sketches of your images and handwritten
 * words on a board, scene by scene. All artwork here is original and drawn with paths.
 */
(() => {
  'use strict';

  const circle = (cx, cy, r) => `M${cx - r} ${cy} A${r} ${r} 0 1 0 ${cx + r} ${cy} A${r} ${r} 0 1 0 ${cx - r} ${cy}`;

  function gearPath() {
    const pts = [];
    const teeth = 8;
    for (let i = 0; i < teeth * 4; i++) {
      const a = (i / (teeth * 4)) * Math.PI * 2;
      const r = i % 4 < 2 ? 40 : 30;
      pts.push(`${(50 + Math.cos(a) * r).toFixed(1)} ${(50 + Math.sin(a) * r).toFixed(1)}`);
    }
    return 'M' + pts.join(' L') + ' Z';
  }
  const GEAR = gearPath();

  // name: { k: keywords, d: stroke path (100x100 box), f: optional fill path, color: fill color }
  const DOODLES = {
    idea: { k: ['idea', 'ideas', 'think', 'thinking', 'thought', 'creative', 'solution', 'tip', 'tips', 'realize', 'genius', 'trick', 'hack'],
      d: 'M50 10 C29 10 19 27 21 42 C23 55 34 59 36 70 L64 70 C66 59 77 55 79 42 C81 27 71 10 50 10 Z M38 78 L62 78 M40 86 L60 86 M45 94 L55 94 M44 70 L44 52 L50 58 L56 52 L56 70',
      f: 'M50 10 C29 10 19 27 21 42 C23 55 34 59 36 70 L64 70 C66 59 77 55 79 42 C81 27 71 10 50 10 Z', color: '#ffe066' },
    brain: { k: ['brain', 'brains', 'mind', 'mental', 'memory', 'smart', 'intelligence', 'iq', 'psychology', 'neuron'],
      d: 'M50 18 C44 12 32 12 29 20 C19 19 13 28 16 37 C8 42 9 55 17 59 C13 68 20 78 30 77 C33 86 45 88 50 81 C55 88 67 86 70 77 C80 78 87 68 83 59 C91 55 92 42 84 37 C87 28 81 19 71 20 C68 12 56 12 50 18 Z M50 18 L50 81 M30 32 C36 34 38 40 34 46 M24 56 C32 54 38 58 40 64 M70 32 C64 34 62 40 66 46 M76 56 C68 54 62 58 60 64',
      f: 'M50 18 C44 12 32 12 29 20 C19 19 13 28 16 37 C8 42 9 55 17 59 C13 68 20 78 30 77 C33 86 45 88 50 81 C55 88 67 86 70 77 C80 78 87 68 83 59 C91 55 92 42 84 37 C87 28 81 19 71 20 C68 12 56 12 50 18 Z', color: '#ffc9de' },
    heart: { k: ['love', 'heart', 'care', 'health', 'relationship', 'relationships', 'kind', 'kindness', 'feelings', 'emotion', 'emotions'],
      d: 'M50 86 C22 64 10 47 17 31 C25 14 44 17 50 32 C56 17 75 14 83 31 C90 47 78 64 50 86 Z', color: '#ff8fa3' },
    star: { k: ['star', 'stars', 'best', 'top', 'great', 'amazing', 'success', 'successful', 'famous', 'quality', 'rating', 'perfect'],
      d: 'M50 8 L61 37 L92 38 L68 57 L77 88 L50 70 L23 88 L32 57 L8 38 L39 37 Z', color: '#ffd43b' },
    moon: { k: ['sleep', 'sleeping', 'night', 'tonight', 'dream', 'dreams', 'bed', 'bedtime', 'rest', 'tired', 'asleep', 'nap', 'insomnia'],
      d: 'M60 14 C38 18 25 36 27 56 C29 78 49 91 72 87 C57 81 47 67 47 51 C47 35 52 22 60 14 Z M70 24 L80 24 L70 34 L80 34 M83 42 L90 42 L83 50 L90 50',
      f: 'M60 14 C38 18 25 36 27 56 C29 78 49 91 72 87 C57 81 47 67 47 51 C47 35 52 22 60 14 Z', color: '#ffe9a8' },
    sun: { k: ['sun', 'sunny', 'morning', 'summer', 'sunlight', 'bright', 'wake', 'sunrise', 'happy', 'happiness', 'positive'],
      d: circle(50, 50, 18) + ' M50 12 L50 24 M50 76 L50 88 M12 50 L24 50 M76 50 L88 50 M23 23 L32 32 M68 68 L77 77 M77 23 L68 32 M32 68 L23 77',
      f: circle(50, 50, 18), color: '#ffd43b' },
    clock: { k: ['time', 'clock', 'hour', 'hours', 'minute', 'minutes', 'late', 'early', 'earlier', 'wait', 'waiting', 'slow', 'schedule', 'deadline', 'seconds'],
      d: circle(50, 50, 38) + ' M50 24 L50 50 L68 60 M50 14 L50 19 M86 50 L81 50 M50 86 L50 81 M14 50 L19 50',
      f: circle(50, 50, 38), color: '#a5d8ff' },
    calendar: { k: ['day', 'days', 'week', 'weeks', 'month', 'months', 'year', 'years', 'date', 'daily', 'today', 'tomorrow', 'calendar', 'weekend'],
      d: 'M14 22 L86 22 L86 88 L14 88 Z M14 38 L86 38 M32 12 L32 30 M68 12 L68 30 M28 52 L36 52 M46 52 L54 52 M64 52 L72 52 M28 68 L36 68 M46 68 L54 68 M64 68 L72 68',
      f: 'M14 22 L86 22 L86 38 L14 38 Z', color: '#ffc9c9' },
    money: { k: ['money', 'cash', 'dollar', 'dollars', 'rich', 'wealth', 'pay', 'paid', 'price', 'cost', 'income', 'save', 'saving', 'savings', 'salary', 'profit', 'sell', 'buy', 'business', 'invest', 'investing', 'budget'],
      d: circle(50, 50, 38) + ' M62 34 C58 27 41 26 39 36 C37 46 62 45 62 57 C62 68 42 70 37 61 M50 20 L50 80',
      f: circle(50, 50, 38), color: '#b2f2bb' },
    check: { k: ['yes', 'right', 'correct', 'done', 'true', 'works', 'good', 'approved', 'finally', 'easy', 'simple'],
      d: circle(50, 50, 38) + ' M32 52 L45 65 L70 36', f: circle(50, 50, 38), color: '#b2f2bb' },
    cross: { k: ['wrong', 'mistake', 'mistakes', 'bad', 'stop', 'fail', 'failure', 'false', 'avoid', 'myth', 'lie', 'lies'],
      d: circle(50, 50, 38) + ' M35 35 L65 65 M65 35 L35 65', f: circle(50, 50, 38), color: '#ffc9c9' },
    growth: { k: ['grow', 'growth', 'increase', 'rise', 'results', 'progress', 'improve', 'better', 'stats', 'data', 'sales', 'higher', 'double', 'scale'],
      d: 'M14 12 L14 86 L90 86 M22 74 L40 56 L54 64 L84 28 M70 28 L84 28 L84 42' },
    decline: { k: ['less', 'decrease', 'down', 'lose', 'lost', 'loss', 'worse', 'fall', 'falling', 'drops', 'lower', 'crash'],
      d: 'M14 12 L14 86 L90 86 M22 30 L40 48 L54 40 L84 74 M70 74 L84 74 L84 60' },
    phone: { k: ['phone', 'phones', 'mobile', 'screen', 'screens', 'app', 'apps', 'scroll', 'scrolling', 'social', 'text', 'call', 'notification', 'notifications'],
      d: 'M32 8 L68 8 C73 8 76 11 76 16 L76 84 C76 89 73 92 68 92 L32 92 C27 92 24 89 24 84 L24 16 C24 11 27 8 32 8 Z M24 20 L76 20 M24 78 L76 78 ' + circle(50, 85, 3) + ' M44 14 L56 14',
      f: 'M24 20 L76 20 L76 78 L24 78 Z', color: '#d0ebff' },
    drop: { k: ['water', 'drink', 'fluid', 'fluids', 'wash', 'washes', 'rain', 'drop', 'hydrate', 'hydrated', 'liquid', 'ocean', 'sea', 'sweat'],
      d: 'M50 10 C40 30 24 46 24 62 C24 78 36 90 50 90 C64 90 76 78 76 62 C76 46 60 30 50 10 Z M38 64 C38 72 42 78 50 80',
      f: 'M50 10 C40 30 24 46 24 62 C24 78 36 90 50 90 C64 90 76 78 76 62 C76 46 60 30 50 10 Z', color: '#a5d8ff' },
    cloud: { k: ['cloud', 'clouds', 'fog', 'foggy', 'weather', 'confused', 'confusion', 'online', 'internet', 'sky', 'stress', 'stressed', 'anxiety', 'worry'],
      d: 'M28 74 C14 74 10 58 22 52 C18 38 34 30 44 38 C48 24 70 24 72 40 C86 38 92 54 82 62 C88 72 78 78 72 74 Z', color: '#dee2e6' },
    person: { k: ['person', 'people', 'man', 'woman', 'someone', 'everyone', 'friend', 'friends', 'human', 'humans', 'customer', 'customers', 'team', 'user', 'users', 'body'],
      d: circle(50, 20, 10) + ' M50 30 L50 62 M50 40 L30 54 M50 40 L70 54 M50 62 L34 88 M50 62 L66 88' },
    house: { k: ['home', 'house', 'family', 'apartment', 'rent', 'mortgage', 'room'],
      d: 'M14 48 L50 16 L86 48 M24 40 L24 86 L76 86 L76 40 M42 86 L42 62 L58 62 L58 86',
      f: 'M24 40 L50 18 L76 40 L76 86 L24 86 Z', color: '#ffe8cc' },
    book: { k: ['book', 'books', 'read', 'reading', 'study', 'studying', 'school', 'learn', 'learning', 'knowledge', 'lesson', 'lessons', 'story', 'history', 'fact', 'facts'],
      d: 'M50 26 C40 18 24 18 12 22 L12 80 C24 76 40 76 50 84 C60 76 76 76 88 80 L88 22 C76 18 60 18 50 26 Z M50 26 L50 84', color: '#d0bfff' },
    target: { k: ['goal', 'goals', 'target', 'aim', 'focus', 'plan', 'mission', 'purpose', 'accurate', 'precise'],
      d: circle(50, 52, 36) + ' ' + circle(50, 52, 24) + ' ' + circle(50, 52, 11) + ' M50 52 L84 18 M76 16 L84 18 L82 26',
      f: circle(50, 52, 36), color: '#ffc9c9' },
    talk: { k: ['say', 'says', 'said', 'talk', 'talking', 'speak', 'tell', 'ask', 'chat', 'message', 'conversation', 'words', 'voice'],
      d: 'M18 18 L82 18 C87 18 90 21 90 26 L90 60 C90 65 87 68 82 68 L44 68 L26 84 L28 68 L18 68 C13 68 10 65 10 60 L10 26 C10 21 13 18 18 18 Z M26 36 L74 36 M26 50 L60 50',
      color: '#e7f5ff' },
    question: { k: ['why', 'question', 'questions', 'wonder', 'curious', 'unknown', 'mystery', 'guess', 'quiz'],
      d: 'M34 34 C34 18 66 14 68 32 C70 46 50 48 50 62 L50 68 M50 82 L50 84' },
    warning: { k: ['warning', 'danger', 'careful', 'risk', 'risks', 'problem', 'problems', 'alert', 'attention', 'dangerous', 'toxic', 'waste', 'harmful'],
      d: 'M50 12 L90 84 L10 84 Z M50 38 L50 62 M50 72 L50 75', color: '#ffec99' },
    coffee: { k: ['coffee', 'tea', 'caffeine', 'cup', 'breakfast', 'espresso'],
      d: 'M22 40 L74 40 L70 84 C69 89 66 92 60 92 L36 92 C30 92 27 89 26 84 Z M74 50 C88 50 88 72 72 72 M38 30 C34 24 42 20 38 12 M52 30 C48 24 56 20 52 12',
      f: 'M22 40 L74 40 L70 84 C69 89 66 92 60 92 L36 92 C30 92 27 89 26 84 Z', color: '#e6ccb2' },
    trophy: { k: ['win', 'wins', 'winner', 'winning', 'champion', 'achieve', 'achievement', 'award', 'prize', 'victory', 'first'],
      d: 'M30 14 L70 14 L70 38 C70 52 60 60 50 60 C40 60 30 52 30 38 Z M30 22 C16 22 16 42 32 44 M70 22 C84 22 84 42 68 44 M50 60 L50 74 M36 88 L64 88 L60 74 L40 74 Z',
      f: 'M30 14 L70 14 L70 38 C70 52 60 60 50 60 C40 60 30 52 30 38 Z', color: '#ffd43b' },
    gear: { k: ['work', 'working', 'process', 'system', 'systems', 'tool', 'tools', 'build', 'fix', 'method', 'strategy', 'routine', 'habit', 'habits', 'machine', 'engine', 'automate'],
      d: GEAR + ' ' + circle(50, 50, 12), f: GEAR, color: '#ced4da' },
    search: { k: ['find', 'search', 'look', 'looking', 'discover', 'research', 'notice', 'see', 'study', 'studies', 'scientists', 'science'],
      d: circle(42, 42, 26) + ' M61 61 L88 88', f: circle(42, 42, 26), color: '#e7f5ff' },
    battery: { k: ['energy', 'battery', 'power', 'charge', 'charged', 'exhausted', 'recharge', 'fuel'],
      d: 'M12 30 L80 30 L80 70 L12 70 Z M80 42 L88 42 L88 58 L80 58 M20 38 L36 38 L36 62 L20 62 Z M42 38 L56 38 L56 62 L42 62 Z',
      f: 'M20 38 L36 38 L36 62 L20 62 Z M42 38 L56 38 L56 62 L42 62 Z', color: '#8ce99a' },
    rocket: { k: ['launch', 'start', 'fast', 'quick', 'quickly', 'boost', 'rocket', 'speed', 'faster', 'viral', 'explode', 'blow'],
      d: 'M50 8 C66 22 70 44 64 70 L36 70 C30 44 34 22 50 8 Z M36 54 L22 74 L36 70 M64 54 L78 74 L64 70 ' + circle(50, 38, 7) + ' M42 78 L40 92 M50 78 L50 94 M58 78 L60 92',
      f: 'M50 8 C66 22 70 44 64 70 L36 70 C30 44 34 22 50 8 Z', color: '#ffd8a8' },
    apple: { k: ['food', 'eat', 'eating', 'diet', 'apple', 'fruit', 'healthy', 'nutrition', 'meal', 'meals', 'sugar', 'calories', 'hungry'],
      d: 'M50 30 C40 22 20 24 20 48 C20 70 36 90 50 84 C64 90 80 70 80 48 C80 24 60 22 50 30 Z M50 30 C50 22 52 16 56 12 M54 22 C60 14 70 16 72 18 C66 24 58 24 54 22',
      f: 'M50 30 C40 22 20 24 20 48 C20 70 36 90 50 84 C64 90 80 70 80 48 C80 24 60 22 50 30 Z', color: '#ff8787' },
    lock: { k: ['safe', 'secure', 'security', 'lock', 'locked', 'private', 'privacy', 'password', 'protect', 'secret', 'secrets'],
      d: 'M24 46 L76 46 L76 90 L24 90 Z M34 46 L34 32 C34 10 66 10 66 32 L66 46 M50 62 L50 74',
      f: 'M24 46 L76 46 L76 90 L24 90 Z', color: '#ffe066' },
    arrow: { k: ['next', 'forward', 'then', 'step', 'steps', 'go', 'move', 'change', 'follow'],
      d: 'M10 50 C30 44 52 44 82 50 M66 34 L84 50 L66 66' },
  };

  const KEYWORDS = new Map();
  for (const [name, def] of Object.entries(DOODLES)) for (const k of def.k) if (!KEYWORDS.has(k)) KEYWORDS.set(k, name);

  const tokens = (s) => (s || '').toLowerCase().replace(/[’']/g, '').split(/[^a-z0-9]+/).filter(Boolean);

  // Pick a doodle from the written (marked) words first, then from the whole scene.
  function findDoodle(written, full) {
    for (const src of [written, full]) {
      for (const w of tokens(src)) {
        const hit = KEYWORDS.get(w) || (w.endsWith('s') && KEYWORDS.get(w.slice(0, -1)));
        if (hit) return hit;
      }
    }
    return null;
  }

  /* --------------------------------------------------- doodle geometry */

  let svgHost = null;
  const prepared = new Map();

  function prepDoodle(name) {
    if (prepared.has(name)) return prepared.get(name);
    if (!svgHost) {
      svgHost = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgHost.setAttribute('width', '0'); svgHost.setAttribute('height', '0');
      svgHost.style.position = 'absolute'; svgHost.style.visibility = 'hidden';
      document.body.appendChild(svgHost);
    }
    const def = DOODLES[name];
    const subs = def.d.split(/(?=M)/).map((s) => s.trim()).filter(Boolean).map((sd) => {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', sd);
      svgHost.appendChild(p);
      const len = p.getTotalLength();
      const n = Math.max(2, Math.ceil(len / 1.5));
      const pts = [];
      for (let i = 0; i <= n; i++) { const q = p.getPointAtLength((i / n) * len); pts.push([q.x, q.y]); }
      p.remove();
      return { path: new Path2D(sd), pts, len };
    });
    const out = { subs, total: subs.reduce((a, s) => a + s.len, 0), fill: def.f ? new Path2D(def.f) : (def.color ? new Path2D(def.d) : null), color: def.color };
    prepared.set(name, out);
    return out;
  }

  // Draw a doodle into a square box with draw progress p and color progress cp. Returns the pen point.
  function drawDoodle(c, name, box, p, cp, ink, chalk) {
    const dd = prepDoodle(name);
    const s = box.s / 100;
    c.save();
    c.translate(box.x, box.y);
    c.scale(s, s);
    if (cp > 0 && dd.fill && dd.color) {
      c.globalAlpha = cp * (chalk ? 0.55 : 0.9);
      c.fillStyle = dd.color;
      c.fill(dd.fill);
      c.globalAlpha = 1;
    }
    c.strokeStyle = ink;
    c.lineWidth = 3.2;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    let budget = p * dd.total;
    let pen = null;
    for (const sub of dd.subs) {
      if (budget <= 0) break;
      if (budget >= sub.len) { c.stroke(sub.path); budget -= sub.len; pen = sub.pts[sub.pts.length - 1]; continue; }
      const k = Math.max(1, Math.floor((budget / sub.len) * (sub.pts.length - 1)));
      c.beginPath();
      c.moveTo(sub.pts[0][0], sub.pts[0][1]);
      for (let i = 1; i <= k; i++) c.lineTo(sub.pts[i][0], sub.pts[i][1]);
      c.stroke();
      pen = sub.pts[k];
      budget = 0;
    }
    c.restore();
    return pen && p < 1 ? [box.x + pen[0] * s, box.y + pen[1] * s] : null;
  }

  /* ------------------------------------------------ image -> sketch */

  function prepareSketch(img) {
    const maxD = 520;
    const sc = Math.min(1, maxD / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(8, Math.round(img.naturalWidth * sc));
    const h = Math.max(8, Math.round(img.naturalHeight * sc));
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const cx = cv.getContext('2d', { willReadFrequently: true });
    cx.fillStyle = '#fff';
    cx.fillRect(0, 0, w, h);
    cx.drawImage(img, 0, 0, w, h);
    const src = cx.getImageData(0, 0, w, h).data;

    // Grayscale + light blur.
    const g = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) g[i] = src[i * 4] * 0.299 + src[i * 4 + 1] * 0.587 + src[i * 4 + 2] * 0.114;
    const b = g.slice(); // edges keep their own value so the image border is not traced
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      let s = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += g[(y + dy) * w + x + dx];
      b[y * w + x] = s / 9;
    }
    // Sobel edges.
    const mag = new Float32Array(w * h);
    const vals = [];
    for (let y = 2; y < h - 2; y++) for (let x = 2; x < w - 2; x++) {
      const i = y * w + x;
      const gx = -b[i - w - 1] - 2 * b[i - 1] - b[i + w - 1] + b[i - w + 1] + 2 * b[i + 1] + b[i + w + 1];
      const gy = -b[i - w - 1] - 2 * b[i - w] - b[i - w + 1] + b[i + w - 1] + 2 * b[i + w] + b[i + w + 1];
      const m = Math.hypot(gx, gy);
      mag[i] = m;
      if (m > 8 && (i & 3) === 0) vals.push(m);
    }
    vals.sort((a, c) => a - c);
    const th = Math.max(40, vals.length ? vals[Math.floor(vals.length * 0.82)] : 80);

    const mask = document.createElement('canvas');
    mask.width = w; mask.height = h;
    const mx = mask.getContext('2d');
    const out = mx.createImageData(w, h);
    for (let i = 0; i < w * h; i++) {
      let a = Math.min(1, Math.max(0, (mag[i] - th * 0.6) / th));
      if (g[i] < 45) a = Math.max(a, 0.5); // keep solid dark areas as shading
      out.data[i * 4 + 3] = Math.round(a * 255);
    }
    mx.putImageData(out, 0, 0);

    // Tiles that contain ink, ordered like a hand would draw them (nearest neighbour walk).
    const T = 10;
    const tiles = [];
    for (let ty = 0; ty < h; ty += T) for (let tx = 0; tx < w; tx += T) {
      let ink = 0;
      for (let y = ty; y < Math.min(h, ty + T); y++) for (let x = tx; x < Math.min(w, tx + T); x++) if (out.data[(y * w + x) * 4 + 3] > 60) ink++;
      if (ink >= 2) tiles.push({ x: tx, y: ty });
    }
    const ordered = [];
    if (tiles.length) {
      const used = new Uint8Array(tiles.length);
      let cur = 0;
      for (let i = 1; i < tiles.length; i++) if (tiles[i].x + tiles[i].y < tiles[cur].x + tiles[cur].y) cur = i;
      for (let n = 0; n < tiles.length; n++) {
        used[cur] = 1;
        ordered.push(tiles[cur]);
        let best = -1, bd = Infinity;
        const t0 = tiles[cur];
        for (let j = 0; j < tiles.length; j++) {
          if (used[j]) continue;
          const d = (tiles[j].x - t0.x) ** 2 + (tiles[j].y - t0.y) ** 2;
          if (d < bd) { bd = d; best = j; }
        }
        if (best < 0) break;
        cur = best;
      }
    }
    return { w, h, mask, tiles: ordered, T, tinted: {}, cache: null };
  }

  function tinted(sk, color) {
    if (sk.tinted[color]) return sk.tinted[color];
    const cv = document.createElement('canvas');
    cv.width = sk.w; cv.height = sk.h;
    const c = cv.getContext('2d');
    c.fillStyle = color;
    c.fillRect(0, 0, sk.w, sk.h);
    c.globalCompositeOperation = 'destination-in';
    c.drawImage(sk.mask, 0, 0);
    sk.tinted[color] = cv;
    return cv;
  }

  function drawSketch(c, m, box, p, cp, ink) {
    const sk = m.sketch;
    if (!sk) return null;
    const src = tinted(sk, ink);
    const k = Math.floor(Math.min(1, Math.max(0, p)) * sk.tiles.length);
    if (!sk.cache || sk.cache.k > k || sk.cache.ink !== ink) {
      const cv = sk.cache && sk.cache.canvas || document.createElement('canvas');
      cv.width = sk.w; cv.height = sk.h;
      sk.cache = { canvas: cv, ctx: cv.getContext('2d'), k: 0, ink };
    }
    const cc = sk.cache;
    for (let j = cc.k; j < k; j++) {
      const t = sk.tiles[j];
      cc.ctx.drawImage(src, t.x, t.y, sk.T, sk.T, t.x, t.y, sk.T, sk.T);
    }
    cc.k = k;
    const s = Math.min(box.s / sk.w, box.s / sk.h);
    const dw = sk.w * s, dh = sk.h * s;
    const dx = box.x + (box.s - dw) / 2, dy = box.y + (box.s - dh) / 2;
    if (cp > 0) {
      c.globalAlpha = cp;
      c.drawImage(m.el, dx, dy, dw, dh);
      c.globalAlpha = 1;
    }
    c.globalAlpha = 1 - cp * 0.6;
    c.drawImage(cc.canvas, dx, dy, dw, dh);
    c.globalAlpha = 1;
    if (p <= 0 || p >= 1 || !k) return null;
    const t = sk.tiles[k - 1];
    return [dx + (t.x + sk.T / 2) * s, dy + (t.y + sk.T / 2) * s];
  }

  /* ---------------------------------------------- handwritten text */

  const HAND_FONT = '"Patrick Hand", "Comic Sans MS", cursive';

  function layoutText(c, text, box, base) {
    let size = base;
    for (let tries = 0; tries < 8; tries++) {
      c.font = `${Math.round(size)}px ${HAND_FONT}`;
      const words = text.split(/\s+/).filter(Boolean);
      const space = c.measureText(' ').width;
      const lines = [];
      let line = '', lw = 0;
      for (const w of words) {
        const ww = c.measureText(w).width;
        if (line && lw + space + ww > box.w) { lines.push({ text: line, width: lw }); line = w; lw = ww; }
        else { line = line ? line + ' ' + w : w; lw = line === w ? ww : lw + space + ww; }
      }
      if (line) lines.push({ text: line, width: lw });
      const lh = size * 1.15;
      if (lines.length * lh <= box.h || tries === 7) return { lines, size, lh };
      size *= 0.85;
    }
  }

  function drawText(c, text, box, p, ink, base) {
    const L = layoutText(c, text, box, base);
    c.font = `${Math.round(L.size)}px ${HAND_FONT}`;
    c.fillStyle = ink;
    c.textBaseline = 'middle';
    c.textAlign = 'left';
    const totalW = L.lines.reduce((a, l) => a + l.width, 0);
    let budget = p * totalW;
    const top = box.y + (box.h - L.lines.length * L.lh) / 2 + L.lh / 2;
    let pen = null;
    L.lines.forEach((ln, i) => {
      if (budget <= 0) return;
      const x = box.x + (box.w - ln.width) / 2;
      const y = top + i * L.lh;
      const shown = Math.min(ln.width, budget);
      budget -= shown;
      c.save();
      c.beginPath();
      c.rect(x - L.size * 0.2, y - L.lh, shown + L.size * 0.2, L.lh * 2);
      c.clip();
      c.fillText(ln.text, x, y);
      c.restore();
      if (shown < ln.width || (budget <= 0 && p < 1)) pen = [x + shown, y + L.size * 0.15 + Math.sin(shown * 0.15) * L.size * 0.12];
    });
    return p < 1 ? pen : null;
  }

  /* --------------------------------------------------------- hand art */

  function handSvg(withHand) {
    const hand = withHand ? `
      <rect x="190" y="-46" width="420" height="96" rx="44" fill="#3d4a5c" stroke="#232a35" stroke-width="4"/>
      <path d="M182 -40 L182 46" stroke="#2c3644" stroke-width="10"/>` : '';
    const fingers = withHand ? `
      <ellipse cx="150" cy="6" rx="64" ry="50" fill="#f1c6a3" stroke="#3a2a20" stroke-width="4"/>
      <path d="M150 -34 C118 -38 82 -30 62 -19 C50 -12 55 2 68 -1 C92 -6 120 -10 150 -8 Z" fill="#f1c6a3" stroke="#3a2a20" stroke-width="4" stroke-linejoin="round"/>
      <path d="M142 34 C110 38 82 30 66 19 C55 12 60 1 73 4 C96 11 118 15 142 14 Z" fill="#f1c6a3" stroke="#3a2a20" stroke-width="4" stroke-linejoin="round"/>
      <path d="M120 -20 C126 -14 126 -8 120 -6 M170 -24 C178 -18 180 -10 176 -4" fill="none" stroke="#3a2a20" stroke-width="3" stroke-linecap="round"/>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 520" width="520" height="520">
      <g transform="translate(14 506) rotate(-48)">
        ${hand}
        <path d="M0 0 L24 -9 L24 9 Z" fill="#1d1d1f"/>
        <rect x="24" y="-12" width="16" height="24" rx="2" fill="#5c636e"/>
        <rect x="40" y="-15" width="${withHand ? 210 : 230}" height="30" rx="7" fill="#2f6fd6" stroke="#1b4a96" stroke-width="3"/>
        <rect x="${withHand ? 200 : 236}" y="-17" width="40" height="34" rx="8" fill="#1d1d1f"/>
        ${fingers}
      </g></svg>`;
  }

  const HANDS = {};
  for (const [k, v] of [['hand', true], ['marker', false]]) {
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(handSvg(v));
    HANDS[k] = img;
  }

  function drawHand(c, kind, pt) {
    const img = HANDS[kind];
    if (!img || !img.complete || !pt) return;
    const W = c.canvas.width, H = c.canvas.height;
    const size = Math.min(W, H) * 0.62;
    const s = size / 520;
    c.save();
    c.shadowColor = 'rgba(0,0,0,0.25)';
    c.shadowBlur = size * 0.04;
    c.shadowOffsetX = size * 0.03;
    c.shadowOffsetY = size * 0.03;
    c.drawImage(img, pt[0] - 14 * s, pt[1] - 506 * s, size, size);
    c.restore();
  }

  /* ---------------------------------------------------------- boards */

  const BOARDS = {
    white: { bg: '#fbfbf8', edge: 'rgba(0,0,0,0.06)', ink: '#1f1f22' },
    paper: { bg: '#f6eedb', edge: 'rgba(90,60,20,0.12)', ink: '#2e2419' },
    chalk: { bg: '#24382e', edge: 'rgba(0,0,0,0.35)', ink: '#f1f3ee' },
  };

  function drawBoard(c, board) {
    const W = c.canvas.width, H = c.canvas.height;
    const b = BOARDS[board] || BOARDS.white;
    c.fillStyle = b.bg;
    c.fillRect(0, 0, W, H);
    const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.hypot(W, H) * 0.6);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, b.edge);
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
  }

  function layout(W, H, hasVisual, hasText, bottomReserve) {
    const top = H * 0.07;
    const bottom = H * (1 - Math.max(0.05, bottomReserve));
    const ah = bottom - top;
    let vbox = null, tbox = null;
    if (hasVisual && hasText) {
      if (W > H) {
        const s = Math.min(W * 0.42, ah * 0.92);
        vbox = { x: W * 0.27 - s / 2, y: top + (ah - s) / 2, s };
        tbox = { x: W * 0.52, y: top, w: W * 0.42, h: ah };
      } else {
        const s = Math.min(W * 0.76, ah * 0.6);
        vbox = { x: (W - s) / 2, y: top + ah * 0.02, s };
        const ty = vbox.y + s + ah * 0.04;
        tbox = { x: W * 0.08, y: ty, w: W * 0.84, h: bottom - ty };
      }
    } else if (hasVisual) {
      const s = Math.min(W * 0.8, ah * 0.9);
      vbox = { x: (W - s) / 2, y: top + (ah - s) / 2, s };
    } else if (hasText) {
      tbox = { x: W * 0.08, y: top, w: W * 0.84, h: ah };
    }
    return { vbox, tbox };
  }

  const clamp01 = (v) => Math.min(1, Math.max(0, v));

  /**
   * Draw one whiteboard scene.
   * scene: { visual: {kind:'doodle', name} | {kind:'image', media} | null, write: string|null }
   * opts: { board, hand, colorize, start, bottomReserve, still }
   */
  function drawScene(c, scene, local, dur, opts) {
    const W = c.canvas.width, H = c.canvas.height;
    const b = BOARDS[opts.board] || BOARDS.white;
    drawBoard(c, opts.board);
    const hasVisual = !!scene.visual;
    const hasText = !!scene.write;
    const { vbox, tbox } = layout(W, H, hasVisual, hasText, opts.bottomReserve);

    const D = Math.min(7, Math.max(1.2, (dur - opts.start) * 0.65));
    const vD = hasVisual ? (hasText ? D * 0.58 : D) : 0;
    const tD = hasText ? D - vD : 0;
    const t = local - opts.start;
    const vp = hasVisual ? clamp01(t / vD) : 1;
    const tp = hasText ? clamp01((t - vD) / tD) : 1;
    const cp = opts.colorize ? clamp01((t - vD) / 0.7) : 0;

    let pen = null;
    if (hasVisual) {
      const v = scene.visual;
      const p2 = v.kind === 'doodle'
        ? drawDoodle(c, v.name, vbox, vp, cp, b.ink, opts.board === 'chalk')
        : drawSketch(c, v.media, vbox, vp, cp, b.ink);
      if (t > 0 && vp < 1) pen = p2;
    }
    if (hasText) {
      const p2 = drawText(c, scene.write, tbox, tp, b.ink, Math.min(W, H) * 0.13);
      if (t >= vD && tp < 1) pen = p2;
    }

    if (opts.hand !== 'none' && !opts.still) {
      const end = D;
      if (pen) {
        scene.state.lastPen = pen;
        drawHand(c, opts.hand, pen);
      } else if (t > end && t < end + 0.45 && scene.state.lastPen) {
        // Hand leaves the board after finishing.
        const e = (t - end) / 0.45;
        const k = e * e;
        const [x0, y0] = scene.state.lastPen;
        drawHand(c, opts.hand, [x0 + (W * 1.05 - x0) * k, y0 + (H * 1.1 - y0) * k]);
      } else if (t < 0 && t > -0.35) {
        // Hand arrives just before it starts drawing.
        const k = 1 - (-t / 0.35);
        const target = vbox ? [vbox.x + vbox.s * 0.3, vbox.y + vbox.s * 0.3] : [tbox.x, tbox.y + tbox.h / 2];
        drawHand(c, opts.hand, [W * 1.05 + (target[0] - W * 1.05) * k, H * 1.1 + (target[1] - H * 1.1) * k]);
      }
    }
  }

  window.Whiteboard = {
    DOODLES,
    names: Object.keys(DOODLES),
    findDoodle,
    prepareSketch,
    drawScene,
    BOARDS,
  };
})();
