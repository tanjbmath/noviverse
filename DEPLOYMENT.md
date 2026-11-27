# Deploy from GitHub

The repository is https://github.com/tanjbmath/noviverse. It includes editable source and a generated static copy at the repository root. `npm run build` refreshes both `dist/` and this root copy.

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
