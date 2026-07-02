import { formatUSD } from "../../../utils/format";
import { STATUS_STYLE, formatPeriod } from "../constants";

export default function ContractCard({ contract }) {
  const {
    name, customer, status,
    provisionalPeriod, finalPeriod,
    provisionalPrice, finalPrice,
  } = contract;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* 카드 헤더 */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-400 font-medium mb-1">{customer}</p>
          <h3 className="font-semibold text-slate-800 leading-snug">{name}</h3>
        </div>
        <span
          className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLE[status] ?? STATUS_STYLE["종료"]}`}
        >
          {status}
        </span>
      </div>

      {/* 카드 본문 */}
      <div className="px-6 py-5 space-y-4">
        {/* 기간 */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap w-20 shrink-0">
              가단가 기간
            </span>
            <span className="text-sm text-slate-600 font-medium whitespace-nowrap">
              {formatPeriod(provisionalPeriod.start, provisionalPeriod.end)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap w-20 shrink-0">
              확정가 기간
            </span>
            <span className="text-sm text-slate-600 font-medium whitespace-nowrap">
              {formatPeriod(finalPeriod.start, finalPeriod.end)}
            </span>
          </div>
        </div>

        {/* 구분선 */}
        <div className="border-t border-slate-100" />

        {/* 단가 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
              가단가
            </p>
            <p className="text-xl font-bold font-mono text-slate-700">
              {formatUSD(provisionalPrice)}
              <span className="text-xs font-normal text-slate-400 ml-1">$/t</span>
            </p>
          </div>
          <div
            className={`rounded-xl px-4 py-3 border transition-colors ${
              finalPrice
                ? "bg-emerald-50 border-emerald-100"
                : "bg-slate-50 border-slate-100"
            }`}
          >
            <p
              className={`text-[10px] font-bold uppercase tracking-wide mb-1.5 ${
                finalPrice ? "text-emerald-500" : "text-slate-400"
              }`}
            >
              확정가
            </p>
            {finalPrice ? (
              <p className="text-xl font-bold font-mono text-emerald-700">
                {formatUSD(finalPrice)}
                <span className="text-xs font-normal text-emerald-400 ml-1">$/t</span>
              </p>
            ) : (
              <p className="text-xl font-bold font-mono text-slate-300">미확정</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
