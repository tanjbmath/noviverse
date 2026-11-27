# Verification record

Verified locally on 27 November 2026 in the Windows workspace. This is a **new independent project directory**, not a modification of an existing educational repository. The user subsequently designated the empty `tanjbmath/noviverse` GitHub repository for source upload. No deployment was triggered. Temporary local preview servers were used only for testing and stopped after packaging.

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
- No live site URL, hosting registration or deployment is claimed. The included Pages workflow requires the owner to run it manually; its cloud execution is not verified by the local checks.

## Local launch repair

Directly opening `index.html` is incompatible with ES modules and Vite source. Both source and static packages now include `Start-NoviVerse.cmd`; a dependency-free Node.js loopback server serves the production files with correct content types. The source launcher installs/builds if the production folder is absent. Direct file opening shows a visible explanation rather than a blank screen. The launcher's server was tested in the browser through a Moon visit with no console errors; automatic opening of the user's default external browser was not tested (the QA run used `--no-open`).

## Deliverables

- `noviverse/`: source project, lockfile, local imagery, documentation, tests and generated `dist/`.
- `NoviVerse-source.zip`: editable source/assets/tests/docs, excluding `node_modules`, generated `dist` and Git metadata. Run `npm ci` before development.
- `NoviVerse-static.zip`: contents of the final production `dist/`, ready for a static host. Serve over HTTP rather than opening its index file directly.
- `noviverse-preview.jpg`: final desktop screenshot.
