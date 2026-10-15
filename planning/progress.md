# 진행 상태

갱신일: 2026-10-15

## 현재

- 요청 범위: [Phase 02](phase-02-core-elements-forms-layout-utilities.md)의 `typography`, `asian`, `tables`, `media` 작업 패킷.
- Phase 01 완료. Node.js 24.21.0, pnpm 12.5.1, lockfile, Lightning CSS 시험 빌드, Biome, Vitest, Playwright를 도입했다.
- `layout` 패킷을 완료했다. `src/layout/layout.css`가 `.container`, grid 최대 폭, `.cols/.columns`, `.col-{1..12}`, `.col-auto`, `.col-*` responsive, `.show-*`/`.hide-*`를 `--spectra-space-2` gutter와 정적 480/600/840/960/1280px 경계로 옮겼다.
- `hero`, `navbar` 패킷을 완료했다. `src/layout/hero.css`가 `.hero`/`.hero-sm`/`.hero-lg` padding과 `.hero-body`의 `--spectra-space-2`를, `src/layout/navbar.css`가 `.navbar`, `.navbar-section`, `.navbar-section:not(:first-child):last-child`, `.navbar-center`, `.navbar-brand`의 `--spectra-font-size-lg`를 평탄한 CSS로 옮겼다. 두 컴포넌트에는 media query와 상태 선택자가 없다.
- `typography`, `asian`, `tables`, `media` 패킷을 완료했다. `src/components/typography.css`가 h1–h6/`.h1`–`.h6`, `p`, `abbr[title]`, `kbd`, `mark`, `blockquote`, 중첩 `ul`/`ol`, `dl`을 옮겼고, `src/components/asian.css`가 `html:lang(...)`/`.lang-*` CJK font-family와 ins/u·인접 del 규칙을 옮겼다. `src/components/tables.css`가 `.table` 상태 배경·테두리·스크롤을, `src/components/media.css`가 이미지·비디오 비율·figure를 옮겼다. 네 컴포넌트 모두 media query가 없다.
- `src/spectra.css`는 tokens, normalize/base, typography, asian, tables, buttons, media, layout, hero, navbar 순서로 조립한다. `package.json`의 `check:phase1`은 `src/components`를 이미 포함한다.
- 도구 경계 버그를 고쳤다. legacy 구간이 다음 컴포넌트의 부분 selector에서 끝날 때 그 클래스가 새던 문제를 `scripts/css-migration.mts`의 `legacySlice`가 마지막 완전한 규칙까지만 남기도록 수정했고, `tests/build/css-migration.test.ts`에 회귀 테스트를 추가했다.
- Lightning CSS가 `position: absolute`의 `top/right/bottom/left`를 `inset`으로 접어 정적 검사가 누락으로 오인했다. `inset`을 해당 longhand의 커버리지로 계산하도록 도구를 확장하고 `media` 회귀 테스트를 추가했다.
- `tests/visual/`의 layout 5개, hero 4개, navbar 4개, typography 4개, asian 5개, tables 5개, media 4개 계약이 Chromium/Firefox/WebKit에서 통과했다. computed style은 0.05px 허용 오차(빌드 float32 직렬화), pixel은 byte 비교다. asian font-family 문자열은 브라우저별 따옴표 정규화를 피해 정규식으로 비교한다.
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
- `pnpm migrate:css verify <component> --target src/_<component>.scss`: layout/hero/navbar/typography/asian/tables/media 모두 의도대로 실패(잔존 Sass·breakpoint 누락 보고, 종료 코드 1).
- `pnpm check:phase1`: 통과. 경고 14건(레거시 `.show-*`/`.hide-*`의 의도된 `!important` 12건, typography 중첩 목록의 하위 명시도 선언 2건).
- `pnpm build:phase1`: 통과. 일반 27,757바이트, 압축 23,181바이트, gzip 일반 5,392바이트. navbar 시점은 21,051/17,441/4,135바이트다.
- `pnpm test`: 2개 파일 12개 통과. source map의 `src/components/{typography,asian,tables,media}.css`와 `src/layout/*.css` 포함 검사를 추가했고, `inset` 축약 회귀 테스트를 추가했다.
- `pnpm test:visual`: 세 브라우저 105개 통과(buttons 12 + layout 15 + hero 12 + navbar 12 + typography 12 + asian 15 + tables 15 + media 12).
- 실패 우선: typography/asian/tables/media CSS가 없는 번들에서 네 신규 spec 18개 중 15개가 실패했다(외부 override 3건은 라이브러리 CSS가 없어도 통과). layout 시점에 5개 중 4개, hero/navbar 시점에 8개 중 6개가 실패했다.
- `git diff --check`: 통과.
- Playwright Chromium/Firefox/WebKit 바이너리는 이전 세션에 설치했다.
- Safari/iOS Safari 16.4 실기기 검증은 미수행이다. Playwright WebKit 결과로 대체하지 않는다.

## 남은 결정

- `typography`, `asian`, `tables`, `media`는 기존 `src/components/`에 두었다. 문서 사이트는 이들을 `elements`로 묶으므로 forms/labels/codes 전환 후 `src/elements/` 분리 여부를 재검토한다.
- npm 식별자는 미확정이다. `spectra.css`는 후보이며 사용 가능 여부와 소유권은 Phase 06에서 확인한다.
- `pnpm-workspace.yaml`의 `allowBuilds`는 이번 세션에 생겼다. `node-sass` 거부는 이 환경 제약에 근거하며, Phase 06의 frozen clean install 전에 최종 allow/deny로 재검토한다.
- Pug 필터 대체 조합과 문서 빌드 전환은 Phase 05 범위다. 전체 문서 사이트가 새 빌드로 생성된 뒤 Phase 06에서 Gulp/Sass 제거 여부를 확정한다.

## 다음 단계

Phase 02의 `forms` 패킷을 테스트 우선으로 진행한다. `pnpm migrate:css inspect forms`로 클래스·media query·상태 선택자·Sass 의존성을 조사하고, 실패하는 computed style·상태/validation·token scope·외부 override 계약을 `tests/visual/forms.spec.ts`에 추가한 뒤 평탄한 CSS로 전환한다. 그 다음 `labels`, `codes`, `animations`와 `src/utilities/` 순서다. `forms`는 buttons 뒤 media 앞에 들어가야 기존 `src/spectre.scss` 순서를 유지한다.
