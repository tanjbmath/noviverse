# Assets and usage review

Reviewed 27 November 2026. No purchased models, uncredited stock assets, external fonts, logo likenesses, or AI image assets were used.

| Asset | Origin / credit | Usage basis / modifications |
| --- | --- | --- |
| `public/textures/earth.jpg` | NASA Earth Observatory, Blue Marble Next Generation, July 2004, Reto Stöckli. [Official project](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/). [Downloaded original](https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-base/july/world.200407.3x5400x2700.jpg). | NASA educational/informational use under the [NASA media guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/). Unmodified JPEG, 5400 × 2700. No logos or identifiable people. Rendered as an Earth texture. |
| `public/textures/moon.jpg` | NASA / GSFC / Arizona State University, CGI Moon Kit (2019 color map), Ernie Wright. [Official product and credits](https://svs.gsfc.nasa.gov/4720/). | NASA SVS states its visualizations are public domain unless otherwise noted. No separate restrictive image notice was found for this map. The [NASA media guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/) permit educational/informational use with acknowledgment and no endorsement. The official download returned 403 in this environment; the 1024 × 512 named map was downloaded from [this research repository mirror](https://raw.githubusercontent.com/williamjo-utaustin/falcon9-lunar-impact-simulations/main/lroc_color_poles_1k.jpg). We verified the NASA origin/filename/dimensions, but could not compare bytes against the blocked original. No research code or other repository assets were copied. |
| Novi character, spacecraft, transforming engine rig, terrain, rocks, scanner, gravity instrument, starfield, Sun illustration, microtextures, icons, favicon and UI | Original code-authored artwork in this project. | No third-party model or texture license obligations. Editable source geometry and animation rig are included. This delivery makes no claim about trademark availability of the provisional names Novi or NoviVerse. |
| Three.js 0.181.2 | [Three.js](https://github.com/mrdoob/three.js), MIT. | Includes Three.js addon `RoundedBoxGeometry`. License notice retained in the dependency and bundled license notices. |
| Vite 7.3.8 and build dependencies | [Vite](https://github.com/vitejs/vite), MIT, plus its dependency licenses. | Build tooling only. The lockfile pins exact installed packages. See installed package LICENSE files for complete tooling dependency notices. |

NASA imagery is not a NASA partnership or endorsement. These are educational assets; NASA insignia and emblems were not used. NASA's permission does not grant rights to third-party material found elsewhere on its websites. The two selected imagery products have specific origins/credits recorded above.

`public/asset-manifest.json` records source URLs, downloaded byte sizes and SHA-256 hashes. `npm run assets:verify` checks delivered file integrity; it is not a remote licensing service or proof of equality to a blocked source.

The original local source remains available for the user's project. No separate commercial trademark clearance or worldwide legal opinion is implied by this asset review.
