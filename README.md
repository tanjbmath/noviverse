# NoviVerse

An astronomy exploration playground built with Three.js. Drag or swipe around the solar system, scroll or pinch to zoom, and click a world to fly there with Novi, an original 3D rocket co-pilot. All destinations are open from the start. No accounts, saved progress, Firebase, analytics or backend.

## Current experience

- Sun, all eight planets and Earth’s Moon in one continuous 3D scene.
- Credited local planet textures, tilted rotating globes, illustrative orbits, Saturn’s rings, an instanced asteroid belt, solar plasma/glare and atmospheric rims.
- Sculpted rocket Novi with a friendly porthole face, swept fins, metallic bands and fasteners, vents, layered exhaust and idle hover.
- Automatic interruptible rocket/camera journeys. Overview remains available during flight. Dragging and multi-touch gestures do not select worlds.
- Three unlabeled discovery nodes per destination, 30 source-linked science notes, rounded physical properties and ten replayable misconception questions.
- Scrollable destination dock, keyboard-accessible camera/zoom/reset buttons, reduced motion, native dialogs and a reading/question fallback when WebGL cannot start.
- Responsive portrait and landscape layouts. Camera projection checks cover six viewport sizes; real-device rendering and performance still require validation.

This implements the astronomy-only change of direction. The continent/landscape journey has been removed from the current entry. Its source, artwork and tests are retained for possible reuse; it is documented historically in [docs/legacy-exploration.md](docs/legacy-exploration.md). The current scope is our solar system. Other stars, galaxies, black holes and additional hands-on experiments are future work.

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

`dist/` contains the complete static build. Building also refreshes the tracked repository-root entry and asset copies for GitHub Pages **main / (root)**. Paths are relative and support `/noviverse/`. See [DEPLOYMENT.md](DEPLOYMENT.md). Publish the built entry and matching bundles/textures together.

## Current source

| File | Purpose |
| --- | --- |
| `src/index.html` | Editable Vite entry and startup recovery |
| `src/astronomy.js` | Current app orchestration and cancellable travel |
| `src/astronomy.css` | Full-screen astronomy interface |
| `src/scenes/solar-system.js` | Continuous system, planets, rings, belt and camera gestures |
| `src/models/rocket.js` | Detailed original rocket model and animation |
| `src/data/astronomy.js` | Planet properties, discoveries, questions and primary-source links |
| `src/ui/astronomy-interface.js` | Dock, panels, nodes, modal questions and fallback |
| `src/core/engine.js` | Shared renderer, visibility-aware loop, picking and tweens |
| `public/textures/` | Local NASA and CC BY planet maps |
| `public/asset-manifest.json` | Origins, licenses, modifications, hashes and byte sizes |
| `tests/astronomy.test.js` | Current astronomy, camera, gesture, model and cancellation checks |
| `src/main.js` | Retained legacy exploration controller; not the current entry |

## Scientific and performance boundaries

Sizes, distances, speeds, phases and lighting are arranged for exploration. Planet orbits are circles with compressed spacing and artistic speeds, not computed ephemerides. Tilt values are illustrative and not a fully aligned celestial reference frame. Planet diameter values are rounded equatorial measurements; AU is Earth’s mean distance from the Sun. Giant-planet textures show clouds, not a landable surface. Solar activity is original shader artwork. Colors are enhanced; some texture gaps are reconstructed. The Moon is an enlarged, accelerated illustration. Novi’s travel and viewing positions are fictional.

There is no accurate-scale mode, live position data, gravity simulation, progression system or save service. Keyboard controls move the camera through buttons; the rocket navigates automatically.

The renderer caps pixel ratio at 1.75 and stops scene updates while the document is hidden. The asteroid belt uses one instanced draw. There is no postprocessing stack or external font request. All nine runtime maps load once at startup (about 1.15 MB); seven newly added planet maps total about 0.78 MB. A 2048 × 1024 Earth derivative reduces startup transfer and GPU texture memory; the original remains for legacy scenes. Retained landscape images are not requested by the astronomy entry. The shared Three.js bundle triggers Vite’s existing 500 KB size advisory. This is a build advisory; low-end mobile GPU performance remains unmeasured.

See [SCIENCE.md](SCIENCE.md), [ASSET_LICENSES.md](ASSET_LICENSES.md) and [VERIFICATION.md](VERIFICATION.md) for evidence and limits.
