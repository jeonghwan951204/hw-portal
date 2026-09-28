// 품목명·별칭 부분검색(대소문자·공백 무시)
const normalize = (value) => String(value ?? "").replace(/\s+/g, "").toLowerCase();

export const matchesItemKeyword = (item, keyword) => {
  const target = normalize(keyword);
  if (!target) return true;
  return [item.name, ...item.aliases].some((value) => normalize(value).includes(target));
};

// 상위 품목 id 기준으로 품목을 트리 순서(상위 → 하위)의 행 배열로 펼친다.
// 각 행: { item, depth, childCount, ancestorIds(문자열 id, 최상위부터) }
// 상위 품목을 찾을 수 없거나 순환 참조에 걸린 품목은 최상위로 취급해 목록에서 빠지지 않게 한다.
export const flattenItemTree = (items) => {
  const ids = new Set(items.map((item) => String(item.id)));
  const childrenOf = new Map();
  items.forEach((item) => {
    const parentKey =
      item.parentId != null && ids.has(String(item.parentId)) ? String(item.parentId) : null;
    if (!childrenOf.has(parentKey)) childrenOf.set(parentKey, []);
    childrenOf.get(parentKey).push(item);
  });

  const rows = [];
  const visited = new Set();
  const visit = (item, depth, ancestorIds) => {
    const key = String(item.id);
    if (visited.has(key)) return;
    visited.add(key);
    const children = childrenOf.get(key) ?? [];
    rows.push({ item, depth, childCount: children.length, ancestorIds });
    children.forEach((child) => visit(child, depth + 1, [...ancestorIds, key]));
  };

  (childrenOf.get(null) ?? []).forEach((item) => visit(item, 0, []));
  items.forEach((item) => visit(item, 0, []));
  return rows;
};

// 화면에 보이는 행(트리 순서)에 트리 연결선 정보를 붙인다. 접기·검색으로 숨긴 행은 없는 것으로 계산한다.
// - isLast: 같은 상위 품목 아래에서 마지막으로 보이는 행인지 (연결선을 └ 로 끝낼지)
// - rails[k]: k+1단계 상위 품목 아래로 이어지는 행이 더 있어 k번째 칸에 세로선을 그을지
// - hasVisibleChildren: 바로 다음 행이 이 품목의 하위 품목인지 (접기 버튼 아래로 세로선을 그을지)
export const withTreeLines = (rows) => {
  // 뒤에서부터 훑으며 "더 얕은 행을 만나기 전에 해당 깊이의 행이 뒤에 있는지"를 기록한다.
  const seen = [];
  const result = new Array(rows.length);
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const row = rows[index];
    const { depth } = row;
    result[index] = {
      ...row,
      isLast: !seen[depth],
      rails: Array.from({ length: Math.max(depth - 1, 0) }, (_, level) => Boolean(seen[level + 1])),
      hasVisibleChildren: (rows[index + 1]?.depth ?? -1) > depth,
    };
    seen[depth] = true;
    seen.length = depth + 1;
  }
  return result;
};
