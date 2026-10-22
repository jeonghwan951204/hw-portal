import { formatKg, parseQuantity, REASON_MAX_LENGTH } from "../constants";
import { INPUT_CLASS } from "./Fields";

const toneOf = (value) => (Number(value) < 0 ? "font-bold text-red-600" : "");

function DifferenceCell({ actual, book }) {
  const quantity = parseQuantity(actual);
  if (quantity == null) return <span className="text-slate-300">-</span>;
  const difference = Math.round((quantity - book) * 10000) / 10000;
  if (difference === 0) return <span className="text-xs text-emerald-600">일치</span>;
  return (
    <span className={`font-semibold ${difference > 0 ? "text-blue-600" : "text-red-600"}`}>
      {difference > 0 ? "+" : ""}
      {formatKg(difference)}
    </span>
  );
}

// 품목 트리 재고 — 상위 품목 접기/펼치기, 행별 이동·증감, 일일 재고 확인(실제 수량 입력)
export default function ItemStockTable({
  rows,
  totalQuantityKg,
  parentIds,
  collapsedIds,
  countMode,
  countAvailable,
  actuals,
  countReason,
  countBlocker,
  countSubmitting,
  onToggleCollapse,
  onExpandAll,
  onCollapseAll,
  onToggleCountMode,
  onActualChange,
  onCountReasonChange,
  onSubmitCount,
  onOpenTransfer,
  onOpenAdjustment,
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
        <div>
          <h2 className="text-sm font-bold text-slate-700">품목별 재고</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            재고는 하위 품목을 포함한 합계, 자체 재고는 그 품목명으로 직접 잡힌 수량입니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {parentIds.size > 0 && (
            <>
              <button type="button" onClick={onExpandAll} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50">
                모두 펼치기
              </button>
              <button type="button" onClick={onCollapseAll} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50">
                모두 접기
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onToggleCountMode}
            disabled={!countAvailable && !countMode}
            title={countAvailable ? undefined : "자사를 선택하면 재고 확인을 입력할 수 있습니다"}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 ${
              countMode
                ? "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            {countMode ? "재고 확인 닫기" : "재고 확인 입력"}
          </button>
        </div>
      </div>

      {countMode && (
        <p className="border-b border-emerald-100 bg-emerald-50 px-5 py-2 text-xs text-emerald-800">
          확인한 품목만 실제 수량을 입력하세요. 차이는 <b>자체 재고</b>와 비교하며, 차이가 있는 품목만 보정됩니다.
          하위 품목이 있는 상위 품목은 하위를 제외한 자체 재고만 맞춰집니다.
        </p>
      )}

      {rows.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-slate-400">표시할 품목이 없습니다.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-[13px]">
            <thead className="bg-slate-50 text-xs text-slate-400">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">품목</th>
                <th className="px-4 py-2 text-right font-semibold">재고(kg)</th>
                <th className="px-4 py-2 text-right font-semibold">자체 재고(kg)</th>
                {countMode && <th className="w-36 px-4 py-2 text-right font-semibold">실제 수량(kg)</th>}
                {countMode && <th className="px-4 py-2 text-right font-semibold">차이</th>}
                {!countMode && <th className="w-36 px-4 py-2 text-right font-semibold">보정</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => {
                const key = String(row.itemId);
                const hasChildren = parentIds.has(key);
                const collapsed = collapsedIds.has(key);
                return (
                  <tr key={key} className="hover:bg-slate-50/60">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1" style={{ paddingLeft: `${row.depth * 1.25}rem` }}>
                        {hasChildren ? (
                          <button
                            type="button"
                            onClick={() => onToggleCollapse(row.itemId)}
                            aria-label={collapsed ? "펼치기" : "접기"}
                            className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 transition-transform ${collapsed ? "-rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        ) : (
                          <span className="w-5 text-center text-slate-300">{row.depth > 0 ? "└" : ""}</span>
                        )}
                        <span className={row.depth === 0 ? "font-semibold text-slate-800" : "text-slate-700"}>{row.itemName}</span>
                      </div>
                    </td>
                    <td className={`px-4 py-2 text-right tabular-nums ${toneOf(row.quantityKg)}`}>{formatKg(row.quantityKg)}</td>
                    <td className={`px-4 py-2 text-right tabular-nums text-slate-500 ${toneOf(row.ownQuantityKg)}`}>
                      {hasChildren || countMode ? formatKg(row.ownQuantityKg) : ""}
                    </td>
                    {countMode && (
                      <td className="px-4 py-1.5">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          inputMode="decimal"
                          value={actuals[key] ?? ""}
                          onChange={(event) => onActualChange(row.itemId, event.target.value)}
                          placeholder="미확인"
                          className={`${INPUT_CLASS} py-1 text-right`}
                        />
                      </td>
                    )}
                    {countMode && (
                      <td className="px-4 py-2 text-right tabular-nums">
                        <DifferenceCell actual={actuals[key]} book={Number(row.ownQuantityKg ?? 0)} />
                      </td>
                    )}
                    {!countMode && (
                      <td className="px-4 py-1.5 text-right">
                        <div className="inline-flex gap-1">
                          <button type="button" onClick={() => onOpenTransfer(row.itemId)} className="rounded-md border border-blue-200 px-2 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-50">
                            이동
                          </button>
                          <button type="button" onClick={() => onOpenAdjustment(row.itemId)} className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-bold text-slate-500 hover:bg-slate-50">
                            증감
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t border-slate-200 bg-slate-50 font-bold">
              <tr>
                <td className="px-4 py-2 text-slate-600">합계</td>
                <td className={`px-4 py-2 text-right tabular-nums ${toneOf(totalQuantityKg)}`}>{formatKg(totalQuantityKg)}</td>
                <td colSpan={countMode ? 3 : 2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {countMode && (
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-5 py-3">
          <input
            type="text"
            value={countReason}
            maxLength={REASON_MAX_LENGTH}
            onChange={(event) => onCountReasonChange(event.target.value)}
            placeholder="사유 (선택, 비우면 '재고 확인 보정')"
            className={`${INPUT_CLASS} flex-1 sm:max-w-md`}
          />
          {countBlocker && <span className="text-xs text-slate-400">{countBlocker}</span>}
          <button
            type="button"
            onClick={onSubmitCount}
            disabled={Boolean(countBlocker) || countSubmitting}
            className="ml-auto rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {countSubmitting ? "저장 중..." : "재고 확인 저장"}
          </button>
        </div>
      )}
    </section>
  );
}
