import { formatKgPrice, formatMoney, formatWeight } from "../constants";
import { MappedName } from "./Badges";
import ManualItemFields, { ItemDatalist } from "./ManualItemFields";

function EditPanel({ editing, direction, items, busy, onEditChange, onSave, onCancelEdit }) {
  return (
    <div className="space-y-2 rounded-xl border border-blue-100 bg-blue-50/40 p-3">
      <p className="text-xs font-bold text-blue-600">{editing.itemId === "new" ? "품목 추가" : "품목 수정"}</p>
      <ManualItemFields value={editing.value} tradeDirection={direction} items={items} onChange={onEditChange} />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancelEdit} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
          취소
        </button>
        <button type="button" onClick={onSave} disabled={busy} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-40">
          저장
        </button>
      </div>
    </div>
  );
}

// 수기 거래 품목 — 계근 원본 비교·계근 추가 기능은 표시하지 않는다.
export default function ManualItemTable({
  rows,
  direction,
  currency,
  editable,
  busy,
  items,
  editing,
  onStartAdd,
  onStartEdit,
  onEditChange,
  onCancelEdit,
  onSave,
  onDelete,
}) {
  const isSale = direction === "SALE";
  const columnCount = 7 + (isSale ? 2 : 0) + (editable ? 1 : 0);
  const editPanel = (
    <EditPanel
      editing={editing}
      direction={direction}
      items={items}
      busy={busy}
      onEditChange={onEditChange}
      onSave={onSave}
      onCancelEdit={onCancelEdit}
    />
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-700">수기 품목</h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">{rows.length}건</span>
        </div>
        {editable && !editing && (
          <button type="button" onClick={onStartAdd} className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50">
            + 품목 추가
          </button>
        )}
      </div>
      {editable && <ItemDatalist items={items} />}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[60rem] text-[13px]">
          <thead className="bg-slate-50 text-xs text-slate-400">
            <tr>
              <th className="px-2 py-2 text-left font-semibold">차량번호</th>
              <th className="px-2 py-2 text-left font-semibold">품목</th>
              <th className="px-2 py-2 text-right font-semibold">실중량·인수·감량</th>
              <th className="px-2 py-2 text-right font-semibold">적용 단가(/kg)</th>
              <th className="px-2 py-2 text-right font-semibold">예상금액</th>
              {isSale && <th className="px-2 py-2 text-right font-semibold">실제출고량</th>}
              {isSale && <th className="px-2 py-2 text-right font-semibold">실제금액</th>}
              <th className="px-2 py-2 text-right font-semibold">최종 표시금액</th>
              <th className="px-2 py-2 text-left font-semibold">비고</th>
              {editable && <th className="px-2 py-2" aria-label="관리" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={columnCount} className="px-4 py-12 text-center text-sm text-slate-400">등록된 품목이 없습니다.</td>
              </tr>
            )}
            {rows.map((item) =>
              editing?.itemId === item.manualItemId ? (
                <tr key={item.manualItemId}>
                  <td colSpan={columnCount} className="px-3 py-2">{editPanel}</td>
                </tr>
              ) : (
                <tr key={item.manualItemId} className={`align-top ${isSale && item.unitPrice == null ? "bg-red-50/60" : ""}`}>
                  <td className="whitespace-nowrap px-2 py-2 text-slate-600">{item.vehicleNumber || "-"}</td>
                  <td className="px-2 py-2 text-slate-700">
                    <MappedName name={item.itemName} mapped={item.itemId != null} emptyLabel="품목 미입력" />
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-right font-mono text-slate-700">
                    <p>{formatWeight(item.netWeightKg)}</p>
                    <p className="text-[11px] text-slate-500">인수 {formatWeight(item.acceptedWeightKg)}</p>
                    <p className="text-[11px] text-slate-400">감량 {formatWeight(item.deductionWeightKg)}</p>
                  </td>
                  <td className={`whitespace-nowrap px-2 py-2 text-right font-mono ${item.unitPrice == null ? "text-amber-600" : "text-slate-700"}`}>
                    {formatKgPrice(item.unitPrice, currency)}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-right font-mono text-slate-600">{formatMoney(item.estimatedAmount, currency)}</td>
                  {isSale && <td className="whitespace-nowrap px-2 py-2 text-right font-mono text-slate-700">{formatWeight(item.actualDeliveryWeightKg)}</td>}
                  {isSale && <td className="whitespace-nowrap px-2 py-2 text-right font-mono text-slate-600">{formatMoney(item.actualAmount, currency)}</td>}
                  <td className="whitespace-nowrap px-2 py-2 text-right font-mono font-semibold text-slate-800">{formatMoney(item.displayAmount, currency)}</td>
                  <td className="px-2 py-2 text-slate-500">{item.memo || "-"}</td>
                  {editable && (
                    <td className="whitespace-nowrap px-2 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onStartEdit(item)}
                          disabled={Boolean(editing)}
                          className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(item.manualItemId)}
                          disabled={Boolean(editing) || busy || rows.length <= 1}
                          title={rows.length <= 1 ? "수기 거래에는 품목이 한 건 이상 있어야 합니다" : undefined}
                          className="rounded-md border border-red-200 px-2 py-1 text-[11px] font-semibold text-red-500 hover:bg-red-50 disabled:opacity-40"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
      {editing?.itemId === "new" && <div className="border-t border-slate-100 p-3">{editPanel}</div>}
    </section>
  );
}
