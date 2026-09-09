import { apiFetch } from "../../../utils/api";
import { USE_MOCK } from "../../../utils/env";
import * as companyMock from "./companyMock";

const asJson = async (response) => {
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body = await response.clone().json();
      if (body?.message) message = body.message;
    } catch {
      const text = await response.text().catch(() => "");
      if (text) message = text;
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return response.json();
};

const mapPhoneNumber = (phone) => ({
  recordId: phone.id ?? null,
  label: phone.label ?? "",
  value: phone.phoneNumber ?? "",
  listVisible: phone.isListVisible ?? phone.listVisible,
});

const mapCompanyListItem = (company) => ({
  id: company.companyId,
  name: company.companyName ?? "",
  businessNumber: company.businessRegistrationNumber ?? "",
  phoneNumbers: (company.phoneNumbers ?? []).map((phone) => ({
    ...mapPhoneNumber(phone),
    listVisible: true,
  })),
  bankAccounts: (company.bankAccounts ?? []).map((account) => ({
    ...account,
    recordId: account.id ?? null,
  })),
});

const mapCompanyDetail = (company) => ({
  id: company.companyId,
  type: company.type,
  name: company.companyName ?? "",
  representative: company.representativeName ?? "",
  businessNumber: company.businessRegistrationNumber ?? "",
  aliases: company.aliases ?? [],
  bankAccounts: (company.bankAccounts ?? []).map((account) => ({
    ...account,
    recordId: account.id ?? null,
  })),
  phoneNumbers: (company.phoneNumbers ?? []).map(mapPhoneNumber),
  emails: (company.emails ?? []).map((email) => ({
    recordId: email.id ?? null,
    label: email.label ?? "",
    value: email.email ?? "",
    listVisible: email.isListVisible ?? email.listVisible ?? false,
  })),
  addresses: (company.addresses ?? []).map((address) => ({
    recordId: address.id ?? null,
    label: address.label ?? "",
    value: address.address ?? "",
  })),
  memo: company.memo ?? "",
  attachments: (company.attachments ?? []).map((file) => ({
    id: file.fileId,
    fileId: file.fileId,
    name: file.fileName,
    downloadUrl: file.downloadUrl,
  })),
});

const nonEmpty = (value) => String(value ?? "").trim();
const optionalRecordId = (recordId) => (recordId == null ? {} : { id: recordId });

const createCompanyBody = (form, fileIds) => ({
  type: form.type,
  companyName: form.name.trim(),
  aliases: form.aliases.map((alias) => nonEmpty(alias.value)).filter(Boolean),
  representativeName: nonEmpty(form.representative) || null,
  businessRegistrationNumber: nonEmpty(form.businessNumber) || null,
  bankAccounts: form.bankAccounts
    .filter((account) => nonEmpty(account.bankName) || nonEmpty(account.accountNumber))
    .map((account) => ({
      ...optionalRecordId(account.recordId),
      label: nonEmpty(account.label),
      bankName: nonEmpty(account.bankName),
      accountNumber: nonEmpty(account.accountNumber),
    })),
  contacts: form.phoneNumbers
    .filter((phone) => nonEmpty(phone.value))
    .map((phone) => ({
      ...optionalRecordId(phone.recordId),
      label: nonEmpty(phone.label),
      phoneNumber: nonEmpty(phone.value),
      isListVisible: Boolean(phone.listVisible),
    })),
  emails: form.emails
    .filter((email) => nonEmpty(email.value))
    .map((email) => ({
      ...optionalRecordId(email.recordId),
      label: nonEmpty(email.label),
      email: nonEmpty(email.value),
      isListVisible: Boolean(email.listVisible),
    })),
  addresses: form.addresses
    .filter((address) => nonEmpty(address.value))
    .map((address) => ({
      ...optionalRecordId(address.recordId),
      label: nonEmpty(address.label),
      address: nonEmpty(address.value),
    })),
  memo: nonEmpty(form.memo) || null,
  fileIds,
});

export const fetchCompanyDetail = async (companyId) => {
  if (USE_MOCK) return companyMock.fetchCompanyDetail(companyId);
  return mapCompanyDetail(await asJson(await apiFetch(`/api/companies/${companyId}`)));
};

