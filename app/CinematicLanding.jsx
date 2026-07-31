"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// Full landing markup, ported verbatim from the original design export so the
// visual result is byte-identical. Inline event handlers (onmouseover/out) are
// parsed natively by the browser when injected via dangerouslySetInnerHTML.
import { MARKUP as BASE_MARKUP } from "./landing-markup.mjs";
import I18N from "./landing-i18n.json";

// TR/EN elle yazildi; diger diller scripts/translate-landing.mjs ciktisi.
const MARKUP = { ...I18N, ...BASE_MARKUP };

// Scroll-driven cinematic controller (faithful port of the original DCLogic
// component): a persistent requestAnimationFrame loop reads scroll position and
// drives every genre scene by mutating elements looked up by id.
class Cinematic {
  componentDidMount() {
    this.reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.$ = (id) => document.getElementById(id);
    this.spawnParticles();
    if (this.reduced) this.setFinal();
    this.scroller = this.findScroller();
    // persistent rAF loop — independent of scroll events (robust across inner scrollers & tab refocus)
    this.running = true;
    const loop = () => { if (!this.running) return; try { this.update(); } catch (e) {} this.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
    this.onResize = () => { this.scroller = this.findScroller(); this.update(); };
    window.addEventListener('resize', this.onResize);
    this.update();
  }
  componentWillUnmount() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this.onResize) window.removeEventListener('resize', this.onResize);
  }
  findScroller() {
    let el = document.getElementById('hero');
    while (el && el !== document.body) {
      const o = getComputedStyle(el);
      const oy = o.overflowY, ov = o.overflow;
      if ((oy === 'auto' || oy === 'scroll' || ov === 'auto' || ov === 'scroll') && el.scrollHeight > el.clientHeight + 4) return el;
      el = el.parentElement;
    }
    return document.scrollingElement || document.documentElement;
  }

  clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  map(v, a, b, c, d) { return c + (this.clamp(v, a, b) - a) * (d - c) / (b - a || 1); }
  // progress through a tall pinned section (0..1)
  prog(el) {
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    const total = el.offsetHeight - window.innerHeight;
    return this.clamp(-r.top / (total || 1), 0, 1);
  }

  spawnParticles() {
    const petalSrc = (cont, n, colors) => {
      const c = this.$(cont); if (!c) return; c.innerHTML = "";
      for (let i = 0; i < n; i++) {
        const p = document.createElement('div');
        const s = 6 + Math.random() * 10;
        p.className = '__petal';
        p.style.cssText = `position:absolute; left:${Math.random()*100}%; top:${-10 - Math.random()*30}%; width:${s}px; height:${s*0.6}px; border-radius:60% 60% 60% 0; background:${colors[i%colors.length]}; opacity:0; filter:blur(.3px);`;
        p.dataset.sp = 0.4 + Math.random() * 0.9;   // fall speed
        p.dataset.sw = 6 + Math.random() * 14;       // sway amplitude
        p.dataset.ph = Math.random() * 6.28;
        c.appendChild(p);
      }
    };
    petalSrc('sam-petals', 20, ['#E2452F', '#ff8d6e', '#ffd9c9']);
    petalSrc('rom-petals', 18, ['#FF6E9C', '#FFB48A', '#ffd0dd']);
    // stars
    const sc = this.$('sci-stars');
    if (sc) {
      sc.innerHTML = "";
      for (let i = 0; i < 90; i++) {
        const ang = Math.random() * 6.2832;
        const rad = 4 + Math.random() * 46; // % from center
        const st = document.createElement('div');
        st.className = '__star';
        st.style.cssText = `position:absolute; left:50%; top:50%; width:2px; height:2px; border-radius:2px; background:#cfeffd; transform:translate(-50%,-50%);`;
        st.dataset.ang = ang; st.dataset.rad = rad;
        sc.appendChild(st);
      }
    }
  }

  setFinal() {
    // reduced-motion: show all cards & end-states, no animation
    const show = (id, css) => { const e = this.$(id); if (e) e.style.cssText += css; };
    ['pol-glow','sam-glow','rom-glow','sci-glow'].forEach(id => show(id, 'opacity:1;'));
    show('pol-card', 'opacity:1; transform:translate(0,-50%);');
    show('sam-card', 'opacity:1; transform:translate(0,-50%);');
    show('rom-card', 'opacity:1; transform:translate(0,-50%);');
    show('sci-card', 'opacity:1; transform:translate(-50%,0);');
    show('pol-hole', 'width:46px; height:46px;');
    show('sam-top', 'transform:translate(-14px,-10px);');
    show('sam-bot', 'transform:translate(14px,10px);');
    show('rom-rose', '');
    const rh = this.$('rom-hand'); if (rh) rh.style.transform = 'translate(34%,-50%)';
    show('sci-portal', 'transform:translate(-50%,-50%) scale(1);');
    document.querySelectorAll('.__petal').forEach(p => p.style.opacity = '.8');
  }

  fmtTC(frames) {
    const f = Math.floor(frames % 24);
    const s = Math.floor(frames / 24) % 60;
    const m = Math.floor(frames / 1440) % 60;
    const h = Math.floor(frames / 86400) % 100;
    const z = (n) => String(n).padStart(2, '0');
    return `${z(h)}:${z(m)}:${z(s)}:${z(f)}`;
  }

  update() {
    const sc = this.scroller || document.scrollingElement || document.documentElement;
    const isDoc = (sc === document.scrollingElement || sc === document.documentElement || sc === document.body);
    const sTop = isDoc ? (window.scrollY || document.documentElement.scrollTop || 0) : sc.scrollTop;
    const max = (sc.scrollHeight - sc.clientHeight) || 1;
    const gp = this.clamp(sTop / max, 0, 1);
    // timecode + progress bar
    const tc = this.$('timecode'); if (tc) tc.textContent = this.fmtTC(gp * 6 * 1440); // ~6 min reel
    const pb = this.$('progBar'); if (pb) pb.style.width = (gp * 100).toFixed(2) + '%';

    // letterbox: open during genre sections (rect-based, scroller-agnostic)
    const genres = document.querySelectorAll('.genre');
    if (genres.length) {
      const f = genres[0].getBoundingClientRect();
      const l = genres[genres.length - 1].getBoundingClientRect();
      const cy = window.innerHeight / 2;
      let lb = 0;
      if (f.top < cy && l.bottom > cy) lb = this.clamp(Math.min(cy - f.top, l.bottom - cy) / 260, 0, 1);
      const h = (lb * 66).toFixed(1) + 'px';
      const lt = this.$('letterTop'), lbt = this.$('letterBot');
      if (lt) lt.style.height = h; if (lbt) lbt.style.height = h;
    }

    if (this.reduced) return;
    this.polisiye();
    this.samuray();
    this.romantik();
    this.scifi();
    this.editor();
  }

  // ---------- POLİSİYE ----------
  polisiye() {
    const sec = document.querySelector('[data-genre="pol"]'); const p = this.prog(sec);
    const set = (id, css) => { const e = this.$(id); if (e) e.style.cssText = this._base('pol', id) + css; };
    this.$('pol-glow').style.opacity = this.map(p, 0, 0.12, 0, 1);
    // flash pulse around 0.18-0.28
    const fl = 1 - Math.abs(this.map(p, 0.16, 0.30, -1, 1));
    this.$('pol-flash').style.opacity = this.clamp(fl, 0, 1).toFixed(3);
    const sc = this.clamp(fl, 0, 1) * 1.4 + 0.6;
    this.$('pol-flash').style.transform = `translate(-50%,-50%) scale(${sc})`;
    // detective recoil
    const recoil = this.clamp(fl, 0, 1) * -18;
    this.$('pol-det').style.transform = `translateX(${recoil}px)`;
    // bullet 0.24 -> 0.6
    const bx = this.map(p, 0.24, 0.60, 8, 92);
    const bv = (p > 0.23 && p < 0.63) ? 1 : 0;
    this.$('pol-bullet').style.opacity = bv;
    this.$('pol-bullet').style.transform = `translateX(${bx}vw)`;
    // shake at impact 0.58-0.66
    const shk = (p > 0.58 && p < 0.68) ? (1 - Math.abs(this.map(p, 0.58, 0.68, -1, 1))) : 0;
    const jx = (Math.random() - 0.5) * shk * 16, jy = (Math.random() - 0.5) * shk * 16;
    this.$('pol-stage').style.transform = `translate(${jx}px,${jy}px)`;
    // hole grows after 0.6
    const hs = this.map(p, 0.60, 0.70, 0, 46);
    const he = this.$('pol-hole'); he.style.width = hs + 'px'; he.style.height = hs + 'px';
    he.style.boxShadow = `0 0 ${hs * 0.6}px ${hs * 0.2}px rgba(124,155,203,.4)`;
    // card 0.72 -> 0.86
    const cx = this.map(p, 0.72, 0.88, 120, 0);
    this.$('pol-card').style.transform = `translate(${cx}%,-50%)`;
    this.$('pol-card').style.opacity = this.map(p, 0.72, 0.84, 0, 1);
  }

  // ---------- SAMURAY ----------
  samuray() {
    const sec = document.querySelector('[data-genre="sam"]'); const p = this.prog(sec);
    this.$('sam-glow').style.opacity = this.map(p, 0, 0.12, 0, 1);
    // katana draw + swing 0.15 -> 0.45 (scaleX 0->1 then rotate sweep)
    const draw = this.map(p, 0.15, 0.40, 0, 1);
    const rot = this.map(p, 0.18, 0.46, 140, -28);
    this.$('sam-katana').style.transform = `rotate(${rot}deg) scaleX(${draw})`;
    this.$('sam-katana').style.opacity = (p > 0.13 && p < 0.52) ? 1 : (p >= 0.52 ? 0 : 0);
    // slash line sweeps 0.42 -> 0.55
    const slash = this.map(p, 0.42, 0.55, 0, 1);
    this.$('sam-slash').style.transform = `translate(-50%,-50%) rotate(-32deg) scaleX(${slash})`;
    this.$('sam-slash').style.opacity = (p > 0.40 && p < 0.62) ? 1 : 0;
    // white flash at 0.54-0.6
    const wf = 1 - Math.abs(this.map(p, 0.53, 0.62, -1, 1));
    this.$('sam-flash').style.opacity = (this.clamp(wf, 0, 1) * 0.9).toFixed(3);
    // title splits after 0.56
    const sp = this.map(p, 0.56, 0.74, 0, 1);
    this.$('sam-top').style.transform = `translate(${-14 * sp}px,${-12 * sp}px)`;
    this.$('sam-bot').style.transform = `translate(${14 * sp}px,${12 * sp}px)`;
    // petals 0.5 -> 1
    this.driftPetals('sam-petals', this.map(p, 0.50, 0.70, 0, 1), p);
    // card 0.76 -> 0.9
    const cx = this.map(p, 0.76, 0.90, -120, 0);
    this.$('sam-card').style.transform = `translate(${cx}%,-50%)`;
    this.$('sam-card').style.opacity = this.map(p, 0.76, 0.88, 0, 1);
  }

  // ---------- ROMANTİK ----------
  romantik() {
    const sec = document.querySelector('[data-genre="rom"]'); const p = this.prog(sec);
    this.$('rom-glow').style.opacity = this.map(p, 0.1, 0.55, 0, 1);
    // hand advances from -30% to center over 0.1 -> 0.6
    const hx = this.map(p, 0.10, 0.60, -30, 30);
    this.$('rom-hand').style.transform = `translate(${hx}%,-50%)`;
    // bloom on rose
    const bl = this.map(p, 0.4, 0.7, 0, 1);
    this.$('rom-rose').style.boxShadow = `0 0 ${40 + bl * 60}px ${bl * 24}px rgba(255,110,156,${0.5 + bl * 0.4})`;
    this.driftPetals('rom-petals', this.map(p, 0.30, 0.55, 0, 1), p);
    // card 0.66 -> 0.84
    const cx = this.map(p, 0.66, 0.86, 120, 0);
    this.$('rom-card').style.transform = `translate(${cx}%,-50%)`;
    this.$('rom-card').style.opacity = this.map(p, 0.66, 0.82, 0, 1);
  }

  // ---------- BİLİM KURGU ----------
  scifi() {
    const sec = document.querySelector('[data-genre="sci"]'); const p = this.prog(sec);
    this.$('sci-glow').style.opacity = this.map(p, 0, 0.15, 0, 1);
    // warp 0.1 -> 0.45 stretch out; back to normal 0.7 -> 0.9
    const warp = (p < 0.55) ? this.map(p, 0.10, 0.45, 0, 1) : this.map(p, 0.70, 0.92, 1, 0);
    document.querySelectorAll('#sci-stars .__star').forEach(st => {
      const ang = parseFloat(st.dataset.ang), rad = parseFloat(st.dataset.rad);
      const r = rad * (1 + warp * 1.8);
      const x = Math.cos(ang) * r, y = Math.sin(ang) * r;
      const len = 1 + warp * 26;
      st.style.transform = `translate(-50%,-50%) translate(${x}vmin,${y}vmin) rotate(${ang}rad) scaleX(${len})`;
      st.style.opacity = (0.4 + warp * 0.5).toFixed(2);
    });
    // portal opens 0.38 -> 0.6, closes 0.78 -> 0.95
    const po = (p < 0.7) ? this.map(p, 0.38, 0.60, 0, 1) : this.map(p, 0.78, 0.95, 1, 0);
    this.$('sci-portal').style.transform = `translate(-50%,-50%) scale(${po})`;
    // ship 0.56 -> 0.78 flies forward
    const shipP = this.map(p, 0.56, 0.78, 0, 1);
    const shv = (p > 0.54 && p < 0.80) ? 1 : 0;
    this.$('sci-ship').style.opacity = shv;
    this.$('sci-ship').style.transform = `translate(-50%,-50%) translateX(${this.map(shipP,0,1,-10,40)}vw) scale(${0.2 + shipP * 1.3})`;
    // card 0.80 -> 0.95
    const cy = this.map(p, 0.80, 0.95, 40, 0);
    this.$('sci-card').style.transform = `translate(-50%,${cy}px)`;
    this.$('sci-card').style.opacity = this.map(p, 0.80, 0.93, 0, 1);
  }

  driftPetals(cont, intensity, p) {
    const c = this.$(cont); if (!c) return;
    const t = p * 1400;
    c.querySelectorAll('.__petal').forEach((el, i) => {
      const sp = parseFloat(el.dataset.sp), sw = parseFloat(el.dataset.sw), ph = parseFloat(el.dataset.ph);
      const fall = ((t * sp + i * 40) % 130) - 15;        // vh-ish 0..115
      const sway = Math.sin((t * 0.01 * sp) + ph) * sw;
      el.style.transform = `translate(${sway}px, ${fall}vh) rotate(${fall * 4}deg)`;
      el.style.opacity = (intensity * 0.85).toFixed(2);
    });
  }

  editor() {
    const sec = this.$('editor'); if (!sec) return;
    const r = sec.getBoundingClientRect();
    const p = this.clamp((window.innerHeight - r.top) / (window.innerHeight + r.height), 0, 1);
    const ph = this.$('ed-playhead'); if (ph) ph.style.left = this.map(p, 0.1, 0.9, 6, 94) + '%';
    const tc = this.$('ed-tc'); if (tc) tc.textContent = this.fmtTC(this.map(p, 0.1, 0.9, 0, 1) * 9 * 24 + 24);
  }

  _base() { return ''; }

  renderVals() { return {}; }
}

