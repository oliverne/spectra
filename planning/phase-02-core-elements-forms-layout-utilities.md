# Phase 02 — 기본 요소·forms·layout·utilities

상태: 진행 중 (layout·hero·navbar 패킷 완료, 2026-10-15)

## 목표

Phase 01의 Pure CSS 빌드와 회귀 계약을 기본 요소, forms, layout, utilities로 확장한다. 공개 클래스, selector 순서, responsive 경계, 기본 외형과 외부 override를 유지하며 런타임에 재정의할 가치가 있는 값만 `--spectra-*` 토큰으로 제공한다.

이번 첫 세로 단위는 반복적인 조사와 평탄화 준비를 줄이는 마이그레이션 도구에 한정한다. 컴포넌트 CSS를 새 번들에 통합하거나 Phase 02의 외형을 변경하지 않는다.

## 범위

### 마이그레이션 도구

- `pnpm migrate:css inspect <component>`가 직접 import된 SCSS 컴포넌트의 변수, mixin, 동적 Sass 구문, 공개 클래스와 기존 배포 CSS 구간을 JSON으로 출력한다.
- `pnpm migrate:css scaffold <component>`가 무시되는 `build/migration/<component>/`에 검사 결과, 기존 CSS 구간, 편집용 후보를 생성한다. 기존 패킷은 덮어쓰지 않는다.
- `pnpm migrate:css verify <component> --target <css-file>`가 CSS 구문, 남은 Sass 구문, 기존 클래스, media query와 표준 속성의 정적 범위를 검사한다.
- 정적 검사는 parity 완료 판정이 아니다. 토큰 의미, cascade, computed style과 픽셀 결과는 컴포넌트별 테스트에서 확인한다.

### 이후 컴포넌트 작업

- 기본 요소: typography, asian, tables, forms, labels, codes, media.
- layout: layout, hero, navbar.
- utilities: animations와 `src/utilities/`의 색상·cursor·display·divider·loading·position·shape·text 규칙.
- 서로 의존하는 항목은 작은 묶음으로 순차 전환하고 `src/spectra.css` import 순서는 기존 `src/spectre.scss`를 따른다.

## 작업 패킷 순서

각 패킷은 실패 테스트, 평탄한 CSS, token/cascade 검토, 정적 verify, 통합 브라우저 검증 순서로 진행한다. 한 패킷 완료만으로 Phase 02를 완료 처리하지 않는다.

1. `layout`
2. `hero`, `navbar`
3. `typography`, `asian`, `tables`, `media`
4. `forms`
5. `labels`, `codes`
6. `animations`와 `src/utilities/`의 colors, cursors, display, divider, loading, position, shapes, text

`forms`는 상태·validation·아이콘·input group과 색상 계산 범위가 넓으므로 독립 패킷으로 유지한다. utilities의 mixin/interpolation 확장은 생성된 클래스 전체 범위를 검사한다. keyframes로 시작하는 `animations`와 간접 aggregator인 `utilities`는 helper에서 `legacy: null`이므로 수동 경계 조사 또는 이 phase 계약에 따른 도구 확장이 필요하다.

## 완료한 패킷: layout (2026-10-15)

1. `build/migration/layout/inspection.json`, `legacy.css`, `candidate.css`와 `src/_layout.scss`, `dist/spectre.css`의 해당 구간을 대조한다. 같은 workspace에 패킷이 있으면 scaffold를 다시 실행하지 않고, 새 checkout처럼 없으면 재생성한다.
2. `tests/visual/layout.spec.ts`에 실패하는 responsive·token scope·외부 override 계약을 추가한다.
3. `src/layout/layout.css`를 평탄한 CSS로 작성한다. 기존 물리 방향 속성 의미를 우선 보존하고 구형 `-ms-*` 선언은 새 Browserslist 대상의 빌드에 맡긴다.
4. gutter는 기존 기본값을 유지하면서 전역·두 중첩 컨테이너·영향받지 않는 형제의 token 변경을 검증한다. container 최대 폭은 기본값에서 1296/976/856/616/496px과 일치해야 한다.
5. `src/spectra.css`에 기존 cascade 순서를 고려해 import하고 새 경로가 check/build/source map 범위에 들어가는지 확인한다.

layout 수용 조건:

- `.container`, `.grid-{xs,sm,md,lg,xl}`의 크기와 gutter가 기존 CSS와 일치한다.
- `.cols`, `.columns`, `.column`, `.col-gapless`, `.col-oneline`, `.col-{1..12}`, `.col-auto`를 보존한다.
- `xs/sm/md/lg/xl` responsive column과 `.show-*`, `.hide-*`를 각 breakpoint 직전·경계·직후에서 검증한다.
- 전역 및 중첩 scope의 spacing token 변경과 후행 외부 CSS override를 검증한다.
- Chromium/Firefox/WebKit에서 computed style과 대표 픽셀이 기존 CSS와 일치한다.
- 기존 `dist/spectre*.css`와 docs 사본은 변경하지 않는다.

