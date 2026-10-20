import {
  AMOUNT_STATUS_LABELS,
  formatDate,
  formatMoney,
  formatWeight,
  labelOf,
  ownerCompanyLabelOf,
  summarizeList,
} from "../constants";
import {
  Badge,
  DirectionBadge,
  MappedName,
  OriginBadge,
  PaymentBadge,
  TransactionStatusBadge,
} from "./Badges";

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
      {hasOtherWarning && <Badge tone="amber">경고</Badge>}
      {transaction.hasUnmappedItem && <Badge tone="amber">품목 미매핑</Badge>}
      {transaction.hasMissingUnitPrice && <Badge tone={transaction.tradeDirection === "SALE" ? "red" : "amber"}>단가 미입력</Badge>}
      {transaction.hasGroupingWarning && <Badge tone="red">묶음 경고</Badge>}
      {transaction.memo && <Badge title={transaction.memo}>비고</Badge>}
    </div>
  );
}

function AmountCell({ transaction }) {
  return (
    <div className="text-right">
      <p className="font-mono font-semibold text-slate-800">
        {transaction.displayAmount == null ? "-" : formatMoney(transaction.displayAmount, transaction.currency)}
      </p>
      <p className="text-[10px] text-slate-400">
        {transaction.displayAmount == null ? "미계산 금액 포함" : labelOf(AMOUNT_STATUS_LABELS, transaction.amountStatus)}
      </p>
    </div>
  );
}

const counterpartyOf = (transaction) => (
  <MappedName
    name={transaction.counterpartyName}
    mapped={!transaction.hasUnmappedCompany && transaction.companyId != null}
    emptyLabel="거래처 미입력"
  />
);

const vehicleSummaryOf = (transaction) =>
  transaction.vehicleCount > 0 ? `${transaction.vehicleCount}대 · ${summarizeList(transaction.vehicleNumbers)}` : "-";

const recordCountOf = (transaction) =>
  transaction.transactionOrigin === "MANUAL" ? `수기 ${transaction.manualItemCount}건` : `계근 ${transaction.weighingRecordCount}건`;

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
        <table className="w-full min-w-[72rem] table-fixed text-[13px]">
          <thead className="bg-slate-50 text-xs text-slate-400">
            <tr>
              <th className="w-[3%] px-2 py-2" aria-label="선택" />
              <th className="w-[8%] px-2 py-2 text-left font-semibold">거래일</th>
              <th className="w-[9%] px-2 py-2 text-left font-semibold">유형·자사</th>
              <th className="w-[15%] px-2 py-2 text-left font-semibold">거래처</th>
              <th className="w-[9%] px-2 py-2 text-left font-semibold">거래구분</th>
              <th className="w-[13%] px-2 py-2 text-left font-semibold">차량</th>
              <th className="w-[8%] px-2 py-2 text-right font-semibold">품목·건수</th>
              <th className="w-[9%] px-2 py-2 text-right font-semibold">총 실중량</th>
              <th className="w-[10%] px-2 py-2 text-right font-semibold">표시금액</th>
              <th className="w-[10%] px-2 py-2 text-left font-semibold">결제·상태</th>
              <th className="w-[10%] px-2 py-2 text-left font-semibold">경고</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-12 text-center text-sm text-slate-400">{emptyMessage}</td>
              </tr>
            )}
            {transactions.map((transaction) => (
              <tr
                key={transaction.transactionId}
                {...rowOpenProps(transaction, onOpenDetail)}
                className={`cursor-pointer align-top transition-colors hover:bg-blue-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
                  transaction.transactionStatus === "MERGED" ? "opacity-60" : ""
                } ${selectedIds[transaction.transactionId] ? "bg-blue-50/40" : ""}`}
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
                <td className="whitespace-nowrap px-2 py-2 text-slate-600">
                  {formatDate(transaction.transactionDate)}
                  <p className="text-[10px] text-slate-400">#{transaction.transactionId}</p>
                </td>
                <td className="px-2 py-2">
                  <div className="flex flex-wrap gap-1">
                    <OriginBadge origin={transaction.transactionOrigin} />
                    <Badge>{ownerCompanyLabelOf(transaction.ownerCompany)}</Badge>
                  </div>
                </td>
                <td className="px-2 py-2 font-semibold text-slate-800">{counterpartyOf(transaction)}</td>
                <td className="px-2 py-2">
                  <div className="flex flex-wrap gap-1">
                    <DirectionBadge direction={transaction.tradeDirection} />
                  </div>
                </td>
                <td className="truncate px-2 py-2 text-slate-600" title={(transaction.vehicleNumbers ?? []).join(", ")}>
                  {vehicleSummaryOf(transaction)}
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-right text-slate-600">
                  품목 {transaction.itemCount}
                  <p className="text-[10px] text-slate-400">{recordCountOf(transaction)}</p>
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-right font-mono text-slate-700">{formatWeight(transaction.totalWeightKg)}</td>
                <td className="px-2 py-2"><AmountCell transaction={transaction} /></td>
                <td className="px-2 py-2">
                  <div className="flex flex-wrap gap-1">
                    <PaymentBadge status={transaction.paymentStatus} />
                    <TransactionStatusBadge status={transaction.transactionStatus} />
                  </div>
                  {transaction.paymentAmount != null && (
                    <p className="mt-0.5 font-mono text-[11px] text-slate-500">{formatMoney(transaction.paymentAmount, transaction.currency)}</p>
                  )}
                </td>
                <td className="px-2 py-2"><WarningBadges transaction={transaction} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-slate-100 md:hidden">
        {transactions.length === 0 && <p className="px-4 py-12 text-center text-sm text-slate-400">{emptyMessage}</p>}
        {transactions.map((transaction) => (
          <article
            key={transaction.transactionId}
            {...rowOpenProps(transaction, onOpenDetail)}
            className={`cursor-pointer px-4 py-3 ${transaction.transactionStatus === "MERGED" ? "opacity-60" : ""}`}
          >
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
              <OriginBadge origin={transaction.transactionOrigin} />
              <Badge>{ownerCompanyLabelOf(transaction.ownerCompany)}</Badge>
              <DirectionBadge direction={transaction.tradeDirection} />
              <PaymentBadge status={transaction.paymentStatus} />
              <TransactionStatusBadge status={transaction.transactionStatus} />
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div className="flex justify-between gap-2"><dt className="text-slate-400">차량</dt><dd className="truncate font-medium text-slate-600">{vehicleSummaryOf(transaction)}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-400">건수</dt><dd className="font-medium text-slate-600">{recordCountOf(transaction)}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-400">총 실중량</dt><dd className="font-medium text-slate-700">{formatWeight(transaction.totalWeightKg)}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-400">표시금액</dt><dd className="font-bold text-slate-800">{formatMoney(transaction.displayAmount, transaction.currency)}</dd></div>
            </dl>
            <div className="mt-2"><WarningBadges transaction={transaction} /></div>
          </article>
        ))}
      </div>
    </section>
  );
}
