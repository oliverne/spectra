# 진행 상태

갱신일: 2026-10-24

## 현재

- 요청 범위: [Phase 02](phase-02-core-elements-forms-layout-utilities.md)의 `labels`, `codes` 작업 패킷 완료. 다음은 `animations`, `utilities`.
- Phase 01 완료. Node.js 24.21.0, pnpm 12.5.1, lockfile, Lightning CSS 시험 빌드, Biome, Vitest, Playwright를 도입했다.
- `layout` 패킷을 완료했다. `src/layout/layout.css`가 `.container`, grid 최대 폭, `.cols/.columns`, `.col-{1..12}`, `.col-auto`, `.col-*` responsive, `.show-*`/`.hide-*`를 `--spectra-space-2` gutter와 정적 480/600/840/960/1280px 경계로 옮겼다.
- `hero`, `navbar` 패킷을 완료했다. `src/layout/hero.css`가 `.hero`/`.hero-sm`/`.hero-lg` padding과 `.hero-body`의 `--spectra-space-2`를, `src/layout/navbar.css`가 `.navbar`, `.navbar-section`, `.navbar-section:not(:first-child):last-child`, `.navbar-center`, `.navbar-brand`의 `--spectra-font-size-lg`를 평탄한 CSS로 옮겼다. 두 컴포넌트에는 media query와 상태 선택자가 없다.
- `typography`, `asian`, `tables`, `media` 패킷을 완료했다. `src/components/typography.css`가 h1–h6/`.h1`–`.h6`, `p`, `abbr[title]`, `kbd`, `mark`, `blockquote`, 중첩 `ul`/`ol`, `dl`을 옮겼고, `src/components/asian.css`가 `html:lang(...)`/`.lang-*` CJK font-family와 ins/u·인접 del 규칙을 옮겼다. `src/components/tables.css`가 `.table` 상태 배경·테두리·스크롤을, `src/components/media.css`가 이미지·비디오 비율·figure를 옮겼다. 네 컴포넌트 모두 media query가 없다.
- `forms` 패킷을 완료했다. `src/components/forms.css`가 `.form-group`, `fieldset`/`legend`, `.form-label` 변형, `.form-input`/`textarea`/`.form-select`의 기본·focus·placeholder·size·disabled/readonly, icon wrapper, checkbox/radio/switch의 checked/indeterminate/active/focus/error, input group, validation state, horizontal/inline을 옮겼다. media query는 없다. `src/tokens.css`에 `--spectra-color-text-subtle`, `--spectra-color-border-dark`, `--spectra-color-success-surface`, `--spectra-color-error-surface`, `--spectra-control-icon-size`, `--spectra-control-padding-{x,y}{,-sm,-lg}`를 추가했다.
- `labels`, `codes` 패킷을 완료했다. `src/components/labels.css`가 `.label` 기본(배경·`--spectra-color-text-soft`·radius·padding·`inline-block`)과 `.label-rounded`, `primary`/`secondary`/`success`/`warning`/`error` 변형을 옮겼다. `src/components/codes.css`가 `code` 요소의 `font-size: 85%`, `.code`의 `position: relative`, `.code::before`의 `attr(data-lang)` 라벨, `.code code`의 block·스크롤·`--spectra-space-5` padding을 옮겼다. 두 컴포넌트 모두 media query·상태 선택자가 없다. `src/tokens.css`에 `--spectra-color-text-soft`, `--spectra-color-warning`, `--spectra-color-code`, `--spectra-color-code-surface`를 추가했다.
- `src/spectra.css`는 tokens, normalize/base, typography, asian, tables, buttons, forms, labels, codes, media, layout, hero, navbar 순서로 조립한다. `package.json`의 `check:phase1`은 `src/components`를 이미 포함한다.
- 도구 경계 버그를 고쳤다. legacy 구간이 다음 컴포넌트의 부분 selector에서 끝날 때 그 클래스가 새던 문제를 `scripts/css-migration.mts`의 `legacySlice`가 마지막 완전한 규칙까지만 남기도록 수정했고, `tests/build/css-migration.test.ts`에 회귀 테스트를 추가했다.
- Lightning CSS가 `position: absolute`의 `top/right/bottom/left`를 `inset`으로 접어 정적 검사가 누락으로 오인했다. `inset`을 해당 longhand의 커버리지로 계산하도록 도구를 확장하고 `media` 회귀 테스트를 추가했다.
- `tests/visual/`의 layout 5개, hero 4개, navbar 4개, typography 4개, asian 5개, tables 5개, media 4개, forms 6개, labels 4개, codes 4개 계약이 Chromium/Firefox/WebKit에서 통과했다. computed style은 0.05px 허용 오차(빌드 float32 직렬화), pixel은 byte 비교다. asian font-family 문자열은 브라우저별 따옴표 정규화를 피해 정규식으로 비교한다. forms는 상태·validation·input group·token override·외부 override를 검증한다.
- WebKit은 `:root` custom property가 있을 때 단일 `<select>`의 `getComputedStyle`에서 rem 기반 값을 초기 16px root로 보고하지만, 실제 렌더링은 기존 20px root와 byte-identical이다. `tests/visual/forms.spec.ts`는 WebKit에서만 select computed style 비교를 제외하고 pixel 비교는 모든 브라우저에서 유지한다. CSS 보정은 실제 렌더링을 1.25배 확대해 회귀를 만들므로 넣지 않았다.
- 기존 Gulp/Sass, Pug, `dist/spectre*.css`, `docs/dist/spectre*.css`, 패키지 `main`은 유지했다. 레거시 일반 CSS SHA-256은 `c7f773ca3363bc5bd54b2849c0e37435c9e1afbb353fc1d79e16d422907fb924`로 변하지 않았다.
- 기존 Node Sass 4.14.1 기반 빌드는 Node.js 24/macOS arm64 환경에서 실행하지 못한다. Dart Sass 재컴파일도 검증하지 않았다.
- `pnpm approve-builds`가 비대화형 셸에서 `IO error: not a terminal`로 실패하면서 `pnpm-workspace.yaml`이 생성됐다. `allowBuilds`에서 `node-sass`는 `false`, 나머지(`core-js`, `es5-ext`, `fsevents`, `highlight.js`)는 `true`로 두어 install이 통과한다. node-sass는 darwin-arm64 바이너리 404와 python2 부재로 빌드할 수 없다.