// Scroll-scrub videos (Polisiye / Aksiyon / Romantik / Bilim Kurgu). Verbatim
// port of the original trailing script: each scene gets a <video> whose
// currentTime is driven by scroll progress. Local mp4s are served from /public;
// the CloudFront URLs are the fallbacks used when a local file is absent.
function initScrubVideos() {
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}

  /* ---------- A) POLISIYE: full scroll-scrub video ---------- */
  (function(){
    var V,SEC,duration=0,ready=false,target=0,wanted=0,seeking=false,primed=false;
    function wire(){
      try{V.muted=true;V.pause();}catch(e){}
      V.addEventListener('loadedmetadata',function(){duration=V.duration||0;});
      V.addEventListener('loadeddata',function(){ready=true;try{V.pause();}catch(e){}});
      V.addEventListener('seeked',function(){seeking=false;});
      function prime(){ if(primed)return; primed=true; try{var p=V.play(); if(p&&p.then){p.then(function(){try{V.pause();}catch(e){}}).catch(function(){});}else{V.pause();}}catch(e){} }
      ['touchstart','wheel','click','keydown'].forEach(function(ev){window.addEventListener(ev,prime,{once:true,passive:true});});
      function progress(){var r=SEC.getBoundingClientRect();var run=SEC.offsetHeight-window.innerHeight;return clamp(-r.top/run,0,1);}
      function commit(){ if(!ready||!duration||seeking)return; if(!V.paused){try{V.pause();}catch(e){}} var tt=clamp(wanted,0,duration-0.05); if(Math.abs(V.currentTime-tt)<0.008)return; seeking=true; try{V.currentTime=tt;}catch(e){seeking=false;} }
      function onScroll(){ if(duration) target=progress()*duration; }
      window.addEventListener('scroll',onScroll,{passive:true});
      window.addEventListener('resize',onScroll);
      (function tick(){ if(V && !V.isConnected)return; wanted+=(target-wanted)*0.22; if(Math.abs(target-wanted)<0.004)wanted=target; commit(); requestAnimationFrame(tick); })();
      onScroll();
    }
    function build(stage,sec){
      SEC=sec;
      var st=document.createElement('style');
      st.textContent='[data-genre="pol"] #pol-det,[data-genre="pol"] #pol-flash,[data-genre="pol"] #pol-bullet,[data-genre="pol"] #pol-hole,[data-genre="pol"] #pol-glow{display:none !important;}#pol-scrub{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;background:#000;}#pol-grade{position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(180deg,rgba(7,6,9,.5) 0%,transparent 20%,transparent 60%,rgba(7,6,9,.85) 100%);}[data-genre="pol"] #pol-card{z-index:5;}';
      document.head.appendChild(st);
      V=document.createElement('video');
      V.id='pol-scrub'; V.muted=true; V.preload='auto'; V.setAttribute('playsinline',''); V.setAttribute('muted','');
      var s1=document.createElement('source'); s1.src='perde_polisiye.mp4'; s1.type='video/mp4';
      V.appendChild(s1);
      var grade=document.createElement('div'); grade.id='pol-grade';
      stage.insertBefore(grade, stage.firstChild);
      stage.insertBefore(V, stage.firstChild);
      try{V.load();}catch(e){}
      wire();
    }
    window.__perdePol=function(){ var sec=document.querySelector('[data-genre="pol"]'),stage=document.getElementById('pol-stage'); if(sec&&stage&&!document.getElementById('pol-scrub')){try{build(stage,sec);}catch(e){} } return !!document.getElementById('pol-scrub'); };
  })();

  /* ---------- generic: scrub video that freezes on its last frame, content kept above ---------- */
  function makeFreezeScrub(opt){
    var V,SEC,duration=0,ready=false,seeking=false,vtarget=0,vwanted=0,primed=false,wrap;
    function progress(){var r=SEC.getBoundingClientRect();var run=SEC.offsetHeight-window.innerHeight;return clamp(-r.top/run,0,1);}
    function commit(){ if(!ready||!duration||seeking)return; if(!V.paused){try{V.pause();}catch(e){}} var tt=clamp(vwanted,0,duration-0.05); if(Math.abs(V.currentTime-tt)<0.008)return; seeking=true; try{V.currentTime=tt;}catch(e){seeking=false;} }
    return function(){
      SEC=document.querySelector('[data-genre="'+opt.genre+'"]'); var stage=document.getElementById(opt.stage);
      if(!SEC||!stage) return false;
      if(stage['__'+opt.genre]) return true; stage['__'+opt.genre]=true;
      opt.brand&&opt.brand(SEC,stage,function(w){wrap=w;});
      var st=document.createElement('style'); st.textContent=opt.css; document.head.appendChild(st);
      if(wrap){ wrap.style.zIndex='4'; wrap.style.opacity='0'; }
      V=document.createElement('video'); V.id=opt.vid; V.muted=true; V.preload='auto'; V.setAttribute('playsinline',''); V.setAttribute('muted','');
      var s1=document.createElement('source'); s1.src=opt.local; s1.type='video/mp4';
      V.appendChild(s1);
      stage.insertBefore(V, stage.firstChild);
      try{V.load();}catch(e){}
      V.addEventListener('loadedmetadata',function(){duration=V.duration||0;});
      V.addEventListener('loadeddata',function(){ready=true;try{V.pause();}catch(e){}});
      V.addEventListener('seeked',function(){seeking=false;});
      function prime(){ if(primed)return; primed=true; try{var p=V.play(); if(p&&p.then){p.then(function(){try{V.pause();}catch(e){}}).catch(function(){});}else{V.pause();}}catch(e){} }
      ['touchstart','wheel','click','keydown'].forEach(function(ev){window.addEventListener(ev,prime,{once:true,passive:true});});
      (function tick(){
        if(V && !V.isConnected)return;
        var p=progress();
        if(duration){ vtarget=clamp(p/opt.PV,0,1)*duration; }
        vwanted += (vtarget-vwanted)*0.22; if(Math.abs(vtarget-vwanted)<0.004) vwanted=vtarget; commit();
        if(wrap){ wrap.style.opacity=clamp((p-0.44)/0.12,0,1).toFixed(3); }
        requestAnimationFrame(tick);
      })();
      return true;
    };
  }

  /* ---------- B) AKSIYON: samurai scrub -> freeze; AKSIYON split fades in on top ---------- */
  window.__perdeAks=makeFreezeScrub({
    genre:'sam', stage:'sam-stage', vid:'aks-scrub', PV:0.5,
    local:'perde_aksiyon.mp4',
    css:'[data-genre="sam"] #sam-fig,[data-genre="sam"] #sam-petals{display:none !important;}[data-genre="sam"] #sam-card{z-index:6;}#aks-scrub{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1;background:#000;pointer-events:none;}',
    brand:function(SEC,stage,setWrap){
      // Text now lives in the (per-language) markup; only wire up the split
      // title's wrapper so it can fade in over the video.
      var top=document.getElementById('sam-top');
      if(top&&top.parentElement) setWrap(top.parentElement.parentElement);
    }
  });

  /* ---------- C) ROMANTIK: slow-dance scrub -> freeze; card over last frame ---------- */
  window.__perdeRom=makeFreezeScrub({
    genre:'rom', stage:'rom-stage', vid:'rom-scrub', PV:0.75,
    local:'perde_romantik.mp4',
    css:'[data-genre="rom"] #rom-hand,[data-genre="rom"] #rom-rose,[data-genre="rom"] #rom-petals,[data-genre="rom"] #rom-glow{display:none !important;}[data-genre="rom"] #rom-card{z-index:6;}#rom-scrub{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1;background:#000;pointer-events:none;}',
    brand:function(SEC,stage,setWrap){
      stage.querySelectorAll('*').forEach(function(el){ if(el.children.length) return; var t=(el.textContent||'').trim(); if(t.indexOf('GÜL')>=0&&t.indexOf('ROMANTİK')>=0) el.style.zIndex='6'; });
    }
  });

  /* ---------- D) BILIM KURGU: cockpit -> warp scrub -> freeze; card over last frame ---------- */
  window.__perdeSci=makeFreezeScrub({
    genre:'sci', stage:'sci-stage', vid:'sci-scrub', PV:0.82,
    local:'perde_bilimkurgu.mp4',
    css:'[data-genre="sci"] #sci-glow,[data-genre="sci"] #sci-stars,[data-genre="sci"] #sci-portal,[data-genre="sci"] #sci-ship{display:none !important;}[data-genre="sci"] #sci-card{z-index:6;}#sci-scrub{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1;background:#000;pointer-events:none;}',
    brand:function(SEC,stage,setWrap){
      stage.querySelectorAll('*').forEach(function(el){ if(el.children.length) return; var t=(el.textContent||'').trim(); if(t.indexOf('BİLİM KURGU')>=0&&t.indexOf('WARP')>=0) el.style.zIndex='6'; });
    }
  });

  var tries=0, iv=setInterval(function(){
    tries++; var a=false,b=false,c=false,d=false;
    try{a=window.__perdePol();}catch(e){}
    try{b=window.__perdeAks();}catch(e){}
    try{c=window.__perdeRom();}catch(e){}
    try{d=window.__perdeSci();}catch(e){}
    if((a&&b&&c&&d)||tries>500) clearInterval(iv);
  },100);
}

