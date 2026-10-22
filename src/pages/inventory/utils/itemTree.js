// 품목 API 목록({ id, name, parentId }) → 트리 순서(부모 바로 아래 자식)로 펼친 목록 + depth
export const orderItemTree = (items) => {
  const ids = new Set(items.map((item) => String(item.id)));
  const childrenOf = new Map();
  items.forEach((item) => {
    // 상위 품목이 목록에 없으면 최상위로 취급한다
    const parentKey = item.parentId != null && ids.has(String(item.parentId)) ? String(item.parentId) : "";
    if (!childrenOf.has(parentKey)) childrenOf.set(parentKey, []);
    childrenOf.get(parentKey).push(item);
  });

  const ordered = [];
  const visit = (parentKey, depth) => {
    (childrenOf.get(parentKey) ?? []).forEach((item) => {
      ordered.push({ ...item, depth });
      visit(String(item.id), depth + 1);
    });
  };
  visit("", 0);
  return ordered;
};

// 재고 응답 items 를 품목 API(/api/items) 응답 순서로 다시 정렬한다 — 부모 바로 아래 자식 트리 순서는 유지.
// 같은 단계 품목끼리 품목 API 순서를 따르고, 품목 API 에 없는 품목(비활성 등)은 그 단계 맨 뒤에 서버 순서대로 둔다.
// 품목 목록을 아직 못 받았으면 서버 순서 그대로 둔다.
export const sortStockItemsByItemOrder = (stockItems, items) => {
  if (items.length === 0 || stockItems.length === 0) return stockItems;
  const orderOf = new Map(items.map((item, index) => [String(item.id), index]));
  const rank = (row) => orderOf.get(String(row.itemId)) ?? Number.MAX_SAFE_INTEGER;
  const ids = new Set(stockItems.map((row) => String(row.itemId)));
  const childrenOf = new Map();
  stockItems.forEach((row) => {
    // 상위 품목이 응답에 없으면(품목 선택 조회 등) 최상위로 취급한다
    const parentKey = row.parentItemId != null && ids.has(String(row.parentItemId)) ? String(row.parentItemId) : "";
    if (!childrenOf.has(parentKey)) childrenOf.set(parentKey, []);
    childrenOf.get(parentKey).push(row);
  });

  const ordered = [];
  const visit = (parentKey) => {
    // Array.prototype.sort 는 안정 정렬이라 순번이 같으면(품목 API 에 없음) 서버 순서가 유지된다
    [...(childrenOf.get(parentKey) ?? [])]
      .sort((a, b) => rank(a) - rank(b))
      .forEach((row) => {
        ordered.push(row);
        visit(String(row.itemId));
      });
  };
  visit("");
  return ordered;
};

// 재고 응답 items(트리 순서) 중 접힌 상위 품목 아래에 있는 행을 숨긴다
export const filterCollapsedRows = (rows, collapsedIds) => {
  if (collapsedIds.size === 0) return rows;
  const parentOf = new Map(rows.map((row) => [String(row.itemId), row.parentItemId == null ? null : String(row.parentItemId)]));
  const isHidden = (row) => {
    let current = row.parentItemId == null ? null : String(row.parentItemId);
    while (current != null) {
      if (collapsedIds.has(current)) return true;
      current = parentOf.get(current) ?? null;
    }
    return false;
  };
  return rows.filter((row) => !isHidden(row));
};

// 응답 목록 안에 자식 행이 있는 품목 id 집합
export const parentIdsOf = (rows) =>
  new Set(rows.filter((row) => row.parentItemId != null).map((row) => String(row.parentItemId)));
