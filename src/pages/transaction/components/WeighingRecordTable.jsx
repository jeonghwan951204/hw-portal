import { Fragment } from "react";
import NumericInput from "../../contract/components/NumericInput";
import {
  displayAmountOf,
  formatDate,
  formatKgPrice,
  formatMoney,
  formatTime,
  formatWeight,
  GROUPING_TYPE_LABELS,
  labelOf,
} from "../constants";
import { Badge, MappedName } from "./Badges";

const cellInputClass =
  "w-24 rounded-md border border-slate-200 bg-white px-2 py-1 text-right text-[13px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20";

function WeighingRow({ record, direction, currency, editable, busy, selected, onToggle, onDraftChange, onDraftReset, onSave }) {
  const isSale = direction === "SALE";
  const missingPrice = record.unitPrice == null;
  const draft = record.draft;

  return (
    <tr className={`align-top ${isSale && missingPrice ? "bg-red-50/60" : record.dirty ? "bg-blue-50/40" : ""}`}>
      <td className="px-2 py-2 text-center">
        <input
          type="checkbox"
          checked={selected}
          disabled={!editable}
          onChange={onToggle}
          aria-label={`계근 ${record.weighingRecordId} 선택`}
          className="h-4 w-4 accent-blue-600"
        />
      </td>
      <td className="whitespace-nowrap px-2 py-2 text-slate-600">
        {formatDate(record.weighingDate)}
        <p className="text-[10px] text-slate-400">계근 #{record.weighingRecordId}</p>
      </td>
      <td className="whitespace-nowrap px-2 py-2 text-slate-600">
        <p>1차 {formatTime(record.firstWeighedAt)} · {formatWeight(record.firstWeightKg)}</p>
        <p>2차 {formatTime(record.secondWeighedAt)} · {formatWeight(record.secondWeightKg)}</p>
      </td>
      <td className="px-2 py-2 text-slate-700">
        {record.counterpartyName ? <span title="계근 원본 거래처명">{record.counterpartyName}</span> : <Badge tone="amber">거래처 미입력</Badge>}
      </td>
      <td className="px-2 py-2 text-slate-700">
        <MappedName name={record.itemName} mapped={record.itemId != null} emptyLabel="품목 미입력" />
      </td>
      <td className="whitespace-nowrap px-2 py-2 text-right font-mono text-slate-700">
        <p>{formatWeight(record.netWeightKg)}</p>
        <p className="text-[11px] text-slate-500">인수 {formatWeight(record.acceptedWeightKg)}</p>
        <p className="text-[11px] text-slate-400">감량 {formatWeight(record.deductionWeightKg)}</p>
      </td>
      <td className="whitespace-nowrap px-2 py-2 text-right">
        {editable ? (
          <NumericInput
            value={draft ? draft.appliedUnitPrice : record.unitPrice ?? ""}
            onChange={(value) => onDraftChange({ appliedUnitPrice: value })}
            placeholder="미입력"
            aria-label="kg당 적용 단가"
            className={`${cellInputClass} ${isSale && missingPrice ? "border-red-300" : ""}`}
          />
        ) : (
          <span className={`font-mono ${missingPrice ? "text-amber-600" : "text-slate-700"}`}>{formatKgPrice(record.unitPrice, currency)}</span>
        )}
      </td>
      <td className="whitespace-nowrap px-2 py-2 text-right font-mono text-slate-500" title="계근 원본 금액">
        {formatMoney(record.sourceAmount, currency)}
      </td>
      <td className="whitespace-nowrap px-2 py-2 text-right font-mono text-slate-600">{formatMoney(record.estimatedAmount, currency)}</td>
      {isSale && (
        <>
          <td className="whitespace-nowrap px-2 py-2 text-right">
            {editable ? (
              <NumericInput
                value={draft ? draft.actualDeliveryWeightKg : record.actualDeliveryWeightKg ?? ""}
                onChange={(value) => onDraftChange({ actualDeliveryWeightKg: value })}
                placeholder="미입력"
                aria-label="실제출고량(kg)"
                className={cellInputClass}
              />
            ) : (
              <span className="font-mono text-slate-700">{formatWeight(record.actualDeliveryWeightKg)}</span>
            )}
          </td>
          <td className="whitespace-nowrap px-2 py-2 text-right font-mono text-slate-600">{formatMoney(record.actualAmount, currency)}</td>
        </>
      )}
      <td className="whitespace-nowrap px-2 py-2 text-right font-mono font-semibold text-slate-800">
        {formatMoney(displayAmountOf(record), currency)}
        {record.dirty && <p className="text-[10px] font-normal text-blue-500">미리보기</p>}
      </td>
      <td className="px-2 py-2">
        <div className="flex flex-wrap gap-1">
          <Badge tone={record.groupingType === "MANUAL" ? "teal" : "slate"}>{labelOf(GROUPING_TYPE_LABELS, record.groupingType)}</Badge>
          {record.groupingNote && <Badge tone="red" title={record.groupingNote}>묶음 경고</Badge>}
          {record.sourceDeleted && <Badge tone="red">원본 삭제</Badge>}
        </div>
        {record.groupingNote && <p className="mt-0.5 text-[10px] text-red-500">{record.groupingNote}</p>}
      </td>
      {editable && (
        <td className="whitespace-nowrap px-2 py-2 text-right">
          {record.dirty && (
            <div className="flex justify-end gap-1">
              <button type="button" onClick={onDraftReset} className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-50">
                취소
              </button>
              <button type="button" onClick={onSave} disabled={busy} className="rounded-md bg-blue-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-blue-700 disabled:opacity-40">
                저장
              </button>
            </div>
          )}
        </td>
      )}
    </tr>
  );
}

