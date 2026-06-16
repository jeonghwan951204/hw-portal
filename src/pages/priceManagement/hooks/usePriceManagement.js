import { useCallback, useEffect, useState } from "react";
import { getDateRangeLimits, normalizeDateRangeChange } from "../../../utils/validate";
import {
  fetchCurrentPrice,
  fetchPriceHistory,
  savePrice,
} from "../api/priceManagementApi";
import { CATEGORY_ITEMS, PAGE_SIZE } from "../constants";

export const usePriceManagement = () => {
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

  // ── 현재 가격 조회 ─────────────────────────────────────────────────────────
  const loadCurrentPrice = useCallback(async (cat) => {
    try {
      const data = await fetchCurrentPrice(cat);
      // 해당 카테고리 품목만 최근 값으로 입력폼 초기화 (day 등 부가 필드 제외)
      setPrices(
        Object.fromEntries(
          CATEGORY_ITEMS[cat].items.map((item) => [item, data?.[item] ?? ""])
        )
      );
    } catch (err) {
      console.error("현재 가격 조회 실패:", err);
    }
  }, []);

  // ── 내역 조회 ─────────────────────────────────────────────────────────────
  const fetchHistory = useCallback(
    async (page = 1, cat = category, start = startDate, end = endDate) => {
      try {
        const data = await fetchPriceHistory({
          category: cat,
          page,
          size: PAGE_SIZE,
          startDate: start,
          endDate: end,
        });
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
    loadCurrentPrice(cat);
    fetchHistory(1, cat, startDate, endDate);
  };

  // ── 가격 입력 변경 ─────────────────────────────────────────────────────────
  const handlePriceChange = (item, value) => {
    setPrices((prev) => ({ ...prev, [item]: value }));
  };

  // ── 폼 저장 ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    // API 는 정수(Long) 가격을 기대하므로 숫자로 변환해 전송
    const priceData = {};
    CATEGORY_ITEMS[category].items.forEach((item) => {
      priceData[item] = Number(prices[item] ?? 0);
    });

    try {
      await savePrice(category, priceData);
      alert("성공적으로 저장되었습니다.");
      fetchHistory(1);
    } catch (err) {
      console.error("저장 실패:", err);
      alert("저장에 실패했습니다.");
    }
  };

  // ── 날짜 필터 변경 (공통 validate 유틸 사용) ───────────────────────────────
  const handleDateRangeChange = (field, value) => {
    const nextRange = normalizeDateRangeChange({
      startDate,
      endDate,
      field,
      value,
    });
    setStartDate(nextRange.startDate);
    setEndDate(nextRange.endDate);
  };

  // ── 필터 초기화 ───────────────────────────────────────────────────────────
  const handleResetFilters = () => {
    setStartDate("");
    setEndDate("");
    fetchHistory(1, category, "", "");
  };

  // ── 초기 데이터 로드 ──────────────────────────────────────────────────────
  useEffect(() => {
    loadCurrentPrice(category);
    fetchHistory(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    category,
    handleCategoryChange,
    input: {
      category,
      prices,
      onChange: handlePriceChange,
      onSubmit: handleSubmit,
    },
    history: {
      category,
      history,
      totalPages,
      currentPage,
      startDate,
      endDate,
      dateLimits: getDateRangeLimits(startDate, endDate),
      fetchHistory,
      handleResetFilters,
      handleDateRangeChange,
    },
  };
};
