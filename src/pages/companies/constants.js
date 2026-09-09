// 목록 필터 맨 앞에 붙는 전체 옵션
export const ALL_COMPANY_TYPE_OPTION = { value: "", label: "전체" };

// 거래처 유형 기본 선택값.
// 정상 경로는 GET /api/enums/COMPANY_TYPE 이며, 조회 실패 시 화면이 비지 않도록 사용한다.
export const COMPANY_TYPE_FALLBACK_OPTIONS = [
  { value: "PURCHASE", label: "매입처" },
  { value: "SALES", label: "매출처" },
  { value: "OTHER", label: "기타" },
];
