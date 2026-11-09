export const PAGE_SIZE = 20;
export const RATE_PAGE_SIZE = 15;

export const LIST_FIELDS = {
  content: "content",
  totalPages: "totalPages",
  id: "id",
  baseDate: "date",
  closePrice: "closePrice",
  priceChange: "priceChange",
  exchangeRate: "exchangeRate",
};

export const AVG_FIELDS = {
  avgClose: "averageLme",
  avgRate: "averageExchange",
  avgKrw: "averagePrice",
};

export const RATE_FIELDS = {
  content: "content",
  totalPages: "totalPages",
  totalElements: "totalElements",
  baseDate: "baseDate",
  rate: "rate",
  exchangeChange: "exchangeChange",
};

export const parsePercentRate = (value) => {
  const numericValue = Number(String(value).replace(/[%\s,]/g, ""));
  return Number.isFinite(numericValue) ? numericValue / 100 : 0;
};

export const normalizeDecimalInput = (value) => {
  const stripped = String(value ?? "").replaceAll(",", "").replace(/[^\d.]/g, "");
  const dotIndex = stripped.indexOf(".");
  if (dotIndex === -1) return stripped;
  return `${stripped.slice(0, dotIndex + 1)}${stripped.slice(dotIndex + 1).replaceAll(".", "")}`;
};

// kg당 원화 단가 = LME 구리 종가($/t) × 환율(₩/$) ÷ 1000, 소수점 이하는 버린다.
// 종가나 환율이 없으면 null
export const calcKrwPerKg = (closePrice, exchangeRate) => {
  if (closePrice == null || !exchangeRate) return null;
  const value = (Number(closePrice) * Number(exchangeRate)) / 1000;
  return Number.isFinite(value) ? Math.trunc(value) : null;
};
