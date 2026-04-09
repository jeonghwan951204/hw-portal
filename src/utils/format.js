// 달러 소수점 2자리 포맷
export const formatUSD = (value) =>
  `${Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// 환율 (소수점 2자리)
export const formatRate = (value) =>
  Number(value).toLocaleString("ko-KR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// 원화 포맷
export const formatKRW = (value) => `${Math.round(value).toLocaleString()}원`;
