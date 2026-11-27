import * as THREE from 'three';
import { icon } from './icons.js';
import { earthRegions } from '../data/earth.js';
import { discoveries, sources } from '../data/discoveries.js';
import { wonders } from '../data/wonders.js';
import { celestialBodies, bodyById } from '../data/universe.js';
import { placeNode } from '../core/node-layout.js';

export class Interface {
  constructor(app, actions) {
    this.actions = actions;
    app.insertAdjacentHTML('beforeend', `
      <div class="vignette" aria-hidden="true"></div>
      <header class="topbar">
        <button class="brand" data-action="home" aria-label="NoviVerse home">${icon('star')}<span>Novi<span class="brand-light">Verse</span><small>A UNIVERSE OF DISCOVERIES</small></span></button>
        <nav class="utilities" aria-label="Explorer tools">
          <span id="location-chip" class="location-chip">SPACE EXPLORER</span>
          <button class="explorer-menu" data-action="destinations" aria-label="Choose a celestial destination">Explore</button>
          <button class="tool" data-action="motion" aria-label="Reduce motion" aria-pressed="false" title="Reduce motion">${icon('motion')}</button>
          <button class="tool" data-action="about" aria-label="About the science">${icon('info')}</button>
          <button class="tool" data-action="home" aria-label="Return to space">${icon('home')}</button>
        </nav>
      </header>
      <section class="space-intro" id="space-intro">
        <p class="eyebrow">YOUR COSMIC BACKYARD</p>
        <h1>Explore beyond <em>Earth.</em></h1>
        <p class="intro-copy">A star. Eight worlds. Endless curiosity.</p>
      </section>
      <section class="moon-intro" id="moon-intro" hidden>
        <button class="text-button" data-action="home">${icon('back')} Back to space</button>
        <p class="eyebrow">LUNAR FIELD TRIP</p>
        <h1>Hello, Moon.</h1>
        <p>Tap a glowing node.<br>Every stop has a story to discover.</p>
      </section>
      <section class="moon-intro sun-intro" id="sun-intro" hidden>
        <button class="text-button" data-action="home">${icon('back')} Back to space</button>
        <p class="eyebrow">SOLAR OBSERVATORY</p>
        <h1>Hello, Sun.</h1>
        <p>A star full of surprises.<br>Tap a node. Let’s look closer.</p>
      </section>
      <section class="moon-intro earth-intro" id="earth-intro" hidden>
        <button class="text-button" data-action="back" id="earth-back">${icon('back')} Back to space</button>
        <p class="eyebrow" id="earth-eyebrow">OUR LIVING PLANET</p>
        <h1 id="earth-title">Hello, Earth.</h1>
        <p>Drag, swipe or scroll to turn.<br>Pinch to zoom. Tap a node to explore.</p>
      </section>
      <section class="moon-intro wonder-intro" id="wonder-intro" hidden>
        <button class="text-button" data-action="back">${icon('back')} Back to continent</button>
        <h1 id="wonder-title"></h1>
        <p>Tap a glowing node. Novi will investigate.</p>
        <button class="primary" data-action="wonder-challenge">Play the discovery challenge</button>
      </section>
      <nav id="earth-controls" class="earth-controls" aria-label="Globe navigation" hidden>
        <span class="sr-only">Turn the globe, zoom, or reset the current view.</span>
        <button data-earth-control="left" aria-label="Turn globe left">Left</button>
        <button data-earth-control="right" aria-label="Turn globe right">Right</button>
        <button data-earth-control="up" aria-label="Look farther north">North</button>
        <button data-earth-control="down" aria-label="Look farther south">South</button>
        <button data-earth-control="in" aria-label="Zoom into Earth">+</button>
        <button data-earth-control="out" aria-label="Zoom out from Earth">−</button>
        <button data-earth-control="reset" aria-label="Reset globe view">Reset view</button>
      </nav>
      <div id="labels" class="labels" aria-label="Objects to explore"></div>
      <nav class="space-tools" id="space-tools" aria-label="Solar system view"><span>Drag to orbit · Scroll or pinch to zoom · Tap to fly</span><button data-action="zoom-in" aria-label="Zoom in">+</button><button data-action="zoom-out" aria-label="Zoom out">−</button><button data-action="home" aria-label="Reset solar system view">Overview</button></nav>
      <aside class="novi-message" id="novi-message"><span class="mini-face" aria-hidden="true"><i></i><i></i></span><p><strong>Your co-pilot, Novi</strong><span>Small explorer. Endless questions.</span></p></aside>
      <aside id="discovery" class="discovery" aria-label="Science discovery" hidden></aside>
      <footer class="field-note" id="field-note">A playful universe. Real science. <span>Sizes & distances are not to scale.</span></footer>
      <div id="travel" class="travel" hidden><div class="travel-line"></div><span class="eyebrow">NOVI IS ON THE WAY</span><p id="travel-text" role="status">Getting our spacecraft ready…</p><small>Home is always available to return to space.</small></div>
      <div id="status" class="sr-only" role="status" aria-live="polite"></div>
      <dialog id="modal" aria-labelledby="modal-title"><button class="close tool" data-action="close-modal" aria-label="Close dialog">${icon('close')}</button><div id="modal-body"></div></dialog>
    `);
    this.elements = Object.fromEntries([...app.querySelectorAll('[id]')].map(el => [el.id, el]));
    app.addEventListener('click', event => {
      const earthControl = event.target.closest('[data-earth-control]')?.dataset.earthControl;
      if (earthControl) actions.earthControl?.(earthControl);
      const dest = event.target.closest('[data-destination]')?.dataset.destination;
      const poi = event.target.closest('[data-poi]')?.dataset.poi;
      const action = event.target.closest('[data-action]')?.dataset.action;
      if (dest) actions.destination(dest);
      if (poi) actions.poi(poi);
      if (action === 'home') actions.home();
      if (action === 'back') actions.back();
      if (action === 'close-discovery') actions.back();
      if (action === 'activity') actions.activity(this.activeDiscovery.activity);
      if (action === 'wonder-challenge') actions.wonderActivity?.();
      if (action === 'close-modal') this.closeModal();
      if (action === 'about') this.about();
      if (action === 'motion') actions.motion();
      if (action === 'destinations') this.destinations();
      if (action === 'zoom-in') actions.zoom?.(.8);
      if (action === 'zoom-out') actions.zoom?.(1.25);
      if (action === 'detail') actions.detail?.(event.target.closest('[data-body]').dataset.body);
    });
    this.elements.modal.addEventListener('close', () => { if (!this.elements.modal.open) { this.cleanupModal?.(); this.cleanupModal = null; } });
    this.elements.modal.addEventListener('click', e => { if (e.target === this.elements.modal) { const r = e.target.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) this.closeModal(); } });
    this.scratch = new THREE.Vector3();
  }
  status(text) { this.elements.status.textContent = text; }
  setBusy(busy, text = '') {
    this.busy = busy; this.elements.travel.hidden = !busy;
    if (text) { this.elements['travel-text'].textContent = text; this.status(text); }
    document.querySelectorAll('[data-destination], [data-poi]').forEach(button => { button.disabled = busy; });
    document.body.classList.toggle('travelling', busy);
    this.elements['earth-controls'].querySelectorAll('button').forEach(button => { button.disabled = busy; });
    document.querySelector('[data-action="wonder-challenge"]').disabled = busy;
  }
  world(kind, labels) {
    this.kind = kind;
    document.body.dataset.world = kind;
    this.elements['space-intro'].hidden = kind !== 'space';
    this.elements['moon-intro'].hidden = kind !== 'moon';
    this.elements['sun-intro'].hidden = kind !== 'sun';
    this.elements['earth-intro'].hidden = kind !== 'earth';
    this.elements['wonder-intro'].hidden = kind !== 'wonder';
    this.elements['earth-controls'].hidden = kind !== 'earth';
    this.elements['novi-message'].hidden = kind !== 'space';
    this.elements['space-tools'].hidden = kind !== 'space';
    this.elements['location-chip'].textContent = kind === 'space' ? 'SOLAR SYSTEM' : kind === 'sun' ? 'SUN · SOLAR OBSERVATORY' : kind === 'earth' ? 'EARTH · GLOBE EXPLORER' : 'MOON · TYCHO REGION';
    this.elements['field-note'].innerHTML = kind === 'space' ? 'NOT TO SCALE <span>Sizes, distances & time compressed for discovery.</span>' : kind === 'sun' ? 'Illustrated solar view · Colors & activity are artistic. <span>Novi’s viewing position is fictional. Never look directly at the real Sun.</span>' : 'Artistic Tycho diorama · Novi is a fictional rocket. <span>Geography & travel compressed. Rocks are representative.</span>';
    this.labels = labels;
    this.elements.labels.innerHTML = labels.map(label => `<button class="explore-node" aria-label="Explore ${label.text}" data-${kind === 'space' ? 'destination' : 'poi'}="${label.id}"><span class="target-dot" aria-hidden="true"></span></button>`).join('');
    this.labelButtons = [...this.elements.labels.children];
    this.hideDiscovery();
  }
  earthRegion(region) {
    this.earthRegionId = region;
    this.elements['earth-title'].textContent = region ? `Hello, ${earthRegions[region].title}.` : 'Hello, Earth.';
    this.elements['earth-eyebrow'].textContent = earthRegions[region]?.eyebrow || 'OUR LIVING PLANET';
    this.elements['earth-back'].innerHTML = `${icon('back')}${region ? 'Earth overview' : 'Back to space'}`;
    this.elements['location-chip'].textContent = region ? `EARTH · ${earthRegions[region].title.toUpperCase()}` : 'EARTH · GLOBE EXPLORER';
  }
  wonder(siteId) {
    this.siteId = siteId;
    this.elements['wonder-title'].textContent = wonders[siteId].title;
    this.elements['location-chip'].textContent = `EARTH · ${wonders[siteId].title.toUpperCase()}`;
    this.elements['field-note'].innerHTML = 'Illustrated landscape · Novi’s walking gear is fictional. <span>Features are representative, not surveyed terrain or a live view.</span>';
  }
  project(engine) {
    if (!this.labels) return;
    const placed = [];
    this.labels.forEach((label, i) => {
      label.object.getWorldPosition(this.scratch); this.scratch.add(label.offset).project(engine.camera);
      let x = (this.scratch.x + 1) / 2 * innerWidth, y = (-this.scratch.y + 1) / 2 * innerHeight;
      const button = this.labelButtons[i];
      button.hidden = this.busy || !!this.activeDiscovery || label.visible?.(engine) === false || this.scratch.z < -1 || this.scratch.z > 1 || x < 25 || x > innerWidth - 25 || y < 88 || y > innerHeight - 60;
      if (this.kind === 'space' && !button.hidden) {
        const point = placeNode({x,y}, placed, innerWidth, innerHeight);
        if (!point) { button.hidden = true; return; }
        placed.push(point);
        button.style.setProperty('--leader-length', `${Math.hypot(x-point.x,y-point.y)}px`);
        button.style.setProperty('--leader-angle', `${Math.atan2(y-point.y,x-point.x)}rad`);
        x = point.x; y = point.y;
      }
      button.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`;
    });
  }
  showDiscovery(id) {
    const d = discoveries[id]; this.activeDiscovery = d;
    this.previousFocus = document.activeElement;
    this.elements.discovery.innerHTML = `<div class="discovery-top"><span class="discovery-symbol">${icon(d.icon)}</span><button class="tool" data-action="close-discovery" aria-label="Return to overview">${icon('close')}</button></div>
      <p class="eyebrow">${d.category}</p><h2 tabindex="-1">${d.title}</h2>
      <div class="stats">${d.stats.map(([value, label]) => `<div><strong>${value}</strong><small>${label}</small></div>`).join('')}</div>
      <p>${d.explanation}</p><div class="wonder"><span>${icon('star')} DID YOU KNOW?</span><p>${d.fact}</p></div>
      ${d.activity ? `<button class="primary activity-button" data-action="activity">${icon('lab')}${d.activityTitle}</button>` : d === discoveries.earth ? '<span class="expansion">MORE ENVIRONMENTS · FUTURE EXPANSION</span>' : ''}
      <details><summary>A closer look</summary><p>${d.detail}</p></details>
      <details><summary>Science sources</summary><ul>${d.sourceIds.map(id => `<li><a href="${sources[id][1]}" target="_blank" rel="noopener noreferrer">${sources[id][0]}</a></li>`).join('')}</ul><small>Checked 27 November 2026</small></details>
      <button class="text-button" data-action="back">${icon('back')}${this.kind === 'moon' ? 'Lunar overview' : this.kind === 'sun' ? 'Solar overview' : this.kind === 'wonder' ? 'Back to the lookout' : this.kind === 'earth' ? `${earthRegions[this.earthRegionId]?.title || 'Earth'} overview` : 'Back to space'}</button>`;
    this.elements.discovery.hidden = false;
    this.elements.discovery.scrollTop = 0;
    document.body.classList.add('discovering');
    this.elements.discovery.querySelector('h2').focus({ preventScroll: true });
    this.status(`Discovered ${d.title}.`);
  }
  showBody(id) {
    const data = bodyById[id], d = data.science;
    this.previousFocus = document.activeElement;
    this.activeDiscovery = data;
    this.elements['location-chip'].textContent = data.name.toUpperCase();
    this.elements.discovery.innerHTML = `<div class="discovery-top"><span class="eyebrow">${data.type.toUpperCase()}</span><button class="tool" data-action="back" aria-label="Return to solar system">${icon('close')}</button></div>
      <h2 tabindex="-1">${data.name}</h2><div class="stats"><div><strong>${d.diameter}</strong><small>diameter · approximate</small></div><div><strong>${d.year}</strong><small>${id === 'moon' ? 'orbit around Earth' : id === 'sun' ? 'solar system center' : 'orbit around Sun'}</small></div></div>
      <p>${d.explanation}</p><div class="wonder"><span>${icon('star')} A LITTLE WONDER</span><p>${d.fact}</p></div>
      ${['sun','moon'].includes(id) ? `<button class="primary wide" data-action="detail" data-body="${id}">${id === 'sun' ? 'Enter the solar observatory' : 'Visit the lunar field station'}</button>` : ''}
      <details><summary>Science & illustration</summary><p>Drag around this world and pinch or scroll to look closer. Surface patterns, colors, sizes, orbits, rotation and travel times are illustrative. Earth and Moon reuse credited NASA maps. Continents and deep space are future explorations.</p><p><a href="${d.source}" target="_blank" rel="noopener noreferrer">NASA · ${data.name} facts</a></p><p><a href="https://nssdc.gsfc.nasa.gov/planetary/factsheet/" target="_blank" rel="noopener noreferrer">NASA · Planetary measurements</a></p></details>
      <button class="text-button" data-action="home">Solar system overview</button>`;
    this.elements.discovery.hidden = false; this.elements.discovery.scrollTop = 0;
    document.body.classList.add('discovering');
    this.elements.discovery.querySelector('h2').focus({preventScroll:true});
    this.status(`Discovered ${data.name}. ${d.fact}`);
  }
  destinations() {
    if (this.kind !== 'space' || this.busy) return;
    this.openModal(`<p class="eyebrow">FOLLOW YOUR CURIOSITY</p><h2 id="modal-title">Where shall we fly?</h2><p>Every world is open. You can also tap any glowing node in space.</p><div class="destination-grid">${celestialBodies.map(data => `<button data-destination="${data.id}" style="--planet-color:${data.visual.color}"><i aria-hidden="true"></i>${data.name}<small>${data.type}</small></button>`).join('')}</div>`);
  }
  hideDiscovery() {
    const restore = this.activeDiscovery && this.elements.discovery.contains(document.activeElement);
    this.activeDiscovery = null;
    this.elements.discovery.hidden = true;
    document.body.classList.remove('discovering');
    if (restore) document.querySelector('[data-action="home"]').focus({preventScroll:true});
  }
  openModal(html, cleanup) {
    this.closeModal(); this.elements['modal-body'].innerHTML = html; this.cleanupModal = cleanup;
    this.elements.modal.showModal();
  }
  closeModal() {
    this.cleanupModal?.(); this.cleanupModal = null;
    if (this.elements.modal.open) this.elements.modal.close();
  }
  about() {
    this.openModal(`<p class="eyebrow">IMAGINATION MEETS EVIDENCE</p><h2 id="modal-title">A little guide to our universe.</h2>
      <p>Meet Novi: a living retro rocket. Drag or swipe to orbit, scroll or pinch to zoom, and tap a world or glowing node to fly. Explore offers a keyboard-accessible destination list. All eight planets, the Sun and Moon are open from the start.</p>
      <p>This is an illustrative solar system, not to scale. Sizes and distances are compressed. Orbital phases, rotation speeds, travel times, lighting and surface patterns are artistic. Orbits pause during close-up study. Each card links its measurements and facts to NASA sources.</p>
      <p>Earth and Moon reuse credited NASA maps. Other planets use original procedural illustrations. Saturn’s rings, solar plasma, glare, prominences and rocket exhaust are authored visuals, not physical simulations or live data. Novi’s journeys and viewing positions are fictional.</p>
      <p>The Sun observatory and Moon field station retain discovery nodes and optional science activities. The Moon is an artistic Tycho-region diorama. Rocks represent real rock types, not known specimens at those locations. Continent exploration and interstellar or galactic scenes are deferred.</p>
      <h3>Art & imagery credits</h3><p>Earth: NASA Earth Observatory, Blue Marble Next Generation (July 2004), Reto Stöckli. Moon: NASA / GSFC / Arizona State University, LRO CGI Moon Kit, Ernie Wright. Novi, planets, equipment, terrain and interface are original code-authored artwork. No NASA endorsement is implied.</p>
      <p><a href="https://science.nasa.gov/solar-system/planets/" target="_blank" rel="noopener noreferrer">NASA · Our planets</a> · <a href="https://svs.gsfc.nasa.gov/4720/" target="_blank" rel="noopener noreferrer">Moon map credits</a></p>
      <p class="muted">Static site. No accounts, Firebase, analytics, database or backend services. Nothing is saved between visits.</p>`);
  }
  error(message) {
    this.setBusy(false); this.openModal(`<p class="eyebrow">A LITTLE SPACE WEATHER</p><h2 id="modal-title">We couldn’t draw this world.</h2><p>${message}</p><p>Try reloading in a browser with WebGL2 enabled. If a texture failed to load, check that the textures folder is served with the site.</p><button class="primary" onclick="location.reload()">Try again</button><p><a href="https://science.nasa.gov/moon/">Explore Moon science at NASA</a></p>`);
  }
}
