import { useState } from "react";
import Header from "../components/Header";
import { formatUSD, formatRate } from "../utils/format";

// ─── 임시 데이터 ──────────────────────────────────────────────────────────────
const MOCK_CONTRACTS = [
  {
    id: 1,
    name: "2026년 상반기 구리 공급 계약",
    customer: "한국전선(주)",
    provisionalPeriod: { start: "2026-01-01", end: "2026-03-31" },
    finalPeriod:       { start: "2026-04-01", end: "2026-06-30" },
    provisionalPrice:  9123.50,
    finalPrice:        9267.00,
    currency:          "USD",
    status:            "확정",
  },
  {
    id: 2,
    name: "2026년 2분기 동판 구매 계약",
    customer: "삼성전기(주)",
    provisionalPeriod: { start: "2026-04-01", end: "2026-05-15" },
    finalPeriod:       { start: "2026-05-16", end: "2026-06-30" },
    provisionalPrice:  9445.00,
    finalPrice:        null,
    currency:          "USD",
    status:            "진행중",
  },
  {
    id: 3,
    name: "2026년 연간 구리 원자재 공급",
    customer: "LS전선(주)",
    provisionalPeriod: { start: "2026-01-01", end: "2026-06-30" },
    finalPeriod:       { start: "2026-07-01", end: "2026-12-31" },
    provisionalPrice:  8989.50,
    finalPrice:        null,
    currency:          "USD",
    status:            "진행중",
  },
];

// ─── 상수 ─────────────────────────────────────────────────────────────────────
const STATUS_STYLE = {
  확정:   "bg-emerald-100 text-emerald-700 border-emerald-200",
  진행중: "bg-blue-100 text-blue-700 border-blue-200",
  종료:   "bg-slate-100 text-slate-500 border-slate-200",
};

// ─── 유틸 ─────────────────────────────────────────────────────────────────────
const formatPeriod = (start, end) =>
  `${start.replace(/-/g, ".")} ~ ${end.replace(/-/g, ".")}`;

// ─── 계약 카드 ────────────────────────────────────────────────────────────────
function ContractCard({ contract }) {
  const {
    name, customer, status,
    provisionalPeriod, finalPeriod,
    provisionalPrice, finalPrice,
  } = contract;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* 카드 헤더 */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-400 font-medium mb-1">{customer}</p>
          <h3 className="font-semibold text-slate-800 leading-snug">{name}</h3>
        </div>
        <span
          className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLE[status] ?? STATUS_STYLE["종료"]}`}
        >
          {status}
        </span>
      </div>

      {/* 카드 본문 */}
      <div className="px-6 py-5 space-y-4">
        {/* 기간 */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap w-20 shrink-0">
              가단가 기간
            </span>
            <span className="text-sm text-slate-600 font-medium whitespace-nowrap">
              {formatPeriod(provisionalPeriod.start, provisionalPeriod.end)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap w-20 shrink-0">
              확정가 기간
            </span>
            <span className="text-sm text-slate-600 font-medium whitespace-nowrap">
              {formatPeriod(finalPeriod.start, finalPeriod.end)}
            </span>
          </div>
        </div>

        {/* 구분선 */}
        <div className="border-t border-slate-100" />

        {/* 단가 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
              가단가
            </p>
            <p className="text-xl font-bold font-mono text-slate-700">
              {formatUSD(provisionalPrice)}
              <span className="text-xs font-normal text-slate-400 ml-1">$/t</span>
            </p>
          </div>
          <div
            className={`rounded-xl px-4 py-3 border transition-colors ${
              finalPrice
                ? "bg-emerald-50 border-emerald-100"
                : "bg-slate-50 border-slate-100"
            }`}
          >
            <p
              className={`text-[10px] font-bold uppercase tracking-wide mb-1.5 ${
                finalPrice ? "text-emerald-500" : "text-slate-400"
              }`}
            >
              확정가
            </p>
            {finalPrice ? (
              <p className="text-xl font-bold font-mono text-emerald-700">
                {formatUSD(finalPrice)}
                <span className="text-xs font-normal text-emerald-400 ml-1">$/t</span>
              </p>
            ) : (
              <p className="text-xl font-bold font-mono text-slate-300">미확정</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────
export default function ContractPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체");

  const filtered = MOCK_CONTRACTS.filter((c) => {
    const matchSearch =
      c.name.includes(search) || c.customer.includes(search);
    const matchStatus =
      statusFilter === "전체" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* 페이지 타이틀 */}
        <div className="flex items-center gap-2 px-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h1 className="font-bold text-slate-700 text-lg">계약별 조회</h1>
          <span className="ml-1 text-xs text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
            {filtered.length}건
          </span>
        </div>

        {/* 필터 바 */}
        <div className="flex flex-wrap items-center gap-3">
          {/* 검색 */}
          <div className="relative flex-1 min-w-52">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="계약명 또는 고객사 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-white"
            />
          </div>

          {/* 상태 필터 */}
          <div className="flex items-center gap-1.5">
            {["전체", "진행중", "확정", "종료"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
                  statusFilter === s
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* 카드 그리드 */}
        {filtered.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="font-medium">조건에 맞는 계약이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((contract) => (
              <ContractCard key={contract.id} contract={contract} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
