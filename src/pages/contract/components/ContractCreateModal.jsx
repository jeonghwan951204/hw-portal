import {
  CONTRACT_COMPANIES,
  CONTRACT_STATUSES,
  CONTRACT_TYPES,
} from "../constants";
import { useContractForm } from "../hooks/useContractForm";

const FIELD_CLASS =
  "w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-white";
const LABEL_CLASS =
  "text-[11px] font-bold text-slate-400 uppercase tracking-wide ml-1";

export default function ContractCreateModal({ onClose }) {
  const { form, periodLimits, handleFieldChange, handlePeriodChange } =
    useContractForm();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full inline-block" />
            계약 작성
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100"
            aria-label="계약 작성 모달 닫기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form className="flex-1 overflow-y-auto" onSubmit={(e) => e.preventDefault()}>
          <div className="px-6 py-6 space-y-5">
            {/* 기본 정보 */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                기본 정보
              </span>
              <span className="flex-1 border-t border-slate-100" />
            </div>

            {/* 계약명 */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="contract-name" className={LABEL_CLASS}>
                계약명
              </label>
              <input
                id="contract-name"
                type="text"
                value={form.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                placeholder="예: 2026년 상반기 구리 공급 계약"
                className={FIELD_CLASS}
              />
            </div>

            {/* 계약회사 / 계약타입 / 진행상태 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="contract-company" className={LABEL_CLASS}>
                  계약회사
                </label>
                <select
                  id="contract-company"
                  value={form.company}
                  onChange={(e) => handleFieldChange("company", e.target.value)}
                  className={FIELD_CLASS}
                >
                  <option value="">선택</option>
                  {CONTRACT_COMPANIES.map((company) => (
                    <option key={company} value={company}>
                      {company}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="contract-type" className={LABEL_CLASS}>
                  계약타입
                </label>
                <select
                  id="contract-type"
                  value={form.type}
                  onChange={(e) => handleFieldChange("type", e.target.value)}
                  className={FIELD_CLASS}
                >
                  <option value="">선택</option>
                  {CONTRACT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="contract-status" className={LABEL_CLASS}>
                  진행상태
                </label>
                <select
                  id="contract-status"
                  value={form.status}
                  onChange={(e) => handleFieldChange("status", e.target.value)}
                  className={FIELD_CLASS}
                >
                  <option value="">선택</option>
                  {CONTRACT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 계약기간 */}
            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLASS}>계약기간</label>
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={form.startDate}
                  max={periodLimits.startMax}
                  onChange={(e) => handlePeriodChange("startDate", e.target.value)}
                  className={FIELD_CLASS}
                  aria-label="계약 시작일"
                />
                <span className="text-slate-400 text-lg font-light shrink-0">~</span>
                <input
                  type="date"
                  value={form.endDate}
                  min={periodLimits.endMin}
                  onChange={(e) => handlePeriodChange("endDate", e.target.value)}
                  className={FIELD_CLASS}
                  aria-label="계약 종료일"
                />
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:text-slate-700 transition-all"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 hover:border-blue-700 transition-all shadow-sm shadow-blue-200"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
