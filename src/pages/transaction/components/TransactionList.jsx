import {
  formatDate,
  formatMoney,
  formatWeight,
  labelOf,
  ownerCompanyLabelOf,
  TRADE_DIRECTION_LABELS,
} from "../constants";
import { Badge, MappedName, PaymentBadge } from "./Badges";

const rowOpenProps = (transaction, onOpenDetail) => ({
  onClick: () => onOpenDetail(transaction),
  onKeyDown: (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    onOpenDetail(transaction);
  },
  tabIndex: 0,
  title: "누르면 거래 상세를 엽니다",
});

function WarningBadges({ transaction }) {
  // 서버 hasWarning 기준 중 개별 배지로 드러나지 않는 항목(거래처 미매핑·원본 삭제 등)은 '경고'로 묶어 표시
  const hasOtherWarning =
    transaction.hasWarning &&
    !transaction.hasUnmappedItem &&
    !transaction.hasMissingUnitPrice &&
    !transaction.hasGroupingWarning &&
    transaction.tradeDirection !== "UNKNOWN";
  return (
    <div className="flex flex-wrap gap-1">
      {transaction.tradeDirection === "UNKNOWN" && <Badge tone="amber">구분 확인 필요</Badge>}
      {hasOtherWarning && <Badge tone="amber">경고</Badge>}
      {transaction.hasUnmappedItem && <Badge tone="amber">품목 미매핑</Badge>}
      {transaction.hasMissingUnitPrice && <Badge tone={transaction.tradeDirection === "SALE" ? "red" : "amber"}>단가 미입력</Badge>}
      {transaction.hasGroupingWarning && <Badge tone="red">묶음 경고</Badge>}
    </div>
  );
}

// 자사-거래구분 — 회사명과 거래구분을 붙여 작은 배지 하나로 표시
function OwnerDirectionBadge({ transaction }) {
  const tone = { PURCHASE: "blue", SALE: "violet", UNKNOWN: "amber" }[transaction.tradeDirection];
  return (
    <Badge tone={tone}>
      {ownerCompanyLabelOf(transaction.ownerCompany)}-{labelOf(TRADE_DIRECTION_LABELS, transaction.tradeDirection)}
    </Badge>
  );
}

const counterpartyOf = (transaction) => (
  <MappedName
    name={transaction.counterpartyName}
    mapped={!transaction.hasUnmappedCompany && transaction.companyId != null}
    emptyLabel="거래처 미입력"
  />
);

// 첫 차량번호만 보여주고, 여러 대면 '외 {나머지 대수}'
const vehicleOf = (transaction) => {
  const vehicles = (transaction.vehicleNumbers ?? []).filter(Boolean);
  if (vehicles.length === 0) return "-";
  const others = Math.max(transaction.vehicleCount ?? vehicles.length, vehicles.length) - 1;
  return others > 0 ? `${vehicles[0]} 외 ${others}` : vehicles[0];
};

// 목록 응답에는 품목명이 없어 품목 수만 표시한다
const itemOf = (transaction) => (transaction.itemCount > 0 ? `${transaction.itemCount}종` : "-");

const amountOf = (transaction) => formatMoney(transaction.displayAmount, transaction.currency);

