import CompanySelect from "../../contract/components/CompanySelect";
import ModalShell from "./ModalShell";

const inputClass =
  "w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20";

function SourceValue({ label, value, emptyLabel }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-bold text-slate-400">{label}</p>
      <p className={`mt-0.5 truncate text-sm font-semibold ${value ? "text-slate-800" : "text-amber-600"}`} title={value ?? ""}>
        {value || emptyLabel}
      </p>
    </div>
  );
}

// 계근 거래처·품목 수동 매핑 — 이 계근 1건에만 적용되고, 이후 자동 재매칭에서도 유지된다
export default function WeighingMappingModal({
  open,
  target,
  company,
  itemId,
  items,
  companySearch,
  saving,
  error,
  onCompanyChange,
  onItemChange,
  onSave,
  onClose,
}) {
  if (!open || !target) return null;

  return (
    <ModalShell
      title="거래처·품목 매핑"
      description="선택한 계근 1건의 거래처·품목을 내부 데이터에 직접 연결합니다. 고르지 않은 항목은 기존 매핑을 유지합니다."
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            취소
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-40"
          >
            {saving ? "저장 중..." : "매핑 저장"}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 px-4 py-3">
        <SourceValue label="원본 거래처명" value={target.sourceCounterpartyName} emptyLabel="거래처 미입력" />
        <SourceValue label="원본 품목명" value={target.sourceItemName} emptyLabel="품목 미입력" />
      </div>

      <div>
        <span className="mb-1.5 block text-xs font-semibold text-slate-500">거래처</span>
        <CompanySelect value={company.id} selectedName={company.name} onSelect={onCompanyChange} className={inputClass} {...companySearch} />
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-slate-500">품목</span>
        <select value={itemId} onChange={(event) => onItemChange(event.target.value)} className={inputClass}>
          <option value="">{target.itemId != null ? "변경하지 않음" : "선택"}</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
        {target.itemId != null && target.itemName && (
          <span className="mt-1 block text-[11px] text-slate-400">현재 매핑: {target.itemName}</span>
        )}
      </label>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      <p className="text-xs text-slate-400">
        같은 원본명을 가진 다른 계근에는 적용되지 않으며, 매핑 해제는 지원하지 않습니다. 이미 만들어진 거래의 거래처는 자동으로 바뀌지 않습니다.
      </p>
    </ModalShell>
  );
}
