// 로컬 목업 모드(VITE_USE_MOCK)에서 품목 API 대신 사용하는 데이터와 처리.
// 변경 사항은 메모리에만 유지되므로 새로고침하면 초기 데이터로 돌아간다.

let items = [
  { id: 1, name: "동", parentId: null, aliases: ["구리", "Cu"] },
  { id: 2, name: "A동", parentId: 1, aliases: ["A급동", "나동선"] },
  { id: 3, name: "피복 A동", parentId: 2, aliases: [] },
  { id: 4, name: "상동", parentId: 1, aliases: ["상급동"] },
  { id: 5, name: "파동", parentId: 1, aliases: ["파철동", "동파"] },
  { id: 6, name: "황동", parentId: null, aliases: ["신주"] },
  { id: 7, name: "알루미늄", parentId: null, aliases: ["AL"] },
  { id: 8, name: "알루미늄 새시", parentId: 7, aliases: [] },
  { id: 9, name: "알루미늄 캔", parentId: 7, aliases: ["알캔"] },
];
let nextItemId = 100;

const clone = (value) => JSON.parse(JSON.stringify(value));
const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

const notFound = (itemId) => {
  const error = new Error(`품목(${itemId})을 찾을 수 없습니다.`);
  error.status = 404;
  return error;
};

const findIndex = (itemId) => items.findIndex((item) => String(item.id) === String(itemId));

// 요청 바디 → 저장 모델. 실제 API 응답을 mapItem 한 결과와 같은 형태로 맞춘다.
const toStoredItem = (body, id) => ({
  id,
  name: body.itemName,
  parentId: body.parentItemId ?? null,
  aliases: body.aliases,
});

export const fetchItems = async () => {
  await delay();
  return clone(items);
};

export const createItem = async (body) => {
  await delay();
  const id = ++nextItemId;
  items = [...items, toStoredItem(body, id)];
  return { message: "품목이 등록되었습니다.", data: { itemId: id } };
};

export const updateItem = async (itemId, body) => {
  await delay();
  const index = findIndex(itemId);
  if (index < 0) throw notFound(itemId);
  items = items.map((item, i) => (i === index ? toStoredItem(body, item.id) : item));
  return { message: "품목이 수정되었습니다." };
};

export const deleteItem = async (itemId) => {
  await delay();
  const index = findIndex(itemId);
  if (index < 0) throw notFound(itemId);
  if (items.some((item) => String(item.parentId) === String(itemId))) {
    const error = new Error("하위 품목이 있는 품목은 삭제할 수 없습니다.");
    error.status = 409;
    throw error;
  }
  items = items.filter((_, i) => i !== index);
  return { message: "품목이 삭제되었습니다." };
};
