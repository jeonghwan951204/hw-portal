# 거래처 관리 기능

> 2026-09-09 기준 프론트엔드 구현 및 개발 API 연동 상태를 정리한다.
> 개발 API 문서: `https://dev-api.jeongcloud.cloud/swagger-ui/index.html`

## 1. 기능 개요

거래처 관리에서는 다음 기능을 제공한다.

- 거래처 목록 조회
- 회사명 또는 별칭 검색
- 거래처 유형 필터(전체 + 서버 enum)
- 목록에서 사업자등록번호·전화번호·이메일·계좌번호 복사
- 목록 행에서 상세정보 펼치기
- 거래처 등록 및 수정
- 거래처 삭제(서버 soft delete)
- 관련 첨부파일 선택 및 드래그 앤 드롭 업로드
- 계약 입력 화면의 거래처 선택 목록 제공

목업 데이터와 `sessionStorage` 저장 방식은 제거했으며 모든 거래처 데이터는 실제 API를
통해 조회하고 변경한다.

## 2. 라우트와 메뉴

| 경로 | 화면 |
|---|---|
| `/companies` | 거래처 목록 및 상세 펼치기 |
| `/companies/new` | 신규 거래처 등록 |
| `/companies/:id/edit` | 기존 거래처 수정 |

모든 경로는 `RequireAuth`로 보호되며 `USER`, `ADMIN` 권한에서 접근할 수 있다. 메뉴는
헤더의 **운영관리 → 거래처관리**에 있다.

## 3. 폴더 구조

```text
src/pages/companies/
├── index.jsx                         # 목록 페이지 조립
├── form.jsx                          # 등록·수정 페이지 조립
├── constants.js                      # 거래처 유형 전체 옵션 및 기본 선택값
├── api/
│   ├── companyApi.js                 # 거래처·첨부파일 API와 데이터 변환
│   └── enumsApi.js                   # 거래처 선택값 enum 조회
├── hooks/
│   ├── useCompanyTypeOptions.js      # 거래처 유형 선택값 로더(모듈 캐시)
│   ├── useCompanyList.js             # 목록·검색·필터·삭제·복사 상태
│   └── useCompanyForm.js             # 등록·수정 폼 상태와 저장 처리
└── components/
    ├── CompanyToolbar.jsx            # 검색과 거래처 유형 필터
    ├── CompanyList.jsx               # PC 테이블·모바일 목록
    ├── CompanyDetail.jsx             # 펼침 상세정보
    ├── CompanyForm.jsx               # 등록·수정 공용 폼
    ├── CompanyDeleteModal.jsx        # 삭제 확인
    ├── BankAccounts.jsx              # 계좌 표시
    ├── PhoneNumbers.jsx              # 전화번호 표시
    └── CopyableValue.jsx             # 클릭 복사
```

페이지는 조립만 담당하고 API 호출은 `api/`, 상태와 이벤트 처리는 `hooks/`, 표시는
`components/`에 둔다.

## 4. 사용 API

모든 백엔드 요청은 `apiFetch`를 사용한다. 액세스 토큰 첨부와 401 발생 시 토큰 재발급은
`src/utils/api.js`에서 공통 처리한다.

| 메서드와 경로 | 용도 |
|---|---|
| `GET /api/companies` | 관리 목록 조회 |
| `GET /api/companies/{companyId}` | 상세 및 수정 초기값 조회 |
| `POST /api/companies` | 거래처 등록 |
| `PUT /api/companies/{companyId}` | 거래처 수정 |
| `DELETE /api/companies/{companyId}` | 거래처 soft delete |
| `GET /api/companies/options` | 계약 입력의 거래처 선택 목록 |
| `GET /api/enums/COMPANY_TYPE` | 거래처 유형 선택값 |
| `POST /api/files/uploads` | 파일 메타정보 등록 및 업로드 URL 발급 |
| `POST /api/files/{fileId}/complete` | S3 업로드 완료 처리 |

조회 API는 응답 객체 또는 배열을 그대로 반환한다. 등록·수정·삭제와 파일 변경 API는
`CommonResponse { message, data? }` 형식으로 반환한다.

## 5. 목록 화면

### 조회 흐름

`GET /api/companies` 응답에는 거래처 유형, 별칭, 이메일, 주소, 메모, 첨부파일이 없다.
현재 화면의 필터와 상세 펼치기에 필요한 데이터를 구성하기 위해 다음 순서로 조회한다.

```text
GET /api/companies
        │
        ├─ companyId별 GET /api/companies/{companyId}
        │
        └─ 목록 요약 + 상세 응답 병합 → 화면 표시
```

상세 조회 한 건이 실패하면 해당 거래처는 목록 요약 정보만 표시한다. 목록 자체가 실패하면
오류 메시지와 **다시 시도** 버튼을 표시한다.

### 검색과 필터

