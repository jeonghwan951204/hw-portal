import { formatDate, formatMoney, labelOf, ORIGIN_LABELS, ownerCompanyLabelOf, TRADE_DIRECTION_LABELS } from "../constants";
import ModalShell from "./ModalShell";
import { SummaryGrid, WarningList } from "./TransactionSummary";

const textareaClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20";

function Footer({ onClose, onConfirm, disabled, busy, label, danger = false }) {
  return (
    <>
      <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
        닫기
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={disabled || busy}
        className={`rounded-lg px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 ${
          danger ? "bg-red-500 hover:bg-red-600" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {busy ? "처리 중..." : label}
      </button>
    </>
  );
}

function ReasonField({ label, reason, onReasonChange }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-500">{label}</span>
      <textarea value={reason} onChange={(event) => onReasonChange(event.target.value)} rows={2} className={textareaClass} />
    </label>
  );
}

// 거래 확인 — 요약과 경고를 보여 주고, 미매핑은 막지 않되 확인 불가 조건은 막는다.
export function ConfirmTransactionModal({ open, summary, warnings, blockers, busy, onConfirm, onClose }) {
  if (!open || !summary) return null;
  return (
    <ModalShell
      wide
      title="거래 확인"
      description="확인 후에는 거래 구성, 거래처, 품목, 단가, 실제출고량, 금액과 비고가 읽기 전용으로 바뀝니다. 결제정보는 계속 수정할 수 있습니다."
      onClose={onClose}
      footer={<Footer onClose={onClose} onConfirm={onConfirm} disabled={blockers.length > 0} busy={busy} label="거래 확인" />}
    >
      <p className="text-sm font-semibold text-slate-700">
        {summary.counterpartyName || "거래처 미입력"} · {summary.tradeDirectionLabel}
      </p>
      <SummaryGrid summary={summary} />
      {warnings.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-bold text-slate-500">경고 — 확인은 가능하며 현재 원본명으로 확정됩니다.</p>
          <WarningList warnings={warnings} />
        </div>
      )}
      {blockers.length > 0 && (
        <ul className="space-y-1 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {blockers.map((blocker) => (
            <li key={blocker}>· {blocker}</li>
          ))}
        </ul>
      )}
    </ModalShell>
  );
}

export function CancelConfirmationModal({ open, reason, busy, onReasonChange, onConfirm, onClose }) {
  if (!open) return null;
  return (
    <ModalShell
      title="거래 확인 취소"
      description="확인을 취소하면 현재 계근 원본과 매핑 결과로 다시 편집할 수 있습니다."
      onClose={onClose}
      footer={<Footer onClose={onClose} onConfirm={onConfirm} busy={busy} label="확인 취소" danger />}
    >
      <ReasonField label="사유 (선택)" reason={reason} onReasonChange={onReasonChange} />
    </ModalShell>
  );
}

export function SplitModal({ open, count, reason, busy, onReasonChange, onConfirm, onClose }) {
  if (!open) return null;
  return (
    <ModalShell
      title="새 거래로 분리"
      description={`선택한 계근 ${count}건으로 새 확인 대기 거래를 만듭니다.`}
      onClose={onClose}
      footer={<Footer onClose={onClose} onConfirm={onConfirm} busy={busy} label="분리" />}
    >
      <ReasonField label="분리 사유 (선택)" reason={reason} onReasonChange={onReasonChange} />
    </ModalShell>
  );
}

export function MoveModal({
  open,
  count,
  targetIdInput,
  target,
  loadingTarget,
  targetError,
  allowMismatch,
  counterpartyMismatch,
  reason,
  busy,
  onTargetIdChange,
  onLookup,
  onAllowMismatchChange,
  onReasonChange,
  onConfirm,
  onClose,
}) {
  if (!open) return null;
  const disabled = !target || Boolean(targetError) || (counterpartyMismatch && !allowMismatch);
  return (
    <ModalShell
      title="다른 거래로 이동"
      description={`선택한 계근 ${count}건을 다른 확인 대기 거래로 옮깁니다.`}
      onClose={onClose}
      footer={<Footer onClose={onClose} onConfirm={onConfirm} disabled={disabled} busy={busy} label="이동" />}
    >
      <div>
        <span className="mb-1.5 block text-xs font-semibold text-slate-500">대상 거래 ID</span>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={targetIdInput}
            onChange={(event) => onTargetIdChange(event.target.value.replace(/\D/g, ""))}
            onKeyDown={(event) => event.key === "Enter" && onLookup()}
            placeholder="예: 1024"
            className={textareaClass}
          />
          <button
            type="button"
            onClick={onLookup}
            disabled={!targetIdInput || loadingTarget}
            className="shrink-0 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            {loadingTarget ? "조회 중..." : "조회"}
          </button>
        </div>
      </div>

      {target && (
        <div className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <p className="font-semibold text-slate-800">#{target.transactionId} · {target.counterpartyName || "거래처 미입력"}</p>
          <p className="text-xs text-slate-500">
            {formatDate(target.transactionDate)} · {labelOf(ORIGIN_LABELS, target.transactionOrigin)} · {ownerCompanyLabelOf(target.ownerCompany)} ·{" "}
            {labelOf(TRADE_DIRECTION_LABELS, target.tradeDirection)} · 계근 {target.weighingRecords?.length ?? 0}건 ·{" "}
            {formatMoney(target.displayAmount, target.currency)}
          </p>
        </div>
      )}
      {targetError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{targetError}</p>}
      {target && !targetError && counterpartyMismatch && (
        <label className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <input type="checkbox" checked={allowMismatch} onChange={(event) => onAllowMismatchChange(event.target.checked)} className="mt-0.5 accent-amber-600" />
          거래처가 서로 다릅니다. 같은 거래처가 맞다면 체크한 뒤 이동하세요.
        </label>
      )}
      <ReasonField label="이동 사유 (선택)" reason={reason} onReasonChange={onReasonChange} />
    </ModalShell>
  );
}
