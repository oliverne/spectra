# 작업 인계

갱신일: 2026-10-24

이 문서는 새 세션·모델·에이전트의 진입점이다. 상태의 원본은 [progress.md](progress.md), 전체 계약과 단계 순서는 [plan.md](plan.md), 완료된 직전 범위는 [Phase 02 문서](phase-02-core-elements-forms-layout-utilities.md)다. Phase 03 실행 문서는 아직 작성하지 않았다.

## 새 컨텍스트 시작 순서

1. 루트 `AGENTS.md`와 이 문서를 읽는다.
2. `planning/plan.md`, `planning/progress.md`, 현재 phase 문서를 읽는다.
3. `git status --short --branch`와 최근 커밋을 확인한다. 아래 변경 세트와 검증 기록은 2026-10-24 스냅샷이므로 현재 결과로 다시 확인한다.
4. Node.js `24.21.0`, pnpm `12.5.1`인지 확인한다.
5. 컴포넌트 전환에는 `.agents/skills/spectra-css-migration/SKILL.md`를 적용한다.
6. 현재 phase의 다음 미완료 작업 패킷 하나만 구현하고 검증한다. 완료되지 않은 phase를 건너뛰거나 다음 phase 구현으로 자동 전환하지 않는다.
7. 작업을 마칠 때 실제 결과로 phase 문서, `progress.md`, 이 문서를 갱신한다.

## 현재 체크포인트

- Phase 01과 Phase 02가 완료됐다. Phase 02는 마이그레이션 도구와 `layout`, `hero`, `navbar`, `typography`, `asian`, `tables`, `media`, `forms`, `labels`, `codes`, `animations`, `utilities` 패킷을 완료했다. 다음은 Phase 03 실행 문서 작성이다.
- `src/spectra.css`는 tokens, normalize/base, typography, asian, tables, buttons, forms, labels, codes, media, layout, hero, navbar, animations, utilities 순서로 조립한다. `src/components/*.css`, `src/layout/*.css`, `src/utilities/*.css`가 레거시 평탄 CSS를 담는다. Sass partial은 Phase 06까지 남겨둔다.
- `pnpm migrate:css inspect|scaffold|verify`가 SCSS 조사, 체크인된 기존 CSS 구간 추출, 후보의 정적 범위 검사를 제공한다. `legacySlice`는 마지막 완전한 규칙까지만 남겨 다음 컴포넌트의 부분 selector 클래스가 새지 않는다. `verify`는 Lightning CSS가 `top/right/bottom/left`를 접은 `inset` 축약을 물리 longhand 커버리지로 인정한다. selector 경계가 없는 구간은 `--legacy-start`/`--legacy-end`, 분할 파일은 `--target` 반복으로 검사하며 `@keyframes` 이름 누락을 실패로 계산한다.
- `layout`, `hero`, `navbar`, `typography`, `asian`, `tables`, `media`, `forms`, `labels`, `codes` 작업 패킷은 무시되는 `build/migration/<component>/`에 있다. `animations`와 `utilities`는 `legacy: null`이라 scaffold를 만들지 않았고 range verify로 정적 검사를 대신했다. 같은 workspace에서 파일이 존재하면 `scaffold`를 다시 실행하지 않는다(기존 패킷을 덮어쓰지 않고 실패한다). 새 checkout처럼 파일이 없으면 명령으로 재생성한다.
- 기존 Gulp/Sass, Pug, `dist/spectre*.css`, `docs/dist/spectre*.css`, 패키지 `main`은 유지돼 있다. 정식 `dist/spectra.css`는 아직 없다.
- `pnpm-workspace.yaml`이 이번 세션에 생겼다. `allowBuilds`에서 `node-sass`만 `false`이고 `core-js`, `es5-ext`, `fsevents`, `highlight.js`는 `true`다. node-sass postinstall은 darwin-arm64 바이너리 404와 python2 부재로 실패해 install을 막는다.

### animations, utilities 작업 변경 세트

아래 파일이 이번 패킷을 구성한다. 커밋 여부와 브랜치·원격 차이는 새 컨텍스트에서 Git으로 다시 확인한다.

```text
modified  package.json
modified  scripts/css-migration.mts
modified  src/spectra.css
modified  src/tokens.css
modified  tests/build/css-build.test.ts
modified  tests/build/css-migration.test.ts
added     src/utilities/animations.css
added     src/utilities/colors.css
added     src/utilities/cursors.css
added     src/utilities/display.css
added     src/utilities/divider.css
added     src/utilities/loading.css
added     src/utilities/position.css
added     src/utilities/shapes.css
added     src/utilities/text.css
added     tests/visual/animations.spec.ts
added     tests/visual/utilities.spec.ts
modified  .agents/skills/spectra-css-migration/SKILL.md
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
build/migration/{layout,hero,navbar,typography,asian,tables,media,forms,labels,codes}/{inspection.json,legacy.css,candidate.css}
```

이 변경 세트에는 새 의존성이 없고 `pnpm-lock.yaml`은 바뀌지 않았다.

## 마지막 검증 근거

