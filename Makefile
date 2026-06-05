REGISTRY ?= ghcr.io
OWNER ?= yoyoys
REPO ?= kroki-editor
VERSION ?= $(shell node -p "require('./package.json').version")
IMAGE := $(REGISTRY)/$(OWNER)/$(REPO)
REPO_PATH := $(OWNER)/$(REPO)
DATE := $(shell date -u +%Y-%m-%dT%H:%M:%SZ)
SHA := $(shell git rev-parse HEAD 2>/dev/null)
SOURCE := $(shell git remote get-url origin 2>/dev/null)

build:
	docker buildx build \
		--platform=linux/amd64 \
		--label "org.opencontainers.image.title=Kroki Editor" \
		--label "org.opencontainers.image.created=$(DATE)" \
		--label "org.opencontainers.image.revision=$(SHA)" \
		--label "org.opencontainers.image.version=$(VERSION)" \
		--label "org.opencontainers.image.source=$(SOURCE)" \
		--label "org.opencontainers.image.licenses=Apache-2.0" \
		-t $(IMAGE):$(VERSION) \
		.

push:
	@if docker manifest inspect $(IMAGE):$(VERSION) >/dev/null 2>&1; then \
		echo "❌ $(IMAGE):$(VERSION) already exists on the registry; use 'make push-force' to overwrite"; \
		exit 1; \
	fi
	docker push $(IMAGE):$(VERSION)

push-force:
	docker push $(IMAGE):$(VERSION)

remote-version:
	@echo "🔍 listing remote tags for $(IMAGE) ..."
	@token=$$(curl -fsSL "https://$(REGISTRY)/token?scope=repository:$(REPO_PATH):pull" | jq -r .token); \
	curl -fsSL -H "Authorization: Bearer $$token" "https://$(REGISTRY)/v2/$(REPO_PATH)/tags/list" | \
		( jq -r '.tags[]' 2>/dev/null || cat ) || \
		{ echo "❌ could not list tags (login may be required or the package does not exist)"; exit 1; }

# === Release flow (single-track; a GitHub Release is the trigger) ===
#
#   Pre-release (validate):  create a GitHub *pre-release* → pre-release.yml runs
#     `make pre-release` (changelog + version, committed to main) and builds the
#     multi-arch RC image `:<ver>-rc`.
#   Release (promote):       flip it to a full release → docker-publish.yml runs
#     `make release` (re-tag the RC digest to `:<ver>` + `:latest`) and Pages deploys.
#
# gh-pre-release / gh-release are local shortcuts that create / promote the GitHub
# Release from your machine; you can do the same from the GitHub web UI instead.

# (CI) Write CHANGELOG.md + sync package.json to VER, then commit & push to main.
pre-release:
	@test -n "$(VER)" || { echo "❌ VER required, e.g. make pre-release VER=1.1.0"; exit 1; }
	npm pkg set version="$(VER)"
	@# The v$(VER) tag already exists (the Release created it), so derive the range
	@# explicitly: from the previous release tag — or the root commit for the first one.
	@prev=$$(git tag --list 'v*' --sort=-version:refname --merged HEAD | grep -vx "v$(VER)" | head -1); \
	from=$${prev:-$$(git rev-list --max-parents=0 HEAD | tail -1)}; \
	echo "changelog range: $$from..HEAD"; \
	pnpm exec changelogen --from "$$from" --to HEAD -r "$(VER)" --output CHANGELOG.md
	git add package.json CHANGELOG.md
	git commit -m "release: v$(VER)"
	git push origin HEAD:main

# Preview the suggested next version + changelog. Changes/commits/releases nothing.
pre-release-dry:
	@cp package.json .pkg.bak; [ -f CHANGELOG.md ] && cp CHANGELOG.md .cl.bak || true; \
	pnpm exec changelogen --bump --output CHANGELOG.md >/dev/null 2>&1; \
	v=$$(node -p "require('./package.json').version"); \
	echo "🧪 DRY RUN — nothing changed, committed, or released."; \
	echo "Suggested next version: v$$v"; \
	echo "── changelog preview ──────────────────────────"; \
	awk 'f && /^## / { exit } f; /^## / { f=1 }' CHANGELOG.md; \
	echo "───────────────────────────────────────────────"; \
	mv .pkg.bak package.json; { [ -f .cl.bak ] && mv .cl.bak CHANGELOG.md; } || rm -f CHANGELOG.md

# (local) Create a GitHub pre-release → triggers pre-release.yml.
# VER defaults to changelogen's suggested next version; override with VER=1.2.0.
# Release-body highlights (optional, all work in any shell — no editor/prompt):
#   NOTES="line1\nline2"   → \n etc. are expanded to real newlines (avoid backticks)
#   NOTES_FILE=notes.md    → read the body from a file (safe for any markdown)
# Empty → empty body; pre-release.yml then fills it with the changelog only.
gh-pre-release:
	@v="$(VER)"; \
	if [ -z "$$v" ]; then \
		cp package.json .pkg.bak; [ -f CHANGELOG.md ] && cp CHANGELOG.md .cl.bak || true; \
		pnpm exec changelogen --bump --output CHANGELOG.md >/dev/null 2>&1; \
		v=$$(node -p "require('./package.json').version"); \
		mv .pkg.bak package.json; { [ -f .cl.bak ] && mv .cl.bak CHANGELOG.md; } || rm -f CHANGELOG.md; \
	fi; \
	echo "Creating pre-release v$$v ..."; \
	if [ -n "$(NOTES_FILE)" ]; then \
		gh release create "v$$v" --prerelease --target main --title "v$$v" --notes-file "$(NOTES_FILE)"; \
	else \
		printf '%b' "$(NOTES)" > .ghnotes.tmp; \
		gh release create "v$$v" --prerelease --target main --title "v$$v" --notes-file .ghnotes.tmp; \
		rm -f .ghnotes.tmp; \
	fi

# (CI) Promote the validated RC image to the final tags — no rebuild, same digest.
release:
	@test -n "$(VER)" || { echo "❌ VER required, e.g. make release VER=1.1.0"; exit 1; }
	docker buildx imagetools create \
		-t $(IMAGE):$(VER) \
		-t $(IMAGE):latest \
		$(IMAGE):$(VER)-rc

# (local) Promote a pre-release to a full release → triggers docker-publish.yml + pages.yml.
gh-release:
	@test -n "$(VER)" || { echo "❌ VER required, e.g. make gh-release VER=1.1.0"; exit 1; }
	gh release edit "v$(VER)" --prerelease=false --latest

.PHONY: build push push-force remote-version pre-release pre-release-dry gh-pre-release release gh-release
