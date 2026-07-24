# 계약 관리 화면 — 진행 상황 (핸드오프)

> **2026-07-15 기준. API 연동 완료 단계.**
> 설계(UX)는 [frontend-design.md](./frontend-design.md), API 연동 상세는 [api-integration.md](./api-integration.md) 참고.
> 백엔드 스펙: `http://localhost:8080/swagger-ui/index.html` (OpenAPI JSON: `/v3/api-docs`).
>
> 새 세션에서 이어서 작업할 때: 이 문서 → `api-integration.md` → `frontend-design.md` 순으로 읽을 것.

---

## 0. 한눈에 보기

- 계약 **목록 · 상세 · 등록 · 수정 · 삭제 · 거래 등록/결제 · 단가 확정/재계산**을 모두 **실제 API**로 연동함.
- 선택값(단가유형·거래구분·상태·소속회사 등)은 전부 `GET /api/enums/{group}` 로더로 처리(하드코딩 제거).
- 거래처는 `GET /api/companies`, 시장 배너는 `GET /api/price/latest` 사용.
- 초기 mock 데이터(`mockData.js`)는 **더 이상 사용되지 않음(정리 대상)**. `PaymentForm.jsx`는 거래별 결제 등록·수정에 사용.

---

## 1. 라우트 ([src/App.jsx](../../src/App.jsx))

| 경로 | 화면 | 진입 파일 |
|---|---|---|
| `/contract` | 계약 목록 | `src/pages/contract/index.jsx` |
| `/contract/new` | 계약 등록 (스텝형 1 기본 → 2 단가 → 3 품목 → 4 확인) | `src/pages/contract/form.jsx` |
| `/contract/:id` | 계약 상세 (탭: 계약·단가 / 거래 내역) | `src/pages/contract/detail.jsx` |
| `/contract/:id/edit` | 계약 수정 (**헤더만**, 단일 단계) | `src/pages/contract/form.jsx` |

모든 라우트는 `<RequireAuth roles={["USER","ADMIN"]}>`로 보호됨 → **로그인(공유링크 가입) 토큰이 있어야** API가 200을 반환.

## 2. 폴더 구조 (`src/pages/contract/`)

```
contract/
├── index.jsx        # 목록 (배너 → 툴바 → 카드 그리드 → 페이지네이션)
├── detail.jsx       # 상세 (헤더 + 탭 2개)
├── form.jsx         # 등록(스텝형) / 수정(헤더 단일 단계) 분기
├── constants.js     # 상태·단가유형 스타일, 표시 헬퍼(formatDate/Number/Quantity, krwUnitLabel …)
├── mockData.js      # (미사용) 초기 mock — 정리 대상
├── api/
│   ├── contractApi.js  # 계약·단가·거래·거래처 엔드포인트 래퍼
│   ├── enumsApi.js     # ENUM_GROUPS + /api/enums/{group}
│   └── marketApi.js    # /api/price/latest (배너)
├── hooks/
│   ├── useToast.js         # 성공/오류 토스트
│   ├── useEnums.js         # enum 그룹 로더(모듈 캐시) + labelOf(group,value)
│   ├── useContractList.js  # 목록: 필터·검색·페이지·재계산·거래처맵·시장배너
│   ├── useContractDetail.js# 상세: 품목단가 매트릭스·단가 기간줄·거래 등록/결제·단가 확정·삭제
│   └── useContractForm.js  # 등록(생성)·수정(헤더 PUT)·enum·거래처
└── components/
    ├── Toast / ConfirmModal / StatusBadge            # 공용
    ├── NumericInput                                  # 숫자 입력 콤마 표시·원시값 전달
    ├── MarketBanner / ContractToolbar / ContractGrid / ContractCard   # 목록
    ├── ContractDetailHeader / PriceInfoTab / TransactionTab           # 상세
    ├── TransactionStatistics                                          # 전체·품목별 거래 통계
    ├── PaymentForm.jsx                              # 거래별 결제 등록·수정
    └── FormStepIndicator / Basic / Prices / Items / Confirm           # 등록 스텝
```

**패턴**: 페이지마다 훅 1개가 상태·핸들러 전부를 보유하고 섹션별 그룹 객체를 반환 → 컴포넌트에 스프레드(`<MarketBanner {...market} />`). `price/`, `priceManagement/` 폴더와 동일 컨벤션.

---

## 3. 화면별 연동 상태

### 목록 (`useContractList`)
- `GET /api/contracts` — 필터 `ownerCompany`(전체/호재/우남)·`status`(전체/예정/진행중/완료/취소)·`contractName`(검색). 페이지네이션 서버 처리(1-기반).
- 회사명은 `GET /api/companies`로 `customerId → 이름` 매핑.
- 카드 단가: 응답의 **`prices[]` 배열**을 유형별로 세로 나열, 각 `finalUnitPrice` 표시(없으면 "미정").
- 시장 배너: `GET /api/price/latest` → LME·환율(각자 기준일)·원화환산(원/kg).
- 재계산: `POST /api/contracts/prices/recalc` → 완료 건수 토스트 + 목록 갱신.

