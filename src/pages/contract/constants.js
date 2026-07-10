// ─── 코드성 상수 ──────────────────────────────────────────────────────────────
export const PRICE_TYPES = ["가단가", "확정가", "정산가", "원가"];
export const TRADE_TYPES = ["수출", "내수"];
export const PRICE_UNITS = ["TON", "KG"];
export const STATUS_FILTERS = ["전체", "진행중", "완료"];
export const PAGE_SIZE = 10;

export const STATUS_STYLE = {
  진행중: "bg-blue-100 text-blue-700 border-blue-200",
  완료: "bg-slate-100 text-slate-500 border-slate-200",
};

export const PRICE_TYPE_STYLE = {
  가단가: "bg-amber-50 text-amber-700 border-amber-200",
  확정가: "bg-emerald-50 text-emerald-700 border-emerald-200",
  정산가: "bg-violet-50 text-violet-700 border-violet-200",
  원가: "bg-slate-100 text-slate-600 border-slate-200",
};

// ─── 셀렉트 옵션 임시 데이터 (TODO: API 연동 시 서버 목록으로 교체) ───────────
export const MOCK_CUSTOMERS = [
  "한국전선(주)",
  "삼성전기(주)",
  "LS전선(주)",
  "포스코인터내셔널",
  "동국제강(주)",
];

export const MOCK_FORMULAS = [
  { id: "PERIOD_AVG", name: "산정기간 평균" },
  { id: "MONTH_AVG", name: "월평균" },
  { id: "FIXED", name: "고정값" },
];

export const MOCK_ITEM_NAMES = ["A동", "B동", "상동", "파동", "밀베리"];

// ─── 표시 헬퍼 ────────────────────────────────────────────────────────────────
// yyyy-MM-dd → yyyy.MM.dd
export const formatDate = (iso) => (iso ? iso.replaceAll("-", ".") : "-");

// 계약기간 카드 표기: yyyy.MM.dd – MM.dd
export const formatShortPeriod = (start, end) =>
  `${formatDate(start)} – ${end ? end.slice(5).replaceAll("-", ".") : "-"}`;

export const formatNumber = (value, digits = 0) =>
  value == null || value === ""
    ? "-"
    : Number(value).toLocaleString("ko-KR", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      });

// 계약 통화·단위 표기 (상세 화면용)
export const unitLabel = (contract) => {
  const unit = contract.priceUnit === "TON" ? "ton" : "kg";
  return contract.tradeType === "수출" ? `USD/${unit}` : `원/${unit}`;
};

// 계약 수량 표기 — 무게는 kg로 저장, 톤 계약이면 표시만 톤으로 (참고용)
export const formatQuantity = (contract) => {
  const kg = contract?.quantity;
  if (kg == null || kg === "") return "-";
  const num = Number(kg);
  if (Number.isNaN(num)) return "-";
  if (contract.priceUnit === "TON") {
    return `${(num / 1000).toLocaleString("ko-KR", { maximumFractionDigits: 3 })} 톤`;
  }
  return `${num.toLocaleString("ko-KR")} kg`;
};

// 확정가가 확정된 계약에서만 정산가를 노출한다 (서버 판단 값 기준)
export const isSettlementVisible = (contract) =>
  contract.prices.some((p) => p.type === "확정가" && p.confirmed);
