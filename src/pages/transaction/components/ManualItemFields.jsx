import NumericInput from "../../contract/components/NumericInput";
import { matchItemId } from "../hooks/useItemOptions";

const ITEM_DATALIST_ID = "transaction-item-options";

const inputClass =
  "w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50";

function Field({ label, required, children }) {
  return (
    <label className="min-w-0">
      <span className="mb-1 block text-[11px] font-semibold text-slate-500">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

// 내부 품목명 자동완성 목록 — 화면에 한 번만 렌더링한다.
export function ItemDatalist({ items }) {
  return (
    <datalist id={ITEM_DATALIST_ID}>
      {items.map((item) => (
        <option key={item.id} value={item.name} />
      ))}
    </datalist>
  );
}

// 수기 품목 한 행의 입력란 — 등록 화면과 상세의 품목 추가·수정에서 함께 쓴다.
export default function ManualItemFields({ value, tradeDirection, items, onChange }) {
  const numberField = (key, label, required = false) => (
    <Field label={label} required={required}>
      <NumericInput value={value[key]} onChange={(next) => onChange({ [key]: next })} className={`${inputClass} text-right`} />
    </Field>
  );

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
      <Field label="차량번호">
        <input
          type="text"
          value={value.vehicleNumber}
          onChange={(event) => onChange({ vehicleNumber: event.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="품목" required>
        <input
          type="text"
          list={ITEM_DATALIST_ID}
          value={value.itemName}
          onChange={(event) => onChange({ itemName: event.target.value, itemId: matchItemId(items, event.target.value) })}
          placeholder="품목명 입력"
          className={inputClass}
        />
        <span className={`mt-0.5 block text-[10px] ${value.itemId ? "text-emerald-600" : "text-slate-400"}`}>
          {value.itemId ? "내부 품목 연결됨" : value.itemName ? "직접 입력(미매핑)" : " "}
        </span>
      </Field>
      {numberField("netWeightKg", "실중량(kg)", true)}
      {numberField("acceptedWeightKg", "인수량(kg)")}
      {numberField("deductionWeightKg", "감량(kg)")}
      {numberField("appliedUnitPrice", "적용 단가(/kg)")}
      {tradeDirection === "SALE" ? numberField("actualDeliveryWeightKg", "실제출고량(kg)") : <div className="hidden lg:block" />}
      <Field label="품목 비고">
        <input type="text" value={value.memo} onChange={(event) => onChange({ memo: event.target.value })} className={inputClass} />
      </Field>
    </div>
  );
}
