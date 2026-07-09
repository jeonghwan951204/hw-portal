# 계약 관리 화면 — 진행 상황 (핸드오프)

> 2026-07-09 기준. [frontend-design.md](./frontend-design.md) 설계대로 화면 골격을 구현한 상태.
> **API 연동 전 — 모든 데이터는 임시(mock)이며, 조작 결과는 화면 상태에만 반영됨(새로고침 시 초기화).**
>
> 새 세션에서 이어서 작업할 때: 이 문서와 `frontend-design.md`를 먼저 읽을 것.

---

## 1. 완료된 것

설계 문서의 3개 화면 + 공용 컴포넌트를 모두 구현. 기존 계약 화면(단일 목록 + 생성 모달)은 삭제하고 전면 재작성함.

### 라우트 ([src/App.jsx](../../src/App.jsx))

| 경로 | 화면 | 진입 파일 |
|---|---|---|
| `/contract` | 계약 목록 | `src/pages/contract/index.jsx` |
| `/contract/new` | 계약 등록 (스텝형) | `src/pages/contract/form.jsx` |
| `/contract/:id` | 계약 상세 (탭 2개) | `src/pages/contract/detail.jsx` |
| `/contract/:id/edit` | 계약 수정 (등록 화면 재사용, 값 프리필) | `src/pages/contract/form.jsx` |

### 폴더 구조 (`src/pages/contract/`)

```
contract/
├── index.jsx        # 목록 페이지 (배너 → 툴바 → 카드 그리드 → 페이지네이션)
├── detail.jsx       # 상세 페이지 (헤더 + 탭: 계약·단가 / 거래 내역)
├── form.jsx         # 등록/수정 페이지 (1 기본 → 2 단가 → 3 품목 → 4 확인)
├── constants.js     # 단가유형·상태 스타일, 셀렉트 임시 옵션, 표시 헬퍼
├── mockData.js      # 임시 계약 4건 + 시장 현황 (전부 서버 응답으로 교체 대상)
├── hooks/
│   ├── useToast.js           # 성공/오류 토스트 공용 훅
│   ├── useContractList.js    # 목록: 필터·검색·페이지·재계산
│   ├── useContractDetail.js  # 상세: 탭, 거래 추가, 결제 입력, 삭제
│   └── useContractForm.js    # 등록/수정: 스텝 상태 + 단가/품목 동적 행
└── components/
    ├── Toast.jsx / ConfirmModal.jsx / StatusBadge.jsx   # 공용
    ├── MarketBanner.jsx / ContractToolbar.jsx           # 목록
    ├── ContractGrid.jsx / ContractCard.jsx              # 목록
    ├── ContractDetailHeader.jsx                         # 상세
    ├── PriceInfoTab.jsx / TransactionTab.jsx / PaymentForm.jsx  # 상세 탭
    └── FormStepIndicator / Basic / Prices / Items / Confirm.jsx # 등록 스텝
```

패턴: 각 페이지는 훅 1개가 상태·핸들러 전부를 보유하고, 섹션별 그룹 객체를 반환 → 컴포넌트에 스프레드(`<MarketBanner {...market} />`). `price/`, `priceManagement/` 폴더와 같은 컨벤션.

### 설계 반영된 핵심 동작 (구현 완료)

- **목록 카드**: 단가를 유형별 세로 나열(`[유형] [산정기간·요율] …… [값] 원/kg`), 대표 품목 기준, 품목명 미표시. **정산가 줄은 확정가 확정 시에만 렌더** (`isSettlementVisible()` in constants.js).
- **재계산 버튼**: 로딩(스피너) → 완료 토스트. 현재는 1.2초 지연만 흉내.
- **상세 탭1**: 단가별 기간 줄 + 기준값(수출=LME만, 내수=LME+환율 조건부), 품목 표(대표 강조, 요율·프리미엄).
- **상세 탭2**: PC는 표 하단 입력 행 / 모바일은 [거래 추가] 버튼 → 폼. 거래 추가·결제 입력은 **확인 모달 없이 저장 후 토스트**. 단가유형 드롭다운에서 **정산가는 확정가 확정 시에만 노출**. 미결제 행 클릭 → 결제 폼 펼침(내수: 실입금액·입금일 / 수출: 수취 외화·환율·원화 입금액 직접 입력 + 달러 대조·원화 차액 참고 표시. 원화 입금액 자동계산 안 함).
- **등록/수정**: 스텝2에서 추가한 단가 배열이 스텝3 품목 테이블의 요율 컬럼을 동적 생성. 고정값 계산식이면 고정 단가 입력란 노출. 프리미엄은 [+프리미엄] 클릭 시에만 행 펼침(안 펼치면 값 없음). 대표 품목 라디오(첫 품목 기본). 저장 시 확인 모달("저장하시겠습니까?").
- **삭제**: 확인 모달(빨강 경고 스타일) → 목록으로 이동.
- 공용 `Pagination`(src/components), 로딩/빈 상태, 음수 입력 방지(0 허용) 처리됨.
- 날짜 `yyyy.MM.dd`, 숫자 천 단위 콤마, 목록은 `원/kg`·상세는 계약 통화/단위(`unitLabel()`).

