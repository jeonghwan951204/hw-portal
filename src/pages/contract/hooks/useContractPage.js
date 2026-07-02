import { useState } from "react";
import { MOCK_CONTRACTS } from "../constants";

export const useContractPage = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const filtered = MOCK_CONTRACTS.filter((c) => {
    const matchSearch =
      c.name.includes(search) || c.customer.includes(search);
    const matchStatus =
      statusFilter === "전체" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return {
    list: {
      search,
      setSearch,
      statusFilter,
      setStatusFilter,
      filtered,
    },
    createModal: {
      createModalOpen,
      setCreateModalOpen,
    },
  };
};
