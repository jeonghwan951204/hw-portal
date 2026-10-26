// 로컬 목업 모드(VITE_USE_MOCK)에서 재고 API 대신 사용하는 데이터와 처리.
// 품목은 품목관리 목업과 같은 목록을 쓰고, 계근·보정 내역으로 재고를 계산한다.
// 변경 사항은 메모리에만 유지되므로 새로고침하면 초기 데이터로 돌아간다.
import { fetchItems as fetchMockItems } from "../../items/api/itemMock";
import { addDays, getLocalDateString } from "../constants";

const today = getLocalDateString();
const dayOf = (offset) => addDays(today, offset);

// 원본 계근 — itemId 가 null 이면 품목 미매핑, companyId 가 null 이면 거래처 미매핑, unitPrice(원/kg)가 null 이면 단가 없음
const WEIGHINGS = [
  { date: dayOf(-1), owner: "HOJAE", direction: "PURCHASE", companyId: 1, companyName: "금강", itemId: 2, itemName: "A동", quantityKg: 39748, unitPrice: 9800 },
  { date: dayOf(-1), owner: "HOJAE", direction: "PURCHASE", companyId: 2, companyName: "씨앤피", itemId: 4, itemName: "상동", quantityKg: 20112, unitPrice: 9450 },
  { date: dayOf(-1), owner: "HOJAE", direction: "SALE", companyId: 3, companyName: "삼성전기(주)", itemId: 5, itemName: "파동", quantityKg: 6200, unitPrice: 10200 },
  { date: dayOf(-1), owner: "WOONAM", direction: "PURCHASE", companyId: 4, companyName: "우진자원", itemId: 8, itemName: "알루미늄 새시", quantityKg: 8300, unitPrice: 2100 },
  { date: today, owner: "HOJAE", direction: "PURCHASE", companyId: 1, companyName: "금강", itemId: 2, itemName: "A동", quantityKg: 12450, unitPrice: 9850 },
  { date: today, owner: "HOJAE", direction: "PURCHASE", companyId: 1, companyName: "금강", itemId: 3, itemName: "피복 A동", quantityKg: 3562, unitPrice: null },
  { date: today, owner: "HOJAE", direction: "PURCHASE", companyId: 1, companyName: "금강", itemId: 5, itemName: "파동", quantityKg: 598, unitPrice: 10300 },
  { date: today, owner: "HOJAE", direction: "PURCHASE", companyId: 2, companyName: "씨앤피", itemId: 4, itemName: "상동", quantityKg: 4300, unitPrice: 9500 },
  { date: today, owner: "HOJAE", direction: "PURCHASE", companyId: null, companyName: "다라상사", itemId: null, itemName: "A동 차핑2", quantityKg: 1200, unitPrice: 9700 },
  { date: today, owner: "WOONAM", direction: "PURCHASE", companyId: 4, companyName: "우진자원", itemId: 9, itemName: "알루미늄 캔", quantityKg: 2780, unitPrice: 2050 },
  { date: today, owner: "HOJAE", direction: "SALE", companyId: 3, companyName: "삼성전기(주)", itemId: 2, itemName: "A동", quantityKg: 18100, unitPrice: 10400 },
  { date: today, owner: "WOONAM", direction: "SALE", companyId: 5, companyName: "미래산업", itemId: 6, itemName: "황동", quantityKg: 4100, unitPrice: 8900 },
];

const createdBy = { createdBy: "00000000-0000-0000-0000-000000000001", createdByName: "홍길동" };

let movements = [
  { movementId: 1, ownerCompany: "HOJAE", movementType: "ADJUSTMENT_INCREASE", fromItemId: null, toItemId: 2, quantityKg: 190540, occurredDate: dayOf(-10), reason: "기초재고" },
  { movementId: 2, ownerCompany: "HOJAE", movementType: "ADJUSTMENT_INCREASE", fromItemId: null, toItemId: 4, quantityKg: 45920, occurredDate: dayOf(-10), reason: "기초재고" },
  { movementId: 3, ownerCompany: "HOJAE", movementType: "ADJUSTMENT_INCREASE", fromItemId: null, toItemId: 5, quantityKg: 46200, occurredDate: dayOf(-10), reason: "기초재고" },
  { movementId: 4, ownerCompany: "WOONAM", movementType: "ADJUSTMENT_INCREASE", fromItemId: null, toItemId: 6, quantityKg: 12000, occurredDate: dayOf(-10), reason: "기초재고" },
  { movementId: 5, ownerCompany: "HOJAE", movementType: "TRANSFER", fromItemId: 2, toItemId: 4, quantityKg: 18720, occurredDate: today, reason: "A동 선별 → 상동" },
].map((movement) => ({
  reversalOfId: null,
  canceledByMovementId: null,
  ...createdBy,
  createdAt: `${movement.occurredDate}T17:40:12`,
  ...movement,
}));
let nextMovementId = 100;

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

