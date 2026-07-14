import { formatNumber, formatShortPeriod, krwUnitLabel } from "../constants";
import StatusBadge from "./StatusBadge";

// 목록 카드 — 서버 목록 응답 기준(대표 품목의 대표 단가 1건, 원화 환산가)
export default function ContractCard({ contract, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md hover:border-slate-300 transition-all"
    >
      {/* 카드 헤더 */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            {contract.ownerLabel && (
              <span className="shrink-0 text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">
                {contract.ownerLabel}
              </span>
            )}
            <h3 className="font-bold text-slate-800 leading-snug truncate">
              {contract.name}
            </h3>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-0.5 truncate">
            {contract.company || "-"}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {contract.contractNo && (
              <>
                {contract.contractNo}
                <span className="mx-1.5 text-slate-300">·</span>
              </>
            )}
            {formatShortPeriod(contract.startDate, contract.endDate)}
          </p>
        </div>
        <StatusBadge status={contract.statusLabel} />
      </div>

      {/* 단가 영역 — 대표 단가 1건 (원화 환산가) */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-2.5">
          {contract.priceTypeLabel && (
            <span className="shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-md border bg-slate-50 text-slate-600 border-slate-200">
              {contract.priceTypeLabel}
            </span>
          )}
          <span className="flex-1 border-b border-dotted border-slate-200" />
          {contract.finalUnitPrice != null ? (
            <span className="shrink-0 text-base font-bold font-mono text-slate-700">
              {formatNumber(contract.finalUnitPrice)}
              <span className="text-[11px] font-normal text-slate-400 ml-1">
                {krwUnitLabel(contract.priceUnit)}
              </span>
            </span>
          ) : (
            <span className="shrink-0 text-sm font-semibold text-slate-300">미정</span>
          )}
        </div>
      </div>
    </button>
  );
}
