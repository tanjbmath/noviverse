# Astronomy revamp verification · 28 November 2026

The remote repository was inspected before implementation. No astronomy-only revamp branch, commit or PR existed; `main` was at `088742777a995c58eae2602ddae6487e5785130f` (Earth wonder close-ups). This change supplies the missing approved astronomy direction.

## Verified

- 26 Node tests pass, including the original 20 regression tests. New checks cover the ten-body catalog and 30 discoveries, circular orbit radii, scene construction without camera mutation, orbit locking during focus/travel, rotation, texture disposal, rocket transforms and reduced motion, pointer tap/drag/multi-touch/cancellation separation, and aborting a camera trip before Home navigation.
- Projection checks cover 1280 × 800, 1920 × 1080, 390 × 844, 360 × 640, 760 × 844 and 844 × 390. Focused discovery nodes fit the viewport, clear the information panel, and retain at least 44 px separation at the starting view. This is geometry validation, not rendered screenshot validation.
- All bundled texture/artwork hashes and byte sizes match the asset manifest. New images are valid JPEGs. The production build and repository-root/dist/subpath entry checks pass; the published manifest matches the source manifest.
- In the managed browser, all ten destination panels, each first discovery, source link, motion-toggle state and Overview navigation were exercised. Saturn’s quick question was exercised through wrong answer, retry, correct feedback and disabled completed answers. These browser checks ran in the app’s reading/question fallback.

## Limits

The managed browser reports `GL_VENDOR = Disabled` and cannot create a WebGL context. Therefore actual 3D rendering, shader appearance, rocket visual quality, GPU performance, real touch/pinch behavior and device-rotation layouts remain unverified. Scene/model tests run Three.js geometry without a GPU; they do not replace a rendered browser test. The original Three.js >500 KB bundle advisory remains. No physical phone was available.

The current experience covers the Sun, eight planets and Earth’s Moon. Other stars, galaxies, black holes, live ephemerides and further hands-on experiments are not implemented. The legacy continent scenes remain in source but are outside the new entry.

---

## Historical verification for the previous exploration entry

# Verification record

Verified locally on 27 November 2026 in the Windows workspace. This is a **new independent project directory**, not a modification of an existing educational repository. The user subsequently designated the empty `tanjbmath/noviverse` GitHub repository for source upload and enabled branch-based Pages publishing. A repair adds a prebuilt root copy for that publishing method. Temporary local preview servers are used for testing.

## Automated checks

| Check | Actual result |
| --- | --- |
| `npm run build` | PASS. Vite 7.3.8 production build, 20 modules transformed; separate space, Moon, experiment and shared chunks. |
| `npm test` | PASS, 7 tests. Free-fall timing/height scaling, impact-energy units and velocity-squared dependence, source/POI coverage, terrain properties, deterministic generation, articulated transform matrices, deduplicated GPU disposal. |
| `npm run assets:verify` | PASS. Both bundled JPEG sizes and SHA-256 hashes match the asset manifest. Header dimensions also inspected: Earth 5400 × 2700, Moon 1024 × 512. |
| `npm audit --json` | PASS, 0 reported vulnerabilities for the installed lockfile. The initially selected Vite version had advisories and was replaced with 7.3.8 before final verification. |

The only final build advisory is the ~541 KB minified Three.js chunk exceeding Vite's default 500 KB threshold. Its gzip size is ~141 KB. This is documented rather than suppressed. The final runtime has no uncaught errors observed in its completed gameplay checks.

## Browser checks performed

Tested the production `dist/` through Vite preview in the local in-app Chromium browser, with a desktop viewport (1280 × 720) and a phone-sized viewport override (390 × 844).

