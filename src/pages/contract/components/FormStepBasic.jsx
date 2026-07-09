import { MOCK_CUSTOMERS, PRICE_UNITS, TRADE_TYPES } from "../constants";

const INPUT_CLASS =
  "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-white";
const LABEL_CLASS = "block text-xs font-bold text-slate-500 mb-1.5";

// 스텝 1 — 계약 기본
export default function FormStepBasic({ basic, onChange }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className={LABEL_CLASS}>계약번호</label>
          <input
            type="text"
            placeholder="예: CT-2026-001"
            value={basic.contractNo}
            onChange={(e) => onChange("contractNo", e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>거래처</label>
          {/* TODO: API 연동 시 서버 거래처 목록으로 교체 */}
          <select
            value={basic.customer}
            onChange={(e) => onChange("customer", e.target.value)}
            className={INPUT_CLASS}
          >
            <option value="">거래처 선택</option>
            {MOCK_CUSTOMERS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL_CLASS}>시작일</label>
          <input
            type="date"
            value={basic.startDate}
            onChange={(e) => onChange("startDate", e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>종료일</label>
          <input
            type="date"
            value={basic.endDate}
            onChange={(e) => onChange("endDate", e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>거래구분</label>
          <div className="flex items-center gap-1.5">
            {TRADE_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onChange("tradeType", t)}
                className={`flex-1 px-3 py-2 text-sm font-semibold rounded-lg border transition-all ${
                  basic.tradeType === t
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={LABEL_CLASS}>단가 단위</label>
          <div className="flex items-center gap-1.5">
            {PRICE_UNITS.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => onChange("priceUnit", u)}
                className={`flex-1 px-3 py-2 text-sm font-semibold rounded-lg border transition-all ${
                  basic.priceUnit === u
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
