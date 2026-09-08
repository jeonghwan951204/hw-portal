import { apiFetch } from "../../../utils/api";

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
  label: phone.label ?? "",
  value: phone.phoneNumber ?? "",
});

const mapCompanyListItem = (company) => ({
  id: company.companyId,
  name: company.companyName ?? "",
  businessNumber: company.businessRegistrationNumber ?? "",
  phoneNumbers: (company.phoneNumbers ?? []).map(mapPhoneNumber),
  bankAccounts: company.bankAccounts ?? [],
});

const mapCompanyDetail = (company) => ({
  id: company.companyId,
  type: company.type,
  name: company.companyName ?? "",
  representative: company.representativeName ?? "",
  businessNumber: company.businessRegistrationNumber ?? "",
  aliases: company.aliases ?? [],
  bankAccounts: company.bankAccounts ?? [],
  phoneNumbers: (company.phoneNumbers ?? []).map(mapPhoneNumber),
  emails: (company.emails ?? []).map((email) => ({
    label: email.label ?? "",
    value: email.email ?? "",
    listVisible: email.listVisible ?? false,
  })),
  addresses: (company.addresses ?? []).map((address) => ({
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

const createCompanyBody = (form, fileIds) => ({
  type: form.type,
  companyName: form.name.trim(),
  aliases: form.aliases.map((alias) => nonEmpty(alias.value)).filter(Boolean),
  representativeName: nonEmpty(form.representative) || null,
  businessRegistrationNumber: nonEmpty(form.businessNumber) || null,
  bankAccounts: form.bankAccounts
    .filter((account) => nonEmpty(account.bankName) || nonEmpty(account.accountNumber))
    .map((account) => ({
      label: nonEmpty(account.label),
      bankName: nonEmpty(account.bankName),
      accountNumber: nonEmpty(account.accountNumber),
    })),
  contacts: form.phoneNumbers
    .filter((phone) => nonEmpty(phone.value))
    .map((phone) => ({
      label: nonEmpty(phone.label),
      phoneNumber: nonEmpty(phone.value),
      listVisible: true,
    })),
  emails: form.emails
    .filter((email) => nonEmpty(email.value))
    .map((email) => ({
      label: nonEmpty(email.label),
      email: nonEmpty(email.value),
      listVisible: true,
    })),
  addresses: form.addresses
    .filter((address) => nonEmpty(address.value))
    .map((address) => ({
      label: nonEmpty(address.label),
      address: nonEmpty(address.value),
    })),
  memo: nonEmpty(form.memo) || null,
  fileIds,
});

export const fetchCompanyDetail = async (companyId) =>
  mapCompanyDetail(await asJson(await apiFetch(`/api/companies/${companyId}`)));

export const fetchCompanies = async () => {
  const list = await asJson(await apiFetch("/api/companies"));
  return Promise.all(
    list.map(async (item) => {
      const summary = mapCompanyListItem(item);
      try {
        return await fetchCompanyDetail(summary.id);
      } catch {
        return summary;
      }
    })
  );
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
  const fileIds = await resolveFileIds(form.attachments);
  return asJson(
    await apiFetch(`/api/companies/${companyId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createCompanyBody(form, fileIds)),
    })
  );
};

export const deleteCompany = async (companyId) =>
  asJson(await apiFetch(`/api/companies/${companyId}`, { method: "DELETE" }));
