import { MOCK_FORMULAS, PRICE_TYPES } from "../constants";

const INPUT_CLASS =
  "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-white";
const LABEL_CLASS = "block text-xs font-bold text-slate-500 mb-1.5";

// 스텝 2 — 단가 (추가형 카드 0~N개)
// 여기서 추가한 단가 목록이 스텝 3 품목 테이블의 요율 컬럼을 만든다.
export default function FormStepPrices({ prices, onAdd, onRemove, onChange }) {
  return (
    <div className="space-y-4">
      {prices.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-400">
          추가된 단가가 없습니다. [단가 추가]로 시작하세요.
        </div>
      )}

      {prices.map((price, idx) => (
        <div key={price.tempId} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400">단가 {idx + 1}</span>
            <button
              type="button"
              onClick={() => onRemove(price.tempId)}
              className="text-xs font-semibold text-red-400 hover:text-red-600 transition-colors"
            >
              삭제
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className={LABEL_CLASS}>유형</label>
              <select
                value={price.type}
                onChange={(e) => onChange(price.tempId, "type", e.target.value)}
                className={INPUT_CLASS}
              >
                {PRICE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>산정 시작</label>
              <input
                type="date"
                value={price.periodStart}
                onChange={(e) => onChange(price.tempId, "periodStart", e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>산정 종료</label>
              <input
                type="date"
                value={price.periodEnd}
                onChange={(e) => onChange(price.tempId, "periodEnd", e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>계산식</label>
              {/* TODO: API 연동 시 서버 계산식 목록으로 교체 */}
              <select
                value={price.formulaId}
                onChange={(e) => onChange(price.tempId, "formulaId", e.target.value)}
                className={INPUT_CLASS}
              >
                {MOCK_FORMULAS.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            {/* 고정값 계산식이면 고정 단가 입력란 노출 */}
            {price.formulaId === "FIXED" && (
              <div>
                <label className={LABEL_CLASS}>고정 단가</label>
                <input
                  type="number"
                  min="0"
                  placeholder="고정 단가 입력"
                  value={price.fixedPrice}
                  onChange={(e) => onChange(price.tempId, "fixedPrice", e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            )}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={onAdd}
        className="w-full py-3 text-sm font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-2xl hover:bg-blue-100 transition-all"
      >
        + 단가 추가
      </button>
    </div>
  );
}
