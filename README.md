# Noviverse — Explore beyond Earth

A static Three.js astronomy playground. Meet Novi, a living retro rocket, and explore the Sun, all eight planets and our Moon. No accounts, Firebase, database, analytics or runtime API.

## Run

Requires Node.js 22.12 or later. Double-click `Start-NoviVerse.cmd`, or run:

```sh
npm ci
npm run dev
```

Use the printed local web address. Opening HTML as a file cannot run the modules. For a production build:

```sh
npm test
npm run assets:verify
npm run build
npm run preview
```

`dist/` is the complete static site. The build also refreshes the generated root HTML and bundles for the existing GitHub Pages setup. Relative paths support `/noviverse/`. No hosting or backend migration is required. See [DEPLOYMENT.md](DEPLOYMENT.md).

## Phase 1 experience

- Full-screen solar system with rotating planets, illustrative circular orbits, an asteroid belt, animated stars, atmospheres, Saturn’s rings and the existing procedural Sun/glare.
- Drag/swipe to orbit the camera; wheel/pinch to zoom. Tap an unlabelled discovery node or a planet to watch Novi fly there. The Explore menu provides direct keyboard-accessible travel to every world. Zoom buttons and Overview remain available; no movement keys, progression gates or locked destinations.
- Close-ups isolate the selected world so surrounding planets do not obscure it. Orbits pause while studying; axial rotation continues. Return to Overview to resume orbital motion. Facts and approximate real measurements appear after selection, with NASA source links.
- Novi is an actual Three.js model: rounded ivory fuselage, coral swept fins, turquoise trim, expressive blue cockpit, blinking eyes, luminous engines, particle exhaust, idle hover, travel ignition and scanning light. Novi remains a spacecraft; old walking/hovercraft transformations are retired.
- Reused NASA Earth and Moon textures, Sun observatory with photosphere/sunspot/prominence/corona discoveries, and the Tycho-region lunar field station with gravity and impact activities. These are optional visits from the Sun/Moon discovery cards.
- Desktop and mobile layouts, 44px discovery targets with overlap avoidance, accessible node names, native dialogs, focus on newly revealed facts, reduced-motion preference and manual toggle. Home interrupts a flight safely.

The approved reference screenshot and the earlier **Revamp Three.js Universe Experience** proposal guided the rocket colors, rounded shape and discovery-driven space composition. Real celestial objects replace the screenshot’s fictional subject planets.

## Architecture

| Location | Responsibility |
| --- | --- |
| `src/data/universe.js` | Body registry, parent relationships, science facts/sources, separate illustrative sizes/orbits, future exploration-level metadata |
| `src/models/planet.js` | Reusable procedural planets, axial tilt, rings and atmospheric rims |
| `src/models/novi.js` | Living rocket geometry, local hover/expression/thruster/exhaust animation |
| `src/models/sun.js` | Reused Sun surface and additive glare, shared with the observatory |
| `src/scenes/space.js` | Solar system assembly, orbital motion, close-up framing, interruptible travel and reset |
| `src/core/orbit-controls.js` | Damped spherical camera; reuses tested pointer/pinch capture from globe controls |
| `src/core/node-layout.js` | Screen-space separation of discovery touch targets |
| `src/main.js` | Navigation, lazy loading, cancellation, scene replacement and optional science activities |
| `src/core/engine.js` | One renderer, raycasting, frame/tween loop, responsive pixel cap |
| `src/ui/interface.js` | Minimal HUD, discovery cards, destination menu and source links |

To extend the solar system, add a sourced body record and compatible model. The current scene factory contract is `kind`, `level`, `scene`, `novi`, `targets`, `labels`, `activate/deactivate`, `resize`, `update` and optional focus/reset methods. Targets carry `userData.poi`; labels use world anchors with accessible names. Navigation imports scene factories on demand and disposes the old scene. Future interstellar/galactic levels should use separate coordinate spaces and scene factories, not astronomical coordinates in this solar scene. The level registry records that intention; those levels are not implemented.

Existing Earth globe, continent data, scenic wonders and challenges remain in source and retain regression tests, but they are not linked into the Phase 1 route. Continent exploration is deferred. Earth is currently an orbital planet close-up. The old geography compatibility hooks keep Novi a rocket.

## Science and visual boundaries

**Not to scale.** Planet sizes, separations and travel times are compressed. Circular orbits, phases and spin rates are authored for exploration, not calculated ephemerides. Lighting is artistic. The Sun shader, atmospheric bands, rings, asteroid distribution and exhaust are illustrative. No accurate-scale or live-data mode is provided.

Earth uses NASA’s historical July 2004 composite, not live weather. Moon imagery is NASA’s CGI map. Other planets are procedural interpretations, not NASA photographs. Planetary diameters follow the NASA metric fact sheet (generally equatorial diameters); orbital periods are rounded. Sources are linked in each card. See [SCIENCE.md](SCIENCE.md) and [ASSET_LICENSES.md](ASSET_LICENSES.md).

The retained Moon diorama is not surveyed terrain; rocks are representative samples. The gravity experiment uses constant gravity with no air resistance on both worlds; impact energy is calculated without solving crater formation. Novi, its equipment and viewing positions are fictional.

## Performance and verification limits

WebGL2 required. Pixel ratio is capped at 1.35 below 760px and 1.75 otherwise, including viewport changes. Mobile has fewer stars and belt particles. Exhaust uses one fixed-size point buffer; orbital lines share material. No bloom/postprocessing, physics engine, extra planet images or per-frame texture generation. Earth/Moon images total about 1.76 MB. Optional detailed Sun/Moon scenes and activities load on demand; old continent artwork is not requested on the active route.

Three.js remains a separate roughly 545 KB minified / 143 KB gzip bundle and produces Vite’s size advisory. Physical phones, GPU memory across extended sessions, touch hardware, thermal behavior and frame rates have not been profiled. Pinch/gesture logic is covered by automated event tests; browser checks are responsive emulation, not physical-device certification. There is no service worker or guaranteed offline reload.

See [docs/phase-1-verification.md](docs/phase-1-verification.md) for the actual repository, baseline, checks and limitations. `VERIFICATION.md` retains the earlier project history.
