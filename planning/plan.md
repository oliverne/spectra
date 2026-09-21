# Spectra — Pure CSS 전환 계획

상태: Phase 01 완료, Phase 02 미착수 · 작성일: 2026-09-21

## 목표와 범위

Spectre.css에서 포크한 프로젝트를 **Spectra**로 명명하고, Sass로 작성된 스타일을 표준 CSS로 전환한다. 컴포넌트별 CSS 파일을 소스로 유지하고, CSS custom properties로 디자인 토큰을 제공하며, 배포 시에는 import가 해소된 번들 CSS를 생성한다. Gulp와 Sass 기반 빌드를 Node.js와 Lightning CSS로 교체한다.

Phase 01에서 의존성 설치와 tokens/base/buttons 세로 단위 전환을 완료했다. 기존 파일 삭제, 정식 배포 경로 전환, 배포는 진행하지 않았다. 아래 스택과 호환성 정책은 Phase 01의 구현 계약으로 확정했으며 이후 단계도 이를 따른다.

## 현재 구조

문서 위치는 역할에 따라 구분한다. `docs/`는 기존 사용자용 문서 웹사이트의 소스와 산출물에 사용하고, `planning/`은 개발 계획·단계별 수용 조건·진행 기록에 사용한다. 인계 문서가 필요하면 `planning/handoff.md`에 작성한다. `README.md`는 프로젝트 소개·설치·빠른 시작을 담당한다.

| 영역 | 확인한 상태 | 전환 시 고려사항 |
| --- | --- | --- |
| 패키지 | `spectre.css` 0.5.9, `main: dist/spectre.css` | Spectra 명칭과 새 파일 경로로 전환; npm 식별자는 별도 확정 |
| CSS 소스 | `src/spectre.scss`, `spectre-exp.scss`, `spectre-icons.scss`와 partial | 세 엔트리와 컴포넌트 분리 유지 |
| 토큰 | `src/_variables.scss`의 `!default`, Sass 색상·수치 연산 | 런타임 토큰과 정적 구조 상수를 구분 |
| 빌드 | `gulpfile.js`: Sass, Autoprefixer, CSScomb, clean-css | 번들·접두사 처리·압축을 Lightning CSS로 통합 |
| 문서 | `docs/src/**/*.pug`, `docs/src/scss/*.scss` | Pug 렌더링 및 Markdown/하이라이트 필터도 Gulp에서 분리 |
| 산출물 | `dist/`의 CSS 6개, `docs/dist/`의 동일 CSS와 docs/RTL CSS | 디렉터리와 일반·압축본 구성 유지, 파일명과 참조를 `spectra`로 전환 |
| 호환성 | IE 10+, Edge 12+가 설정과 README에 명시됨 | CSS 변수 기반 런타임 테마와 양립하지 않으므로 정책 변경 필요 |
| 반복·분기 | carousel 8개, filter 8개, viewer 36프레임, RTL 조건문 | 클래스·선택자 범위와 기존 동작 보존 |

최초 조사 시 `package.json`에는 scripts와 테스트 도구가 없고, 저장소에 lockfile과 별도 계획 문서가 없었다. Phase 01에서 구 Node Sass 4.14.1의 Node.js 24/macOS arm64 미지원으로 기존 Sass 재생성은 불가능함을 확인했다. 체크인된 `dist/spectre.css`와 동일한 `docs/dist/spectre.css`를 비교 기준으로 확정했다.

## 프로젝트 이름과 출처

