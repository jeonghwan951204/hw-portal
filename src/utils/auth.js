// ─── 인증 토큰 저장소 ──────────────────────────────────────────────────────────
// - refreshToken: 무기한. localStorage 에 영구 저장
// - accessToken: 1일. API 호출용. localStorage 에 저장하고 만료 시 재발급
// 순수 저장 로직만 담당하며, 재발급(refresh) 네트워크 로직은 api.js 에서 처리한다.

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const ROLE_KEY = "role";

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

/** 현재 사용자의 권한 (예: "USER", "ADMIN") */
export const getRole = () => localStorage.getItem(ROLE_KEY);

/** 가입/로그인 성공 시 발급받은 토큰·권한 저장 */
export const saveTokens = ({ accessToken, refreshToken, role } = {}) => {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (role) localStorage.setItem(ROLE_KEY, role);
};

/** 재발급된 액세스 토큰만 갱신 */
export const setAccessToken = (accessToken) => {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
};

/** 모든 토큰·권한 제거 (로그아웃 / 재발급 실패 시) */
export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
};
