# Phase 03 — 기본 컴포넌트

상태: 실행 문서 작성 완료, 구현 대기 (2026-10-24)

## 목표

Phase 02까지 기본 요소·forms·layout·utilities를 Pure CSS로 전환했다. Phase 03은 남은 기본 컴포넌트 20개를 기존 import 순서대로 작은 의존 그룹으로 전환해 기본 번들 전체를 Pure CSS로 만든다. 공개 클래스, selector 순서, 상태·pseudo-element·CSS-only 상호작용, 외부 override를 유지하고, 세 브라우저에서 computed style·pixel parity와 실제 상태 동작을 검증한다.

## 범위

- accordions, avatars, badges, breadcrumbs, bars, cards, chips, dropdowns, empty, menus, modals, navs, pagination, panels, popovers, steps, tabs, tiles, toasts, tooltips.
- 각 컴포넌트는 `src/components/<component>.css`로 전환하고 `src/spectra.css`의 legacy 순서를 유지한다.
- 새 의존성, 새 빌드 도구, CSS 생성 DSL은 도입하지 않는다.
- `experimentals`, icons, RTL은 Phase 04 범위다.
- `dist/spectre*.css`, `docs/dist/*`, Gulp/Sass, 패키지 metadata는 이번 phase에서 변경하지 않는다.

### Legacy 현황

- 20개 컴포넌트의 legacy 구간에는 media query가 없다(정적 폭 `$control-width-*`만 사용).
- Sass 동적 구문은 mixin include뿐이다: `avatar-base`(avatars 5회), `shadow-variant`(menus·modals·popovers), `toast-variant`(toasts 5회), `text-ellipsis`(tiles 1회). loop·interpolation·conditional·extend는 없다.
- `!important`는 없다.
- Sass 색상 계산은 `rgba()` 3곳(avatars 전경 85%, modal overlay 75%, tooltip 배경 95%), toast variant의 alpha 배경, shadow rgba, nav active의 `darken()`이다. 배포 CSS의 계산 결과를 그대로 옮기고 `color-mix()`로 근사하지 않는다.
- `dropdowns`와 `modals`는 `slide-down` keyframe을 사용한다. Phase 02에서 `src/utilities/animations.css`로 옮겼으므로 컴포넌트는 이름과 timing만 참조한다.

### 의존 관계

| 그룹 | 컴포넌트 | 공유 의존성 |
| --- | --- | --- |
| 정적 표면 | breadcrumbs, cards, panels, tiles, empty | spacing·border·text-ellipsis, `.card`는 popovers가 재사용 |
| 표시 단위 | avatars, badges, chips | badges는 `.btn`/`.avatar` 위에 겹침, chips는 `.avatar`/`.btn-clear` 포함 |
| 진행·탐색 | bars, steps, navs, pagination | bars의 active 상태, steps의 `~` 형제, navs 중첩, pagination disabled/active |
| 메뉴 | menus | `.menu`는 dropdowns의 패널이며 `.label`·`.form-checkbox`·`.badge`를 포함 |
| 탭 | tabs | `.badge` 위치 보정, `.tab-block` |
| 접기 | accordions | `.icon` 회전, `input:checked ~`·`details[open]` |
| 오버레이 | dropdowns, popovers | `.menu`, `.card`, `slide-down` |
| 툴팁 | tooltips | pseudo-element, `[disabled]`/`.disabled`, 4방향 |
| 모달 | modals | `:target`/`.active`, overlay, `.btn-clear`, `slide-down` |
| 알림 | toasts | variant 색, `.btn-clear`, 링크 상태 |

## 도구 보완

`inspect tooltips`의 legacy 구간은 `_animations.scss`가 selector 없이 keyframes로 시작해 다음 selector 경계를 찾지 못하고 파일 끝까지(utilities 포함) 추출한다. 현재 결과는 classes 111개로 실제 `.tooltip` 범위를 넘는다.

