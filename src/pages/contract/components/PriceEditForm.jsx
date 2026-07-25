import NumericInput from "./NumericInput";

const INPUT_CLASS =
  "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-white";
const LABEL_CLASS = "block text-xs font-bold text-slate-500 mb-1.5";

export default function PriceEditForm({
  form,
  sourceOptions = [],
  calcMethodOptions = [],
  submitting,
  onChange,
  onItemChange,
  onSubmit,
  onCancel,
}) {
  const isCalculated = form.priceSource === "CALCULATED";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="px-5 py-5 bg-slate-50 border-t border-slate-100"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className={LABEL_CLASS}>산출 방식</label>
          <select
            value={form.priceSource}
            onChange={(event) => onChange("priceSource", event.target.value)}
            className={INPUT_CLASS}
            disabled={submitting}
          >
            {sourceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {isCalculated ? (
          <>
            <div>
              <label className={LABEL_CLASS}>계산식</label>
              <select
                value={form.calcMethod}
                onChange={(event) => onChange("calcMethod", event.target.value)}
                className={INPUT_CLASS}
                disabled={submitting}
              >
                <option value="">선택</option>
                {calcMethodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>산정 시작</label>
              <input
                type="date"
                value={form.periodStart}
                onChange={(event) => onChange("periodStart", event.target.value)}
                className={INPUT_CLASS}
                disabled={submitting}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>산정 종료</label>
              <input
                type="date"
                value={form.periodEnd}
                min={form.periodStart || undefined}
                onChange={(event) => onChange("periodEnd", event.target.value)}
                className={INPUT_CLASS}
                disabled={submitting}
              />
            </div>
          </>
        ) : (
          <div>
            <label className={LABEL_CLASS}>고정 단가</label>
            <NumericInput
              value={form.fixedUnitPrice}
              onChange={(value) => onChange("fixedUnitPrice", value)}
              className={INPUT_CLASS}
              placeholder="고정 단가 입력"
              disabled={submitting}
            />
          </div>
        )}
      </div>

      <div className="mt-5">
        <h4 className="text-xs font-bold text-slate-500 mb-2">품목별 조정</h4>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100 text-xs text-slate-500">
                <th className="px-4 py-2 text-left font-semibold">품목명</th>
                <th className="px-4 py-2 text-left font-semibold">요율</th>
                <th className="px-4 py-2 text-left font-semibold">프리미엄</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {form.items.map((item) => (
                <tr key={item.itemId}>
                  <td className="px-4 py-2.5 font-semibold text-slate-700 whitespace-nowrap">
                    {item.itemName}
                  </td>
                  <td className="px-4 py-2.5 min-w-36">
                    <NumericInput
                      value={item.rate}
                      onChange={(value) => onItemChange(item.itemId, "rate", value)}
                      className={INPUT_CLASS}
                      disabled={submitting}
                    />
                  </td>
                  <td className="px-4 py-2.5 min-w-36">
                    <NumericInput
                      value={item.premium}
                      onChange={(value) => onItemChange(item.itemId, "premium", value)}
                      className={INPUT_CLASS}
                      disabled={submitting}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-4 py-2 text-sm font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
        >
          {submitting ? "저장 중..." : "저장 및 재계산"}
        </button>
      </div>
    </form>
  );
}
