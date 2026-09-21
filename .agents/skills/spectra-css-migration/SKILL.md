---
name: spectra-css-migration
description: Migrate scoped Spectra components from Sass to CSS with legacy parity tests. Use for implementation within an approved migration phase, including delegated Luna tasks.
---

# Spectra CSS Migration

Execute one component or small dependency group per task. All paths below are repository-relative. This skill does not authorize a new phase.

## 1. Resolve the work packet

Read `AGENTS.md`, `planning/handoff.md`, `planning/progress.md`, `planning/plan.md`, and the active phase execution document. Inspect Git status and existing diffs. Resolve this packet from the request and documents:

```text
Phase / execution document:
Component / public selectors:
Legacy SCSS / variables / mixins:
Compiled CSS baseline:
Target CSS / owning bundle:
Allowed write paths / shared-file owner:
Migrated dependencies:
Required states / breakpoints / theme behavior:
Build output / validation commands:
```

Ask only for missing decisions that affect scope. If implementation is not authorized or the phase lacks an execution contract, return the missing inputs instead of inventing a plan. Resume existing work rather than recreating it.

For Luna delegation, the coordinator supplies this skill path and the packet to a worker selected as `gpt-5.6-luna` when available. The skill itself does not switch models.

- Give workers exclusive component CSS and test paths; process dependent slices sequentially.
- By default, the coordinator owns `src/tokens.css`, bundle entries, build configuration, shared test helpers, and `planning/`. Workers return exact proposed shared changes instead of editing those files.
- Parallel workers need isolated checkouts or distinct supported build outputs and matching test inputs. Otherwise serialize shared-output builds.
- Workers return evidence and integration requirements. The coordinator integrates, verifies, and records progress. Do not recursively delegate.

## 2. Capture the legacy contract

Use `rg` to find assigned selectors, SCSS imports, variables, mixins, and documentation markup. Read their dependencies and corresponding compiled rules. Record selectors, variants, states, pseudo-elements, media queries, animations, and companion styles as a compact checklist.

- Use SCSS for intent and checked-in CSS for rendered values. Report material conflicts instead of silently choosing new behavior.
- The base baseline is `dist/spectre.css`; resolve experimental, icon, and RTL baselines from the active contract. Include required companion styles in both fixtures.
- Preserve specificity, rule order, markup, dimensions, and colors. Do not rebuild legacy Node Sass or modify baseline files to make comparisons pass.
- If a dependency is missing, report it or use the assigned dependency group. Do not inject legacy component CSS into the new bundle to conceal missing work.

## 3. Add the failing contract test

Inspect `tests/visual/buttons.spec.ts` for the comparison pattern and `tests/build/css-build.test.ts` for bundle contracts. Resolve current paths before reusing them.

Render identical markup in separate legacy and new-CSS pages with the same browser, viewport, and fonts. Choose checks from the component checklist:

- Compare relevant computed styles and representative pixels for default and variant states.
- Exercise actual hover, focus, pressed, checked, expanded, disabled, or validation states when present. An `.active` class does not test `:active`.
- Include pseudo-elements and CSS-only interactions where applicable.
- Test immediately below, at, and above each used breakpoint.
- Test global and nested container token overrides plus an unaffected sibling. Assert concrete rendered changes without rebuilding CSS.
- Compare external stylesheet overrides with identical selectors and stylesheet order on both pages.

Keep fixture resets identical and avoid resetting properties under comparison. Stabilize animation timing for static comparisons and test required animation behavior separately. Do not weaken assertions or refresh baselines to hide differences.

Run the targeted test before conversion when practical. Record the expected missing-component failure. Browser-launch or dependency errors are environment blockers, not successful failing tests.

## 4. Convert the assigned slice

Write standard flat CSS in the assigned category, preserving selector expansion and cascade order. Do not mechanically substitute native nesting or introduce `@layer`.

- Expand mixins, placeholders, loops, and interpolation to existing ranges. Preserve animation names and keyframes; do not add a generation DSL.
- Reuse `--spectra-*` tokens. Add semantic/component tokens for actual theme controls, not every declaration.
- Preserve Sass-computed colors. Use explicit state, contrast, and alpha tokens where needed; do not approximate `darken()` with `color-mix()`.
- Prefer use-site fallbacks so component defaults do not mask inherited themes. Root-resolved aliases do not automatically follow child base-token overrides; test the promised scope.
- Preserve the root/rem scale and use dimensionally valid `calc()`. Keep media-query thresholds static and unchanged; `var()` cannot supply query conditions.
- Add imports in explicit legacy order. The current collector accepts plain relative `@import "./file.css";` statements; conditional imports require an assigned build change.
- Include tokens once in the base bundle. Experimental bundles must not reset them. Icons retain standalone behavior through suitable fallbacks. RTL preserves transforms and physical left/right utility meanings.

For shared edits outside worker ownership, return exact proposed values/insertions and mark integration pending. Do not claim parity before the component is included in the tested bundle.

## 5. Verify integration

Resolve commands from `package.json` and active test configuration. Planned commands may not exist yet. Current Phase 01 commands are:

```sh
pnpm check:phase1
pnpm build:phase1
pnpm test
pnpm test:visual
git diff --check
```

Use phase equivalents once introduced. Ensure lint includes new directories. Run build-writing commands sequentially and rebuild before direct Playwright runs to avoid stale CSS. Reuse the configured browser installation path; report missing binaries and sandbox restrictions separately.

After targeted checks pass, run the integrated build/contract suite and Chromium, Firefox, and WebKit checks required by the phase. Check resolved imports, source maps to new files, licenses, deterministic output, and absence of Sass syntax or unresolved token references without valid fallbacks. Record bundle/gzip size changes when the phase requires them. Verify legacy baseline files remain unchanged in the diff.

WebKit results do not establish Safari/iOS Safari 16.4 device coverage. Keep blocked checks pending. Fix failures within the slice; return cross-component contract changes to the coordinator.

## 6. Report and stop

Return a concise report in Korean:

```text
Scope: phase, component, selectors
Changes: files and token/import changes
Evidence: baseline, states/viewports/themes, commands and outcomes
Pending: shared integration, blocked checks, missing decisions
Next: assigned slice or coordinator action
```

The coordinator verifies the integrated diff and updates the active phase document, `planning/progress.md`, and `planning/handoff.md` with observed results. One completed component does not complete a phase. Stop after the assigned slice. Commit, push, release, legacy removal, and phase advancement follow explicit user scope. Use English Conventional Commit messages when committing is requested.