- 프로젝트·브랜드명은 **Spectra**, CSS 파일명은 `spectra.css`, `spectra-exp.css`, `spectra-icons.css`, RTL은 `spectra-rtl.css`로 확정한다. 공개 토큰 접두사는 `--spectra-`를 사용한다.
- README와 문서 사이트에 Spectre.css에서 파생된 포크임을 명시한다. 원본 저작권·MIT 라이선스 고지와 원작자 출처를 보존하고, 포크의 저장소·문서 링크는 원본 링크와 구분한다.
- npm 패키지 식별자는 아직 확정하지 않는다. `spectra.css`를 후보로 두되 이름의 사용 가능 여부와 소유권을 확인한 뒤 결정한다. 필요하면 사용자 소유 scope를 사용하며, scope·저장소·홈페이지 주소를 임의로 만들지 않는다.
- 기존 `.btn`, `.card` 등의 공개 클래스는 유지한다. 소비자는 패키지 설치 대상과 CSS import/link 경로를 새 이름으로 변경해야 한다. 구 파일명 alias는 기본 제공 범위에 넣지 않는다.
- 과거 CHANGELOG, 원본 출처, 비교 기준 파일 경로의 `Spectre` 표기는 보존한다. 새 사용 안내·배너·산출물의 이름은 Spectra로 통일한다.

## 권장 스택

| 역할 | 선택 | 이유 |
| --- | --- | --- |
| 실행 환경 | Node.js 24 LTS, pnpm | 실행 버전과 패키지 매니저 버전을 고정하고 lockfile로 재현성 확보 |
| CSS 작성 | 표준 `.css`, custom properties, `calc()` | Sass나 별도 런타임 없이 소비 가능 |
| CSS 빌드 | Lightning CSS Node API + Browserslist | `@import` 번들링, 대상 브라우저 변환, 접두사 처리, 압축 |
| 빌드 스크립트 | 작은 TypeScript 스크립트 | 엔트리·산출물 경로·오류 처리만 관리하며 범용 태스크 프레임워크는 도입하지 않음 |
| 코드 검사 | Biome | 지원하는 CSS·TypeScript 범위의 포맷과 기본 검사; 토큰·번들 계약은 별도 검사 |
| 검증 | Vitest + Playwright | 산출물 계약과 실제 브라우저의 외형·상태·테마 검증 |
| 문서 렌더링 | Pug 직접 호출 | 기존 템플릿과 URL을 유지하면서 `gulp-pug` 제거 |

React, Tailwind, Vite, PostCSS 체인은 이번 CSS 라이브러리 전환에 필요하지 않다. Pug는 HTML 템플릿으로 유지하고, 기존 필터는 지원되는 직접 라이브러리 또는 작은 명시적 필터 어댑터로 교체한다. 필터 패키지의 실제 유지보수 상태와 호환 버전은 Phase 05에서 확인한다. 모든 도구의 정확한 버전은 도입 단계에서 호환성을 확인하여 고정한다.

## CSS 구조와 배포 계약

권장 소스 구조:

```text
src/
  tokens.css
  spectra.css
  spectra-exp.css
  spectra-icons.css
  base/               # normalize, base, typography, asian
  components/         # buttons.css, forms.css, cards.css 등
  layout/             # layout.css, hero.css, navbar.css
  utilities/          # colors.css, position.css 등
  experimentals/      # carousels.css, filters.css 등
  icons/              # core.css, navigation.css 등
docs/src/css/         # docs.css, spectra-rtl.css
scripts/             # CSS 빌드, 문서 빌드, watch, 계약 검사
```

- 각 엔트리는 표준 `@import`로 파일을 명시적인 순서로 조립한다. 파일명 glob 정렬에 cascade 순서를 맡기지 않는다.
- 초기 전환은 기존 선택자·상세도·선언 순서를 보존하는 평탄한 CSS를 우선한다. Sass nesting을 native nesting으로 기계적으로 바꾸지 않는다.
- 초기에는 `@layer`를 도입하지 않는다. layer 도입에 따른 외부 CSS와 `!important` 우선순위 변경은 별도 설계 대상이다.
- 기본 번들은 `tokens.css`를 한 번 포함한다. 실험적 번들은 기존처럼 기본 번들과 함께 사용하며 토큰을 재선언하지 않는다.
- 아이콘은 단독 사용을 보존한다. 공유 토큰을 사용할 경우 각 사용처에 기본값을 제공하여 기본 번들을 필수로 만들지 않는다.
- 개별 컴포넌트 CSS는 독립 파일로 유지하되, 단독 완결 배포를 약속하지 않는다. 선택 조합 시 필요한 tokens/base/컴포넌트 의존성을 문서화한다.
- `dist/spectra{,-exp,-icons}.css` 및 대응 `.min.css`를 생성하고, `package.json`의 `main`은 `dist/spectra.css`로 변경한다. CSS 클래스 해싱과 사용량 기반 selector 제거는 사용하지 않는다.
- 기존 공개 클래스, HTML 구조, 상태 선택자, 애니메이션 이름, 기본 치수·색상은 보존한다. 파일·패키지 이름 변경, Sass 변수·mixin API 제거와 구형 브라우저 지원 종료는 breaking change로 문서화한다. npm 식별자와 릴리스 버전 결정은 별도로 남긴다.