- 검색은 이미 조회한 목록에서 회사명과 별칭을 대상으로 처리한다.
- 필터는 `GET /api/enums/COMPANY_TYPE` 응답의 거래처 유형을 대상으로 처리한다.
- 필터 항목은 **전체** + 서버 enum 응답으로 구성한다([거래처 선택값 enum](#12-거래처-선택값-enum) 참고).

### 목록 노출 여부

- 전화번호와 이메일 폼에는 **목록 노출** 체크박스가 있다.
- 화면 상태에서는 `listVisible`, API 요청에서는 `isListVisible`을 사용한다.
- 목록에는 `listVisible === true`인 전화번호와 이메일만 표시한다.
- 상세 펼침에서는 노출 여부와 관계없이 전체 연락처를 표시한다.
- 관리 목록 API의 전화번호는 서버에서 노출 허용 항목만 내려온다.
- 이메일은 관리 목록 응답에 없으므로 상세 응답의 `isListVisible`로 목록 표시 여부를 판단한다.

사업자등록번호, 전화번호, 이메일, 주소, 계좌번호는 화면에서 클릭하여 복사할 수 있다.

## 6. 등록·수정 폼

### 입력 항목

| 항목 | 규칙 |
|---|---|
| 거래처 구분(유형) | `GET /api/enums/COMPANY_TYPE` 선택값 |
| 회사명 | 필수 |
| 거래처 별칭 | 복수 입력, 빈 값 제외 |
| 대표자 | 선택 |
| 사업자등록번호 | 선택, 빈 값은 `null` 전송 |
| 계좌정보 | 라벨·은행명·계좌번호, 복수 입력 |
| 전화번호 | 라벨·번호·목록 노출 여부, 복수 입력 |
| 이메일 | 라벨·주소·목록 노출 여부, 복수 입력 |
| 주소 | 라벨·주소, 복수 입력 |
| 메모 | 선택 |
| 첨부파일 | 복수 선택 및 드래그 앤 드롭 |

등록과 수정은 같은 폼을 사용한다. 수정 화면에서는 상세 API 응답을 폼 모델로 변환해
초기값을 채운다. 저장 성공 후에는 `/companies` 목록으로 이동한다.

## 7. API 필드 매핑

| 화면 모델 | API 필드 |
|---|---|
| `id` | `companyId` |
| `name` | `companyName` |
| `aliases` | `aliases: string[]` |
| `representative` | `representativeName` |
| `businessNumber` | `businessRegistrationNumber` |
| `phoneNumbers` | `contacts` |
| `phoneNumbers[].value` | `contacts[].phoneNumber` |
| `phoneNumbers[].listVisible` | `contacts[].isListVisible` |
| `emails[].value` | `emails[].email` |
| `emails[].listVisible` | `emails[].isListVisible` |
| `addresses[].value` | `addresses[].address` |
| `attachments[].fileId` | `fileIds[]` |

빈 전화번호·이메일·주소는 요청 배열에서 제외한다. 계좌는 은행명 또는 계좌번호가 입력된
행만 전송한다.

## 8. 수정 시 배열 항목 ID 처리

수정 API는 계좌·전화번호·이메일·주소 배열을 최종 상태로 받는다.

- 상세 응답의 기존 항목 ID는 폼에서 `recordId`로 보존한다.
- 화면 렌더링용 임시 ID는 `id`를 사용해 서버 ID와 구분한다.
- 기존 항목은 요청에 `{ id: recordId, ...변경값 }` 형태로 전송한다.
- 폼에서 새로 추가한 항목은 서버 ID가 없으므로 `id` 필드를 보내지 않는다.
- 폼에서 삭제한 기존 항목은 최종 배열에 포함하지 않는다.
- 서버는 최종 배열에서 빠진 기존 항목을 soft delete한다.

예시:

```jsonc
{
  "contacts": [
    {
      "id": 12,
      "label": "대표전화",
      "phoneNumber": "02-1234-5678",
      "isListVisible": true
    },
    {
      "label": "물류담당",
      "phoneNumber": "010-1234-5678",
      "isListVisible": false
    }
  ]
}
```

첫 번째 연락처는 ID를 기준으로 수정되고 두 번째 연락처는 신규 등록된다.

## 9. 첨부파일 처리

사용자는 파일 선택 영역을 클릭하거나 파일을 끌어다 놓아 여러 파일을 추가할 수 있다.
저장은 파일별로 다음 순서로 처리한다.

1. `POST /api/files/uploads`에 파일명, Content-Type, 크기를 전달한다.
2. 응답의 `uploadUrl`과 `requiredHeaders`를 사용해 S3로 직접 `PUT`한다.
3. `POST /api/files/{fileId}/complete`로 업로드 완료를 알린다.
4. 완료된 신규 파일 ID와 유지할 기존 파일 ID를 `fileIds` 배열로 거래처 저장 API에 전달한다.

수정 시 제거한 첨부파일 ID는 `fileIds`에서 제외한다. 거래처 연결은 해제되지만 원본 파일
처리 정책은 서버를 따른다. 상세 응답의 `downloadUrl`은 단기 유효 URL이므로 화면에서는
새 탭 링크로 제공한다.

## 10. 삭제

목록의 **삭제** 버튼을 누르면 거래처명을 포함한 확인 모달을 표시한다. 확인 후
`DELETE /api/companies/{companyId}`를 호출한다. 성공하면 현재 목록 상태에서 해당 거래처를
제거하며, 실패하면 모달 안에 서버 오류 메시지를 표시한다.

서버 삭제는 soft delete이며 기존 계약 참조와 과거 기록 보존 정책은 백엔드에서 처리한다.

## 11. 현재 API 확인 사항

2026-09-09 개발 Swagger 기준:

- 수정 요청의 `BankAccountCreate`, `ContactCreate`, `EmailCreate`, `AddressCreate`에는
  nullable `id`가 정의되어 있다.
- 이메일 상세 응답에는 `id`, `isListVisible`이 정의되어 있다.
- 주소 상세 응답에는 `id`가 정의되어 있다.
- 전화번호 상세 스키마에는 아직 `id`, `isListVisible`이 표시되지 않는다.
- 계좌 상세 스키마에는 아직 `id`가 표시되지 않는다.

프론트는 전화번호·계좌 실제 응답에 ID와 노출 여부가 포함되면 이를 읽고 보존하도록
작성되어 있다. 다만 Swagger와 실제 응답 모두에서 ID가 내려오지 않으면 수정 요청에 기존
ID를 포함할 수 없으므로 백엔드 상세 응답 스키마를 확인해야 한다.

전화번호의 `isListVisible`이 상세 응답에 없을 때는 관리 목록에 포함된 전화번호와
라벨·번호를 대조해 수정 폼의 체크 상태를 복원한다.

## 12. 거래처 선택값 enum

거래처에서 선택값으로 다루는 항목은 **거래처 유형(`type`)** 하나다. 계좌·전화번호·
이메일·주소의 `label`은 API 스키마상 자유 입력 문자열이므로 enum이 아니다.

| 항목 | API 값 | 처리 |
|---|---|---|
| 거래처 유형 | `PURCHASE` 매입처 · `SALES` 매출처 · `OTHER` 기타 | `GET /api/enums/COMPANY_TYPE` 조회 |
| 계좌·연락처·이메일·주소 라벨 | 자유 문자열 | 입력값 그대로 전송 |

### 조회 구조

계약 화면과 동일하게 `GET /api/enums/{group}` 을 사용한다.

- `api/enumsApi.js` — `COMPANY_ENUM_GROUPS`, `fetchEnum(group)`, `fetchCompanyTypeOptions()`
- `hooks/useCompanyTypeOptions.js` — 모듈 캐시로 1회만 조회하고 다음 값을 반환한다.
  - `typeOptions`: 등록·수정 폼 셀렉트 옵션
  - `typeFilterOptions`: 목록 필터 옵션(맨 앞에 **전체**)
  - `typeLabelOf(value)`: 코드값 → 표시명(목록·상세 배지)

### 조회 실패 시 동작

`GET /api/enums/{group}` 의 허용 group 에 `COMPANY_TYPE` 이 포함되어 있다(2026-09-09
개발 Swagger 확인). 프론트는 서버 응답을 그대로 사용하며, 조회에 실패했을 때만
`constants.js`의 `COMPANY_TYPE_FALLBACK_OPTIONS` 로 화면을 유지한다. 실패는 캐시하지
않으므로 다음 화면 진입 때 다시 조회한다.

서버가 `OTHER`(기타)를 내려주므로 목록 필터와 등록·수정 폼 선택지에 **기타가 함께
노출된다**. 노출 대상을 줄이려면 백엔드 응답에서 제외한다.

## 13. 확인 시나리오

1. 거래처 등록에서 별칭과 복수 연락처를 입력한다.
2. 전화번호와 이메일 일부만 **목록 노출**로 체크한다.
3. 파일 선택과 드래그 앤 드롭을 각각 확인한 뒤 등록한다.
4. 저장 후 목록으로 이동하고 체크한 연락처만 목록에 표시되는지 확인한다.
5. 상세 펼침에서 전체 연락처·주소·계좌·첨부파일이 표시되는지 확인한다.
6. 수정 화면에서 기존 배열 항목을 변경하고 새 항목을 추가하며 기존 항목 하나를 삭제한다.
7. 저장 후 상세를 다시 열어 기존 항목 수정, 신규 추가, 삭제 반영을 확인한다.
8. 계약 등록 화면에서 거래처 선택 목록이 정상 조회되는지 확인한다.
9. 목록 필터와 등록 폼에 서버 enum 기반 거래처 유형(매입처·매출처·기타)이 표시되고,
   필터로 유형별 목록이 걸러지는지 확인한다.
