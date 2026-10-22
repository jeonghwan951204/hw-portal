import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createItem,
  deleteItem,
  fetchItems,
  updateItem,
  updateItemSortOrder,
} from "../api/itemApi";
import {
  applySiblingOrder,
  flattenItemTree,
  matchesItemKeyword,
  moveSiblingId,
  withTreeLines,
} from "../constants";

let aliasFieldId = 0;

// 별칭 입력칸 한 줄. id 는 렌더링 key 용도로만 쓰고 API 로 보내지 않는다.
const createAliasField = (value = "") => ({ id: ++aliasFieldId, value });

// 등록 모달의 빈 폼. 하위 품목 추가로 열면 상위 품목이 미리 선택된다.
const createEmptyItemForm = (parent = null) => ({
  name: "",
  parentId: parent ? String(parent.id) : "",
  aliases: [createAliasField()],
});

// 트리 행의 상위 품목 id(문자열). 최상위면 null. flattenItemTree 가 정한 계층을 그대로 따른다.
const parentKeyOf = (row) => row.ancestorIds[row.ancestorIds.length - 1] ?? null;

// 수정 모달의 초기 폼. 별칭이 없어도 입력칸 하나는 보이게 한다.
const createItemForm = (item) => ({
  name: item.name,
  parentId: item.parentId == null ? "" : String(item.parentId),
  aliases: item.aliases.length
    ? item.aliases.map((alias) => createAliasField(alias))
    : [createAliasField()],
});

