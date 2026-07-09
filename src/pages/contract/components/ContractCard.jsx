import {
  PRICE_TYPE_STYLE,
  formatDate,
  formatNumber,
  formatShortPeriod,
  isSettlementVisible,
} from "../constants";
import StatusBadge from "./StatusBadge";

export default function ContractCard({ contract, onClick }) {
  const primaryItem =
    contract.items.find((i) => i.isPrimary) ?? contract.items[0];
  const settlementVisible = isSettlementVisible(contract);

  // 정산가 줄은 확정가가 확정된 경우에만 렌더
  const visiblePrices = contract.prices.filter(
    (p) => p.type !== "정산가" || settlementVisible
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md hover:border-slate-300 transition-all"
    >
      {/* 카드 헤더 */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-bold text-slate-800 leading-snug">
            {contract.contractNo}
          </h3>
          <p className="text-sm text-slate-500 font-medium mt-0.5 truncate">
            {contract.company}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {formatShortPeriod(contract.startDate, contract.endDate)}
          </p>
        </div>
        <StatusBadge status={contract.status} />
      </div>

      {/* 단가 영역 — 대표 품목의 단가를 유형별로 세로 나열 (품목명은 표시하지 않음) */}
      <div className="px-5 py-4 space-y-2.5">
        {visiblePrices.map((price) => {
          const option = primaryItem?.options?.[price.id];
          return (
            <div key={price.id} className="flex items-center gap-2.5">
              <span
                className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                  PRICE_TYPE_STYLE[price.type] ?? PRICE_TYPE_STYLE["원가"]
                }`}
              >
                {price.type}
              </span>
              <span className="text-[11px] text-slate-400 truncate">
                {formatDate(price.periodStart)}–{formatDate(price.periodEnd).slice(5)}
                {option?.rate != null && ` · ${option.rate}%`}
              </span>
              <span className="flex-1 border-b border-dotted border-slate-200" />
              {price.krwPerKg != null ? (
                <span className="shrink-0 text-base font-bold font-mono text-slate-700">
                  {formatNumber(price.krwPerKg)}
                  <span className="text-[11px] font-normal text-slate-400 ml-1">원/kg</span>
                </span>
              ) : (
                <span className="shrink-0 text-sm font-semibold text-slate-300">미정</span>
              )}
            </div>
          );
        })}
      </div>
    </button>
  );
}
