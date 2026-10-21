import { TEMPLATE_HELP } from "../constants";

export default function TemplateEditor({ content, contentRef, canReset, onContentChange, onReset }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-slate-800">템플릿</h2>
          <p className="mt-1 text-xs text-slate-400">줄바꿈이 그대로 메시지에 반영됩니다. (Mustache 문법)</p>
        </div>
        <button
          type="button"
          onClick={onReset}
          disabled={!canReset}
          className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
        >
          기본 템플릿으로 되돌리기
        </button>
      </div>

      <textarea
        ref={contentRef}
        value={content}
        onChange={(event) => onContentChange(event.target.value)}
        rows={18}
        spellCheck={false}
        className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 font-mono text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />

      <details className="mt-3 rounded-xl bg-slate-50 px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold text-slate-600">템플릿 문법 도움말</summary>
        <table className="mt-3 w-full text-xs">
          <tbody className="divide-y divide-slate-200">
            {TEMPLATE_HELP.map((help) => (
              <tr key={help.syntax}>
                <td className="whitespace-nowrap py-2 pr-4 font-mono text-slate-700">{help.syntax}</td>
                <td className="py-2 text-slate-500">{help.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-slate-400">
          저장할 때 서버가 예시 데이터로 템플릿을 검사합니다. 문법 오류나 없는 변수를 쓰면 저장되지 않습니다.
        </p>
      </details>
    </section>
  );
}
