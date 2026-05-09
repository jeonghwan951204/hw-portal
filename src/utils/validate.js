export const normalizeDateRangeChange = ({ startDate, endDate, field, value }) => {
  if (field === "startDate") {
    return {
      startDate: value,
      endDate: endDate && value && endDate < value ? value : endDate,
    };
  }

  if (field === "endDate") {
    return {
      startDate,
      endDate: startDate && value && value < startDate ? startDate : value,
    };
  }

  return { startDate, endDate };
};

export const getDateRangeLimits = (startDate, endDate) => ({
  startMax: endDate || undefined,
  endMin: startDate || undefined,
});
