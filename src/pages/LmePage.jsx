import { useState, useCallback, useEffect } from "react";
import Header from "../components/Header";
import Pagination from "../components/Pagination";
import { formatUSD, formatRate, formatKRW } from "../utils/format";
import { apiFetch } from "../utils/api";

// ─── 상수 정의 ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

// ─── API 필드명 매핑 ──────────────────────────────────────────────────────────
// 백엔드 응답 필드명이 바뀌면 여기만 수정

/** 목록 조회 응답 (GET /api/lme/price) */
const LIST_FIELDS = {
  content: "content",          // 목록 배열 키
  totalPages: "totalPages",    // 페이지 정보 경로: data.page.totalPages
  id: "id",                    // 레코드 고유 ID
  baseDate: "date",                // 날짜 (yyyy.mm.dd)
  closePrice: "closePrice",    // LME 구리 종가 ($/t)
  priceChange: "priceChange",  // 전일 대비 등락폭 (양수=상승, 음수=하락, null=첫날)
  exchangeRate: "exchangeRate",// 환율 (₩/$)
};

/** 평균 조회 응답 (GET /api/lme/price/average) */
const AVG_FIELDS = {
  avgClose: "averageLme",        // LME 구리 평균가 ($/t)
  avgRate:  "averageExchange",         // 기간 평균 환율 (₩/$)
  avgKrw: "averagePrice"
};

const parsePercentRate = (value) => {
  const numericValue = Number(String(value).replace(/[%\s,]/g, ""));
  return Number.isFinite(numericValue) ? numericValue / 100 : 0;
};

/** 환율 조회 응답 (하나은행 API) */
const RATE_FIELDS = {
  baseRate: "baseRate",        // 매매기준율
  buyRate:  "buyRate",         // 살 때 (현찰 매도율)
  sellRate: "sellRate",        // 파실 때 (현찰 매입율)
};


// ─── 환율 모달 ────────────────────────────────────────────────────────────────