## 검증

- `pnpm migrate:css verify layout --target src/layout/layout.css`: 통과.
- `pnpm migrate:css verify hero --target src/layout/hero.css`: 통과.
- `pnpm migrate:css verify navbar --target src/layout/navbar.css`: 통과.
- `pnpm migrate:css verify typography --target src/components/typography.css`: 통과.
- `pnpm migrate:css verify asian --target src/components/asian.css`: 통과.
- `pnpm migrate:css verify tables --target src/components/tables.css`: 통과.
- `pnpm migrate:css verify media --target src/components/media.css`: 통과(Lightning CSS의 `inset` 축약 인식 적용).
- `pnpm migrate:css verify forms --target src/components/forms.css`: 통과.
- `pnpm migrate:css verify labels --target src/components/labels.css`: 통과.
- `pnpm migrate:css verify codes --target src/components/codes.css`: 통과.
- `pnpm migrate:css verify <component> --target src/_<component>.scss`: layout/hero/navbar/typography/asian/tables/media/forms/labels/codes 모두 의도대로 실패(잔존 Sass·breakpoint 누락 보고, 종료 코드 1).
- `pnpm check:phase1`: 통과. 경고 31건(레거시 `.show-*`/`.hide-*`의 의도된 `!important` 12건, typography 중첩 목록의 하위 명시도 선언 2건, forms의 legacy cascade 순서에서 발생하는 descending specificity 17건).
- `pnpm build:phase1`: 통과. 일반 46,605바이트, 압축 40,021바이트, gzip 일반 7,551바이트. forms 시점은 44,511/38,190/7,331바이트다.
- `pnpm test`: 2개 파일 12개 통과. source map의 `src/components/{typography,asian,tables,buttons,forms,labels,codes,media}.css`와 `src/layout/*.css` 포함 검사를 추가했다.
- `pnpm test:visual`: 세 브라우저 147개 통과(buttons 12 + layout 15 + hero 12 + navbar 12 + typography 12 + asian 15 + tables 15 + media 12 + forms 6 + labels 12 + codes 12).
- 실패 우선: labels/codes CSS가 없는 번들에서 두 신규 spec 24개 중 18개가 실패했다(후행 외부 override 6건은 라이브러리 CSS가 없어도 통과). 변환 후 147개가 모두 통과했다.
- `git diff --check`: 통과.
- Playwright Chromium/Firefox/WebKit 바이너리는 이전 세션에 설치했다.
- Safari/iOS Safari 16.4 실기기 검증은 미수행이다. Playwright WebKit 결과로 대체하지 않는다.

## 남은 결정

- WebKit의 select computed style 보고 차이는 실제 렌더링과 무관한 브라우저 동작이다. forms 테스트는 WebKit에서 select computed style만 제외하고 pixel 비교를 유지한다. Safari 실기기에서도 같은 현상인지 확인하려면 Phase 04–05의 실기기 검증이 필요하다.
- `typography`, `asian`, `tables`, `media`, `forms`, `labels`, `codes`는 기존 `src/components/`에 두었다. 문서 사이트는 이들을 `elements`로 묶으므로 Phase 02 종료 시 `src/elements/` 분리 여부를 재검토한다.
- Firefox는 `small`의 80% font-size를 `12.7969px`로, WebKit은 중첩 `code`의 `line-height`를 `20.400002px`로 보고한다. labels/codes 계약은 절대값 대신 허용 오차와 line-height 비율(1.25/1.5)로 검증한다.
- npm 식별자는 미확정이다. `spectra.css`는 후보이며 사용 가능 여부와 소유권은 Phase 06에서 확인한다.
- `pnpm-workspace.yaml`의 `allowBuilds`는 이번 세션에 생겼다. `node-sass` 거부는 이 환경 제약에 근거하며, Phase 06의 frozen clean install 전에 최종 allow/deny로 재검토한다.
- Pug 필터 대체 조합과 문서 빌드 전환은 Phase 05 범위다. 전체 문서 사이트가 새 빌드로 생성된 뒤 Phase 06에서 Gulp/Sass 제거 여부를 확정한다.

## 다음 단계

Phase 02의 `animations`, `utilities` 패킷을 테스트 우선으로 진행한다. 두 항목은 helper에서 `legacy: null`이므로 `src/_animations.scss`의 keyframes와 `src/utilities/*.scss`의 mixin·interpolation 확장 결과를 `dist/spectre.css`에서 직접 조사해야 한다. 실패하는 computed style·pixel·token scope·외부 override 계약을 `tests/visual/{animations,utilities}.spec.ts`에 추가한 뒤 평탄한 CSS로 전환하고 `src/spectra.css`의 navbar 뒤 legacy 순서로 import한다.
