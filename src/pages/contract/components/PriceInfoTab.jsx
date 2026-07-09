import {
  PRICE_TYPE_STYLE,
  formatDate,
  formatNumber,
  unitLabel,
} from "../constants";

// 탭 1 — 계약·단가: 단가별 기간 줄 + 품목 표
export default function PriceInfoTab({ contract }) {
  const isExport = contract.tradeType === "수출";
  const unit = unitLabel(contract);
  const valueDigits = isExport ? 2 : 0;

  return (
    <div className="space-y-6">
      {/* 단가별 기간 줄 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 divide-y divide-slate-100">
        {contract.prices.map((price) => (
          <div key={price.id} className="px-5 py-3.5 flex flex-wrap items-center gap-3">
            <span
              className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-md border ${
                PRICE_TYPE_STYLE[price.type] ?? PRICE_TYPE_STYLE["원가"]
              }`}
            >
              {price.type}
            </span>
            <span className="text-sm text-slate-600 font-medium">
              {formatDate(price.periodStart)} – {formatDate(price.periodEnd)}
            </span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                price.confirmed
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                  : "bg-slate-50 text-slate-400 border-slate-200"
              }`}
            >
              {price.confirmed ? "확정" : "미확정"}
            </span>

            {/* 기준값 — 수출은 LME만, 내수는 LME + 환율 */}
            <span className="ml-auto text-xs text-slate-400 font-mono">
              LME {price.lme != null ? formatNumber(price.lme, 2) : "-"}
              {!isExport && (
                <span className="ml-3">
                  환율 {price.exchangeRate != null ? formatNumber(price.exchangeRate, 2) : "-"}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* 품목 표 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700">품목</h3>
          <span className="text-xs text-slate-400">{unit}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-xs">
                <th className="px-5 py-2.5 text-left font-semibold whitespace-nowrap">품목명</th>
                {contract.prices.map((price) => (
                  <th key={price.id} className="px-5 py-2.5 text-right font-semibold whitespace-nowrap">
                    {price.type}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contract.items.map((item) => (
                <tr key={item.id} className={item.isPrimary ? "bg-blue-50/40" : ""}>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className="font-semibold text-slate-700">{item.name}</span>
                    {item.isPrimary && (
                      <span className="ml-2 text-[10px] font-bold text-blue-500 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full">
                        대표
                      </span>
                    )}
                  </td>
                  {contract.prices.map((price) => {
                    const option = item.options?.[price.id];
                    return (
                      <td key={price.id} className="px-5 py-3 text-right whitespace-nowrap">
                        <p className="font-mono font-bold text-slate-700">
                          {option?.value != null ? formatNumber(option.value, valueDigits) : "-"}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {option?.rate != null && `요율 ${option.rate}%`}
                          {option?.premium != null && ` · 프리미엄 +${formatNumber(option.premium)}`}
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
