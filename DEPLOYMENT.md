# Deploy from GitHub

The source repository is https://github.com/tanjbmath/noviverse. Uploading source does not deploy the game. The Pages workflow is **manual only**; it has no push trigger.

## GitHub Pages

1. In the repository, open **Settings → Pages**. Under **Build and deployment**, choose **GitHub Actions** as the source.
2. Open **Actions → Deploy NoviVerse to GitHub Pages → Run workflow**, choose `main`, then run it when you are ready to publish.
3. The workflow installs the locked dependencies, runs tests and asset verification, builds the game, and deploys only `dist/`. Its deployment summary supplies the real site URL after success.

Do not select the unbuilt repository root as a branch-based Pages site: its `index.html` is Vite source and needs the build step. Do not double-click `index.html` for local play; use `Start-NoviVerse.cmd` instead.

The workflow uses official GitHub Actions release versions checked on 27 November 2026. It has not been run by the uploader; no deployment success or live URL is claimed.

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
