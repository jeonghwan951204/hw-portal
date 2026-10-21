import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "../../contract/hooks/useToast";
import {
  createDiscordMessage,
  fetchChannels,
  fetchDataSources,
  fetchDiscordMessage,
  previewDiscordMessage,
  updateDiscordMessage,
} from "../api/discordMessageApi";
import {
  DAYS,
  DEFAULT_CHANNEL,
  getSettingLabel,
  getSettingType,
  LIST_PATH,
  toTimeInput,
} from "../constants";

const createInitialForm = () => ({
  name: "",
  dataSource: "",
  channel: DEFAULT_CHANNEL,
  content: "",
  settings: {},
  sendTime: "06:00",
  sendDays: [],
  enabled: true,
});

const createFormFromMessage = (message) => ({
  name: message.name ?? "",
  dataSource: message.dataSource ?? "",
  channel: message.channel ?? DEFAULT_CHANNEL,
  content: message.content ?? "",
  settings: message.settings ?? {},
  sendTime: toTimeInput(message.sendTime),
  sendDays: message.sendDays ?? [],
  enabled: message.enabled ?? true,
});

// 기본 상수를 복사해 입력란끼리 배열을 공유하지 않게 한다.
const cloneSettings = (settings) => JSON.parse(JSON.stringify(settings ?? {}));

const isEmptyNumber = (value) => value === "" || value === null || Number.isNaN(Number(value));

