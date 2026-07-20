const stripNumberFormatting = (value) => String(value ?? "").replaceAll(",", "");

const sanitizeNumber = (value) => {
  const stripped = stripNumberFormatting(value).replace(/[^\d.]/g, "");
  const dotIndex = stripped.indexOf(".");
  if (dotIndex === -1) return stripped;
  return `${stripped.slice(0, dotIndex + 1)}${stripped.slice(dotIndex + 1).replaceAll(".", "")}`;
};

const formatNumberInput = (value) => {
  const raw = stripNumberFormatting(value);
  if (!raw) return "";
  const [integerPart, decimalPart] = raw.split(".");
  const formattedInteger = (integerPart || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return raw.includes(".") ? `${formattedInteger}.${decimalPart ?? ""}` : formattedInteger;
};

// 화면에는 천 단위 콤마를 표시하고, onChange에는 콤마 없는 숫자 문자열을 전달한다.
export default function NumericInput({ value, onChange, className, ...props }) {
  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      value={formatNumberInput(value)}
      onChange={(event) => onChange(sanitizeNumber(event.target.value))}
      className={className}
    />
  );
}
