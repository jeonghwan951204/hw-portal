import { formatNumber } from "../constants";

export const MAX_SYNC_REQUEST_DAYS = 93;

export const SYNC_SOURCE_OPTIONS = [
  { value: "hojae", label: "호재 계근 PC" },
  { value: "woonam", label: "우남 계근 PC" },
];

const seoulDateFormatter = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" });
const MILLISECONDS_PER_DAY = 86_400_000;

export const getSyncRequestToday = () => seoulDateFormatter.format(new Date());

export const isSyncRequestInProgress = ({ status }) => status === "PENDING" || status === "RUNNING";

export function validateSyncRequestDates({ dateFrom, dateTo }, today) {
  if (!dateFrom || !dateTo) return "";
  if (dateFrom > dateTo) return "시작일은 종료일보다 늦을 수 없습니다.";
  if (dateTo > today) return "종료일은 오늘 이후로 지정할 수 없습니다.";

  const days = (Date.parse(dateTo) - Date.parse(dateFrom)) / MILLISECONDS_PER_DAY + 1;
  return days > MAX_SYNC_REQUEST_DAYS ? `동기화 기간은 최대 ${MAX_SYNC_REQUEST_DAYS}일까지 요청할 수 있습니다.` : "";
}

export function formatSyncRequestResult(request) {
  if (request.status === "FAILED") {
    const message = request.message || "실패 사유를 확인할 수 없습니다.";
    return request.skippedCount > 0 ? `${message} · 제외 ${formatNumber(request.skippedCount)}건` : message;
  }
  if (request.status !== "COMPLETED") return "-";

  const counts = [
    `갱신 ${formatNumber(request.updatedCount)}`,
    `신규 ${formatNumber(request.insertedCount)}`,
    `변경 없음 ${formatNumber(request.unchangedCount)}`,
  ];
  if (request.deletedCount > 0) counts.push(`삭제 ${formatNumber(request.deletedCount)}`);
  if (request.restoredCount > 0) counts.push(`복구 ${formatNumber(request.restoredCount)}`);
  return counts.join(" · ");
}