export default function WeighingRecordTable({
  groups,
  direction,
  currency,
  editable,
  busy,
  selectedIds,
  selectionBlocker,
  dirtyCount,
  onDraftChange,
  onDraftReset,
  onSave,
  onToggleRecords,
  onClearSelection,
  onOpenSplit,
  onOpenMove,
}) {
  const isSale = direction === "SALE";
  const columnCount = 11 + (isSale ? 2 : 0) + (editable ? 1 : 0);
  const recordCount = groups.reduce((count, group) => count + group.records.length, 0);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-700">포함 계근</h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">{recordCount}건</span>
          {dirtyCount > 0 && <span className="text-xs font-semibold text-blue-600">저장 안 된 행 {dirtyCount}건</span>}
        </div>
        {editable && (
          <div className="flex flex-wrap items-center gap-2">
            {selectedIds.length > 0 && (
              <button type="button" onClick={onClearSelection} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50">
                선택 해제 ({selectedIds.length})
              </button>
            )}
            <button
              type="button"
              onClick={onOpenMove}
              disabled={Boolean(selectionBlocker) || busy}
              title={selectionBlocker}
              className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              다른 거래로 이동
            </button>
            <button
              type="button"
              onClick={onOpenSplit}
              disabled={Boolean(selectionBlocker) || busy}
              title={selectionBlocker}
              className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              새 거래로 분리
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className={`w-full text-[13px] ${isSale ? "min-w-[82rem]" : "min-w-[70rem]"}`}>
          <thead className="bg-slate-50 text-xs text-slate-400">
            <tr>
              <th className="w-8 px-2 py-2" aria-label="선택" />
              <th className="px-2 py-2 text-left font-semibold">계량일자</th>
              <th className="px-2 py-2 text-left font-semibold">일차·이차</th>
              <th className="px-2 py-2 text-left font-semibold">원본 거래처</th>
              <th className="px-2 py-2 text-left font-semibold">품목</th>
              <th className="px-2 py-2 text-right font-semibold">실중량·인수·감량</th>
              <th className="px-2 py-2 text-right font-semibold">적용 단가(/kg)</th>
              <th className="px-2 py-2 text-right font-semibold">원본 금액</th>
              <th className="px-2 py-2 text-right font-semibold">예상금액</th>
              {isSale && <th className="px-2 py-2 text-right font-semibold">실제출고량</th>}
              {isSale && <th className="px-2 py-2 text-right font-semibold">실제금액</th>}
              <th className="px-2 py-2 text-right font-semibold">최종 표시금액</th>
              <th className="px-2 py-2 text-left font-semibold">배정</th>
              {editable && <th className="px-2 py-2" aria-label="저장" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {groups.length === 0 && (
              <tr>
                <td colSpan={columnCount} className="px-4 py-12 text-center text-sm text-slate-400">포함된 계근이 없습니다.</td>
              </tr>
            )}
            {groups.map((group) => {
              const groupIds = group.records.map((record) => record.weighingRecordId);
              const allSelected = groupIds.every((recordId) => selectedIds.includes(recordId));
              return (
                <Fragment key={group.key}>
                  <tr className="bg-slate-100/70">
                    <td className="px-2 py-1.5 text-center">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        disabled={!editable}
                        onChange={() => onToggleRecords(groupIds)}
                        aria-label={`차량 ${group.vehicleNumber} 계근 전체 선택`}
                        className="h-4 w-4 accent-blue-600"
                      />
                    </td>
                    <td colSpan={columnCount - 1} className="px-2 py-1.5 text-xs font-bold text-slate-600">
                      차량 {group.vehicleNumber || "번호 없음"} <span className="font-normal text-slate-400">· {group.records.length}건</span>
                    </td>
                  </tr>
                  {group.records.map((record) => (
                    <WeighingRow
                      key={record.mappingId}
                      record={record}
                      direction={direction}
                      currency={currency}
                      editable={editable}
                      busy={busy}
                      selected={selectedIds.includes(record.weighingRecordId)}
                      onToggle={() => onToggleRecords([record.weighingRecordId])}
                      onDraftChange={(patch) => onDraftChange(record.mappingId, patch)}
                      onDraftReset={() => onDraftReset(record.mappingId)}
                      onSave={() => onSave(record.mappingId)}
                    />
                  ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {editable && (
        <p className="border-t border-slate-100 px-5 py-2 text-[11px] text-slate-400">
          적용 단가는 계근 원본과 별도로 저장되며 원본을 바꾸지 않습니다. 무상 출고는 빈 값 대신 0을 입력하세요.
          {isSale && " 실제출고량을 비우면 실제금액이 제거되고 예상금액이 표시됩니다."}
        </p>
      )}
    </section>
  );
}
