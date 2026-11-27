# Deploy from GitHub

The repository is https://github.com/tanjbmath/noviverse. It includes editable source and a generated static copy at the repository root. `npm run build` refreshes both `dist/` and this root copy.

## Prepared Phase 1 release

The local branch `codex/noviverse-phase-1` contains the revamp and the compact travel notice fix. The build is ready in `dist/`; a verified upload ZIP and SHA-256 checksum are provided in the ignored `releases/` folder, named with the release commit. The ZIP opens directly to `index.html` and its assets, without an extra enclosing directory. It contains compiled static files and bundled imagery, with no dependency installation or backend configuration needed on the host.

For a static host with an upload option, upload the ZIP or extract its contents into the host's web root. For the existing GitHub Pages branch publishing route, push the implementation branch and merge its committed source plus generated root files into `main`; publication then follows the repository's Pages configuration. The optional manual Actions workflow below is a separate route and requires Pages to use GitHub Actions.

Local checks passed: all 23 tests, image provenance/hash verification, production build, and relative entry/asset validation for root hosting and `/noviverse/`. The production preview was checked during animated desktop and phone flights. The notice is a non-interactive pill approximately 170×39 px on desktop and 166×37 px on a phone, at the upper edge of the screen; detailed journey announcements remain available to assistive technology.

Preparation does not publish the site. No branch push, merge, remote workflow run or deployment was performed for this release. GitHub account-level Pages settings and physical-phone performance have not been verified. The existing Three.js bundle-size advisory remains.

## Current branch-based Pages setup

Pages can publish **main / (root)** directly. The tracked root `index.html`, `assets/`, `textures/`, and `.nojekyll` are already built and work under `/noviverse/`. Updating those files triggers the repository's existing Pages deployment. Edit `src/index.html` for HTML changes, then run `npm run build` and commit the updated source and generated root files together.

## Optional GitHub Actions setup

1. In the repository, open **Settings → Pages**. Under **Build and deployment**, choose **GitHub Actions** as the source.
2. Open **Actions → Deploy NoviVerse to GitHub Pages → Run workflow**, choose `main`, then run it when you are ready to publish.
3. The workflow installs the locked dependencies, runs tests and asset verification, builds the game, and deploys only `dist/`. Its deployment summary supplies the real site URL after success.

The root copy is now safe for branch-based Pages publishing too. Do not replace it with the editable `src/index.html`: that file requires Vite. For local play, use `Start-NoviVerse.cmd` instead of opening either HTML file directly.

The custom workflow uses official GitHub Actions release versions checked on 27 November 2026 and remains manual-only. It is optional when the current branch-based Pages setup is used.

[GitHub documentation for Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## Other static hosts

| Setting | Value |
| --- | --- |
| Project root | Repository root |
| Runtime | Node.js 24 |
| Install | `npm ci` |
| Build command | `npm run build` |
| Output / publish directory | `dist` |
| Environment variables | None |
| Backend / database | None |

For manual file uploads, upload the contents of the built `dist/` folder. Serve through HTTP or HTTPS. Vite's relative base supports a repository subpath such as `/noviverse/`. No credentials, account setup or persistent state is required by the game.
