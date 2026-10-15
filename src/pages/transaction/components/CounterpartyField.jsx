import CompanySelect from "../../contract/components/CompanySelect";

const inputClass =
  "w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-500";

// 거래처 입력 — 내부 거래처를 고르거나, 고르지 않고 거래처명을 직접 입력한다(미매핑).
export default function CounterpartyField({ companyId, counterpartyName, companySearch, onChange }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <CompanySelect
        value={companyId ?? ""}
        selectedName={companyId ? counterpartyName : ""}
        onSelect={(company) =>
          onChange(company.id ? { companyId: company.id, counterpartyName: company.name } : { companyId: null, counterpartyName: "" })
        }
        className={inputClass}
        {...companySearch}
      />
      <input
        type="text"
        value={counterpartyName}
        disabled={Boolean(companyId)}
        onChange={(event) => onChange({ companyId: null, counterpartyName: event.target.value })}
        placeholder="내부 거래처가 없으면 거래처명 직접 입력"
        aria-label="거래처명 직접 입력"
        className={inputClass}
      />
    </div>
  );
}
