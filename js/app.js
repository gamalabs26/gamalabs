/* ==== GAMALABS — motor ==== */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;
gsap.registerPlugin(ScrollTrigger);

/* ---------- cursor glow (solo desktop pointer fino) ---------- */
(() => {
  if (!finePointer) return;
  document.body.classList.add('has-pointer');
  const g = document.getElementById('cursorGlow');
  let tx = innerWidth / 2, ty = innerHeight / 2, x = tx, y = ty;
  addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
  (function loop() { x += (tx - x) * .14; y += (ty - y) * .14; g.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`; requestAnimationFrame(loop); })();
})();

/* ---------- nav scrolled ---------- */
const nav = document.getElementById('nav');
addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 40), { passive: true });

/* ---------- HERO shader WebGL (energía de laboratorio) ---------- */
(() => {
  const cv = document.getElementById('heroShader');
  const gl = cv.getContext('webgl') || cv.getContext('experimental-webgl');
  if (!gl) { cv.style.background = 'radial-gradient(70% 60% at 50% 40%,#1a1440,#0a0b10)'; return; }
  const vs = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
  const fs = `precision highp float;uniform vec2 res;uniform float t;uniform vec2 mo;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
  float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(.8,-.6,.6,.8);
    for(int i=0;i<6;i++){v+=a*noise(p);p=m*p*2.+.03;a*=.5;}return v;}
  void main(){
    vec2 uv=gl_FragCoord.xy/res.xy;
    vec2 p=(gl_FragCoord.xy-.5*res.xy)/res.y;
    float tt=t*.06;
    vec2 mp=(mo-.5)*.4;
    vec2 q=vec2(fbm(p*1.6+vec2(0.,-tt)+mp),fbm(p*1.6+vec2(3.1,tt*.8)));
    vec2 r=vec2(fbm(p*1.6+2.4*q+vec2(1.7,-tt*1.2)),fbm(p*1.6+2.4*q+vec2(8.3,tt)));
    float f=fbm(p*1.6+3.2*r);
    f=pow(clamp(f,0.,1.),1.6);
    vec3 violet=vec3(.486,.361,1.);
    vec3 aqua=vec3(.247,.949,.776);
    vec3 base=vec3(.039,.043,.063);
    vec3 col=mix(base,violet*.9,smoothstep(.25,.75,f)*.9);
    col=mix(col,aqua,smoothstep(.6,.98,f+length(r)*.15)*.55);
    // filamentos brillantes
    float fil=smoothstep(.62,.66,f)*.5;
    col+=violet*fil;
    // viñeta radial hacia el fondo
    col*=mix(.35,1.15,smoothstep(1.1,.15,length(p)));
    gl_FragColor=vec4(col,1.);
  }`;
  function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog); gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(prog, 'res'), uT = gl.getUniformLocation(prog, 't'), uMo = gl.getUniformLocation(prog, 'mo');
  let mox = .5, moy = .5, mtx = .5, mty = .5;
  addEventListener('pointermove', e => { mtx = e.clientX / innerWidth; mty = 1 - e.clientY / innerHeight; }, { passive: true });
  const DPR = Math.min(devicePixelRatio || 1, 1.5);
  function size() { cv.width = cv.clientWidth * DPR; cv.height = cv.clientHeight * DPR; gl.viewport(0, 0, cv.width, cv.height); }
  addEventListener('resize', size); size();
  const heroSec = document.getElementById('hero');
  let visible = true;
  new IntersectionObserver(es => visible = es[0].isIntersecting).observe(heroSec);
  const t0 = performance.now();
  function frame(now) {
    if (visible && !document.hidden) {
      mox += (mtx - mox) * .05; moy += (mty - moy) * .05;
      gl.uniform2f(uRes, cv.width, cv.height);
      gl.uniform1f(uT, reduce ? 8 : (now - t0) / 1000);
      gl.uniform2f(uMo, mox, moy);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

/* ---------- scramble en el wordmark del hero ---------- */
(() => {
  const el = document.querySelector('[data-scramble]');
  if (!el || reduce) return;
  const final = el.textContent, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&/·';
  let started = false;
  new IntersectionObserver((es, o) => {
    if (!es[0].isIntersecting || started) return; started = true;
    let frame = 0; const total = final.length;
    const iv = setInterval(() => {
      el.textContent = final.split('').map((c, i) => {
        if (c === ' ') return ' ';
        if (i < frame / 3) return final[i];
        return chars[(Math.random() * chars.length) | 0];
      }).join('');
      frame++;
      if (frame / 3 >= total) { clearInterval(iv); el.textContent = final; }
    }, 34);
    o.disconnect();
  }, { threshold: .6 }).observe(el);
})();

/* ---------- manifiesto blur-in por palabra ---------- */
(() => {
  const el = document.querySelector('[data-reveal-words]');
  if (!el) return;
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map(w => `<span class="w">${w}</span>`).join(' ');
  const spans = el.querySelectorAll('.w');
  if (reduce) { spans.forEach(s => s.style.cssText = 'opacity:1'); return; }
  gsap.to(spans, {
    opacity: 1, filter: 'blur(0px)', y: 0, duration: .7, stagger: .045, ease: 'power2.out',
    scrollTrigger: { trigger: el, start: 'top 75%' }
  });
})();

/* ---------- reveals genéricos ---------- */
(() => {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '-8%' });
  document.querySelectorAll('.sec-head,.pf-intro,.cap-card,.plan-card').forEach(el => { el.setAttribute('data-reveal', ''); io.observe(el); });
  // barrido inicial por si algo ya está en viewport
  requestAnimationFrame(() => document.querySelectorAll('[data-reveal]').forEach(el => { if (el.getBoundingClientRect().top < innerHeight * .92) el.classList.add('in'); }));
})();

/* ---------- tilt 3D en cards de capacidad ---------- */
(() => {
  if (!finePointer || reduce) return;
  document.querySelectorAll('.tilt').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const rx = ((e.clientY - r.top) / r.height - .5) * -7;
      const ry = ((e.clientX - r.left) / r.width - .5) * 7;
      card.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
    });
    card.addEventListener('pointerleave', () => card.style.transform = '');
  });
})();

/* ---------- PORTAFOLIO: galería pin + scale (mecánica prmpt) ---------- */
(() => {
  const grid = document.getElementById('pfGrid'), stage = document.getElementById('pfStage');
  if (!grid) return;
  const SITES = [
    ['cepa', 'CEPA — mezcal de linaje'], ['obtura', 'OBTURA — cámaras analógicas'],
    ['vialactea', 'VÍA LÁCTEA — tren nocturno'], ['anden', 'ANDÉN — trenes de noche'],
    ['helios', 'HELIOS — archivo solar'], ['anima', 'ÁNIMA — androides'],
    ['palacio', 'CINE PALACIO — 1941'], ['copal', 'CASA COPAL — perfumería'],
    ['niebla', 'NIEBLA — hotel de bosque'], ['minutero', 'MINUTERO — relojería'],
    ['neon', 'NÉON — letreros de gas'], ['cumbre', 'CUMBRE — refugio a 4,120m'],
    ['plasma', 'PLASMA — nostalgia Y2K'], ['meridiano', 'MERIDIANO — relojería'],
    ['lazaro', 'LÁZARO — restauración'], ['automata', 'AUTÓMATA — 1889'],
  ];
  // track interno (grid real) dentro del viewport sticky
  const track = document.createElement('div'); track.className = 'pf-track';
  const cols = innerWidth <= 640 ? 2 : innerWidth <= 1024 ? 3 : 4;
  SITES.forEach(([slug, cap], i) => {
    const c = document.createElement('div'); c.className = 'pf-card';
    c.innerHTML = `<img src="assets/portfolio/${slug}.jpg" alt="${cap}" loading="lazy"><span class="pf-cap mono">${cap}</span>`;
    // origen direccional para el scale (mitad izq/der)
    c.style.transformOrigin = (i % cols) < cols / 2 ? 'right bottom' : 'left bottom';
    track.appendChild(c);
  });
  grid.appendChild(track);
  const cards = [...track.querySelectorAll('.pf-card')];
  if (reduce) { cards.forEach(c => c.style.transform = 'none'); return; }

  let vh = innerHeight, trackH = 0;
  function measure() { vh = innerHeight; trackH = track.scrollHeight; }
  addEventListener('resize', measure); measure(); setTimeout(measure, 300);

  let raf = 0;
  function tick() {
    const r = stage.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, -r.top / (r.height - vh)));
    const shift = p * Math.max(0, trackH - vh);
    track.style.transform = `translateY(${-shift}px)`;
    for (const c of cards) {
      const cr = c.getBoundingClientRect();
      const top = cr.top, bottom = cr.bottom;
      let s;
      if (bottom <= 0 || top >= vh) s = 0;
      else s = Math.min(Math.min(1, (vh - top) / (vh * .62)), Math.min(1, bottom / (vh * .42)));
      c.style.transform = `scale(${s.toFixed(3)})`;
    }
    raf = 0;
  }
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick); };
  addEventListener('scroll', onScroll, { passive: true }); tick();
})();

/* ---------- PROCESO: beam animado por el pipeline ---------- */
(() => {
  const pipe = document.getElementById('pipeline');
  const svg = document.getElementById('beamSvg');
  const glow = document.getElementById('beamGlowPath'), core = document.getElementById('beamCorePath');
  const grad = document.getElementById('beamGrad');
  const nodes = [...document.querySelectorAll('#pipeline [data-node]')];
  if (!pipe || nodes.length < 2 || reduce) return;
  let pts = [];
  function pathFrom() {
    const pr = pipe.getBoundingClientRect();
    pts = nodes.map(n => { const r = n.querySelector('.node-ico').getBoundingClientRect(); return [r.left + r.width / 2 - pr.left, r.top + r.height / 2 - pr.top]; });
    const d = 'M ' + pts.map(p => p.join(',')).join(' L ');
    glow.setAttribute('d', d); core.setAttribute('d', d);
    svg.setAttribute('viewBox', `0 0 ${pr.width} ${pr.height}`);
  }
  addEventListener('resize', pathFrom); pathFrom(); setTimeout(pathFrom, 300);

  const seg = nodes.length - 1;           // tramos entre nodos
  let i = 0, phase = 'run', tS = performance.now();
  const RUN = 900, SPLASH = 500, IDLE = 700;
  let running = false;
  new IntersectionObserver(e => running = e[0].isIntersecting).observe(pipe);
  function setWin(center) { const hw = 6; grad.setAttribute('x1', ((center - hw)) + '%'); grad.setAttribute('x2', ((center + hw)) + '%'); grad.setAttribute('y1', '0%'); grad.setAttribute('y2', '0%'); }
  function loop(now) {
    if (running && pts.length) {
      const el = now - tS;
      if (phase === 'run') {
        const k = Math.min(1, el / RUN);
        const center = ((i + k) / seg) * 100;
        setWin(center);
        nodes[i].classList.toggle('lit', k < .5);
        nodes[i + 1].classList.toggle('lit', k > .55);
        if (k >= 1) { phase = 'splash'; tS = now; nodes[i + 1].classList.add('lit'); }
      } else if (phase === 'splash') {
        if (el >= SPLASH) { nodes.forEach(n => n.classList.remove('lit')); i++; if (i >= seg) { i = 0; phase = 'idle'; } else phase = 'run'; tS = now; }
      } else { if (el >= IDLE) { phase = 'run'; tS = now; } }
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();

/* ---------- PLANES: precios (placeholder) con count-up ---------- */
/* montos por confirmar — placeholders MXN para aprobación */
const PLAN_PRICES = { presencia: 2900, crecimiento: 6900, autopiloto: 12900 };

/* ---------- counters + precios ---------- */
(() => {
  function animateNum(el, to, suffix, money) {
    const dur = 1200, t0 = performance.now();
    (function step(now) {
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      const val = Math.round(to * e);
      el.textContent = (money ? val.toLocaleString('es-MX') : val) + (suffix || '');
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; io.unobserve(e.target);
    const el = e.target;
    if (el.dataset.plan) animateNum(el, PLAN_PRICES[el.dataset.plan], '', true);
    else animateNum(el, +el.dataset.count, el.dataset.suffix || '', false);
  }), { threshold: .6 });
  document.querySelectorAll('[data-count],[data-plan]').forEach(el => {
    if (reduce) { if (el.dataset.plan) el.textContent = PLAN_PRICES[el.dataset.plan].toLocaleString('es-MX'); else el.textContent = el.dataset.count + (el.dataset.suffix || ''); }
    else io.observe(el);
  });
})();

/* ---------- botones magnéticos ---------- */
(() => {
  if (!finePointer || reduce) return;
  document.querySelectorAll('.magnetic').forEach(b => {
    b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px,${(e.clientY - r.top - r.height / 2) * .35}px)`; });
    b.addEventListener('pointerleave', () => b.style.transform = '');
  });
})();

/* ---------- CTA video (clip Seedance, si existe) ---------- */
(() => {
  const v = document.getElementById('ctaVideo');
  if (!v) return;
  v.src = 'assets/video/lab-energy.mp4';
  const sec = document.getElementById('contacto');
  new IntersectionObserver(es => { if (es[0].isIntersecting && !reduce) { v.play().catch(() => {}); } else v.pause(); }).observe(sec);
  v.addEventListener('error', () => v.style.display = 'none', { once: true });
})();
