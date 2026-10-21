import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../contract/hooks/useToast";
import {
  deleteDiscordMessage,
  fetchDataSources,
  fetchDiscordMessages,
  sendDiscordMessage,
  updateDiscordMessage,
} from "../api/discordMessageApi";
import { LIST_PATH, toRequestBody } from "../constants";

export const useDiscordMessageList = () => {
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [dataSources, setDataSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [sendResult, setSendResult] = useState(null);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchDiscordMessages();
      setMessages(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setMessages([]);
      setError(loadError.message || "메시지 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
    // 데이터 종류 이름표용. 실패해도 목록은 type 값으로 보여 준다.
    fetchDataSources()
      .then((data) => setDataSources(Array.isArray(data) ? data : []))
      .catch(() => setDataSources([]));
  }, [loadMessages]);

  const getDataSourceLabel = (type) =>
    dataSources.find((source) => source.type === type)?.label ?? type;

  // 사용 여부 전용 API가 없어 메시지 전체 값으로 PUT 한다.
  const handleToggleEnabled = async (message) => {
    setBusyId(message.id);
    try {
      const updated = await updateDiscordMessage(message.id, {
        ...toRequestBody(message),
        enabled: !message.enabled,
      });
      setMessages((current) =>
        current.map((item) =>
          item.id === message.id ? (updated ?? { ...item, enabled: !message.enabled }) : item
        )
      );
      showToast("success", message.enabled ? "사용 안 함으로 바꿨습니다." : "사용으로 바꿨습니다.");
    } catch (toggleError) {
      showToast("error", toggleError.message || "사용 여부를 바꾸지 못했습니다.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (message) => {
    if (!window.confirm(`'${message.name}' 메시지를 삭제하시겠습니까?\n삭제한 메시지는 복구할 수 없습니다.`)) {
      return;
    }

    setBusyId(message.id);
    try {
      await deleteDiscordMessage(message.id);
      setMessages((current) => current.filter((item) => item.id !== message.id));
      showToast("success", "메시지를 삭제했습니다.");
    } catch (deleteError) {
      showToast("error", deleteError.message || "메시지를 삭제하지 못했습니다.");
    } finally {
      setBusyId(null);
    }
  };

  const handleSendNow = async (message) => {
    if (!window.confirm(`'${message.name}' 메시지를 '${message.channel}' 채널로 지금 발송하시겠습니까?\n실제 디스코드 채널로 나갑니다.`)) {
      return;
    }

    setBusyId(message.id);
    setSendResult(null);
    try {
      const result = await sendDiscordMessage(message.id);
      setSendResult({ name: message.name, ...result });
      if (result?.sent) {
        showToast("success", "메시지를 발송했습니다.");
        await loadMessages();
      }
    } catch (sendError) {
      showToast("error", sendError.message || "메시지를 발송하지 못했습니다.");
    } finally {
      setBusyId(null);
    }
  };

  return {
    toast,
    onCreate: () => navigate(`${LIST_PATH}/new`),
    list: {
      messages,
      loading,
      error,
      busyId,
      getDataSourceLabel,
      onEdit: (message) => navigate(`${LIST_PATH}/${message.id}/edit`),
      onToggleEnabled: handleToggleEnabled,
      onDelete: handleDelete,
      onSendNow: handleSendNow,
    },
    sendResult: {
      result: sendResult,
      onClose: () => setSendResult(null),
    },
  };
};
