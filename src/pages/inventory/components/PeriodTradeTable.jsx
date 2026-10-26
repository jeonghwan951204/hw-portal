import { formatAveragePrice, formatKg, formatKoreanDate } from "../constants";

const hasQuantity = (stat) => Number(stat?.quantityKg ?? 0) !== 0;

// 수량(kg) + 계근 건수. 거래가 없으면 '-'
function QuantityCell({ stat }) {
  if (!hasQuantity(stat)) return <td className="px-4 py-2 text-right text-slate-300">-</td>;
  return (
    <td className="px-4 py-2 text-right tabular-nums">
      <div>{formatKg(stat.quantityKg)}</div>
      <div className="text-[11px] text-slate-400">{stat.weighingCount}건</div>
    </td>
  );
}

// 평균 단가(원/kg) + 단가 없는 수량. 단가 없는 수량은 평균 계산에서 빠진다
function PriceCell({ stat }) {
  if (!hasQuantity(stat)) return <td className="px-4 py-2 text-right text-slate-300">-</td>;
  const unpriced = Number(stat.unpricedQuantityKg ?? 0);
  return (
    <td className="px-4 py-2 text-right tabular-nums">
      <div className={stat.averageUnitPrice == null ? "text-slate-300" : "font-semibold text-slate-800"}>
        {formatAveragePrice(stat.averageUnitPrice)}
      </div>
      {unpriced !== 0 && <div className="text-[11px] text-amber-600">단가 없음 {formatKg(unpriced)} kg</div>}
    </td>
  );
}

// 기간 통계 — 품목 트리별 매입·매출 수량과 평균 단가, 하단 합계
export default function PeriodTradeTable({
  loading,
  error,
  dateFrom,
  dateTo,
  rows,
  parentIds,
  collapsedIds,
  totalPurchase,
  totalSale,
  onToggleCollapse,
  onExpandAll,
  onCollapseAll,
  onRetry,
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center text-sm text-slate-400 shadow-sm">
        기간 통계를 불러오는 중입니다.
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

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
        <div>
          <h2 className="text-sm font-bold text-slate-700">
            품목별 기간 통계
            <span className="ml-2 text-xs font-semibold text-slate-400">
              {formatKoreanDate(dateFrom)} ~ {formatKoreanDate(dateTo)}
            </span>
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            원본 계근데이터의 인수량 기준이며, 상위 품목은 하위 품목을 포함한 합계입니다. 평균 단가는 단가가 있는 계근의
            인수량 가중 평균(원/kg)입니다.
          </p>
        </div>
        {parentIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={onExpandAll} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50">
              모두 펼치기
            </button>
            <button type="button" onClick={onCollapseAll} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50">
              모두 접기
            </button>
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-slate-400">표시할 품목이 없습니다.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] text-[13px]">
            <thead className="bg-slate-50 text-xs text-slate-400">
              <tr>
                <th rowSpan={2} className="px-4 py-2 text-left font-semibold">품목</th>
                <th colSpan={2} className="border-l border-slate-200 px-4 pt-2 text-center font-bold text-blue-600">매입 (입고)</th>
                <th colSpan={2} className="border-l border-slate-200 px-4 pt-2 text-center font-bold text-rose-600">매출 (출고)</th>
              </tr>
              <tr>
                <th className="border-l border-slate-200 px-4 pb-2 pt-1 text-right font-semibold">수량(kg)</th>
                <th className="px-4 pb-2 pt-1 text-right font-semibold">평균 단가(원/kg)</th>
                <th className="border-l border-slate-200 px-4 pb-2 pt-1 text-right font-semibold">수량(kg)</th>
                <th className="px-4 pb-2 pt-1 text-right font-semibold">평균 단가(원/kg)</th>
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
                    <QuantityCell stat={row.purchase} />
                    <PriceCell stat={row.purchase} />
                    <QuantityCell stat={row.sale} />
                    <PriceCell stat={row.sale} />
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-800">
              <tr>
                <td className="px-4 py-2.5">합계</td>
                <QuantityCell stat={totalPurchase} />
                <PriceCell stat={totalPurchase} />
                <QuantityCell stat={totalSale} />
                <PriceCell stat={totalSale} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}