function RateModal({ onClose }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const PAGE = 15;

  const filtered = MOCK_RATE_DATA.filter((row) => {
    const d = row.date.replace(/\./g, "-");
    if (startDate && d < startDate) return false;
    if (endDate   && d > endDate)   return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE);
  const sliced = filtered.slice((page - 1) * PAGE, page * PAGE);

  const handleReset = () => { setStartDate(""); setEndDate(""); setPage(1); };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full inline-block" />
            환율 내역 조회
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 필터 */}
        <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap items-end gap-2 bg-white">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">시작일</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all bg-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">종료일</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all bg-white"
            />
          </div>
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-slate-600 underline py-1.5 px-1 transition-colors"
            >
              초기화
            </button>
          )}
          <span className="ml-auto text-xs text-slate-400 py-1.5">{filtered.length}건</span>
        </div>

        {/* 테이블 */}
        <div className="overflow-y-auto flex-1">
          {sliced.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">데이터가 없습니다.</div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="py-2.5 px-6 text-left border-r border-slate-200">날짜</th>
                  <th className="py-2.5 px-6 text-right">환율 (₩/$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sliced.map((row) => (
                  <tr key={row.date} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-6 border-r border-slate-100 text-slate-500 text-xs font-medium tabular-nums">
                      {row.date}
                    </td>
                    <td className="py-2.5 px-6 text-right font-mono text-slate-700 font-semibold">
                      {formatRate(row.exchangeRate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 페이지네이션 */}
        <div className="border-t border-slate-100">
          <Pagination totalPages={totalPages} currentPage={page} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export default function LmePage() {
  // ── 테이블 상태 ───────────────────────────────────────────────────────────
  const [history, setHistory] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [tableStartDate, setTableStartDate] = useState("");
  const [tableEndDate, setTableEndDate] = useState("");

  // ── 평균 계산 상태 ────────────────────────────────────────────────────────
  const [avgStartDate, setAvgStartDate] = useState("");
  const [avgEndDate, setAvgEndDate] = useState("");
  const [avgResult, setAvgResult] = useState(null); // { avgClose, count }
  const [currentRate, setCurrentRate] = useState("");
  const [ratePercent, setRatePercent] = useState("100");


  // ── 환율 모달 상태 ────────────────────────────────────────────────────────
  const [rateModalOpen, setRateModalOpen] = useState(false);

  // ── 내역 조회 ─────────────────────────────────────────────────────────────
  // TODO: 백엔드 연결 시 mock 블록 삭제 후 아래 fetch 블록 주석 해제
  const fetchHistory = useCallback(
    async (page = 1, start = tableStartDate, end = tableEndDate) => {
      // ── fetch (백엔드 연결 시 사용) ───────────────────────────────────────
      let url = `/api/price?page=${page}&size=${PAGE_SIZE}`;
      if (start) url += `&startDate=${start}`;
      if (end) url += `&endDate=${end}`;
      try {
        const res = await apiFetch(url);
        const data = await res.json();
        setHistory(data["content"] ?? []);
        setTotalPages(data.page? data.totalPages : 0);
        setCurrentPage(page);
      } catch (err) {
        console.error("데이터 조회 실패:", err);
        setHistory([]);
        setTotalPages(0);
      }
    },
    [tableStartDate, tableEndDate]
  );

  // ── 기간 평균 조회 ────────────────────────────────────────────────────────
  // TODO: 백엔드 연결 시 mock 블록 삭제 후 아래 fetch 블록 주석 해제
  const fetchAverage = async () => {
    if (!avgStartDate || !avgEndDate) {
      alert("시작일과 종료일을 모두 입력해주세요.");
      return;
    }
    // const avg = filtered.reduce((sum, r) => sum + r[LIST_FIELDS.closePrice], 0) / filtered.length;
    // const avgRate = filtered.reduce((sum, r) => sum + r[LIST_FIELDS.exchangeRate], 0) / filtered.length;
    // setAvgResult({ avgClose: avg, avgRate });
    // setCurrentRate(String(avgRate.toFixed(2)));
    // ── fetch (백엔드 연결 시 사용) ─────────────────────────────────────────
    try {
      const res = await apiFetch(`/api/price/average?startDate=${avgStartDate}&endDate=${avgEndDate}`);
      const data = await res.json();
      setAvgResult({avgClose: data[AVG_FIELDS.avgClose], avgRate: data[AVG_FIELDS.avgRate]});
      setCurrentRate(String(data[AVG_FIELDS.avgRate].toFixed(2)));
    } catch (err) {
      console.error("평균 조회 실패:", err);
    }
  };

  // ── 테이블 필터 초기화 ────────────────────────────────────────────────────
  const handleResetFilters = () => {
    setTableStartDate("");
    setTableEndDate("");
    fetchHistory(1, "", "");
  };

  // ── 초기 데이터 로드 ──────────────────────────────────────────────────────
  useEffect(() => {
    fetchHistory(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rateMultiplier = parsePercentRate(ratePercent);
  const calculatedAvgKrw =
    avgResult && Number(currentRate) && rateMultiplier
      ? Math.floor((Number(avgResult.avgClose) * Number(currentRate) * rateMultiplier) / 1000)
      : "";


  // ─── 렌더링 ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      {rateModalOpen && <RateModal onClose={() => setRateModalOpen(false)} />}

      {/* ── 본문 ── */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-8">

        {/* ── 기간 평균 계산 섹션 ── */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* 섹션 헤더 */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center">
            <h2 className="font-semibold flex items-center gap-2 text-slate-700">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full inline-block" />
              기간 평균 계산
            </h2>
          </div>

          <div className="p-6 space-y-6">
            {/* 날짜 범위 입력 + 평균 버튼 */}
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                  시작일
                </label>
                <input
                  type="date"
                  value={avgStartDate}
                  onChange={(e) => setAvgStartDate(e.target.value)}
                  className="text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-white"
                />
              </div>

              <span className="text-slate-400 pb-2 text-lg font-light">~</span>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                  종료일
                </label>
                <input
                  type="date"
                  value={avgEndDate}
                  onChange={(e) => setAvgEndDate(e.target.value)}
                  className="text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-white"
                />
              </div>

              <button
                type="button"
                onClick={fetchAverage}
                className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 text-sm flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                평균 계산
              </button>
            </div>

            {/* 결과 카드 */}
            {avgResult && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                {/* LME 평균가 */}
                <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                  <p className="text-xs text-blue-500 font-semibold mb-2 uppercase tracking-wide">
                    LME 구리 평균가
                  </p>
                  <p className="text-2xl font-bold text-blue-700 font-mono">
                    {formatUSD(avgResult.avgClose)}
                    <span className="text-sm font-normal text-blue-400 ml-1">/t</span>
                  </p>
                  <p className="text-xs text-blue-400 mt-2">
                    {avgStartDate} ~ {avgEndDate}
                  </p>
                </div>

                {/* 기간 평균 환율 */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <p className="text-xs text-slate-500 font-semibold mb-2 uppercase tracking-wide">
                    기간 평균 환율
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-slate-800 font-mono">
                      {formatRate(currentRate)}
                      <span className="text-sm font-normal text-slate-400 ml-1">₩/$</span>
                    </p>
                  </div>
                </div>

                {/* 원화 환산가 */}
                <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
                  <label className="text-xs text-amber-600 font-semibold mb-2 uppercase tracking-wide block">
                    요율
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={ratePercent}
                      onChange={(e) => setRatePercent(e.target.value.replace(/%/g, ""))}
                      placeholder="100"
                      className="w-full min-w-0 text-2xl font-bold text-amber-700 font-mono bg-white/70 border border-amber-200 rounded-lg pl-3 pr-9 py-1.5 outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg font-bold text-amber-500 pointer-events-none">
                      %
                    </span>
                  </div>
                  <p className="text-xs text-amber-500 mt-2">예: 95, 87.5</p>
                </div>

                <div
                  className={`rounded-xl p-5 border transition-all ${
                    calculatedAvgKrw
                      ? "bg-emerald-50 border-emerald-100"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <p
                    className={`text-xs font-semibold mb-2 uppercase tracking-wide ${
                        calculatedAvgKrw ? "text-emerald-500" : "text-slate-400"
                    }`}
                  >
                    원화 환산가
                  </p>
                  <p
                    className={`text-2xl font-bold font-mono ${
                        calculatedAvgKrw ? "text-emerald-700" : "text-slate-300"
                    }`}
                  >
                    {calculatedAvgKrw ? formatKRW(calculatedAvgKrw) : "—"}
                    {calculatedAvgKrw && <span className="text-sm font-normal text-emerald-400 ml-1">/kg</span>}
                  </p>
                  {calculatedAvgKrw && (
                    <p className="text-xs text-emerald-400 mt-2">
                      {formatUSD(avgResult.avgClose)} × {Number(currentRate).toLocaleString()} × {ratePercent}%
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── 가격 내역 테이블 섹션 ── */}
        <section className="space-y-4">
          {/* 섹션 헤더 + 필터 */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-1">
            <div className="flex items-center gap-3 text-slate-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 4v16M14 4v16" />
              </svg>
              <h2 className="font-bold text-slate-700 text-lg">LME 구리 가격 내역</h2>
              <button
                type="button"
                onClick={() => setRateModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-all active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                환율 내역
              </button>
            </div>

            {/* 날짜 필터 */}
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                  시작일
                </label>
                <input
                  type="date"
                  value={tableStartDate}
                  onChange={(e) => setTableStartDate(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2 py-2 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                  종료일
                </label>
                <input
                  type="date"
                  value={tableEndDate}
                  onChange={(e) => setTableEndDate(e.target.value)}
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

          {/* 테이블 카드 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {history.length === 0 ? (
              // 빈 상태 UI
              <div className="py-16 flex flex-col items-center justify-center text-slate-400 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="font-medium">데이터가 없습니다.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-6 text-left border-r border-slate-200 w-40">
                        날짜
                      </th>
                      <th className="py-3 px-6 text-right border-r border-slate-200">
                        LME 구리 종가 ($/t)
                      </th>
                      <th className="py-3 px-6 text-right border-r border-slate-200">
                        변동폭
                      </th>
                      <th className="py-3 px-6 text-right">
                        환율 (₩/$)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {history.map((row, idx) => {
                      const diff   = row["priceChange"];
                      const isUp   = diff !== null && diff > 0;
                      const isDown = diff !== null && diff < 0;

                      return (
                        <tr
                          key={row[LIST_FIELDS.id] ?? idx}
                          className="hover:bg-slate-50/80 transition-colors animate-fadeIn"
                        >
                          {/* 날짜 */}
                          <td className="py-3 px-6 border-r border-slate-100 text-slate-500 text-xs font-medium tabular-nums">
                            {row["baseDate"]}
                          </td>
                          {/* LME 종가 */}
                          <td className="py-3 px-6 border-r border-slate-100 text-right font-mono font-bold text-blue-600">
                            {formatUSD(row["price"])}
                          </td>
                          {/* 변동폭 */}
                          <td className="py-3 px-6 border-r border-slate-100 text-right font-mono">
                            <span className="inline-flex items-center justify-end gap-1">
                              {isUp && (
                                <span className="inline-flex items-center gap-0.5 text-xs font-bold text-red-500">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 4l8 16H4L12 4z" />
                                  </svg>
                                  {diff.toFixed(2)}
                                </span>
                              )}
                              {isDown && (
                                <span className="inline-flex items-center gap-0.5 text-xs font-bold text-blue-500">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 20l-8-16h16L12 20z" />
                                  </svg>
                                  {Math.abs(diff).toFixed(2)}
                                </span>
                              )}
                              {!isUp && !isDown && <span className="text-slate-400">-</span>}
                            </span>
                          </td>
                          {/* 환율 */}
                          <td className="py-3 px-6 text-right font-mono text-slate-700 font-semibold">
                            {formatRate(row["rate"])}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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