const phoneKey = (phone) => `${phone.label}\u0000${phone.value}`;

const applyPhoneVisibility = (detail, summary) => {
  const visiblePhoneKeys = new Set((summary?.phoneNumbers ?? []).map(phoneKey));
  return {
    ...detail,
    phoneNumbers: detail.phoneNumbers.map((phone) => ({
      ...phone,
      listVisible: phone.listVisible ?? visiblePhoneKeys.has(phoneKey(phone)),
    })),
  };
};

const fetchCompanySummaries = async () =>
  (await asJson(await apiFetch("/api/companies"))).map(mapCompanyListItem);

export const fetchCompanies = async () => {
  if (USE_MOCK) return companyMock.fetchCompanies();

  const summaries = await fetchCompanySummaries();
  return Promise.all(
    summaries.map(async (summary) => {
      try {
        return applyPhoneVisibility(await fetchCompanyDetail(summary.id), summary);
      } catch {
        return summary;
      }
    })
  );
};

// 회사명·활성 별칭 부분검색(대소문자 무시) → 일치하는 거래처 id 배열.
// 관리 목록 API 에는 검색 파라미터가 없어 셀렉트용 검색 API 로 id 를 받아 목록을 거른다.
export const fetchCompanySearchIds = async (keyword) => {
  if (USE_MOCK) return companyMock.fetchCompanySearchIds(keyword);

  const params = new URLSearchParams({ keyword });
  const options = await asJson(await apiFetch(`/api/companies/options?${params}`));
  return options.map((option) => option.id);
};

export const fetchCompanyForEdit = async (companyId) => {
  if (USE_MOCK) return companyMock.fetchCompanyForEdit(companyId);

  const [detail, summaries] = await Promise.all([
    fetchCompanyDetail(companyId),
    fetchCompanySummaries(),
  ]);
  const summary = summaries.find((company) => String(company.id) === String(companyId));
  return applyPhoneVisibility(detail, summary);
};

const uploadFile = async (file) => {
  const prepared = await asJson(
    await apiFetch("/api/files/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        originalFilename: file.name,
        contentType: file.type || "application/octet-stream",
        fileSize: file.size,
      }),
    })
  );
  if (!prepared.data?.fileId || !prepared.data?.uploadUrl) {
    throw new Error(`${file.name} 파일의 업로드 정보를 받지 못했습니다.`);
  }
  const { fileId, uploadUrl, requiredHeaders = {} } = prepared.data;
  const headers = new Headers();
  Object.entries(requiredHeaders).forEach(([name, values]) => {
    headers.set(name, Array.isArray(values) ? values.join(",") : values);
  });

  const uploadResponse = await fetch(uploadUrl, { method: "PUT", headers, body: file });
  if (!uploadResponse.ok) throw new Error(`${file.name} 파일 업로드에 실패했습니다.`);

  await asJson(await apiFetch(`/api/files/${fileId}/complete`, { method: "POST" }));
  return fileId;
};

const resolveFileIds = async (attachments) => {
  const existingIds = attachments.filter((file) => !file.file).map((file) => file.fileId ?? file.id);
  const uploadedIds = await Promise.all(
    attachments.filter((file) => file.file).map((file) => uploadFile(file.file))
  );
  return [...existingIds, ...uploadedIds];
};

export const createCompany = async (form) => {
  if (USE_MOCK) return companyMock.createCompany(form);

  const fileIds = await resolveFileIds(form.attachments);
  return asJson(
    await apiFetch("/api/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createCompanyBody(form, fileIds)),
    })
  );
};

export const updateCompany = async (companyId, form) => {
  if (USE_MOCK) return companyMock.updateCompany(companyId, form);

  const fileIds = await resolveFileIds(form.attachments);
  return asJson(
    await apiFetch(`/api/companies/${companyId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createCompanyBody(form, fileIds)),
    })
  );
};

export const deleteCompany = async (companyId) => {
  if (USE_MOCK) return companyMock.deleteCompany(companyId);
  return asJson(await apiFetch(`/api/companies/${companyId}`, { method: "DELETE" }));
};
