import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createMockCompany,
  getMockCompany,
  updateMockCompany,
} from "../api/companyMockApi";

let fieldSequence = 0;
const nextFieldId = () => `company-field-${++fieldSequence}`;

const createValueItem = (label = "", value = "") => ({
  id: nextFieldId(),
  label,
  value,
});
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
  bankAccounts: [createBankAccount("거래용"), createBankAccount("세금용")],
  phoneNumbers: [createValueItem("대표전화"), createValueItem("팩스")],
  emails: [createValueItem("세금계산서")],
  addresses: [createValueItem("사업장")],
  memo: "",
  attachments: [],
});

const createFormFromCompany = (company) => ({
  ...company,
  bankAccounts: company.bankAccounts.map(({ label, bankName, accountNumber }) =>
    createBankAccount(label, bankName, accountNumber)
  ),
  phoneNumbers: company.phoneNumbers.map(({ label, value }) => createValueItem(label, value)),
  emails: company.emails.map(({ label, value }) => createValueItem(label, value)),
  addresses: company.addresses.map(({ label, value }) => createValueItem(label, value)),
  attachments: company.attachments.map((file) => ({ ...file })),
});

const ITEM_FACTORIES = {
  bankAccounts: () => createBankAccount(),
  phoneNumbers: () => createValueItem(),
  emails: () => createValueItem(),
  addresses: () => createValueItem(),
};

export function useCompanyForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = id !== undefined;
  const [existingCompany] = useState(() => (isEdit ? getMockCompany(id) : null));
  const [form, setForm] = useState(() =>
    existingCompany ? createFormFromCompany(existingCompany) : createInitialForm()
  );
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

    if (isEdit) {
      updateMockCompany(id, form);
    } else {
      createMockCompany(form);
    }
    setError("");
    setSuccessMessage(
      `목업 ${isEdit ? "수정" : "등록"}이 완료되었습니다. 같은 브라우저 탭에서 목록에 반영됩니다.`
    );
  };

  return {
    form,
    isEdit,
    notFound: isEdit && !existingCompany,
    error,
    successMessage,
    submitLabel: isEdit ? "수정 완료" : "등록",
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
