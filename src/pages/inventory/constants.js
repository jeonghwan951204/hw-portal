import {
  formatDate,
  formatNumber,
  getLocalDateString,
  OWNER_COMPANY_OPTIONS,
  ownerCompanyLabelOf,
} from "../weighing/constants";

export { formatDate, getLocalDateString, OWNER_COMPANY_OPTIONS, ownerCompanyLabelOf };

export const MOVEMENT_PAGE_SIZE = 20;
// 재고 현황의 '조정' 행은 하루치 보정 내역 — 한 번에 받아 표에 그린다
export const DAILY_MOVEMENT_SIZE = 200;
export const REASON_MAX_LENGTH = 500;

// 보정은 자사 하나에만 속한다 — 보정 화면에서는 '전체'를 고를 수 없다
export const MOVEMENT_OWNER_OPTIONS = OWNER_COMPANY_OPTIONS.filter((option) => option.value);

export const MOVEMENT_TYPE_LABELS = {
  ADJUSTMENT_INCREASE: "재고 증가",
  ADJUSTMENT_DECREASE: "재고 감소",
  TRANSFER: "품목 이동",
};

export const MOVEMENT_TYPE_OPTIONS = [
  { value: "", label: "전체" },
  ...Object.entries(MOVEMENT_TYPE_LABELS).map(([value, label]) => ({ value, label })),
];

export const ADJUSTMENT_DIRECTION_OPTIONS = [
  { value: "INCREASE", label: "재고 추가" },
  { value: "DECREASE", label: "재고 차감" },
];

export const movementTypeLabelOf = (value) => MOVEMENT_TYPE_LABELS[value] ?? value ?? "-";

// kg 수량 표시 — 서버는 소수 4자리까지 주지만 화면은 3자리까지만 보여 준다
export const formatKg = (value) => formatNumber(value, 3);

// 0 은 엑셀 재고표처럼 비워 보이도록 '-' 대신 빈칸 처리할 때 사용
export const formatKgOrBlank = (value) => (value == null || Number(value) === 0 ? "" : formatKg(value));

// YYYY-MM-DD 문자열에 일수를 더한다(로컬 기준)
export const addDays = (dateString, days) => {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day + days);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

// 2026-08-25 → 2026년 8월 25일
export const formatKoreanDate = (dateString) => {
  if (!dateString) return "-";
  const [year, month, day] = dateString.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
};

// 입력 칸 문자열 → 숫자. 비었거나 숫자가 아니면 null
export const parseQuantity = (value) => {
  const text = String(value ?? "").replaceAll(",", "").trim();
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
};
