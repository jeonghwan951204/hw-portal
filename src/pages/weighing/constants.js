export const formatDate = (value) => (value ? value.replaceAll("-", ".") : "-");

export const formatNumber = (value, maximumFractionDigits = 0) => {
  if (value == null || value === "") return "-";
  return Number(value).toLocaleString("ko-KR", { maximumFractionDigits });
};

export const formatWeight = (value) => `${formatNumber(value, 3)} kg`;
export const formatUnitPrice = (value) => `${formatNumber(value)}원/kg`;
export const formatAmount = (value) => `${formatNumber(value)}원`;
