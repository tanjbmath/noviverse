// Rounded educational values. Equatorial diameters; AU is mean distance from the Sun.
// Display geometry, orbital phases and animation speeds are deliberately illustrative.
export const planets = [
  { id: 'mercury', name: 'Mercury', type: 'Rocky planet', radius: .85, orbit: 11, phase: .4, tilt: .03, spin: .035, diameter: 4879, au: .39, year: '88 Earth days', color: '#b9aaa0', texture: 'mercury.jpg', tagline: 'Small world. Extreme days.', facts: [
    ['A world of craters', 'Mercury’s rocky surface is covered in impact craters. With almost no atmosphere, incoming space rocks have little to slow them down.'],
    ['Hot days, freezing nights', 'Sunlit ground can reach about 430°C, while nights can fall to about −180°C. Its thin exosphere cannot trap much heat.'],
    ['The fastest year', 'Mercury races around the Sun in 88 Earth days. One sunrise-to-sunrise cycle there lasts about 176 Earth days.']], question: ['Is Mercury the hottest planet?', ['Yes, it is closest to the Sun', 'No, Venus traps more heat'], 1, 'Distance is only part of the story. Venus’s thick atmosphere traps enough heat to make it hotter.'] },
  { id: 'venus', name: 'Venus', type: 'Rocky planet', radius: 1.4, orbit: 17, phase: 2, tilt: 177.4, spin: .015, diameter: 12104, au: .72, year: '225 Earth days', color: '#ead39b', texture: 'venus_atmosphere.jpg', tagline: 'A beautiful, blazing greenhouse.', facts: [
    ['Hidden under clouds', 'The view shows Venus’s clouds, not its rocky ground. Thick clouds containing sulfuric acid hide the surface.'],
    ['The hottest planet', 'A thick carbon-dioxide atmosphere traps heat in a powerful greenhouse effect. The surface averages about 465°C.'],
    ['A very slow spin', 'Venus takes about 243 Earth days to spin once, longer than its 225-day year. Its rotation runs opposite to most planets.']], question: ['What makes Venus so hot?', ['Its thick atmosphere traps heat', 'It is the closest planet to the Sun'], 0, 'Venus is second from the Sun. Its strong greenhouse effect is what makes it the hottest planet.'] },
  { id: 'earth', name: 'Earth', type: 'Rocky planet', radius: 1.5, orbit: 23, phase: 3.3, tilt: 23.4, spin: .1, diameter: 12756, au: 1, year: '365.25 Earth days', color: '#63c8ed', texture: 'earth-orbit.jpg', tagline: 'Our one extraordinary home.', facts: [
    ['A world of liquid water', 'Oceans cover about 71% of Earth’s surface. Liquid water is one reason our planet can support the life we know.'],
    ['Why seasons change', 'Earth’s axis is tilted about 23.4°. As Earth orbits, each hemisphere takes a turn leaning toward the Sun. Seasons are not caused by changing distance.'],
    ['Our natural companion', 'The Moon orbits Earth. Its gravity helps raise ocean tides, and we always see roughly the same lunar face.']], question: ['What causes Earth’s seasons?', ['Earth’s tilted axis', 'Earth being much closer to the Sun in summer'], 0, 'The tilted axis changes the angle and duration of sunlight. The two hemispheres have opposite seasons.'] },
  { id: 'mars', name: 'Mars', type: 'Rocky planet', radius: 1.1, orbit: 29, phase: 4.5, tilt: 25.2, spin: .095, diameter: 6792, au: 1.52, year: '687 Earth days', color: '#e18e6b', texture: 'mars.jpg', tagline: 'A red world with a watery past.', facts: [
    ['Rust gives Mars its color', 'Iron minerals in the dust oxidize, or rust. This fine dust makes the planet look reddish.'],
    ['A giant volcano', 'Olympus Mons is the largest volcano in our solar system. Its broad slopes rise far above the surrounding plains.'],
    ['Clues to ancient water', 'Dry channels, minerals and rover observations show that liquid water once flowed on the surface. Today Mars is cold with a thin atmosphere.']], question: ['Why does Mars look red?', ['Its ground is glowing hot', 'Iron minerals in its dust have rusted'], 1, 'Mars is a cold world. Rust-colored iron minerals give it the familiar red appearance.'] },
  { id: 'jupiter', name: 'Jupiter', type: 'Gas giant', radius: 4.7, orbit: 40, phase: .9, tilt: 3.1, spin: .23, diameter: 142984, au: 5.2, year: '11.86 Earth years', color: '#dfb693', texture: 'jupiter.jpg', tagline: 'The giant with a stormy heart.', facts: [
    ['The Great Red Spot', 'This enormous storm has been observed for centuries. Its size and shape change over time.'],
    ['No ground to stand on', 'The visible bands are clouds. Jupiter is mostly hydrogen and helium; pressure grows enormously as you go deeper.'],
    ['A surprisingly short day', 'Jupiter spins once in about 10 hours. It has the shortest day of any planet in our solar system.']], question: ['Could Novi land on Jupiter’s cloud tops?', ['Yes, the clouds form a solid shell', 'No, there is no solid cloud surface'], 1, 'Clouds are not solid ground. Novi observes from a fictional safe viewing point.'] },
  { id: 'saturn', name: 'Saturn', type: 'Gas giant', radius: 4, orbit: 51, phase: 3.8, tilt: 26.7, spin: .21, diameter: 120536, au: 9.58, year: '29.4 Earth years', color: '#e9d8ac', texture: 'saturn.jpg', tagline: 'A thousand rings. Endless wonder.', facts: [
    ['Rings made of pieces', 'Saturn’s rings are countless pieces of ice and rock, from tiny grains to large chunks. They are not a single solid disc.'],
    ['A light giant', 'Saturn’s average density is lower than water’s. This compares densities; there is no real bathtub large enough for a planet.'],
    ['A long trip around the Sun', 'Saturn takes about 29.4 Earth years to complete an orbit, while its day lasts only about 10.7 hours.']], question: ['What are Saturn’s rings made of?', ['Many separate pieces of ice and rock', 'One solid metal disc'], 0, 'Countless individual particles orbit Saturn together, creating the beautiful rings we see.'] },
  { id: 'uranus', name: 'Uranus', type: 'Ice giant', radius: 2.6, orbit: 61, phase: 5.4, tilt: 97.8, spin: .14, diameter: 51118, au: 19.2, year: '84 Earth years', color: '#a9e2df', texture: 'uranus.jpg', tagline: 'The planet that rolls on its side.', facts: [
    ['An extraordinary tilt', 'Uranus’s axis is tilted about 98°. It orbits the Sun almost on its side, producing extreme seasons.'],
    ['Blue-green skies', 'Methane in the atmosphere absorbs red light. The reflected light helps give Uranus its blue-green appearance.'],
    ['What “ice giant” means', 'Deep inside are dense, hot fluids rich in water, ammonia and methane. It is not a giant solid ice ball.']], question: ['What is unusual about Uranus?', ['It has no atmosphere', 'Its axis is tilted almost sideways'], 1, 'Its roughly 98° tilt makes Uranus very different from the more upright planets.'] },
  { id: 'neptune', name: 'Neptune', type: 'Ice giant', radius: 2.5, orbit: 71, phase: 2.7, tilt: 28.3, spin: .15, diameter: 49528, au: 30.1, year: '165 Earth years', color: '#739ce5', texture: 'neptune.jpg', tagline: 'At the edge of the planetary family.', facts: [
    ['A distant blue world', 'Neptune is about 30 times farther from the Sun than Earth. Sunlight takes about four hours to get there. Its color here is enhanced.'],
    ['Powerful winds', 'Winds in Neptune’s atmosphere can exceed 2,000 kilometres per hour. Dark storms can form and fade.'],
    ['A very long year', 'Neptune needs about 165 Earth years to orbit the Sun. Its first full orbit since its 1846 discovery ended in 2011.']], question: ['If you lived on Neptune, a year would be…', ['Much longer than a year on Earth', 'Just a few Earth days'], 0, 'Neptune’s huge orbit takes about 165 Earth years to complete.'] },
];
export const sun = { id: 'sun', name: 'Sun', type: 'Our star', radius: 5.5, color: '#ffbd71', diameter: 1392700, year: 'The center of our solar system', tagline: 'The star that makes our days.', facts: [
  ['Powered by fusion', 'Deep in its core, hydrogen nuclei fuse to make helium. This releases the energy that eventually reaches us as sunlight.'],
  ['Light on a journey', 'Sunlight takes about 8 minutes 20 seconds to reach Earth. Looking at the Sun without proper protection can damage your eyes.'],
  ['A star of plasma', 'The Sun is made of extremely hot, electrically charged gas called plasma. It has no solid surface.']], question: ['What powers the Sun?', ['Burning wood or coal', 'Nuclear fusion in its core'], 1, 'Hydrogen fuses into helium in the Sun’s core, releasing energy. It is not an ordinary fire.'] };