// Minimal cinematic TR/EN language switch. Sits above the fixed cinematic shell
// (which has pointer-events disabled), in the camera-HUD row next to the
// timecode; drops below it on narrow screens (see .lang-toggle in globals.css)
// so nothing collides with the timecode or centred section eyebrows.
// Pazar önceliği sırasıyla (EN varsayılan global, ES LatAm, PT-BR, ID, JA, HI).
// Bir dilin markup'ı yoksa (çeviri henüz üretilmemişse) EN'e düşer.
const LANGS = [
  { code: "tr", label: "TR", name: "Türkçe" },
  { code: "en", label: "EN", name: "English" },
  { code: "es", label: "ES", name: "Español" },
  { code: "pt", label: "PT", name: "Português (BR)" },
  { code: "id", label: "ID", name: "Bahasa Indonesia" },
  { code: "ja", label: "JA", name: "日本語" },
  { code: "hi", label: "HI", name: "हिन्दी" },
];

function LangToggle({ lang, onChange }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const current = LANGS.find((l) => l.code === lang) || LANGS[0];

  // Dışarı tıklama + Esc menüyü kapatır.
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div className="lang-toggle">
      <div ref={boxRef} style={{ position: "relative" }}>
        <button type="button" className="lang-trigger" data-open={open ? "1" : "0"} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <span style={{ color: "#F6A93B" }}>{current.label}</span>
          <span style={{ color: "#9b958a", fontSize: 11 }}>{current.name}</span>
          <span className="caret">▼</span>
        </button>
        {open && (
          <div className="lang-menu" role="listbox" aria-label="Dil / Language">
            {LANGS.filter((l) => MARKUP[l.code]).map((l) => (
              <button key={l.code} type="button" role="option" aria-selected={lang === l.code} data-on={lang === l.code ? "1" : "0"} onClick={() => { onChange(l.code); setOpen(false); }}>
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11.5, letterSpacing: 1.5, color: lang === l.code ? "#F6A93B" : "#7a756b", width: 22 }}>{l.label}</span>
                <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13.5, color: "#ECE6DA" }}>{l.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Bekleme listesi formu: e-postayı /api/waitlist'e gönderir. Dil değişiminde
// markup yeniden enjekte edildiği için effect her seferinde yeniden bağlar.
function initWaitlist() {
  const form = document.getElementById("wlForm");
  if (!form || form.dataset.wired) return;
  form.dataset.wired = "1";
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("wlEmail").value.trim();
    const consent = document.getElementById("wlConsent").checked;
    const msg = document.getElementById("wlMsg");
    const btn = document.getElementById("wlBtn");
    if (!consent) { msg.textContent = form.dataset.noconsent; msg.style.color = "#E2452F"; return; }
    btn.disabled = true; btn.style.opacity = ".6";
    try {
      const r = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent, locale: document.documentElement.lang || "tr" }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        msg.textContent = j.already ? form.dataset.dup : form.dataset.ok;
        msg.style.color = "#7bbf5a";
        document.getElementById("wlEmail").value = "";
        // Reklam dönüşümü: pixel yalnız çerez onayı verilmişse yüklüdür.
        try { if (window.fbq && !j.already) window.fbq("track", "Lead"); } catch (e) {}
      } else {
        msg.textContent = j.error || form.dataset.err;
        msg.style.color = "#E2452F";
      }
    } catch {
      msg.textContent = form.dataset.err;
      msg.style.color = "#E2452F";
    }
    btn.disabled = false; btn.style.opacity = "1";
  });
}

