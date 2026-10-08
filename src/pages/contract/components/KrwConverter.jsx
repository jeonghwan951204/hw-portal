import { formatNumber } from "../constants";
import NumericInput from "./NumericInput";

const INPUT_CLASS =
  "w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-white";
const LABEL_CLASS = "block text-xs font-bold text-slate-500 mb-1.5";

// 수출 계약 원화 환산 계산기 — 단가(USD/ton) × 환율 ÷ 1000 = 원/kg (소수점 절삭)
export default function KrwConverter({ unitPrice, exchange, result, onChange }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-700">원화 환산 계산기</h3>
        <p className="text-[11px] text-slate-400">
          품목별 단가의 단가를 클릭하면 단가 입력칸에 들어갑니다
        </p>
      </div>
      <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto_1fr] items-end gap-3">
        <div>
          <label className={LABEL_CLASS}>단가 (USD/ton)</label>
          <NumericInput
            value={unitPrice}
            onChange={(value) => onChange("unitPrice", value)}
            className={INPUT_CLASS}
            placeholder="단가 입력"
          />
        </div>
        <span className="hidden sm:block pb-2 text-slate-400 font-bold">×</span>
        <div>
          <label className={LABEL_CLASS}>환율 (원/USD)</label>
          <NumericInput
            value={exchange}
            onChange={(value) => onChange("exchange", value)}
            className={INPUT_CLASS}
            placeholder="환율 입력"
          />
        </div>
        <span className="hidden sm:block pb-2 text-slate-400 font-bold">=</span>
        <div>
          <label className={LABEL_CLASS}>원화 환산 (원/kg)</label>
          <p className="px-3 py-2 text-sm font-mono font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-lg">
            {result != null ? formatNumber(result) : "-"}
          </p>
        </div>
      </div>
      <p className="px-5 pb-4 text-[11px] text-slate-400">단가 × 환율 ÷ 1,000 (소수점 절삭)</p>
    </div>
  );
}
