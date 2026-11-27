import { wonders, wonderDiscoveries } from '../data/wonders.js';

export function wonderActivity(ui, siteId) {
  const data = wonders[siteId];
  if (!data) return;
  let question = 0, solved = false, finished = false;
  ui.openModal(`<p class="eyebrow">NOVI’S LOCATION DETECTIVE</p><h2 id="modal-title">Look closely. Follow the clues.</h2>
    <p id="wonder-clue"></p><div class="wonder-challenge-art"><img src="${import.meta.env.BASE_URL}wonders/${data.image}" alt="Illustrated ${data.title} landscape for the discovery challenge">
    ${data.features.map((feature, i) => `<button class="explore-node" data-find="${feature.id}" aria-label="Investigate location ${i + 1}" style="left:${feature.uv[0] * 100}%;top:${feature.uv[1] * 100}%"><span class="target-dot" aria-hidden="true"></span></button>`).join('')}</div>
    <p class="experiment-result" id="wonder-feedback" role="status">Tap a node in the picture.</p><button class="primary wide" id="wonder-next" hidden>Next clue</button>`);
  const modal = ui.elements.modal, buttons = [...modal.querySelectorAll('[data-find]')];
  function draw() {
    solved = false; finished = false;
    modal.querySelector('#wonder-clue').textContent = `Clue ${question + 1} of ${data.features.length}: ${data.features[question].clue}`;
    modal.querySelector('#wonder-next').hidden = true;
    buttons.forEach(button => { button.disabled = false; button.classList.remove('found'); });
    modal.querySelector('#wonder-feedback').textContent = 'Tap a node in the picture.';
  }
  buttons.forEach(button => button.addEventListener('click', () => {
    if (solved) return;
    const feature = wonderDiscoveries[button.dataset.find];
    const correct = button.dataset.find === data.features[question].id;
    modal.querySelector('#wonder-feedback').textContent = `${correct ? 'You found it!' : 'Look again.'} ${feature.title}: ${feature.explanation}`;
    if (correct) {
      solved = true; button.classList.add('found'); buttons.forEach(b => { b.disabled = true; });
      const next = modal.querySelector('#wonder-next'); next.hidden = false;
      next.textContent = question === data.features.length - 1 ? 'Finish the challenge' : 'Next clue';
    }
  }));
  modal.querySelector('#wonder-next').addEventListener('click', () => {
    if (finished) { question = 0; draw(); return; }
    if (!solved) return;
    if (++question < data.features.length) draw();
    else {
      modal.querySelector('#wonder-clue').textContent = 'All three discoveries found!';
      modal.querySelector('#wonder-feedback').textContent = 'Keep looking closely. Every landscape has a story.';
      const next = modal.querySelector('#wonder-next'); next.textContent = 'Play again';
      finished = true; solved = false;
    }
  });
  draw();
}
