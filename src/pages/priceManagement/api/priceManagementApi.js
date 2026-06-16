import { apiFetch } from "../../../utils/api";

// 현재(최신) 가격 조회 — GET /api/{category}/price/current
export const fetchCurrentPrice = async (category) => {
  const res = await apiFetch(`/api/${category}/price/current`);
  return res.json();
};

// 가격 내역 조회 — GET /api/{category}/price?page&size&startDt&endDt
export const fetchPriceHistory = async ({ category, page, size, startDate, endDate }) => {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  if (startDate) params.set("startDt", startDate);
  if (endDate) params.set("endDt", endDate);

  const res = await apiFetch(`/api/${category}/price?${params.toString()}`);
  return res.json();
};

// 가격 저장 — POST /api/{category}/price
export const savePrice = async (category, priceData) => {
  const res = await apiFetch(`/api/${category}/price`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(priceData),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  return res;
};
