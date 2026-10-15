# 작업 인계

갱신일: 2026-10-15

이 문서는 새 세션·모델·에이전트의 진입점이다. 상태의 원본은 [progress.md](progress.md), 전체 계약과 단계 순서는 [plan.md](plan.md), 현재 실행 범위는 [Phase 02 문서](phase-02-core-elements-forms-layout-utilities.md)다.

## 새 컨텍스트 시작 순서

1. 루트 `AGENTS.md`와 이 문서를 읽는다.
2. `planning/plan.md`, `planning/progress.md`, 현재 phase 문서를 읽는다.
3. `git status --short --branch`와 최근 커밋을 확인한다. 아래 변경 세트와 검증 기록은 2026-10-15 스냅샷이므로 현재 결과로 다시 확인한다.
4. Node.js `24.21.0`, pnpm `12.5.1`인지 확인한다.
5. 컴포넌트 전환에는 `.agents/skills/spectra-css-migration/SKILL.md`를 적용한다.
6. 현재 phase의 다음 미완료 작업 패킷 하나만 구현하고 검증한다. 완료되지 않은 phase를 건너뛰거나 다음 phase 구현으로 자동 전환하지 않는다.
7. 작업을 마칠 때 실제 결과로 phase 문서, `progress.md`, 이 문서를 갱신한다.

## 현재 체크포인트

- Phase 01은 구현과 로컬 검증이 완료됐다. Phase 02는 마이그레이션 도구와 `layout`, `hero`, `navbar`, `typography`, `asian`, `tables`, `media` 패킷을 완료했다. 다음은 `forms`다.
- `src/spectra.css`는 tokens, normalize/base, typography, asian, tables, buttons, media, layout, hero, navbar 순서로 조립한다. `src/components/{typography,asian,tables,media}.css`와 `src/layout/{layout,hero,navbar}.css`가 레거시 평탄 CSS를 담는다. 아직 전환하지 않은 forms·labels·codes가 buttons 뒤 media 앞에 들어간다.
- `pnpm migrate:css inspect|scaffold|verify`가 SCSS 조사, 체크인된 기존 CSS 구간 추출, 후보의 정적 범위 검사를 제공한다. `legacySlice`는 마지막 완전한 규칙까지만 남겨 다음 컴포넌트의 부분 selector 클래스가 새지 않는다. `verify`는 Lightning CSS가 `top/right/bottom/left`를 접은 `inset` 축약을 물리 longhand 커버리지로 인정한다.
- `layout`, `hero`, `navbar`, `typography`, `asian`, `tables`, `media` 작업 패킷은 무시되는 `build/migration/<component>/`에 있다. 같은 workspace에서 파일이 존재하면 `scaffold`를 다시 실행하지 않는다(기존 패킷을 덮어쓰지 않고 실패한다). 새 checkout처럼 파일이 없으면 명령으로 재생성한다.
- 기존 Gulp/Sass, Pug, `dist/spectre*.css`, `docs/dist/spectre*.css`, 패키지 `main`은 유지돼 있다. 정식 `dist/spectra.css`는 아직 없다.
- `pnpm-workspace.yaml`이 이번 세션에 생겼다. `allowBuilds`에서 `node-sass`만 `false`이고 `core-js`, `es5-ext`, `fsevents`, `highlight.js`는 `true`다. node-sass postinstall은 darwin-arm64 바이너리 404와 python2 부재로 실패해 install을 막는다.

### typography/asian/tables/media 작업 변경 세트

아래 파일이 이번 패킷을 구성한다. 커밋 여부와 브랜치·원격 차이는 새 컨텍스트에서 Git으로 다시 확인한다.

```text
modified  scripts/css-migration.mts
modified  src/spectra.css
modified  src/tokens.css
modified  tests/build/css-build.test.ts
modified  tests/build/css-migration.test.ts
added     src/components/typography.css
added     src/components/asian.css
added     src/components/tables.css
added     src/components/media.css
added     tests/visual/typography.spec.ts
added     tests/visual/asian.spec.ts
added     tests/visual/tables.spec.ts
added     tests/visual/media.spec.ts
modified  planning/handoff.md
modified  planning/progress.md
modified  planning/phase-02-core-elements-forms-layout-utilities.md
modified  planning/plan.md
```

무시되는 작업물:

```text
build/phase-01/spectra.css
build/phase-01/spectra.css.map
build/phase-01/spectra.min.css
build/migration/{layout,hero,navbar,typography,asian,tables,media}/{inspection.json,legacy.css,candidate.css}
```

이 변경 세트에는 새 의존성이 없고 `pnpm-lock.yaml`은 바뀌지 않았다.

## 마지막 검증 근거

