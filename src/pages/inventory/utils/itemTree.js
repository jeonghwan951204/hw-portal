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
