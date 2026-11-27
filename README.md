# NoviVerse

An initial playable, static Three.js science adventure. Every visit starts in space. Tap a world or point of interest; Novi navigates automatically. No movement controls, accounts, saving, database, Firebase, analytics, or external runtime API.

## Run locally

Requires Node.js 22.12+ (verified here on 24.22.1).

**Windows: double-click `Start-NoviVerse.cmd`.** It opens the game at a local web address. Keep its window open while playing. In the source package, the first launch installs dependencies and builds the game if `dist/` is missing. In the static package, it serves the included game directly without installing project dependencies. Opening `index.html` directly now shows these instructions instead of an empty screen.

For development, you can also use:

```sh
npm ci
npm run dev
```

Open the local address printed by Vite. Use a web server; opening `index.html` directly as a file will not run ES modules correctly.

```sh
npm test
npm run assets:verify
npm run build
npm run preview
```

`dist/` is the complete static site. `npm run build` also refreshes the tracked static copy at the repository root, so GitHub Pages can publish **main / (root)** directly. Relative asset paths support the `/noviverse/` repository subpath. Editable HTML is in `src/index.html`; the root `index.html` is generated. See [DEPLOYMENT.md](DEPLOYMENT.md) for branch-based Pages, the optional manual Actions workflow, and other static hosts. Updating the root copy can trigger an existing branch-based Pages deployment.

## Playable scope

- Rotating NASA-textured Earth, a textured Moon slowly orbiting Earth, stylized Sun, starfield, atmospheric rim lighting, and an original articulated 3D Novi spacecraft with a visible idle hover and gentle sway. The Moon completes an artistic orbit in 150 seconds; its position locks during navigation. Reduce Motion freezes ambient movement.
- Click/tap destinations, cinematic automatic flight, descent, continuous engine-pod and wing transformation into lunar hover mode, automatic approaches and scanning, Back and Home.
- A localized artistic Tycho-region diorama with selectable **Tycho** and **Tycho A**, terraced crater terrain, central peak, scattered instanced debris, representative breccia and anorthosite boulders, and a fictional gravity-lab instrument.
- Each discovery has an explanation, fact, optional deeper text, and primary-source links. No progression gates or collection requirements.
- An ideal gravity experiment with two different masses on both worlds; tap plus/minus to set 1–20 m drop height, then compare timed drops.
- An impact-energy experiment with 5, 10, and 20 km/s choices, calculated kinetic energy, and a deliberately qualitative crater animation.
- Earth and Sun have accessible orbital introductions. Their future surface/solar environments are explicitly labeled as future expansion.
- Responsive 390 px phone and desktop layouts, unlabeled glowing HTML nodes for all raycast targets, with 44 px touch areas, native modal focus management, accessible names, and a Reduce Motion toggle. System reduced-motion preference is respected on initial load. Keyboard activation of buttons works; there are no keyboard movement controls.

## Structure

```text
src/main.js                 Navigation and interruptible journey orchestration
src/index.html              Editable Vite HTML entry and startup recovery message
src/core/engine.js          Renderer, frame loop, raycasting, camera tweening
src/core/assets.js          Local texture loader and procedural microtexture
src/core/dispose.js         Deduplicated GPU-resource disposal
src/core/math.js            Deterministic art helpers and experiment physics
src/models/novi.js          Original multi-part character/craft rig and animation
src/scenes/space.js         Space scene and responsive planet composition
src/scenes/moon.js          On-demand lunar diorama and POIs
src/scenes/shared.js        Starfield, atmosphere and beacons
src/data/discoveries.js     Source-linked science records and POI definitions
src/ui/interface.js         Accessible HUD, panels and dialogs
src/ui/activities.js        On-demand experiment module
public/textures/            Bundled NASA maps (no runtime hotlink dependency)
public/asset-manifest.json  Origin, usage terms, credits, hashes and sizes
tests/                     Physics, content, terrain, transform and disposal checks
index.html, assets/          Generated static entry and bundles for branch-based Pages
textures/                   Generated copies of the credited public textures
scripts/publish-root.mjs     Refreshes the built root copy without deleting source
scripts/verify-site.mjs      Guards against publishing the unbuilt Vite HTML entry
```

The Moon scene is dynamically imported at destination selection; its terrain, rock textures, and meshes are constructed on demand. Experiments are imported only when opened. Earth/Moon overview maps are needed at startup to display those visible worlds. Assets are disposed when changing scenes; repeat visits reconstruct them. The single Three.js renderer is reused.

To add a discovery, create a source-linked data record and add a target mesh and node anchor in its scene. Nodes keep accessible names for screen readers; visible names and facts appear after selection. To add a world, give it the scene contract used by `createSpace`/`createMoon`: `scene`, `kind`, `novi`, `targets`, `labels`, `resize`, and `update`; import it on demand in navigation.

## Scientific and visual boundaries

This is an authored diorama, **not** a geographic simulator or photogrammetry. Catalog coordinates and diameters are real; crater positions, separations, shapes, vertical relief and journey times are compressed/exaggerated for play. The rock models are representative artwork, not identified specimens at real Tycho locations. No exact historical spacecraft or landing site is implied. Novi and the transforming equipment are original fiction. The fictional hovercraft depicts downward thrust, not aerodynamic lift in a lunar atmosphere.

The gravity experiment uses constant surface gravity and no air resistance on **both** worlds: `t = sqrt(2h/g)`, with Earth 9.81 m/s² and Moon 1.62 m/s². The impact activity calculates `E = ½mv²` in SI units. It does not calculate crater diameters, reproduce Tycho's impact, or solve impact hydrodynamics.

The Sun is an illustrative emissive sphere with a corona-like halo; it is not a scientific solar image. Lighting and planet arrangement are artistic, not a physical ephemeris. Earth's rotating texture is a historical July 2004 composite, not live weather. No orbital-accuracy or accurate-scale mode is implemented.

See [SCIENCE.md](SCIENCE.md) and [ASSET_LICENSES.md](ASSET_LICENSES.md) for reviewed sources and rights provenance; [VERIFICATION.md](VERIFICATION.md) for actual checks and remaining limits.

## Performance limits

WebGL2 is required. Pixel ratio is capped at 1.75; debris is instanced; no physics engine, postprocessing stack, web fonts, audio downloads, or backend is needed. Current imagery totals about 1.76 MB. Three.js is a separate ~541 KB minified / ~141 KB gzip chunk, which triggers Vite's default 500 KB advisory. Scene and experiment code are split independently. Further model batching, compressed texture formats, lower GPU tiers, and physical-device profiling would be worthwhile before a broad mobile release.

Errors loading scenes and WebGL context loss show a reload/recovery dialog. Full offline use after an ordinary browser reload is not guaranteed: there is no service worker or installed PWA. A static host or local server is needed. No state persists between visits.
