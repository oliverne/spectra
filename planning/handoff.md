# 작업 인계

갱신일: 2026-09-21

## 현재 상태

- [Phase 01](phase-01-css-foundation.md)은 구현과 로컬 검증이 완료됐다.
- 전체 방향과 단계 순서는 [plan.md](plan.md), 실제 검증 상태는 [progress.md](progress.md)가 기준이다. 이 문서는 다음 세션의 진입점이며 상태의 원본이 아니다.
- 새 Pure CSS 세로 단위는 `src/spectra.css`가 tokens, normalize/base, buttons를 조립한다. 시험 산출물은 무시되는 `build/phase-01/`에만 생성된다.
- 기존 Gulp/Sass, Pug, `dist/spectre*.css`, `docs/dist/spectre*.css`, 패키지 `main`은 유지했다. 불완전한 `dist/spectra.css`를 만들지 않았다.

## 고정 결정과 주의점

- 프로젝트명은 Spectra, 공개 토큰 접두사는 `--spectra-*`다. 기존 공개 클래스와 기본 외형을 유지한다.
- 지원 범위는 최근 Chrome·Edge·Firefox 2개 major, Firefox ESR, Safari/iOS Safari 16.4 이상이다. IE와 EdgeHTML은 지원하지 않는다.
- Node.js 24.21.0과 pnpm 12.5.1을 사용한다. `pnpm-lock.yaml`을 유지하고 글로벌 사용자 설정은 수정하지 않는다.
- 기존 Node Sass 4.14.1 기반 빌드는 Node.js 24/macOS arm64에서 실행하지 못했다. SCSS 재컴파일이 필요하면 지원 종료된 Node Sass 대신 Dart Sass(`sass` 패키지)를 사용한다. Dart Sass 재컴파일은 아직 검증하지 않았으며, 컴파일러 교체에 따른 출력 차이가 있을 수 있으므로 체크인된 기존 CSS를 회귀 비교 기준으로 유지한다.
- Playwright WebKit 통과를 Safari 16.4 실기기 통과로 기록하지 않는다.
- npm 식별자, 정식 배포 경로, 패키지 `main`, Gulp/Sass 제거는 Phase 06 전까지 확정하거나 변경하지 않는다.

## 검증 상태

- `pnpm install --frozen-lockfile --ignore-scripts`, `pnpm build:phase1`, `pnpm check:phase1`, `pnpm test`, `git diff --check`가 통과했다.
- Chromium/Firefox/WebKit의 `pnpm test:visual` 12개 검사가 통과했다. 로컬 브라우저는 `PLAYWRIGHT_BROWSERS_PATH=0`으로 프로젝트 내부에 설치했으며, macOS 실행 샌드박스 밖에서 같은 환경 변수를 사용해 검증했다.
- Safari/iOS Safari 16.4 실기기 검증은 남아 있지만 Phase 02 착수의 차단 조건은 아니다.

## 다음 작업

사용자가 `model-handoff-workflow` Plan 모드로 Phase 02 착수를 명시하면 기본 요소·forms·layout·utilities의 실행 문서를 작성한다. Phase 1의 결정적 import 빌드, 파일별 source map, 토큰 scope, 기존 computed style 비교 계약을 확장하되 Phase 02 구현으로 자동 전환하지 않는다.
