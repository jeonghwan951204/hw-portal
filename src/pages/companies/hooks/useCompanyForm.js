import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createCompany, fetchCompanyDetail, updateCompany } from "../api/companyApi";

let fieldSequence = 0;
const nextFieldId = () => `company-field-${++fieldSequence}`;

const createValueItem = (label = "", value = "") => ({
  id: nextFieldId(),
  label,
  value,
});
const createAlias = (value = "") => ({ id: nextFieldId(), value });
const createBankAccount = (label = "", bankName = "", accountNumber = "") => ({
  id: nextFieldId(),
  label,
  bankName,
  accountNumber,
});

const createInitialForm = () => ({
  type: "PURCHASE",
  name: "",
  representative: "",
  businessNumber: "",
  aliases: [createAlias()],
  bankAccounts: [createBankAccount("거래용"), createBankAccount("세금용")],
  phoneNumbers: [createValueItem("대표전화"), createValueItem("팩스")],
  emails: [createValueItem("세금계산서")],
  addresses: [createValueItem("사업장")],
  memo: "",
  attachments: [],
});

const createFormFromCompany = (company) => ({
  ...company,
  aliases: company.aliases?.length
    ? company.aliases.map((alias) => createAlias(alias))
    : [createAlias()],
  bankAccounts: company.bankAccounts.map(({ label, bankName, accountNumber }) =>
    createBankAccount(label ?? "", bankName, accountNumber)
  ),
  phoneNumbers: company.phoneNumbers.map(({ label, value }) => createValueItem(label, value)),
  emails: company.emails.map(({ label, value }) => createValueItem(label, value)),
  addresses: company.addresses.map(({ label, value }) => createValueItem(label ?? "", value)),
  attachments: company.attachments.map((file) => ({ ...file })),
});

const ITEM_FACTORIES = {
  aliases: () => createAlias(),
  bankAccounts: () => createBankAccount(),
  phoneNumbers: () => createValueItem(),
  emails: () => createValueItem(),
  addresses: () => createValueItem(),
};

export function useCompanyForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = id !== undefined;
  const [form, setForm] = useState(createInitialForm);
  const [loading, setLoading] = useState(isEdit);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;

    let active = true;
    setLoading(true);
    fetchCompanyDetail(id)
      .then((company) => {
        if (active) setForm(createFormFromCompany(company));
      })
      .catch((fetchError) => {
        if (!active) return;
        if (fetchError.status === 404) setNotFound(true);
        else setLoadError(fetchError.message || "거래처 정보를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, isEdit]);

  const changeBasic = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setSuccessMessage("");
  };

  const changeItem = (group, itemId, field, value) => {
    setForm((current) => ({
      ...current,
      [group]: current[group].map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      ),
    }));
    setError("");
    setSuccessMessage("");
  };

  const addItem = (group) => {
    setForm((current) => ({
      ...current,
      [group]: [...current[group], ITEM_FACTORIES[group]()],
    }));
  };

  const removeItem = (group, itemId) => {
    setForm((current) => ({
      ...current,
      [group]: current[group].filter((item) => item.id !== itemId),
    }));
  };

  const addAttachments = (files) => {
    const nextFiles = Array.from(files).map((file) => ({
      id: `${file.name}-${file.lastModified}-${file.size}`,
      name: file.name,
      file,
    }));
    setForm((current) => ({
      ...current,
      attachments: [
        ...current.attachments,
        ...nextFiles.filter(
          (nextFile) => !current.attachments.some((file) => file.id === nextFile.id)
        ),
      ],
    }));
    setError("");
    setSuccessMessage("");
  };

  const removeAttachment = (fileId) => {
    setForm((current) => ({
      ...current,
      attachments: current.attachments.filter((file) => file.id !== fileId),
    }));
  };

  const submit = async () => {
    if (submitting) return;
    if (!form.name.trim()) {
      setError("회사명을 입력해 주세요.");
      return;
    }
    if (!form.businessNumber.trim()) {
      setError("사업자등록번호를 입력해 주세요.");
      return;
    }
    if (form.aliases.some((alias) => alias.value.trim())) {
      setError("거래처 별칭은 아직 서버 API에서 지원하지 않습니다.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMessage("");
    try {
      if (isEdit) await updateCompany(id, form);
      else await createCompany(form);
      setSuccessMessage(`거래처가 ${isEdit ? "수정" : "등록"}되었습니다.`);
    } catch (submitError) {
      setError(submitError.message || `거래처를 ${isEdit ? "수정" : "등록"}하지 못했습니다.`);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    form,
    isEdit,
    loading,
    notFound,
    loadError,
    error,
    successMessage,
    submitting,
    submitLabel: submitting ? "저장 중..." : isEdit ? "수정 완료" : "등록",
    onBasicChange: changeBasic,
    onItemChange: changeItem,
    onItemAdd: addItem,
    onItemRemove: removeItem,
    onAttachmentsAdd: addAttachments,
    onAttachmentRemove: removeAttachment,
    onSubmit: submit,
    onCancel: () => navigate("/companies"),
  };
}
