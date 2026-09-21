# Project Instructions

- Respond in Korean. Write all commit messages in English using Conventional Commits.
- Read `planning/handoff.md`, `planning/plan.md`, and `planning/progress.md` before project work. Keep planning records in `planning/`; `docs/` is the documentation website.
- Use Node.js 24 and the pnpm version pinned in `package.json`. Preserve `pnpm-lock.yaml`.
- Build Spectra with standard CSS, `--spectra-*` custom properties, and small TypeScript scripts. Prefer minimal vertical slices.
- Preserve public classes, default appearance, external style overrides, and upstream license notices. Do not introduce cascade layers.
- Preserve legacy Gulp/Sass, package metadata, and distribution files until the planned migration phase. Phase 01 output belongs in `build/phase-01/`.
- For behavior changes, write a failing test first when practical. Run `pnpm check:phase1`, `pnpm test`, and `pnpm build:phase1`; run `pnpm test:visual` for CSS or visual behavior changes.
- Preserve unrelated changes. Ask before destructive actions; push or publish only when explicitly requested.
