import ContractCard from "./ContractCard";

export default function ContractGrid({
  contracts,
  totalCount,
  loading,
  onCardClick,
  onCreate,
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <h2 className="font-bold text-slate-700">계약 목록</h2>
        <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
          {totalCount}건
        </span>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mb-3 animate-spin opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <p className="font-medium text-sm">로딩중...</p>
        </div>
      ) : contracts.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="font-medium">등록된 계약이 없습니다.</p>
          <button
            type="button"
            onClick={onCreate}
            className="mt-4 px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all active:scale-95"
          >
            계약 등록
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {contracts.map((contract) => (
            <ContractCard
              key={contract.id}
              contract={contract}
              onClick={() => onCardClick(contract.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