export function useItemList() {
  const [sourceItems, setSourceItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  // 하위 품목을 접어 둔 품목 id(문자열) 집합. 기본은 모두 펼침.
  const [collapsedIds, setCollapsedIds] = useState(() => new Set());

  // 등록·수정 모달. editTarget 이 null 이면 등록, 값이 있으면 해당 품목 수정이다.
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(createEmptyItemForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // 드래그로 순서 바꾸기. dropTarget 은 { id, position: "before" | "after" } 로, 끌고 있는 품목을
  // 같은 상위 품목 아래 형제 품목(id)의 앞·뒤 어디에 놓을지 나타낸다.
  const [dragItemId, setDragItemId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [orderSaving, setOrderSaving] = useState(false);
  const [orderError, setOrderError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setSourceItems(await fetchItems());
    } catch (loadError) {
      setError(loadError.message || "품목 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const treeRows = useMemo(() => flattenItemTree(sourceItems), [sourceItems]);
  const filtered = keyword.trim() !== "";

  // 검색 중에는 일치한 품목과 그 상위 품목들을 함께 보여 계층 위치를 알 수 있게 하고,
  // 접기 상태는 무시한다. 검색어가 없으면 접힌 품목의 하위만 숨긴다.
  const visibleRows = useMemo(() => {
    if (!filtered) {
      return treeRows
        .filter((row) => !row.ancestorIds.some((id) => collapsedIds.has(id)))
        .map((row) => ({ ...row, matched: true }));
    }

    const matchedIds = new Set(
      treeRows
        .filter((row) => matchesItemKeyword(row.item, keyword))
        .map((row) => String(row.item.id))
    );
    const visibleIds = new Set();
    treeRows.forEach((row) => {
      if (!matchedIds.has(String(row.item.id))) return;
      visibleIds.add(String(row.item.id));
      row.ancestorIds.forEach((id) => visibleIds.add(id));
    });
    return treeRows
      .filter((row) => visibleIds.has(String(row.item.id)))
      .map((row) => ({ ...row, matched: matchedIds.has(String(row.item.id)) }));
  }, [collapsedIds, filtered, keyword, treeRows]);

  const rows = useMemo(() => withTreeLines(visibleRows), [visibleRows]);

  // 검색 중에는 숨은 형제 품목이 있어 순서를 정확히 보여줄 수 없으므로 드래그를 막는다.
  const sortable = !filtered && !orderSaving;
  const dragRow = useMemo(
    () => (dragItemId ? treeRows.find((row) => String(row.item.id) === dragItemId) ?? null : null),
    [dragItemId, treeRows]
  );
  const dragSiblingIds = useMemo(() => {
    if (!dragRow) return [];
    const parentKey = parentKeyOf(dragRow);
    return treeRows
      .filter((row) => row.depth === dragRow.depth && parentKeyOf(row) === parentKey)
      .map((row) => String(row.item.id));
  }, [dragRow, treeRows]);

  // 놓았을 때의 형제 순서. 놓을 곳이 없거나 순서가 그대로면 null.
  const nextSiblingIds = useMemo(() => {
    if (!dragItemId || !dropTarget) return null;
    const next = moveSiblingId(dragSiblingIds, dragItemId, dropTarget.id, dropTarget.position);
    return next.join() === dragSiblingIds.join() ? null : next;
  }, [dragItemId, dragSiblingIds, dropTarget]);

  // 놓을 위치 표시선. 형제 품목 뒤에 놓을 때는 그 품목의 보이는 하위 품목들까지 지난 마지막 행 아래에 긋는다.
  const dropIndicator = useMemo(() => {
    if (!nextSiblingIds || !dragRow) return null;
    const { id, position } = dropTarget;
    if (position === "before") return { rowId: id, edge: "top", depth: dragRow.depth };
    let index = rows.findIndex((row) => String(row.item.id) === id);
    while (rows[index + 1]?.ancestorIds.includes(id)) index += 1;
    return { rowId: String(rows[index].item.id), edge: "bottom", depth: dragRow.depth };
  }, [dragRow, dropTarget, nextSiblingIds, rows]);

  // 마우스가 올라간 행과 위·아래 절반 위치로 놓을 곳을 정한다. 놓을 수 있으면 true.
  // - 형제 품목 행: 그 앞·뒤
  // - 형제 품목의 하위 품목 행: 그 형제 품목 뒤 (하위 품목 사이로는 들어갈 수 없다)
  // - 끌고 있는 품목 자신·하위 품목, 다른 상위 품목 아래 행: 놓을 수 없음
  const dragOverRow = (row, position) => {
    if (!dragRow) return false;
    const rowId = String(row.item.id);
    let target = null;
    if (rowId !== dragItemId && !row.ancestorIds.includes(dragItemId)) {
      if (row.depth === dragRow.depth && parentKeyOf(row) === parentKeyOf(dragRow)) {
        target = { id: rowId, position };
      } else if (
        row.depth > dragRow.depth &&
        row.ancestorIds.slice(0, dragRow.depth).join() === dragRow.ancestorIds.join()
      ) {
        target = { id: row.ancestorIds[dragRow.depth], position: "after" };
      }
    }
    setDropTarget((current) =>
      current?.id === target?.id && current?.position === target?.position ? current : target
    );
    return target !== null;
  };

  const endDrag = () => {
    setDragItemId(null);
    setDropTarget(null);
  };

  // 화면 순서를 먼저 바꾸고 저장한다. 저장에 실패하면 이전 순서로 되돌린다.
  const dropItem = async () => {
    const orderedIds = nextSiblingIds;
    const parentKey = dragRow ? parentKeyOf(dragRow) : null;
    endDrag();
    if (!orderedIds || orderSaving) return;

    const byId = new Map(sourceItems.map((item) => [String(item.id), item]));
    const previousItems = sourceItems;
    setSourceItems(applySiblingOrder(sourceItems, orderedIds));
    setOrderSaving(true);
    setOrderError("");
    try {
      await updateItemSortOrder(
        parentKey == null ? null : byId.get(parentKey).id,
        orderedIds.map((id) => byId.get(id).id)
      );
    } catch (saveError) {
      setSourceItems(previousItems);
      setOrderError(saveError.message || "품목 순서를 저장하지 못했습니다.");
    } finally {
      setOrderSaving(false);
    }
  };

  // 상위 품목 선택지. 수정 중인 품목 자신과 그 하위 품목은 상위로 고를 수 없다.
  const parentOptions = useMemo(() => {
    const selfId = editTarget ? String(editTarget.id) : null;
    return treeRows
      .filter(
        (row) =>
          !selfId || (String(row.item.id) !== selfId && !row.ancestorIds.includes(selfId))
      )
      .map((row) => ({
        value: String(row.item.id),
        label: `${"   ".repeat(row.depth)}${row.depth ? "└ " : ""}${row.item.name}`,
      }));
  }, [editTarget, treeRows]);

  const deleteTargetChildCount = useMemo(
    () =>
      deleteTarget
        ? sourceItems.filter((item) => String(item.parentId) === String(deleteTarget.id)).length
        : 0,
    [deleteTarget, sourceItems]
  );

  const toggleCollapse = (itemId) => {
    setCollapsedIds((current) => {
      const next = new Set(current);
      const key = String(itemId);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const openCreate = (parent = null) => {
    setEditTarget(null);
    setForm(createEmptyItemForm(parent));
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (item) => {
    setEditTarget(item);
    setForm(createItemForm(item));
    setFormError("");
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
    setFormError("");
  };

  const changeAlias = (aliasId, value) => {
    setForm((current) => ({
      ...current,
      aliases: current.aliases.map((alias) => (alias.id === aliasId ? { ...alias, value } : alias)),
    }));
  };

  const addAlias = () => {
    setForm((current) => ({ ...current, aliases: [...current.aliases, createAliasField()] }));
  };

  // 마지막 입력칸을 지우면 빈 칸 하나를 남겨 입력 위치가 사라지지 않게 한다.
  const removeAlias = (aliasId) => {
    setForm((current) => {
      const aliases = current.aliases.filter((alias) => alias.id !== aliasId);
      return { ...current, aliases: aliases.length ? aliases : [createAliasField()] };
    });
  };

  const submitForm = async () => {
    if (saving) return;

    // 품목명 중복은 서버에서 검사하고, 거절되면 응답 메시지를 그대로 보여준다.
    if (!form.name.trim()) {
      setFormError("품목명을 입력해 주세요.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      if (editTarget) {
        await updateItem(editTarget.id, form);
      } else {
        await createItem(form);
      }
      // 하위 품목을 추가한 상위 품목이 접혀 있으면 펼쳐서 방금 등록한 품목이 보이게 한다.
      if (form.parentId) {
        setCollapsedIds((current) => {
          const next = new Set(current);
          next.delete(form.parentId);
          return next;
        });
      }
      setFormOpen(false);
      await loadItems();
    } catch (saveError) {
      setFormError(saveError.message || "품목을 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting || deleteTargetChildCount > 0) return;

    setDeleting(true);
    setDeleteError("");
    try {
      await deleteItem(deleteTarget.id);
      setSourceItems((current) => current.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (deleteFailure) {
      setDeleteError(deleteFailure.message || "품목을 삭제하지 못했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  return {
    toolbar: {
      keyword,
      onKeywordChange: setKeyword,
    },
    list: {
      rows,
      filtered,
      matchedCount: rows.filter((row) => row.matched).length,
      totalCount: sourceItems.length,
      collapsedIds,
      loading,
      error,
      onRetry: loadItems,
      onToggleCollapse: toggleCollapse,
      onExpandAll: () => setCollapsedIds(new Set()),
      onCollapseAll: () =>
        setCollapsedIds(
          new Set(treeRows.filter((row) => row.childCount > 0).map((row) => String(row.item.id)))
        ),
      onAddChild: openCreate,
      onEdit: openEdit,
      onDeleteRequest: (item) => {
        setDeleteError("");
        setDeleteTarget(item);
      },
      sortable,
      dragItemId,
      dropIndicator,
      orderSaving,
      orderError,
      onDragStart: (item) => {
        setOrderError("");
        setDragItemId(String(item.id));
      },
      onDragOverRow: dragOverRow,
      onDrop: dropItem,
      onDragEnd: endDrag,
    },
    formModal: {
      open: formOpen,
      mode: editTarget ? "edit" : "create",
      form,
      parentOptions,
      saving,
      error: formError,
      onNameChange: (name) => setForm((current) => ({ ...current, name })),
      onParentChange: (parentId) => setForm((current) => ({ ...current, parentId })),
      onAliasChange: changeAlias,
      onAliasAdd: addAlias,
      onAliasRemove: removeAlias,
      onSubmit: submitForm,
      onCancel: closeForm,
    },
    deleteModal: {
      item: deleteTarget,
      childCount: deleteTargetChildCount,
      deleting,
      error: deleteError,
      onConfirm: confirmDelete,
      onCancel: () => {
        if (deleting) return;
        setDeleteError("");
        setDeleteTarget(null);
      },
    },
    onCreate: openCreate,
  };
}