## 디자인 토큰

공개 변수 접두사는 `--spectra-`로 확정한다. `src/tokens.css`의 `:root`가 기본값의 단일 출처다. 우선 기존 값을 보존하고, 재디자인이나 완성된 다크 테마는 범위에 넣지 않는다.

| 계층 | 예시 | 원칙 |
| --- | --- | --- |
| 기본 값 | `--spectra-color-primary`, `--spectra-space-2`, `--spectra-font-size` | 기존 색상·간격·폰트·크기·모서리·그림자·z-index를 매핑 |
| 의미 | `--spectra-color-text`, `--spectra-color-surface`, `--spectra-color-border`, `--spectra-color-focus` | 용도와 상태를 기준으로 컴포넌트가 참조 |
| 컴포넌트 | `--spectra-button-bg`, `--spectra-button-border` | 실제 독립 조정이 필요한 값에만 도입, 선언마다 토큰을 만들지 않음 |

토큰 사용·재정의 계약:

- 간격·크기는 기존 `20px` root 기준과 rem 값을 먼저 보존한다. 산술은 유효한 단위를 가진 `calc()`로 옮긴다.
- 기본·hover·active·focus·disabled·success·error 상태의 색을 명시적으로 매핑한다. `darken/lighten`을 `color-mix()`로 치환하면 결과가 달라질 수 있으므로 기본 팔레트는 기존 계산 결과를 사용한다.
- primary 한 값 변경만으로 모든 파생 색상이 자동 생성된다고 보장하지 않는다. 테마 작성자는 문서에 정한 상태·대비 토큰 묶음을 재정의한다. Sass `lightness()` 분기에 의존하던 전경색도 명시적인 대비 토큰으로 바꾼다.
- `rgba($color, alpha)`에 해당하는 값도 테마와 함께 바뀌어야 한다. 초기에는 명시적인 반투명 토큰을 사용하고, 동적 색상 함수는 브라우저 정책과 시각 검증이 확보된 경우에만 사용한다.
- 전역은 번들 뒤의 `:root`, 부분 테마는 컨테이너에서 재정의한다. 상위에서 계산된 의미 토큰이 자식의 기본 토큰 재정의를 자동으로 따라간다고 가정하지 않는다. 부분 테마에서는 필요한 의미 토큰도 같은 scope에서 선언하고 중첩 테마로 검증한다.
- 컴포넌트 기본값은 가능하면 `var(--spectra-button-bg, var(--spectra-color-primary))`처럼 사용처 fallback으로 제공한다. 컴포넌트 루트의 기본 선언이 상위 테마 값을 가리는 일을 피한다.
- 미디어 쿼리 조건에는 `var()`를 사용할 수 없다. 기존 480/600/840/960/1280/1440px 분기점은 정적 CSS 값으로 유지하고 검사로 일치시킨다. breakpoint는 런타임 디자인 토큰 API에서 제외한다.
- Sass 반복문과 placeholder는 현재 범위를 명시한 CSS 규칙으로 펼친다. 런타임 변수는 선택자 수를 늘리지 못하므로 carousel/filter/viewer 개수 확장은 소스 CSS 편집으로 안내한다. 별도 CSS 생성 DSL은 도입하지 않는다.

## 브라우저와 RTL

