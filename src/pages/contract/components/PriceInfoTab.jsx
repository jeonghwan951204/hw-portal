import { PRICE_TYPE_STYLE, formatDate, formatNumber } from "../constants";

// 탭 1 — 계약·단가: 단가별 기간 줄(확정 버튼) + 품목 × 단가 매트릭스
export default function PriceInfoTab({
  rows = [],
  columns = [],
  priceLines = [],
  onConfirm,
  confirmingId,
  onRecalc,
  recalculatingId,
}) {
  if (columns.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 py-16 text-center text-sm text-slate-400">
        등록된 단가가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 단가별 기간 줄 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 divide-y divide-slate-100">
        {priceLines.map((line) => (
          <div key={line.priceId} className="px-5 py-3.5 flex flex-wrap items-center gap-3">
            <span
              className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-md border ${
                PRICE_TYPE_STYLE[line.label] ?? PRICE_TYPE_STYLE["원가"]
              }`}
            >
              {line.label}
            </span>
            <span className="text-sm text-slate-600 font-medium">
              {formatDate(line.periodStart)} – {formatDate(line.periodEnd)}
            </span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                line.confirmed
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                  : "bg-slate-50 text-slate-400 border-slate-200"
              }`}
            >
              {line.confirmed ? "확정" : "미확정"}
            </span>

            <span className="ml-auto flex items-center gap-3">
              <span className="text-xs text-slate-400 font-mono">
                {line.avgLme != null && <>LME {formatNumber(line.avgLme, 2)}</>}
                {line.avgExchange != null && (
                  <span className="ml-3">환율 {formatNumber(line.avgExchange, 2)}</span>
                )}
              </span>
              {!line.confirmed && (
                <span className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onRecalc(line.priceId)}
                    disabled={recalculatingId === line.priceId || confirmingId === line.priceId}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      recalculatingId === line.priceId || confirmingId === line.priceId
                        ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                        : "text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100 active:scale-95"
                    }`}
                  >
                    {recalculatingId === line.priceId ? "재계산 중..." : "재계산"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onConfirm(line.priceId)}
                    disabled={confirmingId === line.priceId || recalculatingId === line.priceId}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      confirmingId === line.priceId || recalculatingId === line.priceId
                        ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                        : "text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 active:scale-95"
                    }`}
                  >
                    {confirmingId === line.priceId ? "확정 중..." : "확정"}
                  </button>
                </span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* 품목 표 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-700">품목별 단가</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-xs">
                <th className="px-5 py-2.5 text-left font-semibold whitespace-nowrap">품목명</th>
                {columns.map((col) => (
                  <th key={col.priceId} className="px-5 py-2.5 text-right font-semibold whitespace-nowrap">
                    <span>{col.label}</span>
                    {col.unitHint && (
                      <span className="block mt-0.5 text-[10px] font-normal text-slate-400">
                        {col.unitHint}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.itemId} className={row.primary ? "bg-blue-50/40" : ""}>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className="font-semibold text-slate-700">{row.itemName}</span>
                    {row.primary && (
                      <span className="ml-2 text-[10px] font-bold text-blue-500 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full">
                        대표
                      </span>
                    )}
                  </td>
                  {columns.map((col) => {
                    const cell = row.cells[col.priceId];
                    return (
                      <td key={col.priceId} className="px-5 py-3 text-right whitespace-nowrap">
                        <p className="font-mono font-bold text-slate-700">
                          {cell?.unitPrice != null
                            ? formatNumber(cell.unitPrice, col.unitHint === "원/kg" ? 0 : 2)
                            : "-"}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {cell?.rate != null && `요율 ${cell.rate}`}
                          {cell?.premium != null && cell.premium !== 0 && ` · +${formatNumber(cell.premium)}`}
                        </p>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
