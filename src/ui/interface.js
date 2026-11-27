import * as THREE from 'three';
import { icon } from './icons.js';
import { discoveries, sources } from '../data/discoveries.js';

export class Interface {
  constructor(app, actions) {
    this.actions = actions;
    app.insertAdjacentHTML('beforeend', `
      <div class="vignette" aria-hidden="true"></div>
      <header class="topbar">
        <button class="brand" data-action="home" aria-label="NoviVerse home">${icon('star')}<span>Novi<span class="brand-light">Verse</span><small>A UNIVERSE OF DISCOVERIES</small></span></button>
        <nav class="utilities" aria-label="Explorer tools">
          <span id="location-chip" class="location-chip">SPACE EXPLORER</span>
          <button class="tool" data-action="motion" aria-label="Reduce motion" aria-pressed="false" title="Reduce motion">${icon('motion')}</button>
          <button class="tool" data-action="about" aria-label="About the science">${icon('info')}</button>
          <button class="tool" data-action="home" aria-label="Return to space">${icon('home')}</button>
        </nav>
      </header>
      <section class="space-intro" id="space-intro">
        <p class="eyebrow"><span></span> BIG QUESTIONS. LITTLE EXPLORER.</p>
        <h1>A little curiosity.<br>A whole <em>universe.</em></h1>
        <p class="intro-copy">Hi, I’m Novi! See a glowing node?<br>Tap it and let’s find out what’s there.</p>
        <p class="micro">Just tap to travel. Wonder takes it from there.</p>
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
      <div id="labels" class="labels" aria-label="Objects to explore"></div>
      <aside class="novi-message" id="novi-message"><span class="mini-face" aria-hidden="true"><i></i><i></i></span><p><strong>Your co-pilot, Novi</strong><span>Small explorer. Endless questions.</span></p></aside>
      <aside id="discovery" class="discovery" aria-label="Science discovery" hidden></aside>
      <footer class="field-note" id="field-note">A playful universe. Real science. <span>Sizes & distances are not to scale.</span></footer>
      <div id="travel" class="travel" hidden><div class="travel-line"></div><span class="eyebrow">NOVI IS ON THE WAY</span><p id="travel-text" role="status">Getting our spacecraft ready…</p><small>Home is always available to return to space.</small></div>
      <div id="status" class="sr-only" role="status" aria-live="polite"></div>
      <dialog id="modal" aria-labelledby="modal-title"><button class="close tool" data-action="close-modal" aria-label="Close dialog">${icon('close')}</button><div id="modal-body"></div></dialog>
    `);
    this.elements = Object.fromEntries([...app.querySelectorAll('[id]')].map(el => [el.id, el]));
    app.addEventListener('click', event => {
      const dest = event.target.closest('[data-destination]')?.dataset.destination;
      const poi = event.target.closest('[data-poi]')?.dataset.poi;
      const action = event.target.closest('[data-action]')?.dataset.action;
      if (dest) actions.destination(dest);
      if (poi) actions.poi(poi);
      if (action === 'home') actions.home();
      if (action === 'back') actions.back();
      if (action === 'close-discovery') actions.back();
      if (action === 'activity') actions.activity(this.activeDiscovery.activity);
      if (action === 'close-modal') this.closeModal();
      if (action === 'about') this.about();
      if (action === 'motion') actions.motion();
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
  }
  world(kind, labels) {
    this.kind = kind;
    document.body.dataset.world = kind;
    this.elements['space-intro'].hidden = kind !== 'space';
    this.elements['moon-intro'].hidden = kind !== 'moon';
    this.elements['sun-intro'].hidden = kind !== 'sun';
    this.elements['novi-message'].hidden = kind !== 'space';
    this.elements['location-chip'].textContent = kind === 'space' ? 'SPACE EXPLORER' : kind === 'sun' ? 'SUN · SOLAR OBSERVATORY' : 'MOON · TYCHO REGION';
    this.elements['field-note'].innerHTML = kind === 'space' ? 'A playful universe. Real science. <span>Sizes & distances are not to scale.</span>' : kind === 'sun' ? 'Illustrated solar view · Colors & activity are artistic. <span>Novi’s viewing position is fictional. Never look directly at the real Sun.</span>' : 'Artistic Tycho diorama · Novi’s hovercraft is fictional. <span>Geography & travel compressed. Rocks are representative.</span>';
    this.labels = labels;
    this.elements.labels.innerHTML = labels.map(label => `<button class="explore-node" aria-label="Explore ${label.text}" data-${kind === 'space' ? 'destination' : 'poi'}="${label.id}"><span class="target-dot" aria-hidden="true"></span></button>`).join('');
    this.labelButtons = [...this.elements.labels.children];
    this.hideDiscovery();
  }
  project(engine) {
    if (!this.labels) return;
    this.labels.forEach((label, i) => {
      label.object.getWorldPosition(this.scratch); this.scratch.add(label.offset).project(engine.camera);
      const x = (this.scratch.x + 1) / 2 * innerWidth, y = (-this.scratch.y + 1) / 2 * innerHeight;
      const button = this.labelButtons[i];
      button.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`;
      button.hidden = this.busy || !!this.activeDiscovery || this.scratch.z < -1 || this.scratch.z > 1 || x < 25 || x > innerWidth - 25 || y < 88 || y > innerHeight - 60;
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
      <button class="text-button" data-action="back">${icon('back')}${this.kind === 'moon' ? 'Lunar overview' : this.kind === 'sun' ? 'Solar overview' : 'Back to space'}</button>`;
    this.elements.discovery.hidden = false;
    document.body.classList.add('discovering');
    this.elements.discovery.querySelector('h2').focus({ preventScroll: true });
    this.status(`Discovered ${d.title}.`);
  }
  hideDiscovery() {
    this.activeDiscovery = null;
    this.elements.discovery.hidden = true;
    document.body.classList.remove('discovering');
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
    this.openModal(`<p class="eyebrow">IMAGINATION MEETS EVIDENCE</p><h2 id="modal-title">A small guide to this universe.</h2>
      <p>Novi is an original fictional explorer. The transforming spacecraft, scanner, short journeys, and gravity lab equipment are imagined. A real lunar hover vehicle would need thrust: there is almost no air for wings or fans to push against.</p>
      <p>Our crater names and catalog measurements come from the USGS / IAU Gazetteer. The local terrain is an artistic diorama, not surveyed topography. Craters are compressed in scale and spacing, and rock models represent real rock types rather than known specimens at these positions.</p>
      <p>The Earth and Moon use credited NASA maps. Lighting, speeds, sizes, and distances are arranged for exploration. The Sun is a stylized illustration. No NASA endorsement is implied.</p>
      <p>Tap a world or a glowing node to discover its name and science. Novi navigates automatically. Back returns to the overview; Home returns to space. All destinations are open from the beginning. Nothing is saved.</p>
      <h3>Art & imagery credits</h3><p>Earth: NASA Earth Observatory, Blue Marble Next Generation (July 2004), Reto Stöckli. Moon: NASA / GSFC / Arizona State University, LRO CGI Moon Kit, Ernie Wright. Novi, equipment, terrain and interface are original code-authored artwork.</p>
      <p><a href="https://www.nasa.gov/nasa-brand-center/images-and-media/" target="_blank" rel="noopener noreferrer">NASA media usage guidelines</a> · <a href="https://svs.gsfc.nasa.gov/4720/" target="_blank" rel="noopener noreferrer">Moon map credits</a></p>
      <p class="muted">Explore the Moon and the solar observatory. Earth offers an introductory view; expanded environments are planned. Solar plasma, glare and magnetic loops are authored illustrations, not live imagery or a physical simulation. No accounts, analytics, storage, or backend services.</p>`);
  }
  error(message) {
    this.setBusy(false); this.openModal(`<p class="eyebrow">A LITTLE SPACE WEATHER</p><h2 id="modal-title">We couldn’t draw this world.</h2><p>${message}</p><p>Try reloading in a browser with WebGL2 enabled. If a texture failed to load, check that the textures folder is served with the site.</p><button class="primary" onclick="location.reload()">Try again</button><p><a href="https://science.nasa.gov/moon/">Explore Moon science at NASA</a></p>`);
  }
}
