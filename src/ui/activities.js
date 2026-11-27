import { fallTime, fallDistance, GRAVITY, impactEnergy } from '../core/math.js';

export function gravityActivity(ui) {
  let raf = 0, alive = true, running = false, start = 0, last = 0, elapsed = 0;
  const html = `<p class="eyebrow">NOVI’S MINI LAB · GRAVITY</p><h2 id="modal-title">Which one lands first?</h2>
    <p>Drop a heavy sphere and a light sphere together. Compare Earth and Moon gravity with <strong>no air resistance on either world</strong>.</p>
    <div class="experiment-control"><label for="drop-height">Drop height</label><div class="stepper"><button id="height-down" aria-label="Lower drop height">−</button><output id="height-value">5 m</output><button id="height-up" aria-label="Raise drop height">+</button></div></div>
    <div class="drop-worlds">${['earth', 'moon'].map(world => `<section class="drop-world ${world}"><h3>${world === 'earth' ? 'Earth' : 'Moon'} <small>${GRAVITY[world]} m/s²</small></h3><div class="drop-chamber" id="chamber-${world}"><div class="drop-line"></div><div class="drop-ball heavy" data-world="${world}" data-kind="heavy">●<small>Heavy</small></div><div class="drop-ball light" data-world="${world}" data-kind="light">●<small>Light</small></div><span class="ground-label">GROUND</span></div><p id="time-${world}"></p></section>`).join('')}</div>
    <button id="drop" class="primary wide">Drop both pairs</button><p id="drop-result" class="experiment-result" role="status">Make a prediction, then tap to drop.</p>
    <details><summary>What is the model?</summary><p>Free fall from rest: distance = ½gt², so time = √(2h/g). Acceleration is constant near the surface. Mass cancels out. We use 9.81 m/s² for Earth and 1.62 m/s² for the Moon. Real Earth air would change the result for objects with different drag.</p><p><a href="https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/moon/" target="_blank" rel="noopener noreferrer">NASA: lunar gravity</a> · <a href="https://science.nasa.gov/resource/the-apollo-15-hammer-feather-drop/" target="_blank" rel="noopener noreferrer">Apollo 15 hammer and feather</a></p></details>`;
  ui.openModal(html, () => { alive = false; cancelAnimationFrame(raf); });
  const modal = ui.elements.modal;
  let height = 5;
  const balls = [...modal.querySelectorAll('.drop-ball')];
  const button = modal.querySelector('#drop');
  function updateTimes() {
    for (const world of ['earth', 'moon']) modal.querySelector(`#time-${world}`).textContent = `${fallTime(height, GRAVITY[world]).toFixed(2)} s to land`;
    modal.querySelector('#height-value').textContent = `${height} m`;
    modal.querySelector('#height-down').disabled = running || height <= 1;
    modal.querySelector('#height-up').disabled = running || height >= 20;
  }
  function draw(t) {
    for (const ball of balls) {
      const fraction = fallDistance(t, GRAVITY[ball.dataset.world], height) / height;
      const travel = modal.querySelector(`#chamber-${ball.dataset.world}`).clientHeight - 86;
      ball.style.transform = `translateY(${fraction * travel}px)`;
      ball.classList.toggle('landed', fraction >= 1);
    }
  }
  for (const [selector, delta] of [['#height-down', -1], ['#height-up', 1]]) modal.querySelector(selector).addEventListener('click', () => {
    if (running) return; height = Math.max(1, Math.min(20, height + delta)); draw(0); updateTimes(); modal.querySelector('#drop-result').textContent = 'New height. What will happen this time?';
  });
  button.addEventListener('click', () => {
    if (running || !alive) return; running = true; start = performance.now(); last = start; elapsed = 0; button.disabled = true; draw(0); updateTimes();
    modal.querySelector('#drop-result').textContent = 'Falling… both masses have the same acceleration within each world.';
    function frame(now) {
      if (!alive) return;
      // Pause elapsed experiment time while the page is hidden.
      if (!document.hidden) elapsed += Math.min((now - last) / 1000, 0.05);
      last = now; draw(elapsed);
      if (elapsed < fallTime(height, GRAVITY.moon)) raf = requestAnimationFrame(frame);
      else {
        running = false; button.disabled = false; button.textContent = 'Drop again'; updateTimes();
        modal.querySelector('#drop-result').textContent = `Each pair lands together! The Moon pair takes ${(fallTime(height, GRAVITY.moon) / fallTime(height, GRAVITY.earth)).toFixed(2)}× as long as the Earth pair. Mass doesn’t change ideal free-fall time.`;
      }
    }
    raf = requestAnimationFrame(frame);
  });
  updateTimes();
}

export function impactActivity(ui) {
  ui.openModal(`<p class="eyebrow">NOVI’S MINI LAB · IMPACTS</p><h2 id="modal-title">Small rock. Big energy.</h2>
    <p>Keep the impactor’s mass fixed at 1,000 kg. What happens to its kinetic energy when you double its speed?</p>
    <div class="choice-row" aria-label="Choose impact speed">${[5, 10, 20].map(v => `<button class="choice" data-speed="${v}" aria-pressed="${v === 5}">${v} km/s</button>`).join('')}</div>
    <div class="impact-stage" aria-hidden="true"><div class="impactor"></div><div class="impact-bowl"></div><div class="impact-ray r1"></div><div class="impact-ray r2"></div><div class="impact-ray r3"></div></div>
    <div class="energy-display"><strong id="energy-value">12.5 GJ</strong><span>kinetic energy</span><div class="energy-track"><div id="energy-bar"></div></div></div>
    <button class="primary wide" id="impact-launch">Make an impact</button><p class="experiment-result" id="impact-result" role="status">Choose a speed, then launch your imaginary impactor.</p>
    <p class="model-note">Qualitative crater illustration, not a crater-size prediction. Real crater size also depends on gravity, target material, impact angle, and impactor properties. The scene’s timing and scale are illustrative.</p>
    <details><summary>Why does speed matter so much?</summary><p>Kinetic energy = ½ × mass × speed². Doubling the speed multiplies energy by four. At the same mass, 5, 10, and 20 km/s give 12.5, 50, and 200 gigajoules. Only the energy numbers here are calculated; this is not a hydrocode or a simulation of Tycho’s actual impact.</p><p><a href="https://science.nasa.gov/moon/lunar-craters/" target="_blank" rel="noopener noreferrer">NASA: how lunar craters form</a></p></details>`);
  const modal = ui.elements.modal;
  let speed = 5, timer;
  const stage = modal.querySelector('.impact-stage');
  modal.querySelectorAll('[data-speed]').forEach(button => button.addEventListener('click', () => {
    speed = Number(button.dataset.speed);
    modal.querySelectorAll('[data-speed]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    modal.querySelector('#energy-value').textContent = `${impactEnergy(1000, speed * 1000) / 1e9} GJ`;
    modal.querySelector('#energy-bar').style.width = `${(speed / 20) ** 2 * 100}%`;
    stage.classList.remove('impacted');
  }));
  modal.querySelector('#impact-launch').addEventListener('click', () => {
    clearTimeout(timer); stage.classList.remove('impacted');
    stage.style.setProperty('--impact-size', String(0.7 + speed / 25));
    timer = setTimeout(() => stage.classList.add('impacted'), 30);
    modal.querySelector('#impact-result').textContent = `${speed} km/s releases ${impactEnergy(1000, speed * 1000) / 1e9} GJ, ${(speed / 5) ** 2}× the energy of the 5 km/s impact. More energy can excavate more material.`;
  });
  ui.cleanupModal = () => clearTimeout(timer);
}