지원 범위는 최근 Chrome·Edge·Firefox 2개 major, Firefox ESR, Safari/iOS Safari 16.4 이상이다. IE와 EdgeHTML 지원은 종료한다. CSS 변수의 런타임 테마를 접두사 처리만으로 IE에 제공할 수는 없다.

Browserslist를 빌드의 단일 대상으로 삼되, Playwright의 Chromium/Firefox/WebKit 검증과 Safari 최소 버전 실기기 검증은 구분한다. WebKit 통과만으로 Safari 16.4 검증 완료로 기록하지 않는다.

RTL은 현재 tables/off-canvas 분기와 `docs/src/scss/spectre-rtl.scss`의 기본+실험적 합본 동작을 먼저 보존한다. 새 출력 경로는 `docs/dist/spectra-rtl{,.min}.css`로 변경하고 문서 참조도 함께 수정한다. 논리 속성은 의미가 같은 곳에 한정하고, 물리 방향을 뜻하는 `.ml-*`, `.mr-*` 같은 공개 유틸리티의 의미는 바꾸지 않는다. transform 방향과 기본 방향 지정 여부는 기존 RTL 문서의 실제 마크업과 함께 검증한다.

## 빌드 프로세스

1. 프로젝트 설정에서 엔트리, 대상 브라우저, 출력 경로를 읽는다.
2. Lightning CSS로 세 엔트리의 import를 해소하고 일반·압축본을 만든다. 소스맵은 개발 빌드에 제공하며 경로를 검증한다.
3. 배너에는 Spectra 이름과 포크의 버전을 표시하고 원본 라이선스·저작권 고지를 보존한다. 빌드 시각 등 비결정적 값을 넣지 않는다.
4. 문서용 빌드에서는 생성한 라이브러리 CSS를 `docs/dist/`로 복사하고 docs/RTL 엔트리를 같은 도구로 빌드한다.
5. Pug를 직접 렌더링하여 기존 `docs/**/*.html` 경로를 유지한다. include, 상속, Markdown, highlight 필터와 정적 자산 링크를 검증한다.

예정 명령 계약:

| 명령 | 결과 |
| --- | --- |
| `pnpm build` | 라이브러리 CSS 일반·압축본 생성 |
| `pnpm build:docs` | 라이브러리 CSS를 포함한 문서 CSS·HTML 생성 |
| `pnpm dev` | 소스 변경 감시와 로컬 문서 미리보기 |
| `pnpm check` | 포맷·정적 검사와 번들/토큰 계약 검사 |
| `pnpm test` | 빌드·계약 테스트 |
| `pnpm test:visual` | 브라우저 상태·테마·시각 회귀 검증 |

watch는 CSS import 의존 파일과 Pug include 변경을 반영해야 한다. 간단하게 해당 종류 전체를 재빌드해도 된다. 병렬 실행으로 동일 경로를 덮어쓰지 않으며, 구문 오류·누락 import·렌더 실패는 CI에서 0이 아닌 종료 코드로 전달한다. watch에서는 오류를 표시하고 수정 후 복구한다. 정리 대상은 생성 파일 manifest로 제한하고 `docs/` 전체를 삭제하지 않는다.

`pnpm-lock.yaml`과 `packageManager`를 관리하며 CI는 frozen lockfile 설치를 사용한다. 현재 추적 중인 `dist/`, `docs/dist/`, 생성 HTML은 이번 전환에서 추적 정책을 유지한다. 패키지 `files`와 pack 결과를 확인해 배포 CSS·필요한 소스·라이선스가 포함되는지 검증한다.

## 단계

