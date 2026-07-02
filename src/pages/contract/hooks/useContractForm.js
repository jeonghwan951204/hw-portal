import { useState } from "react";
import { getDateRangeLimits, normalizeDateRangeChange } from "../../../utils/validate";

const INITIAL_FORM = {
  name: "",
  company: "",
  type: "",
  status: "",
  startDate: "",
  endDate: "",
};

export const useContractForm = () => {
  const [form, setForm] = useState(INITIAL_FORM);

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePeriodChange = (field, value) => {
    const nextRange = normalizeDateRangeChange({
      startDate: form.startDate,
      endDate: form.endDate,
      field,
      value,
    });
    setForm((prev) => ({ ...prev, ...nextRange }));
  };

  const resetForm = () => setForm(INITIAL_FORM);

  return {
    form,
    periodLimits: getDateRangeLimits(form.startDate, form.endDate),
    handleFieldChange,
    handlePeriodChange,
    resetForm,
  };
};