- `pnpm migrate:css verify typography|asian|tables|media --target src/components/<component>.css`: 통과. 누락 클래스·media query·표준 속성이 없다.
- `pnpm migrate:css verify <component> --target src/_<component>.scss`: layout/hero/navbar/typography/asian/tables/media 모두 의도대로 종료 코드 1. 잔존 Sass와 breakpoint 불일치를 보고했다.
- `pnpm test`: 2개 파일 12개 통과. source map의 `src/components/{typography,asian,tables,media}.css` 포함 검사를 추가했고, migration 경계 및 `inset` 축약 회귀 테스트를 추가했다.
- 실패 우선: typography/asian/tables/media CSS가 없는 번들에서 네 신규 spec 18개 중 15개가 실패했고(외부 override 3건은 라이브러리 CSS가 없어도 통과), layout 시점 5개 중 4개, hero/navbar 시점 8개 중 6개가 실패했다.
- `pnpm test:visual`: Chromium/Firefox/WebKit 105개 통과(buttons 12 + layout 15 + hero 12 + navbar 12 + typography 12 + asian 15 + tables 15 + media 12). typography는 heading·강조·목록·token override·외부 override를, asian은 CJK font-family·ins/u·인접 del·token override·외부 override를, tables는 상태 배경·테두리·스크롤·token override·외부 override를, media는 이미지·비디오 비율·figure·token override·외부 override를 검증한다.
- `pnpm check:phase1`: 통과. 경고 14건(레거시 show/hide의 의도된 `!important` 12건, typography 중첩 목록의 하위 명시도 선언 2건).
- `pnpm build:phase1`: 통과. 일반 27,757바이트, 압축 23,181바이트, gzip 일반 5,392바이트(navbar 시점 21,051/17,441/4,135).
- `git diff --check`: 통과. `dist/spectre*.css`와 docs 사본은 변경하지 않았고 SHA-256 `c7f773ca3363bc5bd54b2849c0e37435c9e1afbb353fc1d79e16d422907fb924`가 유지됐다.
- Playwright 세 브라우저 바이너리는 이전 세션에 설치했다.
- Safari/iOS Safari 16.4 실기기 검증은 미수행이다. Playwright WebKit 결과로 대체하지 않는다.

## 고정 결정과 주의점

- 프로젝트명은 Spectra, 공개 토큰 접두사는 `--spectra-*`다. 공개 클래스, 기본 외형, selector 상세도·순서와 외부 override를 유지한다.
- 표준 CSS와 평탄한 selector를 사용한다. native nesting과 cascade layer를 도입하지 않는다.
- 지원 범위는 최근 Chrome·Edge·Firefox 2개 major, Firefox ESR, Safari/iOS Safari 16.4 이상이다. IE와 EdgeHTML은 지원하지 않는다.
- media query의 480/600/840/960/1280/1440px 경계는 정적 값으로 유지한다. media query 조건에 CSS 변수를 사용하지 않는다.
- Sass의 `darken`, `lighten`, `rgba`, `lightness` 결과를 근사하지 않는다. 체크인된 기존 CSS의 계산 결과를 상태·대비·alpha 토큰으로 명시한다.
- 기존 Node Sass 4.14.1 빌드는 실행하지 못한다. `pnpm-workspace.yaml`의 `allowBuilds`에서 `node-sass: false`로 두어 pnpm 명령이 install 단계에서 막히지 않게 한다. 다른 승인 빌드는 통과한다. 이 allow/deny는 Phase 06 clean install 전에 재검토한다.
- migration `candidate.css`는 기존 CSS의 작업용 사본이다. 정적 `verify` 통과는 token scope, cascade, computed style, 픽셀 parity를 증명하지 않는다.
- Lightning CSS는 `position: absolute`의 `top/right/bottom/left`를 `inset`으로 접는다. `verify`는 `inset`이 있으면 네 물리 longhand가 커버된 것으로 본다(축약은 항상 네 변을 재설정한다).
- Lightning CSS가 숫자를 float32·6자리로 직렬화한다. `8.33333333%`가 `8.33333%`로 저장돼 일부 viewport에서 column computed width가 layout unit(1/60~1/64px)만큼 어긋난다. layout 시각 계약은 0.05px 허용 오차를 쓰고 pixel은 byte 비교를 유지한다. 소스의 calc·custom property 형태로도 정밀도를 되돌릴 수 없다.
- helper는 `src/spectre.scss`의 직접 import이면서 명확한 selector 경계가 있는 컴포넌트를 scaffold한다. keyframes로 시작하는 `animations`와 간접 aggregator인 `utilities`는 `legacy: null`이므로 수동 경계 조사 또는 phase 계약에 따른 도구 확장이 필요하다.
- helper의 legacy 구간은 마지막 완전한 규칙에서 끝난다. 다음 컴포넌트의 부분 selector 클래스가 섞이지 않는다.
- `typography`, `asian`, `tables`, `media`는 기존 `src/components/`에 두었다. 문서 사이트는 이를 `elements`로 묶으므로 forms/labels/codes 전환 후 `src/elements/` 분리 여부를 재검토한다.
- npm 식별자, 정식 배포 경로, `package.json`의 `main`, Gulp/Sass 제거는 Phase 06 전까지 확정하거나 변경하지 않는다.
- 기존 라이선스·저작권·원작자 출처와 역사 기록을 유지한다.

## 즉시 재개할 작업

[Phase 02 문서의 `다음 패킷: forms`](phase-02-core-elements-forms-layout-utilities.md)를 테스트 우선으로 실행한다. 첫 작업은 `pnpm migrate:css inspect forms`로 클래스·media query·상태 선택자·Sass 의존성을 조사하고 패킷을 scaffold하는 것이다. 이어서 상태·validation·input group과 색상 계산 범위를 수용 조건으로 정하고, 실패하는 visual 계약을 추가한 뒤 `src/components/forms.css`를 평탄한 CSS로 작성해 `src/spectra.css`의 buttons 뒤 media 앞에 import한다.

Phase 02의 나머지 패킷 순서와 수용 조건·검증 명령은 Phase 02 문서를 따른다. Phase 03–06의 범위와 단계 전환 규칙은 [plan.md의 `이후 단계 실행 로드맵`](plan.md)을 따른다. 현재 패킷이나 phase가 완료되기 전 다음 범위로 자동 전환하지 않는다.

## 다음 인계 때 갱신할 내용

- 완료한 작업 패킷과 실제 변경 파일
- 실행한 명령과 결과, 미실행 또는 환경 제한 검증
- 현재 Git 상태와 ignored 작업물의 재생성 필요 여부
- 남은 결정·차단 조건과 다음 한 작업 패킷
