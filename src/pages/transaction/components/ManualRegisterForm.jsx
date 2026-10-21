import CounterpartyField from "./CounterpartyField";
import ManualItemFields, { ItemDatalist } from "./ManualItemFields";

const inputClass =
  "w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20";

function Field({ label, required, className = "", children }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold text-slate-500">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </div>
  );
}

function Select({ value, options, placeholder, onChange }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  );
}

// 수기 등록 탭 — 계근 원본 없이 헤더와 한 개 이상의 품목을 함께 생성한다.
export default function ManualRegisterForm({ header, itemRows, submitBar }) {
  return (
    <>
      <p className="text-sm text-slate-500">계근 원본 없이 거래 정보와 품목을 직접 입력합니다. 수기 거래에는 나중에 계근을 추가할 수 없습니다.</p>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-bold text-slate-700">거래 정보</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="거래일" required>
            <input type="date" value={header.transactionDate} onChange={(event) => header.onChange({ transactionDate: event.target.value })} className={inputClass} />
          </Field>
          <Field label="자사" required>
            <Select value={header.ownerCompany} options={header.ownerCompanyOptions} placeholder="선택" onChange={(ownerCompany) => header.onChange({ ownerCompany })} />
          </Field>
          <Field label="입출고 구분" required>
            <Select value={header.tradeDirection} options={header.tradeDirectionOptions} placeholder="선택" onChange={(tradeDirection) => header.onChange({ tradeDirection })} />
          </Field>
          <Field label="통화" required>
            <Select value={header.currency} options={header.currencyOptions} onChange={(currency) => header.onChange({ currency })} />
          </Field>
          <Field label="거래처" className="sm:col-span-2 lg:col-span-4">
            <CounterpartyField
              companyId={header.companyId}
              counterpartyName={header.counterpartyName}
              companySearch={header.companySearch}
              onChange={header.onChange}
            />
          </Field>
          <Field label="비고" className="sm:col-span-2 lg:col-span-4">
            <textarea value={header.memo} onChange={(event) => header.onChange({ memo: event.target.value })} rows={2} className={inputClass} />
          </Field>
        </div>
      </section>
  
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700">품목 ({itemRows.rows.length})</h2>
          <button type="button" onClick={itemRows.onAddRow} className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50">
            + 품목 추가
          </button>
        </div>
        <ItemDatalist items={itemRows.items} />
        <div className="space-y-3">
          {itemRows.rows.map((row, index) => (
            <div key={row.key} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">품목 {index + 1}</span>
                <button
                  type="button"
                  onClick={() => itemRows.onRemoveRow(row.key)}
                  disabled={itemRows.rows.length <= 1}
                  className="text-xs font-semibold text-slate-400 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  삭제
                </button>
              </div>
              <ManualItemFields
                value={row.value}
                tradeDirection={itemRows.tradeDirection}
                items={itemRows.items}
                onChange={(patch) => itemRows.onRowChange(row.key, patch)}
              />
            </div>
          ))}
        </div>
      </section>
  
      <div className="flex flex-wrap items-center justify-end gap-3">
        {submitBar.error && <p className="mr-auto text-sm text-red-600">{submitBar.error}</p>}
        <button type="button" onClick={submitBar.onCancel} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
          취소
        </button>
        <button
          type="button"
          onClick={submitBar.onSubmit}
          disabled={submitBar.submitting}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-40"
        >
          {submitBar.submitting ? "등록 중..." : "등록"}
        </button>
      </div>
    </>
  );
}
