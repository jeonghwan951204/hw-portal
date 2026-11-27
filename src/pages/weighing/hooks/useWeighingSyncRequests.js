import { useEffect, useState } from "react";
import { useConfirm } from "../../../hooks/useConfirm";
import {
  cancelWeighingSyncRequest,
  createWeighingSyncRequest,
  fetchWeighingSyncRequests,
  retryWeighingSyncRequest,
} from "../api/weighingApi";
import { getSyncRequestToday, isSyncRequestInProgress, validateSyncRequestDates } from "../utils/syncRequests";

const POLL_INTERVAL_MS = 15_000;
const IN_PROGRESS_CODE = "WEIGHING_SYNC_REQUEST_IN_PROGRESS";
const IN_PROGRESS_MESSAGE = "진행 중인 요청이 있습니다. 끝나거나 취소한 뒤 요청하세요.";
const REFRESH_ERROR_CODES = new Set([
  IN_PROGRESS_CODE,
  "WEIGHING_SYNC_REQUEST_NOT_FOUND",
  "WEIGHING_SYNC_REQUEST_STATE_CONFLICT",
]);

export function useWeighingSyncRequests() {
  const [form, setForm] = useState({ sourceCode: "", dateFrom: "", dateTo: "" });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [revision, setRevision] = useState(0);
  const [pendingAction, setPendingAction] = useState(false);
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");
  const { confirm, confirmModal } = useConfirm();

  useEffect(() => {
    const controller = new AbortController();
    let timer;
    let hasInProgress = false;

    const load = async () => {
      try {
        const response = await fetchWeighingSyncRequests(page, controller.signal);
        if (controller.signal.aborted) return;
        setResult(response);
        setListError("");
        hasInProgress = response.content.some(isSyncRequestInProgress);
      } catch (error) {
        if (controller.signal.aborted) return;
        setListError(error.code ? error.message : "요청 목록을 불러오지 못했습니다.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          if (hasInProgress) timer = setTimeout(load, POLL_INTERVAL_MS);
        }
      }
    };

    load();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [page, revision]);

  const reload = (nextPage = page) => {
    if (nextPage !== page) setResult(null);
    setPage(nextPage);
    setLoading(true);
    setListError("");
    setRevision((current) => current + 1);
  };

  const requests = result?.content ?? [];
  const today = getSyncRequestToday();
  const dateError = validateSyncRequestDates(form, today);
  const hasInProgressForSource = (sourceCode) => requests.some(
    (request) => request.sourceCode === sourceCode && isSyncRequestInProgress(request),
  );
  const formBlocked = hasInProgressForSource(form.sourceCode);
  const canSubmit = !pendingAction && !loading && !formBlocked && !dateError &&
    Boolean(form.sourceCode && form.dateFrom && form.dateTo);

  const runAction = async (action, { nextPage = page, setError, fallback }) => {
    setPendingAction(true);
    setFormError("");
    setActionError("");
    try {
      await action();
      reload(nextPage);
    } catch (error) {
      const serverMessage = error.code ? error.message : fallback;
      setError(error.code === IN_PROGRESS_CODE ? IN_PROGRESS_MESSAGE : serverMessage);
      if (REFRESH_ERROR_CODES.has(error.code)) reload();
    } finally {
      setPendingAction(false);
    }
  };

  const submit = () => {
    if (!canSubmit) return;
    return runAction(() => createWeighingSyncRequest(form), {
      nextPage: 1,
      setError: setFormError,
      fallback: "기간 동기화 요청을 등록하지 못했습니다.",
    });
  };

  const cancel = async (request) => {
    if (pendingAction || loading) return;
    const confirmed = await confirm({
      title: "기간 동기화 요청 취소",
      message: request.status === "RUNNING"
        ? "계근 PC가 요청을 처리 중입니다. 취소해도 이미 보낸 데이터는 반영된 상태로 남습니다. 취소할까요?"
        : "계근 PC가 아직 가져가지 않은 요청입니다. 취소할까요?",
      confirmLabel: "요청 취소",
      cancelLabel: "돌아가기",
      danger: true,
    });
    if (!confirmed) return;
    await runAction(() => cancelWeighingSyncRequest(request.requestId), {
      setError: setActionError,
      fallback: "기간 동기화 요청을 취소하지 못했습니다.",
    });
  };

  const retry = (request) => {
    if (pendingAction || loading || hasInProgressForSource(request.sourceCode)) return;
    return runAction(() => retryWeighingSyncRequest(request.requestId), {
      nextPage: 1,
      setError: setActionError,
      fallback: "기간 동기화를 다시 요청하지 못했습니다.",
    });
  };

  return {
    form: {
      values: form,
      today,
      error: dateError || formError,
      inProgressMessage: formBlocked ? IN_PROGRESS_MESSAGE : "",
      canSubmit,
      onChange: (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
        setFormError("");
      },
      onSubmit: submit,
    },
    list: {
      requests,
      loading,
      listError,
      actionError,
      pendingAction,
      hasInProgressForSource,
      onCancel: cancel,
      onRetry: retry,
      onReload: () => reload(),
    },
    pagination: {
      currentPage: page,
      totalPages: result?.totalPages ?? 0,
      onPageChange: (nextPage) => {
        if (!pendingAction && nextPage !== page) reload(nextPage);
      },
    },
    confirmModal,
    pendingAction,
  };
}
