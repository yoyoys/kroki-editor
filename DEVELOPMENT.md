# Development

How to run Kroki Editor locally, the scripts available, and how the Docker image is built and published.

## Local setup

```sh
pnpm install
pnpm dev
```

Configure dev via a `.env.local` file (git-ignored). A committed `.env` provides public defaults.

| Variable | Description |
|---|---|
| `VITE_PAGE_TITLE` | Browser tab title and header label (default `Kroki Editor`). |
| `VITE_KROKI_ENDPOINT` | Kroki endpoint for the preview (default `https://kroki.io`). |
| `VITE_EXAMPLE_KROKI_ENDPOINT` | Endpoint for gallery thumbnails (falls back to `VITE_KROKI_ENDPOINT`). |
| `VITE_ENABLED_DIAGRAMS` | Comma-separated type allow-list. |
| `VITE_DEFAULT_DIAGRAM` | Default diagram type. |
| `VITE_MERMAID_CLIENT_SIDE` | `true` to render Mermaid in the browser. |

```dotenv
# .env.local
VITE_KROKI_ENDPOINT=https://kroki.internal.example
VITE_MERMAID_CLIENT_SIDE=true
```

> Vite reads `.env*` only at dev-server start — restart `pnpm dev` after changing them.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the dev server (HMR). |
| `pnpm build` | Type-check and build static files into `dist/`. |
| `pnpm preview` | Serve the built `dist/` locally. |
| `pnpm test` | Run the unit tests (Vitest). |
| `pnpm lint` / `pnpm lint:fix` | Lint / auto-fix. |
| `pnpm encode` / `pnpm decode` | Convert a diagram source to/from the Kroki encoding (deflate + base64url), reading stdin. |

The `encode`/`decode` scripts share the exact scheme used in the app (`src/lib/encoding.ts`) and in Kroki URLs, so they're handy for producing `EXAMPLE_<TYPE>` values or inspecting an encoded diagram:

```sh
pnpm encode < diagram.puml          # source        -> encoded string
pnpm decode <<< 'eNpl...'           # encoded string -> source
```

## Releasing a version

The project is single-track: every release ships from `main`, and **a GitHub Release is the only release trigger** — pushing commits to `main` only runs CI, it never publishes. Releasing has two stages, *pre-release* (validate) then *release* (promote), and the image is **built once and promoted** so what you ship is exactly what you validated.

### 1. Pre-release (validate)

Create a GitHub **pre-release**, either from the web UI (Releases → Draft new release → new tag `vX.Y.Z` → tick *Set as a pre-release* → Publish) or locally:

```sh
make gh-pre-release            # version auto-derived from your Conventional Commits
make gh-pre-release VER=1.2.0  # …or pick it explicitly
```

That fires **`pre-release.yml`** (`release: prereleased`), which:

1. runs `make pre-release` — writes `vX.Y.Z` into `package.json`, regenerates `CHANGELOG.md` with [changelogen](https://github.com/unjs/changelogen), and commits `release: vX.Y.Z` back to `main`;
2. builds the **multi-arch** (`amd64` + `arm64`) **RC image** and pushes it as `ghcr.io/yoyoys/kroki-editor:X.Y.Z-rc`.

Pull the `-rc` image and check it. Preview the version/changelog beforehand with **`make pre-release-dry`** (prints the suggested next version and notes, changes nothing).

### 2. Release (promote)

When the RC is good, flip the pre-release to a full release — web UI (edit the release → untick *pre-release* → Update) or locally:

```sh
make gh-release VER=1.2.0
```

That fires both:

- **`docker-publish.yml`** (`release: released`) → `make release` re-tags the **same RC digest** to `:X.Y.Z` + `:latest` (`docker buildx imagetools create`, no rebuild). Tracked under the `ghcr` deployment environment.
- **`pages.yml`** (`release: released`) → deploys the live demo, so it reflects the latest *released* version.

The version comes from the release tag you choose (`feat:` → minor, `fix:` → patch, `feat!:`/`BREAKING CHANGE` → major by convention). The full, auto-generated changelog lives in the repo as `CHANGELOG.md`; the **GitHub Release notes are your own highlights followed by that changelog** — `pre-release.yml` composes them. Write the highlights in the release body when you create it:

- **web UI** — type markdown straight into the body (easiest for multi-line);
- **`make gh-pre-release NOTES="## Highlights\n- …"`** — `\n` becomes a newline (avoid backticks here);
- **`make gh-pre-release NOTES_FILE=notes.md`** — read the body from a file (safe for any markdown).

Leave them empty and the notes are just the changelog.

## Building & publishing the image manually

For local or one-off pushes, the `Makefile` builds with `docker buildx`, stamps OCI labels (version from `package.json`, git revision, source), and publishes to `ghcr.io/yoyoys/kroki-editor`. The version tag comes from `package.json` (override with `make push VERSION=1.2.3`).

```sh
make build           # build the image tagged :<version>
make push            # push :<version> (refuses if it already exists)
make push-force      # push :<version>, overwriting
make remote-version  # list published tags on GHCR
```

## GitHub Pages

`.github/workflows/pages.yml` builds and deploys the app on every **full GitHub Release** (`release: released` — i.e. the promote step, not pre-releases) and on manual **workflow_dispatch**. The relative `base: './'` build works under the project-pages sub-path with no extra config; the demo runs against the public Kroki with client-side Mermaid enabled. First-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
