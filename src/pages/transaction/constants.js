import { formatNumber, OWNER_COMPANY_OPTIONS } from "../weighing/constants";

export {
  formatDate,
  formatNumber,
  formatWeight,
  getLocalDateString,
  ownerCompanyLabelOf,
  OWNER_COMPANY_OPTIONS,
} from "../weighing/constants";

export const TRANSACTION_PAGE_SIZE = 20;

// 수기 거래 등록에서는 자사를 반드시 골라야 하므로 '전체'를 뺀다.
export const OWNER_COMPANY_CHOICES = OWNER_COMPANY_OPTIONS.filter((option) => option.value);

// ─── 코드 ↔ 화면 문구 ─────────────────────────────────────────────────────
export const ORIGIN_LABELS = { WEIGHING: "계근", MANUAL: "수기" };

export const TRADE_DIRECTION_LABELS = {
  PURCHASE: "입고",
  SALE: "출고",
  UNKNOWN: "구분 확인 필요",
};

export const PAYMENT_STATUS_LABELS = {
  UNPAID: "미결제",
  VAT_PAID: "부가세 결제",
  PAID: "결제 완료",
};

export const TRANSACTION_STATUS_LABELS = {
  OPEN: "진행 중",
  CLOSED: "마감",
  MERGED: "합쳐짐",
};

export const AMOUNT_STATUS_LABELS = {
  ESTIMATED: "예상",
  PARTIALLY_CONFIRMED: "일부 확정",
  CONFIRMED: "확정",
};

export const GROUPING_TYPE_LABELS = { AUTO: "자동", MANUAL: "수동" };

export const HISTORY_ACTION_LABELS = {
  AUTO_GROUPED: "자동 묶음",
  MANUAL_TRANSACTION_CREATED: "수기 거래 생성",
  MANUAL_ITEM_UPDATED: "수기 품목 변경",
  TRANSACTION_CONFIRMED: "거래 확인",
  TRANSACTION_CONFIRMATION_CANCELED: "확인 취소",
  MANUAL_RECORD_MOVED: "계근 이동",
  MANUAL_TRANSACTION_SPLIT: "거래 분리",
  MANUAL_TRANSACTION_MERGED: "거래 합치기",
};

export const labelOf = (labels, value) => labels[value] ?? value ?? "-";

const withAll = (labels) => [
  { value: "", label: "전체" },
  ...Object.entries(labels).map(([value, label]) => ({ value, label })),
];

// ─── 검색 필터 옵션 ───────────────────────────────────────────────────────
export const TRADE_DIRECTION_OPTIONS = withAll(TRADE_DIRECTION_LABELS);
export const PAYMENT_STATUS_OPTIONS = withAll(PAYMENT_STATUS_LABELS);
// 경고 = 거래처·품목 미매핑, 적용 단가 누락, 묶음 경고, 거래구분 UNKNOWN, 포함 계근 원본 삭제 중 하나 이상
export const WARNING_OPTIONS = [
  { value: "", label: "전체" },
  { value: "true", label: "경고 있음" },
  { value: "false", label: "경고 없음" },
];

// 수기 거래는 입고·출고만 허용한다(서버도 UNKNOWN 거절).
export const MANUAL_TRADE_DIRECTION_OPTIONS = [
  { value: "PURCHASE", label: "입고" },
  { value: "SALE", label: "출고" },
];

export const CURRENCY_OPTIONS = [
  { value: "KRW", label: "KRW (원)" },
  { value: "USD", label: "USD" },
];

// ─── 표시 포맷 ────────────────────────────────────────────────────────────
const currencySuffixOf = (currency) => ({ KRW: "원", USD: " USD" })[currency] ?? (currency ? ` ${currency}` : "원");

export const formatMoney = (value, currency) =>
  value == null ? "-" : `${formatNumber(value)}${currencySuffixOf(currency)}`;

export const formatKgPrice = (value, currency) =>
  value == null ? "미입력" : `${formatNumber(value, 2)}${currencySuffixOf(currency)}/kg`;

// LocalTime("HH:mm:ss") → "HH:mm"
export const formatTime = (value) => (value ? String(value).slice(0, 5) : "-");

// LocalDateTime("yyyy-MM-ddTHH:mm:ss") → "yyyy.MM.dd HH:mm"
export const formatDateTimeValue = (value) =>
  value ? String(value).slice(0, 16).replace("T", " ").replaceAll("-", ".") : "-";

export const shortId = (value) => (value ? String(value).slice(0, 8) : "-");

