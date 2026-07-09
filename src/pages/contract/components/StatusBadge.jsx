import { STATUS_STYLE } from "../constants";

export default function StatusBadge({ status }) {
  return (
    <span
      className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border ${
        STATUS_STYLE[status] ?? STATUS_STYLE["완료"]
      }`}
    >
      {status}
    </span>
  );
}