export const moon = { id: 'moon', name: 'Moon', type: 'Earth’s natural satellite', radius: .55, color: '#c8cbd2', texture: 'moon.jpg', diameter: 3475, year: '27.3 Earth days around Earth', tagline: 'Our closest cosmic companion.', facts: [
  ['An ancient crater record', 'Impacts made the Moon’s craters. With little weathering and almost no atmosphere, many remain visible for billions of years.'],
  ['A familiar face', 'The Moon rotates once for every orbit around Earth. That is why we see roughly the same side. The far side also receives sunlight.'],
  ['Changing phases', 'Half the Moon is lit by the Sun. From Earth we see different portions of that sunlit half as the Moon moves around us.']], question: ['What usually causes the Moon’s phases?', ['Earth’s shadow covering the Moon each month', 'Our changing view of the Moon’s sunlit half'], 1, 'Earth’s shadow causes a lunar eclipse. Ordinary phases come from the changing Sun–Earth–Moon geometry.'] };
export const bodies = [sun, ...planets, moon];
export const bodyById = Object.fromEntries(bodies.map(body => [body.id, { ...body, source: `https://science.nasa.gov/${body.id}/facts/` }]));
export function orbitPosition(body, elapsed = 0) {
  const angle = body.phase + elapsed * .022 / Math.sqrt(body.orbit / 11);
  return [Math.cos(angle) * body.orbit, 0, Math.sin(angle) * body.orbit];
}