layout 검증 순서:

```sh
pnpm migrate:css verify layout --target src/layout/layout.css
pnpm check:phase1
pnpm build:phase1
pnpm test
pnpm test:visual
git diff --check
```

layout 결과 (2026-10-15):

- `src/layout/layout.css`가 `.container`부터 `.hero` 직전 구간을 평탄한 CSS로 옮겼다. gutter는 `var(--spectra-space-2, 0.4rem)`, 최대 폭은 496/616/856/976/1296px, breakpoint는 480/600/840/960/1280px 정적 값이다. 구형 `-ms-*` 선언은 쓰지 않고 대상 브라우저 변환은 빌드가 담당한다.
- `src/spectra.css`에서 buttons 뒤에 import하고 `package.json`의 `check:phase1` 범위에 `src/layout`을 추가했다.
- `tests/visual/layout.spec.ts`의 5개 계약이 세 브라우저에서 통과했다: 반응형 boundary computed style(15 viewport), 반응형 pixel, 기본 크기·gutter, 전역·중첩 token override, 후행 외부 override.
- `tests/build/css-build.test.ts`가 source map의 `src/layout/layout.css` 포함을 검사한다.
- 일반 20,267바이트, 압축 16,794바이트, gzip 3,963바이트다(layout 이전 14,108/12,327/2,984).
- Lightning CSS가 숫자를 float32·6자리로 직렬화해 `8.33333333%`가 `8.33333%`로 저장된다. 일부 viewport에서 column computed width가 layout unit(1/60~1/64px)만큼 어긋나므로 시각 계약은 0.05px 허용 오차로 비교하고, pixel 계약은 byte 비교를 유지한다.

## 완료한 패킷: hero, navbar (2026-10-15)

1. `pnpm migrate:css inspect hero`, `inspect navbar`로 클래스·의존성·legacy 구간을 조사하고 `build/migration/{hero,navbar}/` 패킷을 scaffold했다.
2. 도구 경계 버그를 수정했다. `navbar` legacy 구간의 끝이 다음 컴포넌트(`accordions`)의 그룹 selector 첫 줄(`.accordion input:checked ~ .accordion-header > .icon:first-child,`)에 걸려 `accordion`, `accordion-header`, `icon`이 navbar 클래스 범위로 새던 문제를, `legacySlice`가 마지막 완전한 규칙(`}`)까지만 남기도록 고쳤다. 실패 우선 회귀 테스트를 `tests/build/css-migration.test.ts`에 추가했다.
3. `tests/visual/hero.spec.ts`, `tests/visual/navbar.spec.ts`에 실패 계약을 먼저 추가했다. hero/navbar CSS가 없는 번들에서 8개 중 6개가 실패했고, 전환 후 세 브라우저 24개가 통과했다.
4. `src/layout/hero.css`, `src/layout/navbar.css`를 평탄한 CSS로 작성하고 `src/spectra.css`의 `layout.css` 뒤에 import했다. `src/layout`은 이미 `check:phase1` 범위에 있어 package.json은 바꾸지 않았다.

hero 수용 조건:

- `.hero`, `.hero-sm`, `.hero-lg`의 `display`, `flex-direction`, `justify-content`와 4/2/8rem padding이 기존 CSS와 일치한다.
- `.hero .hero-body` padding이 `--spectra-space-2`(기본 0.4rem)를 따르고, 전역·중첩 override와 영향받지 않는 형제를 검증한다.
- 후행 외부 override를 검증한다.

navbar 수용 조건:

- `.navbar`의 `align-items: stretch`, `flex-wrap: wrap`, `justify-content: space-between`을 보존한다.
- `.navbar-section`(`flex: 1 0 0`, `align-items: center`)과 `:not(:first-child):last-child`의 `flex-end`, `.navbar-center`(`flex: 0 0 auto`)를 보존한다.
- `.navbar-brand`가 `--spectra-font-size-lg`(기본 0.9rem)와 `text-decoration: none`을 따르고, 전역·중첩 override와 외부 override를 검증한다.
- hero/navbar에는 media query와 상태 선택자가 없다. inspection 결과로 확정했다.

hero/navbar 검증 순서:

```sh
pnpm migrate:css verify hero --target src/layout/hero.css
pnpm migrate:css verify navbar --target src/layout/navbar.css
pnpm check:phase1
pnpm build:phase1
pnpm test
pnpm test:visual
git diff --check
```

hero/navbar 결과 (2026-10-15):

