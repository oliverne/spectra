# Phase 01 — Pure CSS 기반과 첫 컴포넌트

상태: 완료 (2026-09-21)

## 결과

기존 CSS의 비교 기준을 확보하고, tokens/base/buttons로 이어지는 작은 세로 단위를 새로운 빌드에서 검증한다. 이 단계의 성공은 전체 라이브러리 전환 완료를 의미하지 않는다.

전체 방향과 호환성 계약은 [plan.md](plan.md)를 따른다. 개발 계획은 `planning/`에서 관리하고, `docs/`는 사용자용 문서 웹사이트에 사용한다.

## 착수 조건

- 사용자가 구현을 요청했는지 확인한다.
- 제안한 브라우저 지원 종료 범위와 기존 클래스·기본 외형 유지 방침을 확인한다. 미확정이면 독립적인 기준선 조사까지 수행하고 의존 작업 전에 확정한다.
- 작업 시점의 Git 상태와 프로젝트 지침을 확인하고 기존 변경을 보존한다.

## 범위

1. 체크인된 일반·압축 CSS, 문서 페이지와 공개 선택자 범위를 조사하고 대표 fixture 및 크기 기준을 확보한다. 기존 Sass와 산출물이 다르면 차이를 기록하고 기준을 확정한다. 구 Node Sass 설치가 현재 환경에서 실패할 경우 반복 설치로 해결을 가정하지 않는다. SCSS 재컴파일이 필요하면 Dart Sass(`sass` 패키지)를 사용하고 기존 기준선과 출력 차이를 검증한다.
2. Node.js 24와 pnpm 버전을 프로젝트에 고정하고 lockfile을 도입한다. 글로벌 사용자 설정은 수정하지 않는다.
3. Lightning CSS로 작은 시험 엔트리를 번들링한다. 새 엔트리는 `spectra.css` 이름을 사용하되 시험 산출물은 임시 또는 별도 경로에 두고 기존 `dist/spectre.css`를 비교 기준으로 보존한다. 전체 기본 번들 전환 전에는 불완전한 번들을 정식 `dist/spectra.css`로 노출하지 않는다.
4. `tokens.css`, normalize/base, buttons CSS를 작성한다. 공개 토큰은 `--spectra-*`를 사용한다. 버튼에 필요한 토큰부터 출발하되 이름과 계층은 전체 계획에 맞춘다.
5. 대표 버튼의 기본, primary, success/error, hover/focus/active/disabled, 크기 변형을 검증한다. 외부 스타일 override 및 컨테이너 토큰 재정의도 포함한다.
6. 개발용 source map, 빌드 실패 전달, 재빌드 재현성 검사를 연결한다. 동작 계약에 대한 실패 테스트를 먼저 작성할 수 있으면 우선한다.

## 경계와 주의점

- Gulp/Sass와 기존 배포 경로는 아직 제거하지 않는다. Pug·전체 docs·RTL 교체는 뒤 단계다.
- Spectra 명칭과 토큰 접두사는 확정된 결정이다. npm 식별자 확정과 패키지 메타데이터 전환은 Phase 06에서 진행하며, 이 단계에서는 이름 예약이나 게시를 수행하지 않는다.
- 버튼 상태 색상을 근사치로 바꾸지 않는다. 기본 테마의 계산 결과와 비교하고, 변경된 테마는 명시적 상태 토큰으로 검증한다.
- source map은 원본 컴포넌트 파일로 연결되어야 한다.
- `:root`에서 계산된 alias의 상속과 컨테이너에서의 토큰 재정의 차이를 검증한다.
- 선택자 구성이 달라져도 기존 외부 override가 유지되는지 확인한다. 새 cascade layer는 도입하지 않는다.

## 수용 조건

- 컴포넌트 분리 소스에서 하나의 일반 CSS와 압축 CSS가 생성된다. import가 남지 않고 라이선스가 보존된다.
- 같은 입력을 두 번 빌드한 결과가 동일하다.
- 누락 import와 잘못된 CSS 입력에 대해 빌드 실패가 명확히 전달된다.
- 기본 버튼의 computed style과 대표 스크린샷을 기존 CSS와 비교한다. 차이가 있으면 원인과 허용 여부를 기록한다.
- 전역 및 서로 다른 두 컨테이너에서 색상·간격 토큰을 변경했을 때 재빌드 없이 적용되며, 다른 컨테이너로 새지 않는다.
- Chromium/Firefox/WebKit에서 관련 상태를 검증한다. 실행하지 못한 엔진은 미검증으로 기록한다.
- 전체 전환 전임을 명시하고 [progress.md](progress.md)에 실제 결과와 다음 범위를 갱신한다.

## 구현 결과

- Node.js `24.21.0`과 pnpm `12.5.1`을 고정하고 `pnpm-lock.yaml`을 도입했다. 기존 `gulp-sass@4`의 install script는 실행하지 않았다.
- 브라우저 범위는 최근 Chrome·Edge·Firefox 2개 major, Firefox ESR, Safari/iOS Safari 16.4 이상으로 확정했다. IE와 EdgeHTML 지원은 종료한다.
- `src/spectra.css`가 `tokens.css`, normalize/base, buttons를 명시적 순서로 조립한다. 새 시험 산출물은 `build/phase-01/spectra{,.min}.css`와 source map이며, 기존 `dist/spectre*.css`는 변경하지 않았다.
- 기본·primary·success/error·active·disabled·크기 버튼, hover/focus, 전역 및 두 컨테이너의 색상·간격 토큰, 후행 외부 override를 테스트로 고정했다.
- 기존 `dist/spectre.css`와 `docs/dist/spectre.css`는 SHA-256 `c7f773ca3363bc5bd54b2849c0e37435c9e1afbb353fc1d79e16d422907fb924`로 동일하다. 일반 CSS는 62,359바이트다. 압축본도 서로 동일하다.
- 기존 Node Sass 4.14.1 기반 빌드는 Node.js 24/macOS arm64 환경에서 실행하지 못했다. Dart Sass(`sass` 패키지)를 통한 재컴파일은 이번 단계에서 검증하지 않았다. 체크인된 배포물을 회귀 비교 기준으로 확정했고 기존 배포물은 변경하지 않았다.
- `pnpm test`의 빌드 계약 5개와 `pnpm test:visual`의 Chromium/Firefox/WebKit 12개 검사가 통과했다. 버튼 computed style과 대표 fixture 픽셀은 세 엔진에서 기존 CSS와 일치했다.
- Playwright WebKit 통과는 Safari 16.4 실기기 검증을 대신하지 않는다. Safari/iOS Safari 최소 버전 실기기 확인은 전체 전환 전 별도 검증으로 남긴다.
- 새 번들은 Phase 1 세로 단위만 포함하므로 정식 `dist/spectra.css`로 공개하지 않는다. Phase 02 이후 전환도 기존 배포 경로와 병행한다.
