import { useCallback, useEffect, useMemo, useState } from "react";
import { createItem, deleteItem, fetchItems, updateItem } from "../api/itemApi";
import { flattenItemTree, matchesItemKeyword, withTreeLines } from "../constants";

let aliasFieldId = 0;

// 별칭 입력칸 한 줄. id 는 렌더링 key 용도로만 쓰고 API 로 보내지 않는다.
const createAliasField = (value = "") => ({ id: ++aliasFieldId, value });

// 등록 모달의 빈 폼. 하위 품목 추가로 열면 상위 품목이 미리 선택된다.
const createEmptyItemForm = (parent = null) => ({
  name: "",
  parentId: parent ? String(parent.id) : "",
  aliases: [createAliasField()],
});

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
