# 재고 통계 프론트엔드 구현 요청

> 상태: 기준일 품목별 재고 조회, 일자별 거래처·품목 거래량, 재고 확인·품목 간 이동·증감 보정
> 작성일: 2026-10-22  
> 백엔드 설계: [외부 계근 데이터·재고 원장 설계](design-decisions.md)

재고 통계 화면은 원본 계근데이터를 기준으로 **처음부터 지정한 날짜까지 누적된 품목별 재고**를
보여준다. 상위 품목은 하위 품목을 모두 합친 값으로 표시하고, 품목을 다중 선택하면 선택한 품목만
보여준다.

실무자는 매일 재고를 확인하고 장부와 다르면 보정한다. 가장 흔한 보정은 같은 자사 안에서 A 품목
재고를 B 품목으로 옮기는 **품목 간 이동**이고, 계근에 없는 재고를 넣거나 빼는 **증감 보정**도
할 수 있다. 보정 화면은 [5장](#5-재고-보정)을 따른다.

## 1. 재고 계산 기준

| 항목 | 기준 |
|---|---|
| 수량 단위 | kg |
| 매입(`PURCHASE`) | `+인수량` |
| 매출(`SALE`) | `-인수량` |
| 수량 원본 | 원본 계근데이터 값. 거래 확인 스냅샷·적용 단가·실제출고량은 사용하지 않음 |
| 수기 거래 | 포함하지 않음 |
| 집계 기간 | 처음부터 기준일 당일까지 (계량일자 기준) |
| 원본 삭제 계근 | 제외 |
| 품목 미매핑 계근 | 재고에서 제외하고 `unmapped`로 별도 요약 |

재고 확인·품목 간 이동·증감 보정 내역은 발생일 기준으로 재고에 반영된다. 취소된 보정은 취소
내역이 같은 발생일로 반대 방향 수량을 더하므로 합계에서 상쇄된다.

## 2. 화면 구성

### 검색 조건

| 조건 | 파라미터 | 설명 |
|---|---|---|
| 기준일 | `asOfDate` | `YYYY-MM-DD`. 기본값 오늘 |
| 자사 | `ownerCompany` | `호재`=`HOJAE`, `우남`=`WOONAM`, `전체`=파라미터 생략 |
| 품목 | `itemIds` | 다중 선택. 선택하지 않으면 전체 품목 |

품목 선택 목록은 기존 품목 API(`GET /api/items`)의 `itemId`, `itemName`, `parentItemId`로
트리를 구성한다. 상위 품목과 하위 품목을 함께 선택할 수 있다.

### 결과 표시

- **전체 조회(품목 미선택):** 응답 `items`를 트리(또는 들여쓰기 표)로 표시한다. 상위 품목 행은
  접고 펼칠 수 있게 하고, 접힌 상태에서도 상위 품목 값은 하위 합계이므로 그대로 보여준다.
- **다중 선택:** 선택한 품목만 응답되며 각 행의 재고는 해당 품목의 하위 합계다.
- **합계:** `totalQuantityKg`를 그대로 표시한다. `items[].quantityKg`를 프론트에서 더하지 않는다.
  상위·하위를 함께 선택하면 하위 품목 수량이 두 번 더해지기 때문이다.
- **미매핑 경고:** `unmapped`의 건수가 1 이상이면 "품목 미매핑 계근 N건(X kg)은 재고에
  반영되지 않았습니다" 경고를 표시하고 계근 매핑 화면으로 이동하는 링크를 제공한다.
- **음수 재고:** 재고가 음수일 수 있다(기초재고 미입력, 매핑 오류 등). 값을 숨기지 말고 강조
  색상으로 표시한다.

### 품목 행 표시값

| 표시 | 응답 필드 | 비고 |
|---|---|---|
| 품목명 | `itemName` | `depth`만큼 들여쓰기 |
| 재고(kg) | `quantityKg` | 하위 품목 포함 합계. 기본 표시값 |
| 자체 재고(kg) | `ownQuantityKg` | 이 품목명으로 직접 계근된 수량. 하위 품목이 있는 행에서만 보조 표시 |

`상동`, `A동`처럼 상위 품목 이름으로 직접 계근되는 경우가 있어 상위 품목의 `ownQuantityKg`가
0이 아닐 수 있다. 상위 품목의 `quantityKg` = `ownQuantityKg` + 모든 하위 품목의 `ownQuantityKg`.

## 3. API

### 기준일 품목별 재고 조회

```text
GET /api/inventory/stock?asOfDate=2026-10-22&ownerCompany=HOJAE&itemIds=3,12
```

`itemIds`는 콤마 구분(`itemIds=3,12`)과 반복(`itemIds=3&itemIds=12`) 모두 가능하다.

#### 응답

```json
{
  "asOfDate": "2026-10-22",
  "ownerCompany": "HOJAE",
  "items": [
    {
      "itemId": 3,
      "itemName": "A동",
      "parentItemId": null,
      "depth": 0,
      "ownQuantityKg": 1200.0000,
      "quantityKg": 5400.0000
    },
    {
      "itemId": 12,
      "itemName": "밀베리",
      "parentItemId": 3,
      "depth": 1,
      "ownQuantityKg": 4200.0000,
      "quantityKg": 4200.0000
    }
  ],
  "totalQuantityKg": 5400.0000,
  "unmapped": {
    "purchaseCount": 2,
    "purchaseQuantityKg": 830.0000,
    "saleCount": 0,
    "saleQuantityKg": 0
  }
}
```

| 필드 | 설명 |
|---|---|
| `asOfDate` | 적용된 기준일. 요청에서 생략하면 오늘 |
| `ownerCompany` | 적용된 자사. 전체 조회면 `null` |
| `items[]` | 최상위 품목부터 깊이 우선 순서(부모 바로 아래에 자식)로 정렬된 품목별 재고 |
| `items[].parentItemId` | 상위 품목 ID. 최상위 품목은 `null` |
| `items[].depth` | 최상위 0부터 시작하는 계층 깊이 |
| `items[].ownQuantityKg` | 해당 품목 자체 재고(kg) |
| `items[].quantityKg` | 하위 품목을 모두 합산한 재고(kg) |
| `totalQuantityKg` | 선택 품목의 하위 품목을 중복 없이 합산한 재고(kg). 미선택 시 전체 재고 |
| `unmapped` | 기준일까지 품목 미매핑으로 재고에서 제외된 계근의 매입·매출별 건수와 인수량 합계 |

전체 조회에서는 비활성(삭제된) 품목이 재고가 남아 있을 때만 포함된다. 다중 선택 결과의 순서도
요청 순서가 아니라 트리 순서다.

#### 오류

| 코드 | 상태 | 상황 |
|---|---|---|
| `ITEM_NOT_FOUND` | 404 | `itemIds`에 존재하지 않거나 삭제된 품목이 포함됨 |

### 일자별 거래처·품목 거래량 조회

재고 통계 화면에서 기준일 재고와 함께 **그날 어느 거래처와 어떤 품목을 얼마나 거래했는지**를
입고와 출고로 나눠 보여준다. 재고 조회와 같은 날짜·자사·품목 조건을 그대로 넘기면 된다.

```text
GET /api/inventory/stock/daily-trades?date=2026-10-22&ownerCompany=HOJAE&itemIds=3
```

| 조건 | 파라미터 | 설명 |
|---|---|---|
| 날짜 | `date` | 계량일자 하루. 기본값 오늘. 재고 조회의 `asOfDate`와 같은 값을 넘긴다 |
| 자사 | `ownerCompany` | `HOJAE` / `WOONAM` / 생략=전체 |
| 품목 | `itemIds` | 선택 품목과 그 **하위 품목**의 거래만 집계. 생략하면 전체 |

집계 기준:

- 수량은 원본 계근데이터의 인수량(kg)이다. 수기 거래는 포함하지 않는다.
- 원본에서 삭제된 계근은 제외한다.
- 품목 행은 계근된 품목 그대로 보여준다. 하위 품목을 상위 품목으로 합치지 않는다.
- 거래처·품목이 매핑되지 않은 계근도 **포함**한다. 원본 이름으로 표시하고 `companyMapped` /
  `itemMapped`가 `false`이다. 단, `itemIds`를 지정하면 미매핑 품목은 어떤 품목인지 알 수 없어 제외된다.
- 전체 자사 조회에서 한 거래처가 호재·우남과 모두 거래했다면 합산해 한 행으로 보여준다.
- 거래처는 거래량이 많은 순, 거래처 안의 품목도 거래량이 많은 순으로 정렬된다.

#### 응답

```json
{
  "date": "2026-10-22",
  "ownerCompany": "HOJAE",
  "purchase": {
    "totalQuantityKg": 9300.0000,
    "weighingCount": 4,
    "companies": [
      {
        "companyId": 5,
        "companyName": "가나금속",
        "companyMapped": true,
        "totalQuantityKg": 8100.0000,
        "weighingCount": 3,
        "items": [
          { "itemId": 3, "itemName": "A동", "itemMapped": true, "quantityKg": 5200.0000, "weighingCount": 2 },
          { "itemId": 12, "itemName": "밀베리", "itemMapped": true, "quantityKg": 2900.0000, "weighingCount": 1 }
        ]
      },
      {
        "companyId": null,
        "companyName": "다라상사",
        "companyMapped": false,
        "totalQuantityKg": 1200.0000,
        "weighingCount": 1,
        "items": [
          { "itemId": null, "itemName": "A동 차핑2", "itemMapped": false, "quantityKg": 1200.0000, "weighingCount": 1 }
        ]
      }
    ]
  },
  "sale": {
    "totalQuantityKg": 0,
    "weighingCount": 0,
    "companies": []
  }
}
```

| 필드 | 설명 |
|---|---|
| `purchase` / `sale` | 입고(매입) / 출고(매출) 집계 |
| `*.totalQuantityKg`, `*.weighingCount` | 해당 구분 전체 인수량 합계와 계근 건수 |
| `companies[].companyId` | 내부 거래처 ID. 미매핑이면 `null` |
| `companies[].companyName` | 매핑되면 정식 상호명, 미매핑이면 원본 거래처명. 원본도 없으면 `null` |
| `companies[].companyMapped` | 거래처 매핑 여부 |
| `companies[].items[].itemId` | 내부 품목 ID. 미매핑이면 `null` |
| `companies[].items[].itemName` | 매핑되면 품목명, 미매핑이면 원본 품목명. 원본도 없으면 `null` |
| `companies[].items[].itemMapped` | 품목 매핑 여부 |
| `companies[].items[].quantityKg` | 해당 거래처·품목의 인수량 합계(kg) |

#### 화면 표시

- 입고와 출고를 탭 또는 좌우 두 표로 나눈다.
- 거래처 행 아래에 품목별 수량을 펼쳐 보여준다. 예: `가나금속 8,100kg` → `A동 5,200kg`, `밀베리 2,900kg`.
  거래처 × 품목 교차표로 보여줘도 된다.
- 미매핑 거래처·품목은 [계근 거래 화면](weighing-transaction-frontend.md)과 같은 `미매핑` 배지를
  붙이고, `companyName`/`itemName`이 `null`이면 `거래처 미입력` / `품목 미입력`으로 표시한다.
- 미매핑 품목 거래는 기준일 재고에 반영되지 않는다. 그래서 이 표의 입출고 합계와 재고 증감이 다를 수
  있다. 차이는 재고 조회 응답의 `unmapped`에서 확인한다.
- 거래가 없으면 `companies`가 빈 배열이다. "거래 없음"으로 표시한다.

#### 오류

| 코드 | 상태 | 상황 |
|---|---|---|
| `ITEM_NOT_FOUND` | 404 | `itemIds`에 존재하지 않거나 삭제된 품목이 포함됨 |

## 4. 재고 보정 원칙

- **자사 단위:** 모든 보정은 자사 하나(`HOJAE` 또는 `WOONAM`)에 속한다. 품목 간 이동은 같은
  자사 안에서만 일어나며 자사 간 이동은 없다. 보정 화면에서는 자사 `전체`를 선택할 수 없다.
- **발생일:** 날짜만 입력한다(`occurredDate`, 기본값 오늘). 미래 날짜는 입력할 수 없다. 과거
  날짜로 등록하면 그날 이후의 기준일 재고가 모두 바뀐다.
- **수정·삭제 없음:** 잘못 등록한 보정은 수정하거나 삭제하지 않고 **취소**한다. 취소하면 반대
  방향 내역이 원래 발생일로 추가된다. 한 내역은 한 번만 취소할 수 있고 취소 내역은 다시 취소할 수 없다.
  다시 맞추려면 취소 후 새로 등록한다.
- **사유:** 선택 입력(500자 이하)이다. 비우면 서버가 유형별 기본 사유(`품목 이동`, `재고 추가`,
  `재고 차감`, `재고 확인 보정`, `보정 취소 #ID`)를 저장한다.
- **재고 부족 허용:** 이동·차감 수량이 현재 장부 재고보다 커도 막지 않는다. 결과가 음수가 되면
  저장 전에 경고만 표시하는 것을 권장한다.
- **작업자:** 로그인 사용자로 자동 기록되며 내역 조회에서 `createdByName`으로 표시한다.

## 5. 재고 보정

### 5-1. 일일 재고 확인

재고 현황 표에서 품목별 **실제 수량**을 입력해 한 번에 저장한다. 서버는 기준일의 장부 재고와 비교해
차이가 있는 품목만 증감 보정을 만든다.

- 화면 흐름: 재고 조회(자사·기준일 선택) → 실제 수량 입력 칸 표시 → 차이(실제 - 장부) 미리보기 →
  저장 → 응답의 `differenceKg`, `movementId`로 결과 표시
- **장부 재고 기준은 품목 자체 수량(`ownQuantityKg`)** 이다. 하위 품목이 있는 상위 품목에 실제
  수량을 입력하면 하위 품목을 제외한 상위 품목 자체 재고만 맞춘다. 미리보기도 `ownQuantityKg`와
  비교해야 서버 결과와 같다. 화면에서는 하위 품목이 없는 품목 위주로 입력받는 것을 권장한다.
- 실제 수량 0은 "재고 없음"으로 보정된다. 확인하지 않은 품목은 요청에 넣지 않는다.
- 그날 계근이 모두 끝난 뒤 확인하는 것을 전제로 한다. 확인 후 같은 날 들어온 계근도 그날 재고에
  포함되므로 장부가 다시 달라질 수 있다.

```text
POST /api/inventory/movements/stock-counts
```

```json
{
  "ownerCompany": "HOJAE",
  "occurredDate": "2026-10-22",
  "items": [
    { "itemId": 12, "actualQuantityKg": 4000 },
    { "itemId": 15, "actualQuantityKg": 800 }
  ],
  "reason": "10/22 마감 실사"
}
```

```json
{
  "message": "재고 확인이 반영되었습니다.",
  "data": {
    "occurredDate": "2026-10-22",
    "items": [
      { "itemId": 12, "bookQuantityKg": 4200.0000, "actualQuantityKg": 4000,
        "differenceKg": -200.0000, "movementId": 31 },
      { "itemId": 15, "bookQuantityKg": 800.0000, "actualQuantityKg": 800,
        "differenceKg": 0.0000, "movementId": null }
    ]
  }
}
```

### 5-2. 품목 간 이동 (가장 자주 사용)

같은 자사 안에서 출발 품목의 재고를 도착 품목으로 옮긴다. 전체 재고 합계는 변하지 않는다.
재고 현황 표의 품목 행에서 바로 "이동" 버튼으로 출발 품목을 채운 입력창을 여는 것을 권장한다.

```text
POST /api/inventory/movements/transfers
```

```json
{
  "ownerCompany": "HOJAE",
  "occurredDate": "2026-10-22",
  "fromItemId": 3,
  "toItemId": 12,
  "quantityKg": 500,
  "reason": "A동 선별 → 밀베리"
}
```

```json
{ "message": "품목 간 이동이 등록되었습니다.", "data": { "movementId": 32 } }
```

출발 품목과 도착 품목은 달라야 한다. 상위 품목과 그 하위 품목 사이의 이동도 가능하며, 이 경우
상위 품목의 합계 재고(`quantityKg`)는 변하지 않고 자체 재고만 옮겨진다.

### 5-3. 재고 증감

계근에 없는 재고를 넣거나(`INCREASE`) 빼는(`DECREASE`) 보정이다. 기초재고 입력, 폐기·분실 등에 쓴다.

```text
POST /api/inventory/movements/adjustments
```

```json
{
  "ownerCompany": "WOONAM",
  "occurredDate": "2026-10-01",
  "itemId": 7,
  "direction": "INCREASE",
  "quantityKg": 12000,
  "reason": "기초재고"
}
```

```json
{ "message": "재고 보정이 등록되었습니다.", "data": { "movementId": 33 } }
```

### 5-4. 보정 내역 조회

```text
GET /api/inventory/movements?ownerCompany=HOJAE&dateFrom=2026-10-01&dateTo=2026-10-31&itemId=12&movementType=TRANSFER&page=1&size=20
```

| 조건 | 파라미터 | 설명 |
|---|---|---|
| 자사 | `ownerCompany` | 생략하면 전체 |
| 발생일 | `dateFrom`, `dateTo` | 포함 범위 |
| 품목 | `itemId` | 출발 또는 도착 품목이 이 품목인 내역 |
| 유형 | `movementType` | `ADJUSTMENT_INCREASE`, `ADJUSTMENT_DECREASE`, `TRANSFER` |

정렬은 발생일 최신순이며 응답은 공통 페이지 형식(`content`, `page`, `size`, `totalElements`,
`totalPages`, `isFirst`, `isLast`)이다.

```json
{
  "movementId": 32,
  "ownerCompany": "HOJAE",
  "movementType": "TRANSFER",
  "fromItemId": 3,
  "fromItemName": "A동",
  "toItemId": 12,
  "toItemName": "밀베리",
  "quantityKg": 500.0000,
  "occurredDate": "2026-10-22",
  "reason": "A동 선별 → 밀베리",
  "reversalOfId": null,
  "canceledByMovementId": null,
  "createdBy": "6f1c...",
  "createdByName": "홍길동",
  "createdAt": "2026-10-22T17:40:12"
}
```

| 표시 | 응답 필드 | 표시 방법 |
|---|---|---|
| 유형 | `movementType` | `재고 증가` / `재고 감소` / `품목 이동` |
| 품목 | `fromItemName`, `toItemName` | 이동은 `A동 → 밀베리`, 증가는 도착 품목, 감소는 출발 품목 |
| 취소됨 | `canceledByMovementId` | 값이 있으면 `취소됨` 배지, 취소 버튼 비활성 |
| 취소 내역 | `reversalOfId` | 값이 있으면 `취소 #원장ID` 배지, 취소 버튼 숨김 |

### 5-5. 보정 취소

```text
POST /api/inventory/movements/{movementId}/cancel
```

```json
{ "reason": "수량 오입력" }
```

본문과 사유는 생략할 수 있다. 응답의 `data.movementId`는 새로 만들어진 취소 내역의 ID다.

```json
{ "message": "재고 보정이 취소되었습니다.", "data": { "movementId": 34 } }
```

### 오류

| 코드 | 상태 | 상황 |
|---|---|---|
| `INVALID_INPUT` | 400 | 수량 0 이하, 출발·도착 품목 동일, 미래 날짜, 사유 500자 초과, 재고 확인 품목 없음·중복·음수 |
| `ITEM_NOT_FOUND` | 404 | 존재하지 않거나 삭제된 품목 |
| `INVENTORY_MOVEMENT_NOT_FOUND` | 404 | 취소 대상 내역 없음 |
| `INVENTORY_MOVEMENT_ALREADY_CANCELED` | 409 | 이미 취소된 내역 |
| `INVENTORY_MOVEMENT_NOT_CANCELABLE` | 400 | 취소 내역을 다시 취소 |

## 6. 구현 순서

1. 기준일·자사·품목 다중 선택 검색 조건
2. 품목 트리 형태의 재고 표와 합계
3. 미매핑 경고와 계근 매핑 화면 연결
4. 음수 재고 강조
5. 같은 날짜의 거래처·품목별 입고·출고 거래량 표
6. 품목 간 이동 입력
7. 일일 재고 확인(실제 수량 입력·차이 미리보기)
8. 재고 증감과 보정 내역 조회·취소
