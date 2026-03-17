import { useState, useEffect, useRef } from "react";

// ─── 로그인 페이지 ─────────────────────────────────────────────────────────────
// Spring Security 기본 로그인 폼과 호환
// - POST /login  (username, password, remember-me)
// - ?error  → 로그인 실패 알림
// - ?logout → 로그아웃 완료 알림

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // URL 쿼리 파라미터 파싱 (?error, ?logout)
  const params = new URLSearchParams(window.location.search);
  const hasError = params.has("error");
  const hasLogout = params.has("logout");

  // 페이지 진입 시 아이디 입력창에 자동 포커스 (autofocus 대체)
  const usernameRef = useRef(null);
  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  // ── 폼 제출 핸들러 ─────────────────────────────────────────────────────────
  // Spring Security는 기본적으로 multipart/form-data가 아닌
  // application/x-www-form-urlencoded 형식을 요구하므로 fetch로 직접 전송
  const handleSubmit = async (e) => {
    e.preventDefault();

    const body = new URLSearchParams({
      username,
      password,
      ...(rememberMe && { "remember-me": "on" }), // 체크 시에만 포함
    });

    try {
      const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        redirect: "manual", // 스프링 시큐리티의 리다이렉트를 직접 처리
      });

      // 로그인 성공 시 서버가 302로 리다이렉트 → 수동으로 이동
      if (res.type === "opaqueredirect" || res.ok) {
        window.location.href = "/"; // 로그인 성공 후 이동할 경로
      } else {
        // 실패 시 ?error 파라미터로 이동 (스프링 시큐리티 기본 동작과 동일)
        window.location.href = "/login?error";
      }
    } catch {
      window.location.href = "/login?error";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">
          로그인
        </h2>

        {/* 로그인 실패 알림 */}
        {hasError && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            아이디 또는 비밀번호가 올바르지 않습니다.
          </div>
        )}

        {/* 로그아웃 완료 알림 */}
        {hasLogout && (
          <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg">
            로그아웃 되었습니다.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 아이디 */}
          <div className="flex flex-col gap-1">
            <label htmlFor="username" className="text-sm font-medium text-slate-700">
              아이디
            </label>
            <input
              ref={usernameRef}
              id="username"
              type="text"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="아이디를 입력하세요"
              required
              className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            />
          </div>

          {/* 비밀번호 */}
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
              className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            />
          </div>

          {/* 자동 로그인 체크박스 */}
          <div className="flex items-center gap-2">
            <input
              id="remember-me"
              type="checkbox"
              name="remember-me"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer"
            />
            <label
              htmlFor="remember-me"
              className="text-sm text-slate-600 cursor-pointer select-none"
            >
              자동 로그인
            </label>
          </div>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-200 text-sm"
          >
            로그인
          </button>
        </form>
      </div>
    </div>
  );
}