import { formatDate, formatNumber } from "../constants";

// 시장 현황 배너 — 최근 LME(USD/ton) + 환율(원/USD). 기준 날짜가 서로 다를 수 있어 각각 표시.
export default function MarketBanner({ lme, exchangeRate }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">LME</p>
          <p className="text-2xl font-bold font-mono text-slate-800 mt-1">
            {formatNumber(lme.value, 2)}
            <span className="text-xs font-normal text-slate-400 ml-1.5">USD/ton</span>
          </p>
        </div>
        <span className="text-xs text-slate-400 font-medium bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
          {formatDate(lme.date)} 기준
        </span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">환율</p>
          <p className="text-2xl font-bold font-mono text-slate-800 mt-1">
            {formatNumber(exchangeRate.value, 2)}
            <span className="text-xs font-normal text-slate-400 ml-1.5">원/USD</span>
          </p>
        </div>
        <span className="text-xs text-slate-400 font-medium bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
          {formatDate(exchangeRate.date)} 기준
        </span>
      </div>
    </div>
  );
}
