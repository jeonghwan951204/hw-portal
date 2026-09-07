import { useState } from "react";
import { useNavigate } from "react-router-dom";

let fieldSequence = 0;
const nextFieldId = () => `company-field-${++fieldSequence}`;

const createValueItem = (label = "") => ({ id: nextFieldId(), label, value: "" });
const createBankAccount = (label = "") => ({
  id: nextFieldId(),
  label,
  bankName: "",
  accountNumber: "",
});

const createInitialForm = () => ({
  type: "PURCHASE",
  name: "",
  representative: "",
  businessNumber: "",
  bankAccounts: [createBankAccount("거래용"), createBankAccount("세금용")],
  phoneNumbers: [createValueItem("대표전화"), createValueItem("팩스")],
  emails: [createValueItem("세금계산서")],
  addresses: [createValueItem("사업장")],
  memo: "",
  attachments: [],
});

const ITEM_FACTORIES = {
  bankAccounts: () => createBankAccount(),
  phoneNumbers: () => createValueItem(),
  emails: () => createValueItem(),
  addresses: () => createValueItem(),
};

export function useCompanyForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState(createInitialForm);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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
    setSuccessMessage("");
  };

  const removeAttachment = (fileId) => {
    setForm((current) => ({
      ...current,
      attachments: current.attachments.filter((file) => file.id !== fileId),
    }));
  };

  const submit = () => {
    if (!form.name.trim()) {
      setError("회사명을 입력해 주세요.");
      return;
    }
    if (!form.businessNumber.trim()) {
      setError("사업자등록번호를 입력해 주세요.");
      return;
    }
    setError("");
    setSuccessMessage("목업 등록이 완료되었습니다. API 연동 전이므로 서버에는 저장되지 않습니다.");
  };

  return {
    form,
    error,
    successMessage,
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
