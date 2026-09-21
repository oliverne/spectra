# 진행 상태

갱신일: 2026-09-21

## 현재

- 요청 범위: `model-handoff-workflow` Execute 모드, [Phase 01](phase-01-css-foundation.md).
- Phase 01 완료. Node.js 24.21.0, pnpm 12.5.1, lockfile, Lightning CSS 시험 빌드, Biome, Vitest, Playwright를 도입했다.
- `src/spectra.css` 아래에 `--spectra-*` tokens, normalize/base, buttons의 Pure CSS 세로 단위를 구현했다. 일반·압축 CSS와 원본 파일별 source map은 무시되는 `build/phase-01/`에 생성된다.
- 기존 Gulp/Sass, Pug, `dist/spectre*.css`, `docs/dist/spectre*.css`, 패키지 `main`은 유지했다. 불완전한 새 번들을 배포 경로에 노출하지 않았다.
- 기존 일반 CSS 62,359바이트와 문서 사본의 SHA-256은 `c7f773ca3363bc5bd54b2849c0e37435c9e1afbb353fc1d79e16d422907fb924`로 일치한다. 압축본도 양쪽 사본이 동일하다.
- 기존 Node Sass 4.14.1 기반 빌드는 Node.js 24/macOS arm64 환경에서 실행하지 못했다. Dart Sass(`sass` 패키지)를 통한 재컴파일은 이번 단계에서 검증하지 않았다. CSS 전환의 회귀 비교에는 체크인된 기존 배포물을 기준선으로 사용했고, 해당 파일은 변경하지 않았다.

## 검증

- `pnpm build:phase1`: 통과. 일반 14,108바이트, 압축 12,327바이트, gzip 일반 2,984바이트.
- `pnpm check:phase1`: 통과.
- `pnpm test`: 5개 통과. import 해소·라이선스·source map, 재현성, 누락 import, 잘못된 CSS, 기존 배포 기준선을 검증했다.
- `pnpm test:visual`: Chromium/Firefox/WebKit 12개 통과. 기본 및 상태별 computed style, 대표 픽셀, scoped token, 외부 override를 검증했다.
- Safari/iOS Safari 16.4 실기기 검증은 미수행이다. Playwright WebKit 결과와 구분한다.

## 남은 결정

- npm 식별자는 미확정이다. `spectra.css`는 후보이며 사용 가능 여부와 소유권은 Phase 06에서 확인한다.
- Pug 필터 대체 조합과 문서 빌드 전환은 Phase 05 범위다.
- 전체 문서 사이트까지 새 빌드로 생성된 뒤 Phase 06에서 Gulp/Sass 제거 여부를 확정한다.

## 다음 단계

Phase 02 착수 시 기본 요소·forms·layout·utilities의 실행 문서를 작성하고, Phase 1의 토큰·빌드·브라우저 계약을 확장한다. 이번 Execute 요청에서는 Phase 02로 넘어가지 않는다.
