import { useCallback, useEffect, useState } from "react";
import { getDateRangeLimits, normalizeDateRangeChange } from "../../../utils/validate";
import { fetchExchangeRates } from "../api/priceApi";
import { RATE_FIELDS, RATE_PAGE_SIZE } from "../constants";

export const useExchangeRates = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [rates, setRates] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadRates = useCallback(async (nextPage = 1) => {
    setLoading(true);
    setErrorMessage("");

    try {
      const data = await fetchExchangeRates({
        page: nextPage,
        size: RATE_PAGE_SIZE,
        startDate,
        endDate,
      });

      setRates(data[RATE_FIELDS.content] ?? []);
      setTotalPages(data[RATE_FIELDS.totalPages] ?? 0);
      setTotalElements(data[RATE_FIELDS.totalElements] ?? 0);
      setPage(nextPage);
    } catch (err) {
      console.error("환율 조회 실패:", err);
      setRates([]);
      setTotalPages(0);
      setTotalElements(0);
      setErrorMessage("환율 데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [endDate, startDate]);

  useEffect(() => {
    loadRates(1);
  }, [loadRates]);

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
  };

  const handleDateRangeChange = (field, value) => {
    const nextRange = normalizeDateRangeChange({ startDate, endDate, field, value });
    setStartDate(nextRange.startDate);
    setEndDate(nextRange.endDate);
    setPage(1);
  };

  return {
    startDate,
    endDate,
    page,
    rates,
    totalPages,
    totalElements,
    loading,
    errorMessage,
    dateLimits: getDateRangeLimits(startDate, endDate),
    loadRates,
    handleReset,
    handleDateRangeChange,
  };
};
