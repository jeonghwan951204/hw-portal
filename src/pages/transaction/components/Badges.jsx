import {
  labelOf,
  ORIGIN_LABELS,
  PAYMENT_STATUS_LABELS,
  TRADE_DIRECTION_LABELS,
  TRANSACTION_STATUS_LABELS,
} from "../constants";

const TONES = {
  slate: "bg-slate-100 text-slate-600",
  blue: "bg-blue-50 text-blue-600",
  violet: "bg-violet-50 text-violet-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-600",
  teal: "bg-teal-50 text-teal-700",
};

export function Badge({ tone = "slate", title, children }) {
  return (
    <span title={title} className={`inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-bold ${TONES[tone] ?? TONES.slate}`}>
      {children}
    </span>
  );
}

export function OriginBadge({ origin }) {
  return <Badge tone={origin === "MANUAL" ? "teal" : "slate"}>{labelOf(ORIGIN_LABELS, origin)}</Badge>;
}

export function DirectionBadge({ direction }) {
  const tone = { PURCHASE: "blue", SALE: "violet", UNKNOWN: "amber" }[direction];
  return <Badge tone={tone}>{labelOf(TRADE_DIRECTION_LABELS, direction)}</Badge>;
}

export function ConfirmBadge({ confirmed }) {
  return confirmed ? <Badge tone="emerald">확인 완료</Badge> : <Badge tone="amber">확인 대기</Badge>;
}

export function PaymentBadge({ status }) {
  const tone = { UNPAID: "slate", VAT_PAID: "blue", PAID: "emerald" }[status];
  return <Badge tone={tone}>{labelOf(PAYMENT_STATUS_LABELS, status)}</Badge>;
}

export function TransactionStatusBadge({ status }) {
  const tone = { OPEN: "blue", CLOSED: "slate", MERGED: "red" }[status];
  return <Badge tone={tone}>{labelOf(TRANSACTION_STATUS_LABELS, status)}</Badge>;
}

// 원본명 + 매핑상태 표시
//  - 원본명 없음 → `거래처 미입력` / `품목 미입력`
//  - 미매핑 → 원본명 + `미매핑` 배지
export function MappedName({ name, mapped, emptyLabel, className = "" }) {
  if (!name) {
    return <Badge tone="amber">{emptyLabel}</Badge>;
  }
  return (
    <span className={`inline-flex min-w-0 items-center gap-1 ${className}`}>
      <span className="truncate" title={name}>{name}</span>
      {!mapped && <Badge tone="amber" title="내부 거래처·품목과 연결되지 않은 원본명입니다">미매핑</Badge>}
    </span>
  );
}
