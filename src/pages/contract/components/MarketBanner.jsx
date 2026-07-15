import { formatDate, formatNumber } from "../constants";

function MarketCard({ label, value, unit, digits, date, loading }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-4 flex items-center justify-between">
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold font-mono text-slate-800 mt-1">
          {loading ? (
            <span className="text-slate-300">···</span>
          ) : value != null ? (
            <>
              {formatNumber(value, digits)}
              <span className="text-xs font-normal text-slate-400 ml-1.5">{unit}</span>
            </>
          ) : (
            <span className="text-slate-300 text-lg">-</span>
          )}
        </p>
      </div>
      {date && (
        <span className="text-xs text-slate-400 font-medium bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
          {formatDate(date)} 기준
        </span>
      )}
    </div>
  );
}

// 시장 현황 배너 — 최근 LME(USD/ton) + 환율(원/USD) + 원화환산(원/kg).
// LME·환율은 기준일이 서로 다를 수 있어 각각 표시. 원화환산은 파생값이라 날짜 생략.
export default function MarketBanner({ lme, exchangeRate, krwPerKg, loading }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <MarketCard label="LME" value={lme?.value} unit="USD/ton" digits={2} date={lme?.date} loading={loading} />
      <MarketCard label="환율" value={exchangeRate?.value} unit="원/USD" digits={2} date={exchangeRate?.date} loading={loading} />
      <MarketCard label="원화환산" value={krwPerKg} unit="원/kg" digits={0} loading={loading} />
    </div>
  );
}
