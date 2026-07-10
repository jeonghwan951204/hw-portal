import { formatDate, formatQuantity } from "../constants";
import StatusBadge from "./StatusBadge";

// 계약 상세 헤더 — 탭 위 고정 영역 (통화·단위 문구는 표시 생략)
export default function ContractDetailHeader({ contract, onEdit, onDelete, onBack }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 mt-0.5 w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-slate-800">{contract.name}</h1>
              <StatusBadge status={contract.status} />
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {contract.contractNo && (
                <>
                  {contract.contractNo}
                  <span className="mx-2 text-slate-300">·</span>
                </>
              )}
              {contract.company}
              <span className="mx-2 text-slate-300">·</span>
              {formatDate(contract.startDate)} – {formatDate(contract.endDate)}
              {contract.quantity != null && contract.quantity !== "" && (
                <>
                  <span className="mx-2 text-slate-300">·</span>
                  {formatQuantity(contract)}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            수정
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="px-4 py-2 text-sm font-semibold text-red-500 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-all"
          >
            삭제
          </button>
        </div>
      </div>

      {/* 비고 — 강조 없이 확인·공유용 조용한 영역 */}
      {contract.memo && (
        <p className="mt-3 pt-3 border-t border-slate-100 text-sm text-slate-500 whitespace-pre-wrap">
          <span className="text-xs font-bold text-slate-400 mr-2">비고</span>
          {contract.memo}
        </p>
      )}
    </div>
  );
}
