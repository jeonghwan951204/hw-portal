const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

/**
 * BASE_URL 기반 fetch 래퍼
 * @param {string} path  - "/api/lme/price" 형태의 경로
 * @param {RequestInit} options - fetch 옵션
 */
export const apiFetch = (path, options) =>
  fetch(`${BASE_URL}${path}`, options);

export default BASE_URL;
