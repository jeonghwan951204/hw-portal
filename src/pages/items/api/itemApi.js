import { apiFetch } from "../../../utils/api";
import { USE_MOCK } from "../../../utils/env";
import * as itemMock from "./itemMock";

const asJson = async (response) => {
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body = await response.clone().json();
      if (body?.message) message = body.message;
    } catch {
      const text = await response.text().catch(() => "");
      if (text) message = text;
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return response.json();
};

// 응답 ItemResponse { itemId, itemName, parentItemId, parentItemName, aliases } → 화면 모델.
// 상위 품목명(parentItemName)은 목록 안에서 parentId 로 찾을 수 있어 따로 쓰지 않는다.
const mapItem = (item) => ({
  id: item.itemId,
  name: item.itemName ?? "",
  parentId: item.parentItemId ?? null,
  aliases: item.aliases ?? [],
});

// 폼 모델 → 요청 바디. 빈 별칭은 버리고 같은 별칭은 한 번만 보낸다.
const createItemBody = (form) => ({
  itemName: form.name.trim(),
  parentItemId: form.parentId ? Number(form.parentId) : null,
  aliases: [...new Set(form.aliases.map((alias) => alias.value.trim()).filter(Boolean))],
});

// 활성 품목 전체 조회 (GET /api/items).
// API 에 keyword 검색이 있지만 결과에 상위 품목이 함께 온다는 명세가 없어 계층을 그릴 수 없으므로,
// 전체를 받아 화면에서 거른다.
export const fetchItems = async () => {
  if (USE_MOCK) return itemMock.fetchItems();
  return (await asJson(await apiFetch("/api/items"))).map(mapItem);
};

// 품목 등록 (POST /api/items) → { message, data: { itemId } }
export const createItem = async (form) => {
  if (USE_MOCK) return itemMock.createItem(createItemBody(form));
  return asJson(
    await apiFetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createItemBody(form)),
    })
  );
};

// 품목 수정 (PUT /api/items/{itemId}) — 품목명·상위 품목·별칭 전체 교체 → { message }
export const updateItem = async (itemId, form) => {
  if (USE_MOCK) return itemMock.updateItem(itemId, createItemBody(form));
  return asJson(
    await apiFetch(`/api/items/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createItemBody(form)),
    })
  );
};

// 품목 삭제(비활성화) (DELETE /api/items/{itemId}) — 활성 하위 품목이 있으면 서버에서 거절한다. → { message }
export const deleteItem = async (itemId) => {
  if (USE_MOCK) return itemMock.deleteItem(itemId);
  return asJson(await apiFetch(`/api/items/${itemId}`, { method: "DELETE" }));
};