// Açılış perdesi: scrub videoları hazır olmadan kaydırma animasyonları bozuk
// görünüyor — 4 video 'loadeddata' (readyState>=2) olana dek perde kapalı kalır.
// Videolar initScrubVideos tarafından ~100ms aralıklarla DOM'a kurulduğu için
// olay dinlemek yerine kısa aralıklarla yoklamak en sağlamı.
function waitForVideos(onProgress, expect = 4, timeoutMs = 10000) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const check = () => {
      const vids = Array.from(document.querySelectorAll("video"));
      const loaded = vids.filter((v) => v.readyState >= 2).length;
      onProgress(loaded, Math.max(vids.length, expect));
      if (vids.length >= expect && loaded >= vids.length) return resolve();
      if (Date.now() - t0 > timeoutMs) return resolve(); // yavaş ağda siteyi rehin alma
      setTimeout(check, 150);
    };
    check();
  });
}

export default function CinematicLanding() {
  const [lang, setLang] = useState("tr");
  // Açılış perdesi durumu (yalnız ilk yüklemede gösterilir)
  const [boot, setBoot] = useState({ visible: true, fading: false, done: 0, total: 4 });
  const bootRan = useRef(false);

  // Restore the saved preference after mount (kept out of the initial state so
  // server and first client render agree — avoids a hydration mismatch).
  useEffect(() => {
    try {
      const saved = localStorage.getItem("mirec_lang");
      if (saved && MARKUP[saved]) setLang(saved);
    } catch (e) {}
  }, []);

  // Mount the scroll controller + scrub videos for the active language. The
  // keyed <div> below is fully replaced on language change, so this re-runs and
  // rebinds to the fresh DOM; the Cinematic controller cleans up on unmount and
  // orphaned scrub rAF loops stop themselves once their <video> leaves the DOM.
  useEffect(() => {
    try { localStorage.setItem("mirec_lang", lang); } catch (e) {}
    if (typeof document !== "undefined") document.documentElement.lang = lang;
    const controller = new Cinematic();
    controller.componentDidMount();
    try { initScrubVideos(); } catch (e) { /* videos are progressive enhancement */ }
    try { initWaitlist(); } catch (e) { /* form progressive enhancement */ }
    // Açılış perdesi: yalnız ilk yüklemede — videolar hazır olana dek kaydırma kilitli.
    if (!bootRan.current) {
      bootRan.current = true;
      document.body.style.overflow = "hidden";
      waitForVideos((done, total) => setBoot((s) => (s.visible ? { ...s, done, total } : s))).then(() => {
        document.body.style.overflow = "";
        setBoot((s) => ({ ...s, fading: true }));
        setTimeout(() => setBoot((s) => ({ ...s, visible: false })), 850);
      });
    }
    return () => controller.componentWillUnmount();
  }, [lang]);

  // Markup elementi memo'lu: boot ilerleme re-render'ları aynı element kimliğini
  // görünce bu alt ağacı atlar — script'in enjekte ettiği scrub videoları silinmez.
  const markupDiv = useMemo(
    () => <div key={lang} dangerouslySetInnerHTML={{ __html: MARKUP[lang] || MARKUP.en }} />,
    [lang]
  );

  return (
    <>
      {/* Açılış perdesi — kırmızı REC ışığı + yükleme çubuğu */}
      {boot.visible && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "#070609", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, opacity: boot.fading ? 0 : 1, transition: "opacity .8s ease", pointerEvents: boot.fading ? "none" : "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ width: 16, height: 16, borderRadius: "50%", background: "#E2452F", boxShadow: "0 0 22px #E2452F", animation: "recblink 1.1s steps(1) infinite" }} />
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 15, letterSpacing: 4, color: "#ECE6DA" }}>REC</span>
          </div>
          <div style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, textTransform: "uppercase", fontSize: 32, letterSpacing: 2, color: "#ECE6DA", lineHeight: 1 }}>MIREC</div>
          <div style={{ width: 190, height: 2, background: "rgba(236,230,218,.15)" }}>
            <div style={{ width: `${Math.round((boot.done / (boot.total || 1)) * 100)}%`, height: "100%", background: "#F6A93B", transition: "width .3s ease" }} />
          </div>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10.5, letterSpacing: 2, color: "#7a756b" }}>
            {lang === "tr" ? "GÖRÜNTÜLER YÜKLENİYOR" : "LOADING FOOTAGE"} {boot.done}/{boot.total}
          </div>
        </div>
      )}
      <LangToggle lang={lang} onChange={setLang} />
      {markupDiv}
    </>
  );
}