// ─── 숫자 입력 ────────────────────────────────────────────────────────────
// 입력 문자열 → 숫자 또는 null. 빈 값은 null(=값 지움)로 본다.
export const toNumberOrNull = (value) => {
  if (value === "" || value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

// 서버 숫자 → 입력 문자열
export const toInputValue = (value) => (value == null ? "" : String(value));

const multiply = (quantity, price) => (quantity == null || price == null ? null : quantity * price);

// 입력 중 금액 미리보기 — 백엔드 계산식과 같다. 저장 후에는 서버 응답으로 교체된다.
//   출고 예상금액 = 실중량 × 적용 단가, 출고 실제금액 = 실제출고량 × 적용 단가, 입고금액 = 인수량 × 적용 단가
export const previewAmounts = (tradeDirection, { netWeightKg, acceptedWeightKg, unitPrice, actualDeliveryWeightKg }) => {
  if (tradeDirection === "SALE") {
    return {
      estimatedAmount: multiply(netWeightKg, unitPrice),
      actualAmount: multiply(actualDeliveryWeightKg, unitPrice),
    };
  }
  if (tradeDirection === "PURCHASE") {
    return { estimatedAmount: multiply(acceptedWeightKg, unitPrice), actualAmount: null };
  }
  return { estimatedAmount: null, actualAmount: null };
};

// 행 최종 표시금액 — 실제금액이 있으면 실제금액, 없으면 예상금액
export const displayAmountOf = ({ estimatedAmount, actualAmount }) => actualAmount ?? estimatedAmount ?? null;

// null 이 하나라도 있으면 합계를 신뢰할 수 없으므로 null 이 아닌 값만 더하고 누락 여부를 함께 돌려준다.
export const sumWithMissing = (values) => ({
  total: values.reduce((sum, value) => sum + (value ?? 0), 0),
  missing: values.some((value) => value == null),
});

// ─── 계근 정렬·그룹 ───────────────────────────────────────────────────────
const compareText = (a, b) => String(a ?? "").localeCompare(String(b ?? ""));

// 계량일자 → 이차시간 → 일차시간 → 계근 ID 순으로 안정 정렬
// (일자별 순번은 응답에 없어 서버 정렬 순서를 그대로 보조 기준으로 쓴다)
export const sortWeighingRecords = (records) =>
  records
    .map((record, index) => ({ record, index }))
    .sort((a, b) =>
      compareText(a.record.weighingDate, b.record.weighingDate) ||
      compareText(a.record.secondWeighedAt, b.record.secondWeighedAt) ||
      compareText(a.record.firstWeighedAt, b.record.firstWeighedAt) ||
      a.index - b.index ||
      a.record.weighingRecordId - b.record.weighingRecordId
    )
    .map(({ record }) => record);

// 같은 차량번호의 연속 계근을 한 그룹으로 묶는다. 개별 계근은 생략하지 않는다.
export const groupConsecutiveByVehicle = (records) =>
  records.reduce((groups, record) => {
    const last = groups[groups.length - 1];
    if (last && last.vehicleNumber === record.vehicleNumber) {
      last.records.push(record);
    } else {
      groups.push({ key: `${record.vehicleNumber}-${record.mappingId}`, vehicleNumber: record.vehicleNumber, records: [record] });
    }
    return groups;
  }, []);

export const summarizeList = (values, max = 2) => {
  const unique = [...new Set(values.filter(Boolean))];
  if (unique.length === 0) return "-";
  return unique.length > max ? `${unique.slice(0, max).join(", ")} 외 ${unique.length - max}` : unique.join(", ");
};

// ─── 수기 품목 폼 ─────────────────────────────────────────────────────────
export const createEmptyManualItem = () => ({
  vehicleNumber: "",
  itemId: null,
  itemName: "",
  netWeightKg: "",
  acceptedWeightKg: "",
  deductionWeightKg: "",
  appliedUnitPrice: "",
  actualDeliveryWeightKg: "",
  memo: "",
});

// 서버 응답 품목 → 폼 값
export const manualItemToForm = (item) => ({
  vehicleNumber: item.vehicleNumber ?? "",
  itemId: item.itemId ?? null,
  itemName: item.itemName ?? "",
  netWeightKg: toInputValue(item.netWeightKg),
  acceptedWeightKg: toInputValue(item.acceptedWeightKg),
  deductionWeightKg: toInputValue(item.deductionWeightKg),
  appliedUnitPrice: toInputValue(item.unitPrice),
  actualDeliveryWeightKg: toInputValue(item.actualDeliveryWeightKg),
  memo: item.memo ?? "",
});

// 폼 값 → ManualTransactionItemRequest
export const manualItemToRequest = (form, tradeDirection) => ({
  vehicleNumber: form.vehicleNumber.trim() || null,
  itemId: form.itemId ?? null,
  itemName: form.itemName.trim(),
  netWeightKg: toNumberOrNull(form.netWeightKg),
  acceptedWeightKg: toNumberOrNull(form.acceptedWeightKg),
  deductionWeightKg: toNumberOrNull(form.deductionWeightKg),
  appliedUnitPrice: toNumberOrNull(form.appliedUnitPrice),
  actualDeliveryWeightKg: tradeDirection === "SALE" ? toNumberOrNull(form.actualDeliveryWeightKg) : null,
  memo: form.memo.trim() || null,
});

// 수기 품목 빠른 검증 — 오류 문구 또는 빈 문자열
export const validateManualItem = (form) => {
  if (!form.itemName.trim()) return "품목명을 입력하세요.";
  if (form.netWeightKg === "") return "실중량을 입력하세요.";
  const numbers = [form.netWeightKg, form.acceptedWeightKg, form.deductionWeightKg, form.appliedUnitPrice, form.actualDeliveryWeightKg];
  if (numbers.some((value) => value !== "" && !(Number(value) >= 0))) return "중량과 단가는 0 이상이어야 합니다.";
  return "";
};
