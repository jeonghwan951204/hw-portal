import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  clearTokens,
} from "./auth";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

// 동시에 여러 요청이 401 을 받아도 재발급은 한 번만 수행하도록 공유
let refreshPromise = null;

/**
 * refreshToken 으로 accessToken 재발급
 * @returns {Promise<string|null>} 새 accessToken, 실패 시 null
 */
const refreshAccessToken = () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return Promise.resolve(null);

  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE_URL}/api/auth/token/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) {
          clearTokens(); // 리프레시 토큰도 만료/무효 → 로그아웃 처리
          return null;
        }
        const data = await res.json();
        setAccessToken(data.accessToken);
        return data.accessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

const withAuthHeader = (options, token) => {
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return { ...options, headers };
};

/**
 * BASE_URL 기반 fetch 래퍼.
 * - accessToken 이 있으면 Authorization: Bearer 헤더를 자동 첨부
 * - 401 응답 시 refreshToken 으로 재발급 후 1회 재시도
 * @param {string} path  - "/api/lme/price" 형태의 경로
 * @param {RequestInit} options - fetch 옵션
 */
export const apiFetch = async (path, options = {}) => {
  const url = `${BASE_URL}${path}`;

  let res = await fetch(url, withAuthHeader(options, getAccessToken()));

  // 액세스 토큰 만료 → 재발급 후 재시도
  if (res.status === 401 && getRefreshToken()) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await fetch(url, withAuthHeader(options, newToken));
    }
  }

  return res;
};

export default BASE_URL;
