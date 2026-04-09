import { useState, useCallback, useEffect } from "react";
import Header from "../components/Header";

// ─── 상수 정의 ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

// ─── API 필드명 매핑 ──────────────────────────────────────────────────────────
// 백엔드 응답 필드명이 바뀌면 여기만 수정

/** 목록 조회 응답 (GET /api/lme/price) */
const LIST_FIELDS = {
  content: "content",          // 목록 배열 키
  totalPages: "totalPages",    // 페이지 정보 경로: data.page.totalPages
  id: "id",                    // 레코드 고유 ID
  date: "date",                // 날짜 (yyyy.mm.dd)
  closePrice: "closePrice",    // LME 구리 종가 ($/t)
  priceChange: "priceChange",  // 전일 대비 등락폭 (양수=상승, 음수=하락, null=첫날)
  exchangeRate: "exchangeRate",// 환율 (₩/$)
};

/** 평균 조회 응답 (GET /api/lme/price/average) */
const AVG_FIELDS = {
  avgClose: "avgClose",        // LME 구리 평균가 ($/t)
};

/** 환율 조회 응답 (하나은행 API) */
const RATE_FIELDS = {
  baseRate: "baseRate",        // 매매기준율
  buyRate:  "buyRate",         // 살 때 (현찰 매도율)
  sellRate: "sellRate",        // 파실 때 (현찰 매입율)
};

// ─── 임시 데이터 ──────────────────────────────────────────────────────────────
// TODO: 백엔드 연결 시 MOCK_DATA 블록 전체 삭제 후 fetch 로직 주석 해제
//https://www.hanabank.com/cms/rate/wpfxd651_01i_01.do?ajax=true&curCd=USD&tmpInqStrDt=2026-03-18&pbldDvCd=0&pbldSqn=&hid_key_data=&inqStrDt=20260319&inqKindCd=1&hid_enc_data=&requestTarget=searchContentDiv
// 하나은행 환율 api
const MOCK_DATA = [
  { id:  1, date: "2026.02.02", closePrice: 8812.50, priceChange: +28.50, exchangeRate: 1468.20 },
  { id:  2, date: "2026.02.03", closePrice: 8784.00, priceChange:  -28.50, exchangeRate: 1472.50 },
  { id:  3, date: "2026.02.06", closePrice: 8901.00, priceChange: +117.00, exchangeRate: 1465.80 },
  { id:  4, date: "2026.02.07", closePrice: 8856.50, priceChange:  -44.50, exchangeRate: 1470.30 },
  { id:  5, date: "2026.02.08", closePrice: 8923.00, priceChange:  +66.50, exchangeRate: 1462.10 },
  { id:  6, date: "2026.02.09", closePrice: 8745.50, priceChange: -177.50, exchangeRate: 1478.90 },
  { id:  7, date: "2026.02.10", closePrice: 8688.00, priceChange:  -57.50, exchangeRate: 1481.20 },
  { id:  8, date: "2026.02.13", closePrice: 8712.50, priceChange:  +24.50, exchangeRate: 1479.60 },
  { id:  9, date: "2026.02.14", closePrice: 8834.00, priceChange: +121.50, exchangeRate: 1466.40 },
  { id: 10, date: "2026.02.15", closePrice: 8967.50, priceChange: +133.50, exchangeRate: 1455.70 },
  { id: 11, date: "2026.02.16", closePrice: 9012.00, priceChange:  +44.50, exchangeRate: 1451.30 },
  { id: 12, date: "2026.02.17", closePrice: 8989.50, priceChange:  -22.50, exchangeRate: 1453.80 },
  { id: 13, date: "2026.02.20", closePrice: 9045.00, priceChange:  +55.50, exchangeRate: 1448.20 },
  { id: 14, date: "2026.02.21", closePrice: 9123.50, priceChange:  +78.50, exchangeRate: 1442.60 },
  { id: 15, date: "2026.02.22", closePrice: 9078.00, priceChange:  -45.50, exchangeRate: 1446.10 },
  { id: 16, date: "2026.02.23", closePrice: 9201.50, priceChange: +123.50, exchangeRate: 1437.90 },
  { id: 17, date: "2026.02.24", closePrice: 9156.00, priceChange:  -45.50, exchangeRate: 1441.50 },
  { id: 18, date: "2026.02.27", closePrice: 9089.00, priceChange:  -67.00, exchangeRate: 1447.80 },
  { id: 19, date: "2026.02.28", closePrice: 9234.50, priceChange: +145.50, exchangeRate: 1436.20 },
  { id: 23, date: "2026.03.03", closePrice: 9401.50, priceChange:  +56.50, exchangeRate: 1421.30 },
  { id: 24, date: "2026.03.04", closePrice: 9367.00, priceChange:  -34.50, exchangeRate: 1424.80 },
  { id: 25, date: "2026.03.05", closePrice: 9289.50, priceChange:  -77.50, exchangeRate: 1431.60 },
  { id: 26, date: "2026.03.06", closePrice: 9156.00, priceChange: -133.50, exchangeRate: 1441.20 },
  { id: 27, date: "2026.03.07", closePrice: 9223.50, priceChange:  +67.50, exchangeRate: 1435.70 },
  { id: 28, date: "2026.03.10", closePrice: 9445.00, priceChange: +221.50, exchangeRate: 1417.40 },
  { id: 29, date: "2026.03.11", closePrice: 9512.50, priceChange:  +67.50, exchangeRate: 1412.10 },
  { id: 30, date: "2026.03.12", closePrice: 9478.00, priceChange:  -34.50, exchangeRate: 1414.90 },
  { id: 31, date: "2026.03.13", closePrice: 9389.50, priceChange:  -88.50, exchangeRate: 1422.30 },
  { id: 32, date: "2026.03.14", closePrice: 9267.00, priceChange: -122.50, exchangeRate: 1433.60 },
  { id: 33, date: "2026.03.17", closePrice: 9134.50, priceChange: -132.50, exchangeRate: 1444.80 },
  { id: 34, date: "2026.03.18", closePrice: 9056.00, priceChange:  -78.50, exchangeRate: 1451.30 },
];

