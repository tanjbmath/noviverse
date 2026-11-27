// Scientific values and presentation coordinates are deliberately separate.
// Scene units, radii, phases, spins and periods below are illustrative, not an ephemeris.
const body = (id, name, type, radius, orbit, phase, color, diameter, year, fact, explanation) => ({
  id, name, type, parent: 'sun', level: 'solar-system',
  visual: { radius, orbit, phase, color, period: 180 + orbit * 8, spin: id === 'venus' || id === 'uranus' ? -.045 : .075 },
  science: { diameter, year, fact, explanation, source: `https://science.nasa.gov/${id}/facts/` },
});

export const planets = [
  body('mercury', 'Mercury', 'Rocky planet', .65, 9, 2.5, '#b5a49a', '4,879 km', '88 Earth days', 'Being closest to the Sun does not make Mercury the hottest planet. Venus holds that title.', 'Mercury is a small, rocky world covered in impact craters. Its very thin exosphere cannot hold heat the way a thick atmosphere can.'),
  body('venus', 'Venus', 'Rocky planet', 1.05, 14, 4.6, '#efc789', '12,104 km', '225 Earth days', 'Venus takes longer to spin once than it takes to travel around the Sun.', 'Thick clouds hide a rocky surface. A dense carbon dioxide atmosphere traps heat, making Venus the hottest planet in our solar system.'),
  body('earth', 'Earth', 'Rocky planet', 1.18, 20, .7, '#559fd6', '12,756 km', '365.25 days', 'Earth is the only world where we have found life so far.', 'Liquid oceans, a rocky surface and an atmosphere make our home a remarkable place. The Moon is our planet’s natural satellite.'),
  body('mars', 'Mars', 'Rocky planet', .87, 26, 3.4, '#d8815e', '6,792 km', '687 Earth days', 'The rusty red color comes from iron minerals that have oxidized in the soil.', 'Mars is a cold desert world with a thin atmosphere. Ancient riverbeds and minerals show that liquid water once flowed on its surface.'),
  body('jupiter', 'Jupiter', 'Gas giant', 2.85, 34, 5.8, '#cda77d', '142,984 km', '11.86 Earth years', 'The Great Red Spot is a huge, long-lived storm in Jupiter’s atmosphere.', 'Jupiter is the largest planet in our solar system. Its colorful bands are clouds moving through a deep atmosphere, above an interior with no solid surface to stand on.'),
  body('saturn', 'Saturn', 'Gas giant', 2.4, 43, 2.1, '#e0c595', '120,536 km', '29.4 Earth years', 'Saturn’s rings are made mostly of pieces of ice, with some rocky material.', 'Saturn’s spectacular rings are countless separate particles. Gaps divide the rings into bands. The rings here are a simplified illustration.'),
  body('uranus', 'Uranus', 'Ice giant', 1.7, 52, 4.1, '#9cdedc', '51,118 km', '84 Earth years', 'Uranus spins on its side, with its axis tilted by about 98 degrees.', 'Uranus has a hydrogen and helium atmosphere with methane that absorbs red light. Its interior contains water, ammonia and methane under extreme pressure.'),
  body('neptune', 'Neptune', 'Ice giant', 1.65, 61, .1, '#698dcc', '49,528 km', '165 Earth years', 'Neptune was the first planet located through mathematical predictions.', 'Far beyond Earth, Neptune is a cold, windy ice giant. Like Uranus, it has methane in its atmosphere. The blue color here is stylized.'),
];

export const celestialBodies = [
  { id: 'sun', name: 'The Sun', type: 'Our star', parent: null, level: 'solar-system', visual: { radius: 4.6, color: '#ffd18f' }, science: { diameter: '1.4 million km', year: 'Our star', fact: 'Sunlight takes about eight minutes to reach Earth.', explanation: 'The Sun is a star: a glowing sphere of hot plasma. Nuclear fusion in its core supplies the energy that warms our solar system.', source: 'https://science.nasa.gov/sun/facts/' } },
  ...planets,
  { id: 'moon', name: 'The Moon', type: 'Earth’s natural satellite', parent: 'earth', level: 'solar-system', visual: { radius: .36, orbit: 2.8, period: 70, phase: 1.8, color: '#bcbcc2', spin: .025 }, science: { diameter: '3,475 km', year: '27.3 Earth days', fact: 'The same side of the Moon always faces Earth as it orbits.', explanation: 'Our Moon is a rocky world with almost no atmosphere. Impact craters preserve a record of collisions over billions of years.', source: 'https://science.nasa.gov/moon/facts/' } },
];
export const bodyById = Object.fromEntries(celestialBodies.map(value => [value.id, value]));
// Future levels get separate scene factories; never enlarge a single scene to galactic coordinates.
export const explorationLevels = { 'solar-system': { parent: 'interstellar', implemented: true }, interstellar: { parent: 'galactic', implemented: false }, galactic: { parent: null, implemented: false } };
