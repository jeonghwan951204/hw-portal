import { useCallback, useEffect, useMemo, useState } from "react";
import { getDateRangeLimits, normalizeDateRangeChange } from "../../../utils/validate";
import { fetchWeighings } from "../api/weighingApi";

export function useWeighingList() {
  const [sourceWeighings, setSourceWeighings] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [paidIds, setPaidIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadWeighings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setSourceWeighings(await fetchWeighings());
    } catch (loadError) {
      setError(loadError.message || "계근 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWeighings();
  }, [loadWeighings]);

  const weighings = useMemo(() => {
    const normalizedCompany = companyName.trim().toLocaleLowerCase("ko-KR");
    const normalizedVehicle = vehicleNumber.replaceAll(" ", "").toLocaleLowerCase("ko-KR");

    return sourceWeighings.filter((weighing) => {
      const matchesPeriod =
        (!startDate || weighing.weighedAt >= startDate) &&
        (!endDate || weighing.weighedAt <= endDate);
      const matchesCompany =
        !normalizedCompany ||
        weighing.companyName.toLocaleLowerCase("ko-KR").includes(normalizedCompany);
      const matchesVehicle =
        !normalizedVehicle ||
        weighing.vehicleNumber
          .replaceAll(" ", "")
          .toLocaleLowerCase("ko-KR")
          .includes(normalizedVehicle);

      return matchesPeriod && matchesCompany && matchesVehicle;
    });
  }, [companyName, endDate, sourceWeighings, startDate, vehicleNumber]);

  const handleDateRangeChange = (field, value) => {
    const nextRange = normalizeDateRangeChange({ startDate, endDate, field, value });
    setStartDate(nextRange.startDate);
    setEndDate(nextRange.endDate);
    setExpandedId(null);
  };

  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setCompanyName("");
    setVehicleNumber("");
    setExpandedId(null);
  };

  return {
    toolbar: {
      startDate,
      endDate,
      companyName,
      vehicleNumber,
      dateLimits: getDateRangeLimits(startDate, endDate),
      hasFilters: Boolean(startDate || endDate || companyName || vehicleNumber),
      onDateRangeChange: handleDateRangeChange,
      onCompanyNameChange: setCompanyName,
      onVehicleNumberChange: setVehicleNumber,
      onReset: resetFilters,
    },
    list: {
      weighings,
      totalCount: sourceWeighings.length,
      loading,
      error,
      expandedId,
      paidIds,
      onToggleDetail: (id) => setExpandedId((current) => (current === id ? null : id)),
      onPaymentComplete: (id) => {
        setPaidIds((current) => {
          const next = new Set(current);
          next.add(id);
          return next;
        });
      },
      onRetry: loadWeighings,
    },
  };
}
