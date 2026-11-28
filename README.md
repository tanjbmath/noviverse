# NoviVerse

An interactive 3D Solar System & space exploration playground built with Three.js. Orbit the Sun, all eight planets, and Earth’s Moon, zoom into worlds with Novi your mini rocket co-pilot, explore Earth’s continents and wonders, and try hands-on Moon and Sun science activities. No accounts, saved progress, analytics, or backend.

## Current experience

- Sun, all eight planets, Earth’s Moon, asteroid belt, and multi-layered dynamic Three.js particle starfield.
- Procedural planetary textures, tilted rotating globes, Saturn’s rings, solar plasma/glare shaders, and atmospheric rims.
- Mini rocket character Novi with curved Bezier flight paths, inertial banking, tangential planetary orbit capture, and landing explorer transforms on Earth wonders.
- Earth globe navigation (Asia: Merapi, Himalayas, Borneo), lunar crater/rock exploration with gravity & impact labs, and solar observatory discoveries.
- Keyboard-accessible camera/zoom/reset buttons, reduced motion toggle, native dialogs, and responsive desktop and mobile layouts.

## Development and publishing

Node.js 22.12+ is required (checked with 24.22.3).

```sh
npm ci
npm run dev
npm test
npm run assets:verify
npm run build
```

Windows users can use `Start-NoviVerse.cmd`. Serve through HTTP; do not open the HTML directly as a file.

`dist/` contains the complete static build. Building also refreshes the tracked repository-root entry and asset copies for GitHub Pages **main / (root)** and removes stale bundle chunks. Paths are relative and support `/noviverse/`. See [DEPLOYMENT.md](DEPLOYMENT.md).

## Source structure

| File | Purpose |
| --- | --- |
| `src/index.html` | Editable Vite entry and startup recovery |
| `src/main.js` | App orchestration, camera/flight curves, and scene transitions |
| `src/style.css` | Full-screen responsive interface styling |
| `src/scenes/space.js` | Solar System scene, 8 planets, asteroid belt, Moon orbit, and Novi orbital capture |
| `src/scenes/shared.js` | Multi-layer dynamic particle starfield, atmosphere rim, and beacons |
| `src/scenes/moon.js` | Lunar crater terrain, rocks, and discovery targets |
| `src/scenes/sun.js` | Solar observatory scene and discovery nodes |
| `src/scenes/earth.js` | Interactive Earth globe and regional discovery anchors |
| `src/scenes/wonder.js` | Scenic Earth wonder close-ups with walking Novi |
| `src/models/novi.js` | Mini rocket character model, flight physics, and explorer rig |
| `src/models/planets.js` | Procedural planetary textures, Saturn rings, and asteroid belt |
| `src/models/sun.js` | Solar plasma surface and billboard glare shader |
| `src/core/engine.js` | Shared WebGL renderer, visibility-aware loop, picking, and tweens |
| `public/textures/` | Local NASA Earth and Moon maps |
| `public/wonders/` | Scenic Earth wonder illustrations |
| `public/asset-manifest.json` | Origins, licenses, hashes, and byte sizes |
| `tests/` | Automated Node test suite (`space-motion`, `sun`, `earth`, `wonder`, `rig`, `science`) |

See [SCIENCE.md](SCIENCE.md), [ASSET_LICENSES.md](ASSET_LICENSES.md), and [VERIFICATION.md](VERIFICATION.md) for evidence and boundaries.
