// "지금 발송" 결과. 보낼 데이터가 없으면 sent: false 와 skippedReason 이 온다.
export default function SendResultPanel({ result, onClose }) {
  if (!result) return null;

  const { name, sent, content, skippedReason } = result;

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${
      sent ? "border-emerald-100 bg-emerald-50" : "border-amber-100 bg-amber-50"
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-sm font-bold ${sent ? "text-emerald-700" : "text-amber-700"}`}>
            {sent ? `'${name}' 메시지를 발송했습니다.` : `'${name}' 메시지를 발송하지 않았습니다.`}
          </p>
          {!sent && (
            <p className="mt-1 text-sm text-amber-700">{skippedReason || "보낼 데이터가 없습니다."}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-white/60"
        >
          닫기
        </button>
      </div>
      {sent && content && (
        <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-white px-4 py-3 font-mono text-xs text-slate-700">
          {content}
        </pre>
      )}
    </div>
  );
}
