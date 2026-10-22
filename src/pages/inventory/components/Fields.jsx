export const INPUT_CLASS =
  "w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400";

export function SegmentedFilter({ label, value, options, onChange }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-xs font-semibold text-slate-500">{label}</legend>
      <div className="inline-flex h-[38px] rounded-lg border border-slate-200 bg-slate-50 p-1">
        {options.map((option) => (
          <button
            key={option.value || "ALL"}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-md px-3 text-xs font-bold transition-all ${
              value === option.value
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

// 트리 순서 품목 목록({ id, name, depth })을 들여쓰기한 select
export function ItemSelect({ value, itemOptions, placeholder = "품목 선택", onChange, ...rest }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className={INPUT_CLASS} {...rest}>
      <option value="">{placeholder}</option>
      {itemOptions.map((item) => (
        <option key={item.id} value={String(item.id)}>
          {`${"  ".repeat(item.depth)}${item.depth > 0 ? "└ " : ""}${item.name}`}
        </option>
      ))}
    </select>
  );
}

export function FieldLabel({ label, children }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-semibold text-slate-500">{label}</span>
      {children}
    </label>
  );
}
