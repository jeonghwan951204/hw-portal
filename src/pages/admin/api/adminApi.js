import { apiFetch } from "../../../utils/api";

const parseResponse = async (res) => {
  if (!res.ok) {
    const error = new Error(`HTTP ${res.status}`);
    error.status = res.status;
    throw error;
  }

  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

export const fetchMembers = async ({ page, size, keyword, role }) => {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    status: "ACTIVE",
  });

  if (keyword) params.set("keyword", keyword);
  if (role) params.set("role", role);

  const res = await apiFetch(`/api/admin/members?${params.toString()}`);
  return parseResponse(res);
};

export const updateMemberRole = async (memberId, role) => {
  const res = await apiFetch(`/api/admin/members/${memberId}/role`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  return parseResponse(res);
};

export const deleteMember = async (memberId) => {
  const res = await apiFetch(`/api/admin/members/${memberId}`, {
    method: "DELETE",
  });
  return parseResponse(res);
};

export const fetchShareLinks = async () => {
  const res = await apiFetch("/api/share-links");
  return parseResponse(res);
};

export const createShareLink = async (payload) => {
  const res = await apiFetch("/api/share-links", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse(res);
};