export function useDiscordMessageForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = id !== undefined;
  const { toast, showToast } = useToast();
  const contentRef = useRef(null);

  const [form, setForm] = useState(createInitialForm);
  const [loading, setLoading] = useState(isEdit);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [dataSources, setDataSources] = useState([]);
  const [dataSourcesLoading, setDataSourcesLoading] = useState(true);
  const [dataSourcesError, setDataSourcesError] = useState("");

  const [channels, setChannels] = useState([]);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [channelsError, setChannelsError] = useState(false);

  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState(null);
  const [previewError, setPreviewError] = useState("");

  useEffect(() => {
    let active = true;

    fetchDataSources()
      .then((data) => {
        if (active) setDataSources(Array.isArray(data) ? data : []);
      })
      .catch((fetchError) => {
        if (active) setDataSourcesError(fetchError.message || "데이터 종류를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (active) setDataSourcesLoading(false);
      });

    // 채널 목록 서버에 연결하지 못하면(502) 직접 입력하게 한다.
    fetchChannels()
      .then((data) => {
        if (active) setChannels(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setChannelsError(true);
      })
      .finally(() => {
        if (active) setChannelsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isEdit) return;

    let active = true;
    setLoading(true);
    fetchDiscordMessage(id)
      .then((message) => {
        if (active) setForm(createFormFromMessage(message));
      })
      .catch((fetchError) => {
        if (!active) return;
        if (fetchError.status === 404) setNotFound(true);
        else setLoadError(fetchError.message || "메시지를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, isEdit]);

  // 새 메시지는 첫 번째 데이터 종류와 그 기본 템플릿·상수로 시작한다.
  useEffect(() => {
    if (isEdit || dataSources.length === 0) return;
    setForm((current) => {
      if (current.dataSource) return current;
      const [first] = dataSources;
      return {
        ...current,
        dataSource: first.type,
        content: first.defaultContent ?? "",
        settings: cloneSettings(first.defaultSettings),
      };
    });
  }, [isEdit, dataSources]);

  const selectedDataSource = dataSources.find((source) => source.type === form.dataSource) ?? null;

  // 입력란 모양은 데이터 종류의 기본 상수를 따르고, 기본값에 없는 키는 현재 값으로 판단한다.
  const defaultSettings = selectedDataSource?.defaultSettings ?? {};
  const settingFields = [...new Set([...Object.keys(defaultSettings), ...Object.keys(form.settings)])]
    .map((key) => ({
      key,
      label: getSettingLabel(key),
      type: getSettingType(key in defaultSettings ? defaultSettings[key] : form.settings[key]),
      value: form.settings[key],
    }));

  const channelOptions = form.channel && !channels.includes(form.channel)
    ? [...channels, form.channel]
    : channels;

  const changeField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  };

  const applyDefaults = (source) => ({
    content: source?.defaultContent ?? "",
    settings: cloneSettings(source?.defaultSettings),
  });

  const changeDataSource = (type) => {
    if (type === form.dataSource) return;
    const source = dataSources.find((item) => item.type === type);

    // 수정 중에는 기존 템플릿을 지킬지 묻는다. 생성 중에는 바로 기본값으로 채운다.
    const useDefaults = !isEdit ||
      window.confirm("데이터 종류를 바꾸면 기존 템플릿이 맞지 않을 수 있습니다.\n템플릿과 상수를 새 데이터 종류의 기본값으로 바꾸시겠습니까?");

    setForm((current) => ({
      ...current,
      dataSource: type,
      ...(useDefaults ? applyDefaults(source) : {}),
    }));
    setPreviewResult(null);
    setError("");
  };

  const resetToDefaults = () => {
    if (!selectedDataSource) return;
    if (!window.confirm("템플릿과 상수를 기본값으로 되돌리시겠습니까?\n입력란만 바뀌며, 저장은 따로 눌러야 합니다.")) {
      return;
    }
    setForm((current) => ({ ...current, ...applyDefaults(selectedDataSource) }));
    setError("");
  };

  const toggleDay = (day) => {
    setForm((current) => {
      const selected = current.sendDays.includes(day)
        ? current.sendDays.filter((value) => value !== day)
        : [...current.sendDays, day];
      return {
        ...current,
        sendDays: DAYS.map((item) => item.value).filter((value) => selected.includes(value)),
      };
    });
    setError("");
  };

  const changeSetting = (key, value) => {
    setForm((current) => ({ ...current, settings: { ...current.settings, [key]: value } }));
    setError("");
  };

  const changeSettingItem = (key, index, value) => {
    setForm((current) => ({
      ...current,
      settings: {
        ...current.settings,
        [key]: (current.settings[key] ?? []).map((item, itemIndex) => (itemIndex === index ? value : item)),
      },
    }));
    setError("");
  };

  const addSettingItem = (key) => {
    setForm((current) => ({
      ...current,
      settings: { ...current.settings, [key]: [...(current.settings[key] ?? []), ""] },
    }));
  };

  const removeSettingItem = (key, index) => {
    setForm((current) => ({
      ...current,
      settings: {
        ...current.settings,
        [key]: (current.settings[key] ?? []).filter((_, itemIndex) => itemIndex !== index),
      },
    }));
    setError("");
  };

  // 커서 위치에 {{이름}} 을 넣고, 넣은 뒤로 커서를 옮긴다.
  const insertVariable = (name) => {
    const token = `{{${name}}}`;
    const textarea = contentRef.current;
    const start = textarea?.selectionStart ?? form.content.length;
    const end = textarea?.selectionEnd ?? form.content.length;

    setForm((current) => ({
      ...current,
      content: current.content.slice(0, start) + token + current.content.slice(end),
    }));
    window.requestAnimationFrame(() => {
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(start + token.length, start + token.length);
    });
  };

  // 요청용 상수 객체를 만든다. 비워 둔 숫자는 빼서 서버가 기본값으로 채우게 한다.
  const buildSettings = () => {
    const settings = {};
    settingFields.forEach(({ key, type, value }) => {
      if (value === undefined) return;

      if (type === "number") {
        if (!isEmptyNumber(value)) settings[key] = Number(value);
      } else if (type === "numberArray") {
        const items = (value ?? []).filter((item) => !isEmptyNumber(item)).map(Number);
        if (items.length > 0) settings[key] = items;
      } else {
        settings[key] = value;
      }
    });
    return settings;
  };

  const handlePreview = async () => {
    setPreviewError("");
    if (!form.dataSource) {
      setPreviewError("데이터 종류를 선택해주세요.");
      return;
    }
    if (!form.content.trim()) {
      setPreviewError("템플릿을 입력해주세요.");
      return;
    }
    setPreviewLoading(true);
    setPreviewResult(null);
    try {
      const result = await previewDiscordMessage({
        dataSource: form.dataSource,
        content: form.content,
        settings: buildSettings(),
      });
      setPreviewResult(result);
    } catch (previewFetchError) {
      setPreviewError(previewFetchError.message || "미리보기를 만들지 못했습니다.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const validate = () => {
    if (!form.name.trim()) return "이름을 입력해주세요.";
    if (!form.dataSource) return "데이터 종류를 선택해주세요.";
    if (!form.channel.trim()) return "채널을 입력해주세요.";
    if (!form.sendTime) return "발송 시각을 입력해주세요.";
    if (form.sendDays.length === 0) return "발송 요일을 하나 이상 선택해주세요.";
    if (!form.content.trim()) return "템플릿을 입력해주세요.";
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    const payload = {
      name: form.name.trim(),
      dataSource: form.dataSource,
      channel: form.channel.trim(),
      content: form.content,
      settings: buildSettings(),
      sendTime: form.sendTime,
      sendDays: form.sendDays,
      enabled: form.enabled,
    };

    setSubmitting(true);
    setError("");
    try {
      if (isEdit) await updateDiscordMessage(id, payload);
      else await createDiscordMessage(payload);
      navigate(LIST_PATH);
    } catch (submitError) {
      setError(submitError.message || "메시지를 저장하지 못했습니다.");
      showToast("error", "메시지를 저장하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    isEdit,
    loading,
    notFound,
    loadError,
    toast,
    onCancel: () => navigate(LIST_PATH),
    basic: {
      form,
      dataSources,
      dataSourcesLoading,
      dataSourcesError,
      selectedDataSource,
      channelOptions,
      channelsLoading,
      channelsError,
      onFieldChange: changeField,
      onDataSourceChange: changeDataSource,
      onToggleDay: toggleDay,
    },
    template: {
      content: form.content,
      contentRef,
      canReset: Boolean(selectedDataSource),
      onContentChange: (value) => changeField("content", value),
      onReset: resetToDefaults,
    },
    settings: {
      fields: settingFields,
      onChange: changeSetting,
      onItemChange: changeSettingItem,
      onItemAdd: addSettingItem,
      onItemRemove: removeSettingItem,
    },
    variables: {
      variables: selectedDataSource?.variables ?? [],
      onInsert: insertVariable,
    },
    preview: {
      loading: previewLoading,
      result: previewResult,
      error: previewError,
      onPreview: handlePreview,
    },
    actions: {
      error,
      submitting,
      onCancel: () => navigate(LIST_PATH),
    },
    onSubmit: handleSubmit,
  };
}