- `pnpm migrate:css verify animations --target src/utilities/animations.css --legacy-start "@keyframes loading" --legacy-end ".text-primary"`: 통과. 누락 keyframe·속성이 없다.
- `pnpm migrate:css verify utilities --legacy-start ".text-primary"` + `src/utilities/*.css` 8개 반복 target: 통과. 누락 클래스·keyframe·media query·표준 속성이 없다.
- `pnpm migrate:css verify <component> --target src/_<component>.scss`: layout/hero/navbar/typography/asian/tables/media/forms/labels/codes 모두 의도대로 종료 코드 1. 잔존 Sass와 breakpoint 불일치를 보고했다.
- `pnpm test`: 2개 파일 13개 통과. source map의 `src/components/*.css`, `src/layout/*.css`, `src/utilities/*.css` 포함 검사를 추가했다. range verify·keyframe 누락·다중 target·잘못된 start selector 회귀 검사를 추가했다.
- 실패 우선: animations/utilities CSS가 없는 번들에서 `tests/visual/{animations,utilities}.spec.ts` 36개 중 33개가 실패했다(외부 override 3건은 라이브러리 CSS가 없어도 통과).
- `pnpm test:visual`: Chromium/Firefox/WebKit 183개 통과(기존 147 + animations 12 + utilities 24). animations는 keyframes 값·`.loading` 기하·token scope·외부 override를, utilities는 색상·hover/focus·display·divider·position·spacing·shape·text·`!important`를 검증한다.
- `pnpm check:phase1`: 통과. 경고 108건(레거시 show/hide 12건, typography 2건, forms 17건, utilities의 레거시 `!important` 77건). utilities 경고는 레거시 의미 보존 결과다.
- `pnpm build:phase1`: 통과. 일반 58,672바이트, 압축 50,214바이트, gzip 일반 9,337바이트(labels/codes 시점 46,605/40,021/7,551).
- WebKit에서 `:root` custom property가 있을 때 단일 `<select>`의 `getComputedStyle`이 rem 기반 값을 초기 16px root로 보고하는 현상을 확인했다. 실제 렌더링은 legacy와 byte-identical이므로 CSS 보정을 넣지 않았고, WebKit에 한해 select computed style 비교만 제외한 뒤 pixel 비교를 유지했다. 1.25배 CSS 보정은 실제 렌더링을 확대해 회귀를 만들었다.
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
- helper는 `src/spectre.scss`의 직접 import이면서 명확한 selector 경계가 있는 컴포넌트를 scaffold한다. keyframes로 시작하는 `animations`와 간접 aggregator인 `utilities`는 `legacy: null`이므로 `verify --legacy-start/--legacy-end`와 반복 `--target`으로 검사한다.
- helper의 legacy 구간은 마지막 완전한 규칙에서 끝난다. 다음 컴포넌트의 부분 selector 클래스가 섞이지 않는다.
- `typography`, `asian`, `tables`, `media`, `forms`, `labels`, `codes`는 기존 `src/components/`에 두었다. 문서 사이트는 이를 `elements`로 묶으므로 `src/elements/` 분리 여부를 Phase 03 문서에서 결정한다.
- Firefox는 `small`의 80% font-size를 `12.7969px`로, WebKit은 중첩 `code`의 `line-height`를 `20.400002px`로 보고한다. labels/codes 계약은 절대값 대신 허용 오차와 line-height 비율(1.25/1.5)로 검증한다. Firefox/WebKit은 `text-*` em font-size를 `19.1875px`/`19.200001px`처럼 다르게 보고하므로 utilities 계약은 `toBeCloseTo`를 쓴다. `:visited`는 규칙·토큰 존재만 정적으로 확인한다.
- WebKit의 단일 `<select>` computed style 보고 차이는 실제 렌더링과 무관한 브라우저 동작이다. `forms.spec.ts`는 WebKit에서 select computed style만 제외하고 pixel 비교를 유지한다. CSS 보정으로 computed style을 맞추면 실제 렌더링이 확대되므로 금지한다. Safari 실기기에서도 같은 현상인지 확인하려면 Phase 04–05의 실기기 검증이 필요하다.
- npm 식별자, 정식 배포 경로, `package.json`의 `main`, Gulp/Sass 제거는 Phase 06 전까지 확정하거나 변경하지 않는다.
- 기존 라이선스·저작권·원작자 출처와 역사 기록을 유지한다.

## 즉시 재개할 작업

Phase 02는 완료됐다. 다음은 [plan.md의 Phase 03](plan.md) 실행 문서를 작성하는 것이다. accordions, avatars, badges, breadcrumbs, bars, cards, chips, dropdowns, empty, menus, modals, navs, pagination, panels, popovers, steps, tabs, tiles, toasts, tooltips의 의존 그룹·순서·상태·pseudo-element·CSS-only 상호작용 계약을 정하고, `src/elements/` 분리 여부도 함께 결정한다. Phase 03 구현은 실행 문서가 준비된 뒤 시작한다.

Phase 02의 나머지 패킷 순서와 수용 조건·검증 명령은 Phase 02 문서를 따른다. Phase 03–06의 범위와 단계 전환 규칙은 [plan.md의 `이후 단계 실행 로드맵`](plan.md)을 따른다. 현재 패킷이나 phase가 완료되기 전 다음 범위로 자동 전환하지 않는다.

## 다음 인계 때 갱신할 내용

- 완료한 작업 패킷과 실제 변경 파일
- 실행한 명령과 결과, 미실행 또는 환경 제한 검증
- 현재 Git 상태와 ignored 작업물의 재생성 필요 여부
- 남은 결정·차단 조건과 다음 한 작업 패킷
