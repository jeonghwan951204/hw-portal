export default function VariablePanel({ variables, onInsert }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-bold text-slate-800">사용할 수 있는 변수</h2>
      <p className="mt-1 text-xs text-slate-400">누르면 템플릿의 커서 위치에 들어갑니다.</p>

      {variables.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">데이터 종류를 선택하면 변수 안내가 표시됩니다.</p>
      ) : (
        <ul className="mt-3 max-h-96 space-y-1 overflow-y-auto">
          {variables.map((variable) => (
            <li key={variable.name}>
              <button
                type="button"
                onClick={() => onInsert(variable.name)}
                className="w-full rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-blue-50"
              >
                <span className="font-mono text-xs font-bold text-blue-700">{`{{${variable.name}}}`}</span>
                {variable.description && (
                  <span className="mt-0.5 block text-xs text-slate-500">{variable.description}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
