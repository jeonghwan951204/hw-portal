export default function CopyableValue({ label, value, onCopy, mono = true }) {
  if (!value) return <span className="text-slate-400">-</span>;

  return (
    <button
      type="button"
      onClick={() => onCopy(label, value)}
      title={`${label} 복사`}
      className={`group inline-flex max-w-full items-start gap-1.5 text-left text-slate-600 hover:text-blue-600 ${
        mono ? "font-mono" : ""
      }`}
    >
      <span className="break-all">{value}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-colors group-hover:text-blue-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V5a2 2 0 012-2h7a2 2 0 012 2v9a2 2 0 01-2 2h-2m-7-9H6a2 2 0 00-2 2v9a2 2 0 002 2h7a2 2 0 002-2v-2M8 7h5a2 2 0 012 2v7" />
      </svg>
      <span className="sr-only">{label} 복사</span>
    </button>
  );
}
