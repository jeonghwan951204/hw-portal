import { useCallback, useEffect, useState } from "react";
import { getDateRangeLimits, normalizeDateRangeChange } from "../../../utils/validate";
import { fetchLmeAverage, fetchLmePriceHistory, requestCrawlingSync } from "../api/priceApi";
import { AVG_FIELDS, LIST_FIELDS, PAGE_SIZE, parsePercentRate } from "../constants";

const calculateKrwPrice = (avgClose, exchangeRate, percent) => {
  const close = Number(avgClose);
  const rate = Number(exchangeRate);
  const multiplier = parsePercentRate(percent);
  if (!Number.isFinite(close) || !Number.isFinite(rate) || !multiplier) return "";
  return Math.floor((close * rate * multiplier) / 1000);
};

const calculateRatePercent = (avgClose, exchangeRate, krwPrice) => {
  const close = Number(avgClose);
  const rate = Number(exchangeRate);
  const price = Number(krwPrice);
  if (!Number.isFinite(close) || !Number.isFinite(rate) || !Number.isFinite(price) || !close || !rate)
    return "";
  return ((price * 1000 * 100) / (close * rate))
    .toFixed(6)
    .replace(/\.?0+$/, "");
};

export const useLmePage = () => {
  const [history, setHistory] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [tableStartDate, setTableStartDate] = useState("");
  const [tableEndDate, setTableEndDate] = useState("");
  const [syncing, setSyncing] = useState(false);

  const [avgStartDate, setAvgStartDate] = useState("");
  const [avgEndDate, setAvgEndDate] = useState("");
  const [avgResult, setAvgResult] = useState(null);
  const [currentRate, setCurrentRate] = useState("");
  const [ratePercent, setRatePercent] = useState("100");
  const [calculatedAvgKrw, setCalculatedAvgKrw] = useState("");

  const [rateModalOpen, setRateModalOpen] = useState(false);

  const fetchHistory = useCallback(
    async (page = 1, start = tableStartDate, end = tableEndDate) => {
      try {
        const data = await fetchLmePriceHistory({
          page,
          size: PAGE_SIZE,
          startDate: start,
          endDate: end,
        });

        setHistory(data[LIST_FIELDS.content] ?? []);
        setTotalPages(data[LIST_FIELDS.totalPages] ?? data.page?.totalPages ?? 0);
        setCurrentPage(page);
      } catch (err) {
        console.error("데이터 조회 실패:", err);
        setHistory([]);
        setTotalPages(0);
      }
    },
    [tableEndDate, tableStartDate]
  );

  const fetchAverage = async () => {
    if (!avgStartDate || !avgEndDate) {
      alert("시작일과 종료일을 모두 입력해주세요.");
      return;
    }

    try {
      const data = await fetchLmeAverage({
        startDate: avgStartDate,
        endDate: avgEndDate,
      });

      const nextResult = {
        avgClose: data[AVG_FIELDS.avgClose],
        avgRate: data[AVG_FIELDS.avgRate],
      };
      const nextRate = String(data[AVG_FIELDS.avgRate].toFixed(2));
      setAvgResult(nextResult);
      setCurrentRate(nextRate);
      setCalculatedAvgKrw(calculateKrwPrice(nextResult.avgClose, nextRate, ratePercent));
    } catch (err) {
      console.error("평균 조회 실패:", err);
    }
  };

  const handleResetFilters = () => {
    setTableStartDate("");
    setTableEndDate("");
    fetchHistory(1, "", "");
  };

  const handleSyncCrawling = async () => {
    if (syncing) return;

    try {
      setSyncing(true);
      await requestCrawlingSync();
      await fetchHistory(currentPage);
    } catch (err) {
      console.error("동기화 실패:", err);
      alert("동기화에 실패했습니다.");
    } finally {
      setSyncing(false);
    }
  };

  const handleAvgDateRangeChange = (field, value) => {
    const nextRange = normalizeDateRangeChange({
      startDate: avgStartDate,
      endDate: avgEndDate,
      field,
      value,
    });
    setAvgStartDate(nextRange.startDate);
    setAvgEndDate(nextRange.endDate);
  };

  const handleTableDateRangeChange = (field, value) => {
    const nextRange = normalizeDateRangeChange({
      startDate: tableStartDate,
      endDate: tableEndDate,
      field,
      value,
    });
    setTableStartDate(nextRange.startDate);
    setTableEndDate(nextRange.endDate);
  };

  const handleCurrentRateChange = (value) => {
    setCurrentRate(value);
    setCalculatedAvgKrw(calculateKrwPrice(avgResult?.avgClose, value, ratePercent));
  };

  const handleRatePercentChange = (value) => {
    setRatePercent(value);
    setCalculatedAvgKrw(calculateKrwPrice(avgResult?.avgClose, currentRate, value));
  };

  const handleCalculatedAvgKrwChange = (value) => {
    setCalculatedAvgKrw(value);
    setRatePercent(calculateRatePercent(avgResult?.avgClose, currentRate, value));
  };

  useEffect(() => {
    fetchHistory(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    average: {
      avgStartDate,
      avgEndDate,
      avgResult,
      currentRate,
      ratePercent,
      calculatedAvgKrw,
      avgDateLimits: getDateRangeLimits(avgStartDate, avgEndDate),
      handleCurrentRateChange,
      handleRatePercentChange,
      handleCalculatedAvgKrwChange,
      fetchAverage,
      handleAvgDateRangeChange,
    },
    history: {
      history,
      totalPages,
      currentPage,
      tableStartDate,
      tableEndDate,
      tableDateLimits: getDateRangeLimits(tableStartDate, tableEndDate),
      syncing,
      fetchHistory,
      handleSyncCrawling,
      handleResetFilters,
      handleTableDateRangeChange,
    },
    rateModal: {
      rateModalOpen,
      setRateModalOpen,
    },
  };
};