const mockError = (status, code, message) => {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
};

const loadTree = async () => {
  const items = await fetchMockItems();
  const childrenOf = (parentId) => items.filter((item) => (item.parentId ?? null) === parentId);
  const ordered = [];
  const visit = (item, depth) => {
    ordered.push({ ...item, depth });
    childrenOf(item.id).forEach((child) => visit(child, depth + 1));
  };
  childrenOf(null).forEach((root) => visit(root, 0));
  const subtreeOf = (itemId) => {
    const ids = [itemId];
    childrenOf(itemId).forEach((child) => ids.push(...subtreeOf(child.id)));
    return ids;
  };
  return { items, ordered, subtreeOf };
};

const assertItemsExist = (items, itemIds) => {
  const missing = itemIds.find((itemId) => !items.some((item) => String(item.id) === String(itemId)));
  if (missing != null) throw mockError(404, "ITEM_NOT_FOUND", `품목(${missing})을 찾을 수 없습니다.`);
};

const matchesOwner = (owner, ownerCompany) => !ownerCompany || owner === ownerCompany;

// 기준일까지의 품목별 자체 재고(ownQuantityKg)와 미매핑 요약
const ownQuantities = (asOfDate, ownerCompany) => {
  const own = {};
  const add = (itemId, quantity) => {
    if (itemId == null) return;
    own[itemId] = (own[itemId] ?? 0) + quantity;
  };
  const unmapped = { purchaseCount: 0, purchaseQuantityKg: 0, saleCount: 0, saleQuantityKg: 0 };

  WEIGHINGS.filter((weighing) => weighing.date <= asOfDate && matchesOwner(weighing.owner, ownerCompany)).forEach((weighing) => {
    const sign = weighing.direction === "PURCHASE" ? 1 : -1;
    if (weighing.itemId == null) {
      const key = weighing.direction === "PURCHASE" ? "purchase" : "sale";
      unmapped[`${key}Count`] += 1;
      unmapped[`${key}QuantityKg`] += weighing.quantityKg;
      return;
    }
    add(weighing.itemId, sign * weighing.quantityKg);
  });

  movements.filter((movement) => movement.occurredDate <= asOfDate && matchesOwner(movement.ownerCompany, ownerCompany)).forEach((movement) => {
    add(movement.fromItemId, -movement.quantityKg);
    add(movement.toItemId, movement.quantityKg);
  });

  return { own, unmapped };
};

export const fetchStock = async ({ asOfDate, ownerCompany, itemIds }) => {
  await delay();
  const date = asOfDate || today;
  const { items, ordered, subtreeOf } = await loadTree();
  assertItemsExist(items, itemIds);
  const { own, unmapped } = ownQuantities(date, ownerCompany);
  const sumOf = (ids) => ids.reduce((sum, itemId) => sum + (own[itemId] ?? 0), 0);
  const selected = new Set(itemIds.map(String));
  const rows = ordered
    .filter((item) => selected.size === 0 || selected.has(String(item.id)))
    .map((item) => ({
      itemId: item.id,
      itemName: item.name,
      parentItemId: item.parentId ?? null,
      depth: item.depth,
      ownQuantityKg: own[item.id] ?? 0,
      quantityKg: sumOf(subtreeOf(item.id)),
    }));
  const totalIds = selected.size === 0
    ? items.map((item) => item.id)
    : [...new Set(itemIds.flatMap((itemId) => subtreeOf(Number(itemId))))];

  return {
    asOfDate: date,
    ownerCompany: ownerCompany || null,
    items: rows,
    totalQuantityKg: sumOf(totalIds),
    unmapped,
  };
};

