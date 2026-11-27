# Phase 1 verification — 27 November 2026

## Repository and scope

- Repository: https://github.com/tanjbmath/noviverse.git
- Checkout: `C:\Users\admij\Documents\ChatGPT\Noviverse`
- The supplied workspace was empty. The existing repository was cloned into it.
- Starting branch: `main`, clean, baseline `0887427` (Add Earth wonder close-ups and walking Novi).
- Implementation branch: `codex/noviverse-phase-1`.
- No repository or applicable ancestor `AGENTS.md` files were found. README, deployment/science/assets documentation, dependency manifests, renderer, original spacecraft, Earth/Moon/Sun scenes, controls and existing tests were inspected.
- Dependencies unchanged: Three.js 0.181.2 and Vite 7.3.8; Node 24.22.1 used. Locked installation completed.
- Prior approved conversation was read through the chat tool; its actual attached reference screenshot was viewed. The cream/orange/turquoise rocket and exploratory planet scene guided this implementation.
- Local implementation only. No push, merge, GitHub Pages deployment or Sites registration performed.

## Automated checks

- `npm test`: 23 tests, including solar body registry/orbit motion, reduced motion, focus/reset/abort, direct body raycasting, mobile/desktop framing, orbit/zoom/pinch and tap-vs-drag handling, separated touch targets, rocket hover/exhaust, GPU disposal, and retained Sun/Moon/science/geography regression tests.
- `npm run assets:verify`: credited public images match recorded hashes and sizes.
- `npm run build`: production bundle plus generated repository-root static site; built entry, relative assets, texture presence and `/noviverse/` subpath verified by the repository script.
- Vite’s Three.js chunk-size advisory remains; it is not a build error.

## Browser observations

Local Chromium-based in-app browser, default 1280×720 and emulated 390×844, 360×640 and 844×390 viewports:

- Overview rendered all eight planets, Sun, Moon, asteroid belt, orbit paths, atmosphere/rings, unlabelled nodes and the actual 3D rocket.
- Direct node flight to Saturn, full animated flight to the Sun, and the destination menu were exercised. All eight planet cards were reached through the menu with reduced motion enabled.
- Drag orbit and scroll zoom changed the view while reduced motion remained enabled; manual navigation stayed available. No accidental destination selection occurred after the tested drag.
- Home interrupted an animated flight and restored the overview with live destination buttons.
- Sun observatory loaded; Sunspots discovery opened. Moon field station loaded; Gravity lab discovery and its drop activity opened, and Drop both pairs entered the falling state. Existing scientific calculation tests cover the timing; the full visual landing animation was not timed in this browser pass.
- Close-up framing was visually checked on portrait and landscape layouts. A clipped rocket and crowding from neighboring worlds were found and corrected. Selected-body views now isolate the world, and the phone rocket stays visible. Discovery cards scroll independently; canvas gestures do not replace panel scrolling.
- No browser console warnings/errors were captured in the tested flows.
- The final production output was served separately with `npm run preview`. Overview and an animated Jupiter flight/card rendered successfully. This check found a desktop rocket framing issue; screen-aware companion placement fixed it, and the final production build was visually rechecked at 1280×720 and 360×640 with no captured console warnings/errors. Tests also project Novi’s arrival position for every body at all supported test sizes. Local QA servers were stopped after verification.

## Limits

- This is an illustrative solar system: sizes, distances, orbit/spin periods, phases, lighting and travel times are not physical or live. The persistent note and discovery details state this. Orbit motion pauses during close-ups.
- Facts/diameters/rounded orbital periods were checked against NASA planet fact pages and the NASA metric planetary fact sheet on 27 November 2026. All new cards link those sources.
- New planet patterns are procedural illustrations; Earth/Moon maps and Sun effects are reused. No new downloaded bitmap assets.
- No continent visits in the active route. Existing geographic source/assets/tests remain for later work. New Novi does not transform into a person or hovercraft.
- Interstellar/galactic levels have extensible metadata and a documented separate-scene contract; their scenes are deferred. There are no black holes, warp travel, planet interiors or new planet experiments in this phase.
- No physical mobile, touch hardware, screen-reader audit, GPU memory stress test or measured FPS/thermal benchmarks. Pointer/pinch cancellation and cleanup are tested with simulated events.
- WebGL context-loss messaging exists but a forced GPU-loss recovery was not tested. Texture failure cleanup is implemented; no intentional network-failure browser test was run.
- Static output is ready locally. Publication and remote CI were not performed.