- Space starts with rotating textured Earth, Moon, visible Sun and original Novi spacecraft.
- Moon button initiates automatic flight; lunar scene loads, engine pods pivot and wings fold during descent; no movement input required.
- Both named crater discoveries open; actual crater geometry selection was tested by clicking inside Tycho, separately from an HTML label.
- Direct 3D breccia boulder picking opens its science panel; both representative rock descriptions are accessible. Equivalent labeled buttons also work.
- Tycho impact experiment at 10 km/s displays 50 GJ and the correct 4× comparison with 5 km/s.
- Gravity lab at 5 m displays Earth 1.01 s and Moon 2.48 s; both pairs complete and the activity reports simultaneous landing within each world.
- A second gravity run through the anorthosite discovery at 6 m displays Earth 1.11 s and Moon 2.72 s and completes correctly.
- Back returns to the lunar overview; Home returns to space. Returning Home during outbound Moon travel interrupts the trip cleanly, and a subsequent Moon trip succeeds.
- Repeat Moon visits and the Reduce Motion toggle were exercised. Reduced mode freezes ambient animation and shortens cinematic travel.
- Earth and Sun introductory panels open and clearly label future expansion.
- Phone composition was inspected and revised so Earth, Moon, Sun and Novi all fit. Discovery framing was revised to keep the object and Novi above the scrollable information panel. Modal activities and tap buttons were exercised at phone width.
- A fresh page reload returns to space; no progression or storage exists.

During development, a harmless geometry-conversion warning was removed. A preview reload while rebuilding briefly attempted to fetch an old deleted chunk; reloading after the completed build restored the correct asset graph. No stale-chunk error occurred in the final stable-build tests.

## Remaining limits

- Phone testing used a Chromium viewport override, not a physical touch device. Safari, Firefox, iOS, Android hardware, low-memory GPUs, thermal performance and assistive technologies have not been separately tested.
- Keyboard activation, accessible labels, source links and native dialogs are implemented; this is not a formal accessibility audit. Native browser Back does not encode scenes in URL history; use the in-game Back/Home controls.
- The terrain and rocks are original artistic meshes, not LRO elevation reconstructions or photographed/identified samples. Catalog measurements are real and source-linked. No accurate scale mode, orbital simulator or impact hydrodynamics is implemented.
- Earth and Sun are introductory experiences. Walking, drilling, ocean exploration, full solar activity and additional planets remain future work.
- Novi is a detailed multi-part code-authored rig, not an imported GLB. Geometry/materials/animations are editable in `src/models/novi.js`; no standalone DCC model or skeletal animation file is included.
- The Moon map's official NASA endpoint was blocked; a credited research mirror supplied the named NASA texture. Its bytes could not be compared with the blocked original. This provenance limitation is explicit in the asset manifest and licensing notes.
- WebGL2 and an HTTP server are required. No service worker, installable app, persistence, analytics or offline-cache guarantee is included.
- The optional custom Pages workflow requires the owner to run it manually. The existing branch-based Pages deployment publishes the tracked root copy when it changes.

## GitHub Pages blank-screen repair

The live URL was serving the unbuilt root HTML with `/src/main.js`, and its deployment run used Jekyll rather than Vite. The repair moves the editable entry to `src/index.html`, serves it through Vite for development, and publishes built HTML/bundles/textures at the repository root. A `.nojekyll` marker keeps that root copy static. The build now verifies the generated entry, linked assets, imagery and `/noviverse/` subpath for both root and `dist/`. A visible startup status and import-failure message replace a blank screen if loading fails.

## Local launch repair

Directly opening `index.html` is incompatible with ES modules and Vite source. Both source and static packages now include `Start-NoviVerse.cmd`; a dependency-free Node.js loopback server serves the production files with correct content types. The source launcher installs/builds if the production folder is absent. Direct file opening shows a visible explanation rather than a blank screen. The launcher's server was tested in the browser through a Moon visit with no console errors; automatic opening of the user's default external browser was not tested (the QA run used `--no-open`).

## Deliverables

- `noviverse/`: source project, lockfile, local imagery, documentation, tests and generated `dist/`.
- `NoviVerse-source.zip`: editable source/assets/tests/docs, excluding `node_modules`, generated `dist` and Git metadata. Run `npm ci` before development.
- `NoviVerse-static.zip`: contents of the final production `dist/`, ready for a static host. Serve over HTTP rather than opening its index file directly.
- `noviverse-preview.jpg`: final desktop screenshot.

## Unlabeled exploration nodes — 27 November 2026

Replaced floating name cards with glowing nodes and removed the named destination/POI lists and Moon shortcut. Names and science remain in the discovery panels. Nodes retain accessible names, keyboard button semantics and 44 px hit areas. Lunar nodes align with the existing beacon dots. The lunar overview camera now accounts for narrow viewports so the outer rock and gravity nodes remain reachable; returning to overview uses the same camera calculation.

