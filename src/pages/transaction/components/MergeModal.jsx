import { formatDate, formatMoney, labelOf, ORIGIN_LABELS, ownerCompanyLabelOf, TRADE_DIRECTION_LABELS } from "../constants";
import ModalShell from "./ModalShell";

export default function MergeModal({
  open,
  transactions,
  targetId,
  reason,
  allowMismatch,
  submitting,
  blocking,
  counterpartyMismatch,
  onTargetChange,
  onReasonChange,
  onAllowMismatchChange,
  onSubmit,
  onClose,
}) {
  if (!open) return null;

  const disabled = submitting || Boolean(blocking) || !targetId || (counterpartyMismatch && !allowMismatch);

  return (
    <ModalShell
      title="거래 합치기"
      description="대상 거래를 고르면 나머지 거래의 계근·품목이 대상 거래로 이동합니다. 비게 된 거래는 삭제되지 않고 '합쳐짐' 상태로 보존됩니다."
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            취소
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={disabled}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "처리 중..." : "합치기"}
          </button>
        </>
      }
    >
      <fieldset>
        <legend className="mb-2 text-xs font-semibold text-slate-500">대상 거래 선택</legend>
        <div className="space-y-2">
          {transactions.map((transaction) => (
            <label
              key={transaction.transactionId}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 text-sm ${
                targetId === transaction.transactionId ? "border-blue-400 bg-blue-50/50" : "border-slate-200"
              }`}
            >
              <input
                type="radio"
                name="merge-target"
                checked={targetId === transaction.transactionId}
                onChange={() => onTargetChange(transaction.transactionId)}
                className="mt-1 accent-blue-600"
              />
              <span className="min-w-0 flex-1">
                <span className="font-semibold text-slate-800">
                  #{transaction.transactionId} · {transaction.counterpartyName || "거래처 미입력"}
                </span>
                <span className="block text-xs text-slate-500">
                  {formatDate(transaction.transactionDate)} · {labelOf(ORIGIN_LABELS, transaction.transactionOrigin)} ·{" "}
                  {ownerCompanyLabelOf(transaction.ownerCompany)} · {labelOf(TRADE_DIRECTION_LABELS, transaction.tradeDirection)} ·{" "}
                  {transaction.transactionOrigin === "MANUAL" ? `수기 ${transaction.manualItemCount}건` : `계근 ${transaction.weighingRecordCount}건`} ·{" "}
                  {formatMoney(transaction.displayAmount, transaction.currency)}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {blocking && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{blocking}</p>}

      {!blocking && counterpartyMismatch && (
        <label className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <input
            type="checkbox"
            checked={allowMismatch}
            onChange={(event) => onAllowMismatchChange(event.target.checked)}
            className="mt-0.5 accent-amber-600"
          />
          거래처명이 서로 다릅니다. 같은 거래처가 맞다면 체크한 뒤 합치세요.
        </label>
      )}

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-slate-500">합치기 메모 (선택)</span>
        <textarea
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          rows={2}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
        />
      </label>
    </ModalShell>
  );
}
