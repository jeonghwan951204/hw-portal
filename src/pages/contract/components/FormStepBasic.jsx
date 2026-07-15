const INPUT_CLASS =
  "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-white";
const LABEL_CLASS = "block text-xs font-bold text-slate-500 mb-1.5";

// 세그먼트 버튼 그룹 (enum 옵션 기반)
function SegmentGroup({ options, value, onChange }) {
  return (
    <div className="flex items-center gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 px-3 py-2 text-sm font-semibold rounded-lg border transition-all ${
            value === o.value
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// 스텝 1 — 계약 기본
export default function FormStepBasic({
  basic,
  onChange,
  companies = [],
  ownerOptions = [],
  tradeOptions = [],
  unitOptions = [],
  statusOptions = [],
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="sm:col-span-2">
          <label className={LABEL_CLASS}>
            계약명 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="예: 포스코 A동 수출 계약"
            value={basic.contractName}
            onChange={(e) => onChange("contractName", e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>
            계약번호 <span className="font-normal text-slate-400">(선택)</span>
          </label>
          <input
            type="text"
            placeholder="예: CT-2026-001"
            value={basic.contractNo}
            onChange={(e) => onChange("contractNo", e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>
            소속회사 <span className="text-red-500">*</span>
          </label>
          <SegmentGroup
            options={ownerOptions}
            value={basic.ownerCompany}
            onChange={(v) => onChange("ownerCompany", v)}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>거래처</label>
          <select
            value={basic.customerId}
            onChange={(e) => onChange("customerId", e.target.value)}
            className={INPUT_CLASS}
          >
            <option value="">거래처 선택</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL_CLASS}>상태</label>
          <select
            value={basic.status}
            onChange={(e) => onChange("status", e.target.value)}
            className={INPUT_CLASS}
          >
            {statusOptions.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
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
          <SegmentGroup
            options={tradeOptions}
            value={basic.tradeType}
            onChange={(v) => onChange("tradeType", v)}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>단가 단위</label>
          <SegmentGroup
            options={unitOptions}
            value={basic.priceUnit}
            onChange={(v) => onChange("priceUnit", v)}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>
            계약 수량 <span className="font-normal text-slate-400">(kg, 참고용)</span>
          </label>
          <input
            type="number"
            min="0"
            placeholder="예: 100000"
            value={basic.contractQuantity}
            onChange={(e) => onChange("contractQuantity", e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL_CLASS}>비고</label>
          <textarea
            rows={2}
            placeholder="특이사항·주의사항 (선택)"
            value={basic.memo}
            onChange={(e) => onChange("memo", e.target.value)}
            className={`${INPUT_CLASS} resize-none`}
          />
        </div>
      </div>
    </div>
  );
}
