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

export const formatWeight = (value) => `${formatNumber(value, 3)} kg`;
export const formatUnitPrice = (value) => `${formatNumber(value)}원/kg`;
export const formatAmount = (value) => `${formatNumber(value)}원`;
