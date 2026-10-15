import {
  formatDate,
  formatDateTimeValue,
  ownerCompanyLabelOf,
  shortId,
  TRADE_DIRECTION_LABELS,
} from "../constants";
import {
  Badge,
  ConfirmBadge,
  DirectionBadge,
  MappedName,
  OriginBadge,
  PaymentBadge,
  TransactionStatusBadge,
} from "./Badges";
import CounterpartyField from "./CounterpartyField";

const inputClass =
  "w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20";

function InfoItem({ label, children, className = "" }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <dt className="text-[11px] font-bold text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-700">{children ?? "-"}</dd>
    </div>
  );
}

function HeaderEditForm({ form, companySearch, busy, onFormChange, onSaveEdit, onCancelEdit }) {
  return (
    <div className="mt-4 space-y-3 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          <span className="mb-1 block text-xs font-semibold text-slate-500">거래일</span>
          <input type="date" value={form.transactionDate} onChange={(event) => onFormChange({ transactionDate: event.target.value })} className={inputClass} />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-slate-500">거래구분</span>
          <select value={form.tradeDirection} onChange={(event) => onFormChange({ tradeDirection: event.target.value })} className={inputClass}>
            {Object.entries(TRADE_DIRECTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </div>
      <div>
        <span className="mb-1 block text-xs font-semibold text-slate-500">거래처</span>
        <CounterpartyField
          companyId={form.companyId}
          counterpartyName={form.counterpartyName}
          companySearch={companySearch}
          onChange={onFormChange}
        />
      </div>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-slate-500">비고</span>
        <textarea value={form.memo} onChange={(event) => onFormChange({ memo: event.target.value })} rows={2} className={inputClass} />
      </label>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancelEdit} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
          취소
        </button>
        <button type="button" onClick={onSaveEdit} disabled={busy} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-40">
          저장
        </button>
      </div>
    </div>
  );
}

export default function TransactionDetailHeader({
  detail,
  confirmed,
  merged,
  editable,
  busy,
  canConfirm,
  canCancelConfirm,
  form,
  companySearch,
  onStartEdit,
  onCancelEdit,
  onFormChange,
  onSaveEdit,
  onOpenConfirm,
  onOpenCancel,
  onOpenMerged,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <OriginBadge origin={detail.transactionOrigin} />
            <DirectionBadge direction={detail.tradeDirection} />
            <ConfirmBadge confirmed={confirmed} />
            <PaymentBadge status={detail.paymentStatus} />
            <TransactionStatusBadge status={detail.transactionStatus} />
          </div>
          <h1 className="mt-2 text-lg font-bold text-slate-800">
            <MappedName name={detail.counterpartyName} mapped={detail.companyId != null} emptyLabel="거래처 미입력" />
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            거래 #{detail.transactionId} · 버전 {detail.version}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {editable && !form && (
            <button type="button" onClick={onStartEdit} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
              거래정보 수정
            </button>
          )}
          {canConfirm && (
            <button type="button" onClick={onOpenConfirm} disabled={busy} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-40">
              거래 확인
            </button>
          )}
          {canCancelConfirm && (
            <button type="button" onClick={onOpenCancel} disabled={busy} className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 disabled:opacity-40">
              확인 취소
            </button>
          )}
        </div>
      </div>

      {merged && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>이 거래는 다른 거래로 합쳐져 비어 있습니다. 합치기 이력은 아래 변경 이력에서 확인할 수 있습니다.</span>
          {detail.mergedIntoTransactionId && (
            <button type="button" onClick={onOpenMerged} className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100">
              대상 거래 #{detail.mergedIntoTransactionId} 보기
            </button>
          )}
        </div>
      )}
      {editable && (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          확인 대기 중인 정상 거래입니다. 계근이 추가되거나 내용이 수정될 수 있습니다.
        </p>
      )}
      {confirmed && !merged && (
        <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          확인 완료된 거래입니다. 결제정보 외 항목은 읽기 전용이며, 수정하려면 확인을 취소하세요.
          {detail.paymentStatus === "PAID" && " 결제 완료 거래는 확인을 취소할 수 없습니다."}
        </p>
      )}

      {form ? (
        <HeaderEditForm
          form={form}
          companySearch={companySearch}
          busy={busy}
          onFormChange={onFormChange}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
        />
      ) : (
        <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 border-t border-slate-100 pt-4 sm:grid-cols-3 lg:grid-cols-6">
          <InfoItem label="거래일">{formatDate(detail.transactionDate)}</InfoItem>
          <InfoItem label="자사"><Badge>{ownerCompanyLabelOf(detail.ownerCompany)}</Badge></InfoItem>
          <InfoItem label="통화">{detail.currency}</InfoItem>
          <InfoItem label="확인시각">{formatDateTimeValue(detail.confirmedAt)}</InfoItem>
          <InfoItem label="확인자"><span title={detail.confirmedBy ?? ""}>{shortId(detail.confirmedBy)}</span></InfoItem>
          <InfoItem label="마감시각">{formatDateTimeValue(detail.closedAt)}</InfoItem>
          <InfoItem label="생성일">{formatDateTimeValue(detail.createdAt)}</InfoItem>
          <InfoItem label="최근 수정일">{formatDateTimeValue(detail.updatedAt)}</InfoItem>
          <InfoItem label="비고" className="col-span-2 sm:col-span-3 lg:col-span-4">
            <span className="whitespace-pre-line">{detail.memo || "-"}</span>
          </InfoItem>
        </dl>
      )}
    </section>
  );
}