// ─── 유틸 함수 ────────────────────────────────────────────────────────────────

// 달러 소수점 2자리 포맷
const formatUSD = (value) =>
  `${Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// 환율 (소수점 2자리)
const formatRate = (value) =>
  Number(value).toLocaleString("ko-KR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// 원화 포맷
const formatKRW = (value) => `${Math.round(value).toLocaleString()}원`;

// ─── 하위 컴포넌트 ────────────────────────────────────────────────────────────

/** 페이지네이션 버튼 그룹 */
function Pagination({ totalPages, currentPage, onPageChange }) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pages.push(i);
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        pages.push("...");
      }
    }
    return pages.filter((p, idx) => !(p === "..." && pages[idx - 1] === "..."));
  };

  const btnBase =
    "w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-all border border-slate-200";

  return (
    <div className="flex justify-center items-center gap-2 py-4">
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

      {getPageNumbers().map((p, idx) =>
        p === "..." ? (
          <span key={`ellipsis-${idx}`} className="text-slate-300">...</span>
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

  // ── 현재 환율 상태 ────────────────────────────────────────────────────────
  const [liveRate, setLiveRate] = useState(null);   // { baseRate, buyRate, sellRate, updatedAt }
  const [rateLoading, setRateLoading] = useState(false);

  // ── 내역 조회 ─────────────────────────────────────────────────────────────
  // TODO: 백엔드 연결 시 mock 블록 삭제 후 아래 fetch 블록 주석 해제
  const fetchHistory = useCallback(
    (page = 1, start = tableStartDate, end = tableEndDate) => {
      // ── mock ──────────────────────────────────────────────────────────────
      const filtered = MOCK_DATA.filter((row) => {
        const d = row[LIST_FIELDS.date].replace(/\./g, "-"); // yyyy.mm.dd → yyyy-mm-dd
        if (start && d < start) return false;
        if (end   && d > end)   return false;
        return true;
      });
      const total = Math.ceil(filtered.length / PAGE_SIZE);
      const sliced = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
      setHistory(sliced);
      setTotalPages(total);
      setCurrentPage(page);
      // ── fetch (백엔드 연결 시 사용) ───────────────────────────────────────
      // let url = `/api/lme/price?page=${page}&size=${PAGE_SIZE}`;
      // if (start) url += `&startDt=${start}`;
      // if (end)   url += `&endDt=${end}`;
      // try {
      //   const res  = await fetch(url);
      //   const data = await res.json();
      //   setHistory(data[LIST_FIELDS.content] ?? []);
      //   setTotalPages(data.page?.[LIST_FIELDS.totalPages] ?? 0);
      //   setCurrentPage(page);
      // } catch (err) {
      //   console.error("데이터 조회 실패:", err);
      //   setHistory([]);
      //   setTotalPages(0);
      // }
    },
    [tableStartDate, tableEndDate]
  );

  // ── 기간 평균 조회 ────────────────────────────────────────────────────────
  // TODO: 백엔드 연결 시 mock 블록 삭제 후 아래 fetch 블록 주석 해제
  const fetchAverage = () => {
    if (!avgStartDate || !avgEndDate) {
      alert("시작일과 종료일을 모두 입력해주세요.");
      return;
    }
    // ── mock ────────────────────────────────────────────────────────────────
    const filtered = MOCK_DATA.filter((row) => {
      const d = row[LIST_FIELDS.date].replace(/\./g, "-");
      return d >= avgStartDate && d <= avgEndDate;
    });
    if (filtered.length === 0) {
      alert("해당 기간에 데이터가 없습니다.");
      return;
    }
    const avg = filtered.reduce((sum, r) => sum + r[LIST_FIELDS.closePrice], 0) / filtered.length;
    setAvgResult({ avgClose: avg });
    setCurrentRate("");
    // ── fetch (백엔드 연결 시 사용) ─────────────────────────────────────────
    // try {
    //   const res  = await fetch(`/api/lme/price/average?startDt=${avgStartDate}&endDt=${avgEndDate}`);
    //   const data = await res.json();
    //   setAvgResult({ avgClose: data[AVG_FIELDS.avgClose] });
    //   setCurrentRate("");
    // } catch (err) {
    //   console.error("평균 조회 실패:", err);
    // }
  };

  // ── 현재 환율 조회 ────────────────────────────────────────────────────────
  // TODO: 백엔드 연결 시 mock 블록 삭제 후 아래 fetch 블록 주석 해제
  const fetchLiveRate = useCallback(async () => {
    setRateLoading(true);
    // ── mock ────────────────────────────────────────────────────────────────
    await new Promise((r) => setTimeout(r, 300)); // 로딩 느낌
    setLiveRate({
      [RATE_FIELDS.baseRate]: 1451.30,
      [RATE_FIELDS.buyRate]:  1470.55,
      [RATE_FIELDS.sellRate]: 1432.05,
      updatedAt: new Date().toLocaleTimeString("ko-KR",
          { year: "2-digit",
            month: "2-digit",
            day: "2-digit",
            hour12: false,
            hour: "numeric",
            minute: "2-digit"
          }),
    });
    setRateLoading(false);
    // ── fetch (백엔드 연결 시 사용) ─────────────────────────────────────────
    // try {
    //   const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    //   const res  = await fetch(
    //     `/api/exchange/rate?curCd=USD&inqStrDt=${today}`
    //     // 하나은행: https://www.hanabank.com/cms/rate/wpfxd651_01i_01.do
    //   );
    //   const data = await res.json();
    //   setLiveRate({
    //     [RATE_FIELDS.baseRate]: data[RATE_FIELDS.baseRate],
    //     [RATE_FIELDS.buyRate]:  data[RATE_FIELDS.buyRate],
    //     [RATE_FIELDS.sellRate]: data[RATE_FIELDS.sellRate],
    //     updatedAt: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
    //   });
    // } catch (err) {
    //   console.error("환율 조회 실패:", err);
    // } finally {
    //   setRateLoading(false);
    // }
  }, []);

  // ── 테이블 필터 초기화 ────────────────────────────────────────────────────
  const handleResetFilters = () => {
    setTableStartDate("");
    setTableEndDate("");
    fetchHistory(1, "", "");
  };

  // ── 초기 데이터 로드 ──────────────────────────────────────────────────────
  useEffect(() => {
    fetchHistory(1);
    fetchLiveRate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 원화 환산가 ───────────────────────────────────────────────────────────
  const krwValue =
    avgResult && currentRate
      ? avgResult.avgClose * Number(currentRate)
      : null;

  // ─── 렌더링 ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
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

                {/* 현재 환율 입력 */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <p className="text-xs text-slate-500 font-semibold mb-2 uppercase tracking-wide">
                    평균 환율
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={currentRate}
                      onChange={(e) => setCurrentRate(e.target.value)}
                      placeholder="1300"
                      className="w-full text-xl font-bold font-mono border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-white text-slate-800"
                    />
                    <span className="text-sm text-slate-400 whitespace-nowrap font-medium">₩/$</span>
                  </div>
                </div>

                {/* 원화 환산가 */}
                <div
                  className={`rounded-xl p-5 border transition-all ${
                    krwValue
                      ? "bg-emerald-50 border-emerald-100"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <p
                    className={`text-xs font-semibold mb-2 uppercase tracking-wide ${
                      krwValue ? "text-emerald-500" : "text-slate-400"
                    }`}
                  >
                    원화 환산가
                  </p>
                  <p
                    className={`text-2xl font-bold font-mono ${
                      krwValue ? "text-emerald-700" : "text-slate-300"
                    }`}
                  >
                    {krwValue ? formatKRW(krwValue) : "—"}
                    {krwValue && <span className="text-sm font-normal text-emerald-400 ml-1">/t</span>}
                  </p>
                  {krwValue && (
                    <p className="text-xs text-emerald-400 mt-2">
                      {formatUSD(avgResult.avgClose)} × {Number(currentRate).toLocaleString()}
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
            <div className="flex items-center gap-2 text-slate-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 4v16M14 4v16" />
              </svg>
              <h2 className="font-bold text-slate-700 text-lg">LME 구리 가격 내역</h2>
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
                      <th className="py-3 px-6 text-right">
                        환율 (₩/$)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {history.map((row, idx) => {
                      const diff   = row[LIST_FIELDS.priceChange];
                      const isUp   = diff !== null && diff > 0;
                      const isDown = diff !== null && diff < 0;

                      return (
                        <tr
                          key={row[LIST_FIELDS.id] ?? idx}
                          className="hover:bg-slate-50/80 transition-colors animate-fadeIn"
                        >
                          {/* 날짜 */}
                          <td className="py-3 px-6 border-r border-slate-100 text-slate-500 text-xs font-medium tabular-nums">
                            {row[LIST_FIELDS.date]}
                          </td>
                          {/* LME 종가 + 등락 */}
                          <td className="py-3 px-6 border-r border-slate-100 text-right font-mono font-bold text-blue-600">
                            <span className="inline-flex items-center justify-end gap-2">
                              {formatUSD(row[LIST_FIELDS.closePrice])}
                              {isUp && (
                                <span className="inline-flex items-center gap-0.5 text-xs font-bold text-red-500">
                                  (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 4l8 16H4L12 4z" />
                                  </svg>
                                  {diff.toFixed(2)}
                                  )
                                </span>
                              )}
                              {isDown && (
                                <span className="inline-flex items-center gap-0.5 text-xs font-bold text-blue-500">
                                  (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 20l-8-16h16L12 20z" />
                                  </svg>
                                  {Math.abs(diff).toFixed(2)}
                                  )
                                </span>
                              )}
                            </span>
                          </td>
                          {/* 환율 */}
                          <td className="py-3 px-6 text-right font-mono text-slate-700 font-semibold">
                            {formatRate(row[LIST_FIELDS.exchangeRate])}
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
