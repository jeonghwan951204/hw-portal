export const ROLES = [
  { value: "USER", label: "일반 회원" },
  { value: "ADMIN", label: "관리자" },
];

export const PAGE_SIZE = 10;

export const getRoleLabel = (role) =>
  ROLES.find((item) => item.value === role)?.label ?? role;

export const formatDateTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const getMinimumExpiry = () => {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};
