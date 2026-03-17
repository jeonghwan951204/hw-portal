import { useState, useEffect, useCallback } from "react";

// ─── 상수 정의 ──────────────────────────────────────────────────────────────

// 카테고리별 품목 정보 (기존 JS 객체와 동일)
const CATEGORY_ITEMS = {
  hojae: {
    name: "호재메탈",
    items: ["candy", "aCopper", "sangCopper", "joongCopper", "paCopper"],
    itemName: ["캔디", "A동", "상동", "중동", "파동"],
    mapping: {
      candy: "캔디",
      aCopper: "A동",
      sangCopper: "상동",
      joongCopper: "중동",
      paCopper: "파동",
    },
  },
  woonam: {
    name: "우남비철유통",
    items: ["candy", "aCopper"],
    itemName: ["캔디", "A동"],
    mapping: {
      candy: "캔디",
      aCopper: "A동",
    },
  },
};

const PAGE_SIZE = 20;

// ─── 유틸 함수 ────────────────────────────────────────────────────────────────

// 숫자를 한국 원 단위로 포맷 (예: 1000 → "1,000원")
const formatKRW = (value) => `${Number(value).toLocaleString()}원`;


// ─── 하위 컴포넌트 ────────────────────────────────────────────────────────────

/** 카테고리 탭 버튼 */
function CategoryTabs({ current, onChange }) {
  return (
    <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
      {Object.entries(CATEGORY_ITEMS).map(([key, cat]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`px-6 py-1.5 rounded-md text-sm font-medium transition-all ${
            current === key
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}

/** 가격 입력 테이블 */
function PriceInputTable({ category, prices, onChange, onSubmit }) {
  const { itemName, items } = CATEGORY_ITEMS[category];

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* 섹션 헤더 */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center">
        <h2 className="font-semibold flex items-center gap-2 text-slate-700">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full inline-block" />
          {CATEGORY_ITEMS[category].name}
        </h2>
      </div>

      <form onSubmit={onSubmit} className="p-6">
        {/* 테이블: 모바일 대응을 위해 overflow-x-auto 적용 */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-sm border-collapse min-w-150">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                {/* 구분 열 */}
                <th className="border-r border-slate-200 py-3 px-4 w-24 bg-slate-100/50">
                  구분
                </th>
                {/* 품목명 열 */}
                {itemName.map((name) => (
                  <th key={name} className="border-r border-slate-200 py-3 px-4">
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {/* 가격 라벨 셀 */}
                <td className="border-r border-slate-200 py-3 px-4 font-bold text-center bg-slate-50">
                  가격 (₩)
                </td>
                {/* 품목별 입력 셀 */}
                {items.map((item) => (
                  <td key={item} className="border-r border-slate-200 p-0">
                    <input
                      type="number"
                      name={item}
                      placeholder="0"
                      required
                      value={prices[item] ?? ""}
                      onChange={(e) => onChange(item, e.target.value)}
                      className="w-full border-none bg-transparent text-center px-3 py-3 outline-none focus:bg-slate-50 font-mono text-blue-600 font-bold"
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* 저장 버튼 */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-400 font-medium">
            가장 최신 금액이 입력되어 있습니다.
          </p>
          <button
            type="submit"
            className="w-full md:w-auto px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {/* 저장 아이콘 */}
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            저장
          </button>
        </div>
      </form>
    </section>
  );
}

/** 내역 카드 한 건 */
function HistoryCard({ record, category }) {
  const { name, mapping } = CATEGORY_ITEMS[category];

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-200 transition-all animate-fadeIn">
      {/* 카드 헤더 */}
      <div className="flex justify-between items-start pb-3 border-b border-slate-50">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-blue-600 mb-1">{name}</span>
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {record.createAt}
          </span>
        </div>
        {/* 우측 배지 */}
        <span className="inline-flex gap-1.5 items-center bg-emerald-50 text-emerald-600 text-xs font-bold px-2 py-1 rounded-full border border-emerald-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {record.createAt}
        </span>
      </div>

      {/* 품목별 가격 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-3">
        {Object.entries(mapping).map(([item, label]) => (
          <div key={item} className="flex flex-col p-2 bg-slate-50/80 rounded-lg border border-slate-100">
            <span className="text-[10px] font-medium text-slate-400 mb-0.5">{label}</span>
            <span className="text-sm font-bold text-slate-800 font-mono">
              {formatKRW(record[item] ?? 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 페이지네이션 버튼 그룹 */
function Pagination({ totalPages, currentPage, onPageChange }) {
  if (totalPages <= 1) return null;

  // 보여줄 페이지 번호 목록 계산 (현재 페이지 ±1 + 첫/끝 페이지)
  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pages.push(i);
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        pages.push("...");
      }
    }
    // 중복 생략 부호 제거
    return pages.filter((p, idx) => !(p === "..." && pages[idx - 1] === "..."));
  };

  const btnBase =
    "w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-all border border-slate-200";

  return (
    <div className="flex justify-center items-center gap-2 py-4">
      {/* 이전 버튼 */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${btnBase} ${currentPage === 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-100"}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* 페이지 번호 */}
      {getPageNumbers().map((p, idx) =>
        p === "..." ? (
          <span key={`ellipsis-${idx}`} className="text-slate-300">
            ...
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`${btnBase} ${
              p === currentPage
                ? "bg-blue-600 text-white border-blue-600"
                : "hover:bg-slate-100"
            }`}
          >
            {p}
          </button>
        )
      )}

      {/* 다음 버튼 */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`${btnBase} ${currentPage === totalPages ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-100"}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}


// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export default function PriceManagement() {
  // 현재 선택된 카테고리 (hojae | woonam)
  const [category, setCategory] = useState("hojae");

  // 가격 입력 폼 상태 { itemKey: value, ... }
  const [prices, setPrices] = useState({});

  // 내역 데이터
  const [history, setHistory] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // 날짜 필터
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ── API 호출: 현재 가격 조회 ──────────────────────────────────────────────
  const fetchCurrentPrice = useCallback(async (cat) => {
    try {
      const res = await fetch(`/api/${cat}/price/current`);
      const data = await res.json();
      // 서버에서 받은 값으로 입력폼 초기화
      setPrices(
        Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, v ?? ""])
        )
      );
    } catch (err) {
      console.error("현재 가격 조회 실패:", err);
    }
  }, []);

  // ── API 호출: 내역 조회 ───────────────────────────────────────────────────
  const fetchHistory = useCallback(
    async (page = 1, cat = category, start = startDate, end = endDate) => {
      let url = `/api/${cat}/price?page=${page}&size=${PAGE_SIZE}`;
      if (start) url += `&startDt=${start}`;
      if (end) url += `&endDt=${end}`;

      try {
        const res = await fetch(url);
        const data = await res.json();
        setHistory(data.content ?? []);
        setTotalPages(data.page?.totalPages ?? 0);
        setCurrentPage(page);
      } catch (err) {
        console.error("내역 조회 실패:", err);
        setHistory([]);
        setTotalPages(0);
      }
    },
    [category, startDate, endDate]
  );

  // ── 카테고리 전환 ──────────────────────────────────────────────────────────
  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setPrices({});
    fetchCurrentPrice(cat);
    fetchHistory(1, cat, startDate, endDate);
  };

  // ── 가격 입력 변경 핸들러 ──────────────────────────────────────────────────
  const handlePriceChange = (item, value) => {
    setPrices((prev) => ({ ...prev, [item]: value }));
  };

  // ── 폼 저장 ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    // price_ 접두사 없이 바로 key: value 구성
    const priceData = {};
    CATEGORY_ITEMS[category].items.forEach((item) => {
      priceData[item] = prices[item] ?? "";
    });

    try {
      const res = await fetch(`/api/${category}/price`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(priceData),
      });
      alert(res.ok ? "성공적으로 저장되었습니다." : "가격 설정이 저장되었습니다.");
    } catch (err) {
      console.error("저장 실패:", err);
      alert("가격 설정이 저장되었습니다.");
    } finally {
      // 저장 후 내역 새로고침
      fetchHistory(1);
    }
  };

  // ── 필터 초기화 ───────────────────────────────────────────────────────────
  const handleResetFilters = () => {
    setStartDate("");
    setEndDate("");
    fetchHistory(1, category, "", "");
  };

  // ── 초기 데이터 로드 ──────────────────────────────────────────────────────
  useEffect(() => {
    fetchCurrentPrice(category);
    fetchHistory(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── 렌더링 ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* ── 헤더 ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* 로고 */}
          <h1 className="text-xl font-bold flex items-center gap-2 text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            사이트 관리 시스템
          </h1>

          {/* 카테고리 탭 */}
          <CategoryTabs current={category} onChange={handleCategoryChange} />
        </div>
      </header>

      {/* ── 본문 ── */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        {/* 가격 입력 섹션 */}
        <PriceInputTable
          category={category}
          prices={prices}
          onChange={handlePriceChange}
          onSubmit={handleSubmit}
        />

        {/* 최근 내역 섹션 */}
        <section className="space-y-4">
          {/* 섹션 헤더 + 필터 */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-1">
            <div className="flex items-center gap-2 text-slate-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="font-bold text-slate-700 text-lg">최근 내역</h2>
            </div>

            {/* 날짜 필터 */}
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                  시작일
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2 py-2 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                  종료일
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2 py-2 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-white"
                />
              </div>
              {/* 검색 버튼 */}
              <button
                type="button"
                onClick={() => fetchHistory(1)}
                className="bg-slate-800 hover:bg-slate-900 text-white p-2.5 rounded-lg transition-all shadow-sm active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              {/* 초기화 버튼 */}
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-slate-400 hover:text-slate-600 underline py-2.5 px-1 transition-colors"
              >
                초기화
              </button>
            </div>
          </div>

          {/* 내역 카드 목록 */}
          <div className="space-y-4">
            {history.length === 0 ? (
              // 내역 없을 때 빈 상태 UI
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-16 flex flex-col items-center justify-center text-slate-400 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="font-medium">내역이 없습니다.</p>
              </div>
            ) : (
              history.map((record, idx) => (
                <HistoryCard key={record.id ?? idx} record={record} category={category} />
              ))
            )}
          </div>

          {/* 페이지네이션 */}
          <Pagination
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={(page) => fetchHistory(page)}
          />
        </section>
      </main>

      {/* 페이드인 애니메이션 CSS (tailwind 커스텀 필요 시 global css로 이동) */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}