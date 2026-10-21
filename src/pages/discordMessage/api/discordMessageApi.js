import { apiFetch } from "../../../utils/api";

const BASE_PATH = "/api/admin/discord-messages";

// 오류 응답 { code, message } 의 message 를 그대로 사용자에게 보여 준다.
const parseResponse = async (res) => {
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    let code = null;
    try {
      const body = await res.clone().json();
      if (body?.message) message = body.message;
      code = body?.code ?? null;
    } catch {
      const text = await res.text().catch(() => "");
      if (text) message = text;
    }
    const error = new Error(message);
    error.status = res.status;
    error.code = code;
    throw error;
  }

  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

const jsonRequest = (method, body) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const fetchDiscordMessages = async () =>
  parseResponse(await apiFetch(BASE_PATH));

export const fetchDiscordMessage = async (id) =>
  parseResponse(await apiFetch(`${BASE_PATH}/${id}`));

export const createDiscordMessage = async (payload) =>
  parseResponse(await apiFetch(BASE_PATH, jsonRequest("POST", payload)));

// 수정 내용은 다음 발송부터 적용된다.
export const updateDiscordMessage = async (id, payload) =>
  parseResponse(await apiFetch(`${BASE_PATH}/${id}`, jsonRequest("PUT", payload)));

export const deleteDiscordMessage = async (id) =>
  parseResponse(await apiFetch(`${BASE_PATH}/${id}`, { method: "DELETE" }));

// 실제 채널로 바로 발송 → { sent, content, skippedReason }
export const sendDiscordMessage = async (id) =>
  parseResponse(await apiFetch(`${BASE_PATH}/${id}/send`, { method: "POST" }));

// 저장 전 미리보기 (발송 안 함) → { content, length, exceedsLimit }
export const previewDiscordMessage = async (payload) =>
  parseResponse(await apiFetch(`${BASE_PATH}/preview`, jsonRequest("POST", payload)));

// [{ type, label, description, defaultContent, defaultSettings, variables }]
export const fetchDataSources = async () =>
  parseResponse(await apiFetch(`${BASE_PATH}/data-sources`));

// ["default", "contract"]
export const fetchChannels = async () =>
  parseResponse(await apiFetch(`${BASE_PATH}/channels`));
