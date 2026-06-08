import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";
import { saveTokens, getRefreshToken } from "../utils/auth";

// ─── 회원가입 페이지 ───────────────────────────────────────────────────────────
// 공유링크를 통해 접속 → 이름을 입력하고 가입
//
// 인증 흐름
//  1. GET  /api/share-links/{id}                     → 링크 유효성/만료/리다이렉트 경로 확인
//  2. POST /api/auth/share-links/{linkId}/register   → 유저명 등록 + 토큰 발급
//  3. accessToken/refreshToken 저장 (refreshToken 영구 보관)
//  4. 응답으로 받은 path 로 리다이렉트
//
// 링크 식별자는 /signup/:linkId 경로 또는 /signup?id=xxx 쿼리로 전달

export default function SignupPage() {
  const navigate = useNavigate();

  // 링크 식별자: 경로 파라미터 우선, 없으면 쿼리(?id=) 사용
  const { linkId: linkIdParam } = useParams();

  const linkId =
    linkIdParam ?? new URLSearchParams(window.location.search).get("id") ?? "";

  // 링크 검증 상태: "loading" | "valid" | "invalid"
  const [status, setStatus] = useState("loading");
  const [linkError, setLinkError] = useState("");
  const [redirectPath, setRedirectPath] = useState("/");

  // 폼 상태
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const nameRef = useRef(null);

  // ── 1. 공유링크 유효성 확인 ───────────────────────────────────────────────
  useEffect(() => {
    if (!linkId) {
      setStatus("invalid");
      setLinkError("유효하지 않은 접근입니다. 공유링크를 다시 확인해주세요.");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(`/api/share-links/${linkId}`);
        if (!res.ok) {
          if (!cancelled) {
            setStatus("invalid");
            setLinkError("존재하지 않는 공유링크입니다.");
          }
          return;
        }

        const data = await res.json();
        if (cancelled) return;

        const path = data.path || "/";

        // 이미 가입한 사용자(리프레시 토큰 보유) → 만료 여부와 무관하게 바로 이동
        if (getRefreshToken()) {
          navigate(path, { replace: true });
          return;
        }

        // 미가입자는 만료된 링크로 가입할 수 없음
        if (data.expired) {
          setStatus("invalid");
          setLinkError("만료된 공유링크입니다. 관리자에게 문의해주세요.");
          return;
        }

        setRedirectPath(path);
        setStatus("valid");
      } catch {
        if (!cancelled) {
          setStatus("invalid");
          setLinkError("링크 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [linkId, navigate]);

  // 링크 검증 완료 후 이름 입력창 자동 포커스
  useEffect(() => {
    if (status === "valid") nameRef.current?.focus();
  }, [status]);

  // ── 2~4. 가입 + 토큰 저장 + 리다이렉트 ────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("이름을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch(
        `/api/auth/share-links/${linkId}/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmedName }),
        }
      );

      if (res.status === 410) {
        setFormError("만료된 공유링크입니다. 관리자에게 문의해주세요.");
        return;
      }
      if (!res.ok) {
        setFormError("가입에 실패했습니다. 입력 정보를 확인해주세요.");
        return;
      }

      const token = await res.json();
      // refreshToken 영구 저장 + accessToken·권한 저장
      saveTokens({
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        role: token.role,
      });

      // 공유링크에서 받은 path 로 이동
      navigate(redirectPath, { replace: true });
    } catch {
      setFormError("가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">
          회원가입
        </h2>
        <p className="text-sm text-center text-slate-500 mb-6">
          이름을 입력하고 가입을 완료하세요.
        </p>

        {/* 링크 검증 중 */}
        {status === "loading" && (
          <div className="py-8 text-center text-sm text-slate-500">
            공유링크를 확인하는 중입니다...
          </div>
        )}

        {/* 유효하지 않은 링크 */}
        {status === "invalid" && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {linkError}
          </div>
        )}

        {/* 가입 폼 */}
        {status === "valid" && (
          <>
            {formError && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="name"
                  className="text-sm font-medium text-slate-700"
                >
                  이름
                </label>
                <input
                  ref={nameRef}
                  id="name"
                  type="text"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름을 입력하세요"
                  required
                  className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-200 text-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {submitting ? "가입 중..." : "가입하기"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
