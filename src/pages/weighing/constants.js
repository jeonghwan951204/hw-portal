export const formatDate = (value) => (value ? value.replaceAll("-", ".") : "-");

export const getLocalDateString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatNumber = (value, maximumFractionDigits = 0) => {
  if (value == null || value === "") return "-";
  return Number(value).toLocaleString("ko-KR", { maximumFractionDigits });
};

export const formatWeight = (value) =>
  value == null || value === "" ? "-" : `${formatNumber(value, 3)} kg`;

const currencyLabelOf = (currency) => ({ KRW: "원", USD: "USD" })[currency] ?? currency ?? "원";
const unitLabelOf = (unit) => ({ KG: "kg", TON: "ton" })[unit] ?? unit?.toLowerCase() ?? "kg";

export const formatUnitPrice = (value, currency, unit) =>
  value == null ? "-" : `${formatNumber(value)}${currencyLabelOf(currency)}/${unitLabelOf(unit)}`;

export const formatAmount = (value, currency) =>
  value == null ? "-" : `${formatNumber(value)}${currencyLabelOf(currency)}`;

export const formatDateTime = (value) => {
  if (!value) return "-";
  return value.replace("T", " ").slice(0, 16).replaceAll("-", ".");
};

export const WEIGHING_PAGE_SIZE = 20;
