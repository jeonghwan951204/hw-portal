export const LIST_PATH = "/admin/discord-messages";

export const DEFAULT_CHANNEL = "default";

export const DAYS = [
  { value: "MONDAY", label: "월" },
  { value: "TUESDAY", label: "화" },
  { value: "WEDNESDAY", label: "수" },
  { value: "THURSDAY", label: "목" },
  { value: "FRIDAY", label: "금" },
  { value: "SATURDAY", label: "토" },
  { value: "SUNDAY", label: "일" },
];

// 알려진 상수만 한글 이름표를 붙이고, 나머지는 키 이름을 그대로 보여 준다.
export const SETTING_LABELS = {
  exportExchangeRates: "수출 기준 환율 (원/USD)",
  exportPriceDeduction: "수출 차감액 (원/kg)",
};

export const getSettingLabel = (key) => SETTING_LABELS[key] ?? key;

export const TEMPLATE_HELP = [
  { syntax: "{{변수}}", description: "값 출력" },
  { syntax: "{{#목록}} ... {{/목록}}", description: "목록 반복 (예: {{#contracts}})" },
  { syntax: "{{#조건}} ... {{/조건}}", description: "참이거나 값이 있을 때만 출력 (예: {{#domestic}}, {{#rateDetail}})" },
  { syntax: "{{^조건}} ... {{/조건}}", description: "거짓이거나 값이 없을 때만 출력" },
  { syntax: "{{^-last}} ... {{/-last}}", description: "반복의 마지막 항목이 아닐 때만 출력 (항목 사이 구분선)" },
  { syntax: "{{today}}", description: "발송일 (모든 메시지에서 사용 가능)" },
];

// 상수 기본값의 모양으로 입력란 종류를 정한다.
export const getSettingType = (value) => {
  if (typeof value === "number") return "number";
  if (typeof value === "string") return "string";
  if (typeof value === "boolean") return "boolean";
  if (Array.isArray(value) && value.every((item) => typeof item === "number")) return "numberArray";
  return "unknown";
};

// 서버 응답의 "06:00:00" → 입력란용 "06:00"
export const toTimeInput = (value) => (value ? String(value).slice(0, 5) : "");

// 요일 목록 → "화~토 06:00". 3일 이상 연속이면 범위(~)로 줄인다.
export const formatSchedule = (sendDays = [], sendTime) => {
  const indexes = DAYS
    .map((day, index) => (sendDays.includes(day.value) ? index : -1))
    .filter((index) => index >= 0);

  let dayText;
  if (indexes.length === DAYS.length) {
    dayText = "매일";
  } else {
    const runs = [];
    indexes.forEach((index) => {
      const last = runs[runs.length - 1];
      if (last && last[last.length - 1] === index - 1) last.push(index);
      else runs.push([index]);
    });
    dayText = runs
      .map((run) =>
        run.length >= 3
          ? `${DAYS[run[0]].label}~${DAYS[run[run.length - 1]].label}`
          : run.map((index) => DAYS[index].label).join(", ")
      )
      .join(", ");
  }

  return [dayText || "-", toTimeInput(sendTime)].filter(Boolean).join(" ");
};

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

// 메시지 응답 → 생성·수정 요청 바디
export const toRequestBody = (message) => ({
  name: message.name,
  dataSource: message.dataSource,
  channel: message.channel,
  content: message.content,
  settings: message.settings ?? {},
  sendTime: toTimeInput(message.sendTime),
  sendDays: message.sendDays ?? [],
  enabled: message.enabled,
});
