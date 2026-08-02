import { PRICE_TYPE_STYLE, formatNumber, formatShortPeriod } from "../constants";
import StatusBadge from "./StatusBadge";

// 목록 카드 — 서버 목록 응답 기준(대표 품목의 대표 단가 1건, 원화 환산가)
export default function ContractCard({ contract, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md hover:border-slate-300 transition-all"
    >
      {/* 카드 헤더 */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            {contract.ownerLabel && (
              <span className="shrink-0 text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">
                {contract.ownerLabel}
              </span>
            )}
            <h3 className="font-bold text-slate-800 leading-snug truncate">
              {contract.name}
            </h3>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-0.5 truncate">
            {contract.company || "-"}
          </p>
        </div>
        <StatusBadge status={contract.statusLabel} />
      </div>

      {/* 확정가 산정에 사용된 계약별 평균 */}
      <div className="mx-5 mt-4 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
        <p className="text-[11px] font-bold text-emerald-700">확정가 평균</p>
        <div className="mt-1.5 grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-medium text-slate-400">LME</p>
            <p className="mt-0.5 font-mono text-base font-bold text-slate-800">
              {formatNumber(contract.avgLmePrice, 2)}
              <span className="ml-1 text-[10px] font-normal text-slate-400">USD/ton</span>
            </p>
          </div>
          <div className="border-l border-emerald-100 pl-4">
            <p className="text-[10px] font-medium text-slate-400">환율</p>
            <p className="mt-0.5 font-mono text-base font-bold text-slate-800">
              {formatNumber(contract.avgExchange, 2)}
              <span className="ml-1 text-[10px] font-normal text-slate-400">원/USD</span>
            </p>
          </div>
        </div>
      </div>

      {/* 단가 영역 — 유형별 단가를 세로 나열 (원화 환산가) */}
      <div className="px-5 py-4 space-y-2.5">
        {!contract.prices || contract.prices.length === 0 ? (
          <p className="text-sm text-slate-300">등록된 단가 없음</p>
        ) : (
          contract.prices.map((price) => (
            <div key={price.priceId} className="flex items-center gap-2.5">
              <div className="shrink-0">
                <span
                  className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                    PRICE_TYPE_STYLE[price.label] ?? PRICE_TYPE_STYLE["원가"]
                  }`}
                >
                  {price.label}
                </span>
                {(price.periodStart || price.periodEnd || price.rate != null) && (
                  <span className="block mt-1 text-[11px] text-slate-400">
                    {(price.periodStart || price.periodEnd) &&
                      formatShortPeriod(price.periodStart, price.periodEnd)}
                    {(price.periodStart || price.periodEnd) && price.rate != null && " · "}
                    {price.rate != null && `요율 ${formatNumber(price.rate, 2)}%`}
                  </span>
                )}
              </div>
              <span className="flex-1 border-b border-dotted border-slate-200" />
              {price.value != null ? (
                <span className="shrink-0 text-base font-bold font-mono text-slate-700">
                  {formatNumber(price.value)}
                  <span className="text-[11px] font-normal text-slate-400 ml-1">
                    원/kg
                  </span>
                </span>
              ) : (
                <span className="shrink-0 text-sm font-semibold text-slate-300">미정</span>
              )}
            </div>
          ))
        )}
      </div>
    </button>
  );
}
