// ─── 임시 데이터 ──────────────────────────────────────────────────────────────
export const MOCK_CONTRACTS = [
  {
    id: 1,
    name: "2026년 상반기 구리 공급 계약",
    customer: "한국전선(주)",
    provisionalPeriod: { start: "2026-01-01", end: "2026-03-31" },
    finalPeriod:       { start: "2026-04-01", end: "2026-06-30" },
    provisionalPrice:  9123.50,
    finalPrice:        9267.00,
    currency:          "USD",
    status:            "확정",
  },
  {
    id: 2,
    name: "2026년 2분기 동판 구매 계약",
    customer: "삼성전기(주)",
    provisionalPeriod: { start: "2026-04-01", end: "2026-05-15" },
    finalPeriod:       { start: "2026-05-16", end: "2026-06-30" },
    provisionalPrice:  9445.00,
    finalPrice:        null,
    currency:          "USD",
    status:            "진행중",
  },
  {
    id: 3,
    name: "2026년 연간 구리 원자재 공급",
    customer: "LS전선(주)",
    provisionalPeriod: { start: "2026-01-01", end: "2026-06-30" },
    finalPeriod:       { start: "2026-07-01", end: "2026-12-31" },
    provisionalPrice:  8989.50,
    finalPrice:        null,
    currency:          "USD",
    status:            "진행중",
  },
];

// ─── 상수 ─────────────────────────────────────────────────────────────────────
export const STATUS_STYLE = {
  확정:   "bg-emerald-100 text-emerald-700 border-emerald-200",
  진행중: "bg-blue-100 text-blue-700 border-blue-200",
  종료:   "bg-slate-100 text-slate-500 border-slate-200",
};

export const STATUS_FILTERS = ["전체", "진행중", "확정", "종료"];

// ─── 작성 폼 옵션 ─────────────────────────────────────────────────────────────
// TODO: 실제 API 연동 시 서버 목록으로 교체
export const CONTRACT_COMPANIES = ["한국전선(주)", "삼성전기(주)", "LS전선(주)"];
export const CONTRACT_TYPES = ["구리 공급", "동판 구매", "원자재 공급"];
export const CONTRACT_STATUSES = ["진행중", "확정", "종료"];

// ─── 유틸 ─────────────────────────────────────────────────────────────────────
export const formatPeriod = (start, end) =>
  `${start.replace(/-/g, ".")} ~ ${end.replace(/-/g, ".")}`;