- `npm test`: all 7 existing tests passed. Asset hashes and production root/dist checks passed.
- Temporary Happy DOM and Three.js projection checks passed at 1280 × 720, 390 × 844 and 390 × 650: all 3 space and 5 lunar nodes are inside the visible projection bounds; buttons contain no visible text, retain accessible names and dispatch the expected click actions; travel disables/hides nodes; discovery panels reveal the selected name; closing them restores the nodes.
- These are DOM and camera-projection checks, not rendered browser tests. Browser validation was unavailable: the local Chromium launcher lacks its binary, its official Playwright download returned HTTP 403, and the separate preview browser could not connect to the local server. Visual layering, actual touch/keyboard interaction and physical-device rendering remain unverified for this update.

## Home-screen idle animation — 27 November 2026

Increased Novi’s local hull hover to a visible rise/fall with gentle drift and pitch, easing back to the smaller existing motion during travel without changing navigation coordinates. Earth rotates at 0.055 radians/second. The Moon completes an inclined artistic orbit around Earth in 150 seconds; beginning navigation freezes its destination, and returning home resumes it. Orbit distance and camera framing adapt to viewport shape, and the phone Sun moves into the upper-right space clear of the orbit. Reduced motion still freezes ambient motion, and the existing engine skips rendering when the page is hidden. No assets, dependencies or network requests were added.

`npm test` passed all 10 tests. New checks cover a complete orbit at five desktop/phone viewport sizes, constant orbital clearance and reachable Moon nodes, reduced motion, frozen navigation targets, smooth resume, frame-rate independence, visible hover and preservation of Novi’s root position. Asset integrity and the production root/dist build checks passed. These are model/projection tests; rendered browser and physical-device appearance remain unverified in this environment.

## Solar observatory and glare — 27 November 2026

The Sun now uses a shared, authored plasma shader and additive billboard glare/rays in space and in a new on-demand solar scene. The observatory has four unnamed, accessible nodes for the photosphere, sunspots, a prominence and the corona. A replayable three-question activity gives immediate explanations. Facts were checked against NASA’s Sun facts page, which each discovery links to. Novi remains in spacecraft mode and can return Home or to the solar overview. Ambient solar animation uses the engine clock, respecting Reduce Motion and hidden-page suspension. No dependencies, image downloads, accounts or backend calls were added.

- `npm test`: 13 tests passed, including seven desktop/phone/landscape sizes for solar overview and discovery framing; direct surface/spot/prominence/corona raycasts; halo exclusion from picking; time handling; craft coordinates; solar GPU-resource disposal. Existing Moon orbit, hover, physics and rig checks still pass.
- A temporary Happy DOM integration check ran the real main navigation, UI, scenes and quiz with a simulated renderer, local placeholder textures and accelerated tweens. Sun flight, all four accessible unnamed nodes, discovery panels, correct/wrong quiz answers, completion/retry/close, overview, Reduce Motion, Home during outbound travel, repeat Sun visits and Moon/Tycho regression passed. This is a DOM/navigation check, not rendered gameplay.
- Asset integrity checks passed. The final production build and root/dist repository-subpath checks passed. The pre-existing Three.js chunk-size advisory remains.
- The managed preview opened in Chromium, but the browser reports `GL_RENDERER = Disabled` and cannot create a WebGL context. One reload confirmed the same failure. Shader execution, rendered glare quality, animation smoothness, visual layering and physical-device behavior remain unverified. No browser/GPU rendering success is claimed for this update.

The earlier “Earth and Sun are introductory experiences” limitation above applies to the original release. Earth remains introductory; Sun now has the solar observatory described here. The solar scene is an authored illustration, not real solar imagery or a safe real spacecraft mission design.


## Earth globe and first continent — 27 November 2026

Implemented a separate, on-demand Earth globe using the existing credited NASA texture. All seven continents can be viewed by turning the globe. Asia is initially available through an unnamed node; selecting it reveals geographically anchored Merapi, Himalayas and Borneo discoveries. Drag/swipe and ordinary wheel scrolling turn the view; pinch and Shift/Ctrl-wheel zoom. Accessible turn/zoom/reset buttons provide equivalent camera operations. Swipes/pinches suppress destination picking, rear-side nodes are hidden and blocked by Earth, travel/discovery locks camera gestures, and leaving the scene removes all gesture listeners and capture state. Back returns site → continent → globe → space. The data registry supports additional continent destinations.

