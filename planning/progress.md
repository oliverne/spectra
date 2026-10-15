# 진행 상태

갱신일: 2026-10-15

## 현재

- 요청 범위: [Phase 02](phase-02-core-elements-forms-layout-utilities.md)의 `hero`, `navbar` 작업 패킷.
- Phase 01 완료. Node.js 24.21.0, pnpm 12.5.1, lockfile, Lightning CSS 시험 빌드, Biome, Vitest, Playwright를 도입했다.
- `layout` 패킷을 완료했다. `src/layout/layout.css`가 `.container`, grid 최대 폭, `.cols/.columns`, `.col-{1..12}`, `.col-auto`, `.col-*` responsive, `.show-*`/`.hide-*`를 `--spectra-space-2` gutter와 정적 480/600/840/960/1280px 경계로 옮겼다.
- `hero`, `navbar` 패킷을 완료했다. `src/layout/hero.css`가 `.hero`/`.hero-sm`/`.hero-lg` padding과 `.hero-body`의 `--spectra-space-2`를, `src/layout/navbar.css`가 `.navbar`, `.navbar-section`, `.navbar-section:not(:first-child):last-child`, `.navbar-center`, `.navbar-brand`의 `--spectra-font-size-lg`를 평탄한 CSS로 옮겼다. 두 컴포넌트에는 media query와 상태 선택자가 없다.
- `src/spectra.css`는 tokens, normalize/base, buttons, layout, hero, navbar 순서로 조립한다. `package.json`의 `check:phase1`은 `src/layout`을 포함한다.
- 도구 경계 버그를 고쳤다. legacy 구간이 다음 컴포넌트의 부분 selector에서 끝날 때 그 클래스가 새던 문제를 `scripts/css-migration.mts`의 `legacySlice`가 마지막 완전한 규칙까지만 남기도록 수정했고, `tests/build/css-migration.test.ts`에 회귀 테스트를 추가했다.
- `tests/visual/`의 layout 5개, hero 4개, navbar 4개 계약이 Chromium/Firefox/WebKit에서 통과했다. computed style은 0.05px 허용 오차(빌드 float32 직렬화), pixel은 byte 비교다.
- 기존 Gulp/Sass, Pug, `dist/spectre*.css`, `docs/dist/spectre*.css`, 패키지 `main`은 유지했다. 레거시 일반 CSS SHA-256은 `c7f773ca3363bc5bd54b2849c0e37435c9e1afbb353fc1d79e16d422907fb924`로 변하지 않았다.
- 기존 Node Sass 4.14.1 기반 빌드는 Node.js 24/macOS arm64 환경에서 실행하지 못한다. Dart Sass 재컴파일도 검증하지 않았다.
- `pnpm approve-builds`가 비대화형 셸에서 `IO error: not a terminal`로 실패하면서 `pnpm-workspace.yaml`이 생성됐다. `allowBuilds`에서 `node-sass`는 `false`, 나머지(`core-js`, `es5-ext`, `fsevents`, `highlight.js`)는 `true`로 두어 install이 통과한다. node-sass는 darwin-arm64 바이너리 404와 python2 부재로 빌드할 수 없다.

## 검증

- `pnpm migrate:css verify layout --target src/layout/layout.css`: 통과.
- `pnpm migrate:css verify hero --target src/layout/hero.css`: 통과.
- `pnpm migrate:css verify navbar --target src/layout/navbar.css`: 통과.
- `pnpm migrate:css verify <component> --target src/_<component>.scss`: layout/hero/navbar 모두 의도대로 실패(잔존 Sass 보고, 종료 코드 1).
- `pnpm check:phase1`: 통과. 경고 12건은 레거시 `.show-*`/`.hide-*`의 의도된 `!important`다.
- `pnpm build:phase1`: 통과. 일반 21,051바이트, 압축 17,441바이트, gzip 일반 4,135바이트. layout 시점은 20,267/16,794/3,963바이트다.
- `pnpm test`: 2개 파일 11개 통과. source map의 `src/layout/{layout,hero,navbar}.css` 포함 검사를 추가했다.
- `pnpm test:visual`: 세 브라우저 51개 통과(buttons 12 + layout 15 + hero 12 + navbar 12).
- 실패 우선: hero/navbar CSS가 없는 번들에서 hero/navbar spec 8개 중 6개가 실패했다(외부 override 2건은 라이브러리 CSS가 없어도 통과). 신규 도구 회귀 테스트도 수정 전 실패했다.
- `git diff --check`: 통과.
- Playwright Chromium/Firefox/WebKit 바이너리는 이전 세션에 설치했다.
- Safari/iOS Safari 16.4 실기기 검증은 미수행이다. Playwright WebKit 결과로 대체하지 않는다.

## 남은 결정

- npm 식별자는 미확정이다. `spectra.css`는 후보이며 사용 가능 여부와 소유권은 Phase 06에서 확인한다.
- `pnpm-workspace.yaml`의 `allowBuilds`는 이번 세션에 생겼다. `node-sass` 거부는 이 환경 제약에 근거하며, Phase 06의 frozen clean install 전에 최종 allow/deny로 재검토한다.
- Pug 필터 대체 조합과 문서 빌드 전환은 Phase 05 범위다. 전체 문서 사이트가 새 빌드로 생성된 뒤 Phase 06에서 Gulp/Sass 제거 여부를 확정한다.

## 다음 단계

Phase 02의 `typography`, `asian`, `tables`, `media` 패킷을 테스트 우선으로 진행한다. `pnpm migrate:css inspect`로 경계를 조사하고, 실패하는 visual 계약을 추가한 뒤 평탄한 CSS로 전환한다. 기존 `src/spectre.scss`는 typography→asian→tables→buttons→…→media 순서이므로 `src/spectra.css`에서 buttons 앞으로 들어갈 파일과 media 위치를 먼저 확정한다.
