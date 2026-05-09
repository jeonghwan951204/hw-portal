import { apiFetch } from "../../../utils/api";

export const fetchLmePriceHistory = async ({ page, size, startDate, endDate }) => {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);

  const res = await apiFetch(`/api/price?${params.toString()}`);
  return res.json();
};

export const fetchLmeAverage = async ({ startDate, endDate }) => {
  const params = new URLSearchParams({
    startDate,
    endDate,
  });

  const res = await apiFetch(`/api/price/average?${params.toString()}`);
  return res.json();
};

export const fetchExchangeRates = async ({ page, size, startDate, endDate }) => {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);

  const res = await apiFetch(`/api/exchange?${params.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  return res.json();
};