const groupDirection = (weighings) => {
  const companies = new Map();
  weighings.forEach((weighing) => {
    const companyKey = weighing.companyId != null ? `id:${weighing.companyId}` : `name:${weighing.companyName}`;
    if (!companies.has(companyKey)) {
      companies.set(companyKey, {
        companyId: weighing.companyId,
        companyName: weighing.companyName,
        companyMapped: weighing.companyId != null,
        totalQuantityKg: 0,
        weighingCount: 0,
        itemMap: new Map(),
      });
    }
    const company = companies.get(companyKey);
    company.totalQuantityKg += weighing.quantityKg;
    company.weighingCount += 1;
    const itemKey = weighing.itemId != null ? `id:${weighing.itemId}` : `name:${weighing.itemName}`;
    if (!company.itemMap.has(itemKey)) {
      company.itemMap.set(itemKey, {
        itemId: weighing.itemId,
        itemName: weighing.itemName,
        itemMapped: weighing.itemId != null,
        quantityKg: 0,
        weighingCount: 0,
      });
    }
    const item = company.itemMap.get(itemKey);
    item.quantityKg += weighing.quantityKg;
    item.weighingCount += 1;
  });

  const list = [...companies.values()]
    .map(({ itemMap, ...company }) => ({
      ...company,
      items: [...itemMap.values()].sort((a, b) => b.quantityKg - a.quantityKg),
    }))
    .sort((a, b) => b.totalQuantityKg - a.totalQuantityKg);

  return {
    totalQuantityKg: list.reduce((sum, company) => sum + company.totalQuantityKg, 0),
    weighingCount: list.reduce((sum, company) => sum + company.weighingCount, 0),
    companies: list,
  };
};

export const fetchDailyTrades = async ({ date, ownerCompany, itemIds }) => {
  await delay();
  const targetDate = date || today;
  const { items, subtreeOf } = await loadTree();
  assertItemsExist(items, itemIds);
  const allowed = itemIds.length ? new Set(itemIds.flatMap((itemId) => subtreeOf(Number(itemId)))) : null;
  const dayWeighings = WEIGHINGS.filter(
    (weighing) =>
      weighing.date === targetDate &&
      matchesOwner(weighing.owner, ownerCompany) &&
      (!allowed || (weighing.itemId != null && allowed.has(weighing.itemId)))
  );
  return {
    date: targetDate,
    ownerCompany: ownerCompany || null,
    purchase: groupDirection(dayWeighings.filter((weighing) => weighing.direction === "PURCHASE")),
    sale: groupDirection(dayWeighings.filter((weighing) => weighing.direction === "SALE")),
  };
};

// 계근 목록 → 기간 통계 항목. 평균 단가는 단가가 있는 계근만 인수량으로 가중 평균한다.
const periodStatOf = (weighings) => {
  const quantityKg = weighings.reduce((sum, weighing) => sum + weighing.quantityKg, 0);
  const priced = weighings.filter((weighing) => weighing.unitPrice != null);
  const pricedQuantityKg = priced.reduce((sum, weighing) => sum + weighing.quantityKg, 0);
  const pricedAmount = priced.reduce((sum, weighing) => sum + weighing.quantityKg * weighing.unitPrice, 0);
  return {
    quantityKg,
    weighingCount: weighings.length,
    averageUnitPrice: pricedQuantityKg === 0 ? null : Math.round((pricedAmount / pricedQuantityKg) * 100) / 100,
    unpricedQuantityKg: quantityKg - pricedQuantityKg,
  };
};