export default function TransactionList({
  transactions,
  totalCount,
  loading,
  error,
  selectedIds,
  onToggleSelect,
  onOpenDetail,
  onRetry,
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center text-sm text-slate-400 shadow-sm">
        거래 목록을 불러오는 중입니다.
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-10 text-center shadow-sm">
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
        >
          다시 시도
        </button>
      </div>
    );
  }

  const emptyMessage = "검색 조건에 맞는 거래가 없습니다.";

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <h2 className="text-sm font-bold text-slate-700">거래 목록</h2>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">{totalCount}건</span>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[62rem] table-fixed text-[13px]">
          <thead className="bg-slate-50 text-xs text-slate-400">
            <tr>
              <th className="w-[4%] px-2 py-2" aria-label="선택" />
              <th className="w-[9%] px-2 py-2 text-left font-semibold">거래일</th>
              <th className="w-[10%] px-2 py-2 text-left font-semibold">자사-거래구분</th>
              <th className="w-[17%] px-2 py-2 text-left font-semibold">거래처</th>
              <th className="w-[13%] px-2 py-2 text-left font-semibold">차량번호</th>
              <th className="w-[7%] px-2 py-2 text-right font-semibold">품목</th>
              <th className="w-[11%] px-2 py-2 text-right font-semibold">총 중량</th>
              <th className="w-[12%] px-2 py-2 text-right font-semibold">금액</th>
              <th className="w-[8%] px-2 py-2 text-center font-semibold">결제상태</th>
              <th className="w-[9%] px-2 py-2 text-left font-semibold">경고</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-sm text-slate-400">{emptyMessage}</td>
              </tr>
            )}
            {transactions.map((transaction) => (
              <tr
                key={transaction.transactionId}
                {...rowOpenProps(transaction, onOpenDetail)}
                className={`cursor-pointer transition-colors hover:bg-blue-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
                  selectedIds[transaction.transactionId] ? "bg-blue-50/40" : ""
                }`}
              >
                <td className="px-2 py-2 text-center" onClick={(event) => event.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={Boolean(selectedIds[transaction.transactionId])}
                    onChange={() => onToggleSelect(transaction)}
                    aria-label={`거래 ${transaction.transactionId} 선택`}
                    className="h-4 w-4 accent-blue-600"
                  />
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-slate-600">{formatDate(transaction.transactionDate)}</td>
                <td className="px-2 py-2"><OwnerDirectionBadge transaction={transaction} /></td>
                <td className="px-2 py-2 font-semibold text-slate-800">{counterpartyOf(transaction)}</td>
                <td className="truncate px-2 py-2 text-slate-600" title={(transaction.vehicleNumbers ?? []).join(", ")}>
                  {vehicleOf(transaction)}
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-right text-slate-600">{itemOf(transaction)}</td>
                <td className="whitespace-nowrap px-2 py-2 text-right font-mono text-slate-700">{formatWeight(transaction.totalWeightKg)}</td>
                <td
                  className="whitespace-nowrap px-2 py-2 text-right font-mono font-semibold text-slate-800"
                  title={transaction.displayAmount == null ? "단가 미입력 항목이 있어 계산되지 않았습니다" : undefined}
                >
                  {amountOf(transaction)}
                </td>
                <td className="px-2 py-2 text-center"><PaymentBadge status={transaction.paymentStatus} /></td>
                <td className="px-2 py-2"><WarningBadges transaction={transaction} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-slate-100 md:hidden">
        {transactions.length === 0 && <p className="px-4 py-12 text-center text-sm text-slate-400">{emptyMessage}</p>}
        {transactions.map((transaction) => (
          <article key={transaction.transactionId} {...rowOpenProps(transaction, onOpenDetail)} className="cursor-pointer px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(selectedIds[transaction.transactionId])}
                  onClick={(event) => event.stopPropagation()}
                  onChange={() => onToggleSelect(transaction)}
                  aria-label={`거래 ${transaction.transactionId} 선택`}
                  className="h-4 w-4 shrink-0 accent-blue-600"
                />
                <p className="min-w-0 text-sm font-bold text-slate-800">{counterpartyOf(transaction)}</p>
              </div>
              <p className="shrink-0 text-xs text-slate-400">{formatDate(transaction.transactionDate)}</p>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              <OwnerDirectionBadge transaction={transaction} />
              <PaymentBadge status={transaction.paymentStatus} />
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div className="flex justify-between gap-2"><dt className="text-slate-400">차량번호</dt><dd className="truncate font-medium text-slate-600">{vehicleOf(transaction)}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-400">품목</dt><dd className="font-medium text-slate-600">{itemOf(transaction)}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-400">총 중량</dt><dd className="font-medium text-slate-700">{formatWeight(transaction.totalWeightKg)}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-400">금액</dt><dd className="font-bold text-slate-800">{amountOf(transaction)}</dd></div>
            </dl>
            <div className="mt-2"><WarningBadges transaction={transaction} /></div>
          </article>
        ))}
      </div>
    </section>
  );
}
