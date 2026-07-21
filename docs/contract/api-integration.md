# 계약 관리 — API 연동 레퍼런스

> 프론트가 사용하는 계약 관련 엔드포인트·요청/응답 형태·enum 코드 모음.
> 원본 스펙: `http://localhost:8080/swagger-ui/index.html` (JSON: `/v3/api-docs`).
> 진행 상황은 [progress.md](./progress.md), 화면 설계는 [frontend-design.md](./frontend-design.md).

모든 요청은 [`apiFetch`](../../src/utils/api.js)로 나가며 `Authorization: Bearer <accessToken>`가 자동 첨부된다(미인증 시 401).

---

## 0. 공통 규칙

- **응답 봉투**: 변경 계열(POST/PUT/DELETE, 확정/재계산/거래등록/계약생성)은 `CommonResponse { message, data? }`로 감싸져 온다. **조회(GET)는 원본 스키마 그대로**(감싸지 않음).
- **페이지**: `page`는 **1-기반**.
- **오류**: 실패 응답 body의 `message`를 그대로 토스트로 노출( [contractApi.js](../../src/pages/contract/api/contractApi.js) `asJson`이 추출 ).
- **날짜**: `yyyy-MM-dd` 문자열로 주고받음(화면 표시는 `yyyy.MM.dd`).

---

## 1. 엔드포인트 ↔ 화면 ↔ 래퍼 함수

| 엔드포인트 | 용도 | 래퍼 (`api/`) | 사용 훅 |
|---|---|---|---|
| `GET /api/contracts` | 목록 조회(필터·페이지) | `fetchContracts` | useContractList |
| `GET /api/contracts/{id}` | 상세(기본+품목) | `fetchContractDetail` | useContractDetail, useContractForm(수정 프리필) |
| `GET /api/contracts/{id}/prices` | 전체 단가 상세(기간·확정·기준값·품목별 최종단가) | `fetchContractPrices` | useContractDetail |
| `POST /api/contracts` | 계약 생성 | `createContract` | useContractForm |
| `PUT /api/contracts/{id}` | 계약 수정(**헤더만**) | `updateContract` | useContractForm |
| `DELETE /api/contracts/{id}` | 삭제(soft delete) | `deleteContract` | useContractDetail |
| `POST /api/contracts/prices/{priceId}/confirm` | 단가 확정 | `confirmPrice` | useContractDetail |
| `POST /api/contracts/prices/{priceId}/recalc` | 선택 단가 1건 즉시 재계산 | `recalcPrice` | useContractDetail |
| `POST /api/contracts/prices/recalc` | 당일 재계산 | `recalcPrices` | useContractList |
| `GET /api/contracts/{id}/transactions` | 거래 내역 조회 | `fetchTransactions` | useContractDetail |
| `GET /api/contracts/{id}/transactions/statistics` | 전체·품목별 거래 통계 | `fetchTransactionStatistics` | useContractDetail |
| `POST /api/contracts/{id}/transactions` | 거래 등록(+결제) | `createTransaction` | useContractDetail |
| `PUT /api/contracts/{id}/transactions/{transactionId}` | 거래 내용 수정(결제 제외) | `updateTransaction` | useContractDetail |
| `POST /api/contracts/{id}/transactions/settlement/calculate` | 마지막 거래 정산가 미리 계산 | `calculateSettlement` | useContractDetail |
| `PATCH /api/contracts/{id}/transactions/{transactionId}/payment` | 기존 거래 결제 등록·수정 | `updateTransactionPayment` | useContractDetail |
| `GET /api/companies` | 거래처 셀렉트/이름 매핑 | `fetchCompanies` | useContractList, useContractForm |
| `GET /api/enums/{group}` | 선택값 옵션 | `fetchEnum`/`fetchEnums` | useEnums |
| `GET /api/price/latest` | 시장 배너(LME·환율·원화환산) | `fetchMarketSummary` | useContractList |

---

## 2. enum 그룹 (`GET /api/enums/{group}` → `[{value, label}]`)

`api/enumsApi.js`의 `ENUM_GROUPS`로 관리. `useEnums(groups)`가 모듈 캐시로 로드하고 `labelOf(group, value)`로 코드→표시명 변환.

| group | 코드(value) → 표시명(label) |
|---|---|
| `OWNER_COMPANY` | `HOJAE` 호재 · `WOONAM` 우남 |
| `TRADE_TYPE` | `EXPORT` 수출 · `DOMESTIC` 내수 |
| `PRICE_UNIT` | `KG` kg당 · `TON` 톤당 |
| `CONTRACT_STATUS` | `SCHEDULED` 예정 · `IN_PROGRESS` 진행중 · `COMPLETED` 완료 · `CANCELED` 취소 |
| `PRICE_TYPE` | `PROVISIONAL` 가단가 · `FINAL` 확정가 · `SETTLEMENT` 정산가 · `COST` 원가 |
| `PRICE_SOURCE` | `CALCULATED` 계산 단가 · `FIXED` 고정 단가 |
| `CALC_METHOD` | `EXPORT_STANDARD` 수출 표준 · `DOMESTIC_KG_KRW` 내수 · `COST_LME_RATE` 원가 |
| `PAID_CURRENCY` | `USD` 달러 · `KRW` 원화 |