- 두 `verify` 모두 통과(`ok: true`, 누락 클래스·media query·표준 속성 없음). 원본 `src/_hero.scss`, `src/_navbar.scss`에 대한 negative verify는 의도대로 종료 코드 1로 실패한다.
- `pnpm test` 11개 통과(신규 회귀 테스트 1개 포함), `pnpm test:visual` 51개 통과(buttons 12 + layout 15 + hero 12 + navbar 12).
- 일반 21,051바이트, 압축 17,441바이트, gzip 일반 4,135바이트다(layout 시점 20,267/16,794/3,963).
- `dist/spectre*.css`와 docs 사본은 변경하지 않았고 SHA-256이 유지됐다.

## 다음 패킷: typography, asian, tables, media

1. `pnpm migrate:css inspect typography|asian|tables|media`로 클래스·media query·의존성을 조사하고 패킷을 scaffold한다.
2. 실패하는 computed style·pixel·token scope·외부 override 계약을 `tests/visual/`에 추가한다.
3. 해당 CSS를 평탄하게 작성한다. 기존 `src/spectre.scss` 순서는 typography→asian→tables→buttons이므로 번들에서 buttons 앞으로 들어갈지, media는 buttons 뒤 어디에 둘지 import 위치를 먼저 확정한다.
4. layout/hero/navbar와 같은 검증 순서를 실행하고 수용 조건을 이 문서에 기록한다.

## 변환 계약

- 도구가 생성한 `candidate.css`는 체크인된 `dist/spectre.css`의 작업용 사본이다. 그대로 `src/`에 복사하지 않고 불필요한 구형 접두사와 정적 테마 값을 검토한다.
- nesting, mixin, placeholder와 고정 반복 범위는 최종 소스에서 평탄한 CSS로 남긴다. 변환 도구를 배포 빌드에 연결하거나 CSS 생성 DSL로 사용하지 않는다.
- Sass 색상 계산 결과는 기존 배포 CSS에서 확인하고 명시적인 상태·대비·alpha 토큰으로 옮긴다. 근사 색상 함수로 대체하지 않는다.
- 480/600/840/960/1280/1440px responsive 경계는 정적 값으로 유지한다.
- 새 토큰과 bundle entry는 coordinator가 통합하며 개별 컴포넌트 작업이 공유 파일을 임의로 변경하지 않는다.

## 도구 수용 조건

- `layout` 검사 결과가 `layout-spacing`, `size-xl`, `size-xs` 의존성과 확장된 `col-*`, `show-*`, `hide-*` 클래스 범위를 포착한다.
- `layout` scaffold가 `.container`부터 다음 `.hero` 직전까지의 기존 CSS만 추출한다.
- 올바른 scaffold는 정적 검사를 통과한다.
- Sass 변수 또는 기존 클래스·breakpoint가 누락된 후보는 0이 아닌 결과로 실패한다.
- 경로 순회를 거부하고 저장소 source 및 기존 배포물을 수정하지 않는다.
- legacy 구간은 마지막 완전한 규칙에서 끝나 다음 컴포넌트의 부분 selector 클래스를 포함하지 않는다(`navbar`→`accordions` 회귀 테스트).
- `pnpm check:phase1`, `pnpm test`, `pnpm build:phase1`, `git diff --check`가 통과한다.

## 현재 결과

- 마이그레이션 도구와 `layout`, `hero`, `navbar` 패킷을 구현하고 검증했다.
- 기존 `spectra-css-migration` 스킬이 도구의 inspect/scaffold/verify 흐름과 정적 검사 한계를 안내한다.
- `layout` scaffold는 기존 `.container`부터 `.hero` 직전까지 추출됐고, `src/layout/layout.css`가 정적 검사를 통과했다. 원본 `_layout.scss`에 대한 negative verify는 남은 Sass와 breakpoint 불일치를 보고하며 종료 코드 1로 실패한다.
- `hero` scaffold는 `.hero`부터 `.navbar` 직전까지, `navbar` scaffold는 `.navbar`부터 `.accordions` 직전까지 추출됐다. 두 `src/layout/*.css`가 정적 검사를 통과했다.
- 실패 우선 증거: layout CSS가 없는 번들에서 `tests/visual/layout.spec.ts` 5개 중 4개가 실패했고, hero/navbar CSS가 없는 번들에서 `hero.spec.ts`·`navbar.spec.ts` 8개 중 6개가 실패했다. 변환 후 세 브라우저에서 layout 15개, hero 12개, navbar 12개가 모두 통과했다.
- `pnpm check:phase1`(경고 12건은 레거시 show/hide의 의도된 `!important`), `pnpm test` 11개, `pnpm build:phase1`, `pnpm test:visual` 51개, `git diff --check`가 통과했다.
- `dist/spectre*.css`와 `docs/dist/spectre*.css`는 변경하지 않았다. 레거시 일반 CSS SHA-256은 `c7f773ca3363bc5bd54b2849c0e37435c9e1afbb353fc1d79e16d422907fb924` 그대로다.
- Phase 02의 나머지 패킷(typography, asian, tables, media, forms, labels, codes, animations, utilities)은 아직 시작하지 않았다.
