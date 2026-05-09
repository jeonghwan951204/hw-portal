import { formatKRW, formatRate, formatUSD } from "../../../utils/format";

export default function AverageCalculator({
  avgStartDate,
  avgEndDate,
  avgResult,
  currentRate,
  ratePercent,
  calculatedAvgKrw,
  avgDateLimits,
  setRatePercent,
  fetchAverage,
  handleAvgDateRangeChange,
}) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center">
        <h2 className="font-semibold flex items-center gap-2 text-slate-700">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full inline-block" />
          기간 평균 계산
        </h2>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
              시작일
            </label>
            <input
              type="date"
              value={avgStartDate}
              max={avgDateLimits.startMax}
              onChange={(e) => handleAvgDateRangeChange("startDate", e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-white"
            />
          </div>

          <span className="text-slate-400 pb-2 text-lg font-light">~</span>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
              종료일
            </label>
            <input
              type="date"
              value={avgEndDate}
              min={avgDateLimits.endMin}
              onChange={(e) => handleAvgDateRangeChange("endDate", e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-white"
            />
          </div>

          <button
            type="button"
            onClick={fetchAverage}
            className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 text-sm flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            평균 계산
          </button>
        </div>

        {avgResult && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
              <p className="text-xs text-blue-500 font-semibold mb-2 uppercase tracking-wide">
                LME 구리 평균가
              </p>
              <p className="text-2xl font-bold text-blue-700 font-mono">
                {formatUSD(avgResult.avgClose)}
                <span className="text-sm font-normal text-blue-400 ml-1">/t</span>
              </p>
              <p className="text-xs text-blue-400 mt-2">
                {avgStartDate} ~ {avgEndDate}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
              <p className="text-xs text-slate-500 font-semibold mb-2 uppercase tracking-wide">
                기간 평균 환율
              </p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-slate-800 font-mono">
                  {formatRate(currentRate)}
                  <span className="text-sm font-normal text-slate-400 ml-1">₩/$</span>
                </p>
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
              <label className="text-xs text-amber-600 font-semibold mb-2 uppercase tracking-wide block">
                요율
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={ratePercent}
                  onChange={(e) => setRatePercent(e.target.value.replace(/%/g, ""))}
                  placeholder="100"
                  className="w-full min-w-0 text-2xl font-bold text-amber-700 font-mono bg-white/70 border border-amber-200 rounded-lg pl-3 pr-9 py-1.5 outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg font-bold text-amber-500 pointer-events-none">
                  %
                </span>
              </div>
              <p className="text-xs text-amber-500 mt-2">예: 95, 87.5</p>
            </div>

            <div
              className={`rounded-xl p-5 border transition-all ${
                calculatedAvgKrw
                  ? "bg-emerald-50 border-emerald-100"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <p
                className={`text-xs font-semibold mb-2 uppercase tracking-wide ${
                  calculatedAvgKrw ? "text-emerald-500" : "text-slate-400"
                }`}
              >
                원화 환산가
              </p>
              <p
                className={`text-2xl font-bold font-mono ${
                  calculatedAvgKrw ? "text-emerald-700" : "text-slate-300"
                }`}
              >
                {calculatedAvgKrw ? formatKRW(calculatedAvgKrw) : "—"}
                {calculatedAvgKrw && <span className="text-sm font-normal text-emerald-400 ml-1">/kg</span>}
              </p>
              {calculatedAvgKrw && (
                <p className="text-xs text-emerald-400 mt-2">
                  {formatUSD(avgResult.avgClose)} × {Number(currentRate).toLocaleString()} × {ratePercent}%
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
