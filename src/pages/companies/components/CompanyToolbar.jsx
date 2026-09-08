import { COMPANY_TYPE_FILTERS } from "../constants";

export default function CompanyToolbar({ keyword, typeFilter, onKeywordChange, onTypeFilterChange }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-sm">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder="거래처명 또는 별칭 검색"
          aria-label="거래처명 또는 별칭 검색"
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <div className="inline-flex self-start rounded-lg border border-slate-200 bg-slate-50 p-1 sm:self-auto">
        {COMPANY_TYPE_FILTERS.map((option) => (
          <button
            key={option.value || "ALL"}
            type="button"
            onClick={() => onTypeFilterChange(option.value)}
            className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
              typeFilter === option.value
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
