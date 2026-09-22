# 작업 인계

갱신일: 2026-09-23

이 문서는 새 세션·모델·에이전트의 진입점이다. 상태의 원본은 [progress.md](progress.md), 전체 계약과 단계 순서는 [plan.md](plan.md), 현재 실행 범위는 [Phase 02 문서](phase-02-core-elements-forms-layout-utilities.md)다.

## 새 컨텍스트 시작 순서

1. 루트 `AGENTS.md`와 이 문서를 읽는다.
2. `planning/plan.md`, `planning/progress.md`, 현재 phase 문서를 읽는다.
3. `git status --short --branch`와 최근 커밋을 확인한다. 아래 Git 상태는 2026-09-22 스냅샷이므로 현재 결과로 다시 확인한다.
4. Node.js `24.21.0`, pnpm `12.5.1`인지 확인한다.
5. 컴포넌트 전환에는 `.agents/skills/spectra-css-migration/SKILL.md`를 적용한다.
6. 현재 phase의 다음 미완료 작업 패킷 하나만 구현하고 검증한다. 완료되지 않은 phase를 건너뛰거나 다음 phase 구현으로 자동 전환하지 않는다.
7. 작업을 마칠 때 실제 결과로 phase 문서, `progress.md`, 이 문서를 갱신한다.

## 현재 체크포인트

- Phase 01은 구현과 로컬 검증이 완료됐다. `src/spectra.css`는 tokens, normalize/base, buttons만 조립한다.
- Phase 02는 마이그레이션 도구 세로 단위만 완료했다. Phase 02 컴포넌트 CSS 전환은 아직 시작하지 않았다.
- `pnpm migrate:css inspect|scaffold|verify`가 SCSS 조사, 체크인된 기존 CSS 구간 추출, 후보의 정적 범위 검사를 제공한다.
- `layout` 작업 패킷은 무시되는 `build/migration/layout/`에 있다. 같은 workspace에서 파일이 존재하면 `scaffold`를 다시 실행하지 않는다. 새 checkout처럼 파일이 없으면 명령으로 재생성한다.
- 기존 Gulp/Sass, Pug, `dist/spectre*.css`, `docs/dist/spectre*.css`, 패키지 `main`은 유지돼 있다. 정식 `dist/spectra.css`는 아직 없다.

### Phase 02 도구 변경 세트

아래 파일이 마이그레이션 도구 세로 단위를 구성한다. 커밋 여부와 브랜치·원격 차이는 새 컨텍스트에서 Git으로 다시 확인한다.

```text
modified  .agents/skills/spectra-css-migration/SKILL.md
modified  package.json
modified  planning/handoff.md
modified  planning/plan.md
modified  planning/progress.md
added     planning/phase-02-core-elements-forms-layout-utilities.md
added     scripts/css-migration.mts
added     tests/build/css-migration.test.ts
```

무시되는 작업물:

```text
build/phase-01/spectra.css
build/phase-01/spectra.css.map
build/phase-01/spectra.min.css
build/migration/layout/inspection.json
build/migration/layout/legacy.css
build/migration/layout/candidate.css
```

이 변경 세트에는 새 의존성이 없고 `pnpm-lock.yaml`은 바뀌지 않았다.

## 마지막 검증 근거

- `pnpm check:phase1`: 통과.
- `pnpm test`: 2개 파일, 10개 테스트 통과.
- `pnpm build:phase1`: 통과, 일반 CSS 14,108바이트.
- `pnpm migrate:css verify layout --target build/migration/layout/candidate.css`: 통과.
- `pnpm migrate:css verify layout --target src/_layout.scss`: 의도대로 종료 코드 1. Sass 변수, nesting, 정적 breakpoint 불일치를 보고했다.
- `git diff --check`: 통과.
- 이번 도구 변경에서는 CSS 동작을 바꾸지 않아 `pnpm test:visual`을 다시 실행하지 않았다. 마지막 Phase 01 기록은 Chromium/Firefox/WebKit 12개 통과다.
- Safari/iOS Safari 16.4 실기기 검증은 미수행이다. Playwright WebKit 결과로 대체하지 않는다.

## 고정 결정과 주의점

- 프로젝트명은 Spectra, 공개 토큰 접두사는 `--spectra-*`다. 공개 클래스, 기본 외형, selector 상세도·순서와 외부 override를 유지한다.
- 표준 CSS와 평탄한 selector를 사용한다. native nesting과 cascade layer를 도입하지 않는다.
- 지원 범위는 최근 Chrome·Edge·Firefox 2개 major, Firefox ESR, Safari/iOS Safari 16.4 이상이다. IE와 EdgeHTML은 지원하지 않는다.
- media query의 480/600/840/960/1280/1440px 경계는 정적 값으로 유지한다. media query 조건에 CSS 변수를 사용하지 않는다.
- Sass의 `darken`, `lighten`, `rgba`, `lightness` 결과를 근사하지 않는다. 체크인된 기존 CSS의 계산 결과를 상태·대비·alpha 토큰으로 명시한다.
- 기존 Node Sass 4.14.1 빌드는 현재 환경에서 실행하지 못했다. 필요하면 Dart Sass를 별도 검증하되 체크인된 기존 CSS를 회귀 기준선으로 유지한다.
- migration `candidate.css`는 기존 CSS의 작업용 사본이다. 정적 `verify` 통과는 token scope, cascade, computed style, 픽셀 parity를 증명하지 않는다.
- helper는 `src/spectre.scss`의 직접 import이면서 명확한 selector 경계가 있는 컴포넌트를 scaffold한다. keyframes로 시작하는 `animations`와 간접 aggregator인 `utilities`는 `legacy: null`이므로 수동 경계 조사 또는 phase 계약에 따른 도구 확장이 필요하다.
- npm 식별자, 정식 배포 경로, `package.json`의 `main`, Gulp/Sass 제거는 Phase 06 전까지 확정하거나 변경하지 않는다.
- 기존 라이선스·저작권·원작자 출처와 역사 기록을 유지한다.

## 즉시 재개할 작업

[Phase 02 문서의 `다음 패킷: layout`](phase-02-core-elements-forms-layout-utilities.md)을 테스트 우선으로 실행한다. 첫 작업은 `build/migration/layout/`의 패킷과 기존 source·배포 CSS를 대조하고 `tests/visual/layout.spec.ts`에 실패하는 responsive·token scope·외부 override 계약을 추가하는 것이다.

Phase 02의 나머지 패킷 순서와 layout 수용 조건·검증 명령은 Phase 02 문서를 따른다. Phase 03–06의 범위와 단계 전환 규칙은 [plan.md의 `이후 단계 실행 로드맵`](plan.md)을 따른다. 현재 패킷이나 phase가 완료되기 전 다음 범위로 자동 전환하지 않는다.

## 다음 인계 때 갱신할 내용

- 완료한 작업 패킷과 실제 변경 파일
- 실행한 명령과 결과, 미실행 또는 환경 제한 검증
- 현재 Git 상태와 ignored 작업물의 재생성 필요 여부
- 남은 결정·차단 조건과 다음 한 작업 패킷