export const fetchPeriodTrades = async ({ dateFrom, dateTo, ownerCompany, companyId, itemIds }) => {
  await delay();
  const to = dateTo || today;
  const from = dateFrom || `${to.slice(0, 8)}01`;
  if (from > to) throw mockError(400, "INVALID_INPUT", "조회 시작일이 종료일보다 늦습니다.");
  const { items, ordered, subtreeOf } = await loadTree();
  assertItemsExist(items, itemIds);

  const periodWeighings = WEIGHINGS.filter(
    (weighing) =>
      weighing.date >= from &&
      weighing.date <= to &&
      matchesOwner(weighing.owner, ownerCompany) &&
      (!companyId || String(weighing.companyId) === String(companyId))
  );
  const statOf = (direction, ids) => {
    const allowed = new Set(ids.map(Number));
    return periodStatOf(
      periodWeighings.filter((weighing) => weighing.direction === direction && allowed.has(weighing.itemId))
    );
  };

  const selected = new Set(itemIds.map(String));
  const rows = ordered
    .filter((item) => selected.size === 0 || selected.has(String(item.id)))
    .map((item) => {
      const subtreeIds = subtreeOf(item.id);
      return {
        itemId: item.id,
        itemName: item.name,
        parentItemId: item.parentId ?? null,
        depth: item.depth,
        purchase: statOf("PURCHASE", subtreeIds),
        sale: statOf("SALE", subtreeIds),
        ownPurchase: statOf("PURCHASE", [item.id]),
        ownSale: statOf("SALE", [item.id]),
      };
    });
  const totalIds = selected.size === 0
    ? items.map((item) => item.id)
    : [...new Set(itemIds.flatMap((itemId) => subtreeOf(Number(itemId))))];

  const unmapped = { purchaseCount: 0, purchaseQuantityKg: 0, saleCount: 0, saleQuantityKg: 0 };
  periodWeighings
    .filter((weighing) => weighing.itemId == null)
    .forEach((weighing) => {
      const key = weighing.direction === "PURCHASE" ? "purchase" : "sale";
      unmapped[`${key}Count`] += 1;
      unmapped[`${key}QuantityKg`] += weighing.quantityKg;
    });

  return {
    dateFrom: from,
    dateTo: to,
    ownerCompany: ownerCompany || null,
    companyId: companyId ? Number(companyId) : null,
    items: rows,
    totalPurchase: statOf("PURCHASE", totalIds),
    totalSale: statOf("SALE", totalIds),
    unmapped,
  };
};

const withItemNames = (items, movement) => ({
  ...movement,
  fromItemName: items.find((item) => item.id === movement.fromItemId)?.name ?? null,
  toItemName: items.find((item) => item.id === movement.toItemId)?.name ?? null,
});

export const fetchMovements = async ({ ownerCompany, dateFrom, dateTo, itemId, movementType, page, size }) => {
  await delay();
  const { items } = await loadTree();
  const filtered = movements
    .filter(
      (movement) =>
        matchesOwner(movement.ownerCompany, ownerCompany) &&
        (!dateFrom || movement.occurredDate >= dateFrom) &&
        (!dateTo || movement.occurredDate <= dateTo) &&
        (!itemId || String(movement.fromItemId) === String(itemId) || String(movement.toItemId) === String(itemId)) &&
        (!movementType || movement.movementType === movementType)
    )
    .sort((a, b) => b.occurredDate.localeCompare(a.occurredDate) || b.movementId - a.movementId);
  const offset = (page - 1) * size;
  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  return {
    content: filtered.slice(offset, offset + size).map((movement) => withItemNames(items, movement)),
    page,
    size,
    totalElements: filtered.length,
    totalPages,
    isFirst: page === 1,
    isLast: page >= totalPages,
  };
};

const validateCommon = (body) => {
  const date = body.occurredDate || today;
  if (date > today) throw mockError(400, "INVALID_INPUT", "미래 날짜는 입력할 수 없습니다.");
  if ((body.reason ?? "").length > 500) throw mockError(400, "INVALID_INPUT", "사유는 500자 이하로 입력하세요.");
  return date;
};

const addMovement = (movement) => {
  const created = {
    movementId: ++nextMovementId,
    reversalOfId: null,
    canceledByMovementId: null,
    ...createdBy,
    createdAt: new Date().toISOString().slice(0, 19),
    ...movement,
  };
  movements = [...movements, created];
  return created;
};

export const createTransfer = async (body) => {
  await delay();
  const occurredDate = validateCommon(body);
  if (!(body.quantityKg > 0)) throw mockError(400, "INVALID_INPUT", "수량은 0보다 커야 합니다.");
  if (String(body.fromItemId) === String(body.toItemId)) throw mockError(400, "INVALID_INPUT", "출발 품목과 도착 품목이 같습니다.");
  const { items } = await loadTree();
  assertItemsExist(items, [body.fromItemId, body.toItemId]);
  const created = addMovement({
    ownerCompany: body.ownerCompany,
    movementType: "TRANSFER",
    fromItemId: Number(body.fromItemId),
    toItemId: Number(body.toItemId),
    quantityKg: body.quantityKg,
    occurredDate,
    reason: body.reason || "품목 이동",
  });
  return { message: "품목 간 이동이 등록되었습니다.", data: { movementId: created.movementId } };
};

