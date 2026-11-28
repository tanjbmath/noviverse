import * as THREE from 'three';
import { bodies, bodyById } from '../data/astronomy.js';

export class AstronomyInterface {
  constructor(app,actions){
    this.actions=actions;this.selected=null;this.factIndex=null;
    app.insertAdjacentHTML('beforeend',`
      <header class="astro-header"><button class="brand" data-action="home" aria-label="NoviVerse solar system overview"><span class="brand-star" aria-hidden="true">✦</span><span>Novi<span class="brand-light">Verse</span><small>FOLLOW YOUR CURIOSITY</small></span></button>
      <div class="header-tools"><span class="location" id="location">OUR SOLAR SYSTEM</span><button class="quiet" data-action="motion" aria-pressed="false">Reduce motion</button><button class="round" data-action="about" aria-label="How to explore and credits">?</button></div></header>
      <section class="welcome" id="welcome"><p class="eyebrow">A LITTLE ROCKET. A BIG UNIVERSE.</p><h1>There’s a whole<br><em>universe</em> out there.</h1><p>Meet Novi, your curious co-pilot.<br>Pick a world. See what makes it extraordinary.</p><button class="primary" data-visit="saturn">Let’s explore Saturn</button><span class="gesture-hint">Drag to look around · Scroll or pinch to zoom</span></section>
      <div class="focus-heading" id="focus-heading" hidden><button class="quiet" data-action="home">Solar system overview</button><p class="eyebrow" id="focus-type"></p><h1 id="focus-name"></h1><p id="focus-tagline"></p><span class="gesture-hint">Drag to orbit · Tap a glowing node to discover</span></div>
      <aside class="planet-panel" id="planet-panel" aria-label="World discoveries" hidden></aside>
      <div class="node-layer" id="node-layer"></div>
      <div class="camera-tools" aria-label="Camera controls"><button class="round" data-camera="left" aria-label="Orbit camera left">↶</button><button class="round" data-camera="right" aria-label="Orbit camera right">↷</button><button class="round" data-camera="in" aria-label="Zoom in">+</button><button class="round" data-camera="out" aria-label="Zoom out">−</button><button class="quiet" data-action="reset">Reset view</button></div>
      <div class="journey" id="journey" role="status" hidden><span class="journey-dot"></span><span id="journey-text">Novi is on the way…</span></div>
      <div class="dock-wrap"><div class="dock-caption"><span>CHOOSE YOUR NEXT WONDER</span><span>Everything is open. Just explore.</span></div><nav class="planet-dock" aria-label="Celestial destinations">${bodies.map(b=>`<button class="world-button" data-visit="${b.id}" aria-pressed="false"><span class="world-thumb" style="--world-color:${b.color};${b.texture?`background-image:url('${import.meta.env.BASE_URL}textures/${b.texture}')`:''}" aria-hidden="true"></span><span>${b.name}</span></button>`).join('')}</nav></div>
      <footer class="scale-note">Real science. An imagined voyage. <span>Sizes, distances & speeds are not to scale. Positions are illustrative.</span></footer>
      <div class="sr-only" role="status" aria-live="polite" id="status"></div>
      <dialog id="astro-dialog" aria-labelledby="dialog-title"><button class="round dialog-close" data-action="close-dialog" aria-label="Close dialog">×</button><div id="dialog-content"></div></dialog>
      <div class="graphics-notice" id="graphics-notice" hidden></div>
    `);
    this.el=Object.fromEntries([...app.querySelectorAll('[id]')].map(e=>[e.id,e]));
    app.addEventListener('click',e=>{
      const target=e.target.closest('button');if(!target)return;
      if(target.dataset.visit)actions.visit(target.dataset.visit);
      if(target.dataset.fact!==undefined)this.showFact(Number(target.dataset.fact));
      if(target.dataset.camera)actions.camera(target.dataset.camera);
      const action=target.dataset.action;
      if(action==='home')actions.home();
      if(action==='reset')actions.reset();
      if(action==='motion')actions.motion();
      if(action==='about')this.about();
      if(action==='close-dialog')this.closeDialog();
      if(action==='challenge')this.challenge();
      if(target.dataset.answer!==undefined)this.answer(Number(target.dataset.answer));
    });
    this.el['astro-dialog'].addEventListener('close',()=>actions.modal(false));
    this.el['astro-dialog'].addEventListener('click',e=>{if(e.target!==this.el['astro-dialog'])return;const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)this.closeDialog();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!this.el['astro-dialog'].open&&this.selected)actions.home();});
    this.projected=new THREE.Vector3();
  }
  status(message){this.el.status.textContent=message;}
  setBusy(value,name=''){this.busy=value;this.el.journey.hidden=!value;this.el['journey-text'].textContent=`Flying to ${name}…`;document.querySelectorAll('[data-visit],[data-camera],[data-action="reset"]').forEach(b=>b.disabled=value);}
  select(id){
    this.selected=id;this.factIndex=null;const b=bodyById[id];
    this.el.welcome.hidden=!!id;this.el['focus-heading'].hidden=!id;this.el['planet-panel'].hidden=!id;
    document.body.classList.toggle('focused',!!id);
    document.querySelectorAll('[data-visit]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.visit===id)));
    this.el.location.textContent=b?`${b.name.toUpperCase()} · ${b.type.toUpperCase()}`:'OUR SOLAR SYSTEM';
    if(!b)return;
    this.el['focus-type'].textContent=b.type;this.el['focus-name'].textContent=b.name;this.el['focus-tagline'].textContent=b.tagline;
    this.el['planet-panel'].scrollTop=0;
    this.el['planet-panel'].innerHTML=`<p class="eyebrow">YOUR FIELD NOTES</p><div class="planet-stats"><div><strong>${b.diameter.toLocaleString('en-US')}<small>km</small></strong><span>Equatorial diameter</span></div><div><strong>${b.au?`${b.au} AU`:'—'}</strong><span>${b.au?'Mean distance from Sun':'See orbital period below'}</span></div></div><p class="orbit-fact"><span>${id==='moon'?'Lunar orbit':id==='sun'?'Our neighborhood':'One year'}</span><strong>${b.year}</strong></p><div class="fact-tabs" role="group" aria-label="Discoveries">${b.facts.map((f,i)=>`<button data-fact="${i}" aria-pressed="false">${['Look closer','Something surprising','Keep wondering'][i]}</button>`).join('')}</div><div id="fact-content" class="fact-content"><h2>Every world has a story.</h2><p>Tap one of the three glowing nodes, or choose a discovery above.</p></div><button class="primary challenge-button" data-action="challenge">Try Novi’s quick question</button><details class="science-source"><summary>Science & imagery</summary><p><a href="${b.source}" target="_blank" rel="noopener noreferrer">${b.name} facts · NASA Science</a></p><p>Rounded values checked 28 November 2026. AU = Earth’s mean distance from the Sun.</p><p>${['earth','moon'].includes(id)?'NASA imagery; see full credits in the help menu.':id==='sun'?'Artistic animated plasma; not live imagery.':'Texture: Solar System Scope / INOVE, CC BY 4.0. Colors enhanced; some map gaps reconstructed.'}</p></details>`;
  }
  showFact(index){
    if(this.busy||!this.selected||!Number.isInteger(index)||index<0||index>2)return;
    this.factIndex=index;const [title,text]=bodyById[this.selected].facts[index];
    const panel=this.el['planet-panel'];panel.querySelector('#fact-content').innerHTML=`<p class="eyebrow">A LITTLE DISCOVERY</p><h2 tabindex="-1">${title}</h2><p>${text}</p>`;
    panel.querySelectorAll('[data-fact]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.fact)===index)));
    panel.querySelector('h2').focus({preventScroll:true});panel.querySelector('#fact-content').scrollIntoView({block:'nearest'});this.status(title+'. '+text);
  }
  nodes(world){
    this.nodeWorld=world;this.el['node-layer'].innerHTML=(this.selected?bodyById[this.selected].facts:bodies).map((b,i)=>`<button class="explore-node" ${this.selected?`data-fact="${i}" aria-label="Discover ${bodyById[this.selected].name}, observation ${i+1}"`:`data-visit="${b.id}" aria-label="Explore ${b.name}"`}><span></span></button>`).join('');
    this.nodeButtons=[...this.el['node-layer'].children];
  }
  project(engine,world){
    if(!this.nodeButtons)return;
    engine.camera.updateMatrixWorld();world.scene.updateMatrixWorld();
    this.nodeButtons.forEach((button,i)=>{
      const object=this.selected?world.nodes[i]:world.objects[bodies[i].id];object.getWorldPosition(this.projected);
      if(!this.selected)this.projected.y+=bodyById[bodies[i].id].radius;
      const original=this.projected.clone();this.projected.project(engine.camera);
      const x=(this.projected.x+1)*innerWidth/2,y=(1-this.projected.y)*innerHeight/2;
      // Focus nodes are on the camera-facing hemisphere only.
      const center=this.selected?world.objects[this.selected].position:null;
      const facing=!center||original.clone().sub(center).dot(engine.camera.position.clone().sub(original))>0;
      button.hidden=this.busy||this.el['astro-dialog'].open||!facing||this.projected.z< -1||this.projected.z>1||x<22||x>innerWidth-22||y<95||y>innerHeight-(innerWidth<700?170:(innerHeight<600?120:155));
      button.style.transform=`translate(${x}px,${y}px) translate(-50%,-50%)`;
    });
  }
  openDialog(html){this.el['dialog-content'].innerHTML=html;this.el['astro-dialog'].showModal();this.actions.modal(true);}
  closeDialog(){this.el['astro-dialog'].close();}
  challenge(){if(!this.selected)return;this.quizBody=this.selected;const b=bodyById[this.selected],q=b.question;this.openDialog(`<p class="eyebrow">A QUESTION FROM NOVI</p><h2 id="dialog-title">${q[0]}</h2><p>Take a guess. Curiosity is how we learn.</p><div class="answers">${q[1].map((text,i)=>`<button class="answer" data-answer="${i}">${text}</button>`).join('')}</div><div id="answer-feedback" role="status"></div>`);}
  answer(index){const q=bodyById[this.quizBody].question,correct=index===q[2];this.el['dialog-content'].querySelector('#answer-feedback').innerHTML=`<h3>${correct?'You’ve got it!':'A useful guess. Let’s look closer.'}</h3><p>${correct?q[3]:'You can try again. Think about what you discovered on this world.'}</p>`;if(correct)this.el['dialog-content'].querySelectorAll('[data-answer]').forEach(b=>b.disabled=true);}
  about(){this.openDialog(`<p class="eyebrow">WELCOME ABOARD</p><h2 id="dialog-title">Let curiosity set the course.</h2><p>Drag or swipe to orbit the view. Scroll or pinch to zoom. Tap a world or use the destination dock to send Novi there. Three glowing nodes reveal each world’s science. The camera buttons also work with a keyboard.</p><p>Overview always returns to the solar system, including during travel. Reduce motion freezes idle animations and shortens journeys. Nothing is saved and all destinations are open.</p><h3>A playful view. Real science.</h3><p>Sizes, distances, lighting, orbital phases and speeds are arranged for exploration. This is a solar-system illustration, not a live sky map or a gravity simulation. Gas and ice giants have no solid visible surface to land on. Novi and the viewing positions are fictional.</p><h3>Imagery & credits</h3><p>Earth: NASA Earth Observatory, Blue Marble Next Generation, Reto Stöckli (July 2004). Moon: NASA / GSFC / Arizona State University, LRO CGI Moon Kit, Ernie Wright.</p><p>Other planet maps: <a href="https://www.solarsystemscope.com/textures/" target="_blank" rel="noopener noreferrer">Solar System Scope / INOVE</a>, <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>. Images resized and JPEG optimized; original maps have enhanced colors and reconstructed gaps. Saturn’s rings, the Sun and Novi are original 3D artwork.</p><p>Science: <a href="https://science.nasa.gov/solar-system/" target="_blank" rel="noopener noreferrer">NASA Science</a>. Each world links to its source. No NASA endorsement is implied. No accounts, analytics, database or backend.</p>`);}
  graphicsError(message){this.el['graphics-notice'].hidden=false;this.el['graphics-notice'].textContent=message;}
}