- `legacySlice`가 컴포넌트 뒤의 `@keyframes <name>`을 경계로 인식하도록 확장한다. `tooltips`의 다음 경계는 `@keyframes loading`이다.
- 또는 `inspect`/`scaffold`에 `--legacy-start`/`--legacy-end`를 추가해 명시 구간을 쓴다. verify는 이미 지원한다.
- 수용 조건: `inspect tooltips`의 classes에 `text-primary`, `m-1`, `d-none`이 없고, `scaffold tooltips`의 `legacy.css`가 `.tooltip` 규칙에서 끝난다. 회귀 테스트를 `tests/build/css-migration.test.ts`에 추가한다.
- tooltips 패킷은 이 보완 전에 시작하지 않는다.

## 작업 패킷 순서

각 패킷은 Phase 02와 같은 순서로 진행한다: 실패하는 visual 계약 → 평탄한 CSS → token/cascade 검토 → `verify` → 세 브라우저 검증. 한 패킷 완료만으로 Phase 03을 완료 처리하지 않는다.

1. **도구 보완**: tooltips legacy 경계 수정과 회귀 테스트.
2. **정적 표면**: breadcrumbs, cards, panels, tiles, empty.
3. **표시 단위**: avatars, badges, chips.
4. **진행·탐색**: bars, steps, navs, pagination.
5. **메뉴**: menus.
6. **탭**: tabs.
7. **접기**: accordions.
8. **오버레이**: dropdowns, popovers.
9. **툴팁**: tooltips.
10. **모달**: modals.
11. **알림**: toasts.

menus를 dropdowns보다 먼저, cards를 popovers보다 먼저 전환한다. badges·avatars·chips는 서로의 fixture에 companion CSS로 포함한다. modals·toasts는 `.btn-clear`, `.btn`을 companion으로 사용한다.

## 수용 조건

### 공통

- selector 순서·상세도, 공개 클래스, 기본 외형, 상태·pseudo-element를 legacy와 동일하게 유지한다.
- 기존 `--spectra-*` 토큰을 재사용하고, 실제 테마 제어에 필요한 값만 컴포넌트·의미 토큰으로 추가한다.
- `<component>`마다 `tests/visual/<component>.spec.ts`에 legacy 대비 computed style·대표 pixel, 상태, token scope(전역·중첩·영향 없는 형제), 후행 외부 override 계약을 둔다.
- media query가 없으므로 breakpoint 계약은 없다. viewport는 960px 기본과 fixture 폭으로 검증한다.
- animation은 computed `animation-*`와 paused probe로 keyframe 값을 검증하고, pixel 비교는 animation을 고정한다.
- `pnpm migrate:css verify <component> --target src/components/<component>.css` 통과. 원본 `src/_<component>.scss` negative verify는 종료 코드 1로 실패해야 한다.

### 패킷별 상태·상호작용

- **정적 표면**: breadcrumbs의 `:not(:first-child)::before` slash와 `:not(:last-child)` 여백, cards의 header/body/footer·image radius, panels의 flex·scroll, tiles의 `tile-centered` ellipsis, empty의 spacing.
- **표시 단위**: avatar의 4크기와 `avatar-presence`(online/busy/away)·`data-initial`, badge의 `[data-badge]`·빈 badge 점·`.btn`/`.avatar` 위치, chip의 `.active`·avatar/btn-clear 여백.
- **진행·탐색**: bar의 first/last radius와 `bar-sm`, bar-slider `:active` box-shadow, steps의 active와 `~` 형제 색, nav의 active/hover와 중첩 margin, pagination의 `.active`·`.disabled`·prev/next.
- **menus**: item link의 `:focus`/`:hover`/`:active`/`.active`, `menu-badge .label`, 중첩 menu 여백.
- **tabs**: `.tab-item.active a`와 `a.active`, `.tab-block`에서 badge 위치, tab-action, `.btn-clear` 음수 margin.
- **accordions**: radio input `:checked ~`와 `details[open]`에서 icon rotate(90deg)·body `max-height: 50rem`, 기본 `max-height: 0`, transition `.25s`, `summary::-webkit-details-marker` 제거.
- **dropdowns/popovers**: `.active`·`.dropdown-toggle:focus + .menu`·`.menu:hover` 표시, `dropdown-right`, popover 4방향의 `:hover`/`*:focus`, transform·opacity·transition, popover 내 `.card` shadow.
- **tooltips**: `::after` content·최대 폭·ellipsis·`white-space: pre`, `:focus`/`:hover`, `[disabled]`/`.disabled`의 pointer-events, 4방향 transform.
- **modals**: `:target`(fragment 이동)과 `.active`, overlay 알파, `slide-down .2s`, `modal-sm`/`modal-lg`/`modal-fullheight`, header/body/footer padding.
- **toasts**: 기본·primary·success·warning·error 배경·border alpha, 링크 hover/focus/active opacity, `.btn-clear`, 마지막 `p` margin.

