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
