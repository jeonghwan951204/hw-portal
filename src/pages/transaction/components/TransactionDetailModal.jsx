import { Fragment } from "react";
import CompanySelect from "../../contract/components/CompanySelect";
import NumericInput from "../../contract/components/NumericInput";
import {
  formatDate,
  formatKgPrice,
  formatMoney,
  formatSettlementDiff,
  formatWeight,
  labelOf,
  ownerCompanyLabelOf,
  isReturnLine,
  PAYMENT_STATUS_LABELS,
  settlementDiffToneOf,
} from "../constants";
import { Badge, DirectionBadge, MappedName, OriginBadge, PaymentBadge, TransactionStatusBadge } from "./Badges";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import SettlementLinesModal, { SettlementTypeBadge } from "./SettlementLinesModal";
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

// 거래 헤더 수정 — 거래처·입출고 구분·거래일. 계근 거래는 소속 계근의 거래처도 함께 바뀐다
function HeaderEditForm({ detail, header }) {
  const isWeighing = detail.transactionOrigin === "WEIGHING";
  return (
    <div className="col-span-2 min-w-0 space-y-3 rounded-lg border border-blue-100 bg-blue-50/30 p-3 sm:col-span-3">
      <p className="text-[11px] font-bold text-slate-400">거래 정보 수정</p>
      <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
        <div className="min-w-0">
          <span className="mb-1 block text-xs font-semibold text-slate-500">거래처</span>
          <CompanySelect
            value={header.draft.companyId}
            selectedName={header.draft.counterpartyName}
            onSelect={(selected) => header.onChange({ companyId: selected.id ?? "", counterpartyName: selected.name ?? "" })}
            className={inputClass}
            {...header.companySearch}
          />
        </div>
        <label className="min-w-0">
          <span className="mb-1 block text-xs font-semibold text-slate-500">입출고 구분</span>
          <select
            value={header.draft.tradeDirection}
            onChange={(event) => header.onChange({ tradeDirection: event.target.value })}
            disabled={!header.directionEditable}
            title={header.directionEditable ? undefined : "미결제 거래만 입출고 구분을 바꿀 수 있습니다"}
            className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-400`}
          >
            {header.directionOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="min-w-0">
          <span className="mb-1 block text-xs font-semibold text-slate-500">거래일</span>
          <input
            type="date"
            value={header.draft.transactionDate}
            onChange={(event) => header.onChange({ transactionDate: event.target.value })}
            className={inputClass}
          />
        </label>
      </div>
      <div className="space-y-0.5 text-xs text-slate-400">
        {isWeighing && <p>포함된 계근의 거래처도 함께 변경됩니다. 입출고 구분은 원본 계근과 같아야 합니다.</p>}
        {!header.directionEditable && <p>결제가 진행된 거래는 입출고 구분을 바꿀 수 없습니다. 결제상태를 미결제로 되돌린 뒤 변경하세요.</p>}
        {header.directionChanged && (
          <p className="text-amber-600">입출고 구분이 바뀌면 금액 계산 방식이 달라집니다. 적용 단가는 자동으로 바뀌지 않으니 저장 후 단가를 확인하세요.</p>
        )}
      </div>
      {header.error && <p className="text-sm text-red-600">{header.error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={header.onCancel}
          disabled={header.saving}
          className="h-[38px] rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
        >
          취소
        </button>
        <button
          type="button"
          onClick={header.onSave}
          disabled={header.saving}
          className="h-[38px] rounded-lg bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-40"
        >
          {header.saving ? "저장 중..." : "저장"}
        </button>
      </div>
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

// 정산 줄 펼침 — 계근 행 아래에 매출 줄·반품 줄과 반품 합계·실중량 대비 차이를 보여준다
function SettlementRows({ row, colSpan, currency, editable, blocked, onEdit }) {
  const { returnedWeightKg, diffKg, diffPercent } = row.settlementSummary;
  return (
    <tr className="bg-slate-50/70">
      <td colSpan={colSpan} className="px-3 pb-2.5 pt-0.5">
        <ul className="space-y-1 border-l-2 border-blue-200 pl-3">
          {row.settlementLines.map((line, index) => {
            const isReturn = isReturnLine(line);
            return (
              <li key={line.lineId ?? index} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs text-slate-600">
                <SettlementTypeBadge isReturn={isReturn} />
                {isReturn ? (
                  <>
                    <b className="min-w-[9rem] text-slate-700">{line.itemName ?? "품목 미선택"}</b>
                    <span className="font-mono text-violet-600">
                      {formatWeight(line.quantityKg)} (재고 +{formatWeight(line.quantityKg)})
                    </span>
                  </>
                ) : (
                  <>
                    {/* 계산서 품목명이 품목명과 다를 때만 "부스바 → 캔디"처럼 둘 다 보여준다 */}
                    <span className="min-w-[9rem]">
                      {line.invoiceItemName && line.invoiceItemName !== line.itemName && (
                        <>
                          {line.invoiceItemName}
                          <span className="mx-1 text-slate-300">→</span>
                        </>
                      )}
                      <b className="text-slate-700">{line.itemName ?? "품목 미선택"}</b>
                    </span>
                    <span className="font-mono text-slate-700">
                      {formatWeight(line.quantityKg)} × {formatKgPrice(line.unitPrice, currency)} ={" "}
                      <b className="text-slate-800">{formatMoney(line.amount, currency)}</b>
                    </span>
                  </>
                )}
                {line.memo && <span className="text-slate-400">메모: {line.memo}</span>}
              </li>
            );
          })}
        </ul>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 pl-3.5 text-xs">
          {returnedWeightKg > 0 && (
            <span className="rounded bg-violet-50 px-1.5 py-0.5 font-mono font-semibold text-violet-600">
              반품 {formatWeight(returnedWeightKg)}
            </span>
          )}
          <span
            className={`rounded px-1.5 py-0.5 font-mono font-semibold ${
              diffKg ? (diffKg > 0 ? "bg-red-50" : "bg-amber-50") : "bg-slate-100"
            } ${settlementDiffToneOf(diffKg)}`}
            title="차이 = (매출 수량 + 반품 수량) − 실중량"
          >
            차이 {formatSettlementDiff(diffKg, diffPercent)}
          </span>
          {editable && (
            <button
              type="button"
              onClick={() => onEdit(row)}
              disabled={blocked}
              title={blocked ? "입력한 단가·실제출고량을 먼저 저장하세요" : "정산 줄 수정"}
              className="ml-auto rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              수정
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// 포함 항목 — 결제 완료 전에는 단가(kg당)와 출고 실제출고량을 입력할 수 있다
// 계근 거래는 계근 원본처럼 1차·2차 중량을 실중량 앞에 함께 보여준다
function ItemTable({
  rows,
  isSale,
  isWeighing,
  currency,
  editable,
  dirtyCount,
  resettable,
  saving,
  error,
  mappable,
  mappingBlocked,
  settlementEditable,
  onDraftChange,
  onReset,
  onSave,
  onMap,
  onSettlement,
  slipDownloadingId,
  slipError,
  onDownloadSlip,
}) {
  const colCount = (isWeighing ? 7 : 5) + (settlementEditable ? 1 : 0);
  return (
    <div className="space-y-2">
      {slipError && <p className="text-sm text-red-600">계근표 출력 실패: {slipError}</p>}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className={`w-full text-[13px] ${isWeighing ? "min-w-[46rem]" : "min-w-[34rem]"}`}>
          <thead className="bg-slate-50 text-xs text-slate-400">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">차량번호</th>
              <th className="px-3 py-2 text-left font-semibold">품목</th>
              {isWeighing && <th className="px-3 py-2 text-right font-semibold">1차중량</th>}
              {isWeighing && <th className="px-3 py-2 text-right font-semibold">2차중량</th>}
              <th className="px-3 py-2 text-right font-semibold">{isSale ? "실중량 (실제출고량)" : "실중량"}</th>
              <th className="px-3 py-2 text-right font-semibold">단가(/kg)</th>
              <th className="px-3 py-2 text-right font-semibold">총 금액</th>
              {settlementEditable && <th className="px-3 py-2 text-right font-semibold">정산</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={colCount} className="px-3 py-8 text-center text-sm text-slate-400">포함된 항목이 없습니다.</td>
              </tr>
            )}
            {rows.map((row) => {
              const split = row.settlementLines.length > 0;
              return (
                <Fragment key={row.key}>
                  <tr className={row.draft ? "bg-blue-50/40" : split ? "bg-slate-50/70" : isSale && row.unitPrice == null ? "bg-red-50/60" : ""}>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                      <span className="flex items-center gap-1.5">
                        {row.vehicleNumber || "-"}
                        {row.isWeighing && row.source.weighingRecordId != null && (
                          <button
                            type="button"
                            onClick={() => onDownloadSlip(row)}
                            disabled={slipDownloadingId != null}
                            title="이 계근의 계근표 PDF를 내려받습니다"
                            className="shrink-0 rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {slipDownloadingId === row.source.weighingRecordId ? "만드는 중..." : "계근표"}
                          </button>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <MappedName name={row.itemName} mapped={row.mapped} emptyLabel="품목 미입력" />
                        {mappable && (
                          <button
                            type="button"
                            onClick={() => onMap(row)}
                            disabled={mappingBlocked}
                            title={mappingBlocked ? "입력한 단가·실제출고량을 먼저 저장하세요" : "품목 매핑"}
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
                    {isWeighing && (
                      <td className="whitespace-nowrap px-3 py-2 text-right font-mono text-slate-600">{formatWeight(row.firstWeightKg)}</td>
                    )}
                    {isWeighing && (
                      <td className="whitespace-nowrap px-3 py-2 text-right font-mono text-slate-600">{formatWeight(row.secondWeightKg)}</td>
                    )}
                    <td className="whitespace-nowrap px-3 py-2 text-right font-mono text-slate-700">
                      {formatWeight(row.netWeightKg)}
                      {isSale && (
                        editable && !split ? (
                          <span className="mt-1 flex items-center justify-end gap-1 text-[11px] text-slate-500">
                            (
                            <NumericInput
                              value={row.draft ? row.draft.actualDeliveryWeightKg : row.actualDeliveryDefault}
                              onChange={(value) => onDraftChange(row, { actualDeliveryWeightKg: value })}
                              // 실중량 기본값이 채워져 있으므로 클릭하면 전체 선택해 바로 새 값을 입력하게 한다.
                              // 클릭 시 브라우저가 focus 뒤에 커서를 다시 놓으므로 한 틱 뒤에 선택한다.
                              onFocus={(event) => {
                                const input = event.target;
                                setTimeout(() => input.select(), 0);
                              }}
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
                    <td className={`whitespace-nowrap px-3 py-2 text-right font-mono ${row.unitPrice == null && !split ? "text-amber-600" : "text-slate-600"}`}>
                      {split ? (
                        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-bold text-blue-600" title="정산 줄 단가로 계산합니다">
                          분할
                        </span>
                      ) : editable ? (
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
                    {settlementEditable && (
                      <td className="whitespace-nowrap px-3 py-2 text-right">
                        {!split && (
                          <button
                            type="button"
                            onClick={() => onSettlement(row)}
                            disabled={mappingBlocked}
                            title={mappingBlocked ? "입력한 단가·실제출고량을 먼저 저장하세요" : "계산서 기준으로 품목·단가를 나누고 반품을 입력합니다"}
                            className="rounded-md border border-blue-200 px-2 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            품목 나누기·반품
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                  {split && (
                    <SettlementRows
                      row={row}
                      colSpan={colCount}
                      currency={currency}
                      editable={settlementEditable}
                      blocked={mappingBlocked}
                      onEdit={onSettlement}
                    />
                  )}
                </Fragment>
              );
            })}
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
  header,
  items,
  acceptedWeightKg,
  acceptedMissing,
  actualDeliveryWeightKg,
  actualDeliveryMissing,
  payment,
  mappingModal,
  settlementModal,
  onRetry,
  onClose,
}) {
  if (!open) return null;

  const footer = (
    <Button variant="secondary" onClick={onClose}>
      닫기
    </Button>
  );

  if (loading || error || !detail) {
    return (
      <Modal size="xl" title="거래 상세" onClose={onClose} footer={footer}>
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
      </Modal>
    );
  }

  return (
    <>
      <Modal size="xl" title={`거래 #${detail.transactionId}`} onClose={onClose} footer={footer}>
        <section className="space-y-4 rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <OriginBadge origin={detail.transactionOrigin} />
            <DirectionBadge direction={detail.tradeDirection} />
            <PaymentBadge status={detail.paymentStatus} />
            <TransactionStatusBadge status={detail.transactionStatus} />
            {header.editable && !header.editing && (
              <button
                type="button"
                onClick={header.onStart}
                className="ml-auto shrink-0 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-50"
              >
                거래 정보 수정
              </button>
            )}
          </div>
          {/* 버전 충돌로 최신 내용을 다시 불러온 경우 안내 */}
          {!header.editing && header.error && <p className="text-xs text-red-600">{header.error}</p>}
          <dl className="grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-3">
            {header.editing ? (
              <HeaderEditForm detail={detail} header={header} />
            ) : (
              <>
                <InfoItem label="거래처">
                  <MappedName name={detail.counterpartyName} mapped={detail.companyId != null} emptyLabel="거래처 미입력" />
                </InfoItem>
                <InfoItem label="거래일">{formatDate(detail.transactionDate)}</InfoItem>
              </>
            )}
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
      </Modal>
      {/* 상세 모달 위에 겹쳐 뜨도록 뒤에 렌더링한다 */}
      <WeighingMappingModal {...mappingModal} />
      <SettlementLinesModal {...settlementModal} />
    </>
  );
}