---

## 2. 남은 것 — API 연동 (다음 작업)

**코드 내 `TODO: API 연동` 주석이 교체 지점 표시.** `rg "TODO" src/pages/contract` 로 전부 찾을 수 있음.

연동 시 규칙: 요청은 반드시 `apiFetch`([src/utils/api.js](../../src/utils/api.js)) 사용, API 함수는 `src/pages/contract/api/` 폴더를 새로 만들어 배치 (price 폴더의 `api/priceApi.js` 패턴 참고).

| 교체 지점 | 위치 | 현재 상태 |
|---|---|---|
| 목록 조회 (필터·검색·페이지네이션은 서버 책임) | `useContractList.js`의 `fetchContractsMock` | mock 필터링, 300ms 지연 |
| 시장 현황 (LME·환율, 기준일 각각) | `mockData.js`의 `MOCK_MARKET` | 고정값 |
| 재계산 요청 | `useContractList.js`의 `handleRecalculate` | 1.2초 지연만 |
| 상세 조회 | `useContractDetail.js`의 useEffect | mock에서 find + 복사 |
| 거래 추가 (단가·총금액은 **서버가 계산해 반환**) | `useContractDetail.js`의 `handleAddTransaction` | 품목 옵션 값으로 임시 계산 중 — 연동 시 프론트 계산 제거 |
| 결제 저장 | `useContractDetail.js`의 `handleSavePayment` | 상태만 갱신 |
| 계약 삭제 (soft delete는 서버) | `useContractDetail.js`의 `handleConfirmDelete` | 목록 이동만 |
| 등록/수정 저장 (검증 오류는 서버 메시지를 토스트로) | `useContractForm.js`의 `handleConfirmSave` | 토스트 후 이동만 |
| 수정 모드 프리필 | `useContractForm.js`의 useEffect + `contractToForm()` | mock에서 변환 |
| 셀렉트 옵션: 거래처 / 계산식 / 품목명 | `constants.js`의 `MOCK_CUSTOMERS`, `MOCK_FORMULAS`, `MOCK_ITEM_NAMES` | 하드코딩 배열 |

### 데이터 모양 (mock 기준 — 서버 응답 설계 시 참고)

`mockData.js`의 계약 구조가 화면이 기대하는 형태:

```js
{
  id, contractNo, company, status("진행중"|"완료"),
  startDate, endDate, tradeType("수출"|"내수"), priceUnit("TON"|"KG"),
  prices: [{ id, type, periodStart, periodEnd, formulaId, formulaName,
             fixedPrice, confirmed, lme, exchangeRate, krwPerKg }],
  items:  [{ id, name, isPrimary,
             options: { [priceId]: { rate, premium, value } } }],
  transactions: [{ id, date, itemName, priceType, quantity, unitPrice,
                   totalAmount, paid, payment }]
}
```

- `krwPerKg`: 목록 카드용 원/kg (대표 품목 기준, 서버 계산)
- `options[priceId].value`: 상세 품목 표의 계약 통화·단위 단가 (서버 계산)
- `confirmed`: 단가 확정 여부 (서버 판단) — 확정가의 confirmed가 정산가 노출을 결정

### 미결정 사항 (설계 문서의 "추후" 항목)

- 로딩 표시 형태 상세(현재 스피너+텍스트), 스텝 4 요약 레이아웃 다듬기, 목록 정렬 UI 노출 여부.
- mock 계약 4건은 조건부 UI 확인용(수출/내수 × 확정/미확정 × 완료 상태 조합) — 연동 후 삭제.

---

## 3. 확인 방법

`npm run dev` → `/contract` 접속. 빌드·린트는 아직 실행하지 않았음 (`npm run lint` 권장).
