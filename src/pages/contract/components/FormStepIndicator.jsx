// 스텝 진행 표시: 1 기본 → 2 단가 → 3 품목 → 4 확인
export default function FormStepIndicator({ step, steps }) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {steps.map((label, idx) => {
        const num = idx + 1;
        const active = num === step;
        const done = num < step;
        return (
          <div key={label} className="flex items-center gap-2 sm:gap-3">
            {idx > 0 && <span className="w-4 sm:w-8 border-t border-slate-200" />}
            <div className="flex items-center gap-1.5">
              <span
                className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold border transition-all ${
                  active
                    ? "bg-blue-600 text-white border-blue-600"
                    : done
                      ? "bg-blue-50 text-blue-600 border-blue-200"
                      : "bg-white text-slate-400 border-slate-200"
                }`}
              >
                {done ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  num
                )}
              </span>
              <span
                className={`text-xs font-semibold hidden sm:inline ${
                  active ? "text-blue-600" : done ? "text-slate-500" : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
