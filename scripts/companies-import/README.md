# 거래처 엑셀 이관 스크립트

기존 `거래처현황.xlsx` 를 `POST /api/companies` 로 등록하기 위한 일회성 스크립트다.
외부 의존성 없이 Node 만으로 동작한다(xlsx 는 zip + XML 이라 직접 해제한다).

```text
scripts/companies-import/
├── xlsx.js      # .xlsx → 시트별 셀 값
├── convert.js   # 엑셀 → API 요청 본문 JSON + 확인 리포트
├── upload.js    # JSON → POST /api/companies
└── out/         # 변환 결과 (git 에 올리지 않는다)
```

## 1. 변환

```bash
node scripts/companies-import/convert.js "C:/…/거래처현황_1.xlsx"
```

다음 세 파일이 생성된다.

- `out/companies.json` — 등록에 사용하는 요청 본문 배열
- `out/report.txt` — 건수와 확인 필요 목록
- `out/preview.txt` — 거래처별로 눈으로 확인하는 미리보기

**보내기 전에 report.txt 와 preview.txt 를 먼저 확인한다.**

## 2. 시험 투입 (개발 API)

토큰은 로그인한 브라우저의 `localStorage.accessToken` 값을 사용한다.

```bash
node scripts/companies-import/upload.js --base https://dev-api.jeongcloud.cloud --token <accessToken> --limit 3
```

화면에서 확인한 뒤 `--limit` 없이 전체를 등록한다.

## 3. 중단 지점부터 재실행

실패 건은 `out/upload-result.json` 에 번호와 함께 남는다.

```bash
node scripts/companies-import/upload.js --base <주소> --token <토큰> --from 42
```

`--dry-run` 은 호출 없이 대상만 출력한다.

## 변환 규칙

| 항목 | 규칙 |
|---|---|
| 거래처 유형 | 시트명 기준 — 일반거래처 `OTHER`, 매입처 `PURCHASE`, 매출처 `SALES` |
| 회사 묶음 | No.·상호명이 있으면 새 거래처, 둘 다 비면 앞 거래처의 연속 행 |
| 표 끝 | No. 없이 상호명만 있는 행부터는 표 아래 메모로 보고 제외 |
| 연락처 | 전화 번호 → `전화번호`, FAX 번호 → `fax`, 담당자 폰 → `담당자` |
| 주소 | 기본 라벨 `사업장` |
| 계좌 | 기본 라벨 `거래용`. 일반거래처는 `"국민 999-…"` 한 셀을 은행명·계좌번호로 분리 |
| 이메일 | 기본 라벨 `연락용` |
| 괄호 라벨 | 값 앞 `(하치장)` 은 라벨로 사용. `(032-226-6545)` 처럼 괄호 안이 번호면 값으로 처리 |
| 줄바꿈 | 셀 안 줄바꿈은 항목 분리. `~5` 처럼 범위를 잇는 줄과 `(대표님)` 라벨만 있는 줄은 앞뒤 줄과 합침 |
| 번호 붙이기 | 같은 기본 라벨이 2개 이상이면 `전화번호1`, `전화번호2` … |
| 중복 값 | 같은 열에 같은 값이 반복되면 한 번만 저장 |
| 같은 시트 중복 | 같은 회사명이 떨어진 행에 다시 나오면 한 거래처로 합침 |
| 시트 간 중복 | 같은 회사명이 여러 시트에 있으면 **매입처 → 매출처 → 기타** 순서로 기준을 정하고, 기준에 없는 값만 더함. 유형은 기준 시트를 따름 |
| 담당자(이름) | 대응 필드가 없어 메모에 `담당자: 홍길동` 으로 저장 |
| 목록 노출 | 연락처·이메일 모두 `isListVisible: true` |
| 헤더 없는 열 | 값이 전부 전화번호면 담당자 폰으로 추가, 그 외에는 무시하고 리포트에 남김 |

규칙을 바꾸려면 `convert.js` 상단의 `SHEET_TYPES`, `DEFAULT_LABELS`, `LIST_VISIBLE` 을 고친다.
