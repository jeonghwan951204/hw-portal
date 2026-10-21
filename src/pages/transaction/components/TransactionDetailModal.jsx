import NumericInput from "../../contract/components/NumericInput";
import { formatDate, formatKgPrice, formatMoney, formatWeight, labelOf, ownerCompanyLabelOf, PAYMENT_STATUS_LABELS } from "../constants";
import { Badge, DirectionBadge, MappedName, OriginBadge, PaymentBadge, TransactionStatusBadge } from "./Badges";
import ModalShell from "./ModalShell";
import WeighingMappingModal from "./WeighingMappingModal";

const inputClass =
  "w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20";

function InfoItem({ label, note, children }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-bold text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-slate-800">{children ?? "-"}</dd>
      {note && <p className="text-[10px] text-amber-600">{note}</p>}
    </div>
  );
}

// 결제정보 — 결제 완료 전에는 수정, 결제 완료(마감) 후에는 읽기 전용
function PaymentSection({ detail, payment }) {
  if (!payment.editable) {
    return (
      <dl className="grid grid-cols-2 gap-x-5 gap-y-3 border-t border-slate-100 pt-4">
        <InfoItem label="결제상태">{labelOf(PAYMENT_STATUS_LABELS, detail.paymentStatus)}</InfoItem>
        <InfoItem label="결제금액">{formatMoney(detail.paymentAmount, detail.currency)}</InfoItem>
      </dl>
    );
  }

  return (
    <div className="border-t border-slate-100 pt-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label>
          <span className="mb-1 block text-xs font-semibold text-slate-500">결제상태</span>
          <select value={payment.paymentStatus} onChange={(event) => payment.onChange({ paymentStatus: event.target.value })} className={inputClass}>
            {payment.statusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-slate-500">결제금액 ({detail.currency})</span>
          <NumericInput value={payment.paymentAmount} onChange={(value) => payment.onChange({ paymentAmount: value })} className={`${inputClass} text-right`} />
        </label>
        <button
          type="button"
          onClick={payment.onSave}
          disabled={payment.saving}
          className="h-[38px] rounded-lg bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-40"
        >
          {payment.saving ? "저장 중..." : "저장"}
        </button>
      </div>
      {payment.error && <p className="mt-2 text-sm text-red-600">{payment.error}</p>}
      <p className="mt-2 text-xs text-slate-400">결제 완료로 저장하면 거래가 마감되어 이후에는 결제정보를 수정할 수 없습니다.</p>
    </div>
  );
}

const cellInputClass =
  "w-24 rounded-md border border-slate-200 bg-white px-2 py-1 text-right text-[13px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20";

// 포함 항목 — 결제 완료 전에는 단가(kg당)와 출고 실제출고량을 입력할 수 있다
function ItemTable({
  rows,
  isSale,
  currency,
  editable,
  dirtyCount,
  resettable,
  saving,
  error,
  mappable,
  mappingBlocked,
  onDraftChange,
  onReset,
  onSave,
  onMap,
}) {
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[34rem] text-[13px]">
          <thead className="bg-slate-50 text-xs text-slate-400">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">차량번호</th>
              <th className="px-3 py-2 text-left font-semibold">품목</th>
              <th className="px-3 py-2 text-right font-semibold">{isSale ? "실중량 (실제출고량)" : "실중량"}</th>
              <th className="px-3 py-2 text-right font-semibold">단가(/kg)</th>
              <th className="px-3 py-2 text-right font-semibold">총 금액</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-sm text-slate-400">포함된 항목이 없습니다.</td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.key} className={row.draft ? "bg-blue-50/40" : isSale && row.unitPrice == null ? "bg-red-50/60" : ""}>
                <td className="whitespace-nowrap px-3 py-2 text-slate-600">{row.vehicleNumber || "-"}</td>
                <td className="px-3 py-2 text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <MappedName name={row.itemName} mapped={row.mapped} emptyLabel="품목 미입력" />
                    {mappable && (
                      <button
                        type="button"
                        onClick={() => onMap(row)}
                        disabled={mappingBlocked}
                        title={mappingBlocked ? "입력한 단가·실제출고량을 먼저 저장하세요" : "거래처·품목 매핑"}
                        className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
                          row.mapped
                            ? "border-slate-200 text-slate-400 hover:bg-slate-50"
                            : "border-amber-300 text-amber-700 hover:bg-amber-50"
                        }`}
                      >
                        매핑
                      </button>
                    )}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right font-mono text-slate-700">
                  {formatWeight(row.netWeightKg)}
                  {isSale && (
                    editable ? (
                      <span className="mt-1 flex items-center justify-end gap-1 text-[11px] text-slate-500">
                        (
                        <NumericInput
                          value={row.draft ? row.draft.actualDeliveryWeightKg : row.actualDeliveryDefault}
                          onChange={(value) => onDraftChange(row, { actualDeliveryWeightKg: value })}
                          placeholder="실제출고량"
                          aria-label="실제출고량(kg)"
                          className={cellInputClass}
                        />
                        kg)
                      </span>
                    ) : (
                      <span className="block text-[11px] text-slate-500">({formatWeight(row.actualDeliveryWeightKg)})</span>
                    )
                  )}
                </td>
                <td className={`whitespace-nowrap px-3 py-2 text-right font-mono ${row.unitPrice == null ? "text-amber-600" : "text-slate-600"}`}>
                  {editable ? (
                    <NumericInput
                      value={row.draft ? row.draft.unitPrice : row.unitPrice ?? ""}
                      onChange={(value) => onDraftChange(row, { unitPrice: value })}
                      placeholder="미입력"
                      aria-label="kg당 단가"
                      className={`${cellInputClass} ${isSale && row.unitPrice == null && !row.draft ? "border-red-300" : ""}`}
                    />
                  ) : (
                    formatKgPrice(row.unitPrice, currency)
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right font-mono font-semibold text-slate-800">
                  {formatMoney(row.amount, currency)}
                  {row.draft && <span className="block text-[10px] font-normal text-blue-500">저장 후 반영</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editable && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {error && <p className="mr-auto text-sm text-red-600">{error}</p>}
          {!error && <p className="mr-auto text-xs text-slate-400">무상 출고는 빈 값 대신 단가 0을 입력하세요.</p>}
          {resettable && (
            <button type="button" onClick={onReset} disabled={saving} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-40">
              되돌리기
            </button>
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={dirtyCount === 0 || saving}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "저장 중..." : `항목 저장${dirtyCount > 0 ? ` (${dirtyCount})` : ""}`}
          </button>
        </div>
      )}
    </div>
  );
}

// 거래 상세 모달 — 1) 거래 요약 + 결제정보, 2) 포함 항목 목록
export default function TransactionDetailModal({
  open,
  loading,
  error,
  detail,
  isSale,
  items,
  acceptedWeightKg,
  acceptedMissing,
  actualDeliveryWeightKg,
  actualDeliveryMissing,
  payment,
  mappingModal,
  onRetry,
  onClose,
}) {
  if (!open) return null;

  const footer = (
    <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
      닫기
    </button>
  );

  if (loading || error || !detail) {
    return (
      <ModalShell wide title="거래 상세" onClose={onClose} footer={footer}>
        {error ? (
          <div className="py-8 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button type="button" onClick={onRetry} className="mt-3 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">
              다시 시도
            </button>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-slate-400">거래를 불러오는 중입니다.</p>
        )}
      </ModalShell>
    );
  }

  return (
    <>
      <ModalShell wide title={`거래 #${detail.transactionId}`} onClose={onClose} footer={footer}>
        <section className="space-y-4 rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap gap-1.5">
            <OriginBadge origin={detail.transactionOrigin} />
            <DirectionBadge direction={detail.tradeDirection} />
            <PaymentBadge status={detail.paymentStatus} />
            <TransactionStatusBadge status={detail.transactionStatus} />
          </div>
          <dl className="grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-3">
            <InfoItem label="거래처">
              <MappedName name={detail.counterpartyName} mapped={detail.companyId != null} emptyLabel="거래처 미입력" />
            </InfoItem>
            <InfoItem label="거래일">{formatDate(detail.transactionDate)}</InfoItem>
            <InfoItem label="자사"><Badge>{ownerCompanyLabelOf(detail.ownerCompany)}</Badge></InfoItem>
            <InfoItem label="총 중량 (인수량)" note={acceptedMissing ? "인수량 미입력 항목 제외" : null}>
              {formatWeight(acceptedWeightKg)}
            </InfoItem>
            {isSale && (
              <InfoItem label="실제출고량" note={actualDeliveryMissing ? "미입력 항목 제외" : null}>
                {formatWeight(actualDeliveryWeightKg)}
              </InfoItem>
            )}
            <InfoItem label="총 금액" note={detail.displayAmount == null ? "단가 미입력 항목이 있어 계산되지 않았습니다" : null}>
              {formatMoney(detail.displayAmount, detail.currency)}
            </InfoItem>
          </dl>
          <PaymentSection detail={detail} payment={payment} />
        </section>
  
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-slate-700">포함 항목 ({items.rows.length})</h3>
          <ItemTable {...items} />
        </section>
      </ModalShell>
      {/* 상세 모달 위에 겹쳐 뜨도록 뒤에 렌더링한다 */}
      <WeighingMappingModal {...mappingModal} />
    </>
  );
}