export const createAdjustment = async (body) => {
  await delay();
  const occurredDate = validateCommon(body);
  if (!(body.quantityKg > 0)) throw mockError(400, "INVALID_INPUT", "수량은 0보다 커야 합니다.");
  const { items } = await loadTree();
  assertItemsExist(items, [body.itemId]);
  const increase = body.direction === "INCREASE";
  const created = addMovement({
    ownerCompany: body.ownerCompany,
    movementType: increase ? "ADJUSTMENT_INCREASE" : "ADJUSTMENT_DECREASE",
    fromItemId: increase ? null : Number(body.itemId),
    toItemId: increase ? Number(body.itemId) : null,
    quantityKg: body.quantityKg,
    occurredDate,
    reason: body.reason || (increase ? "재고 추가" : "재고 차감"),
  });
  return { message: "재고 보정이 등록되었습니다.", data: { movementId: created.movementId } };
};

export const createStockCount = async (body) => {
  await delay();
  const occurredDate = validateCommon(body);
  if (!body.items?.length) throw mockError(400, "INVALID_INPUT", "재고 확인 품목이 없습니다.");
  if (body.items.some((item) => item.actualQuantityKg < 0)) throw mockError(400, "INVALID_INPUT", "실제 수량은 0 이상이어야 합니다.");
  const { items } = await loadTree();
  assertItemsExist(items, body.items.map((item) => item.itemId));
  const { own } = ownQuantities(occurredDate, body.ownerCompany);
  const results = body.items.map((item) => {
    const bookQuantityKg = own[item.itemId] ?? 0;
    const differenceKg = item.actualQuantityKg - bookQuantityKg;
    let movementId = null;
    if (differenceKg !== 0) {
      const increase = differenceKg > 0;
      movementId = addMovement({
        ownerCompany: body.ownerCompany,
        movementType: increase ? "ADJUSTMENT_INCREASE" : "ADJUSTMENT_DECREASE",
        fromItemId: increase ? null : Number(item.itemId),
        toItemId: increase ? Number(item.itemId) : null,
        quantityKg: Math.abs(differenceKg),
        occurredDate,
        reason: body.reason || "재고 확인 보정",
      }).movementId;
    }
    return { itemId: item.itemId, bookQuantityKg, actualQuantityKg: item.actualQuantityKg, differenceKg, movementId };
  });
  return { message: "재고 확인이 반영되었습니다.", data: { occurredDate, items: results } };
};

export const cancelMovement = async (movementId, reason) => {
  await delay();
  const target = movements.find((movement) => String(movement.movementId) === String(movementId));
  if (!target) throw mockError(404, "INVENTORY_MOVEMENT_NOT_FOUND", "보정 내역을 찾을 수 없습니다.");
  if (target.reversalOfId != null) throw mockError(400, "INVENTORY_MOVEMENT_NOT_CANCELABLE", "취소 내역은 다시 취소할 수 없습니다.");
  if (target.canceledByMovementId != null) throw mockError(409, "INVENTORY_MOVEMENT_ALREADY_CANCELED", "이미 취소된 내역입니다.");
  const reversedType = {
    ADJUSTMENT_INCREASE: "ADJUSTMENT_DECREASE",
    ADJUSTMENT_DECREASE: "ADJUSTMENT_INCREASE",
    TRANSFER: "TRANSFER",
  }[target.movementType];
  const created = addMovement({
    ownerCompany: target.ownerCompany,
    movementType: reversedType,
    fromItemId: target.toItemId,
    toItemId: target.fromItemId,
    quantityKg: target.quantityKg,
    occurredDate: target.occurredDate,
    reason: reason || `보정 취소 #${target.movementId}`,
    reversalOfId: target.movementId,
  });
  movements = movements.map((movement) =>
    movement.movementId === target.movementId ? { ...movement, canceledByMovementId: created.movementId } : movement
  );
  return { message: "재고 보정이 취소되었습니다.", data: { movementId: created.movementId } };
};