| 단계 | 작업 | 완료 조건 |
| --- | --- | --- |
| 01 | 기준선·새 빌드·tokens/base/buttons 세로 단위 | 별도 출력 경로에서 import 번들링, 기본/상태/부분 테마 및 오류 처리 검증 |
| 02 | 기본 요소·forms·layout·utilities 전환 | 기존 클래스와 responsive 경계 유지, 토큰 변경의 실제 반영 검증 |
| 03 | 나머지 기본 컴포넌트 전환 | 기본 번들 전체 pure CSS 전환, 상태별 시각 회귀 확인 |
| 04 | experimentals·icons·RTL 전환 | 반복 선택자 범위, 아이콘 단독 사용, RTL 합본·동작 검증 |
| 05 | 문서 CSS·Pug 빌드·watch·사용 안내 교체 | 문서 사이트 전체 재생성 가능, Spectra 명칭·출처·새 CSS 경로 및 Sass/Gulp 대체 안내 반영 |
| 06 | 구 도구 제거·CI·배포물 계약 확정 | npm 식별자·main·메타데이터 정비, Gulp/Sass 및 구 산출물 제거, clean install/build/check/test 및 pack 검증 |

Phase 01 실행 범위는 [별도 문서](phase-01-css-foundation.md)에 정의한다. 이후 단계는 착수 시 실행 문서를 작성하며, 앞 단계 검증 결과에 따라 범위를 조정한다. 전환 중 기존 빌드와 새 빌드는 한시적으로 공존한다. 제거는 관련 경로가 모두 대체된 마지막 단계에서 수행한다.

Phase 01은 2026-09-21 완료했다. 시험 번들은 `build/phase-01/`에만 생성하며 정식 `dist/spectra.css`는 아직 만들지 않는다. Phase 02부터는 Phase 1에서 검증한 결정적 import 빌드, 파일별 source map, 토큰 재정의, 기존 computed style 비교 계약을 확장한다.

## 최종 수용 조건

- 라이브러리와 문서 스타일 소스가 표준 CSS이고 컴포넌트별 파일이 유지된다.
- 새 엔트리·배포물·문서 참조는 `spectra` 파일명, 공개 토큰은 `--spectra-*`로 일치한다. npm 식별자와 패키지 메타데이터는 실제 포크를 가리키며 README에 원본 출처와 마이그레이션 안내가 있다. 원본 저작권·라이선스는 보존된다.
- 공개 토큰 목록·기본값·재정의 예시·정적 상수 예외가 문서화된다. 전역과 중첩 컨테이너 테마 변경에 재빌드가 필요 없다.
- 최종 CSS에 미해소 로컬 `@import`, Sass 문법, 누락 토큰 참조가 없다. 기본 번들+확장 번들 조합에서 토큰 재설정이 없다.
- 기본 테마와 주요 상태, responsive 경계, CSS-only 상호작용, RTL에 설명되지 않은 회귀가 없다. baseline을 일괄 갱신해 차이를 숨기지 않는다.
- 새 환경에서 lockfile 설치로 라이브러리·문서 빌드가 완료되며 반복 빌드 결과가 동일하다. gzip 크기는 전환 전후를 기록하고 증가 원인을 검토한다.
- `gulpfile.js`, `gulp-*`, Sass 구현 의존성 및 `.scss-lint.yml`, `.csscomb.json`, 관련 `.hound.yml` 설정이 실제 사용 경로에서 제거된다. 역사 기록인 CHANGELOG의 과거 언급까지 삭제하지 않는다.
- README와 문서 사이트에 신규 명령, CSS 토큰 사용법, 지원 브라우저, Sass API 제거 사항이 반영된다.
- 로컬 검증·CI·최소 지원 브라우저 검증·실제 배포 결과는 각각 구분해 기록한다. 릴리스와 원격 배포는 이 계획의 완료 조건에 포함하지 않는다.

## 근거

- 저장소: `package.json`, `gulpfile.js`, `src/_variables.scss`, 세 SCSS 엔트리, `src/mixins/`, `docs/src/scss/`, `docs/src/getting-started/custom.pug`.
- [Lightning CSS bundling](https://lightningcss.dev/bundling.html): 표준 import의 번들링과 순서 규칙.
- [Lightning CSS transpilation](https://lightningcss.dev/transpilation.html): Browserslist targets, 접두사 및 문법 변환.
- [CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascading_variables/Using_custom_properties): 상속·fallback·사용 범위.
- [Node.js releases](https://nodejs.org/en/about/previous-releases): 런타임 지원 주기.