## 토큰 계획

값은 체크인된 `dist/spectre.css`에서 확인해 명시한다.

- z-index: `--spectra-z-index-1: 100` … `--spectra-z-index-4: 400`. zindex-0은 기존 `--spectra-z-index-active: 1`을 사용한다.
- 폭: `--spectra-control-width-{xs,sm,md,lg}` (180/320/640/960px).
- 그림자: `--spectra-shadow-sm`(menus), `--spectra-shadow-lg`(modals/popovers).
- alpha 표면: avatar 전경 `rgb(255 255 255 / 85%)`, modal overlay `rgb(255 255 255 / 75%)`, tooltip 배경 `rgb(48 55 66 / 95%)`, toast variant 배경.
- avatar: `--spectra-avatar-size`(1.6rem)와 `-xs/-sm/-lg/-xl`(0.8/1.2/2.4/3.2rem). font-size는 size/2를 `calc()`로 표현한다.
- badge·chip·step·bar의 크기·오프셋은 기존 spacing·radius·font token으로 표현하고, 독립 조정 가치가 없는 값은 리터럴로 둔다.

## 검증

```sh
pnpm migrate:css verify <component> --target src/components/<component>.css
pnpm check:phase1
pnpm build:phase1
pnpm test
pnpm test:visual
git diff --check
```

- `pnpm check:phase1`은 `src/components`를 이미 포함한다. 새 파일은 Biome 통과가 필요하다.
- `pnpm test`의 source map 검사 목록에 신규 컴포넌트를 추가한다.
- `pnpm test:visual`은 세 브라우저 전체를 유지한다. 실패 우선 증거와 최종 통과 수를 phase 문서에 기록한다.
- Safari/iOS Safari 16.4 실기기 검증은 Phase 04–05까지 미수행 상태로 남긴다.

## 범위 결정

- `typography`, `asian`, `tables`, `media`, `forms`, `labels`, `codes`는 `src/components/`에 유지한다. 문서 사이트의 `elements`/`components` 구분은 문서 정보 구조이므로 소스 디렉터리 이동(`src/elements/`)을 하지 않는다. 이동은 import·source map·테스트 경로를 불필요하게 흔든다.
- 컴포넌트 CSS가 서로를 직접 import하지 않는다. companion이 필요한 테스트 fixture만 legacy와 동일하게 함께 로드한다.
- `slide-down` keyframe은 `src/utilities/animations.css`에 유지하고 dropdowns·modals가 이름으로 참조한다.

## 완료 조건

- 20개 컴포넌트가 `src/components/*.css`로 전환되고 `src/spectra.css`에 legacy 순서로 포함된다.
- 기본 번들에 Sass 구문·미해결 `--spectra-*` fallback이 없고, 새 컴포넌트의 정적 verify와 세 브라우저 계약이 모두 통과한다.
- `pnpm check:phase1`, `pnpm test`, `pnpm build:phase1`, `pnpm test:visual`, `git diff --check`가 통과한다.
- `dist/spectre*.css`와 docs 사본이 변경되지 않았고 기존 SHA-256이 유지된다.
- phase 문서·`progress.md`·`handoff.md`에 결과와 남은 결정(실기기 검증, Phase 04 범위)을 기록한다.
