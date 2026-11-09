/* FaceOFF Video — faceless video maker that runs entirely in the browser.
 * Script -> scenes -> word-timed captions, drawn on a canvas over clips, images
 * or animated backgrounds, mixed with a voiceover and music, recorded with MediaRecorder.
 */
(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const canvas = $('#stage');
  const ctx = canvas.getContext('2d');

  // Off-screen layers: the current scene's visual, and a frozen copy of the previous one for crossfades.
  const visual = document.createElement('canvas');
  const vctx = visual.getContext('2d');
  const prev = document.createElement('canvas');
  const pctx = prev.getContext('2d');

  const SIZES = { '9:16': [1080, 1920], '16:9': [1920, 1080], '1:1': [1080, 1080] };
  const THEMES = {
    midnight: ['#0f0c29', '#302b63', '#24243e'],
    sunset: ['#ff512f', '#dd2476', '#3a1c71'],
    ocean: ['#0575e6', '#00c9a7', '#021b79'],
    forest: ['#0b3d2e', '#2f7d4f', '#0a1f17'],
    mono: ['#1a1a1a', '#3a3a3a', '#050505'],
  };
  const WORDS_PER_SEC = 2.6;   // reading pace used when there is no voiceover
  const FADE = 0.4;            // seconds of crossfade between scenes
  const STORAGE_KEY = 'faceoff.script';

  const DEFAULT_SCRIPT = `Most people never realize this about sleep.

Your brain doesn't switch off at night. It cleans itself.

While you sleep, fluid washes through your brain and clears out waste that built up during the day.

Skip sleep, and that waste stays put. That's part of why everything feels foggy.

So tonight, put the phone down an hour earlier. Your brain will thank you.`;

  const state = {
    aspect: '9:16',
    theme: 'midnight',
    media: [],            // { type: 'image'|'video', el, name, url }
    voice: null,          // { buffer, name, duration, speechStart, speechEnd }
    music: null,          // { buffer, name }
    musicVolume: 0.2,
    offset: 0,
    captions: { style: 'pop', position: 'center', wordsPer: 3, color: '#ffd400', size: 1 },
    progressBar: true,
    timeline: null,
    playing: false,
    exporting: false,
    t: 0,
  };

  /* ---------------------------------------------------------------- audio */

  let actx = null, mixDest = null, voiceGain = null, musicGain = null;
  let voiceNode = null, musicNode = null;
  let clockCtxStart = 0, clockOffset = 0;

  function ensureAudio() {
    if (actx) return actx;
    actx = new (window.AudioContext || window.webkitAudioContext)();
    mixDest = actx.createMediaStreamDestination();
    voiceGain = actx.createGain();
    musicGain = actx.createGain();
    musicGain.gain.value = state.musicVolume;
    for (const g of [voiceGain, musicGain]) { g.connect(actx.destination); g.connect(mixDest); }
    return actx;
  }

  async function decodeFile(file) {
    const ac = ensureAudio();
    const data = await file.arrayBuffer();
    return await ac.decodeAudioData(data);
  }

  // Find where speech actually starts and ends so captions line up despite silence padding.
  function detectSpeech(buffer) {
    const data = buffer.getChannelData(0);
    const rate = buffer.sampleRate;
    const win = Math.floor(rate * 0.02);
    let peak = 0;
    for (let i = 0; i < data.length; i += 7) peak = Math.max(peak, Math.abs(data[i]));
    const threshold = Math.max(0.01, peak * 0.08);
    const loud = (i) => {
      let sum = 0;
      const end = Math.min(data.length, i + win);
      for (let j = i; j < end; j++) sum += data[j] * data[j];
      return Math.sqrt(sum / Math.max(1, end - i)) > threshold * 0.5;
    };
    let start = 0, end = data.length;
    for (let i = 0; i < data.length; i += win) if (loud(i)) { start = i; break; }
    for (let i = data.length - win; i > start; i -= win) if (loud(i)) { end = i + win; break; }
    const s = Math.max(0, start / rate - 0.05);
    const e = Math.min(buffer.duration, end / rate + 0.1);
    return e - s > 0.5 ? [s, e] : [0, buffer.duration];
  }

  function stopAudioNodes() {
    for (const n of [voiceNode, musicNode]) { if (n) { try { n.stop(); } catch (_) {} n.disconnect(); } }
    voiceNode = musicNode = null;
  }

  function startAudioNodes(offset) {
    stopAudioNodes();
    const when = actx.currentTime + 0.05;
    if (state.voice && offset < state.voice.duration) {
      voiceNode = actx.createBufferSource();
      voiceNode.buffer = state.voice.buffer;
      voiceNode.connect(voiceGain);
      voiceNode.start(when, offset);
    }
    if (state.music) {
      musicNode = actx.createBufferSource();
      musicNode.buffer = state.music.buffer;
      musicNode.loop = true;
      musicNode.connect(musicGain);
      musicNode.start(when, offset % state.music.buffer.duration);
    }
    clockCtxStart = when;
    clockOffset = offset;
  }

  const clock = () => Math.max(clockOffset, clockOffset + (actx.currentTime - clockCtxStart));

  /* ------------------------------------------------------------- timeline */

  function splitScenes(text) {
    const blocks = text.split(/\n\s*\n/).map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
    if (blocks.length !== 1) return blocks;
    // One long paragraph: group sentences into scenes of roughly 18 words.
    const sentences = (blocks[0].match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) || [blocks[0]]).map((s) => s.trim()).filter(Boolean);
    const scenes = [];
    let cur = '';
    for (const s of sentences) {
      const n = (cur + ' ' + s).trim().split(' ').length;
      if (cur && n > 18) { scenes.push(cur); cur = s; } else cur = (cur + ' ' + s).trim();
    }
    if (cur) scenes.push(cur);
    return scenes;
  }

  function wordWeight(w) {
    let weight = w.replace(/[^\p{L}\p{N}]/gu, '').length + 2;
    if (/[.!?]["')\]]*$/.test(w)) weight += 4;
    else if (/[,;:—–-]["')\]]*$/.test(w)) weight += 2;
    return weight;
  }

  function buildTimeline() {
    const texts = splitScenes($('#script').value);
    if (!texts.length) return null;

    const scenes = texts.map((text) => ({ text, words: text.split(' ').filter(Boolean).map((w) => ({ text: w })) }));
    const allWords = scenes.flatMap((s) => s.words);
    const SCENE_PAUSE = 4;
    const totalWeight = allWords.reduce((a, w) => a + wordWeight(w.text), 0) + SCENE_PAUSE * (scenes.length - 1);

    let total, speechStart, speechEnd;
    if (state.voice) {
      total = state.voice.duration;
      [speechStart, speechEnd] = [state.voice.speechStart, state.voice.speechEnd];
    } else {
      speechStart = 0.3;
      speechEnd = speechStart + allWords.length / WORDS_PER_SEC + 0.35 * (scenes.length - 1);
      total = speechEnd + 1.0;
    }
    const unit = (speechEnd - speechStart) / totalWeight;

    let t = speechStart;
    scenes.forEach((sc, i) => {
      if (i > 0) t += SCENE_PAUSE * unit;
      for (const w of sc.words) { w.start = t; t += wordWeight(w.text) * unit; w.end = t; }
    });
    // Scene boundaries sit halfway through the pause between scenes.
    scenes.forEach((sc, i) => {
      sc.start = i === 0 ? 0 : (scenes[i - 1].words.at(-1).end + sc.words[0].start) / 2;
    });
    scenes.forEach((sc, i) => { sc.end = i === scenes.length - 1 ? total : scenes[i + 1].start; });

    // Caption chunks: up to N words, always breaking after punctuation.
    const N = state.captions.wordsPer;
    const chunks = [];
    for (const sc of scenes) {
      let cur = [];
      sc.words.forEach((w, i) => {
        cur.push(w);
        const last = i === sc.words.length - 1;
        if (cur.length >= N || /[.!?,;:]["')\]]*$/.test(w.text) || last) { chunks.push({ words: cur, scene: sc }); cur = []; }
      });
    }
    for (const c of chunks) c.start = c.words[0].start;
    chunks.forEach((c, i) => {
      const next = chunks[i + 1];
      // Keep a caption up through short gaps, but clear it during longer pauses.
      c.end = next && next.scene === c.scene ? next.start : Math.min(c.words.at(-1).end + 0.6, c.scene.end);
      c.text = c.words.map((w) => w.text).join(' ');
    });

    return { scenes, chunks, total, wordCount: allWords.length };
  }

  function rebuild() {
    state.timeline = buildTimeline();
    const tl = state.timeline;
    const total = tl ? tl.total : 0;
    state.t = Math.min(state.t, total);
    $('#seek').max = String(total || 1);
    $('#scriptStats').textContent = tl
      ? `${tl.scenes.length} scene${tl.scenes.length > 1 ? 's' : ''} · ${tl.wordCount} words · ${fmt(total)}`
      : 'Write something to start';
    updateTime();
    if (!state.playing) render(state.t, true);
  }

  /* ------------------------------------------------------------ rendering */

  function setSize() {
    const [w, h] = SIZES[state.aspect];
    for (const c of [canvas, visual, prev]) { c.width = w; c.height = h; }
  }

  function drawCover(c, src, sw, sh, scale = 1, dx = 0, dy = 0) {
    const W = c.canvas.width, H = c.canvas.height;
    const s = Math.max(W / sw, H / sh) * scale;
    const w = sw * s, h = sh * s;
    c.drawImage(src, (W - w) / 2 + dx, (H - h) / 2 + dy, w, h);
  }

  function drawThemeBg(c, t, i) {
    const W = c.canvas.width, H = c.canvas.height;
    const cols = THEMES[state.theme];
    const ang = t * 0.15 + i * 1.3;
    const cx = W / 2, cy = H / 2, r = Math.hypot(W, H) / 2;
    const g = c.createLinearGradient(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r, cx - Math.cos(ang) * r, cy - Math.sin(ang) * r);
    g.addColorStop(0, cols[0]); g.addColorStop(0.5, cols[1]); g.addColorStop(1, cols[2]);
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    const m = Math.min(W, H);
    for (let k = 0; k < 6; k++) {
      const x = W * (0.5 + 0.42 * Math.sin(t * 0.07 * (k + 1) + k * 2.1 + i));
      const y = H * (0.5 + 0.42 * Math.cos(t * 0.05 * (k + 2) + k * 1.3 + i * 0.7));
      const rad = m * (0.28 + 0.1 * Math.sin(k + t * 0.3));
      const rg = c.createRadialGradient(x, y, 0, x, y, rad);
      rg.addColorStop(0, 'rgba(255,255,255,0.13)');
      rg.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = rg;
      c.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
  }

  function mediaFor(i) {
    return state.media.length ? state.media[i % state.media.length] : null;
  }

  function syncVideos(active, local, still) {
    for (const m of state.media) {
      if (m.type === 'video' && m !== active && !m.el.paused) m.el.pause();
    }
    if (!active || active.type !== 'video') return;
    const el = active.el;
    const target = el.duration ? local % el.duration : 0;
    if (!still && state.playing) {
      if (el.paused) { el.currentTime = target; el.play().catch(() => {}); }
    } else {
      if (!el.paused) el.pause();
      if (Math.abs(el.currentTime - target) > 0.2) el.currentTime = target;
    }
  }

  function drawVisual(c, sc, i, t) {
    const local = t - sc.start;
    const dur = Math.max(0.1, sc.end - sc.start);
    const m = mediaFor(i);
    c.fillStyle = '#000';
    c.fillRect(0, 0, c.canvas.width, c.canvas.height);
    if (m && m.type === 'image') {
      // Slow zoom and pan ("Ken Burns") so stills feel alive.
      const p = Math.min(1, Math.max(0, local / dur));
      const zoomIn = i % 2 === 0;
      const scale = zoomIn ? 1.04 + 0.12 * p : 1.16 - 0.12 * p;
      const dir = i % 4 < 2 ? 1 : -1;
      drawCover(c, m.el, m.el.naturalWidth, m.el.naturalHeight, scale, dir * (p - 0.5) * c.canvas.width * 0.05, 0);
    } else if (m && m.type === 'video') {
      if (m.el.readyState >= 2) drawCover(c, m.el, m.el.videoWidth, m.el.videoHeight);
    } else {
      drawThemeBg(c, t, i);
    }
  }

  function sceneIndexAt(tl, t) {
    let i = 0;
    while (i < tl.scenes.length - 1 && t >= tl.scenes[i + 1].start) i++;
    return i;
  }

  let lastScene = -1;

  function render(t, still = false) {
    const W = canvas.width, H = canvas.height;
    const tl = state.timeline;
    if (!tl) {
      drawThemeBg(ctx, performance.now() / 1000, 0);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = `600 ${Math.round(Math.min(W, H) * 0.045)}px Montserrat, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Write a script to start', W / 2, H / 2);
      return;
    }

    const te = Math.max(0, t - state.offset); // caption/scene time after the timing nudge
    const i = sceneIndexAt(tl, te);
    const sc = tl.scenes[i];
    const local = te - sc.start;

    if (i !== lastScene) {
      // Freeze the outgoing scene's last frame for the crossfade.
      if (lastScene >= 0 && !still) pctx.drawImage(visual, 0, 0);
      lastScene = i;
    }
    syncVideos(mediaFor(i), local, still);
    drawVisual(vctx, sc, i, te);

    const alpha = still || i === 0 ? 1 : Math.min(1, local / FADE);
    if (alpha < 1) {
      ctx.drawImage(prev, 0, 0);
      ctx.globalAlpha = alpha;
      ctx.drawImage(visual, 0, 0);
      ctx.globalAlpha = 1;
    } else {
      ctx.drawImage(visual, 0, 0);
    }

    // Darken for caption legibility.
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(0,0,0,0.25)');
    g.addColorStop(0.35, 'rgba(0,0,0,0.05)');
    g.addColorStop(0.65, 'rgba(0,0,0,0.15)');
    g.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    if (state.captions.style !== 'none') drawCaption(tl, te);

    if (state.progressBar) {
      const bh = Math.round(Math.min(W, H) * 0.008);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(0, 0, W, bh);
      ctx.fillStyle = state.captions.color;
      ctx.fillRect(0, 0, W * Math.min(1, t / tl.total), bh);
    }
  }

  function drawCaption(tl, t) {
    const chunk = tl.chunks.find((c) => t >= c.start && t < c.end);
    if (!chunk) return;
    const W = canvas.width, H = canvas.height;
    const { style, position, color, size } = state.captions;
    const base = Math.min(W, H) * (style === 'clean' ? 0.06 : 0.075) * size;
    const upper = style === 'pop';
    ctx.font = `${style === 'clean' ? 600 : 800} ${Math.round(base)}px Montserrat, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    // Pop style enlarges the active word, so leave room for it.
    const space = ctx.measureText(' ').width + (style === 'pop' ? base * 0.2 : 0);
    const maxW = W * 0.84;

    const words = chunk.words.map((w) => {
      const text = upper ? w.text.toUpperCase() : w.text;
      return { w, text, width: ctx.measureText(text).width };
    });
    const lines = [];
    let line = [], lw = 0;
    for (const it of words) {
      const add = (line.length ? space : 0) + it.width;
      if (line.length && lw + add > maxW) { lines.push({ items: line, width: lw }); line = []; lw = 0; }
      lw += (line.length ? space : 0) + it.width;
      line.push(it);
    }
    if (line.length) lines.push({ items: line, width: lw });

    const lh = base * 1.25;
    const cy = position === 'center' ? H * 0.5 : H * (H > W ? 0.74 : 0.8);
    const top = cy - (lines.length * lh) / 2 + lh / 2;

    // Pop-in when a new chunk appears.
    const age = t - chunk.start;
    const pop = style === 'pop' ? 0.85 + 0.15 * Math.min(1, age / 0.12) : 1;

    ctx.save();
    ctx.translate(W / 2, cy);
    ctx.scale(pop, pop);
    ctx.translate(-W / 2, -cy);

    lines.forEach((ln, li) => {
      const y = top + li * lh;
      let x = W / 2 - ln.width / 2;
      if (style === 'boxed') {
        const padX = base * 0.35, padY = base * 0.18;
        ctx.fillStyle = 'rgba(0,0,0,0.72)';
        roundRect(ctx, x - padX, y - lh / 2 + padY / 2, ln.width + padX * 2, lh - padY / 2, base * 0.22);
        ctx.fill();
      }
      for (const it of ln.items) {
        const active = t >= it.w.start && t < it.w.end + 0.05;
        const cx = x + it.width / 2;
        ctx.save();
        ctx.translate(cx, y);
        if (active && style === 'pop') ctx.scale(1.07, 1.07);
        if (style === 'pop') {
          ctx.lineJoin = 'round';
          ctx.lineWidth = base * 0.18;
          ctx.strokeStyle = 'rgba(0,0,0,0.95)';
          ctx.strokeText(it.text, 0, 0);
        } else if (style === 'clean') {
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = base * 0.25;
          ctx.shadowOffsetY = base * 0.04;
        }
        ctx.fillStyle = active ? color : '#fff';
        ctx.fillText(it.text, 0, 0);
        ctx.restore();
        x += it.width + space;
      }
    });
    ctx.restore();
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  /* ------------------------------------------------------------- playback */

  let rafId = 0;
  let onEnded = null;

  async function play() {
    if (!state.timeline) return;
    ensureAudio();
    await actx.resume();
    if (state.t >= state.timeline.total - 0.05) state.t = 0;
    state.playing = true;
    lastScene = -1;
    startAudioNodes(state.t);
    $('#playBtn').textContent = '❚❚';
    $('#playBtn').setAttribute('aria-label', 'Pause');
    cancelAnimationFrame(rafId);
    const tick = () => {
      if (!state.playing) return;
      state.t = clock();
      const total = state.timeline.total;
      if (state.t >= total) {
        state.t = total;
        render(total - 0.001);
        updateTime();
        pause();
        if (onEnded) { const cb = onEnded; onEnded = null; cb(); }
        return;
      }
      render(state.t);
      updateTime();
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  }

  function pause() {
    if (state.playing && actx) state.t = Math.min(clock(), state.timeline ? state.timeline.total : 0);
    state.playing = false;
    cancelAnimationFrame(rafId);
    stopAudioNodes();
    for (const m of state.media) if (m.type === 'video') m.el.pause();
    $('#playBtn').textContent = '▶';
    $('#playBtn').setAttribute('aria-label', 'Play');
  }

  function seek(t) {
    const wasPlaying = state.playing;
    if (wasPlaying) pause();
    state.t = t;
    lastScene = -1;
    render(t, true);
    updateTime();
    if (wasPlaying) play();
  }

  const fmt = (s) => {
    s = Math.max(0, s || 0);
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  };

  function updateTime() {
    const total = state.timeline ? state.timeline.total : 0;
    $('#time').textContent = `${fmt(state.t)} / ${fmt(total)}`;
    $('#seek').value = String(state.t);
  }

  /* --------------------------------------------------------------- export */

  function pickMime() {
    const types = [
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];
    return types.find((t) => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || '';
  }

  let recorder = null;

  async function exportVideo() {
    if (state.exporting) { cancelExport(); return; }
    rebuild();
    if (!state.timeline) { showStatus('Add a script first.'); return; }
    if (!window.MediaRecorder || !canvas.captureStream) {
      showStatus('This browser cannot record video. Try a recent Chrome, Edge or Firefox.');
      return;
    }
    pause();
    ensureAudio();
    await actx.resume();

    const mime = pickMime();
    const stream = new MediaStream([
      ...canvas.captureStream(30).getVideoTracks(),
      ...((state.voice || state.music) ? mixDest.stream.getAudioTracks() : []),
    ]);
    const chunks = [];
    recorder = new MediaRecorder(stream, { mimeType: mime || undefined, videoBitsPerSecond: 8_000_000, audioBitsPerSecond: 192_000 });
    recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };

    state.exporting = true;
    setBusy(true);
    const total = state.timeline.total;
    const progress = setInterval(() => {
      const pct = Math.min(100, (state.t / total) * 100);
      showStatus(`Making your video… ${Math.round(pct)}% (plays once in real time — keep this tab open)<div class="bar"><i style="width:${pct}%"></i></div>`);
    }, 250);

    const done = new Promise((resolve) => { recorder.onstop = resolve; });
    state.t = 0;
    lastScene = -1;
    render(0, true);
    recorder.start(1000);
    onEnded = () => setTimeout(() => recorder && recorder.state !== 'inactive' && recorder.stop(), 300);
    await play();
    await done;
    clearInterval(progress);

    const cancelled = !state.exporting;
    state.exporting = false;
    setBusy(false);
    stream.getVideoTracks().forEach((tr) => tr.stop());
    recorder = null;
    if (cancelled) { showStatus('Cancelled.'); return; }

    const type = (mime || 'video/webm').split(';')[0];
    const blob = new Blob(chunks, { type });
    const ext = type.includes('mp4') ? 'mp4' : 'webm';
    const url = URL.createObjectURL(blob);
    const name = `faceless-video-${state.aspect.replace(':', 'x')}.${ext}`;
    const mb = (blob.size / 1e6).toFixed(1);
    showStatus(`Done. <a href="${url}" download="${name}">Download ${name}</a> (${mb} MB)` +
      (ext === 'webm' ? '<br><span class="muted">This browser saves WebM. YouTube and TikTok accept it; for Instagram, convert to MP4 or use Chrome/Edge, which save MP4.</span>' : ''));
    const a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  }

  function cancelExport() {
    state.exporting = false;
    onEnded = null;
    pause();
    if (recorder && recorder.state !== 'inactive') recorder.stop();
  }

  function setBusy(busy) {
    $('#exportBtn').textContent = busy ? 'Cancel' : 'Make video';
    for (const sel of ['#playBtn', '#seek', '#srtBtn', '#recordBtn']) $(sel).disabled = busy;
    document.querySelectorAll('.panel input, .panel select, .panel textarea, .panel button').forEach((el) => { el.disabled = busy; });
  }

  function showStatus(html) {
    const el = $('#exportStatus');
    el.hidden = false;
    el.innerHTML = html;
  }

  function downloadSrt() {
    rebuild();
    const tl = state.timeline;
    if (!tl) return;
    const ts = (s) => {
      s = Math.max(0, s + state.offset);
      const ms = Math.round(s * 1000);
      const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`;
    };
    const srt = tl.chunks.map((c, i) => `${i + 1}\n${ts(c.start)} --> ${ts(c.end)}\n${c.text}\n`).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([srt], { type: 'text/plain' }));
    a.download = 'captions.srt';
    a.click();
  }

  /* ----------------------------------------------------------- media input */

  function addMediaFiles(files) {
    for (const file of files) {
      const url = URL.createObjectURL(file);
      if (file.type.startsWith('image/')) {
        const el = new Image();
        el.onload = () => { if (!state.playing) render(state.t, true); };
        el.src = url;
        state.media.push({ type: 'image', el, name: file.name, url });
      } else if (file.type.startsWith('video/')) {
        const el = document.createElement('video');
        el.muted = true; el.playsInline = true; el.loop = true; el.preload = 'auto';
        el.onloadeddata = () => { if (!state.playing) render(state.t, true); };
        el.src = url;
        state.media.push({ type: 'video', el, name: file.name, url });
      }
    }
    renderMediaList();
    if (!state.playing) render(state.t, true);
  }

  function renderMediaList() {
    const ul = $('#mediaList');
    ul.innerHTML = '';
    state.media.forEach((m, idx) => {
      const li = document.createElement('li');
      let thumb;
      if (m.type === 'image') { thumb = document.createElement('img'); thumb.src = m.url; thumb.alt = ''; }
      else { thumb = document.createElement('video'); thumb.src = m.url; thumb.muted = true; thumb.preload = 'metadata'; }
      thumb.className = 'thumb';
      const name = document.createElement('span');
      name.className = 'name';
      name.textContent = `${idx + 1}. ${m.name}`;
      const ctrl = document.createElement('span');
      ctrl.className = 'ctrl';
      const mk = (label, title, fn, disabled) => {
        const b = document.createElement('button');
        b.type = 'button'; b.textContent = label; b.title = title; b.setAttribute('aria-label', title);
        b.disabled = !!disabled; b.onclick = fn; ctrl.appendChild(b);
      };
      mk('↑', 'Move up', () => moveMedia(idx, -1), idx === 0);
      mk('↓', 'Move down', () => moveMedia(idx, 1), idx === state.media.length - 1);
      mk('✕', 'Remove', () => removeMedia(idx));
      li.append(thumb, name, ctrl);
      ul.appendChild(li);
    });
  }

  function moveMedia(idx, d) {
    const j = idx + d;
    [state.media[idx], state.media[j]] = [state.media[j], state.media[idx]];
    renderMediaList();
    if (!state.playing) render(state.t, true);
  }

  function removeMedia(idx) {
    const [m] = state.media.splice(idx, 1);
    if (m.type === 'video') m.el.pause();
    URL.revokeObjectURL(m.url);
    renderMediaList();
    if (!state.playing) render(state.t, true);
  }

  async function setVoice(fileOrBlob, name) {
    pause();
    $('#voiceInfo').textContent = 'Loading voiceover…';
    try {
      const buffer = await decodeFile(fileOrBlob);
      const [speechStart, speechEnd] = detectSpeech(buffer);
      state.voice = { buffer, name, duration: buffer.duration, speechStart, speechEnd };
      showFileInfo('#voiceInfo', `${name} · ${fmt(buffer.duration)}`, () => {
        state.voice = null;
        $('#voiceInfo').textContent = 'No voiceover: captions are timed at a natural reading pace.';
        rebuild();
      });
    } catch (e) {
      state.voice = null;
      $('#voiceInfo').textContent = 'Could not read that audio file. Try MP3, WAV, M4A or a video file with sound.';
    }
    state.t = 0;
    rebuild();
  }

  async function setMusic(file) {
    pause();
    $('#musicInfo').textContent = 'Loading music…';
    try {
      const buffer = await decodeFile(file);
      state.music = { buffer, name: file.name };
      showFileInfo('#musicInfo', `${file.name} · loops under the video`, () => {
        state.music = null;
        $('#musicInfo').textContent = 'No music.';
      });
    } catch (e) {
      state.music = null;
      $('#musicInfo').textContent = 'Could not read that audio file.';
    }
  }

  function showFileInfo(sel, text, onRemove) {
    const el = $(sel);
    el.innerHTML = '';
    const span = document.createElement('span');
    span.textContent = text;
    const b = document.createElement('button');
    b.className = 'link'; b.type = 'button'; b.textContent = 'Remove';
    b.onclick = () => { pause(); onRemove(); };
    el.append(span, b);
  }

  /* ------------------------------------------------------------ recording */

  let micRec = null, micTimer = 0;

  async function toggleRecord() {
    const btn = $('#recordBtn');
    if (micRec) { micRec.stop(); return; }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (e) {
      $('#voiceInfo').textContent = 'Microphone access was blocked. Allow it in the browser address bar, or upload a file instead.';
      return;
    }
    pause();
    const parts = [];
    micRec = new MediaRecorder(stream);
    micRec.ondataavailable = (e) => { if (e.data.size) parts.push(e.data); };
    micRec.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      clearInterval(micTimer);
      btn.classList.remove('recording');
      btn.textContent = '● Record with mic';
      micRec = null;
      setVoice(new Blob(parts, { type: parts[0] ? parts[0].type : 'audio/webm' }), 'Mic recording');
    };
    micRec.start();
    const started = performance.now();
    btn.classList.add('recording');
    const upd = () => { btn.textContent = `■ Stop recording ${fmt((performance.now() - started) / 1000)}`; };
    upd();
    micTimer = setInterval(upd, 250);
    $('#voiceInfo').textContent = 'Recording… read your script, then press Stop.';
  }

  /* ------------------------------------------------------------- wiring */

  function bind() {
    const script = $('#script');
    let saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (_) {}
    script.value = saved !== null ? saved : DEFAULT_SCRIPT;
    let deb = 0;
    script.addEventListener('input', () => {
      clearTimeout(deb);
      deb = setTimeout(() => {
        try { localStorage.setItem(STORAGE_KEY, script.value); } catch (_) {}
        rebuild();
      }, 250);
    });
    $('#clearScript').onclick = () => { script.value = ''; script.dispatchEvent(new Event('input')); script.focus(); };

    $('#mediaInput').onchange = (e) => { addMediaFiles(e.target.files); e.target.value = ''; };
    const drop = $('#mediaDrop');
    drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('over'));
    drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); addMediaFiles(e.dataTransfer.files); });

    $('#theme').onchange = (e) => { state.theme = e.target.value; if (!state.playing) render(state.t, true); };

    $('#voiceInput').onchange = (e) => { const f = e.target.files[0]; if (f) setVoice(f, f.name); e.target.value = ''; };
    $('#recordBtn').onclick = toggleRecord;
    $('#musicInput').onchange = (e) => { const f = e.target.files[0]; if (f) setMusic(f); e.target.value = ''; };
    $('#musicVol').oninput = (e) => {
      state.musicVolume = Number(e.target.value);
      $('#musicVolOut').textContent = `${Math.round(state.musicVolume * 100)}%`;
      if (musicGain) musicGain.gain.value = state.musicVolume;
    };
    $('#offset').oninput = (e) => {
      state.offset = Number(e.target.value);
      $('#offsetOut').textContent = `${state.offset > 0 ? '+' : ''}${state.offset.toFixed(1)} s`;
      if (!state.playing) render(state.t, true);
    };

    $('#aspectSeg').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-v]');
      if (!b) return;
      document.querySelectorAll('#aspectSeg button').forEach((x) => x.classList.toggle('on', x === b));
      state.aspect = b.dataset.v;
      setSize();
      lastScene = -1;
      if (!state.playing) render(state.t, true);
    });
    $('#capStyle').onchange = (e) => { state.captions.style = e.target.value; if (!state.playing) render(state.t, true); };
    $('#capPos').onchange = (e) => { state.captions.position = e.target.value; if (!state.playing) render(state.t, true); };
    $('#wordsPer').onchange = (e) => { state.captions.wordsPer = Number(e.target.value); rebuild(); };
    $('#capColor').oninput = (e) => { state.captions.color = e.target.value; if (!state.playing) render(state.t, true); };
    $('#capSize').oninput = (e) => {
      state.captions.size = Number(e.target.value);
      $('#capSizeOut').textContent = `${Math.round(state.captions.size * 100)}%`;
      if (!state.playing) render(state.t, true);
    };
    $('#progressBar').onchange = (e) => { state.progressBar = e.target.checked; if (!state.playing) render(state.t, true); };

    $('#playBtn').onclick = () => (state.playing ? pause() : play());
    $('#seek').oninput = (e) => seek(Number(e.target.value));
    $('#exportBtn').onclick = exportVideo;
    $('#srtBtn').onclick = downloadSrt;
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !['TEXTAREA', 'INPUT', 'SELECT', 'BUTTON'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        if (!state.exporting) (state.playing ? pause() : play());
      }
    });
  }

  async function init() {
    setSize();
    bind();
    // Show a mid-scene frame so the preview isn't blank.
    rebuild();
    try { await document.fonts.load('800 80px Montserrat'); await document.fonts.load('600 80px Montserrat'); } catch (_) {}
    if (state.timeline) state.t = Math.min(1.2, state.timeline.total);
    rebuild();
  }

  // Exposed for automated checks.
  window.faceoff = { state, rebuild, render, play, pause, exportVideo };

  init();
})();
