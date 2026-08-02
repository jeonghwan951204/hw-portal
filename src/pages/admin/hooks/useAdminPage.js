import { useCallback, useEffect, useState } from "react";
import {
  createShareLink,
  deleteMember,
  fetchMembers,
  fetchShareLinks,
  updateMemberRole,
} from "../api/adminApi";
import { getMinimumExpiry, PAGE_SIZE } from "../constants";

const getPageData = (data) => ({
  content: data?.content ?? data?.items ?? data ?? [],
  totalPages: data?.page?.totalPages ?? data?.totalPages ?? 0,
  totalElements: data?.page?.totalElements ?? data?.totalElements ?? 0,
});

export const useAdminPage = () => {
  const [activeTab, setActiveTab] = useState("members");

  const [members, setMembers] = useState([]);
  const [memberPage, setMemberPage] = useState(1);
  const [memberTotalPages, setMemberTotalPages] = useState(0);
  const [memberTotalElements, setMemberTotalElements] = useState(0);
  const [memberLoading, setMemberLoading] = useState(true);
  const [memberError, setMemberError] = useState("");
  const [memberBusyId, setMemberBusyId] = useState(null);
  const [nameInput, setNameInput] = useState("");
  const [roleInput, setRoleInput] = useState("");
  const [memberFilters, setMemberFilters] = useState({ keyword: "", role: "" });

  const [shareLinks, setShareLinks] = useState([]);
  const [linkPage, setLinkPage] = useState(1);
  const [linkTotalPages, setLinkTotalPages] = useState(0);
  const [linkTotalElements, setLinkTotalElements] = useState(0);
  const [linkLoading, setLinkLoading] = useState(true);
  const [linkError, setLinkError] = useState("");
  const [linkSubmitting, setLinkSubmitting] = useState(false);
  const [createdLink, setCreatedLink] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [linkForm, setLinkForm] = useState({
    path: "/",
    role: "USER",
    expiredDt: getMinimumExpiry(),
  });

  const loadMembers = useCallback(async (page = 1, filters = memberFilters) => {
    setMemberLoading(true);
    setMemberError("");
    try {
      const data = getPageData(
        await fetchMembers({ page, size: PAGE_SIZE, ...filters })
      );
      setMembers(Array.isArray(data.content) ? data.content : []);
      setMemberTotalPages(data.totalPages);
      setMemberTotalElements(data.totalElements);
      setMemberPage(page);
    } catch {
      setMembers([]);
      setMemberError("회원 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setMemberLoading(false);
    }
  }, [memberFilters]);

  const loadShareLinks = useCallback(async (page = 1) => {
    setLinkLoading(true);
    setLinkError("");
    try {
      const data = await fetchShareLinks();
      const items = Array.isArray(data) ? data : [];
      const pageStart = (page - 1) * PAGE_SIZE;
      setShareLinks(items.slice(pageStart, pageStart + PAGE_SIZE));
      setLinkTotalPages(Math.ceil(items.length / PAGE_SIZE));
      setLinkTotalElements(items.length);
      setLinkPage(page);
    } catch {
      setShareLinks([]);
      setLinkError("공유링크 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLinkLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembers(1);
    // 기본 회원 관리 탭에 필요한 목록만 최초 조회한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = (nextTab) => {
    if (nextTab === activeTab) return;

    setActiveTab(nextTab);
    if (nextTab === "members") {
      loadMembers(memberPage);
      return;
    }
    loadShareLinks(linkPage);
  };

  const handleMemberSearch = (event) => {
    event.preventDefault();
    const nextFilters = { keyword: nameInput.trim(), role: roleInput };
    setMemberFilters(nextFilters);
    loadMembers(1, nextFilters);
  };

  const handleMemberReset = () => {
    setNameInput("");
    setRoleInput("");
    const nextFilters = { keyword: "", role: "" };
    setMemberFilters(nextFilters);
    loadMembers(1, nextFilters);
  };

  const handleRoleChange = async (member, role) => {
    if (member.role === role) return;

    setMemberBusyId(member.id);
    setMemberError("");
    try {
      await updateMemberRole(member.id, role);
      setMembers((current) =>
        current.map((item) =>
          item.id === member.id ? { ...item, role } : item
        )
      );
    } catch {
      setMemberError("회원 권한을 변경하지 못했습니다.");
    } finally {
      setMemberBusyId(null);
    }
  };

  const handleMemberDelete = async (member) => {
    if (!window.confirm(`'${member.name}' 회원을 삭제하시겠습니까?\n삭제한 회원은 복구할 수 없습니다.`)) {
      return;
    }

    setMemberBusyId(member.id);
    setMemberError("");
    try {
      await deleteMember(member.id);
      await loadMembers(memberPage);
    } catch {
      setMemberError("회원을 삭제하지 못했습니다.");
    } finally {
      setMemberBusyId(null);
    }
  };

  const handleLinkFormChange = (field, value) => {
    setLinkForm((current) => ({ ...current, [field]: value }));
    setCreatedLink("");
  };

  const handleCreateLink = async (event) => {
    event.preventDefault();
    setLinkError("");
    setCreatedLink("");

    const path = linkForm.path.trim();
    if (!path.startsWith("/")) {
      setLinkError("접속 경로는 /로 시작해야 합니다.");
      return;
    }
    if (!linkForm.expiredDt) {
      setLinkError("만료기한을 입력해주세요.");
      return;
    }

    setLinkSubmitting(true);
    try {
      const data = await createShareLink({
        type: "SIGNUP",
        path,
        role: linkForm.role,
        expiredDt: linkForm.expiredDt,
      });
      const linkId = data?.id;
      const shareUrl = data?.link ??
        (linkId ? `${window.location.origin}/signup/${linkId}` : "");
      setCreatedLink(shareUrl);
      setLinkForm({
        path: "/",
        role: "USER",
        expiredDt: getMinimumExpiry(),
      });
      await loadShareLinks(1);
    } catch {
      setLinkError("공유링크를 생성하지 못했습니다. 입력값을 확인해주세요.");
    } finally {
      setLinkSubmitting(false);
    }
  };

  const handleCopy = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopyMessage("링크를 복사했습니다.");
    } catch {
      setCopyMessage("복사하지 못했습니다. 링크를 직접 선택해주세요.");
    }
    window.setTimeout(() => setCopyMessage(""), 2000);
  };

  const getShareUrl = (link) => {
    if (link.link) return link.link;
    const id = link.id;
    return id ? `${window.location.origin}/signup/${id}` : "";
  };

  return {
    tabs: { activeTab, onChange: handleTabChange },
    members: {
      members,
      loading: memberLoading,
      error: memberError,
      totalElements: memberTotalElements,
      nameInput,
      roleInput,
      onNameChange: setNameInput,
      onRoleFilterChange: setRoleInput,
      onSearch: handleMemberSearch,
      onReset: handleMemberReset,
      onRoleChange: handleRoleChange,
      onDelete: handleMemberDelete,
      busyId: memberBusyId,
      pagination: {
        totalPages: memberTotalPages,
        currentPage: memberPage,
        onPageChange: loadMembers,
      },
    },
    links: {
      shareLinks,
      loading: linkLoading,
      error: linkError,
      totalElements: linkTotalElements,
      form: linkForm,
      submitting: linkSubmitting,
      createdLink,
      copyMessage,
      minimumExpiry: getMinimumExpiry(),
      onFormChange: handleLinkFormChange,
      onCreate: handleCreateLink,
      onCopy: handleCopy,
      getShareUrl,
      pagination: {
        totalPages: linkTotalPages,
        currentPage: linkPage,
        onPageChange: loadShareLinks,
      },
    },
  };
};
