import { useEffect, useState } from "react";
import { fetchItems } from "../../items/api/itemApi";

// 수기 품목 입력용 내부 품목 목록. 불러오지 못해도 품목명 직접 입력은 가능하다.
export function useItemOptions(enabled = true) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;
    fetchItems()
      .then((list) => {
        if (alive) setItems(list ?? []);
      })
      .catch(() => {
        if (alive) setItems([]);
      });
    return () => {
      alive = false;
    };
  }, [enabled]);

  return items;
}

// 입력한 품목명이 내부 품목명과 정확히 같으면 그 품목에 연결한다.
export const matchItemId = (items, name) => items.find((item) => item.name === name.trim())?.id ?? null;
