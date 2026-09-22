# 진행 상태

갱신일: 2026-09-22

## 현재

- 요청 범위: [Phase 02](phase-02-core-elements-forms-layout-utilities.md)의 마이그레이션 도구 세로 단위.
- Phase 01 완료. Node.js 24.21.0, pnpm 12.5.1, lockfile, Lightning CSS 시험 빌드, Biome, Vitest, Playwright를 도입했다.
- `src/spectra.css` 아래에 `--spectra-*` tokens, normalize/base, buttons의 Pure CSS 세로 단위를 구현했다. 일반·압축 CSS와 원본 파일별 source map은 무시되는 `build/phase-01/`에 생성된다.
- `pnpm migrate:css`에 `inspect`, `scaffold`, `verify` 명령을 구현했다. 직접 import된 SCSS 컴포넌트의 의존성과 기존 배포 CSS 구간을 조사하고, 무시되는 작업 패킷을 만들며, 후보의 CSS 구문·남은 Sass·클래스·media query·표준 속성 범위를 검사한다.
- `layout` 작업 패킷을 `build/migration/layout/`에 생성해 정적 검사를 통과시켰다. 이 후보는 기존 CSS 작업 사본이며 아직 `src/`에 통합하지 않았다.
- 기존 Gulp/Sass, Pug, `dist/spectre*.css`, `docs/dist/spectre*.css`, 패키지 `main`은 유지했다. 불완전한 새 번들을 배포 경로에 노출하지 않았다.
- 기존 일반 CSS 62,359바이트와 문서 사본의 SHA-256은 `c7f773ca3363bc5bd54b2849c0e37435c9e1afbb353fc1d79e16d422907fb924`로 일치한다. 압축본도 양쪽 사본이 동일하다.
- 기존 Node Sass 4.14.1 기반 빌드는 Node.js 24/macOS arm64 환경에서 실행하지 못했다. Dart Sass(`sass` 패키지)를 통한 재컴파일은 이번 단계에서 검증하지 않았다. CSS 전환의 회귀 비교에는 체크인된 기존 배포물을 기준선으로 사용했고, 해당 파일은 변경하지 않았다.

## 검증

- `pnpm build:phase1`: 통과. 일반 14,108바이트, 압축 12,327바이트, gzip 일반 2,984바이트.
- `pnpm check:phase1`: 통과.
- `pnpm test`: 10개 통과. 기존 빌드 계약 5개와 마이그레이션 도구의 조사·경계·scaffold·정적 검사·경로 검증 5개를 확인했다.
- `pnpm migrate:css verify layout --target build/migration/layout/candidate.css`: 통과. 누락 클래스·media query·표준 속성과 남은 Sass가 없다.
- `pnpm migrate:css verify layout --target src/_layout.scss`: 의도대로 실패. Sass 변수와 nesting, 정적 breakpoint 불일치를 보고하고 종료 코드 1을 반환했다.
- `pnpm test:visual`: 이번 도구 변경에서는 다시 실행하지 않았다. 마지막 기록은 Chromium/Firefox/WebKit 12개 통과이며 CSS 또는 시각 동작은 변경하지 않았다.
- Safari/iOS Safari 16.4 실기기 검증은 미수행이다. Playwright WebKit 결과와 구분한다.

## 남은 결정

- npm 식별자는 미확정이다. `spectra.css`는 후보이며 사용 가능 여부와 소유권은 Phase 06에서 확인한다.
- Pug 필터 대체 조합과 문서 빌드 전환은 Phase 05 범위다.
- 전체 문서 사이트까지 새 빌드로 생성된 뒤 Phase 06에서 Gulp/Sass 제거 여부를 확정한다.

## 다음 단계

Phase 02의 첫 컴포넌트 작업은 `layout` 후보에서 구형 접두사와 정적 테마 값을 검토하고, 실패하는 responsive·token·외부 override 시각 계약을 추가한 뒤 `src/layout/layout.css`로 전환하는 것이다. 도구의 정적 검사만으로 parity 완료를 판정하지 않는다.
