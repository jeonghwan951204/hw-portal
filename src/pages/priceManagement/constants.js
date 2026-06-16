export const PAGE_SIZE = 20;

// 카테고리별 품목 정보
export const CATEGORY_ITEMS = {
  hojae: {
    name: "호재메탈",
    items: ["candy", "aCopper", "sangCopper", "joongCopper", "paCopper"],
    itemName: ["캔디", "A동", "상동", "중동", "파동"],
    mapping: {
      candy: "캔디",
      aCopper: "A동",
      sangCopper: "상동",
      joongCopper: "중동",
      paCopper: "파동",
    },
  },
  woonam: {
    name: "우남비철유통",
    items: ["candy", "aCopper"],
    itemName: ["캔디", "A동"],
    mapping: {
      candy: "캔디",
      aCopper: "A동",
    },
  },
};