---

## 3. 주요 요청 본문

### 계약 생성 `POST /api/contracts`
```jsonc
{
  "ownerCompany": "HOJAE",        // 필수
  "contractName": "7월 …",         // 필수
  "contractNo": "CT-2026-001",    // 선택
  "customerId": 2,                 // 거래처 id
  "tradeType": "EXPORT",
  "priceUnit": "TON",
  "contractQuantity": 100,         // priceUnit 기준 수량(TON이면 ton, KG이면 kg)
  "startDate": "2026-07-01",
  "endDate": "2026-07-31",
  "status": "IN_PROGRESS",
  "memo": "…",
  "prices": [                      // 0~N
    { "priceType": "PROVISIONAL", "priceSource": "CALCULATED",
      "calcMethod": "EXPORT_STANDARD", "periodStart": "…", "periodEnd": "…" },
    { "priceType": "COST", "priceSource": "FIXED", "fixedUnitPrice": 9200 }
  ],
  "items": [                       // 최소 1개, 대표(primary)는 1개
    { "itemName": "밀베리", "primary": true,
      "prices": [                  // 품목별 요율·프리미엄 (priceIndex = prices 배열 인덱스)
        { "priceIndex": 0, "rate": 96.5, "premium": 50 }
      ] }
  ]
}
```
- CALCULATED 단가는 `calcMethod`, FIXED 단가는 `fixedUnitPrice` 필수.
- 품목이 지정하지 않은 단가는 서버가 요율 1·프리미엄 0으로 채움.
- 조립 코드: `useContractForm.js`의 `buildCreateRequest`.

### 계약 수정 `PUT /api/contracts/{id}` — **헤더 필드만**
`ownerCompany, contractName, contractNo, customerId, tradeType, priceUnit, contractQuantity, startDate, endDate, status, memo`. 품목·단가는 바꾸지 않음. (`buildUpdateRequest`)

### 거래 등록 `POST /api/contracts/{id}/transactions`
```jsonc
{
  "itemId": 3,
  "transactionDate": "2026-07-10",
  "quantity": 24000,               // kg
  "priceType": "FINAL",
  "unitPrice": 9236.8,             // 일반 거래 필수(품목×단가 매트릭스에서 조회). 마지막 정산이면 생략
  "isFinalSettlement": false,
  // ↓ 결제(실입금)를 함께 넣을 때만
  "paidCurrency": "USD",           // 내수 KRW / 수출 USD
  "paidForeign": 220062,           // 수출: 수취 외화
  "paidExchange": 1381.2,          // 수출: 환전 환율
  "paidAmount": 303949637,         // 실입금액(원)
  "paidDate": "2026-07-12",
  "paymentMemo": "…"
}
```
- 정산금액(`amount`)은 서버가 계산한다. 조립 코드는 `useContractDetail.js`의 `handleSubmitTransaction`에 있다.
- 마지막 정산 거래는 `isFinalSettlement: true`를 전송하고 `unitPrice`는 생략한다.

### 마지막 정산가 계산 `POST /api/contracts/{id}/transactions/settlement/calculate`
```jsonc
{ "itemId": 3, "quantity": 24000 }
```
응답의 `settlementUnitPrice`, `settlementAmount`를 거래 등록 전에 미리 표시한다. 데이터는 저장되지 않는다.

### 거래 내용 수정 `PUT /api/contracts/{id}/transactions/{transactionId}`
`itemId, transactionDate, quantity, unitPrice, priceType, memo`를 전송한다. 결제 정보는
변경하지 않는다. 마지막 정산 거래는 품목을 변경할 수 없으며 단가·정산금액은 서버가
다시 계산하므로 `unitPrice`를 생략한다.

### 거래 결제 등록·수정 `PATCH /api/contracts/{id}/transactions/{transactionId}/payment`
```jsonc
{
  "paidCurrency": "USD",
  "paidForeign": 220062,
  "paidExchange": 1381.2,
  "paidAmount": 303949637,
  "paidDate": "2026-07-12",
  "paymentMemo": "…"
}
```
- KRW 결제는 `paidAmount` 필수.
- USD 결제는 `paidForeign` 필수이며, 환전했다면 `paidExchange`와 `paidAmount`를 함께 입력.

