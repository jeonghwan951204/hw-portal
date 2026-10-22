// 재고 현황표(엑셀 '재고 현황' 양식) 계산 — 화면 상태 없이 응답만으로 표 데이터를 만든다.
//
//  열: 품목 (품목 미선택이면 최상위 품목, 선택하면 선택한 품목) — 품목과 무관한 전체 합계 열은 두지 않는다
//  행: 전일 재고 / 매입(거래처별) / 매출(거래처별) / 조정(그날 보정 합계 한 행) / 금일 재고
//
// 품목 열 값은 재고 응답의 quantityKg 처럼 '하위 품목 포함 합계'로 맞춘다.
// 그래서 거래·보정 품목은 자기 자신이나 상위 품목이 열로 있으면 그 열에 더한다.

const round = (value) => Math.round(value * 10000) / 10000;

const emptyValues = (columns) => Object.fromEntries(columns.map((column) => [column.itemId, 0]));

// 품목 → 상위 품목 맵. 품목 API 와 재고 응답(비활성 품목 포함)을 합친다.
export const buildParentMap = (items, stockItems = []) => {
  const map = new Map();
  items.forEach((item) => map.set(String(item.id), item.parentId == null ? null : String(item.parentId)));
  stockItems.forEach((item) => {
    if (!map.has(String(item.itemId))) {
      map.set(String(item.itemId), item.parentItemId == null ? null : String(item.parentItemId));
    }
  });
  return map;
};

// 품목이 속하는 열 id 목록(자기 자신 또는 상위 품목이 열인 경우)
const columnIdsOf = (itemId, columnIdSet, parentMap) => {
  const result = [];
  const visited = new Set();
  let current = itemId == null ? null : String(itemId);
  while (current != null && !visited.has(current)) {
    visited.add(current);
    if (columnIdSet.has(current)) result.push(current);
    current = parentMap.get(current) ?? null;
  }
  return result;
};

export const getSheetColumns = (stockItems, selectedItemIds) =>
  (selectedItemIds.length ? stockItems : stockItems.filter((item) => item.depth === 0)).map((item) => ({
    itemId: String(item.itemId),
    itemName: item.itemName,
  }));

const stockRow = (key, label, stock, columns) => {
  const values = emptyValues(columns);
  (stock?.items ?? []).forEach((item) => {
    if (String(item.itemId) in values) values[String(item.itemId)] = Number(item.quantityKg ?? 0);
  });
  return { key, label, values, breakdown: {}, notes: [] };
};

// 거래처 한 행 — 열별 값, 셀 툴팁용 품목 내역, 열에 안 잡힌 품목(미매핑 등)은 비고
const companyRow = (direction, company, index, columns, columnIdSet, parentMap) => {
  const values = emptyValues(columns);
  const breakdown = {};
  const notes = [];

  company.items.forEach((item) => {
    const quantity = Number(item.quantityKg ?? 0);
    const columnIds = item.itemMapped ? columnIdsOf(item.itemId, columnIdSet, parentMap) : [];
    if (columnIds.length === 0) {
      notes.push({ itemName: item.itemName, quantityKg: quantity, mapped: item.itemMapped });
      return;
    }
    columnIds.forEach((columnId) => {
      values[columnId] += quantity;
      (breakdown[columnId] ??= []).push({ itemName: item.itemName, quantityKg: quantity });
    });
  });

  return {
    key: `${direction}-${company.companyId ?? `name-${company.companyName ?? ""}`}-${index}`,
    label: company.companyName,
    mapped: company.companyMapped,
    weighingCount: company.weighingCount,
    values: Object.fromEntries(Object.entries(values).map(([id, value]) => [id, round(value)])),
    breakdown,
    notes,
  };
};

// 보정 한 행 — 도착 품목 열에 +, 출발 품목 열에 -
const movementRow = (movement, columns, columnIdSet, parentMap) => {
  const values = emptyValues(columns);
  const quantity = Number(movement.quantityKg ?? 0);
  const toColumns = columnIdsOf(movement.toItemId, columnIdSet, parentMap);
  const fromColumns = columnIdsOf(movement.fromItemId, columnIdSet, parentMap);
  toColumns.forEach((columnId) => (values[columnId] += quantity));
  fromColumns.forEach((columnId) => (values[columnId] -= quantity));
  return {
    key: `movement-${movement.movementId}`,
    movement,
    touches: toColumns.length > 0 || fromColumns.length > 0,
    values: Object.fromEntries(Object.entries(values).map(([id, value]) => [id, round(value)])),
    breakdown: {},
    notes: [],
  };
};

const sumRows = (key, label, rows, columns) => {
  const values = emptyValues(columns);
  rows.forEach((row) => {
    columns.forEach((column) => (values[column.itemId] += row.values[column.itemId]));
  });
  return {
    key,
    label,
    values: Object.fromEntries(Object.entries(values).map(([id, value]) => [id, round(value)])),
    breakdown: {},
    notes: [],
  };
};

export const buildStockSheet = ({ stock, prevStock, trades, movements, parentMap, selectedItemIds }) => {
  const columns = getSheetColumns(stock?.items ?? [], selectedItemIds);
  const columnIdSet = new Set(columns.map((column) => column.itemId));

  const purchaseRows = (trades?.purchase?.companies ?? []).map((company, index) =>
    companyRow("purchase", company, index, columns, columnIdSet, parentMap)
  );
  const saleRows = (trades?.sale?.companies ?? []).map((company, index) =>
    companyRow("sale", company, index, columns, columnIdSet, parentMap)
  );
  const adjustmentRows = (movements ?? [])
    .map((movement) => movementRow(movement, columns, columnIdSet, parentMap))
    .filter((row) => row.touches);

  const opening = stockRow("opening", "전일 재고", prevStock, columns);
  const closing = stockRow("closing", "금일 재고", stock, columns);
  const purchaseTotal = sumRows("purchase-total", "매입 계", purchaseRows, columns);
  const saleTotal = sumRows("sale-total", "매출 계", saleRows, columns);
  const adjustmentTotal = sumRows("adjustment-total", "조정 계", adjustmentRows, columns);

  // 전일 + 매입 - 매출 + 조정 과 금일 재고가 다르면 차이를 보여 준다(보정 내역 누락 등 확인용)
  const differences = {};
  columns.forEach(({ itemId: id }) => {
    const expected = opening.values[id] + purchaseTotal.values[id] - saleTotal.values[id] + adjustmentTotal.values[id];
    const difference = round(closing.values[id] - expected);
    if (difference !== 0) differences[id] = difference;
  });

  return {
    columns,
    opening,
    purchase: { rows: purchaseRows, total: purchaseTotal },
    sale: { rows: saleRows, total: saleTotal },
    adjustment: { rows: adjustmentRows, total: adjustmentTotal },
    closing,
    differences,
  };
};
