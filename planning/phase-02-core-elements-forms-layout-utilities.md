# Phase 02 — 기본 요소·forms·layout·utilities

상태: 진행 중 (마이그레이션 도구 세로 단위, 2026-09-22)

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

## 다음 패킷: layout

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
- `pnpm check:phase1`, `pnpm test`, `pnpm build:phase1`, `git diff --check`가 통과한다.

## 현재 결과

- 마이그레이션 도구와 `layout` 계약 테스트를 구현했다.
- 기존 `spectra-css-migration` 스킬이 도구의 inspect/scaffold/verify 흐름과 정적 검사 한계를 안내한다.
- `layout` scaffold는 기존 `.container`부터 `.hero` 직전까지 추출됐고 정적 검사를 통과했다. 원본 `_layout.scss`에 대한 negative verify는 남은 Sass와 breakpoint 불일치를 보고하며 종료 코드 1로 실패했다.
- `pnpm check:phase1`, `pnpm test` 10개, `pnpm build:phase1`, `git diff --check`가 통과했다.
- CSS와 시각 동작을 변경하지 않아 `pnpm test:visual`은 다시 실행하지 않았다. 마지막 Phase 01 기록은 세 브라우저 12개 통과다.
- Phase 02 컴포넌트 변환과 시각 검증은 아직 시작하지 않았다.