---

## 4. 주요 응답 형태 (조회)

### 목록 `GET /api/contracts` → `PageResponse<ContractListResponse>`
```jsonc
{
  "content": [{
    "contractId": 1, "ownerCompany": "HOJAE", "contractName": "…",
    "contractNo": "…", "customerId": 2, "tradeType": "EXPORT",
    "priceUnit": "TON", "contractQuantity": 0.2, "startDate": "…", "endDate": "…",
    "status": "IN_PROGRESS", "primaryItemName": "밀베리",
    "prices": [                        // ← 유형별 단가 배열(카드에 세로 나열)
      { "priceId": 1, "priceType": "PROVISIONAL", "priceTypeLabel": "가단가",
        "periodStart": "…", "periodEnd": "…", "rate": 96.5 },  // finalUnitPrice 없음 → "미정"
      { "priceId": 2, "priceType": "FINAL", "priceTypeLabel": "확정가",
        "periodStart": "…", "periodEnd": "…", "rate": 96.5,
        "calcDate": "…", "baseUnitPrice": 20441000, "finalUnitPrice": 2054320500 }
    ]
  }],
  "page": 1, "size": 10, "totalElements": 1, "totalPages": 1
}
```
> ⚠️ 예시에서 `finalUnitPrice`가 `baseUnitPrice`의 ~100배(요율 % 미분할 의심). progress.md "알려진 이슈" 참고.

### 상세 `GET /api/contracts/{id}` → `ContractDetailResponse`
기본 필드 + `items: [{ itemId, itemName, memo, primary }]`. **단가는 없음** → `/prices`로 조회.

### 전체 단가 상세 `GET /api/contracts/{id}/prices` → `PriceDetailResponse[]`
```jsonc
[{
  "priceId": 2, "priceType": "FINAL", "priceSource": "CALCULATED",
  "periodStart": "…", "periodEnd": "…", "confirmedAt": "…",
  "avgLmePrice": 9500, "avgExchange": 1380, "baseUnitPrice": 9200,
  "items": [{ "itemId": 3, "itemName": "밀베리", "primary": true,
              "rate": 96.5, "premium": 50, "finalUnitPrice": 9236.8 }]
}]
```

### 거래 `GET /api/contracts/{id}/transactions` → `TransactionResponse[]`
`transactionId, itemId, transactionDate, quantity, unitPrice, priceType, amount, paidCurrency, paidForeign, paidExchange, paidAmount, paidDate, paymentMemo, memo, finalSettlement`.
- 결제여부는 `paidForeign`/`paidAmount`/`paidDate` 유무로 판정.
- 결제 정보가 등록된 거래는 결제 완료이며, 정산금액과 결제금액의 차액은 표시하지 않는다.

### 거래 통계 `GET /api/contracts/{id}/transactions/statistics` → `TransactionStatisticsResponse`
전체 집계 필드: `transactionCount`, `paidTransactionCount`, `unpaidTransactionCount`,
`totalQuantityKg`, `contractQuantityKg`, `remainingContractQuantityKg`,
`deliveryProgressRate`, `weightedAverageUnitPrice`, `totalSettlementAmount`,
`totalPaidAmount`, `outstandingAmount`, `hasFinalSettlement`, 거래 시작·최근일.

`items[]`에는 품목별 거래 건수·수량·가중평균 단가·정산/결제/미결제 금액과
마지막 정산 완료 여부가 포함된다.
미결제금액은 결제 정보가 없는 거래의 정산금액 합계이며, 결제 완료 거래는 금액 차이와 관계없이 제외된다.

### 시장 배너 `GET /api/price/latest`
```jsonc
{
  "lme": { "baseDate": "2026-07-14", "price": 13541.0, "priceChange": … },
  "exchange": { "baseDate": "2026-07-15", "rate": 1492.2, "rateChange": … },
  "krwPerKg": 20205                 // 원화환산 원/kg
}
```
- LME·환율 기준일이 서로 다를 수 있어 각각 표시, 원화환산은 파생값이라 날짜 생략.

---

## 5. 필드명 매핑 (서버 ↔ 표시)

| 서버 필드 | 화면 표기 |
|---|---|
| `contractName` | 계약명 |
| `contractNo` | 계약번호(선택) |
| `ownerCompany` | 소속회사(자사) |
| `customerId` → `/api/companies` name | 거래처 |
| `tradeType` | 거래구분 |
| `priceUnit` | 단가 단위 |
| `contractQuantity` | 계약 수량(`priceUnit` 기준 값을 변환 없이 표시 — `formatQuantity`) |
| `status` | 상태 |
| `finalUnitPrice` / `baseUnitPrice` / `unitPrice` | 단가 |
| `amount` | 정산금액 |
