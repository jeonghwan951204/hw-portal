const INPUT_CLASS =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

// 숫자 입력란은 입력 중 빈 칸을 허용하고, 저장·미리보기 때 검사한다.
const toNumberValue = (value) => (value === "" ? "" : Number(value));

function NumberArrayField({ field, onItemChange, onItemAdd, onItemRemove }) {
  const items = field.value ?? [];

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex gap-2">
          <input
            type="number"
            value={item}
            onChange={(event) => onItemChange(field.key, index, toNumberValue(event.target.value))}
            className={INPUT_CLASS}
          />
          <button
            type="button"
            onClick={() => onItemRemove(field.key, index)}
            className="shrink-0 rounded-lg border border-red-100 px-3 text-xs font-bold text-red-600 hover:bg-red-50"
          >
            삭제
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onItemAdd(field.key)}
        className="rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-50"
      >
        + 값 추가
      </button>
    </div>
  );
}

function SettingInput({ field, onChange, ...arrayHandlers }) {
  switch (field.type) {
    case "number":
      return (
        <input
          type="number"
          value={field.value ?? ""}
          onChange={(event) => onChange(field.key, toNumberValue(event.target.value))}
          className={INPUT_CLASS}
        />
      );
    case "string":
      return (
        <input
          type="text"
          value={field.value ?? ""}
          onChange={(event) => onChange(field.key, event.target.value)}
          className={INPUT_CLASS}
        />
      );
    case "boolean":
      return (
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={Boolean(field.value)}
            onChange={(event) => onChange(field.key, event.target.checked)}
          />
          사용
        </label>
      );
    case "numberArray":
      return <NumberArrayField field={field} {...arrayHandlers} />;
    default:
      return (
        <p className="rounded-xl bg-slate-50 px-3 py-2 font-mono text-xs text-slate-500">
          {JSON.stringify(field.value)} (이 화면에서 편집할 수 없는 형식입니다)
        </p>
      );
  }
}

export default function SettingsFields({ fields, onChange, onItemChange, onItemAdd, onItemRemove }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-bold text-slate-800">상수</h2>
      <p className="mt-1 text-xs text-slate-400">비워 둔 항목은 서버가 기본값으로 채웁니다.</p>

      {fields.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">이 데이터 종류에는 상수가 없습니다.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {fields.map((field) => (
            <div key={field.key}>
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                {field.label}
                {field.label !== field.key && (
                  <span className="ml-2 font-mono text-xs font-normal text-slate-400">{field.key}</span>
                )}
              </span>
              <SettingInput
                field={field}
                onChange={onChange}
                onItemChange={onItemChange}
                onItemAdd={onItemAdd}
                onItemRemove={onItemRemove}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
