const INPUT_CLASS =
  "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-white";
const LABEL_CLASS = "block text-xs font-bold text-slate-500 mb-1.5";

// 스텝 2 — 단가 (추가형 카드 0~N개)
// 여기서 추가한 단가 목록이 스텝 3 품목 테이블의 요율 컬럼을 만든다.
export default function FormStepPrices({
  prices,
  onAdd,
  onRemove,
  onChange,
  priceTypeOptions = [],
  sourceOptions = [],
  calcMethodOptions = [],
}) {
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
                value={price.priceType}
                onChange={(e) => onChange(price.tempId, "priceType", e.target.value)}
                className={INPUT_CLASS}
              >
                {priceTypeOptions.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>산출 방식</label>
              <select
                value={price.priceSource}
                onChange={(e) => onChange(price.tempId, "priceSource", e.target.value)}
                className={INPUT_CLASS}
              >
                {sourceOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
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

            {/* 계산 단가면 계산식, 고정 단가면 고정 단가 입력 */}
            {price.priceSource === "FIXED" ? (
              <div>
                <label className={LABEL_CLASS}>고정 단가</label>
                <input
                  type="number"
                  min="0"
                  placeholder="고정 단가 입력"
                  value={price.fixedUnitPrice}
                  onChange={(e) => onChange(price.tempId, "fixedUnitPrice", e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            ) : (
              <div>
                <label className={LABEL_CLASS}>계산식</label>
                <select
                  value={price.calcMethod}
                  onChange={(e) => onChange(price.tempId, "calcMethod", e.target.value)}
                  className={INPUT_CLASS}
                >
                  {calcMethodOptions.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
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