### 상세 (`useContractDetail`)
- 헤더: `GET /api/contracts/{id}`(기본+품목) + 회사명 매핑 + enum 표시명.
- 헤더의 진행상태 드롭다운에서 `PATCH /api/contracts/{id}/status`로 상태를 즉시 변경.
- **탭1 계약·단가**:
  - `GET /api/contracts/{id}/prices` 한 번으로 전체 단가의 산정기간·**확정여부**·기준 LME/환율과 품목별 요율·프리미엄·최종단가를 조회.
  - 단가별 기간 줄의 미확정 단가에 **[확정] 버튼**(`POST …/confirm`).
  - 미확정 단가는 행별 **[재계산] 버튼**으로 `POST /api/contracts/prices/{priceId}/recalc`를 호출하고, 완료 후 전체 계약 단가를 다시 조회.
  - 품목 × 단가 매트릭스도 같은 전체 단가 응답으로 구성.
- **탭2 거래 내역**:
  - 조회: `GET /api/contracts/{id}/transactions`.
  - 통계: `GET /api/contracts/{id}/transactions/statistics`로 전체·품목별 납품수량, 잔여 계약수량, 납품률, 가중평균 단가, 정산·결제 금액, 마지막 정산 상태와 거래 기간 표시.
  - 거래 등록: `POST …/transactions`. 산정단가(`unitPrice`)는 품목×단가유형 매트릭스에서 자동 조회해 전송(금액은 서버 계산). 결제 정보는 같은 폼에서 함께 입력할 수도 있음.
  - **정산가(SETTLEMENT)는 거래 입력 전용**. 마지막 거래 선택 시 `POST …/transactions/settlement/calculate`로 정산 단가·정산금액을 미리 표시하고, 등록 요청에서는 unitPrice를 생략해 서버가 계산.
  - 기존 거래는 행별 **[거래 수정]**에서 `PUT …/transactions/{transactionId}`로 품목·납품일·수량·단가·단가유형·메모를 수정. 결제 정보는 유지.
  - 기존 거래의 결제는 행별 입력 영역에서 `PATCH …/transactions/{transactionId}/payment`로 등록·수정. 내수는 실입금액, 수출은 수취외화와 선택적 환전 정보를 입력.
  - 거래 등록·수정·결제 저장 후 거래 목록과 통계를 함께 갱신.
- 삭제: `DELETE /api/contracts/{id}`(soft delete) → 목록 이동.

### 등록/수정 (`useContractForm`)
- **등록**: 4스텝 → `POST /api/contracts`. 품목별 요율·프리미엄을 `items[].prices[]`(priceIndex 참조)로 조립. 셀렉트·라디오는 enum, 거래처는 companies.
- **수정**: PUT이 **헤더만** 바꾸므로 **단일 단계(기본 정보)**로 분기. `GET /api/contracts/{id}` 프리필 → `PUT /api/contracts/{id}` 저장. 단가·품목은 이 폼에서 수정 불가(별도 리소스, 엔드포인트 없음).

---

## 4. 주요 결정 사항 (왜 이렇게 했나)

- **모달 아님, 페이지 유지**: 상세·등록은 콘텐츠가 무겁고 딥링크·새로고침이 중요 → 라우트 페이지 유지.
- **수정 = 헤더 전용**: `PUT /api/contracts/{id}`가 품목·단가를 바꾸지 않음(스펙 명시). 그래서 수정 화면은 기본 정보만.
- **결제는 거래 등록 시 또는 사후 입력**: 기존 거래의 수량·단가·정산금액은 유지하고 결제 정보만 PATCH로 등록·수정.
- **소속회사(자사)**: 호재=`HOJAE`, 우남=`WOONAM`. 목록 필터 + 등록 필수.
- **필드명은 API에 맞춤**: 폼/뷰모델이 `contractName`, `customerId`, `contractQuantity` 등 서버 필드명을 그대로 사용.
- **단위 단순화**: 계약수량은 항상 ton으로 입력·표시하고 단가 단위 선택은 제거. 상세·거래 단가는 수출 USD/ton, 내수 원/kg.

## 5. 알려진 이슈 / 확인 필요

- **목록 카드 `finalUnitPrice` 크기 이상**: 예시 데이터에서 `finalUnitPrice`(≈20.5억)가 `baseUnitPrice`(≈2천만, LME×환율 원/ton 수준)의 **약 100배**. 요율(%)이 소수(1.005)로 안 나눠지고 정수(100.5)로 곱해진 **서버 계산 의심**. → 서버 수정 or 카드에 `baseUnitPrice` 표시로 전환 결정 필요.
- **오류 메시지**: mutation은 `CommonResponse{message}`라 서버 메시지를 토스트로 그대로 노출. (조회 실패는 일반 문구)
- **정리 대상**: `mockData.js` 미사용.

## 6. 미지원(엔드포인트 없음) / 다음 작업 후보

- 계약의 **단가·품목 개별 수정** (PUT은 헤더만).
- **거래 삭제**.
- 목록 정렬 UI(정렬 자체는 서버 책임).

---

## 7. 확인 방법

1. 백엔드 `http://localhost:8080` 기동 + 로그인(공유링크 가입)으로 **토큰 확보**(없으면 401).
2. `npm run dev` → `/contract` 접속.
3. 목록 필터/검색 → 카드 클릭 → 상세(탭1 확정, 탭2 거래·결제) → 수정/삭제, 등록 흐름 확인.
4. 빌드·린트는 미실행 — `npm run lint` 권장.
