const DISCORD_MESSAGE_LIMIT = 2000;

export default function PreviewPanel({ loading, result, error, onPreview }) {
  const isEmpty = result && !result.content;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-slate-800">미리보기</h2>
          <p className="mt-1 text-xs text-slate-400">현재 데이터로 만들며, 발송하지 않습니다.</p>
        </div>
        <button
          type="button"
          onClick={onPreview}
          disabled={loading}
          className="shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
        >
          {loading ? "만드는 중..." : "미리보기"}
        </button>
      </div>

      {error && (
        <p className="mt-4 whitespace-pre-wrap rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {isEmpty && (
        <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">지금은 보낼 데이터가 없습니다.</p>
      )}

      {result && !isEmpty && (
        <div className="mt-4 space-y-2">
          <p className={`text-xs font-semibold ${result.exceedsLimit ? "text-red-600" : "text-slate-500"}`}>
            {Number(result.length ?? result.content.length).toLocaleString()} / {DISCORD_MESSAGE_LIMIT.toLocaleString()}자
          </p>
          {result.exceedsLimit && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              디스코드 메시지 최대 길이(2,000자)를 넘었습니다. 템플릿을 줄여주세요.
            </p>
          )}
          <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-slate-50 px-4 py-3 font-mono text-xs leading-5 text-slate-700">
            {result.content}
          </pre>
        </div>
      )}
    </section>
  );
}