Validation ran on GitHub Actions because the local execution workspace was unavailable. [Successful validation/build run](https://github.com/tanjbmath/noviverse/actions/runs/45993448592) tested source commit ab3beb4d9df9c65826464459e1e0b54f090e787d and produced static-build commit 07b03132bbcb35e10e365f487db94217beb1959f on the feature branch.

- All 17 Node tests passed. Four Earth checks cover gesture sequences (tap/drag/pinch/wheel/cancel/disabled/disposal), coordinate mapping and far-side occlusion, seven desktop/phone/landscape sizes and 44 px separation between initial Asia nodes, scene navigation/cancellation and cleanup. Existing Moon orbit, Sun, rig, resource-disposal and science checks pass.
- Asset hashes passed. The Vite production build, root static copy and root/dist repository-subpath checks passed. The existing Three.js size advisory remains. No new dependencies, texture files, backend calls or runtime external API were added.
- A short landscape test initially found overlapping Asia touch areas; the continent framing was corrected before the passing run.
- These are model, synthetic-input and camera-projection checks. Rendered browser behavior, full UI integration, actual touch hardware and visual texture alignment were not tested in this update. No WebGL/browser validation is claimed.
- This phase adds globe-based science introductions. Walking terrain, rainforest/volcano environments, underground cutaways, other continent discoveries and new Earth mini-games remain future work. Broad-region coordinates are representative, not surveyed boundaries; Merapi uses the catalog location. Imagery is historical rather than live.

A temporary workflow used for feature-branch validation/packaging was removed before merge. The existing production deployment configuration is preserved.


Final follow-up: Earth scene construction and inactive controls cannot move the active camera. An already-aborted focus leaves the current region and pose intact. These cases were added to the scene-navigation check. Phone globe controls keep a single row of 44 px buttons at the tested 360/390 px widths. [Final validation/build run](https://github.com/tanjbmath/noviverse/actions/runs/45994068298) passed all 17 tests, asset verification and production build/root/dist checks for source commit ae1dc1ae2072834d84c790f38871602e19857fcc. The same browser/hardware verification limits apply.

## Earth wonder close-ups and walking Novi — 27 November 2026

Tapping Merapi, the Himalayas or Borneo now zooms from the continent into a separate on-demand scenic location. Each location combines a separately generated 1536 × 1024 illustration with a volumetric animated 3D Novi character (2.5D), rather than surveyed or fully modeled terrain. Three unnamed feature nodes per location move Novi across the imagined foreground, zoom the camera closer and open source-linked details. Each location has a three-clue picture challenge, available from the lookout and feature panels. Novi folds the spacecraft parts and deploys articulated legs/treaded boots on entry, and folds back into the spacecraft on return to the continent or space. Underground exploration is still future work.

- `npm test`: 20 tests passed. New checks cover intermediate/reversed Earth transformations and spacecraft restoration, finite matrices, walking/reduced-motion poses, node separation and camera framing at seven desktop/phone/landscape sizes, direct feature picking, focus/abort behavior and texture disposal. Existing globe, Moon and Sun tests still pass.
- A temporary Happy DOM integration run used the real navigation, UI, scenes, rig and challenge modules with a simulated renderer/texture loads and accelerated tweens. All three wonder entries/transforms, feature selection/details, wrong/correct challenge answers, completion/replay/close, overview challenges, Back to Asia restoring spacecraft, interrupted entry/Home/repeat visits, reduced motion and a Sun regression passed. An initial replay event-order issue was corrected before the passing run. This is DOM/navigation validation, not GPU rendering.
- Asset hashes passed for both NASA maps and all three new JPEGs. The production build and root/dist checks include the new wonders directory and passed. The three new images total 1,663,815 bytes; a location loads only its own image on entry. No dependencies or backend calls were added. The existing Three.js chunk-size advisory remains.
- Artwork was inspected independently and feature anchors placed on the depicted elements. Original prompts, asset paths and provenance are recorded in docs/wonder-art-prompts.md and the asset manifest. The runtime uses complete source images; viewport framing can show a subset of the background.
- The managed Chromium preview was attempted but reported `GL_RENDERER = Disabled` and could not create a WebGL context. Rendered transformation, visual layering/texture placement, camera animation, actual touch hardware and browser/device performance remain unverified. No browser gameplay or physical-device success is claimed.
