import { getRefreshToken, getRole } from "../utils/auth";

// ─── 인증·권한 가드 ────────────────────────────────────────────────────────────
// 토큰(refreshToken)이 없으면 접근을 막는다.
// refreshToken 은 무기한이므로, 보유 여부로 로그인 상태를 판단한다.
// (accessToken 만료 시에는 apiFetch 가 자동으로 재발급)
//
// roles 를 지정하면 사용자의 권한이 그 목록에 포함될 때만 접근을 허용한다.
// 여러 권한을 허용하려면 배열로 전달한다. 예: roles={["USER", "ADMIN"]}
// roles 를 생략하면 로그인 여부만 검사한다.

const Blocked = ({ title, message }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8 text-center">
      <h2 className="text-xl font-bold text-slate-800 mb-2">{title}</h2>
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  </div>
);

export default function RequireAuth({ roles, children }) {
  // 미인증 → 공유링크 안내
  if (!getRefreshToken()) {
    return (
      <Blocked
        title="접근 권한이 없습니다"
        message="전달받은 공유링크를 통해 접속해주세요."
      />
    );
  }

  // 권한 검사 — roles 가 지정된 경우에만
  if (roles && roles.length > 0 && !roles.includes(getRole())) {
    return (
      <Blocked
        title="접근 권한이 부족합니다"
        message="이 페이지에 접근할 수 있는 권한이 없습니다."
      />
    );
  }

  return children;
}
